//looks like a wave that effected by winds
Storm = function(num,cont){
	SimBase.prototype.constructor.call(this);

	this.numSys = 2;
	
	    this.totalPoints = this.numSys*num;
	
	this.sysLife = new Array();
	this.sysAge = new Array();
	
    this.startOff = cont.nextOff; //the start offset in the vertex array in container;
    cont.nextOff += (this.totalPoints)*PART_MAXVAR;
    this.S_cur = cont.meshes.curVert.subarray(this.startOff,this.startOff+(this.totalPoints)*PART_MAXVAR);
    this.S_old = cont.meshes.oldVert.subarray(this.startOff,this.startOff+(this.totalPoints)*PART_MAXVAR);

	this.dt = 30/1000;
	this.ddt = this.dt*this.dt;
	this.drag = 0.5;

    this.startDotOff = cont.nextDotOff;
    cont.nextDotOff += this.totalPoints*DOT_PART_TOTAL;
    this.dotStat = cont.dotStat.subarray(this.startDotOff,this.startDotOff+(this.totalPoints)*DOT_PART_TOTAL);
    this.tempStat = new Float32Array(PART_TEMP_TOTAL);
	this.faces = new Uint16Array(this.totalPoints);
	
	this.name = 'fireworks';
	
	this.velGen = new SphereZone([0,20,0],30);
}

Storm.prototype = Object.create(SimBase.prototype);
Storm.prototype.constructor = Storm;

Storm.prototype.initSim = function()
{
//	var velGen = new DiskZone([0,250,0],[0,1,0],60); //velocity generator
	
	
//	var center = vec3.fromValues(0,30,80);
//	var rseed = 100;
//	
//	var subTotalPoints = this.totalPoints/2;
//	var offset, curPos, curVel, curClr;
//	var oldPos,oldVel,oldClr;
//	
//	var mass = 0.5;
//	var partSize = 15;
//	
//	var angle,r;
	
	this.sysLife.push([1.0,2.0]);
	this.sysLife.push([1.0,2.0]);
	this.sysAge.push(0,0);
	
	var i;
	for(i=0;i<this.numSys;++i)
	{
		this.reset(i);
	}
	
	for(i=0;i<this.totalPoints;++i)
	{
		this.faces[i] = i;
	}
	
	//add force makers
	//add a wind force
	//this.forces.push(new WindForce(vec3.random(vec3.create()),randomSpread(20,5)));
	///this.forces.push(new WindForce(vec3.random(vec3.create()),randomSpread(20,5)));
	this.forces.push(new GravityForce(vec3.fromValues(0,-1,0),9.81,1.2));
}



Storm.prototype.appyGeneralForce = function(f){
	for(var i = 0;i<this.totalPoints;++i)
	{
		var offset = i*PART_MAXVAR;
		var force = this.S_cur.subarray(offset+PART_X_FTOT,offset+PART_X_FTOT+3);		
		vec3.add(force,force,f.force);
	}
}

Storm.prototype.applyForce = function()
{
	for(var i = 0;i<this.totalPoints;++i)
	{
		var offset = i*PART_MAXVAR;
		var force = this.S_cur.subarray(offset+PART_X_FTOT,offset+PART_X_FTOT+3);		
		vec3.copy(force,[0,0,0]);
	}
	
	for(var j = 0;j<this.forces.length;++j)
	{
		var f = this.forces[j];
		switch(f.type)
		{
			case F_GRAV_E:
			case F_WIND:
				this.appyGeneralForce(f);
				break;
		}
	}
}

Storm.prototype.dotFinder = function()
{
//	this.dt = this.timeStep*0.05;
	
	this.applyForce();
	
	for(var i = 0;i<this.totalPoints;++i)
	{
		var offset = i*PART_MAXVAR;
		var dotOff = i*DOT_PART_TOTAL;
		
		var force = this.S_cur.subarray(offset+PART_X_FTOT,offset+PART_X_FTOT+3);
		var acc = this.dotStat.subarray(dotOff+DOT_PART_XVEL,dotOff+DOT_PART_XVEL+3);
		
		vec3.scale(acc,force,1.0/this.S_cur[offset+PART_MASS]);
		//vec3.scale(acc,force,2.0);
	}
}

