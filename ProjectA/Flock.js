AgentConfig = function () {
    this.maxV = 30;
    this.minV = 8;
    this.maxA = 30;
    this.maxF = 0.5;

    this.maxPredatorV = 18;
    this.maxPredatorA = 18;
    this.minPredatorV = 5;

    this.Rc = 30; //randomSpread(150,30);
    this.Rs = 8; //randomSpread(150,30);
    this.Ra = 15; //randomSpread(150,30);
    this.Rp = 40; //the r to predators;

    this.Kc = 60; //randomSpread(200,100);
    this.Ks = 80; //randomSpread(200,100);
    this.Ka = 60; //randomSpread(200,100);
    this.Kp = 200;

    this.boundMin = vec3.fromValues(-100, -10, -100);
    this.boundMax = vec3.fromValues(100, 80, 100);

    this.maxFOV = 120.0 * Math.PI / 180.0;

    this.wanderJitter = 10;
    this.wanderRadius = 5;
    this.wanderDistance = 12;

}

AgentConfig.prototype.constructor = AgentConfig;

const AGENT_MAXV = 0;
const AGENT_MAXA = 1;
const AGENT_RC = 2;
const AGENT_RS = 3;
const AGENT_RA = 4;
const AGENT_KC = 5;
const AGENT_KS = 6;
const AGENT_KA = 7;
const AGENT_R = 8;
const AGENT_CONFIG_NUM = 9;

const BOID_R = 2;

//center---Apex---left----right
//At first, the y value is the same

Flocking = function (num, cont) {
    SimBase.prototype.constructor.call(this);
    this.numBoids = num;
    //add predator
    this.numPredators = 3;
    this.totalPoints = (num + this.numPredators) * 6;
    this.startOff = cont.nextOff;
    cont.nextOff += this.totalPoints * PART_MAXVAR;
    this.S_cur = cont.meshes.curVert.subarray(this.startOff, this.startOff + this.totalPoints * PART_MAXVAR);
    this.S_old = cont.meshes.oldVert.subarray(this.startOff, this.startOff + this.totalPoints * PART_MAXVAR);

    this.startDotOff = cont.nextDotOff;
    cont.nextDotOff += this.totalPoints * DOT_PART_TOTAL;
    this.dotStat = cont.dotStat.subarray(this.startDotOff, this.startDotOff + (this.totalPoints) * DOT_PART_TOTAL);
    this.agentConfig = new Float32Array(AGENT_CONFIG_NUM);
    this.tempStat = cont.tempStat;
    this.dt = 18 / 1000;
    this.config = new AgentConfig();
    this.name = 'flock';
    this.heading = [1,0,0];//iniital orientation of boid
    this.normVel = vec3.create(); //the normal vector of velocity
    this.rotQuat = quat.create(); //the roation quaternion to align 2 vectors
    this.wanderTarget = vec3.create();
    //    this.rotQuat = quat.clone([0,0,0,0]); //the roation quaternion to align 2 vectors
    //	this.dt = 1.0/100;
}

Flocking.prototype = Object.create(SimBase.prototype);
Flocking.prototype.constructor = Flocking;

