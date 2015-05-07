AgentConfig = function () {
	this.maxV = 30;
	this.minV = 5;
	this.maxA = 20;

	this.Rc = 30; //randomSpread(150,30);
	console.log(this.Rc);
	this.Rs = 8; //randomSpread(150,30);
	console.log(this.Rs);

	this.Ra = 15; //randomSpread(150,30);
	console.log(this.Ra);

	this.Kc = 60; //randomSpread(200,100);
	this.Ks = 80; //randomSpread(200,100);
	this.Ka = 30; //randomSpread(200,100);

	this.boundMin = vec3.fromValues(-50, -20, -80);
	this.boundMax = vec3.fromValues(50, 60, 80);

	this.maxFOV = 120.0 * Math.PI / 180.0;
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
    this.totalPoints = num * 6;
	this.numBoids = num;
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
	//	this.dt = 1.0/100;
}

Flocking.prototype = Object.create(SimBase.prototype);
Flocking.prototype.constructor = Flocking;

Flocking.prototype.initSim = function () {
	//Initialize
	var posGen = new SphereZone([-10, 20, 10], 30, 0);
	//var velGen = new SphereZone([5*Math.random(),0,3.5*Math.random()],5);

	var offset, curPos, curVel, curClr;
	var oldPos, oldVel, oldClr;
    var pos,vel,clr;
    var r = 5;
    this.boidSize = 3;
    var indices = [];
	//we are generating 4 vertices for each point
	for (var i = 0; i < this.numBoids; ++i) {

        offset = 6 * i * PART_MAXVAR; //This is the center;

		//		this.faces[i] = i;
		//		var off = i * PART_MAXVAR;
        curPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        curVel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        curClr = this.S_cur.subarray(offset + PART_R, offset + PART_R + 4);

        oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        oldVel = this.S_old.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
        oldClr = this.S_old.subarray(offset + PART_R, offset + PART_R + 4);
        vec3.copy(curPos, posGen.getValue());
        vec3.copy(curVel, [getRandomArbitrary(-5, 5), 0, getRandomArbitrary(-5, 5)]);
        vec3.copy(oldPos, curPos);
        vec3.copy(oldVel, curVel);

        this.S_cur[offset + PART_MASS] = 1.0;
        this.S_old[offset + PART_MASS] = this.S_cur[offset + PART_MASS];

        this.S_cur[offset + PART_DIAM] = 20;
        this.S_old[offset + PART_DIAM] = this.S_cur[offset + PART_DIAM];

//		vec4.copy(clr, [getRandomArbitrary(0, 0.5), getRandomArbitrary(0.5, 1), getRandomArbitrary(0.5, 1), 1.0]);
        vec4.copy(curClr,[0.6,1.0,1.0,1.0]);
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
    }

    this.faces = new Uint16Array(indices);
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
	//	var numNeighbors = 0;

	var c = vec3.fromValues(0, 0, 0); //cohension
	var s = vec3.fromValues(0, 0, 0); //separation
	var a = vec3.fromValues(0, 0, 0); //alignment
	var vOA = vec3.fromValues(0, 0, 0); //O-A
	//	var vAO = vec3.fromValues(0,0,0); //A-O
    var agentPos = this.S_cur.subarray(6* idx * PART_MAXVAR + PART_XPOS, idx * PART_MAXVAR + PART_XPOS + 3);
    var agentVel = this.S_cur.subarray(6* idx * PART_MAXVAR + PART_XVEL, idx * PART_MAXVAR + PART_XVEL + 3);
    var agentAcc = this.dotStat.subarray(6 * idx * DOT_PART_TOTAL + DOT_PART_XVEL, idx * DOT_PART_TOTAL + DOT_PART_XVEL + 3);
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

		//		vec3.sub(vAO,agentPos,otherPos);
		vec3.sub(vOA, otherPos, agentPos);


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
					vec3.scaleAndAdd(s, s, vOA, 1.0 / dist);
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
	}

	if (neighbors.s > 0) {
		//		vec3.scale(centroid[1],centroid[1],1.0/neighbors[0]);
		//		vec3.sub(c,centroid[0],agent);
		vec3.normalize(s, s);
	}

	if (neighbors.a > 0) {
		//		vec3.scale(a,a,1.0/neighbors.a);
		//		vec3.sub(a,a,agentVel);
		vec3.normalize(a, a);
	}

	vec3.copy(agentAcc, [0, 0, 0]);
	vec3.scaleAndAdd(agentAcc, agentAcc, c, this.config.Kc);
	vec3.scaleAndAdd(agentAcc, agentAcc, s, this.config.Ks);
	vec3.scaleAndAdd(agentAcc, agentAcc, a, this.config.Ka);

	if (vec3.length(agentAcc) > this.config.maxA) {
		vec3.normalize(agentAcc, agentAcc);
		vec3.scale(agentAcc, agentAcc, this.config.maxA);
	}

    //we have to update the other 5 points accelearation, only copy
    acc = this.dotStat.subarray((6 * idx + 1) * DOT_PART_TOTAL + DOT_PART_XVEL, idx * DOT_PART_TOTAL + DOT_PART_XVEL + 3);
    vec3.copy(acc,agentAcc);
    acc = this.dotStat.subarray((6 * idx + 2) * DOT_PART_TOTAL + DOT_PART_XVEL, idx * DOT_PART_TOTAL + DOT_PART_XVEL + 3);
    vec3.copy(acc,agentAcc);
    acc = this.dotStat.subarray((6 * idx + 3) * DOT_PART_TOTAL + DOT_PART_XVEL, idx * DOT_PART_TOTAL + DOT_PART_XVEL + 3);
    vec3.copy(acc,agentAcc);
    acc = this.dotStat.subarray((6 * idx + 4) * DOT_PART_TOTAL + DOT_PART_XVEL, idx * DOT_PART_TOTAL + DOT_PART_XVEL + 3);
    vec3.copy(acc,agentAcc);
    acc = this.dotStat.subarray((6 * idx + 5) * DOT_PART_TOTAL + DOT_PART_XVEL, idx * DOT_PART_TOTAL + DOT_PART_XVEL + 3);
    vec3.copy(acc,agentAcc);
}

