# -*- coding: utf-8 -*-

import numpy as np
import fileinput

S = np.matrix([[0.0, 0.0, 0.0, 0.0]]).T
P = 10000.00*np.eye(4)
#P = 0.1
dt = 33.0
H = np.matrix([[1.0, 0.0, dt, 0.0],
              [0.0, 1.0, 0.0, dt],
              [0.0, 0.0, 1.0, 0.0],
              [0.0, 0.0, 0.0, 1.0]])
F = np.matrix([[1.0, 0.0, 0.0, 0.0],
              [0.0, 1.0, 0.0, 0.0]])
              
ra = 1.0**2

R = np.matrix([[ra,0.0],[0.0,ra]])

sv = 1.00

G = np.matrix([[0.5*dt**2],
               [0.5*dt**2],
               [dt],
               [dt]])

Q = G*G.T
#P = Q*0.01**3

I = np.eye(4)

obs_data = [ln.split() for ln in fileinput.input('data.txt')]
x_pos = [float(item[0]) for item in obs_data]
y_pos = [float(item[1]) for item in obs_data]
mx = np.array(x_pos)
my = np.array(y_pos)

x = []
y = []

#S = np.matrix([[x_pos[0], y_pos[0], 0.0, 0.0]]).T

for i in range(len(obs_data)):
    #if i>10:
        #R = np.matrix([[np.std(mx[i-10:i])**2,0.0],[0.0,np.std(my[i-10:i])**2]])
    S = H*S
    P = H*P*H.T + Q   
    V = F*P*F.T + R   
    K = (P*F.T)*np.linalg.pinv(V)
    DELTA = np.matrix([mx[i],my[i]]).T - (F*S)
    S = S + (K*DELTA)
    P = (I - (K*F))*P
    
        
    x.append(float(S[0]))
    y.append(float(S[1]))
        
print x
print y    

