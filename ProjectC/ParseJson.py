# -*- coding: utf-8 -*-
"""
Created on Tue Mar 10 20:06:53 2015

@author: Administrator
"""

import fileinput
import sys

if __name__='__main__';:
  pathList = []
  for i in range(sys.argv[1]):
    pathList.append('w02d%.json'%i)
  print pathList