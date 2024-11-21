import yaml
import json

def filter_json(s,max_indent=6): 
  s=iter(s)
  try:
    while True:
      c=next(s)
      if c!='\n':
        yield c
      else: #found a newline
        indent=0
        while True:
          c1=next(s)
          if c1==' ':
            indent+=1#count the indent spaces at the beginning of a line
          else: #we found the start of the text
            if indent<max_indent or (indent==max_indent and c1=='['): #if the indent is smaller than the max
              yield '\n' # leave everything unchanged, add the line feed
              yield from ' '*indent # and the indent
            else:
              yield ' ' # replace the linefeed and the indent with a single space
            yield c1 #finally put the first non_space character back
            break #continue with the rest of the input stream.
  except StopIteration:
      pass
      
filename='cookie_cutters'
with open(filename+'.yaml','r') as f:
  cc=yaml.safe_load(f)
  
with open(filename+'.json','w') as g:
  raw_json=json.dumps(cc,indent=2,sort_keys=False)
  g.write(''.join(filter_json(raw_json,max_indent=6)))

