export function stringifyFormatted(data, initialIndent = 2, maxIndentLevel = 2) {
    let maxIndent = initialIndent * maxIndentLevel;
    let jsonString = JSON.stringify(data, null, initialIndent);
    let result = '';
    let lines = jsonString.split('\n');
    let previousLine = '';
    for (let i = 0; i < lines.length; i++) {
		let line=lines[i];
		let trimmedLine=line.trim(' ');
        let indent = line.match(/^\s*/)[0].length;
        if (indent < maxIndent || (indent === maxIndent && (trimmedLine.startsWith('[')||trimmedLine.startsWith('{')))) {
            if (previousLine !== '') {
                result += previousLine + '\n';
            }
            previousLine = line;
        } else {
            if (previousLine !== '') {
                result += previousLine + ' ';
                previousLine = '';
            }
            previousLine += trimmedLine;
        }

        if (i === lines.length - 1 && previousLine !== '') {
            result += previousLine;
        }
    }

    return result;
}
// Example usage
/*
let data = {
    "key": "value",
    "array": [1, 2, 3, [4, 5, 6]]
};

let formattedJson = formatAndFilterJson(data, 2, 3); // 2 spaces for initial indent, 3 levels deep for filtering
console.log(formattedJson);
*/