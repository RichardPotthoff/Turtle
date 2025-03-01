//import {debugLog} from "./logging.js";
import {plot_segments,SegmentsLengthArea,TurtlePathLengthArea} from './turtle-graphics.js';
import {cookiecutters} from './outline-data.js';
import {stringifyFormatted} from "./json_utils.js";
//make a copy of the outlines so we can convert degrees to radians
let outlines=JSON.parse(JSON.stringify(cookiecutters.outlines));
let cookieCutterArea=2000;

function updateOutlineSelector(){
// Update options when needed
	Object.entries(outlines).forEach(([k2,v2]) => {
		    v2.startAngle=v2.startAngle!==undefined?v2.startAngle*deg:0.0
			v2.turtlePath.forEach((x)=>{x[1]*=deg;});
	});
outlineSelector.updateOptions(Object.entries(outlines).map(([k2, v2]) => ({
    text: k2,
    value: k2
})));
};



function readSingleFile(e) {
  var file = e.target.files[0];
  console.log("file= "+file)
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
	ctx.scale(5,-5);
// 	debugLog("target value= "+e.value);
//	debugLog("outlines[e.target.value]= "+outlines[e.target.value]);
    let key=e.target.value;
    if (key===undefined) return;
	let {turtlePath,startAngle}=outlines[key];
	let a0=[Math.cos(startAngle),Math.sin(startAngle)];
	let [l,a,,,centroid]=TurtlePathLengthArea(turtlePath,startAngle);
	let scale=Math.sqrt(cookieCutterArea/Math.abs(a));
	console.log("key= "+key+", l= "+l+", a= "+a+", scale= "+scale);
	let offset=[0,0];//[0,18]
	//scale=scale*0.65;
	let p0=[-centroid[0]*scale-offset[0],-centroid[1]*scale-offset[1]];
	ctx.strokeStyle='blue';
    plot_segments(ctx,{segs:outlines[key]["turtlePath"],p0:p0,a0:a0,scale:scale});
//	plot_segments(ctx,{segs:outlines[key]["turtlePath"],p0:p0,a0:a0,offs:3,scale:scale*5});
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

import {OutputText,Canvas,Tab,Box,VBox,HBox,FloatSlider,Button, FileInput,  Dropdown} from './HTML-widgets.js';

const canvas=Canvas({width:500,height:500});
const downloadBtn=Button('Download Outlines',downloadOutlines);
const uploadOutlinesFile=FileInput({accept:"application/json", onChange:readSingleFile});
const outlineSelector=Dropdown([],drawSelectedOutline);
updateOutlineSelector();

const canvasContainer=Box([canvas]);
const controls=VBox([downloadBtn, uploadOutlinesFile,
			     outlineSelector],{style:{width:'300px', maxwidth:'300px',border:"2px solid red"}});
				 
export const title="cookie-cutter";

export function createPaneContent({landscape=true}){
	if (landscape){
		return HBox([controls,canvasContainer]);
	}
	else{
		return VBox([canvasContainer,controls]);
	}
}

const myDefault={title:title,content:createPaneContent};

export default myDefault;
