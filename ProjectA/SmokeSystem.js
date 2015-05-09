var FireEmitter = function(start,numPoints,life)
{
   this.start = start;
    this.maxPoints = numPoints;
    this.life = life;
    this.age = 0;
}


FireSmoke = function(num,cont)
{
    SimBase.prototype.constructor.call(this);
    //	this.cont = cont; //the container object
    //	this.numX = numX;
    //	this.numY = numY;
    this.totalPoints = num;
    this.startOff = cont.nextOff; //the start offset in the vertex array in container;
    cont.nextOff += (this.totalPoints) * PART_MAXVAR;
    //	this.curStat = cont.meshes.curVert.subarray(this.startOff,this.startOff+(this.totalPoints)*PART_MAXVAR);
    //	this.nextStat = cont.meshes.nextVert.subarray(this.startOff,this.startOff+(this.totalPoints)*PART_MAXVAR);
    this.S_cur = cont.meshes.curVert.subarray(this.startOff, this.startOff + (this.totalPoints) * PART_MAXVAR);
    this.S_old = cont.meshes.oldVert.subarray(this.startOff, this.startOff + (this.totalPoints) * PART_MAXVAR);
    this.dt = 18.0 / 1000;
    this.ddt = this.dt * this.dt;

    this.startDotOff = cont.nextDotOff;
    cont.nextDotOff += this.totalPoints * DOT_PART_TOTAL;
    this.dotStat = cont.dotStat.subarray(this.startDotOff, this.startDotOff + (this.totalPoints) * DOT_PART_TOTAL);

    this.tempStat = new Float32Array(PART_TEMP_TOTAL);

    this.name = 'fire';
    this.startColor = vec4.fromValues(1.0,0xCC/0xFF,0.0,1.0);
    this.endColor = vec4.fromValues(0xCC/0xFF,0,0,0);

    this.startScale = 5.0;
    this.endScale = this.startScale * 1.5;

    this.faces = new Uint16Array(num);
    //emitters
    this.numEmitters = 5;
    this.emitters = new Array();
    this.perMaxPoints = this.totalPoints/this.numEmitters;


    this.drag = 1.0;

}
FireSmoke.prototype = Object.create(SimBase.prototype);
FireSmoke.prototype.constructor = FireSmoke;

FireSmoke.prototype.initEmitters = function(emitterIndex)
{
    var i,offset,dotOff;
    var curPos,curClr,curVel;
    var oldPos,oldClr,oldVel;
    var acc;
    for(i = this.emitters[emitterIndex].start;i<this.emitters[emitterIndex].start + this.emitters[emitterIndex].maxPoints;++i)
{
        offset = i * PART_MAXVAR;
        dotOff = i*  DOT_PART_TOTAL;

        curPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        curClr = this.S_cur.subarray(offset + PART_R, offset + PART_R + 4);
        curVel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);

        oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        oldClr = this.S_old.subarray(offset + PART_R, offset + PART_R + 4);
        oldVel = this.S_old.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);

        acc = this.dotStat.subarray(dotOff + DOT_PART_XVEL,dotOff + DOT_PART_XVEL+3);

        vec3.copy(acc,[0,15,0]);

        vec3.copy(curPos,this.posGen.getValue());
        vec3.copy(oldPos, curPos);

        vec4.copy(curClr,this.startColor);
        vec4.copy(oldClr, curClr);

        vec3.copy(curVel, this.velGen.getValue());
        vec3.copy(oldVel, curVel);

        this.S_cur[offset + PART_MASS] = getRandomArbitrary(0.1,0.5);
        this.S_cur[offset + PART_DIAM] = this.startScale;

        this.S_cur[offset + PART_AGE] = 0;
        this.S_cur[offset + PART_LIFESPAN] = this.emitters[0].life;


        this.S_cur[offset+PART_DEAD] = 0;
    }
}

