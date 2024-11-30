	
import {plot_segments,SegmentsLengthArea,TurtlePathLengthArea} from './turtle.js';
import {cookiecutters} from './outline-data.js';
let {outlines, brickworks}=JSON.parse(JSON.stringify(cookiecutters));
let cookieCutterArea=2000;

function updateOutlineSelector(){
	while(outlineSelector.options.length) outlineSelector.options.remove(0);
	Object.entries(outlines).forEach(([k2,v2]) => {
			v2["turtlePath"].forEach((x)=>{x[1]*=deg;});
			var el = document.createElement("option");
			el.textContent=k2;
			el.value=k2;
			outlineSelector.appendChild(el);
		});
    const event = new Event ( 'change', { bubbles: true });
	outlineSelector.dispatchEvent(event);
};

function readSingleFile(e) {
  var file = e.target.files[0];
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
	document.getElementById('downloadBtn').disabled=false;
};
  reader.readAsText(file);
}

function displayContents(contents) {
  var element = document.getElementById('file-content');
  element.textContent = contents;
}

function drawSelectedOutline(e) {
	const canvas = document.getElementById('arcCanvas');
    const ctx = canvas.getContext('2d');
	ctx.reset();
	ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.translate(canvas.width/2,canvas.height/2);
	ctx.scale(1,1);
//	debugLog("target value= "+e.target.value);
//	debugLog("outlines[e.target.value]= "+outlines[e.target.value]);
    let key;
	try {
		key=e.target.value;
	} catch (e) {}
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

document.getElementById('file-input')
  .addEventListener('change', readSingleFile, false);

var outlineSelector;

function initDocument(){
	outlineSelector=document.getElementById('outline-selector');
	outlineSelector.addEventListener('change', drawSelectedOutline, false);
	updateOutlineSelector();
}

// Event listener for the download button
document.getElementById('downloadBtn').addEventListener('click', function() {
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
});

document.getElementById('downloadAppBtn').addEventListener('click', function() {
	const link = document.createElement('a');
        link.href = "/Turtle/output.html";
        link.download = "Turtle.html";
        link.click();
    
});
//debugLog(outlineSelector);
document.addEventListener("DOMContentLoaded", initDocument);
