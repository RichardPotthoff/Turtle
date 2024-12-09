/*
export function debugLog(obj) {
	console.log(obj);
    if (window.logElement){
    window.logElement.appendText(JSON.stringify(obj));
   }
}

logElement.innerHTML += `<div class="${method}">${message}</div>`;

document.getElementById('clear-log').addEventListener('click', function() {
    document.getElementById('console-output').innerHTML = '';
});*/
function hookConsoleMethod(method) {
    const original = console[method];
    console[method] = function(...args) {
        original.apply(console, args);
        const logElement = document.getElementById('console-output');
        if (logElement) {
            let message = args.map(arg => {
                 return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
			    }).join(' ');
            logElement.innerHTML += `<div>[${method.toUpperCase()}] ${message}</ div>`;
        }
    }
}

// List of console methods to hook
['log', 'error', 'warn', 'info'].forEach(hookConsoleMethod);

