// Generic function to create a box with customizable options
function createBox(className, children, options = {}) {
    let box = document.createElement('div');
    box.className = className;

    // Apply options to the box
    if (options.attributes) {
        for (let [key, value] of Object.entries(options.attributes)) {
            box.setAttribute(key, value);
        }
    }
    if (options.style) {
        Object.assign(box.style, options.style);
    }
    if (options.childrenOptions) {
        children.forEach((child, index) => {
            if (options.childrenOptions[index]) {
                // Here you would need a recursive function or another way to apply options to children
                Object.assign(child, options.childrenOptions[index]);
            }
        });
    }

    // Append children
    children.forEach(child => {
        box.appendChild(child);
    });

    return box;
}

// VBox specific function
export function VBox(children, options = {}) {
    return createBox('vbox', children, options);
}

// HBox specific function
export function HBox(children, options = {}) {
    return createBox('hbox', children, options);
}

export function Grid(children, options = {}) {
    let div = document.createElement('div');
    div.className = 'grid-container';
    
    if (options.controlsRight === false) {
        div.dataset.controlsPosition = 'left';
    }
    
    children.forEach((child, index) => {
        let childDiv = document.createElement('div');
        childDiv.appendChild(child);
        if (index === 0) {
            childDiv.className = 'canvas-area';
            childDiv.style.gridArea = 'canvas';
        } else {
            childDiv.className = 'controls-area';
            childDiv.style.gridArea = 'controls';
        }
        div.appendChild(childDiv);
    });

    function adjustLayout() {
        if (window.innerHeight > window.innerWidth) {
            const canvas = div.querySelector('.canvas-area');
            if (canvas) {
                canvas.style.height = 'auto';
            }
            const controls = div.querySelector('.controls-area');
            if (controls) {
                controls.style.height = 'auto';
            }
        } else {
            // Landscape mode adjustments
        }
    }

    // Add event listener and initial call
    window.addEventListener('resize', adjustLayout);
    adjustLayout(); // Call once to set initial layout

    return div;
}

export function FloatSlider(options = {}) {
    let input = document.createElement('input');
    input.type = 'range';
    input.className = options.orientation === 'vertical' ? 'slider-vertical' : 'slider';
    input.min = options.min || 0;
    input.max = options.max || 100;
    input.value = options.value || 50;
    input.step = options.step || 1;

    // Add event listener for value change
	if (options.onChange){
      input.addEventListener('input',option.onChange);
    };

    return input;
}

export function Button(description, onClick) {
    let button = document.createElement('button');
    button.textContent = description;
    button.className = 'button-style'; // Add this line to apply the CSS class
    button.addEventListener('click', onClick);
    return button;
}

export function FileInput({accept = '*', multiple = false, onChange, dataset = {}}) {
    let fileInputContainer = document.createElement('div');
    fileInputContainer.className = 'custom-file-input';

    let fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = accept;
    fileInput.multiple = multiple;
    fileInput.style.display = 'none';
    
    // Apply dataset properties
    for (let key in dataset) {
        fileInput.dataset[key] = dataset[key];
    }

    let fileButton = document.createElement('button');
    fileButton.textContent = multiple ? 'Choose Files' : 'Choose File';
    fileButton.addEventListener('click', () => fileInput.click());

    let fileDisplay = document.createElement('span');
    fileDisplay.className = 'file-display';
    fileDisplay.textContent = multiple ? 'No files chosen' : 'No file chosen';
    fileDisplay.style.marginLeft = '10px';

    fileInputContainer.appendChild(fileButton);
    fileInputContainer.appendChild(fileDisplay);
    fileInputContainer.appendChild(fileInput);

    // Add event listener to update file display
    fileInput.addEventListener('change', (e) => {
        if (onChange) {
            onChange(e); // Call the original onChange handler
        }
        let fileName;
        if (multiple) {
            fileName = Array.from(e.target.files).map(file => file.name).join(', ');
        } else {
            fileName = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
        }
        fileDisplay.textContent = fileName || (multiple ? 'No files chosen' : 'No file chosen');
        
        // Reset the input if needed (useful for multiple file selections to allow choosing the same file again)
        if (multiple) {
            e.target.value = ''; // This resets the input to allow selection of the same file again
        }
    });

    return fileInputContainer;
}

