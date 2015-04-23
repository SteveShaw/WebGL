# -*- coding: utf-8 -*-
"""
Created on Mon Mar 09 05:05:30 2015

@author: Administrator
"""

import fileinput
import sys

if __name__=='__main__':
  codes = []
  codes.append('var FSHADER=[\n')  
  for ln in fileinput.input(sys.argv[1]):
    if len(ln) > 2:
      codes.append("'%s',"%ln.rstrip('\r\n'))
  codes.append('\]');
  codes.append('.join');

  with open('shader.js', 'w') as f:  
    for item in codes:
      f.write('%s\n'%item)
    
  