Flocking.prototype.initSim = function () {
    //Initialize
//    var posGen = new SphereZone([-10, 20, 10], 30, 0);
    var posGen = new Array();
    posGen.push(new SphereZone([20,0,20], 80, 0));
    posGen.push(new SphereZone([-20,0,-20], 80, 0));
    posGen.push(new SphereZone([20,0,-20], 80, 0));
    posGen.push(new SphereZone([-20,0,20], 80, 0));
    posGen.push(new SphereZone([0,0,0], 80,20));
    var velGen = new SphereZone([5*Math.random(),0,3.5*Math.random()],5);
    var predatorVelGen = new SphereZone([2*Math.random(),1.5,1.5*Math.random()],2);

    var offset, curPos, curVel, curClr;
    var oldPos, oldVel, oldClr;
    var pos,vel,clr;
    this.boidSize = 3;
    var r = this.boidSize;
    var indices = [];
    //we are generating 4 vertices for each point
    for (var i = 0; i < this.numBoids + this.numPredators; ++i) {

        offset = 6 * i * PART_MAXVAR; //This is the center;

        if(i >= this.numBoids)
        {
            r = this.boidSize*2;
        }

        //		this.faces[i] = i;
        //		var off = i * PART_MAXVAR;
        curPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        curVel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        curClr = this.S_cur.subarray(offset + PART_R, offset + PART_R + 4);

        oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        oldVel = this.S_old.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        oldClr = this.S_old.subarray(offset + PART_R, offset + PART_R + 4);
        vec3.copy(curPos, posGen[i%4].getValue());
        if(i>=this.numBoids)
        {
            vec3.copy(curPos,posGen[4].getValue());
        }

        if(curPos[1]<0 || curPos[1]>30)
        {
            curPos[1] = getRandomArbitrary(0,30);
        }

        vec3.copy(curVel,velGen.getValue());
//        vec3.copy(curVel, [getRandomArbitrary(-10, 10), 0, getRandomArbitrary(-5, 5)]);
        vec3.copy(oldPos, curPos);
        vec3.copy(oldVel, curVel);

        this.S_cur[offset + PART_MASS] = 1.0;
        this.S_old[offset + PART_MASS] = this.S_cur[offset + PART_MASS];

        this.S_cur[offset + PART_DIAM] = 20;
        this.S_old[offset + PART_DIAM] = this.S_cur[offset + PART_DIAM];

        //		vec4.copy(clr, [getRandomArbitrary(0, 0.5), getRandomArbitrary(0.5, 1), getRandomArbitrary(0.5, 1), 1.0]);
        vec4.copy(curClr,[0.6,1.0,1.0,1.0]);
        if(i>=this.numBoids)
        {
            vec4.copy(curClr,[1.0,0.8,0.6,1.0]);
        }

        vec4.copy(oldClr, curClr);

        //the apex
        offset = (6*i+1)*PART_MAXVAR;
        pos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        vel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        clr = this.S_cur.subarray(offset + PART_R, offset + PART_R + 4);

        oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        oldVel = this.S_old.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        oldClr = this.S_old.subarray(offset + PART_R, offset + PART_R + 4);

        vec3.copy(pos,curPos);
        vec3.add(pos,pos,[r,0,0]);
        vec3.copy(vel,curVel);
        vec3.copy(clr,curClr);
        vec3.copy(oldPos,pos);
        vec3.copy(oldVel,vel);
        vec3.copy(oldClr,clr);

        //the left point
        offset = (6*i+2)*PART_MAXVAR;
        pos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        vel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        clr = this.S_cur.subarray(offset + PART_R, offset + PART_R + 4);

        oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        oldVel = this.S_old.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        oldClr = this.S_old.subarray(offset + PART_R, offset + PART_R + 4);

        vec3.copy(pos,curPos);
        vec3.add(pos,pos,[-r*Math.cos(Math.PI/3),0,-r*Math.sin(Math.PI/3)]);
        vec3.copy(vel,curVel);
        vec3.copy(clr,curClr);
        vec3.copy(oldPos,pos);
        vec3.copy(oldVel,vel);
        vec3.copy(oldClr,clr);

        //the center---we have to repeat the point to easily make face
        offset = (6*i+3)*PART_MAXVAR;
        pos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        vel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        clr = this.S_cur.subarray(offset + PART_R, offset + PART_R + 4);

        oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        oldVel = this.S_old.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        oldClr = this.S_old.subarray(offset + PART_R, offset + PART_R + 4);

        vec3.copy(pos,curPos);
        vec3.copy(vel,curVel);
        vec3.copy(clr,curClr);
        vec3.copy(oldPos,pos);
        vec3.copy(oldVel,vel);
        vec3.copy(oldClr,clr);


        //the apex---repeat again
        offset = (6*i+4)*PART_MAXVAR;
        pos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        vel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        clr = this.S_cur.subarray(offset + PART_R, offset + PART_R + 4);

        oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        oldVel = this.S_old.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        oldClr = this.S_old.subarray(offset + PART_R, offset + PART_R + 4);

        vec3.copy(pos,curPos);
        vec3.add(pos,pos,[r,0,0]);
        vec3.copy(vel,curVel);
        vec3.copy(clr,curClr);
        vec3.copy(oldPos,pos);
        vec3.copy(oldVel,vel);
        vec3.copy(oldClr,clr);


        //the right point
        offset = (6*i+5)*PART_MAXVAR;
        pos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        vel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        clr = this.S_cur.subarray(offset + PART_R, offset + PART_R + 4);

        oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        oldVel = this.S_old.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        oldClr = this.S_old.subarray(offset + PART_R, offset + PART_R + 4);

        vec3.copy(pos,curPos);
        vec3.add(pos,pos,[-r*Math.cos(Math.PI/3),0,r*Math.sin(Math.PI/3)]);
        vec3.copy(vel,curVel);
        vec3.copy(clr,curClr);
        vec3.copy(oldPos,pos);
        vec3.copy(oldVel,vel);
        vec3.copy(oldClr,clr);

        //make faces
        //0,1,2
        indices.push(6*i);
        indices.push(6*i+1);
        indices.push(6*i+2);

        //0,3,1
        indices.push(6*i+3);
        indices.push(6*i+5);
        indices.push(6*i+4);

        //        this.rotateBoid(i,curVel);
    }

    this.faces = new Uint16Array(indices);
    //add wall constraints

    this.constraints.push(new WallConstraint([0, -1, 0], [500, 0, 0], [0, 0, -500], [0, 60, 0]));
    this.constraints.push(new WallConstraint([0, 1, 0], [500, 0, 0], [0, 0, 500], [0, 0, 0]));
    this.constraints.push(new WallConstraint([0, 0, -1], [-500, 0, 0], [0, 500, 0], [0, 0, 100]));
    this.constraints.push(new WallConstraint([0, 0, 1], [500, 0, 0], [0, 500, 0], [0, 0, -100]));
    this.constraints.push(new WallConstraint([-1, 0, 0], [0, 500, 0], [0, 0, -500], [100, 0,0]));
    this.constraints.push(new WallConstraint([1, 0, 0], [0, 500, 0], [0, 0, 500], [-100, 0, 0]));
}



