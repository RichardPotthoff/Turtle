import re
import os
from bs4 import BeautifulSoup
from collections import defaultdict


def combined_sub(content,patterns):
  combined_pattern ='|'.join(f'(?P<pattern{i}>'+pattern[0]+')' for i,pattern in enumerate(patterns))
  cre=re.compile(combined_pattern,flags=re.MULTILINE)
  def callback(match):
    for key,group in match.groupdict().items():
      if group and key.startswith('pattern'):
        i=int(key[7:])
        return patterns[i][1](match)
  return cre.sub(callback,content)
  
string_pattern = r"'(?:[^'\\]|\\.)*'|" + r'"(?:[^"\\]|\\.)*"|'
multiline_string_pattern = r'`(?:[^`\\]|\\.)*`'
whitespace_around_delimiter =r'\s*(?P<delimiter>[][=(){}|:<>;,?%& \n\t]|/(?=[^/*])|(?<=[^/])\*)\s*'
comment_pattern = r'//.*?(?:\n|$)'#include the trailing newline
multiline_comment_pattern = r'/\*[\s\S]*?\*/'
  
minify_patterns=[(comment_pattern, lambda match:''),
          (whitespace_around_delimiter, lambda match:match.group('delimiter')),
          (string_pattern, lambda match:match.group()),
          (multiline_string_pattern, lambda match:match.group()),
          (multiline_comment_pattern, lambda match:''),
          ]
          
minify_javascript=lambda code:combined_sub(code,minify_patterns)      


def convert_es6_to_iife(content, module_name=None, minify=False):
    def convert_import_to_let(module_filename,import_name, destructuring):
      result=''
    # If it's destructuring, use it directly
      if destructuring:
        result+= f'let {destructuring} = modules["{module_filename}"];\n'
      if import_name:
        result+= f'let {import_name} = modules["{module_filename}"];\n'
      #
      #default import may need to be added here
      #
      return result
    import_pattern = r'^\s*(import\s+(?:(?:(?:(\w+)(?:[,]|\s)\s*)?(?:(\{[^}]*\}\s)|(?:\*\s+as\s+(\w+))\s)?)\s*from\s+)?[\'"]([^"\']+)[\'"]\s*;?)\s*$'
    import_pattern = r'(?=^|;)\s*(import\s+(?:(?:(?:(\w+)(?:[,]|\s)\s*)?(?:(\{[^}]*\}\s)|(?:\*\s+as\s+(\w+))\s)?)\s*from\s+)?[\'"]([^"\']+)[\'"]\s*;?)\s*$'
    content='\n'+content
    imports_ = re.findall(import_pattern,content, re.MULTILINE)
    imports={}
    for import_statement, default, destructuring,imodule_name, file_path in imports_:
        # Remove the import statement entirely
        file_name = os.path.basename(file_path)
        imports[file_name]=file_path
#        if imodule_name and imodule_name != file_name:
#          print(f"Warning: Module name '{imodule_name}' does not match file name '{file_name}'.")
        content = re.sub(import_pattern, 
                convert_import_to_let(file_name, imodule_name, destructuring)+r'\n', content, count=1, flags=re.MULTILINE)
                
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
        iife_wrapper = f'\n(function(global) {{\n{content}\nif(!("modules" in global)){{\n global["modules"]={{}}\n}}\nglobal.modules["{module_name}"] = {export_object};\n}})(window);'
    else:
        iife_wrapper = f'\n(function(global) {{\n{content}\n}})(window);'
    if minify:
        iife_wrapper = minify_javascript(iife_wrapper)
    return iife_wrapper,imports

def gather_dependencies(content, processed_modules, dependencies, in_process=None, module_dir=None, module_name=None, minify=False):
    if in_process==None:
      in_process=set()
    if module_name:
      if module_name in processed_modules:
        if module_name in in_process:
          print(f'Circular dependency detected: Module "{module_name}" is already being processed.')
        return ""
      else:
        in_process.add(module_name)
        processed_modules.add(module_name)

    # Process dependencies first
    print(f'Processing module "{module_name if module_name else "html <script>"}"')
        # Convert the module itself 
    converted,imports = convert_es6_to_iife(content, module_name, minify=minify)
    dependency_content = ""
    for ifile_name,ifile_path in imports.items():
        dependencies[module_name].add(ifile_name)
        full_path = os.path.join(os.path.dirname(module_dir), ifile_path)
        imodule_dir=os.path.dirname(full_path)
        with open(full_path, 'r') as f:
           content = f.read()
        dependency_content += gather_dependencies(content, processed_modules, dependencies,in_process,module_dir=imodule_dir,module_name=ifile_name, minify=minify)
    if module_name:
      in_process.remove(module_name)
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
                module_name = os.path.basename(full_path)
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