export function Dropdown(options = [], onSelect) {
    let container = document.createElement('div');
    container.className = 'custom-dropdown';

    let dropdownButton = document.createElement('button');
    dropdownButton.className = 'dropdown-button';
    dropdownButton.textContent = options.length > 0 ? options[0].text : 'Select an option';
    container.appendChild(dropdownButton);

    let dropdownList = document.createElement('ul');
    dropdownList.className = 'dropdown-list hidden';
    container.appendChild(dropdownList);

    function createOption(option) {
        let listItem = document.createElement('li');
        listItem.textContent = option.text;
        listItem.dataset.value = option.value;
        listItem.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default behavior if any
            dropdownButton.textContent = option.text;
            triggerChangeEvent(option.value);
            dropdownList.classList.add('hidden');
        });
        return listItem;
    }

	function triggerChangeEvent(newValue) {
	    dropdownButton.dataset.value = newValue; // Store the new value in dataset
	    if (onSelect) {
	        onSelect({
	            type: 'change',
	            target: {
	                value: newValue,
	                // Include other properties that might be useful
	                textContent: dropdownButton.textContent,
	                container: container  // Reference to the container if needed
	            },
	            currentTarget: container
	        });
	    }
	}
	
    // Method to add an option
    container.addOption = function(option) {
        let listItem = createOption(option);
        dropdownList.appendChild(listItem);
        // If adding to an empty list, select this option
        if (dropdownList.children.length === 1) {
            dropdownButton.textContent = option.text;
            triggerChangeEvent(option.value);
        }
    };

    // Method to remove an option
    container.removeOption = function(optionTextOrValue) {
        let optionToRemove = Array.from(dropdownList.children).find(li => 
            li.textContent === optionTextOrValue || li.dataset.value === optionTextOrValue
        );
        if (optionToRemove) {
            dropdownList.removeChild(optionToRemove);
            // If removed option was selected or if no options left, trigger change event
            if (optionToRemove.textContent === dropdownButton.textContent || dropdownList.childElementCount === 0) {
                dropdownButton.textContent = dropdownList.childElementCount === 0 ? 'Select an option' : dropdownList.firstElementChild.textContent;
                triggerChangeEvent(dropdownList.childElementCount === 0 ? undefined : dropdownList.firstElementChild.dataset.value);
            }
        }
    };

    // Method to update all options
    container.updateOptions = function(newOptions) {
        // Store the currently selected value before clearing options
        const currentValue = dropdownButton.dataset.value;
        let newSelectedValue = newOptions[0] ? newOptions[0].value : null;

        // Clear existing options
        dropdownList.innerHTML = '';
        
        // Add new options
        newOptions.forEach(option => this.addOption(option));
        
        // Update the button text if there are options
        if (newOptions.length > 0) {
            dropdownButton.textContent = newOptions[0].text;
            newSelectedValue = newOptions[0].value;
        } else {
            dropdownButton.textContent = 'Select an option';
        }

        // If the selected value has changed after updating options, trigger the change event
        if (currentValue !== newSelectedValue) {
            triggerChangeEvent(newSelectedValue);
        }
    };

    // Populate initial options
    options.forEach(option => container.addOption(option));

    // Toggle visibility of the dropdown list
    dropdownButton.addEventListener('click', (event) => {
        event.stopPropagation();
        dropdownList.classList.toggle('hidden');
    });

    // Close the dropdown if clicking outside of it
    document.addEventListener('click', (event) => {
        if (!container.contains(event.target) && !dropdownList.classList.contains('hidden')) {
            dropdownList.classList.add('hidden');
        }
    });

    return container;
}

export function Tab(panes, options = {}) {
    let tabContainer = document.createElement('div');
    tabContainer.className = 'tab-widget';
    
    let tabHeaders = document.createElement('div');
    tabHeaders.className = 'tab-headers';
    tabContainer.appendChild(tabHeaders);

    let paneContainer = document.createElement('div');
    paneContainer.className = 'tab-content';
    tabContainer.appendChild(paneContainer);

    panes.forEach((pane, index) => {
        let header = document.createElement('button');
        header.className = 'tab-header';
        header.textContent = pane.title;
        header.addEventListener('click', () => showTab(index));
        tabHeaders.appendChild(header);

        let content = document.createElement('div');
        content.className = 'tab-pane';
        content.style.display = index === 0 ? 'block' : 'none'; 
        content.appendChild(pane.content);
        paneContainer.appendChild(content);
    });

    function showTab(index) {
        Array.from(paneContainer.children).forEach((pane, i) => {
            pane.style.display = i === index ? 'flex' : 'none'; // Changed to 'flex' for consistent sizing
        });
        Array.from(tabHeaders.children).forEach((header, i) => {
            header.classList.toggle('active', i === index);
        });
    }

    tabContainer.showTab = showTab;

    if (options.initialTab !== undefined && options.initialTab >= 0 && options.initialTab < panes.length) {
        showTab(options.initialTab);
    }
	
    function adjustLayout() {
	    const clientHeight = document.documentElement.clientHeight || document.body.clientHeight;
	    const clientWidth = document.documentElement.clientWidth || document.body.clientWidth;
	
	    // Ensure the tab widget fills the available client area
	    tabContainer.style.height = clientHeight + 'px';
	    tabContainer.style.width = clientWidth + 'px';
	}
	
    // Listen for window resize events to adjust layout
//    window.addEventListener('resize', adjustLayout);
//    adjustLayout(); // Initial adjustment
//    document.addEventListener('DOMContentLoaded', adjustLayout);
	function adjustTabContentHeight() {
	    let headersHeight = document.querySelector('.tab-headers').offsetHeight;
	    let tabContent = document.querySelector('.tab-content');
	    tabContent.style.height = `calc(100vh - ${headersHeight}px)`;
	}
	
	// Call this function when the tabs change or on resize
	window.addEventListener('resize', adjustTabContentHeight);
	// Also, call it when the DOM is loaded
	document.addEventListener('DOMContentLoaded', adjustTabContentHeight);	
    return tabContainer;
	
}


export function Canvas(options = {}) {
    let canvas = document.createElement('canvas');
    canvas.width = options.width || 300;
    canvas.height = options.height || 300;
    
    let ctx = canvas.getContext('2d');
    
    // Draw function to be called when you want to render something
    canvas.onDraw = ()=> (options.onDraw || function(ctx) {
        // Clear canvas before drawing new content
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Example draw function, replace with your actual drawing logic
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    })(ctx);
    
    return canvas;
}

export function OutputText(options = {}) {
    let div = document.createElement('div');
    div.className = 'output-text';
    
    div.style.overflowY = 'auto'; // Make it scrollable vertically
    div.style.maxHeight = options.maxHeight || '200px'; // Default max height
    
    // Limit the number of lines
    div.appendText = function(text) {
        let p = document.createElement('p');
        p.textContent = text;
        div.appendChild(p);
        
        if (div.children.length > (options.maxLines || 500)) {
            // Remove the first child if we exceed the line limit
            div.removeChild(div.firstChild);
        }
        // Scroll to the bottom if content overflows
        div.scrollTop = div.scrollHeight;
    };
    
    return div;
}
// Example for creating and appending elements
