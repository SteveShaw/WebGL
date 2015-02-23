# -*- coding: utf-8 -*-
"""
Created on Sun Feb 22 10:54:24 2015

@author: Administrator
"""

import sys
import fileinput
import string
import os
import random

class Parser:
    def __init__(self,objFilePath,mtlFilePath):
        self.objFilePath = objFilePath;
        self.mtlFilePath = mtlFilePath;
        self.faces = {};
        self.facesVertexIndices = []
        self.faceNormalsIndices = []
        self.faceTextureIndices = []
        self.vertexNormals = []
        self.vertexTextures = []       
        self.vertices = []
        self.materials = {}
        self.meshVertex = []#reconstructed vertex
        self.meshVertexNormal = []#reconstructed vertex normal
        self.meshFaceIndex = {}
    
    def ReconstructVBO(self):
      faceIdx = 0
      for key in self.faces.keys():
        if key not in self.meshFaceIndex.keys():
          self.meshFaceIndex[key] = []
        if len(self.faces[key]['v'])!= len(self.faces[key]['vn']):
          print 'Error in %s: length of vertex and normals are not equal'%key
          return False
        size = len(self.faces[key]['v'])
        for i in range(size):
          vIdx = self.faces[key]['v'][i]
          vnIdx = self.faces[key]['vn'][i]
          self.meshVertex.append(self.vertices[vIdx[0]])
          self.meshVertexNormal.append(self.vertexNormals[vnIdx[0]])
          self.meshFaceIndex[key].append(faceIdx)
          faceIdx += 1
          self.meshVertex.append(self.vertices[vIdx[1]])
          self.meshVertexNormal.append(self.vertexNormals[vnIdx[1]])
          self.meshFaceIndex[key].append(faceIdx)
          faceIdx += 1
          self.meshVertex.append(self.vertices[vIdx[2]])
          self.meshVertexNormal.append(self.vertexNormals[vnIdx[2]])
          self.meshFaceIndex[key].append(faceIdx)
          faceIdx += 1
      print 'Total Faces=%d'%faceIdx
      
    def WriteReconstructedVBO(self):
      if not os.path.exists('Mesh_Output'):
        os.makedirs('Mesh_Output')
      for key in self.meshFaceIndex.keys():
        count = 0;
        with open('Mesh_Output/mesh_index_%s.txt'%key,'w') as f:
          f.write('%s_IndexArray = new Uint16Array(\n'%key)
          f.write('[\n')
          for idx in self.meshFaceIndex[key]:
            f.write('%d,'%idx)
            count = count+1
            if count%3 == 0:
              f.write('\n')
          f.write(']);\n')
      with open('Mesh_Output/mesh_vertex.txt','w') as f:
        f.write('vertexArray = new Float32Array(\n')
        f.write('[\n')
        for vertex in self.meshVertex:
          f.write('%5.5f,%5.5f,%5.5f,%5.5f,\n'%(vertex[0],vertex[1],vertex[2],1.0))
        f.write(']);\n')
      with open('Mesh_Output/mesh_vertex_with_random_color.txt','w') as f:
        f.write('vertexColorArray = new Float32Array(\n')
        f.write('[\n')
        color = [0,0,0]
        for vertex in self.meshVertex:
          color[0]=0
          color[1]=0
          color[2]=0
          idx = random.randint(0,2)
          color[idx] = 1
          f.write('%5.5f,%5.5f,%5.5f,\n'%(color[0],color[1],color[2]))
        f.write(']);\n')
      with open('Mesh_Output/mesh_vertex_normal.txt','w') as f:
        f.write('vertexNormalArray = new Float32Array(\n')
        f.write('[\n')
        for vn in self.meshVertexNormal:
          f.write('%5.5f,%5.5f,%5.5f,\n'%(vn[0],vn[1],vn[2]))
        f.write(']);\n')
          
      
        
    def DoParseMaterialFile(self):
        cur_key=''
        for inp in fileinput.input(self.mtlFilePath):
            items = inp.split()
            if len(items) == 0:
                cur_key=''
                continue
            if items[0] == 'newmtl' and len(items) > 1:
                cur_key = items[1]
                self.materials[cur_key] = {}
                continue
            if items[0][0] =='K' and len(items)==4:
                self.materials[cur_key][items[0]] = items[1:]
                continue               

    def WriteVertexFiles(self):
        if not os.path.exists('Output'):
            os.makedirs('Output')
        with open('Output/vertex.txt','w') as f:
            f.write('vertexArray = new Float32Array(\n')
            f.write('[\n')
            for vertex in self.vertices:
                f.write('%5.5f,%5.5f,%5.5f,%5.5f,\n'%(vertex[0],vertex[1],vertex[2],1.0))
            f.write(']);\n')
        with open('Output/vertex_normals.txt','w') as f:
            f.write('vertexNormalArray = new Float32Array(\n')
            f.write('[\n')
            for vn in self.vertexNormals:
                f.write('%5.5f,%5.5f,%5.5f,\n'%(vn[0],vn[1],vn[2]))
            f.write(']);\n')
            
    def WriteFaceFiles(self):
        if not os.path.exists('Output'):
            os.makedirs('Output')
        with open('Output/face.txt','w') as f:
            for key in self.faces.keys():
                f.write('%sIndexArray = new Uint16Array(\n'%key)
                f.write('[\n')
                for v in self.faces[key]['v']:
                    f.write('%d,%d,%d,\n'%(v[0],v[1],v[2]))
                f.write('\]);\n')