FireSmoke.prototype.initSim = function()
{
   this.velGen = new DiskZone([0,0,0],[0,1,0],50);
    this.posGen = new DiskZone([0,0,0],[0,1,0],5);
    var i, offset, dotOff;
    var curPos,curClr,curVel;
    var oldPos,oldClr,oldVel;
    var acc;
//    this.faces = new Uint16Array(this.totalPoints);

    for(i = 0;i<this.numEmitters;++i)
    {
        this.emitters.push(new FireEmitter(i*this.perMaxPoints,this.perMaxPoints,getRandomArbitrary(2,3)));
    }

    for(i = 0; i<this.totalPoints;++i)
    {
        this.faces[i] = i;
    }

    this.initEmitters(0);
}

FireSmoke.prototype.dotFinder = function()
{
    return;

    var i, offset, dotOff;
    var curPos,curVel,curClr;
    var oldPos,oldVel,oldClr;
    var acc;
    for(i = this.emitters[emitterIndex].start;i<this.emitters[emitterIndex].start + this.emitters[emitterIndex].maxPoints;++i)
    {
        offset = i * PART_MAXVAR;
        dotOff = i*  DOT_PART_TOTAL;

        curPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        curClr = this.S_cur.subarray(offset + PART_R, offset + PART_R + 4);
        curVel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);

        oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
        oldClr = this.S_old.subarray(offset + PART_R, offset + PART_R + 4);
        oldVel = this.S_old.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);

        acc = this.dotStat.subarray(dotOff + DOT_PART_XVEL,dotOff + DOT_PART_XVEL+3);
    }
}

FireSmoke.prototype.renderParticle = function(gl,modelMat,projectMat,viewMat,quatMatrix,mvpMatrix,u_MvpMatrix)
{
    var offset;
    var curVel;
    var normVel = this.tempStat.subarray(0,3);
    var axis = this.tempStat.subarray(3,6);
    var target = this.tempStat.subarray(6,9);
    var angle = 0;
    vec3.copy(target,[0,1,0]);
    var qRot = quat.create();

    var emitterIndex = 0;
    for(i = this.emitters[emitterIndex].start;i<this.emitters[emitterIndex].start + this.emitters[emitterIndex].maxPoints;++i)
    {
        offset = i * PART_MAXVAR;
        curVel = this.S_cur.subarray(offset+PART_XVEL,offset+PART_XVEL+3);

        if(this.S_cur[offset+PART_DEAD]===1)
        {
            continue;
        }

        pushMatrix(modelMat);

        if(vec3.length(curVel)>0)
        {
            vec3.normalize(normVel,curVel);
            vec3.cross(axis,normVel,target);
            angle = Math.acos(vec3.dot(target,normVel));
            quat.setAxisAngle(qRot,axis,angle);
            quatMatrix.setFromQuat(qRot[0],qRot[1],qRot[2],qRot[3]);
            modelMat.concat(quatMatrix);
        }

        mvpMatrix.set(projectMat).multiply(viewMat).multiply(modelMat);
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
        gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_SHORT, i*2);
        modelMat = popMatrix();
    }
}

