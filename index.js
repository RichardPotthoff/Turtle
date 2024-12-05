	
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
  console.log(e)
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

import {OutputText,Canvas,Tab,VBox,HBox,FloatSlider,Button,Grid, FileInput,  Dropdown} from './HTML-widgets.js';
const logElement=OutputText();
const canvas=Canvas({width:500,height:500} );
const downloadBtn=Button('Download Outlines',downloadOutlines);
const downloadAppBtn=Button('Download Application',downloadApplication);
const uploadOutlinesFile=FileInput({accept:"application/json", onChange:readSingleFile});
const outlineSelector=Dropdown(['Duck'],drawSelectedOutline);

function createPane1({landscape=true}){
    if (landscape) return	{
            title: 'Design',
            content: VBox([
                HBox([
                    FloatSlider({ min: 0, max: 10, value: 5, orientation: 'vertical' }),
					Button('Download G-Code', () => console.log('G-Code download initiated'))
                ]),
                // Add more design elements
            ])
        }
	else return	{
            title: 'Design',
            content: VBox([
                HBox([
                    FloatSlider({ min: 0, max: 10, value: 5, orientation: 'vertical' }),
					Button('Download G-Code', () => console.log('G-Code download initiated'))
                ]),
                // Add more design elements
            ])
        }
}
function createPane2({landscape=true}){
    if (landscape) return {
            title: 'Preview',
            content: Grid([canvas,VBox([downloadBtn, uploadOutlinesFile,
			  downloadAppBtn,outlineSelector],{style:{width:'300px', maxwidth:'300px',border:"2px solid red"}})],{controlsRight:false})//document.createElement('div') // Placeholder for preview content
        }
    else return {
            title: 'Preview',
            content: Grid([canvas,VBox([downloadBtn, uploadOutlinesFile,
			  downloadAppBtn,outlineSelector],{style:{width:'300px', maxwidth:'300px',border:"2px solid red"}})],{controlsRight:false})//document.createElement('div') // Placeholder for preview content
        }
}
function createPane3({landscape=true}){
	if (landscape) return {
            title: 'log',
            content: logElement // Placeholder for G-Code content
        }
	else return {
            title: 'log',
            content: logElement // Placeholder for G-Code content
	}

}

function createTabbedInterface(paneCreators, options={landscape:true}) {
    // Create tabs once
    const tabs = Tab(paneCreators.map((_, index) => ({
        title: paneCreators[index](options).title,
        content: paneCreators[index](options).content
    })));
    tabs.showTab(1); // Default to show the second tab (index 1)

    return {
        tabWidget: tabs,
        updateContent: (newOptions) => {
            paneCreators.forEach((paneCreator, index) => {
                const newContent = paneCreator(newOptions);
                tabs.updateTabContent(index, newContent.content);
            });
        }
    };
}

let tabs;

document.addEventListener('DOMContentLoaded',()=>{
    tabs = createTabbedInterface([createPane1, createPane2, createPane3], {landscape: window.innerHeight < window.innerWidth});
	
    document.getElementById('tabsContainer').appendChild(tabs.tabWidget);
    logElement.appendText("This is some output text.");
    updateOutlineSelector();
});


const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Usage in event listener
window.addEventListener('resize', debounce(function(event) {
    const isLandscape = window.innerHeight < window.innerWidth;
    tabs.updateContent({landscape: isLandscape});
}, 250));