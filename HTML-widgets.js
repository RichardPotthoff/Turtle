export function HBox(children, options = {}) {
    let div = document.createElement('div');
    div.className = 'hbox';
    if (options.style) Object.assign(div.style, options.style);
    children.forEach(child => div.appendChild(child));
    return div;
}

export function VBox(children, options = {}) {
    let div = document.createElement('div');
    div.className = 'vbox';
    if (options.style) Object.assign(div.style, options.style);
    children.forEach(child => div.appendChild(child));
    return div;
}

export function Grid(children, options = {}) {
    let div = document.createElement('div');
    div.className = 'grid-container';
    
    // Apply styles for responsive layout
    Object.assign(div.style, {
        display: 'grid',
        width: '100vw',
        height: '100vh',
        gridGap: '10px'
    });

    // Initial setup for layout based on aspect ratio
    function adjustLayout() {
        const aspectRatio = window.innerWidth / window.innerHeight;
        if (aspectRatio > 1) { // Landscape
            div.style.gridTemplateColumns = options.controlsRight ? '1fr auto' : 'auto 1fr';
            div.style.gridTemplateAreas = options.controlsRight ? "'canvas controls'" : "'controls canvas'";
            div.style.gridTemplateRows = '1fr';
        } else { // Portrait
            div.style.gridTemplateColumns = '1fr';
            div.style.gridTemplateRows = '1fr auto';
            div.style.gridTemplateAreas = "'canvas' 'controls'";
        }
    }

    // Listen for window resize events
    window.addEventListener('resize', adjustLayout);
    adjustLayout(); // Call once to set initial layout

    // Appending children with their grid areas
    children.forEach((child, index) => {
        let childDiv = document.createElement('div');
        childDiv.appendChild(child);
        childDiv.style.gridArea = index === 0 ? 'canvas' : 'controls';
        div.appendChild(childDiv);
    });

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
    fileInput.style.display = 'none'; // Hides the actual file input
    
    // Apply dataset properties
    for (let key in dataset) {
        fileInput.dataset[key] = dataset[key];
    }

    // Direct event listener
    fileInput.addEventListener('change', onChange);

    let fileButton = document.createElement('button');
    fileButton.textContent = multiple ? 'Choose Files' : 'Choose File';
    fileButton.addEventListener('click', () => fileInput.click());

    let fileDisplay = document.createElement('span');
    fileDisplay.className = 'file-display';
    fileDisplay.textContent = 'No file chosen';
    fileDisplay.style.marginLeft = '10px';

    fileInputContainer.appendChild(fileButton);
    fileInputContainer.appendChild(fileDisplay);
    fileInputContainer.appendChild(fileInput);

    // Return the container, not the input directly
    return fileInputContainer;
}

export function Dropdown(options = [], onSelect) {
    let container = document.createElement('div');
    container.className = 'custom-dropdown';

    // The dropdown button which displays the currently selected option
    let dropdownButton = document.createElement('button');
    dropdownButton.className = 'dropdown-button';
    dropdownButton.textContent = options.length > 0 ? options[0].text : 'Select an option';
    container.appendChild(dropdownButton);

    // The list of options
    let dropdownList = document.createElement('ul');
    dropdownList.className = 'dropdown-list hidden';
    container.appendChild(dropdownList);

    function createOption(option) {
        let listItem = document.createElement('li');
        listItem.textContent = option.text;
        listItem.dataset.value = option.value;
        listItem.addEventListener('click', () => {
            dropdownButton.textContent = option.text;
            onSelect(option.value);
            dropdownList.classList.add('hidden');
        });
        return listItem;
    }

    // Method to add an option
    container.addOption = function(option) {
        let listItem = createOption(option);
        dropdownList.appendChild(listItem);
    };

    // Method to remove an option by its text or value
    container.removeOption = function(optionTextOrValue) {
        let optionToRemove = Array.from(dropdownList.children).find(li => 
            li.textContent === optionTextOrValue || li.dataset.value === optionTextOrValue
        );
        if (optionToRemove) {
            dropdownList.removeChild(optionToRemove);
        }
    };

    // Method to update all options
    container.updateOptions = function(newOptions) {
        // Store the currently selected value before clearing options
        const currentValue = this.querySelector('.dropdown-button').textContent;
        let newSelectedValue = newOptions[0] ? newOptions[0].value : null;

        // Clear existing options
        dropdownList.innerHTML = '';
        
        // Add new options
        newOptions.forEach(option => this.addOption(option));
        
        // Update the button text if there are options
        if (newOptions.length > 0) {
            dropdownButton.textContent = newOptions[0].text;
            newSelectedValue = newOptions[0].value; // Update to new selection
        } else {
            dropdownButton.textContent = 'Select an option';
        }

        // If the selected value has changed after updating options, trigger the change event
        if (currentValue !== dropdownButton.textContent && onSelect) {
            onSelect(newSelectedValue);
        }

        // Trigger the change event manually
        const event = new Event('change', { bubbles: true });
        this.dispatchEvent(event);
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

    // Listen for window resize events to adjust layout
    window.addEventListener('resize', adjustLayout);
    adjustLayout(); // Initial adjustment

    return tabContainer;

    function adjustLayout() {
        // This function can be expanded if you need more dynamic behavior
        tabContainer.style.height = window.innerHeight + 'px'; // Ensure full height
        tabContainer.style.width = window.innerWidth + 'px'; // Ensure full width
    }
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
