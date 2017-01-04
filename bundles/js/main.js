// global variables
var content = "<div></div>"
var cube;
var renderer;
var scene;
var camera;
var control;

//water globals
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
var hash = document.location.hash.substr( 1 );
if ( hash ) hash = parseInt( hash, 0 );
// Texture width for simulation
var WIDTH = hash || 128;
var NUM_TEXELS = WIDTH * WIDTH;
// Water size in system units
var BOUNDS = window.innerWidth;
var BOUNDS_HALF = BOUNDS * 0.5;
var container, stats;
var watercamera, waterscene, waterrenderer;
var mouseMoved = false;
var mouseCoords = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var waterMesh;
var meshRay;
var gpuCompute;
var heightmapVariable;
var waterUniforms;
var smoothShader;
var simplex = new SimplexNoise();
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

function change(n) {
				location.hash = n;
				location.reload();
				return false;
			}

function initWater() {
	var materialColor = Math.random() * 0xffffff 
	var geometry = new THREE.PlaneBufferGeometry( BOUNDS, BOUNDS, WIDTH - 1, WIDTH -1 );
	// material: make a ShaderMaterial clone of MeshPhongMaterial, with customized vertex shader
	var material = new THREE.ShaderMaterial( {
		uniforms: THREE.UniformsUtils.merge( [
			THREE.ShaderLib[ 'phong' ].uniforms,
			{
				heightmap: { value: null }
			}
		] ),
		vertexShader: document.getElementById( 'waterVertexShader' ).textContent,
		fragmentShader: THREE.ShaderChunk[ 'meshphong_frag' ]
	} );
	material.lights = true;
	// Material attributes from MeshPhongMaterial
	material.color = new THREE.Color( materialColor );
	material.specular = new THREE.Color( Math.random() * 0xffffff );
	material.shininess = 500;
	// Sets the uniforms with the material values
	material.uniforms.diffuse.value = new THREE.Color( Math.random() * 0xffffff );
	material.uniforms.specular.value = new THREE.Color( Math.random() * 0xffffff );
	material.uniforms.shininess.value = Math.max( material.shininess, 1e-4 );
	material.uniforms.opacity.value = material.opacity;
	// Defines
	material.defines.WIDTH = WIDTH.toFixed( 1 );
	material.defines.BOUNDS = BOUNDS.toFixed( 1 );
	waterUniforms = material.uniforms;
	waterMesh = new THREE.Mesh( geometry, material );
	waterMesh.rotation.x = - Math.PI / 2;
	waterMesh.matrixAutoUpdate = false;
	waterMesh.updateMatrix();
	waterscene.add( waterMesh );
	// Mesh just for mouse raycasting
	var geometryRay = new THREE.PlaneBufferGeometry( BOUNDS, BOUNDS, 1, 1 );
	meshRay = new THREE.Mesh( geometryRay, new THREE.MeshBasicMaterial( { color: 0xFFFFFF, visible: false } ) );
	meshRay.rotation.x = - Math.PI / 2;
	meshRay.matrixAutoUpdate = false;
	meshRay.updateMatrix();
	waterscene.add( meshRay );
	// Creates the gpu computation class and sets it up
	gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, waterrenderer );
	var heightmap0 = gpuCompute.createTexture();
	fillTexture( heightmap0 );
	heightmapVariable = gpuCompute.addVariable( "heightmap", document.getElementById( 'heightmapFragmentShader' ).textContent, heightmap0 );
	gpuCompute.setVariableDependencies( heightmapVariable, [ heightmapVariable ] );
	heightmapVariable.material.uniforms.mousePos = { value: new THREE.Vector2( 10000, 10000 ) };
	heightmapVariable.material.uniforms.mouseSize = { value: 20.0 };
	heightmapVariable.material.uniforms.viscosityConstant = { value: 0.03 };
	heightmapVariable.material.defines.BOUNDS = BOUNDS.toFixed( 1 );
	var error = gpuCompute.init();
	if ( error !== null ) {
	    console.error( error );
	}
	// Create compute shader to smooth the water surface and velocity
	smoothShader = gpuCompute.createShaderMaterial( document.getElementById( 'smoothFragmentShader' ).textContent, { texture: { value: null } } );
	}

