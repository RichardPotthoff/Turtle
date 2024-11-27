import re
import os
from bs4 import BeautifulSoup
from collections import defaultdict

def minify_javascript(code,keep_newlines=False):
    # Preserve string literals
#    def preserve_strings(match):
#        return match.group(0)
    # Replace strings temporarily with placeholders
    placeholders = {}
    string_pattern = r'((["\'])(?:(?=(\\?))\3.)*?\2)'
    strings = re.findall(string_pattern, code)
    for i, s in enumerate(strings):
        placeholder = f'__STRING_{i}__'
        code = code.replace(s[0], placeholder, 1)
        placeholders[placeholder] = s[0]
        
    # Remove all comments    
    code = re.sub(r'//.*?(?=\n|$)', '', code)  # Single-line comments
    code = re.sub(r'/\*[\s\S]*?\*/', '', code)  # Multi-line comments
    delimiters='][=(){}|*:<>;,?/%&'
    if keep_newlines:
      code = re.sub(r'[ \t]*(['+delimiters+'])', r'\1', code)#remove all spaces and tabs in front of special characters
      code = re.sub(r'(['+delimiters+'])[ \t]*', r'\1', code)#remove all spaces and tabs after special characters
    else:
      code = re.sub(r'\s*(['+delimiters+'])', r'\1', code)#remove all spaces and tabs in front of special characters
      code = re.sub(r'(['+delimiters+'])\s*', r'\1', code)#remove all spaces and tabs after special characters
    code = re.sub(r'[ \t]*\n\s*', r'\n', code)#keep only one line break if there are more than one
    code = re.sub(r'[ \t]+', ' ', code)# replace greater than one spaces with one space
    
    # Add back preserved strings
    for placeholder, original in placeholders.items():
        code = code.replace(placeholder, original, 1)
    return code


def convert_es6_to_iife(content, module_name=None, minify=False):
    def convert_import_to_let(module_name, destructuring):
    # If it's destructuring, use it directly
      if destructuring.startswith('{'):
        return f"let {destructuring} = {module_name};"
      else:  # If it's import *, we return a more generic destructuring
        return f"let {{/* Destructure here */}} = {module_name};"
    import_pattern = r'^\s*(import\s+(?:(?:(?:(\w+)(?:[,]|\s)\s*)?(?:(\{[^}]*\}\s)|(?:\*\s+as\s+(\w+))\s)?)\s*from\s+)?[\'"]([^"\']+)[\'"]\s*;?)\s*$'
    content='\n'+content
    imports_ = re.findall(import_pattern,content, re.MULTILINE)
    imports={}
    for import_statement, default, destructuring,imodule_name, file_path in imports_:
        # Remove the import statement entirely
        file_name = re.sub(r'[.-]',r'_',os.path.splitext(os.path.basename(file_path))[0])
        imports[file_name]=file_path
        if imodule_name and imodule_name != file_name:
          print(f"Warning: Module name '{imodule_name}' does not match file name '{file_name}'.")
        content = re.sub(import_pattern, 
                convert_import_to_let(file_name, destructuring)+r'\n', content, count=1, flags=re.MULTILINE)
                
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
    return iife_wrapper,imports

def gather_dependencies(content, processed_modules, dependencies, module_dir=None, module_name=None, minify=False):
    if module_name and module_name in processed_modules:
        return ""
    
    # Process dependencies first

        # Convert the module itself 
    converted,imports = convert_es6_to_iife(content, module_name, minify=minify)
    dependency_content = ""
    for dependency, file_path in imports.items():
        dependencies[module_name].add(dependency)
        full_path = os.path.join(os.path.dirname(module_dir), file_path)
        dependency_dir=os.path.dirname(full_path)
        with open(full_path, 'r') as f:
           content = f.read()
        dependency_content += gather_dependencies(content, processed_modules, dependencies,module_dir=dependency_dir,module_name=dependency, minify=minify)
    if module_name:
      processed_modules.add(module_name)
    return dependency_content + converted

def process_html(html_path,minify=False):
    with open(html_path, 'r') as file:
        soup = BeautifulSoup(file, 'html.parser')
    
    processed_modules = set()
    dependencies = defaultdict(set)
    
    for script in soup.find_all('script'):
        if script.get('type') == 'module':
            module_path = script.get('src',None)
            if module_path!=None:
                full_path = os.path.join(os.path.dirname(html_path), module_path)
                module_dir = os.path.dirname(full_path)
                module_name = re.sub(r'[.-]',r'_',os.path.splitext(os.path.basename(full_path))[0])
                # Gather all dependencies for this module
                with open(full_path, 'r') as f:
                    content = f.read()
                del script['src']  # Remove the src attribute as we've included the content
            else:
                content=script.string
                module_name=None
                module_dir=os.path.dirname(html_path)
            script['type'] = 'text/javascript'  # Change type to standard JavaScript
            # Insert the converted IIFE content for this module and its dependencies
            iife_content = gather_dependencies(content, processed_modules, dependencies,  
                module_dir=module_dir, module_name=module_name,  minify=minify)
            script.string = iife_content
        else:
            # For regular scripts, insert their content
            script_path = script.get('src',None)
            if script_path:
               with open(os.path.join(os.path.dirname(html_path), script['src']), 'r') as f:
                   if minify:
                     script.string = minify_javascript(f.read())
                   else:
                     script.string = f.read()
               del script['src']
            else:
                if minify:
                   script.string=minify_javascript(script.string)

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
    os.chdir('/private/var/mobile/Containers/Data/Application/BE7DE533-3951-4E82-8625-B8A91389012F/Documents/Turtle')
    html_file = "index.html"
    process_html(html_file,minify=True)
    print("HTML processing completed with modules converted to IIFE.")

