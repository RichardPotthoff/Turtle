import re
import os
from bs4 import BeautifulSoup
from collections import defaultdict

def minify_javascript(code,keep_newlines=False):
    # Remove all comments
    code = re.sub(r'//.*?(?=\n|$)', '', code)  # Single-line comments
    code = re.sub(r'/\*[\s\S]*?\*/', '', code)  # Multi-line comments
    # Preserve string literals
    def preserve_strings(match):
        return match.group(0)
    
    # Replace strings temporarily with placeholders
    placeholders = {}
    string_pattern = r'([\'"])(?:(?=(\\?))\2.*?\1)'
    strings = re.findall(string_pattern, code)
    for i, s in enumerate(strings):
        s = ''.join(s)
        placeholder = f'__STRING_{i}__'
        code = code.replace(s, placeholder, 1)
        placeholders[placeholder] = s
    if keep_newlines:
      code = re.sub(r'[ \t]*([]=([{<|:,;?*>}])', r'\1', code)#remove all spaces and tabs in front of special characters
      code = re.sub(r'([]=([{<|:,;?*>}])[ \t]*', r'\1', code)#remove all spaces and tabs after special characters
    else:
      code = re.sub(r'\s*([]=([{<|:,;?*>}])', r'\1', code)#remove all spaces and tabs in front of special characters
      code = re.sub(r'([]=([{<|:,;?*>}])\s*', r'\1', code)#remove all spaces and tabs after special characters

    code = re.sub(r'[ \t]*\n\s*', r'\n', code)#keep only one line break if there are more than one
    code = re.sub(r'[ \t]+', ' ', code)# replace greater than one spaces with one space
    
    # Add back preserved strings
    for placeholder, original in placeholders.items():
        code = code.replace(placeholder, original, 1)
    return code
        
def convert_es6_to_iife(input_file, module_name=None, minify=False):
    def convert_import_to_let(module_name, destructuring):
    # If it's destructuring, use it directly
      if destructuring.startswith('{'):
        return f"let {destructuring} = {module_name};"
      else:  # If it's import *, we return a more generic destructuring
        return f"let {{/* Destructure here */}} = {module_name};"
    if module_name==None:
      module_name = input_file.name.split('.')[0]
    content = input_file.read()

    # Remove or replace 'import * as' statements
    import_pattern = r'^\s*(import\s+((?:\{[^}]*\})|\*)(\s+as\s+(\w+))?\s+from\s+[\'"]([^"\']+)[\'"]\s*;?)\s*$'
    imports = re.findall(import_pattern, content, re.MULTILINE)
    for import_statement, destructuring, _,module_name, file_path in imports:
        # Remove the import statement entirely
        file_name = os.path.splitext(os.path.basename(file_path))[0]
        if module_name and module_name != file_name:
          print(f"Warning: Module name '{module_name}' does not match file name '{file_name}'.")
        content = re.sub(import_pattern, r'//'+import_statement+r'\n'+
                convert_import_to_let(file_name, destructuring)+r'\n', content, count=1, flags=re.MULTILINE)
        
        # Replace all references to the module with the global object
#        content = re.sub(r'\b' + module_name + r'\.', f'window["{file_name}"]', content)

    # Handle exports - assuming all exports are at the module level
    export_pattern = r'^export\s+(?:function|const)\s+(\w+)(.*)$'
    exports = re.findall(export_pattern, content, re.MULTILINE)
    export_object = '{\n'
    for name, function_body in exports:
        # Remove 'export' from the function declaration
        content = re.sub(export_pattern, f'function {name}{function_body}', content, count=1, flags=re.MULTILINE)
        export_object += f'  {name}: {name},\n'
    export_object += '}'

    # Wrap the content in an IIFE
    if exports:  # Only add the export object if there are exports
        iife_wrapper = f'\n(function(global) {{\n{content}\n  global["{module_name}"] = {export_object};\n}})(window);'
    else:
        iife_wrapper = f'\n(function(global) {{\n{content}\n}})(window);'
    if minify:
        iife_wrapper = minify_javascript(iife_wrapper)
    return iife_wrapper
    