Flocking.prototype.renderFlock = function(gl,modelMat,projectMat,viewMat,quatMatrix,mvpMatrix,u_MvpMatrix)
{
    var i;
    var offset;
    var curPos,curVel;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.faces, gl.DYNAMIC_DRAW);

//    modelMatrix.setIdentity();
    for(i = 0;i<this.numBoids + this.numPredators;++i)
    {
        offset = (6*i) * PART_MAXVAR;
        curPos = this.S_cur.subarray(offset+PART_XPOS,offset+PART_XPOS+3);
        curVel = this.S_cur.subarray(offset+PART_XVEL,offset+PART_XVEL+3);
        vec3.normalize(this.normVel,curVel);
        quat.rotationTo(this.rotQuat,this.heading,this.normVel);
        pushMatrix(modelMat);
        modelMat.translate(curPos[0],curPos[1],curPos[2]);
        quatMatrix.setFromQuat(this.rotQuat[0],this.rotQuat[1],this.rotQuat[2],this.rotQuat[3]);
        modelMat.concat(quatMatrix);
        modelMat.translate(-curPos[0],-curPos[1],-curPos[2]);
        mvpMatrix.set(projectMat).multiply(viewMat).multiply(modelMat);
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, i*6*2);
        modelMat = popMatrix();
    }

//    for(i = this.numBoids;i<this.numBoids + this.numPredators;++i)
//    {
//        offset =
//    }
}


Flocking.prototype.isInFOV = function (vOA, agentVel) {

    return true;
    var theta = getAngle(agentVel, vOA);
    //	console.log(theta*180/Math.PI);

    if (theta < this.config.maxFOV) {
        return true;
    }

    return false;
}

