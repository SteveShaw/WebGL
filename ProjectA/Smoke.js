Smoke = function (num, cont) {

    SimBase.prototype.constructor.call(this);

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

    this.name = 'smoke';
    this.startColor = vec4.fromValues(0.2,0.2,0.2,0.15);
    this.endColor = vec4.fromValues(0,0,0,0);

    this.startAlpha = 0.15;
    this.endAlpha = 0.0;

    this.startScale = 45.0;
    this.endScale = 60;//this.startScale * 1.5;

    this.faces = new Uint16Array(num);
    this.emitters = new Array();
    this.space = new Array();

    this.drag = 0.01;

    this.emitRate = 100;
    this.invEmitRate = 1.0/this.emitRate;
    this.timeToNext = this.invEmitRate;

    this.drift = vec3.fromValues(15,15,15);
}


Smoke.prototype = Object.create(SimBase.prototype);
Smoke.prototype.constructor = Smoke;

Smoke.prototype.initSim = function ()
{
    this.velGen = new ConeZone([0,0,0],[0,1,0],Math.PI/6,60,30);
    var i, offset, dotOff;
    var curPos,curClr,curVel;
    var oldPos,oldClr,oldVel;
    var acc;

    for(i = 0; i<this.totalPoints;++i)
    {
        this.faces[i] = i;
    }

    this.space.push([0,this.totalPoints]);
    this.zeroVec = vec3.fromValues(0,5,0);
}


Smoke.prototype.initEmitters = function(emitter)
{
    var i,offset,dotOff;
    var curPos,curClr,curVel;
    var oldPos,oldClr,oldVel;
    var acc;

    for(i = emitter.start;i<emitter.start + emitter.numPoints;++i)
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

        vec3.copy(acc,this.zeroVec);

        //        vec3.copy(curPos,this.posGen.getValue());
        vec3.copy(curPos,this.zeroVec);
        vec3.copy(oldPos, curPos);

        vec4.copy(curClr,this.startColor);
        vec4.copy(oldClr, curClr);

        vec3.copy(curVel, this.velGen.getValue()[1]);
        vec3.copy(oldVel, curVel);

        this.S_cur[offset + PART_MASS] = getRandomArbitrary(0.05,0.1);
        this.S_cur[offset + PART_DIAM] = this.startScale;

        this.S_cur[offset + PART_AGE] = 0;
        this.S_cur[offset + PART_LIFESPAN] = emitter.life;//this.emitters[0].life;


        this.S_cur[offset+PART_DEAD] = 0;
    }
}

Smoke.prototype.recycleParticle = function(emitter)
{
    var j;
    var space;
    var concated = false;

    for(j = 0;j<this.space.length;++j)
    {
        space = this.space[j];
        if((space[0]+space[1]) === emitter.start)
        {
            space[1] += emitter.numPoints;
            concated = true;
            break;
        }
    }

    if(!concated)
    {
        this.space.push([emitter.start,emitter.numPoints]);
    }
}


Smoke.prototype.dumpSpace = function(){
    var j = 0;
    while(j<this.space.length)
    {
        if(this.space[j][1]<=0)
        {
            this.space.splice(j,1);
        }
        else
        {
            ++j;
        }
    }

}

Smoke.prototype.applyActions = function(curStat,oldStat,dotStat)
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
//    vec3.scaleAndAdd(curVel,oldVel,acc,this.dt);
    //apply drag
    vec3.scale(curVel,curVel,1-this.drag*this.dt/mass);
    //apply drift
    vec3.scaleAndAdd(curVel,curVel,this.drift,(Math.random()-0.5)*this.dt);
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


    //adjust alpha
    var curClr = curStat.subarray(PART_R,PART_R+4);
    vec4.scale(curClr,this.startColor,energy);
    vec4.scaleAndAdd(curClr,curClr,this.endColor,1-energy);

    //scale
    curStat[PART_DIAM] = this.endScale + (this.startScale-this.endScale) * energy;
}

Smoke.prototype.applyGeneralForce = function (f) {
    var idx;
    var F, offset;
    for (idx = 0; idx < this.totalPoints; ++idx) {
        offset = idx * PART_MAXVAR;
        F = this.S_cur.subarray(offset + PART_X_FTOT, offset + PART_X_FTOT + 3);
        vec3.add(F, F, f.force);
    }
}

Smoke.prototype.dotFinder = function()
{

    //check which emitter should be recycled
    var i = 0;

    var numEmitters = this.emitters.length;
    var emitter;
    var start;


    while(i<this.emitters.length)
    {
        emitter = this.emitters[i];
        emitter.age += this.dt;//*this.timeStep;
        if(emitter.age > emitter.life)
        {
            this.recycleParticle(emitter);
            this.emitters.splice(i,1);
        }
        else
        {
            ++i;
        }
    }

    //we calculate how many particles should be emitted next time
    var count = 0;
    this.timeToNext -= this.dt;//*this.timeStep;
    while(this.timeToNext<=0)
    {
        this.timeToNext += this.invEmitRate;
        ++count;
    }

    if(this.space.length<=0)
    {
        return;
    }


    var maxAvail = 0;
    var select = 0;
    var foundSpace = false;

    for(i = 0;i<this.space.length;++i)
    {
        if(this.space[i][1] >= count)
        {
            start = this.space[i][0];
            this.space[i][0] += count;
            this.space[i][1] -= count;
            foundSpace = true;
            break;
        }
        else
        {
            if(maxAvail<this.space[i][1])
            {
                start = this.space[i][0];
                maxAvail = this.space[i][1];
                select = i;
            }
        }
    }

    if(!foundSpace)
    {
        count = Math.min(maxAvail,count);
        this.space[select][1] -= count;
        this.space[select][0] += count;
    }

    this.emitters.push(new Emitter(start,count,getRandomArbitrary(11,12)));

    //remove those space with zero length
    this.dumpSpace();


    //initialize the new emitters
    emitter = this.emitters[this.emitters.length-1]
    this.initEmitters(emitter);
}




Smoke.prototype.solver = function()
{
    //    this.solvers['exp'].solve(this.totalPoints, this.S_cur, this.S_old, this.dotStat, this.dt);
    var i, offset, dotOff;
    var curStat,oldStat,dotStat;

    var emitter,j;
    for(i = 0;i<this.emitters.length;++i)
    {
        emitter = this.emitters[i];

        if(emitter.age>0)
        {
            for(j = emitter.start;j<emitter.start+emitter.numPoints;++j)
            {
                offset = j * PART_MAXVAR;
                dotOff = j*  DOT_PART_TOTAL;

                curStat = this.S_cur.subarray(offset,offset+PART_MAXVAR);
                oldStat = this.S_old.subarray(offset,offset+PART_MAXVAR);
                dotStat = this.dotStat.subarray(dotOff,dotOff+DOT_PART_TOTAL);
                this.applyActions(curStat,oldStat,dotStat);

            }

        }
    }
}

//Smoke.prototype.renderParticle = function(gl,modelMat,projectMat,viewMat,quatMatrix,mvpMatrix,u_MvpMatrix)
Smoke.prototype.renderParticle = function(gl)
{

    var emitterIndex = 0;
    for(emitterIndex = 0;emitterIndex<this.emitters.length;++emitterIndex)
    {
        gl.drawElements(gl.POINTS, this.emitters[emitterIndex].numPoints, gl.UNSIGNED_SHORT, this.emitters[emitterIndex].start*2);
    }
}
