import yaml
import json

def formatted_json(data, indent=2, max_indent_level=3): 
  max_indent=indent*max_indent_level
  s=iter(json.dumps(data,indent=indent,sort_keys=False))
  try:
    while True:
      c=next(s)
      if c!='\n':
        yield c
      else: #found a newline
        current_indent=0
        while True:
          c1=next(s)
          if c1==' ':
            current_indent+=1#count the indent spaces at the beginning of a line
          else: #we found the start of the text
            if current_indent<max_indent or (current_indent==max_indent and c1=='['): #if the indent is smaller than the max
              yield '\n' # leave everything unchanged, add the line feed
              yield from ' '*current_indent # and the indent
            else:
              yield ' ' # replace the linefeed and the indent with a single space
            yield c1 #finally put the first non_space character back
            break #continue with the rest of the input stream.
  except StopIteration:
      pass
      


filename='cookie_cutters'
with open(filename+'.yaml','r') as f:
  cc=yaml.safe_load(f)

cd=''.join(formatted_json(cc,indent=2,max_indent_level=3))
print(cd)
#with open(filename+'.json','w') as g:
#  g.write(cd)
 