Flocking.prototype.applyForce = function (idx) {
    var centroid = vec3.fromValues(0, 0, 0);
    var neighbors = {}; //[c,s,a];
    neighbors.s = 0;
    neighbors.c = 0;
    neighbors.a = 0;
    neighbors.p = 0; //predators
    //	var numNeighbors = 0;

    var c = vec3.fromValues(0, 0, 0); //cohension
    var s = vec3.fromValues(0, 0, 0); //separation
    var a = vec3.fromValues(0, 0, 0); //alignment
    var f = vec3.create();//fleet

    var vOA = vec3.fromValues(0, 0, 0); //O-A
    var vAO = vec3.create();
    //	var vAO = vec3.fromValues(0,0,0); //A-O
    var agentPos = this.S_cur.subarray(6* idx * PART_MAXVAR + PART_XPOS, 6*idx * PART_MAXVAR + PART_XPOS + 3);
    var agentVel = this.S_cur.subarray(6* idx * PART_MAXVAR + PART_XVEL, 6*idx * PART_MAXVAR + PART_XVEL + 3);
    var agentAcc = this.dotStat.subarray(6 * idx * DOT_PART_TOTAL + DOT_PART_XVEL, 6*idx * DOT_PART_TOTAL + DOT_PART_XVEL + 3);
    //	vec3.copy(acc,centroid);
    //	return;
    var i, offset;
    var otherPos, otherVel;
    var dist;
    for (var i = 0; i < this.numBoids; ++i) {

        offset = 6* i * PART_MAXVAR;
        if (i === idx) continue;
        otherPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        otherVel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        dist = vec3.distance(agentPos, otherPos);

        vec3.sub(vAO,agentPos,otherPos);
        vec3.sub(vOA, otherPos, agentPos);
//        vec3.scale(vAO,vOA,-1);


        if (dist < this.config.Rc) {
            if (this.isInFOV(vOA, agentVel)) {
                vec3.add(centroid, centroid, otherPos);
                ++neighbors.c;
            }
        }


        if (dist < this.config.Rs) {
            //			vec3.add(centroid[1],centroid[1],other);
            //var toAgent = vec3.sub(vec3.create(),agentPos,otherPos);
            //var dist = vec3.distance(agentPos,other);
            if (dist > 0) {
                //				vec3.normalize(toAgent,toAgent);
                if (this.isInFOV(vOA, agentVel)) {
                    vec3.normalize(vAO,vAO);
                    vec3.scaleAndAdd(s, s, vAO, 1.0 / dist);
                    ++neighbors.s;
                }
            }
        }

        if (dist < this.config.Ra) {
            if (this.isInFOV(vOA, agentVel)) {
                vec3.add(a, a, otherVel);
                ++neighbors.a;
            }
        }
    }

    if (neighbors.c > 0) {
        vec3.scale(centroid, centroid, 1.0 / neighbors.c);
        vec3.sub(c, centroid, agentPos);
        vec3.normalize(c, c);
        vec3.scale(c,c,this.config.maxV);
        vec3.sub(c,c,agentVel);
        vec3.normalize(c,c);
//        vec3.scale(c,c,this.config.maxF);
    }

    if (neighbors.s > 0) {
        //		vec3.scale(centroid[1],centroid[1],1.0/neighbors[0]);
        //		vec3.sub(c,centroid[0],agent);
//        vec3.normalize(s, s);
        vec3.scale(s,s,this.config.maxV);
//        vec3.scale(s,s,1.0/neighbors.s);
        vec3.sub(s,s,agentVel);
        vec3.normalize(s,s);
    }

    if (neighbors.a > 0) {
        //		vec3.scale(a,a,1.0/neighbors.a);
        //		vec3.sub(a,a,agentVel);
//        vec3.normalize(a, a);
        vec3.scale(a,a,this.config.maxV);
//        vec3.scale(a,a,1.0/neighbors.a);
        vec3.sub(a,a,agentVel);
        vec3.normalize(a,a);
    }

//    vec3.copy(agentAcc, [0, 0, 0]);
    vec3.scale(agentAcc,agentAcc,0.0);
    vec3.scaleAndAdd(agentAcc, agentAcc, c, this.config.Kc);
    vec3.scaleAndAdd(agentAcc, agentAcc, s, this.config.Ks);
    vec3.scaleAndAdd(agentAcc, agentAcc, a, this.config.Ka);


    //avoid predators
    for(i=this.numBoids;i<this.numBoids+this.numPredators;++i)
    {
        offset = 6* i * PART_MAXVAR;
        if (i === idx) continue;
        otherPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        otherVel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        dist = vec3.distance(agentPos, otherPos);

        if(dist<this.config.Rp)
        {
            //predator is found
            ++neighbors.p;
           vec3.sub(vAO,agentPos,otherPos);

            vec3.add(f,f,vAO);
        }

    }

    if(neighbors.p>0)
    {
        vec3.normalize(f,f);
            vec3.scale(f,f,this.config.maxV);
            vec3.sub(f,f,agentVel);
        vec3.normalize(f,f);
        vec3.scaleAndAdd(agentAcc,agentAcc,f,this.config.Kp);
    }

    if (vec3.length(agentAcc) > this.config.maxA) {
        vec3.normalize(agentAcc, agentAcc);
        vec3.scale(agentAcc, agentAcc, this.config.maxA);
    }

    //we have to update the other 5 points accelearation, only copy
//    acc = this.dotStat.subarray((6 * idx + 1) * DOT_PART_TOTAL + DOT_PART_XVEL, idx * DOT_PART_TOTAL + DOT_PART_XVEL + 3);
//    vec3.copy(acc,agentAcc);
//    acc = this.dotStat.subarray((6 * idx + 2) * DOT_PART_TOTAL + DOT_PART_XVEL, idx * DOT_PART_TOTAL + DOT_PART_XVEL + 3);
//    vec3.copy(acc,agentAcc);
//    acc = this.dotStat.subarray((6 * idx + 3) * DOT_PART_TOTAL + DOT_PART_XVEL, idx * DOT_PART_TOTAL + DOT_PART_XVEL + 3);
//    vec3.copy(acc,agentAcc);
//    acc = this.dotStat.subarray((6 * idx + 4) * DOT_PART_TOTAL + DOT_PART_XVEL, idx * DOT_PART_TOTAL + DOT_PART_XVEL + 3);
//    vec3.copy(acc,agentAcc);
//    acc = this.dotStat.subarray((6 * idx + 5) * DOT_PART_TOTAL + DOT_PART_XVEL, idx * DOT_PART_TOTAL + DOT_PART_XVEL + 3);
//    vec3.copy(acc,agentAcc);
}

