import re
import os
from bs4 import BeautifulSoup
from collections import defaultdict

def compile_combined_patterns(patterns):
  combined_pattern ='|'.join(f'(?P<pattern{i}>'+pattern[0]+')' for i,pattern in enumerate(patterns))
  return (re.compile(combined_pattern,flags=re.MULTILINE),patterns)
  
def compiled_combined_sub(content,compiled_patterns):
  compiled_re,patterns=compiled_patterns
  def callback(match):
    for key,group in match.groupdict().items():
      if group and key.startswith('pattern'):
        i=int(key[7:])
        return patterns[i][1](match)
  return compiled_re.sub(callback,content)
  
string_pattern = r"'(?:[^'\\]|\\.)*'|" + r'"(?:[^"\\]|\\.)*"|'
multiline_string_pattern = r'`(?:[^`\\]|\\.)*`'
comment_pattern = r'//.*?(?:\n|$)'#include the trailing newline
multiline_comment_pattern = r'/\*[\s\S]*?\*/'
delimiters=r'][=(){}:<>;,?%&|*+-/'
whitespaces_to_right_of_delimiter =r'(?<=['+delimiters+r'])\s*'
whitespaces_to_left_of_delimiter =r'\s*(?=['+delimiters+r'])'
whitespaces_containing_newline=r'\s*\n\s*'
two_or_more_whitespaces = r'\s\s+'
  
minify_patterns=[
    (string_pattern, lambda match:match.group()), #detect strings, and put them back
    (multiline_string_pattern, lambda match:match.group()), #detect strings and put them back
    (multiline_comment_pattern, lambda match:''), #remove all comments
    (comment_pattern, lambda match:''), #remove all comments
    (whitespaces_to_right_of_delimiter,lambda match:''), #delete whitespaces if there is a delimiter to the left
    (whitespaces_to_left_of_delimiter,lambda match:''), #delete whitespaces if there is a delimiter to the right
    (whitespaces_containing_newline,lambda match:'\n'), #replace whitspaces with a newline in it with a single newline
    (two_or_more_whitespaces,lambda match:' '), #replace span of >=2 whitspaces with single whitespace
    ]
          
compiled_minify_patterns=compile_combined_patterns(minify_patterns)

minify_javascript=lambda code:compiled_combined_sub(code,compiled_minify_patterns)      


def convert_es6_to_iife(content, module_filename=None, minify=False):
  imports={}
  import_pattern = r'(?=^|;)\s*(import\s+(?:(?:(?:(?P<default_import>\w+)(?:[,]|\s)\s*)?(?:(?P<destructuring>\{[^}]*\}\s)|(?:\*\s+as\s+(?P<module_alias>\w+))\s)?)\s*from\s+)?[\'"](?P<module_path>[^"\']+)[\'"]\s*;?)'
  
  def import_callback(match):
      groupdict=match.groupdict()
      default_import=groupdict['default_import']
      destructuring=groupdict['destructuring']
      module_alias=groupdict['module_alias']
      module_path=groupdict['module_path']
      module_filename=os.path.basename(module_path).strip()
      imports[module_filename]=module_path
      result=[]
      if destructuring:
        destructuring=re.sub(r'(\w+)\s*as\s*(\w+)',r'\1 : \2',destructuring.strip('; '))
        result.append(f'let {destructuring} = modules["{module_filename}"];')
      if module_alias:result.append(f'let {module_alias.strip()} = modules["{module_filename}"];')
      if default_import:result.append(f'let {default_import.strip()} = modules["{module_filename}"].default;')
      return '\n'.join(result)
      
  exports={}
  export_pattern = r'(?=^|;)\s*(export\s+(?P<export_default>default\s+)?(?P<export_type>function|const|let|var|class)\s+(?P<export_name>\w+)\s*)'
  
  def export_callback(match):
      groupdict=match.groupdict()
      export_type=groupdict['export_type'].strip()
      export_name=groupdict['export_name'].strip()
      exports[export_name]=export_name
      if groupdict['export_default']:
        exports['default']=export_name
      return export_type+' '+export_name #remove the 'export' and 'default' keywords
      
  es6_to_iife_patterns=[
      (string_pattern, lambda match:match.group()), #detect strings, and put them back
      (multiline_string_pattern, lambda match:match.group()), #detect strings and put them back
      (multiline_comment_pattern, (lambda match:'') if minify else (lambda match:match.group())), #remove comments only if minify
      (comment_pattern, (lambda match:'') if minify else (lambda match:match.group())), #remove comments only if minify
      (import_pattern,import_callback),#parse import statements, and replace them with equivalent let statements
      (export_pattern,export_callback),#parse export statements, collect export names, remove 'export [default]'
      ]
    
  content=compiled_combined_sub(content,compile_combined_patterns(es6_to_iife_patterns))
  
  if exports:  # Only add the export object if there are exports
      iife_wrapper = f'\n(function(global) {{\n{content}\nif(!("modules" in global)){{\n global["modules"]={{}}\n}}\nglobal.modules["{module_filename}"] = {{{",".join(str(key)+":"+str(value) for key,value in exports.items())}}} ;\n}})(window);'
  else:
      iife_wrapper = f'\n(function(global) {{\n{content}\n}})(window);'
      
  if minify:
      iife_wrapper = minify_javascript(iife_wrapper)
  
  return iife_wrapper,imports

def gather_dependencies(content, processed_modules, dependencies, in_process=None, module_dir=None, module_filename=None, minify=False):
    if in_process==None:
      in_process=set()
    if module_filename:
      if module_filename in processed_modules:
        if module_filename in in_process:
          print(f'Circular dependency detected: Module "{module_filename}" is already being processed.')
        return ""
      else:
        in_process.add(module_filename)
        processed_modules.add(module_filename)

    # Process dependencies first
    print(f'Processing module "{module_filename if module_filename else "html <script>"}"')
        # Convert the module itself 
    converted,imports = convert_es6_to_iife(content, module_filename, minify=minify)
    dependency_content = ""
    for ifile_name,ifile_path in imports.items():
        dependencies[module_filename].add(ifile_name)
        full_path = os.path.join(os.path.dirname(module_dir), ifile_path)
        imodule_dir=os.path.dirname(full_path)
        with open(full_path, 'r') as f:
           content = f.read()
        dependency_content += gather_dependencies(content, processed_modules, dependencies,in_process,module_dir=imodule_dir,module_filename=ifile_name, minify=minify)
    if module_filename:
      in_process.remove(module_filename)
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
                module_filename = os.path.basename(full_path)
                # Gather all dependencies for this module
                with open(full_path, 'r') as f:
                    content = f.read()
                del script['src']  # Remove the src attribute as we've included the content
            else:
                content=script.string
                module_filename=None
                module_dir=os.path.dirname(html_path)
            script['type'] = 'text/javascript'  # Change type to standard JavaScript
            # Insert the converted IIFE content for this module and its dependencies
            iife_content = gather_dependencies(content, processed_modules, dependencies,  
                module_dir=module_dir, module_filename=module_filename,  minify=minify)
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
#    module_filename='index.js'
#    print(convert_es6_to_iife(open(module_filename).read(),module_filename=module_filename,minify=False)[0])
#    raise Exception
    from time import perf_counter
    t1=perf_counter()
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
    t2=perf_counter()
    print(f'{t2-t1=}')
