const PART_XPOS     = 0;  //  position    
const PART_YPOS     = 1;
const PART_ZPOS     = 2;
const PART_XVEL     = 3; //  velocity    
const PART_YVEL     = 4;
const PART_ZVEL     = 5;
const PART_X_FTOT   = 6;  // force accumulator:'ApplyForces()' fcn clears
const PART_Y_FTOT   = 7;  // to zero, then adds each force to each particle.
const PART_Z_FTOT   = 8;        
const PART_R        = 9;  // color : red,green,blue
const PART_G        =10;  
const PART_B        =11;
const PART_A				=12;
const PART_MASS     =13;  // mass   
const PART_DIAM 		=14;	// on-screen diameter (in pixels)
const PART_RENDMODE =15;	// on-screen appearance (square, round, or soft-round)
const PART_MOVEABLE =16;
const PART_AGE = 17;
const PART_LIFESPAN = 18;
const PART_ANG = 18;
const PART_SPRITE_SIZE = 19;
const PART_ANG_VEL = 19;
//const PART_TEXTURE_0x = 20;
//const PART_TEXTURE_0y = 21;
//const PART_OLD_XPOS =15;
//const PART_TEXTURE_1x = 20;
//const PART_TEXTURE_1y = 21;
//const PART_TEXTURE_2x = 22;
//const PART_TEXTURE_2y = 23;
//const PART_TEXTURE_3x = 24;
//const PART_TEXTURE_3y = 25;
//const PART_OLD_YPOS =16;
//const PART_OLD_ZPOS =17;
//Number of States in one Particle
const PART_MAXVAR   =20;  // Size of array in CPart uses to store its values.


const DOT_PART_XPOS = 0;
const DOT_PART_YPOS = 1;
const DOT_PART_ZPOS = 2;
const DOT_PART_XVEL = 3;
const DOT_PART_YVEL = 4;
const DOT_PART_ZVEL = 5;
const DOT_PART_X_FTOT = 6;
const DOT_PART_Y_FTOT = 7;
const DOT_PART_Z_FTOT = 8;
const DOT_PART_MASS = 9;
//number of states in the derivative state
const DOT_PART_TOTAL = 10;


const PART_TEMP_X0 = 0;
const PART_TEMP_Y0=1;
const PART_TEMP_Z0 = 2;
const PART_TEMP_X1 = 3;
const PART_TEMP_Y1= 4;
const PART_TEMP_Z1 = 5;
const PART_TEMP_X2 = 6;
const PART_TEMP_Y2= 7;
const PART_TEMP_Z2 = 8;
const PART_TEMP_TOTAL = 9;


//Container class: all particle system will be contained in this class
Container = function(maxNum){
	this.maxNum = maxNum;
	this.meshes = {};
	this.meshes.curVert = new Float32Array(maxNum*PART_MAXVAR);
    this.meshes.oldVert = new Float32Array(maxNum*PART_MAXVAR);
	this.dotStat = new Float32Array(maxNum*DOT_PART_TOTAL);
    this.tempStat = new Float32Array(PART_TEMP_TOTAL);
	this.nextOff = 0;
	this.nextDotOff = 0;
	this.elemSize = this.meshes.curVert.BYTES_PER_ELEMENT;
	this.vertices = this.meshes.curVert;
//	this.curSel = 0;
}

Container.prototype.constructor = Container;

Container.prototype.swap = function()
{
//	this.curSel  = (this.curSel+1)%2;
//	if(this.curSel==0)
//	{
//		this.vertices = this.meshes.curVert;
//	}
//	else{
//		this.vertices = this.meshes.nextVert;
//	}
}


