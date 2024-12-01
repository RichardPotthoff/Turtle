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
    
    // Create tab headers
    let tabHeaders = document.createElement('div');
    tabHeaders.className = 'tab-headers';
    tabContainer.appendChild(tabHeaders);

    // Create content panes
    let paneContainer = document.createElement('div');
    paneContainer.className = 'tab-content';
    tabContainer.appendChild(paneContainer);

    panes.forEach((pane, index) => {
        // Create header
        let header = document.createElement('button');
        header.className = 'tab-header';
        header.textContent = pane.title;
        header.addEventListener('click', () => showTab(index));
        tabHeaders.appendChild(header);

        // Create content
        let content = document.createElement('div');
        content.className = 'tab-pane';
        content.style.display = index === 0 ? 'block' : 'none'; // Show first tab by default
        content.appendChild(pane.content);
        paneContainer.appendChild(content);
    });

    function showTab(index) {
        Array.from(paneContainer.children).forEach((pane, i) => {
            pane.style.display = i === index ? 'block' : 'none';
        });
        // Optionally, modify CSS for active tab header
        Array.from(tabHeaders.children).forEach((header, i) => {
            header.classList.toggle('active', i === index);
        });
    }

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
    
    div.appendText = function(text) {
        let p = document.createElement('p');
        p.textContent = text;
        div.appendChild(p);
        // Scroll to the bottom if content overflows
        div.scrollTop = div.scrollHeight;
    };
    
    return div;
}


// Example for creating and appending elements
