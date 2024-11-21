/**
 * Formats and filters JSON data to make it more compact based on indentation levels.
 * @param {Object} data - The data to be stringified and formatted.
 * @param {number} [initialIndent=2] - Number of spaces for each level of indentation.
 * @param {number} [maxIndentLevel=2] - Maximum level of indentation to keep separate lines.
 * @returns {string} A formatted JSON string where deeply nested structures are merged.
 */
export function stringifyFormatted(data, initialIndent = 2, maxIndentLevel = 2) {
    const maxIndent = initialIndent * maxIndentLevel;
    let jsonString = JSON.stringify(data, null, initialIndent);
    let result = '';
    let lines = jsonString.split('\n');
    let previousLine = '';

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmedLine = line.trim();
        
        // Count indentation at the start of the line
        let indent = line.match(/^\s*/)[0].length;

        if (indent < maxIndent || (indent === maxIndent && (trimmedLine.startsWith('[') || trimmedLine.startsWith('{')))) {
            if (previousLine !== '') {
                result += previousLine + '\n';
            }
            previousLine = line;
        } else {
            if (previousLine !== '') {
                result += previousLine + ' ';
            }
            previousLine = trimmedLine;
        }

        // Handle the last line
        if (i === lines.length - 1 && previousLine !== '') {
            result += previousLine;
        }
    }

    return result;
}