	

function downloadApplication() {
	const link = document.createElement('a');
        link.href = "/Turtle/output.html";
        link.download = "Turtle.html";
        link.click();
};
import {debugLog} from "./logging.js";
import {OutputText,Button,FloatSlider,Box,VBox,HBox} from './HTML-widgets.js';
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
console.log(pane2.content({landscape:true}));
window.logElement=OutputText();

function createPane3Content({landscape=true}){
       return logElement // Placeholder for G-Code content
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

let tabs;

document.addEventListener('DOMContentLoaded',()=>{
    tabs = createTabbedInterface([pane1, pane2, pane3], {landscape: window.innerHeight < window.innerWidth});
	
    document.getElementById('tabsContainer').appendChild(tabs.tabWidget);
//    logElement.appendText("This is some output text.");
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