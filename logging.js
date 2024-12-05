
export function debugLog(obj) {
	console.log(obj);
    if (window.logElement){
    window.logElement.appendText(JSON.stringify(obj));
   }
}