Flocking.prototype.dotFinder = function () {
//	this.dt = this.timeStep * 0.0005;
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
    for (var i = 0; i < this.numBoids; ++i) {
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



		vec3.copy(temp1, curPos);
		//		vec3.scaleAndAdd(curPos,oldPos,curVel,this.dt);
		vec3.scaleAndAdd(curPos, curPos, curVel, this.dt);
		vec3.copy(oldPos, temp1);

		if (vec3.length(curVel) > this.config.maxV) {
			vec3.normalize(curVel, curVel);
			vec3.scale(curVel, curVel, this.config.maxV);
		} else if (vec3.length(curVel) < this.config.minV) {
			vec3.normalize(curVel, curVel);
			vec3.scale(curVel, curVel, this.config.minV);
		}

	}
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
    var offset,curPos;
    for (var i = 0; i < this.numBoids; ++i) {
        offset = 6 *i * PART_MAXVAR;
        curPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
		curPos[0] = WrapAround(curPos[0], this.config.boundMin[0], this.config.boundMax[0]);
		curPos[1] = WrapAround(curPos[1], this.config.boundMin[1], this.config.boundMax[1]);
		curPos[2] = WrapAround(curPos[2], this.config.boundMin[2], this.config.boundMax[2]);

		//		console.log(curPos);

		//		if(curPos[0]>this.config.boundMax[0])
		//		{
		//			curPos[0] = WrapAround(curPos[0],this.config.boundMax[0],this.config.boundMax[1]);
		//		}
        //update other parts
        this.updateBoid(i);
    }
}
