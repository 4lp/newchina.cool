//background
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
var container;
var glcamera, glscene, glrenderer, particles, geometry, materials = [], parameters, i, h, color, sprite, size;
var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

// global variables
var content = "<div></div>"
var cube;
var renderer;
var scene;
var camera;
var control;
var envelopeDown
var envelopeFace
var parent
var messageObj

function toRadian(degrees) {
	let radians = degrees * (Math.PI/180)
	return radians
}

function toDegrees(radians) {
	let degrees = Math.round(radians / (Math.PI/180))
	return degrees
}

function onKeyDown(e) {
    e = e || window.event;
    //up
    if (e.keyCode == '38') {
        new TWEEN.Tween( cube.rotation ).to( {  z:  cube.rotation.z + toRadian(-90)}, 1000 ).easing( TWEEN.Easing.Quadratic.Out).start();
    }
    //down
    else if (e.keyCode == '40') {
        new TWEEN.Tween( cube.rotation ).to( {  z:  cube.rotation.z + toRadian(90)}, 1000 ).easing( TWEEN.Easing.Quadratic.Out).start();
    }
    //left
    else if (e.keyCode == '37') {
       new TWEEN.Tween( cube.rotation ).to( {  y:  cube.rotation.y + toRadian(90)}, 1000 ).easing( TWEEN.Easing.Quadratic.Out).start();
    }
    //right
    else if (e.keyCode == '39') {
      new TWEEN.Tween( cube.rotation ).to( {  y:  cube.rotation.y + toRadian(-90)}, 1000 ).easing( TWEEN.Easing.Quadratic.Out).start();
    }
}

function setEnvelopeState() {
	envelopeDown = !envelopeDown
}

function moveEnvelope() {
	if (envelopeDown === false) {
		let parentTween = new TWEEN.Tween( parent.rotation ).to( {  x:  parent.rotation.x + toRadian(180)}, 1000 ).easing( TWEEN.Easing.Quadratic.Out).start();
		new TWEEN.Tween( messageObj.position ).to( {  y:  messageObj.position.y - 350}, 1000 ).easing( TWEEN.Easing.Quadratic.Out).start();
		parentTween.delay(1000)
		parentTween.start()
	} else {
		new TWEEN.Tween( parent.rotation ).to( {  x:  parent.rotation.x + toRadian(-180)}, 1000 ).easing( TWEEN.Easing.Quadratic.Out).start();
		let messageTween = new TWEEN.Tween( messageObj.position ).to( {  y:  messageObj.position.y + 350}, 1000 ).easing( TWEEN.Easing.Quadratic.Out)
		messageTween.delay(1000)
		messageTween.start()
	}
}