FireSmoke.prototype.applyActions = function(curStat,oldStat,dotStat)
{
    var temp = this.tempStat.subarray(0,3);
    if(curStat[PART_DEAD]===1)
    {
        return;
    }

    var curPos,oldPos,curVel,oldVel,acc,mass;
    curPos = curStat.subarray(PART_XPOS,PART_XPOS+3);
    oldPos = oldStat.subarray(PART_XPOS,PART_XPOS+3);
    curVel = curStat.subarray(PART_XVEL,PART_XVEL+3);
    oldVel = oldStat.subarray(PART_XVEL,PART_XVEL+3);
    acc = dotStat.subarray(DOT_PART_XVEL,DOT_PART_XVEL+3);
    mass = curStat[PART_MASS];

        vec3.copy(temp,curVel);
        vec3.scaleAndAdd(curVel,oldVel,acc,this.dt);
        //apply drag
    vec3.scale(curVel,curVel,1-this.drag*this.dt/mass);
    vec3.copy(oldVel,temp);

        vec3.copy(temp,curPos);
        vec3.scaleAndAdd(curPos,oldPos,curVel,this.dt);
        vec3.copy(oldPos,temp);

    //age
    curStat[PART_AGE] += this.dt;

    var energy = 0;
    if(curStat[PART_AGE] > curStat[PART_LIFESPAN])
    {
        energy = 0;
        curStat[PART_DEAD] = 1;
    }
    else
    {
        energy = 1 - curStat[PART_AGE]/curStat[PART_LIFESPAN];
    }


    var curClr = curStat.subarray(PART_R,PART_R+4);
    vec4.scale(curClr,this.startColor,energy);
    vec4.scaleAndAdd(curClr,curClr,this.endColor,1-energy);

    //scale
    curStat[PART_DIAM] = this.endScale + (this.startScale-this.endScale) * energy;
}

FireSmoke.prototype.solver = function()
{
//    this.solvers['exp'].solve(this.totalPoints, this.S_cur, this.S_old, this.dotStat, this.dt);
    var i, offset, dotOff;
    var curStat,oldStat,dotStat;

    var emitterIndex = 0;
    var temp = this.tempStat.subarray(0,3);
    for(i = this.emitters[emitterIndex].start;i<this.emitters[emitterIndex].start + this.emitters[emitterIndex].maxPoints;++i)
{
        offset = i * PART_MAXVAR;
        dotOff = i*  DOT_PART_TOTAL;

        curStat = this.S_cur.subarray(offset,offset+PART_MAXVAR);
        oldStat = this.S_old.subarray(offset,offset+PART_MAXVAR);
        dotStat = this.dotStat.subarray(dotOff,dotOff+DOT_PART_TOTAL);
        this.applyActions(curStat,oldStat,dotStat);


    }
}

//FireSmoke.prototype.solver = function(t)
//{
//	for(var i = 0;i<this.num;++i)
//	{
//		var offset = i*PART_MAXVAR;
//		var dotOff = i*DOT_PART_TOTAL;
//		var curS = this.curStat.subarray(offset,offset+PART_MAXVAR);
//		var nextS = this.nextStat.subarray(offset,offset+PART_MAXVAR);
//		var dotS = this.dotStat.subarray(dotOff,dotOff+DOT_PART_TOTAL);
		
//		//update particle age
//		curS[PART_AGE] += 0.02;
//		//calc vel
//		var curVel = vec3.fromValues(curS[PART_XVEL],curS[PART_YVEL],curS[PART_ZVEL]);
////		console.log('curVel='+vec3.str(curVel));
//		var curAcc = vec3.fromValues(dotS[DOT_PART_XVEL],dotS[DOT_PART_YVEL],dotS[DOT_PART_ZVEL]);
////		console.log('curAcc='+vec3.str(curAcc));
//		var nextVel = vec3.scaleAndAdd(curVel,curVel,curAcc,t);
////		console.log('nextVel='+vec3.str(nextVel));
//    nextS[PART_XVEL] = nextVel[0];
//		nextS[PART_YVEL] = nextVel[1];
//		nextS[PART_ZVEL] = nextVel[2];
//		//implicit Euler
////		vec3.scaleAndAdd(nextVel,nextVel,curVel,0.5);
		
//		//update pos
//		var pos = vec3.fromValues(curS[PART_XPOS],curS[PART_YPOS],curS[PART_ZPOS]);
//		vec3.scaleAndAdd(pos,pos,nextVel,t);
//		nextS[PART_XPOS] = pos[0];
//		nextS[PART_YPOS] = pos[1];
//		nextS[PART_ZPOS] = pos[2];
		
//		nextS[PART_DIAM] = curS[PART_DIAM] - 13*t;
//	}
//}