ParticleSystemBase = function(num,numEnv){
	this.num = num;
	this.numEnv = numEnv;
	this.S0 = new Float32Array(PART_MAXVAR*this.num + PART_MAXVAR*this.numEnv);
	this.S1 = new Float32Array(PART_MAXVAR*this.num);
	this.dotStat = new Float32Array(DOT_PART_TOTAL*this.num);
	this.forces = new Array();
	this.curStat = this.S0.subarray(0,num*PART_MAXVAR);
	this.nextStat = this.S1;
	this.elemSize = this.S0.BYTES_PER_ELEMENT;
	this.faces = new Uint16Array(this.num);
	for(var i = 0;i < this.num;++i)
	{
		this.faces[i] = i;
	}
	this.sel = 0;
}
ParticleSystemBase.prototype.constructor = ParticleSystemBase;
ParticleSystemBase.prototype.setEnv = function(verArr,clrArr){
	var envData = this.S0.subarray(this.num*PART_MAXVAR,this.num*PART_MAXVAR+this.numEnv*PART_MAXVAR);
	for(var i = 0;i<envData.length;++i)
	{
		var offset = i*PART_MAXVAR;
		envData[offset+PART_XPOS] = verArr[3*i];
		envData[offset+PART_YPOS] = verArr[3*i+1];
		envData[offset+PART_ZPOS] = verArr[3*i+2];
		envData[offset+PART_XVEL] = 0;
		envData[offset+PART_YVEL] = 0;
		envData[offset+PART_ZVEL] = 0;
		envData[offset+PART_X_FTOT] = 0;
		envData[offset+PART_Y_FTOT] = 0;
		envData[offset+PART_Z_FTOT] = 0;
		envData[offset+PART_R] = clrArr[3*i];
		envData[offset+PART_G] = clrArr[3*i+1];
		envData[offset+PART_B] = clrArr[3*i+2];
		envData[offset+PART_MASS] = 0;
		envData[offset+PART_DIAM] = 1;
		envData[offset+PART_RENDMODE] = 0;
	}
}
ParticleSystemBase.prototype.dotMaker = function(curStat, dotStat)
{
	dotStat[DOT_PART_XPOS] = curStat[PART_XVEL];
	dotStat[DOT_PART_YPOS] = curStat[PART_YVEL];
	dotStat[DOT_PART_ZPOS] = curStat[PART_ZVEL];
	
	dotStat[DOT_PART_XVEL] = curStat[PART_X_FTOT] - dotStat[DOT_PART_MASS]*curStat[PART_XVEL];
	dotStat[DOT_PART_YVEL] = curStat[PART_Y_FTOT] - dotStat[DOT_PART_MASS]*curStat[PART_YVEL];
	dotStat[DOT_PART_ZVEL] = curStat[PART_Z_FTOT] - dotStat[DOT_PART_MASS]*curStat[PART_ZVEL];
	
	dotStat[DOT_PART_XVEL] *= 1/curStat[PART_MASS];
	dotStat[DOT_PART_YVEL] *= 1/curStat[PART_MASS];
	dotStat[DOT_PART_ZVEL] *= 1/curStat[PART_MASS];
	
	if(curStat[PART_MOVEABLE]===0)
	{
	dotStat[DOT_PART_XVEL] = 0;
	dotStat[DOT_PART_YVEL] = 0;
	dotStat[DOT_PART_ZVEL] = 0;
	}
	
}
ParticleSystemBase.prototype.dotFinder = function()
{
	for(var j = 0;j<this.num;++j)
	{
		var offset = j*PART_MAXVAR;
		var dotOff = j*DOT_PART_TOTAL;
	this.curStat[offset+PART_X_FTOT ] = 0;
	this.curStat[offset+PART_Y_FTOT ] = 0;
	this.curStat[offset+PART_Z_FTOT ] = 0;
		if(this.curStat[offset+PART_MOVEABLE]===0)
		{
			continue;
		}
		for(var i = 0; i<this.forces.length;++i)
	{
		if(!this.forces[i].enabled)
		{
			continue;
		}
		switch(this.forces[i].type)
		{
				case F_GRAV_E:
		this.forces[i].calcForce();
				 this.curStat[offset+PART_X_FTOT]+=this.forces[i].force[0];
				 this.curStat[offset+PART_Y_FTOT]+=this.forces[i].force[1];
				 this.curStat[offset+PART_Z_FTOT]+=this.forces[i].force[2];
				break;
				
				case F_SPRING:
				 if(this.forces[i].e0!=j){}
				else{
				var p0 = this.curStat.subarray(this.forces[i].e0*PART_MAXVAR+PART_XPOS,this.forces[i].e0*PART_MAXVAR+PART_XPOS+3);
				var p1 = this.curStat.subarray(this.forces[i].e1*PART_MAXVAR+PART_XPOS,this.forces[i].e1*PART_MAXVAR+PART_XPOS+3);
		this.forces[i].calcForce(p0,p1);
				 this.curStat[offset+PART_X_FTOT]+=this.forces[i].force[0];
				 this.curStat[offset+PART_Y_FTOT]+=this.forces[i].force[1];
				 this.curStat[offset+PART_Z_FTOT]+=this.forces[i].force[2];
				break;
				}
		}
		console.log('Y_FTOT='+this.curStat[offset+PART_Y_FTOT]);
		this.dotMaker(this.curStat.subarray(offset, offset+PART_MAXVAR),this.dotStat.subarray(dotOff,dotOff+DOT_PART_TOTAL));
		}
		
		
}
}

ParticleSystemBase.prototype.solver = function(t){
	
}

