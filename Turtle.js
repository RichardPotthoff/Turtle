import {OutputText} from './HTML-widgets.js';
const logElement=OutputText({id:"console-output"});
import "./logging.js";	

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text)
            .then(() => {
                console.log('Text copied to clipboard');
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
            });
    } else {
        // Fallback for browsers not supporting Clipboard API
        return new Promise((resolve, reject) => {
            const tempInput = document.createElement('textarea');
            tempInput.value = text;
            document.body.appendChild(tempInput);
            tempInput.select();
            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(tempInput);
                if (successful) {
                    resolve(console.log('Text copied to clipboard (fallback)'));
                } else {
                    reject(new Error('Copy command was unsuccessful'));
                }
            } catch (err) {
                document.body.removeChild(tempInput);
                reject(new Error('Unable to copy text'));
            }
        });
    }
}

function downloadApplication() {
	const link = document.createElement('a');
        link.href ="./Turtle.html";
        link.download = "Turtle.html";
        link.click();
};

import {Button,FloatSlider,Box,VBox,HBox} from './HTML-widgets.js';
const downloadAppBtn=Button('Download Application',downloadApplication);

//debugLog(outlineSelector);
//document.addEventListener("DOMContentLoaded", initDocument);


function createPane1Content({landscape=true}){
    return landscape ?	
	           VBox([
                   HBox([
                      FloatSlider({ min: 0, max: 10, value: 5, orientation: 'vertical' }),
					  downloadAppBtn
                   ]),
                // Add more design elements
               ])
	    :
            HBox([
                VBox ([
                    FloatSlider({ min: 0, max: 10, value: 5, orientation: 'vertical' }),
					Button('Download G-Code', () => console.log('G-Code download initiated'))
                ]),
                // Add more design elements
            ])
        
}
const pane1={title:"App",content:createPane1Content};

import pane2 from './cookiecutter.js';


const clearLogBtn=Button("Clear Log",()=>{logElement.innerHTML=''}, {style:{width:"150px"}})
const copyToClipboardBtn=Button("Copy to Clipboard",()=>{
  if (logElement) {
    copyToClipboard(logElement.innerText).then(() => {
        // Success
    }).catch(err => {
        // Error
        console.error(err);
    });
}
}, {style:{width:"150px"}});

const logPane=VBox([HBox([clearLogBtn,copyToClipboardBtn]),logElement]);
function createPane3Content({landscape=true}){
       return logPane; // Placeholder for G-Code content
}
const pane3={title:"log",content:createPane3Content};
import {Tab} from './HTML-widgets.js';

function createTabbedInterface(paneCreators, options={landscape:true}) {
    // Create tabs once
    const tabs = Tab(paneCreators.map((_, index) => ({
        title: paneCreators[index].title,
        content: paneCreators[index].content(options)
    })));
    tabs.showTab(1); // Default to show the second tab (index 1)

    return {
        tabWidget: tabs,
        updateContent: (newOptions) => {
            paneCreators.forEach((paneCreator, index) => {
                const newContent = paneCreator.content(newOptions);
                tabs.updateTabContent(index, newContent);
            });
        }
    };
}

function listAllProperties(obj) {
    const props = Object.getOwnPropertyNames(obj);
    const symbols = Object.getOwnPropertySymbols(obj);
    const allProps = [...props, ...symbols];
    console.log("allProps",allProps);
    allProps.forEach(prop => {
        let descriptor = Object.getOwnPropertyDescriptor(obj, prop);
        console.log(
            prop,
            "-",
            typeof obj[prop] === 'function' ? 'method' :
            typeof obj[prop] === 'object' ? 'object' :
            typeof obj[prop]
        );
        console.log("    Enumerable:", descriptor.enumerable);
        console.log("    Writable:", descriptor.writable);
        console.log("    Configurable:", descriptor.configurable);
        if (descriptor.get || descriptor.set) {
            console.log("    Getter:", !!descriptor.get);
            console.log("    Setter:", !!descriptor.set);
        }
    });
}
function logNavigatorDetails() {
	for (let prop in navigator) {
	    if (navigator.hasOwnProperty(prop)) {
	        let descriptor = Object.getOwnPropertyDescriptor(navigator, prop);
	        let value = navigator[prop];
	        
	        // Stringify objects for display, but be aware this might not handle circular references well
	        let displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
	
	        // If the property is a function, we might want to just indicate it's a function rather than stringify it
	        if (typeof value === 'function') {
	            displayValue = "Function";
	        }
	        
	        console.log(`${prop} - Type: ${typeof value}, Value: ${displayValue}`, descriptor.enumerable ? "(enumerable)" : "(non-enumerable)");
	    } else {
	        // This property is inherited
	        console.log(`${prop} - Type: ${typeof navigator[prop]}, Value: ${navigator[prop]} (inherited)`);
	    }
	}
}



let tabs;

document.addEventListener('DOMContentLoaded',()=>{
    tabs = createTabbedInterface([pane1, pane2, pane3], {landscape: window.innerHeight < window.innerWidth});
    document.getElementById('tabsContainer').appendChild(tabs.tabWidget);
//    logElement.appendText("This is some output text.");
    logNavigatorDetails();
   
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
	console.log('resize event triggered: landscape='+isLandscape)
}, 250));