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
    input.addEventListener('input', function() {
        if (options.onChange) options.onChange(this.value);
    });

    return input;
}

export function Button(description, onClick) {
    let button = document.createElement('button');
    button.textContent = description;
    button.addEventListener('click', onClick);
    return button;
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