def process_module(module_path, processed_modules, dependencies, minify=False):
    module_name = os.path.splitext(os.path.basename(module_path))[0]
    if module_name in processed_modules:
        return ""

    processed_modules.add(module_name)
    
    with open(module_path, 'r') as f:
        content = f.read()
    
    # Find imports in this module
    import_pattern = r'^\s*import\s+((?:\{[^}]*\})|\*)(\s+as\s+(\w+))?\s+from\s+[\'"]([^"\']+)[\'"]\s*;?\s*$'
    imports = re.findall(import_pattern, content, re.MULTILINE)
    
    for _, _, _, _, file_path in imports:
        dependency = os.path.splitext(os.path.basename(file_path))[0]
        dependencies[module_name].add(dependency)
        full_path = os.path.join(os.path.dirname(module_path), file_path)
        
        # Recursively process dependencies
        process_module(full_path, processed_modules, dependencies,minify=minify)
    
    # Convert this module
    with open(module_path, 'r') as f:
        converted = convert_es6_to_iife(f, module_name,minify=minify)
    return converted

def gather_dependencies(module_path, processed_modules, dependencies, minify=False):
    module_name = os.path.splitext(os.path.basename(module_path))[0]
    if module_name in processed_modules:
        return ""
    
    # Process dependencies first
    with open(module_path, 'r') as f:
        content = f.read()
    
    import_pattern = r'^\s*import\s+((?:\{[^}]*\})|\*)(\s+as\s+(\w+))?\s+from\s+[\'"]([^"\']+)[\'"]\s*;?\s*$'
    imports = re.findall(import_pattern, content, re.MULTILINE)
    dependency_content = ""
    for _, _, _, file_path in imports:
        dependency = os.path.splitext(os.path.basename(file_path))[0]
        dependencies[module_name].add(dependency)
        full_path = os.path.join(os.path.dirname(module_path), file_path)
        dependency_content += gather_dependencies(full_path, processed_modules, dependencies, minify=minify)
    
    # Convert the module itself
    with open(module_path, 'r') as f:
        converted = convert_es6_to_iife(f, module_name, minify=minify)
    
    return dependency_content + converted

def process_html(html_path,minify=False):
    with open(html_path, 'r') as file:
        soup = BeautifulSoup(file, 'html.parser')
    
    processed_modules = set()
    dependencies = defaultdict(set)
    
    for script in soup.find_all('script'):
        if script.get('type') == 'module':
            module_path = script['src']
            full_path = os.path.join(os.path.dirname(html_path), module_path)
            
            # Gather all dependencies for this module
            iife_content = gather_dependencies(full_path, processed_modules, dependencies, minify=minify)
            
            # Insert the converted IIFE content for this module and its dependencies
            script.string = iife_content
            del script['src']  # Remove the src attribute as we've included the content
            script['type'] = 'text/javascript'  # Change type to standard JavaScript
        else:
            # For regular scripts, insert their content
            with open(os.path.join(os.path.dirname(html_path), script['src']), 'r') as f:
                script.string = f.read()
            del script['src']

    with open('output.html', 'w') as file:
        file.write(str(soup))

if __name__ == "__main__":
    os.chdir('../widgets')
    html_file = "index.html"
    process_html(html_file,minify=True)
    print("HTML processing completed with modules converted to IIFE.")
    os.chdir("/private/var/mobile/Containers/Data/Application/77881549-3FA6-4E4B-803F-D53B172FC865/Documents/www")
    html_file = "webgl-3d-camera-look-at-heads.html"
    process_html(html_file,minify=True)
    print("HTML processing completed with modules converted to IIFE.")
    os.chdir('../Turtle')
    html_file = "index.html"
    process_html(html_file,minify=True)
    print("HTML processing completed with modules converted to IIFE.")