function fillTexture( texture ) {
	var waterMaxHeight = 10;
	function noise( x, y, z ) {
		var multR = waterMaxHeight;
		var mult = 0.025;
		var r = 0;
		for ( var i = 0; i < 15; i++ ) {
			r += multR * simplex.noise3d( x * mult, y * mult, z * mult );
			multR *= 0.53 + 0.025 * i;
			mult *= 1.25;
		}
		return r;
	}
	var pixels = texture.image.data;
	var p = 0;
	for ( var j = 0; j < WIDTH; j++ ) {
		for ( var i = 0; i < WIDTH; i++ ) {
			var x = i * 128 / WIDTH;
			var y = j * 128 / WIDTH;
		        pixels[ p + 0 ] = noise( x, y, 123.4 );
			pixels[ p + 1 ] = 0;
			pixels[ p + 2 ] = 0;
			pixels[ p + 3 ] = 1;
			p += 4;
		}
	}
}

function smoothWater() {
	var currentRenderTarget = gpuCompute.getCurrentRenderTarget( heightmapVariable );
	var alternateRenderTarget = gpuCompute.getAlternateRenderTarget( heightmapVariable );
	for ( var i = 0; i < 10; i++ ) {
		smoothShader.uniforms.texture.value = currentRenderTarget.texture;
		gpuCompute.doRenderTarget( smoothShader, alternateRenderTarget );
		smoothShader.uniforms.texture.value = alternateRenderTarget.texture;
		gpuCompute.doRenderTarget( smoothShader, currentRenderTarget );
	}
	
}

function onWindowResize() {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	waterrenderer.setSize( window.innerWidth, window.innerHeight );
}

function setMouseCoords( x, y ) {
	mouseCoords.set( ( x / window.innerWidth ) * 2 - 1, -( y / window.innerHeight ) * 2 + 1);
	mouseMoved = true;
}

function onDocumentMouseMove( event ) {
	setMouseCoords( event.clientX, event.clientY );
}

