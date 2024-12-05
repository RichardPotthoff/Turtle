import {debugLog} from "./logging.js";
import {plot_segments,SegmentsLengthArea,TurtlePathLengthArea} from './turtle.js';
import {cookiecutters} from './outline-data.js';
import {stringifyFormatted} from "./json_utils.js";
let {outlines, brickworks}=JSON.parse(JSON.stringify(cookiecutters));
let cookieCutterArea=2000;

function updateOutlineSelector(){
// Update options when needed
	Object.entries(outlines).forEach(([k2,v2]) => {
			v2["turtlePath"].forEach((x)=>{x[1]*=deg;});
	});
outlineSelector.updateOptions(Object.entries(outlines).map(([k2, v2]) => ({
    text: k2,
    value: k2
})));
//    const event = new Event ( 'change', { bubbles: true });
//outlineSelector.dispatchEvent(event);
};



function readSingleFile(e) {
  var file = e.target.files[0];
  debugLog("file= "+file)
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var contents = e.target.result;
	let decodedContents=JSON.parse(contents);//jsyaml.load(contents);
	outlines=decodedContents["outlines"];
	updateOutlineSelector();
	
	brickworks=decodedContents["brickworks"];
//	document.getElementById('downloadBtn').disabled=false;
};
  reader.readAsText(file);
}
function displayContents(contents) {
  var element = document.getElementById('file-content');
  element.textContent = contents;
}

function drawSelectedOutline(e) {
//	const canvas = document.getElementById('canvas1');
//    const canvas = canvas1;
    const ctx = canvas.getContext('2d');
	ctx.reset();
	ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.translate(canvas.width/2,canvas.height/2);
	ctx.scale(1,1);
// 	debugLog("target value= "+e.value);
//	debugLog("outlines[e.target.value]= "+outlines[e.target.value]);
    let key=e.target.value;
    if (key===undefined) key="Duck";
	let [l,a,,,centroid]=TurtlePathLengthArea(outlines[key]["turtlePath"]);
	let scale=Math.sqrt(cookieCutterArea/a);
	debugLog("key= "+key+", l= "+l+", a= "+a+", scale= "+scale);
	let a0=[1,0];
	let p0=[-centroid[0]*scale*5,-centroid[1]*scale*5];
    plot_segments(ctx,{segs:outlines[key]["turtlePath"],p0:p0,a0:a0,scale:scale*5});
	plot_segments(ctx,{segs:outlines[key]["turtlePath"],p0:p0,a0:a0,offs:3,scale:scale*5});
//	plot_segments(ctx,{segs:outlines[key]["turtlePath"],p0:p0,a0:a0,offs:-3,scale:scale*5});
}

// Event listener for the download button
function downloadOutlines() {
    if (outlines && brickworks) {
		const outlinesCopy={};
	    for (let key in outlines){
			  let outline={};
			  outlinesCopy[key]=outline;
		    let valueArrayCopy=[... outlines[key]["turtlePath"]];
		    outlinesCopy[key]["turtlePath"]=valueArrayCopy;
		    valueArrayCopy.forEach(([l,angRad],i,arr) => {
			    arr[i]=[l,Math.round(angRad*rad2deg*1000)/1000];
			});		    
		};
		const content='{\n"outlines":'+stringifyFormatted(outlinesCopy,2,3)+', \n"brickworks":'+
		      stringifyFormatted(brickworks, 2,2)+"\n}";
	    const blob = new Blob([content], { type:'text/json'});
	    const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'cookie-cutters_downloaded.json';
        link.click();

        // Clean up to avoid memory leaks
        URL.revokeObjectURL(link.href);
        // Disable the button after download
//        this.disabled = true;
    }
};

import {OutputText,Canvas,Tab,VBox,HBox,FloatSlider,Button,Grid, FileInput,  Dropdown} from './HTML-widgets.js';

const canvas=Canvas({width:500,height:500} );
const downloadBtn=Button('Download Outlines',downloadOutlines);
const uploadOutlinesFile=FileInput({accept:"application/json", onChange:readSingleFile});
const outlineSelector=Dropdown(['Duck'],drawSelectedOutline);
updateOutlineSelector();
const controls=VBox([downloadBtn, uploadOutlinesFile,
			     outlineSelector],{style:{width:'300px', maxwidth:'300px',border:"2px solid red"}})


function createPaneContent({landscape=true}){
	return landscape ? HBox([controls,canvas]) : VBox([canvas,controls])
}

export function createPane({landscape=true}){
    return {title: 'Preview',content:createPaneContent({landscape:landscape})}
}