Storm.prototype.applyContraints = function(){
	
	var offset,i,age,life;
	var energy,alpha;
	
	for(i = 0;i<this.totalPoints;++i)
	{
		offset = i*PART_MAXVAR;
		
		age = this.S_cur[offset+PART_AGE];
		this.S_cur[offset+PART_AGE] = this.S_old[offset+PART_AGE]+this.dt;
		this.S_old[offset+PART_AGE] = age;
		
		age = this.S_cur[offset+PART_AGE];
		life = this.S_cur[offset+PART_LIFESPAN];
		
		if(age<life)
		{
			energy = age/life;
			energy = 1 - energy*energy;
		}
		else
		{
			energy = 0;
		}

		alpha = this.S_cur[offset+PART_A];
		this.S_cur[offset+PART_A] = energy;
		this.S_old[offset+PART_A] = alpha;
	}
	
	for(i = 0;i<this.numSys;++i)
	{
		this.sysAge[i] += this.dt;
		if(this.sysAge[i]>this.sysLife[i][1]*2)
		{
			this.reset(i);
			this.sysAge[i] = 0;
		}		
	}
}

Storm.prototype.solver = function()
{
	var temp0 = this.tempStat.subarray(PART_TEMP_X0,PART_TEMP_X0+3);
  var temp1 = this.tempStat.subarray(PART_TEMP_X1,PART_TEMP_X1+3);
	
	var offset = 0;
  var dotOff = 0;
  var curPos=null,oldPos=null,acc=null;
  var curVel=null,oldVel=null;

	for(var i = 0;i<this.totalPoints;++i)
	 {
		 offset = i*PART_MAXVAR;
     dotOff = i*DOT_PART_TOTAL;
     curPos = this.S_cur.subarray(offset+PART_XPOS,offset+PART_XPOS+3);
     oldPos = this.S_old.subarray(offset+PART_XPOS,offset+PART_XPOS+3);
		 curVel = this.S_cur.subarray(offset+PART_XVEL,offset+PART_XVEL+3);
		 oldVel = this.S_old.subarray(offset+PART_XVEL,offset+PART_XVEL+3);
     acc = this.dotStat.subarray(dotOff+DOT_PART_XVEL,dotOff+DOT_PART_XVEL+3);

 		 vec3.copy(temp1,curVel);
		 vec3.scaleAndAdd(curVel,oldVel,acc,this.dt);
		 var scale = 1 - this.drag*this.dt/this.S_cur[offset+PART_MASS];
		 vec3.scale(curVel,curVel,scale);
		 if(scale<0)
		 {
			 vec3.copy(curVel,[0,0,0]);
		 }
		 
		 vec3.copy(oldVel,temp1);
		 
		 //apply drag
		 
		 
		 //console.log(vec3.str(curVel));

		 vec3.copy(temp0,curPos);
		 vec3.scaleAndAdd(curPos,oldPos,curVel,this.dt);
		 vec3.copy(oldPos,temp0);
		 

//     vec3.copy(temp1,curPos);
//     vec3.sub(temp0,curPos,oldPos);
//     vec3.scale(temp0,temp0,0.998);
//     vec3.add(curPos,curPos,temp0);
//     vec3.scale(temp0,acc,this.ddt);
//     vec3.add(curPos,curPos,temp0);
//     vec3.copy(acc,[0,0,0]);
//     vec3.copy(oldPos,temp1);
	}
	

	
}

Storm.prototype.reset = function(sysIdx)
{
	var i, offset;
	var pointsPerSys = this.totalPoints/this.numSys;
	var center = vec3.fromValues(getRandomArbitrary(-10,-5),getRandomArbitrary(50,60),getRandomArbitrary(20*sysIdx,20*sysIdx+20));
	var curPos,curClr,curVel;
	var oldPos,oldClr,oldVel;
	
	
	
	for(i = sysIdx*pointsPerSys; i<(sysIdx+1)*pointsPerSys;++i)
	{
		offset = i * PART_MAXVAR;
		
		curPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
		curClr = this.S_cur.subarray(offset + PART_R, offset + PART_R + 4);
		curVel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);

		oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
		oldClr = this.S_old.subarray(offset + PART_R, offset + PART_R + 4);
		oldVel = this.S_old.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
		
		vec3.copy(curPos, center);
		vec3.copy(oldPos, curPos);

		vec4.copy(curClr, getRandomColor([1.0, 1.0, 0.0, 1.0], [1.0, 0x66 / 0xFF, 0.0, 1.0]));
		vec4.copy(oldClr, curClr);

		vec3.copy(curVel, this.velGen.getValue());
		vec3.copy(oldVel, curVel);

		this.S_cur[offset + PART_MASS] = getRandomArbitrary(0.05,0.5);
		this.S_cur[offset + PART_DIAM] = getRandomArbitrary(5,10);

		this.S_cur[offset + PART_AGE] = 0;
		this.S_old[offset + PART_AGE] = 0;
		this.S_cur[offset + PART_LIFESPAN] = getRandomArbitrary(this.sysLife[sysIdx][0],this.sysLife[sysIdx][1]);
	}
}

Storm.prototype.render = function(gl){
	
	//update 
	//if current time > max life time, reset the count to zero and 

}