function onDocumentTouchStart( event ) {
	if ( event.touches.length === 1 ) {
		event.preventDefault();
		setMouseCoords( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
	}
}

function onDocumentTouchMove( event ) {
	if ( event.touches.length === 1 ) {
		event.preventDefault();
		setMouseCoords( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
	}
}

function wateranimate() {
	waterrender();
}


function init() {
	// cube
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(45,
	window.innerWidth / window.innerHeight, 0.1, 1000);
	control = new function() {
		this.rotationSpeed = 0.005;
	};
	renderer = new THREE.CSS3DRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.autoClear = false;
	renderer.domElement.style.position = "absolute";
	document.body.appendChild(renderer.domElement);
	camera.position.set(2000, 0, 0)
	camera.lookAt(scene.position);
	createCSS3DObject(content);

	//water
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	watercamera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 3000 );
	watercamera.rotation.x = toRadian(-90)
	watercamera.position.set( 0, 400, 30);
	waterscene = new THREE.Scene();
	var sun = new THREE.DirectionalLight( Math.random() * 0xffffff , 1.0 );
	sun.position.set( 300, 400, 175 );
	waterscene.add( sun );
	var sun2 = new THREE.DirectionalLight( Math.random() * 0xffffff , 0.6 );
	sun2.position.set( -100, 350, -200 );
	waterscene.add( sun2 );
	waterrenderer = new THREE.WebGLRenderer();
	waterrenderer.setClearColor( 0x000000 );
	waterrenderer.setPixelRatio( window.devicePixelRatio );
	waterrenderer.setSize( window.innerWidth, window.innerHeight );
	waterrenderer.domElement.style.zIndex = 5;
	waterrenderer.autoClear = false;
	container.appendChild( waterrenderer.domElement );
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	document.addEventListener( 'touchmove', onDocumentTouchMove, false );
	window.addEventListener( 'resize', onWindowResize, false );
	initWater();
	render();
}

function moveUp() {
	cube.rotation.z += toRadian(-90)
}

function moveDown() {
	cube.rotation.z += toRadian(90)
}

function moveLeft() {
	cube.rotation.y += toRadian(90)
}

function moveRight() {
	cube.rotation.y += toRadian(-90)
}

function turnRight() {
	cube.rotation.x += toRadian(-90)
}

function turnLeft() {
	cube.rotation.x += toRadian(90)
}

function createCSS3DObject(content) {
	// info
	info = document.createElement( 'div' );
	info.style.position = 'absolute';
	info.style.top = '30px';
	info.style.right = '30px';
	info.style.width = '100%';
	info.style.textAlign = 'right';
	info.style.color = Math.random() * 0xffffff
	info.style.fontWeight = 'bold';
	info.style.backgroundColor = Math.random() * 0xffffff
	info.style.zIndex = '1';
	info.innerHTML = '<p>use the control panel to move the cube or click and drag</p><h3 onClick="moveLeft()" onTouchEnd="moveLeft()"><-</h3><h3 onClick="moveRight()" onTouchEnd="moveRight()">-></h3><h3 onClick="moveDown()" onTouchEnd="moveDown()">v</h3><h3 onClick="moveUp()" onTouchEnd="moveUp()">^</h3><h3 onClick="turnRight()" onTouchEnd="turnRight()">turn right</h3><h3 onClick="turnLeft() "onTouchEnd="turnLeft()">turn left</h3>';
	document.body.appendChild( info );

	// convert the string to dome elements
	var wrapper = document.createElement('div');
	wrapper.innerHTML = content;
	var div = wrapper.firstChild;
	// set some values on the div to style it.
	// normally you do this directly in HTML and
	// CSS files.
	div.style.width = '200px';
	div.style.height = '200px';
	div.style.opacity = 0.5;
	div.style.background = new THREE.Color(Math.random()
	* 0xffffff).getStyle();
	div.style.position = 'absolute';

	// controls - need to remove mouse
	controls = new THREE.TrackballControls(camera, renderer.domElement);

	// params
	var r = Math.PI / 2;
	var d = 200;
	var pos = [ [ d, 0, 0 ], [ -d, 0, 0 ], [ 0, d, 0 ], [ 0, -d, 0 ], [ 0, 0, d ], [ 0, 0, -d ] ];
	var rot = [ [ 0, r, 0 ], [ 0, -r, 0 ], [ -r, 0, 0 ], [ r, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ] ];

	// cube
	cube = new THREE.Object3D();
	scene.add( cube );
	cube.name = 'cube'

	// sides
	for ( var i = 0; i < 6; i ++ ) {

		var element = document.createElement( 'div' );
		element.setAttribute("id", "page" + i)
		element.innerHTML = i
		element.style.width = '400px';
		element.style.height = '400px';
		element.style.background = new THREE.Color( Math.random() * 0xffffff ).getStyle();
		element.style.opacity = '1';

		var object = new THREE.CSS3DObject( element );
		object.position.fromArray( pos[ i ] );
		object.rotation.fromArray( rot[ i ] );
		cube.add( object );

	}

}

function waterrender() {
	var uniforms = heightmapVariable.material.uniforms;
	if ( mouseMoved ) {
		this.raycaster.setFromCamera( mouseCoords, watercamera );
		var intersects = this.raycaster.intersectObject( meshRay );
		if ( intersects.length > 0 ) {
		    var point = intersects[ 0 ].point;
		    uniforms.mousePos.value.set( point.x, point.z );
		}
		else {
		    uniforms.mousePos.value.set( 10000, 10000 );
		}
		mouseMoved = false;
	}
	else {
		uniforms.mousePos.value.set( 10000, 10000 );
	}
	// Do the gpu computation
	gpuCompute.compute();
	// Get compute output in custom uniform
	waterUniforms.heightmap.value = gpuCompute.getCurrentRenderTarget( heightmapVariable ).texture;
	// Render
	waterrenderer.render( waterscene, watercamera );
}

function toRadian(degrees) {
	let radians = degrees * (Math.PI/180)
	return radians
}

function render() {
	requestAnimationFrame( wateranimate );
	requestAnimationFrame(render);
	renderer.render(scene, camera);
	controls.update();
	}

init();