ParticleSystemBase.prototype.applyContraints = function(){
}
ParticleSystemBase.prototype.render = function(gl,vertexBuffer,colorBuffer,sizeBuffer){
//	gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);
//	gl.vertexAttribPointer(vertexBuffer, 3, gl.FLOAT, false, PART_MAXVAR*this.elemSize, PART_XPOS*this.elemSize);
	gl.bufferSubData(gl.ARRAY_BUFFER,0,this.curStat);
//	gl.bufferData(gl.ARRAY_BUFFER,this.curStat,gl.STATIC_DRAW);
//	
//	gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer);
//  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, PART_MAXVAR*this.elemSize, PART_R*this.elemSize);
//	gl.bufferData(gl.ARRAY_BUFFER,this.curStat,gl.STATIC_DRAW);
//	gl.bindBuffer(gl.ARRAY_BUFFER,sizeBuffer);
//  gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, PART_MAXVAR*sims.elemSize, PART_DIAM*sims.elemSize);
//	gl.bufferData(gl.ARRAY_BUFFER,this.curStat,gl.STATIC_DRAW);
}
ParticleSystemBase.prototype.update = function(gl,t){
	this.dotFinder();
	this.render(gl);
	this.solver(t);
	this.applyContraints();
	//swap curStat and nextStat;
	if(this.sel==0)
	{
		this.curStat = this.S1;
		this.nextStat = this.S0.subarray(0,this.num*PART_MAXVAR);
	}
	else
	{
		this.curStat = this.S0.subarray(0,this.num*PART_MAXVAR);
		this.nextStat = this.S1;
	}

	this.sel++;
	this.sel%=2;
//	this.curStat = this.S1;
//	this.nextStat = this.S0;
}
ParticleSystemBase.prototype.initSystem = function()
{
	//initialize particle system
	for(var i = 0;i<this.num;++i)
	{
		var offset = i*DOT_PART_TOTAL;
		this.dotStat[offset+DOT_PART_MASS] = 0;
	}
}
ParticleSystemBase.prototype.addForce = function(f){
	this.forces.push(f);
	
	if(this.forces[this.forces.length-1].type===F_SPRING)
	{
		var offset_0 = f.e0*PART_MAXVAR;
		var offset_1 = f.e1*PART_MAXVAR;
		var ep0 = this.S0.subarray(offset_0 + PART_XPOS, offset_0 + PART_XPOS + 3);
		var ep1 = this.S0.subarray(offset_1 + PART_XPOS, offset_1 + PART_XPOS + 3);
		this.forces[this.forces.length-1].calcRest(ep0,ep1);
	}
}

SimplePS = function(num,numEnv)
{
	ParticleSystemBase.prototype.constructor.call(this,num,numEnv);
}
SimplePS.prototype = Object.create(ParticleSystemBase.prototype);
SimplePS.prototype.constructor = SimplePS;

SimplePS.prototype.initSystem = function()
{
	ParticleSystemBase.prototype.initSystem.call(this);
	for(var i=0;i<this.num;++i)
	{
		var offset = i*PART_MAXVAR;
		this.curStat[offset+PART_XPOS] = getRandomArbitrary(-100,100);
		this.curStat[offset+PART_YPOS] = 150;
		this.curStat[offset+PART_ZPOS] = getRandomArbitrary(-100,100);
		this.curStat[offset+PART_XVEL] = 0;
		this.curStat[offset+PART_YVEL] = 0;
		this.curStat[offset+PART_ZVEL] = 0;
		this.curStat[offset+PART_R] = 1.0;
		this.curStat[offset+PART_G] = 1.0;
		this.curStat[offset+PART_B] = getRandomArbitrary(0,1);
		this.curStat[offset+PART_A] = 1.0;
		this.curStat[offset+PART_DIAM] = 20;
		this.curStat[offset+PART_MOVEABLE]=1;
		this.curStat[offset+PART_MASS]=1.0;
	}
	
	
//	this.curStat[PART_XPOS] = -50;
//	this.curStat[PART_ZPOS] = 10;
//	this.curStat[PART_MAXVAR+PART_XPOS] = 50;
//	this.curStat[PART_MAXVAR+PART_ZPOS] = 10;
	this.curStat[PART_MOVEABLE] = 0;
	
//	console.log(this.curStat);
}

SimplePS.prototype.solver = function(t)
{
	for(var i = 0;i<this.num;++i)
	{
		var offset = i*PART_MAXVAR;
		var dotOff = i*DOT_PART_TOTAL;
		var curS = this.curStat.subarray(offset,offset+PART_MAXVAR);
		var nextS = this.nextStat.subarray(offset,offset+PART_MAXVAR);
		var dotS = this.dotStat.subarray(dotOff,dotOff+DOT_PART_TOTAL);
		
		//calc vel
		var curVel = vec3.fromValues(curS[PART_XVEL],curS[PART_YVEL],curS[PART_ZVEL]);
		console.log(vec3.str(curVel));
		var curAcc = vec3.fromValues(dotS[DOT_PART_XVEL],dotS[DOT_PART_YVEL],dotS[DOT_PART_ZVEL]);
		console.log(vec3.str(curAcc));
		var nextVel = vec3.scaleAndAdd(curVel,curVel,curAcc,t);
    nextS[PART_XVEL] = nextVel[0];
		nextS[PART_YVEL] = nextVel[1];
		nextS[PART_ZVEL] = nextVel[2];
		//implicit Euler
		vec3.scaleAndAdd(nextVel,nextVel,curVel,0.5);
		console.log(vec3.str(nextVel));
		
		//update pos
		var pos = vec3.fromValues(curS[PART_XPOS],curS[PART_YPOS],curS[PART_ZPOS]);
		vec3.scaleAndAdd(pos,pos,nextVel,t);
		nextS[PART_XPOS] = pos[0];
		nextS[PART_YPOS] = pos[1];
		nextS[PART_ZPOS] = pos[2];
	}
}
