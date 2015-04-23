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
const PART_MASS     =12;  // mass   
const PART_DIAM 		=13;	// on-screen diameter (in pixels)
const PART_RENDMODE =14;	// on-screen appearance (square, round, or soft-round)
const PART_OLD_XPOS =15;
const PART_OLD_YPOS =16;
const PART_OLD_ZPOS =17;
//Number of States in one Particle
const PART_MAXVAR   =18;  // Size of array in CPart uses to store its values.


const CONS_NONE = 0;
const CONS_WIND = 1;
Constraints = function(){
	this.type = CONS_NONE;
}
Constraints.prototype.satisfy = function()
{
}

Constraints.prototype.constructor = Constraints;

WindConstraints.prototype = Object.create(Constraints.prototype);

WindConstraints = function(id1,id2,p1,p2){
	this.type = CONS_WIND;
	
	var vp1 = vec3.fromValues(p1[0],p1[1],p1[2]);
	 var vp2 = vec3.fromValues(p2[0],p2[1],p2[2]);
	var diff = vec3.subtract(vec3.create(),vp1,vp2);
	this.idxArr = [id1,id2]; //the index of the input points and will be used in the later processing.
	this.rest_dist = vec3.length(diff);
}

WindConstraints.prototype.satisfy = function(p1,p2)
{
	var diff = vec3.subtract(vec3.create(),vec3.fromValues(p2[0],p2[1],p2[2]),vec3.fromValues(p1[0],p1[1],p1[2]));
	var cur_dist = vec3.length(diff); // current distance between p1 and p2
	vec3.scale(diff, diff, (1 - rest_dist/ cur_dist)*0.5 );
	
	p1[0] += tempVec3[0];
	p1[1] += tempVec3[1];
	p1[2] += tempVec3[2];
	p2[0] -= tempVec3[0];
	p2[1] -= tempVec3[1];
	p2[2] -= tempVec3[2];
}

ParticleSystem = function(numX, numZ, numEnv){
	this.number = numX * numZ;
	this.numX = numX;
	this.numZ = numZ;
	this.numEnv = numEnv;
	this.drag = vec3.fromValues(1,1,1);
	this.particles = new Float32Array(PART_MAXVAR*this.number+this.numEnv*PART_MAXVAR);
	this.pointFaces = new Uint16Array(this.number);
	this.contraints = [];
	this.elemSize = this.particles.BYTES_PER_ELEMENT;
};
ParticleSystem.prototype.addForce = function(force){
	var start = this.numEnv*PART_MAXVAR;
	for(var i = 0;i<this.numX;++i)
	{
		for(var j = 0;j<this.numY;++j)
		{
			var pos = j*this.numX + i;
			var offset = pos*PART_MAXVAR+start;
			
			this.particles[offset+PART_X_FTOT] += force[0];
			this.particles[offset+PART_Y_FTOT] += force[1];
			this.particles[offset+PART_Z_FTOT] += force[2];
		}
	}
}
ParticleSystem.prototype.constructor = ParticleSystem;
ParticleSystem.prototype.dotMaker = function(drvState,prevState){
}

ParticleSystem.prototype.solver = function(nextState,prevState,drvState){
}

ParticleSystem.prototype.applyContraints = function(pos,vel){
		if(pos[1]<0 && vel[1]<0)
		{
			vel[1] = -vel[1];
		}
		else if(pos[1]>200 && vel[1]>0)
		{
			vel[1] = -vel[1];
		}
	
//	if(pos[1]<0) pos[1] = 0;
}
ParticleSystem.prototype.initSystem = function()
{
	var start = this.numEnv*PART_MAXVAR;
	for(var i = 0;i<this.numX;++i)
	{
		for(var j = 0;j<this.numZ;++j){
			var pos = j*this.numX+i;
		var offset = pos*PART_MAXVAR+start;
		this.particles[offset+PART_XPOS] = i*200/this.numX - 100;
		this.particles[offset+PART_YPOS] = getRandomArbitrary(50,200);
		this.particles[offset+PART_ZPOS] = 200/this.numZ*j - 100;
		this.particles[offset+PART_XVEL] = 0;
		this.particles[offset+PART_YVEL] = 0;
		this.particles[offset+PART_ZVEL] = 0;
		this.particles[offset+PART_X_FTOT] = 0;
		this.particles[offset+PART_Y_FTOT] = -0.985;
		this.particles[offset+PART_Z_FTOT] = 0;
		this.particles[offset+PART_R] = getRandomArbitrary(0,1);
		this.particles[offset+PART_G] = getRandomArbitrary(0,1);
		this.particles[offset+PART_B] = getRandomArbitrary(0,1);
		this.particles[offset+PART_MASS] = 1;
		this.particles[offset+PART_DIAM] = getRandomArbitrary(2,10);
		this.particles[offset+PART_RENDMODE] = 0;
		}
	}
};