function onWindowResize() {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseMove( event ) {
	mouseX = event.clientX - windowHalfX;
	mouseY = event.clientY - windowHalfY;
}

function onDocumentTouchStart( event ) {
	if ( event.touches.length === 1 ) {
		event.preventDefault();
		mouseX = event.touches[ 0 ].pageX - windowHalfX;
		mouseY = event.touches[ 0 ].pageY - windowHalfY;
	}
}

function onDocumentTouchMove( event ) {
	if ( event.touches.length === 1 ) {
		event.preventDefault();
		mouseX = event.touches[ 0 ].pageX - windowHalfX;
		mouseY = event.touches[ 0 ].pageY - windowHalfY;
	}
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
	camera.position.set(1200, 0, 0)
	camera.lookAt(scene.position);
	document.addEventListener( 'keydown', onKeyDown, false );
	createCSS3DObject(content);

	//background
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	glcamera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
	glcamera.position.z = 1000;
	glscene = new THREE.Scene();
	glscene.fog = new THREE.FogExp2( 0x000000, 0.0008 );
	glscene.background = new THREE.Color( 0x000000 );
	geometry = new THREE.Geometry();
	var textureLoader = new THREE.TextureLoader();
	sprite1 = textureLoader.load( "./mushroomemoji.png" );

	for ( i = 0; i < 100; i ++ ) {
		var vertex = new THREE.Vector3();
		vertex.x = Math.random() * 2500 - 1000;
		vertex.y = Math.random() * 2500 - 1000;
		vertex.z = Math.random() * 2000 - 1000;
		geometry.vertices.push( vertex );
	}
	parameters = [
		[ [1.0, 0.2, 0.5], sprite1, 20 ],
		[ [0.95, 0.1, 0.5], sprite1, 15 ],
		[ [0.90, 0.05, 0.5], sprite1, 10 ],
		[ [0.85, 0, 0.5], sprite1, 8 ],
		[ [0.80, 0, 0.5], sprite1, 5 ]
	];
	for ( i = 0; i < parameters.length; i ++ ) {
		color  = parameters[i][0];
		sprite = parameters[i][1];
		size   = parameters[i][2];
		materials[i] = new THREE.PointsMaterial( { size: size, map: sprite, blending: THREE.AdditiveBlending, depthTest: false, transparent : true } );
		materials[i].color.setHSL( color[0], color[1], color[2] );
		particles = new THREE.Points( geometry, materials[i] );
		particles.rotation.x = Math.random() * 6;
		particles.rotation.y = Math.random() * 6;
		particles.rotation.z = Math.random() * 6;
		glscene.add( particles );
	}
	glrenderer = new THREE.WebGLRenderer();
	glrenderer.setPixelRatio( window.devicePixelRatio );
	glrenderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( glrenderer.domElement );
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	document.addEventListener( 'touchmove', onDocumentTouchMove, false );
	window.addEventListener( 'resize', onWindowResize, false );

	render();
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
	info.innerHTML = '<p>click and drag or use your keyboard to move the cube</p>'
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
	div.style.background = new THREE.Color(Math.random() * 0xffffff).getStyle();
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

	//message
	let message = document.createElement('div')
	message.id = "message"
	message.style.width = '200px'
	message.style.height = '200px'
	message.style.background = new THREE.Color( Math.random() * 0xffffff ).getStyle();
	messageObj = new THREE.CSS3DObject(message)
	messageObj.position.z = 200
	cube.add(messageObj)

	//envelope body
	let envelopeup = document.createElement('div')
	envelopeup.id = "triangle-up"
	let envelopeUpFace = new THREE.CSS3DObject(envelopeup)
	envelopeUpFace.position.z = 200
	envelopeUpFace.position.y = -100
	cube.add(envelopeUpFace)

	let enveloperight = document.createElement('div')
	enveloperight.id = "triangle-right"
	let envelopeRightFace = new THREE.CSS3DObject(enveloperight)
	envelopeRightFace.position.z = 200
	envelopeRightFace.position.x = -100
	cube.add(envelopeRightFace)

	let envelopeleft = document.createElement('div')
	envelopeleft.id = "triangle-left"
	let envelopeLeftFace = new THREE.CSS3DObject(envelopeleft)
	envelopeLeftFace.position.z = 200
	envelopeLeftFace.position.x = 100
	cube.add(envelopeLeftFace)

	//envelope top
	let envelope = document.createElement('div')
	envelope.id = "triangle-down"
	envelope.onclick = function(e) {setEnvelopeState(), moveEnvelope()}
	envelopeFace = new THREE.CSS3DObject(envelope)
	parent = new THREE.Object3D();
	envelopeFace.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 100, 0 ) );
	parent.add(envelopeFace)
	parent.position.z = 200
	parent.position.y = 200
	envelopeFace.position.y = -100
	envelopeFace.rotation.x = toRadian(0)
	cube.add(parent)
}

function glrender() {
	var time = Date.now() * 0.00005;
	glcamera.position.x += ( mouseX - glcamera.position.x ) * 0.05;
	glcamera.position.y += ( - mouseY - glcamera.position.y ) * 0.05;
	camera.lookAt( glscene.position );
	for ( i = 0; i < glscene.children.length; i ++ ) {
		var object = glscene.children[ i ];
		if ( object instanceof THREE.Points ) {
			object.rotation.y = time * ( i < 4 ? i + 1 : - ( i + 1 ) );
		}
	}
	for ( i = 0; i < materials.length; i ++ ) {
		color = parameters[i][0];
		h = ( 360 * ( color[0] + time ) % 360 ) / 360;
		materials[i].color.setHSL( h, color[1], color[2] );
	}
	glrenderer.render( glscene, glcamera );
}

function render() {
	requestAnimationFrame(glrender)
	glrender()
	requestAnimationFrame(render);
	TWEEN.update();
	renderer.render(scene, camera);
	controls.update();
	}

init();