#                #write normals
                f.write('%sNormalArray = new Float32Array([\n'%key)
                f.write('\n')
                for vnIdx in self.faces[key]['vn']:
                    #print self.vertexNormals[vnIdx[0]]
                    f.write('%5.5f,%5.5f,%5.5f,\n'%(self.vertexNormals[vnIdx[0]][0],\
                    self.vertexNormals[vnIdx[0]][1],\
                    self.vertexNormals[vnIdx[0]][2]))
                    f.write('%5.5f,%5.5f,%5.5f,\n'%(self.vertexNormals[vnIdx[1]][0],\
                    self.vertexNormals[vnIdx[1]][1],\
                    self.vertexNormals[vnIdx[1]][2]))
                    f.write('%5.5f,%5.5f,%5.5f,\n'%(self.vertexNormals[vnIdx[2]][0],\
                    self.vertexNormals[vnIdx[2]][1],\
                    self.vertexNormals[vnIdx[2]][2]))
                f.write(']);\n')
                
    def WriteMultileFaceFiles(self):
        for key in self.faces.keys():
            with open('Output/%s.txt'%key,'w') as f:
                f.write('%sIndexArray = new Uint16Array(\n'%key)
                f.write('[\n')
                for v in self.faces[key]['v']:
                    f.write('%d,%d,%d,\n'%(v[0],v[1],v[2]))
                f.write(']);\n')