ParticleSystem.prototype.setPointFaces = function(startIndex){
	for(var i=0;i<this.pointFaces.length;++i)
	{
		this.pointFaces[i] = startIndex+i;
	}
}

ParticleSystem.prototype.setEnv = function(verArr,clrArr){
	var envData = this.particles.subarray(0,this.numEnv*PART_MAXVAR);
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

ParticleSystem.prototype.update = function(t){
	var start = this.numEnv*PART_MAXVAR; //we will skip environmental points
	var factor = Math.pow(0.998,t);
	var drag = vec3.create();
	vec3.scale(drag,this.drag,factor);
	for(var i = 0;i<this.number;++i)
	{
		
		var offset = i*PART_MAXVAR+start;
		
		this.particles[offset+PART_XVEL] += this.particles[offset+PART_X_FTOT]*this.particles[offset+PART_MASS]*t;
		this.particles[offset+PART_YVEL] += this.particles[offset+PART_Y_FTOT]*this.particles[offset+PART_MASS]*t;
		this.particles[offset+PART_ZVEL] += this.particles[offset+PART_Z_FTOT]*this.particles[offset+PART_MASS]*t;
		this.particles[offset+PART_XVEL] *= drag[0];
		this.particles[offset+PART_YVEL] *= drag[1];
		this.particles[offset+PART_ZVEL] *= drag[2];
		
		this.particles[offset+PART_XPOS] += this.particles[offset+PART_XVEL]*t;
		this.particles[offset+PART_YPOS] += this.particles[offset+PART_YVEL]*t;
		this.particles[offset+PART_ZPOS] += this.particles[offset+PART_ZVEL]*t;
		
		this.applyContraints(this.particles.subarray(offset+PART_XPOS,offset+PART_XPOS+3)
												 ,this.particles.subarray(offset+PART_XVEL,offset+PART_XVEL+3));
	}
}
Particle = function() {
//	this.position = new Float32Array([0,0,0]);
	this.position = vec3.fromValues(0,0,0);
	this.vel = vec3.fromValues(5,0,0);//new Float32Array([0,0,0]);
	this.acc = vec3.fromValues(0,0,0);//[];//new Float32Array([0,0,0]);
	this.gravity = vec3.fromValues(0,-0.985,0);//[];//new Float32Array([0,0,0]);
	
	this.force = vec3.fromValues(0,0,0);//[];//new Float32Array([0,0,0]);
	this.inverseMass = 0.5; //we are using inverse mass
}
Particle.prototype = {
	
	constructor: Particle,

	addForce: function(f)
	{
		vec3.add(this.force,this.force,f);
	},
	
	setAcceleration: function()
	{
		vec3.scaleAndAdd(this.acc,this.acc,this.gravity,this.inverseMass);
		console.log(vec3.str(this.acc));
		
	},
	
	integrator: function(duration)
	{
//		this.addScalarVector3(this.position,this.vel,duration);
	vec3.scaleAndAdd(this.position,this.position,this.vel,duration);
	vec3.scaleAndAdd(this.vel,this.vel,this.acc,duration);
		if(this.position[1]<0 && this.vel[1]<0)
		{
			vec3.mul(this.vel,this.vel,vec3.fromValues(1,-1,1));
		}
		else if(this.position[1]>200 && this.vel[1]>0)
		{
			vec3.mul(this.vel,this.vel,vec3.fromValues(1,-1,1));
		}
		if(this.position[0]>250 && this.vel[0]>0)
		{
			vec3.mul(this.vel,this.vel,vec3.fromValues(-1,1,1));
		}
		else if(this.position[0]<-250 && this.vel[0]<0)
		{
			vec3.mul(this.vel,this.vel,vec3.fromValues(-1,1,1));
		}
	},

}