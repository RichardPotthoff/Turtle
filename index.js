	

function downloadApplication() {
	const link = document.createElement('a');
        link.href = "/Turtle/output.html";
        link.download = "Turtle.html";
        link.click();
};
import {debugLog} from "./logging.js";
import {OutputText,Button,FloatSlider,VBox,HBox} from './HTML-widgets.js';
const downloadAppBtn=Button('Download Application',downloadApplication);

//debugLog(outlineSelector);
//document.addEventListener("DOMContentLoaded", initDocument);


function createPane1({landscape=true}){
    return landscape ?	{
            title: 'App',
            content: VBox([
                HBox([
                    FloatSlider({ min: 0, max: 10, value: 5, orientation: 'vertical' }),
					downloadAppBtn
                ]),
                // Add more design elements
            ])
        }
	    :	{
            title: 'Design',
            content: HBox([
                VBox ([
                    FloatSlider({ min: 0, max: 10, value: 5, orientation: 'vertical' }),
					Button('Download G-Code', () => console.log('G-Code download initiated'))
                ]),
                // Add more design elements
            ])
        }
}

import {createPane as createPane2} from './cookiecutter.js';
window.logElement=OutputText();
function createPane3({landscape=true}){
       return landscape ? {
            title: 'log',
            content: logElement // Placeholder for G-Code content
        }
	    : {
            title: 'log',
            content: logElement // Placeholder for G-Code content
	}

}
import {Tab} from './HTML-widgets.js';

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