import React from "react"
import { render } from "react-dom"


class App extends React.Component {

	render(){
		return (
			<div id="page0">
				<h1 className="text-center">HELLO NEW CHINA</h1>
			</div>
		)
	}
}

class App2 extends React.Component {
	render(){
		return (
			<div id="page1">
				<iframe style={{border: "0", width: "100%", height: "400px"}} src="https://bandcamp.com/EmbeddedPlayer/album=2792818770/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/transparent=true/" seamless><a href="http://newchina.bandcamp.com/album/bar-grill">Bar &amp; Grill by New China</a></iframe>			
			</div>
		)
	}
}

class App3 extends React.Component {
	render(){
		return(
			<div id="page2">
				<div id="instafeed"></div>
			</div>
			)
	}
}
class App4 extends React.Component {
	render(){
		return(
			<div id="page3">
				<iframe style={{border: "0"}} width="400" height="400" src="https://www.youtube.com/embed/z6VMK1t3TuY?t=54s&disablekb=1" frameBorder="0" allowFullScreen></iframe>
			</div>
			)
	}
}
class App5 extends React.Component {
	render(){
		return(
			<div id="message">
				<p><a href="mailto:booking@newchina.cool">EMAIL US</a> at booking@newchina.cool</p>
			</div>
			)
	}
}
class App6 extends React.Component {
	render(){
		return(
			<div id="page5">
				<p>~ask the noochCube~</p>
			</div>
			)
	}
}

render(<App/>, document.getElementById("page0"))
render(<App2/>, document.getElementById("page1"))
render(<App3/>, document.getElementById("page2"))
render(<App4/>, document.getElementById("page3"))
render(<App5/>, document.getElementById("message"))
render(<App6/>, document.getElementById("page5"))