//SmokePS.prototype.applyContraints = function()
//{
//	var resetParticle = function(particle)
//	{
//		particle[PART_XPOS] = randomSpread(0,50);
//		particle[PART_YPOS] = randomSpread(0,50);
//		particle[PART_ZPOS] = randomSpread(0,20);
//		var speed = randomSpread(200,160);
//		var angle = randomSpread(Math.PI/2,0.42);
//		particle[PART_XVEL] = Math.cos(angle)*speed;
//		particle[PART_YVEL] = Math.sin(angle)*speed;
//		particle[PART_ZVEL] = speed*Math.random();
////		particle[offset+PART_XPOS] = normRnd(0,0.015);
////		particle[offset+PART_YPOS] = normRnd(0,0.015);
////		particle[offset+PART_ZPOS] = normRnd(0,0.015);
////		particle[offset+PART_XVEL] = normRnd(0,0.2);
////		particle[offset+PART_YVEL] = normRnd(0,0.2);
////		particle[offset+PART_ZVEL] = normRnd(0,0.15);
////		particle[PART_XPOS] = getRandomArbitrary(0,1) - getRandomArbitrary(0,1);
////		particle[PART_YPOS] = 10;
////		particle[PART_ZPOS] = 20;
////		particle[PART_XVEL] = (((((((2) * getRandomArbitrary(0,10)) + 1)) * getRandomArbitrary(0,10)) + 1) * 0.007) - (((((((2) * getRandomArbitrary(0,10)) + 1)) * getRandomArbitrary(0,10)) + 1) * 0.007);
////		particle[PART_YVEL] = ((((((5) * getRandomArbitrary(0,10)) + 5)) * getRandomArbitrary(0,10)) + 1) * 0.02;
////		particle[PART_ZVEL] = (((((((2) * getRandomArbitrary(0,10)) + 1)) * getRandomArbitrary(0,10)) + 1) * 0.007) - (((((((2) * getRandomArbitrary(0,10)) + 1)) * getRandomArbitrary(0,10)) + 1) * 0.007);
//		var hue = randomSpread(25,15);
//		var rgbColor = transfomHSV2RGB(convertHue(hue),1.0,1.0);
//		particle[PART_R] = rgbColor.r;
//		particle[PART_G] = rgbColor.g;
//		particle[PART_B] = rgbColor.b;
//		particle[PART_A] = 1;
//		particle[PART_AGE] = 0;
//		particle[PART_DIAM] = randomSpread(40,40);
//		particle[PART_LIFESPAN] = (getRandomArbitrary(0,9)+1)/10;
//	}
//	for(var i=0;i<this.num;++i)
//	{
//		var offset = i*PART_MAXVAR;
//		var curS = this.nextStat.subarray(offset,offset+PART_MAXVAR);
		
////         var temp = curS[PART_LIFESPAN]/curS[PART_AGE];
////         if((temp) < 1.75)
////         {//red
////					 curS[PART_R] = 1.0;
////					 curS[PART_G] = 0.25;
////					 curS[PART_B] = 0;
////         }
////         else if((temp) < 3.0)
////         {//gold
////					 curS[PART_R] = 1.0;
////					 curS[PART_G] = 0.9;
////					 curS[PART_B] = 0;
////         }
////         else if((temp) < 10.0)
////         {//yellow
////					 curS[PART_R] = 1.0;
////					 curS[PART_G] = 1.0;
////					 curS[PART_B] = 0;
////         }
////         else
////         {// initial light yellow
////					 curS[PART_R] = 1.0;
////					 curS[PART_G] = 0.95;
////					 curS[PART_B] = 0;
////         }
      	
      
////		curS[PART_DIAM]*=curS[PART_AGE]/curS[PART_LIFESPAN];
	

////		if(curS[PART_AGE]>curS[PART_LIFESPAN])
//		if(curS[PART_DIAM]<0)
//		{
////			console.log('Reset Particles');
//			resetParticle(curS);
////			console.log(curS[PART_AGE]);
//		}
//	}
//	}
