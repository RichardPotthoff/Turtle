	
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

function drawSelectedOutline(key) {
//	const canvas = document.getElementById('canvas1');
    const canvas = canvas1;
    const ctx = canvas.getContext('2d');
	ctx.reset();
	ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.translate(canvas.width/2,canvas.height/2);
	ctx.scale(1,1);
//	debugLog("target value= "+e.target.value);
//	debugLog("outlines[e.target.value]= "+outlines[e.target.value]);
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
	console.log("Downloading Outlines")
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

function downloadApplication() {
	const link = document.createElement('a');
        link.href = "/Turtle/output.html";
        link.download = "Turtle.html";
        link.click();
};

//debugLog(outlineSelector);
//document.addEventListener("DOMContentLoaded", initDocument);

import {OutputText,Canvas,Tab,VBox,HBox,FloatSlider,Button,Grid,FileInput,Dropdown} from './HTML-widgets.js';
function createTabbedInterface() {
    let mainContainer = document.getElementById('tabsContainer');
    window.logElement=OutputText();
	window.canvas1=Canvas({width:400,height:400} );
	window.downloadBtn=Button('Download Outlines',downloadOutlines);
	window.downloadAppBtn=Button('Download Application',downloadApplication);
    window.uploadOutlinesFile=FileInput({accept:'*.json', onChange:readSingleFile});
	window.outlineSelector=Dropdown([],drawSelectedOutline);
    let tabs = Tab([
        {
            title: 'Design',
            content: VBox([
                HBox([
                    FloatSlider({ min: 0, max: 10, value: 5, orientation: 'vertical' }),
					Button('Download G-Code', () => console.log('G-Code download initiated'))
                ]),
                // Add more design elements
            ])
        },
        {
            title: 'Preview',
            content: Grid([canvas1,VBox([downloadBtn, uploadOutlinesFile, downloadAppBtn,window.outlineSelector])])//document.createElement('div') // Placeholder for preview content
        },
        {
            title: 'log',
            content: window.logElement // Placeholder for G-Code content
        }
    ]);
    window.tabs=tabs;
    mainContainer.appendChild(tabs);
}

document.addEventListener('DOMContentLoaded',()=>{
	createTabbedInterface();
	tabs.showTab(1);
	window.logElement.appendText("This is some output text.");
	canvas1.onDraw();
	updateOutlineSelector();
});