Flocking.prototype.dotFinder = function () {
        this.dt = this.timeStep * 1.5/1000;
    //	var rc = this.agentConfig[AGENT_RC];
    for (var i = 0; i < this.numBoids; ++i) {
        //		var off = i*PART_MAXVAR;
        this.applyForce(i);
    }
}

Flocking.prototype.updateBoid = function(centerIdx)
{
    var offset = 6 * centerIdx * PART_MAXVAR;
    var curPos = this.S_cur.subarray(offset+PART_XPOS,offset+PART_XPOS+3);
    var r = this.boidSize;
    //update apex
    offset = (6*centerIdx+1)*PART_MAXVAR;
    var pos = this.S_cur.subarray(offset+PART_XPOS,offset+PART_XPOS+3);
    vec3.copy(pos,curPos);
    vec3.add(pos,pos,[r,0,0]);
    //left point
    offset = (6*centerIdx+2)*PART_MAXVAR;
    pos = this.S_cur.subarray(offset+PART_XPOS,offset+PART_XPOS+3);
    vec3.copy(pos,curPos);
    vec3.add(pos,pos,[-r*Math.cos(Math.PI/3),0,-r*Math.sin(Math.PI/3)]);
    //center again
    offset = (6*centerIdx+3)*PART_MAXVAR;
    pos = this.S_cur.subarray(offset+PART_XPOS,offset+PART_XPOS+3);
    vec3.copy(pos,curPos);
    //apex again
    offset = (6*centerIdx+4)*PART_MAXVAR;
    pos = this.S_cur.subarray(offset+PART_XPOS,offset+PART_XPOS+3);
    vec3.copy(pos,curPos);
    vec3.add(pos,pos,[r,0,0]);
    //right point
    offset = (6*centerIdx+5)*PART_MAXVAR;
    pos = this.S_cur.subarray(offset+PART_XPOS,offset+PART_XPOS+3);
    vec3.copy(pos,curPos);
    vec3.add(pos,pos,[-r*Math.cos(Math.PI/3),0,r*Math.sin(Math.PI/3)]);
}