#                #write normals
                f.write('%sNormalArray = new Float32Array([\n'%key)
                f.write('\n')
                for vnIdx in self.faces[key]['vn']:
                    #print self.vertexNormals[vnIdx[0]]
                    f.write('%5.5f,%5.5f,%5.5f,\n'%(self.vertexNormals[vnIdx[0]][0],\
                    self.vertexNormals[vnIdx[0]][1],\
                    self.vertexNormals[vnIdx[0]][2]))
                    f.write('%5.5f,%5.5f,%5.5f,\n'%(self.vertexNormals[vnIdx[1]][0],\
                    self.vertexNormals[vnIdx[1]][1],\
                    self.vertexNormals[vnIdx[1]][2]))
                    f.write('%5.5f,%5.5f,%5.5f,\n'%(self.vertexNormals[vnIdx[2]][0],\
                    self.vertexNormals[vnIdx[2]][1],\
                    self.vertexNormals[vnIdx[2]][2]))
                f.write(']);\n')
                f.write('%sAmbientColor = new Float32Array([\n'%key)
                f.write('\n')
                kColor = self.faces[key]['material']['Ka']
                print kColor
                f.write('%s,%s,%s\n'%(kColor[0],kColor[1],kColor[2]))
                f.write(']);\n')
                f.write('%sAmbientColor = new Float32Array([\n'%key)
                f.write('\n')
                kColor = self.faces[key]['material']['Kd']
                print kColor
                f.write('%s,%s,%s\n'%(kColor[0],kColor[1],kColor[2]))
                f.write(']);\n')
                f.write('%sVertexArray = new Float32Array(\n'%key)
                f.write('[\n')
                #get all vertex
                vIdxList = []
                f.write('%sVertexCoordinates = new Float32Array([\n'%key)
                sum_x = 0
                sum_y = 0
                sum_z = 0
                count = 0
                for vIdx in self.faces[key]['v']:
                  if not vIdx[0] in vIdxList:
                    vIdxList.append(vIdx[0])
                    v = self.vertices[vIdx[0]]
                    sum_x+=v[0]
                    sum_y+=v[1]
                    sum_z+=v[2]
                    count+=1
                    f.write('%5.5f,%5.5f,%5.5f\n'%(v[0],v[1],v[2]))
                  if not vIdx[1] in vIdxList:
                    vIdxList.append(vIdx[1])
                    v = self.vertices[vIdx[1]]
                    sum_x+=v[0]
                    sum_y+=v[1]
                    sum_z+=v[2]
                    count+=1
                    f.write('%5.5f,%5.5f,%5.5f\n'%(v[0],v[1],v[2]))
                  if not vIdx[2] in vIdxList:
                    vIdxList.append(vIdx[2])
                    v = self.vertices[vIdx[2]]
                    sum_x+=v[0]
                    sum_y+=v[1]
                    sum_z+=v[2]
                    count+=1
                    f.write('%5.5f,%5.5f,%5.5f\n'%(v[0],v[1],v[2]))
                f.write(']);\n')
                f.write('The centroid=%5.5f,%5.5f,%5.5f\n'%(sum_x/count,sum_y/count,sum_z/count))
        
    
    def DoParseObjFile(self):
        cur_key = ''
        for inp in fileinput.input(self.objFilePath):
            items = inp.split()
            if len(items) == 0:
                cur_key=''
                continue
            if items[0]=='v' and len(items)==4:
                self.vertices.append([string.atof(item) for item in items[1:]])
                continue
            if items[0]=='vt' and len(items)==4:
                self.vertexTextures.append([string.atof(item) for item in items[1:]])
                continue
            if items[0]=='vn' and len(items)==4:
                self.vertexNormals.append([string.atof(item) for item in items[1:]])
                continue
            if items[0]=='g' and len(items)==2:
                cur_key = items[1]
                self.faces[cur_key] = {}
                self.faces[cur_key]['v'] = []
                self.faces[cur_key]['vt'] = []
                self.faces[cur_key]['vn'] = []
                continue
            if items[0] == 'usemtl' and len(items) > 1:
                self.faces[cur_key]['material'] = self.materials[items[1]]
                continue
            if items[0] == 'f' and len(items) == 4:
                #f  9/4/2 10/3/2 11/1/2
                vnt_list_1 = items[1].split('/')
                vnt_list_2 = items[2].split('/')
                vnt_list_3 = items[3].split('/')
                if len(vnt_list_1)==3 and len(vnt_list_2)==3 and len(vnt_list_3)==3:
                    v1 = string.atoi(vnt_list_1[0])-1
                    v2 = string.atoi(vnt_list_2[0])-1
                    v3 = string.atoi(vnt_list_3[0])-1;
                    self.faces[cur_key]['v'].append([v1,v2,v3])
                    v1 = 0
                    v2 = 0
                    v3 = 0
                    if len(vnt_list_1[1]) > 0:
                      v1 = string.atoi(vnt_list_1[1])-1
                    if len(vnt_list_2[1]) > 0:
                      v2 = string.atoi(vnt_list_2[1])-1
                    if len(vnt_list_3[1]) > 0:
                      v3 = string.atoi(vnt_list_3[1])-1;
                    self.faces[cur_key]['vt'].append([v1,v2,v3])
                    v1 = string.atoi(vnt_list_1[2])-1
                    v2 = string.atoi(vnt_list_2[2])-1
                    v3 = string.atoi(vnt_list_3[2])-1;
                    self.faces[cur_key]['vn'].append([v1,v2,v3])
                    
        

#Test
if __name__== '__main__':
    objFile = sys.argv[1]
    mtlFile = sys.argv[2]
    parser = Parser(objFile,mtlFile)
    parser.DoParseMaterialFile()
    parser.DoParseObjFile()
    
    print parser.faces.keys()

    
    print 'Normal Length=%d'%len(parser.vertexNormals)
    print 'Vertex Length=%d'%len(parser.vertices)
    print 'Texture Length=%d'%len(parser.vertexTextures)
    
    faceSum = 0;
    for key in parser.faces.keys():
        faceSum += len(parser.faces[key]['v'])
        print 'key:%s v length=%d'%(key,len(parser.faces[key]['v']))
        print 'key:%s vt length=%d'%(key,len(parser.faces[key]['vt']))
        print 'key:%s vn length=%d'%(key,len(parser.faces[key]['vn']))
    print 'Total Faces=%d'%faceSum
    
    parser.WriteVertexFiles()
    parser.WriteMultileFaceFiles()
    parser.ReconstructVBO()
    parser.WriteReconstructedVBO()
    
      
    
    