Flocking.prototype.solver = function () {
    var temp = this.tempStat.subarray(PART_TEMP_X0, PART_TEMP_X0 + 3);
    var temp1 = this.tempStat.subarray(PART_TEMP_X1, PART_TEMP_X1 + 3);

    var offset, dotOff;
    var curVal,oldVal,curPos,oldPos,acc;
    var maxV = this.config.maxV;
    var minV = this.config.minV;
    for (var i = 0; i < this.numBoids + this.numPredators; ++i) {
        offset = 6 * i * PART_MAXVAR;
        dotOff = 6 * i * DOT_PART_TOTAL;

        curVel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        oldVel = this.S_old.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        curPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        acc = this.dotStat.subarray(dotOff + DOT_PART_XVEL, dotOff + DOT_PART_XVEL + 3);


        vec3.copy(temp, curVel);
        vec3.scaleAndAdd(curVel, curVel, acc, this.dt);
        //		vec3.scaleAndAdd(curVel,curVel,acc,this.dt);
        vec3.copy(oldVel, temp);

        if(i > this.numBoids)
        {
            maxV = this.config.maxPredatorV;
            minV = this.config.minPredatorV;
        }

        if (vec3.length(curVel) > maxV) {
            vec3.normalize(curVel, curVel);
            vec3.scale(curVel, curVel, maxV);
        } else if (vec3.length(curVel) < minV) {
            vec3.normalize(curVel, curVel);
            vec3.scale(curVel, curVel, minV);
        }

        vec3.copy(temp1, curPos);
        //		vec3.scaleAndAdd(curPos,oldPos,curVel,this.dt);
        vec3.scaleAndAdd(curPos, curPos, curVel, this.dt);
        vec3.copy(oldPos, temp1);
    }

    //update predators' position using jitter
//    this.wanderJitter = 10;
//    this.wanderRadius = 5;
//    this.wanderDistance = 12;

//    var jitter;
//    var wanderTarget = vec3.create();
//    for(i = this.numBoids;i<this.numBoids+this.numPredators;++i)
//    {
//       offset = 6 * i * PART_MAXVAR;
//        curVel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
//        oldVel = this.S_old.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
//        curPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
//        oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);

//        vec3.copy(temp,curPos);

//        //calculate jitter
//        jitter = this.wanderJitter*this.dt;
//        vec3.add(wanderTarget,wanderTarget,[jitter*getRandomArbitrary(-1,1),jitter*getRandomArbitrary(-1,1),jitter*getRandomArbitrary(-1,1)]);
//        vec3.normalize(wanderTarget,wanderTarget);
//        vec3.scale(wanterTarget,wanderTarget,this.conf.wanderRadius);
//    }
}

function WrapAround(val, min, max) {
    var wrapVal = val;

    if (wrapVal > max) {
        wrapVal = min;
    } else if (wrapVal < min) {
        wrapVal = max;
    }

    return wrapVal;
}

Flocking.prototype.applyContraints = function () {
    //	return ;
    var offset,curPos,oldPos;
    var cs,i,j;
    var curVel;
//    console.log(this.constraints.length);
    for (i = 0; i < this.numBoids + this.numPredators; ++i) {
        offset = 6 *i * PART_MAXVAR;
        curPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        curVel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);


        for(j = 0;j<this.constraints.length;++j)
        {
            cs = this.constraints[j];
            cs.satisfy(curPos, oldPos, curVel);
        }

//        curPos[0] = WrapAround(curPos[0], this.config.boundMin[0], this.config.boundMax[0]);
//        curPos[1] = WrapAround(curPos[1], this.config.boundMin[1], this.config.boundMax[1]);
//        curPos[2] = WrapAround(curPos[2], this.config.boundMin[2], this.config.boundMax[2]);
        this.updateBoid(i);

        //		console.log(curPos);

        //		if(curPos[0]>this.config.boundMax[0])
        //		{
        //			curPos[0] = WrapAround(curPos[0],this.config.boundMax[0],this.config.boundMax[1]);
        //		}
        //update other parts
    }
}
