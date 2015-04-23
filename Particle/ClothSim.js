SimBase = function(){
	this.forces = [];
	this.constraints = [];
}

SimBase.prototype.constructor = SimBase;
SimBase.prototype.addForce = function(f){
	this.forces.push(f);
}
SimBase.prototype.addConstraints = function(c){
	this.constraints.push(c);
}

SimBase.prototype.dotFinder = function(){
}

SimBase.prototype.solvert = function(){
}

SimBase.prototype.applyContraints = function()
{
}
SimBase.prototype.swap = function() {
}
SimBase.prototype.render = function(gl,cont){
	gl.bufferSubData(gl.ARRAY_BUFFER,0,cont.meshes.curVert.subarray(0,cont.nextOff));
}
SimBase.prototype.update = function(gl,cont){
	this.dotFinder();
	this.render(gl,cont);
	this.solver();
	this.applyContraints();
	
	this.swap();
	//swap curStat and nextStat;
//	if(this.sel==0)
//	{
//		this.curStat = this.S1;
//		this.nextStat = this.S0.subarray(0,this.num*PART_MAXVAR);
//	}
//	else
//	{
//		this.curStat = this.S0.subarray(0,this.num*PART_MAXVAR);
//		this.nextStat = this.S1;
//	}
//
//	this.sel++;
//	this.sel%=2;
//	this.curStat = this.S1;
//	this.nextStat = this.S0;
}

ClothSim = function(numX,numY,cont){
	SimBase.prototype.constructor.call(this);
//	this.cont = cont; //the container object
	this.numX = numX;
	this.numY = numY;
	this.totalPoints = (this.numX+1)*(this.numY+1);
	this.size = 150;
	this.hsize = this.size/2;
	this.startOff = cont.nextOff; //the start offset in the vertex array in container;
	cont.nextOff += (this.totalPoints)*PART_MAXVAR;
	this.S0 = cont.meshes.curVert.subarray(this.startOff,this.startOff+(this.totalPoints)*PART_MAXVAR);
	this.S1 = cont.meshes.nextVert.subarray(this.startOff,this.startOff+(this.totalPoints)*PART_MAXVAR);
	this.faces = null;
	this.dt = 1.0/60;
	this.dotStat = cont.dotStat.subarray(this.startOff,this.startOff+(this.totalPoints)*PART_MAXVAR);
}

ClothSim.prototype = Object.create(SimBase.prototype);
ClothSim.prototype.constructor = ClothSim;
ClothSim.prototype.resetForce = function(){
	for(var i =0;i<this.totalPoints;++i)
	{
		var offset = i*PART_MAXVAR;
		this.S0[offset+PART_X_FTOT] = 0;
		this.S0[offset+PART_Y_FTOT] = 0;
		this.S0[offset+PART_Z_FTOT] = 0;
	}
	
}
ClothSim.prototype.applyGeneralForce = function(f){
	for(var i =0;i<this.totalPoints;++i)
	{
		var offset = i*PART_MAXVAR;
		if(i===0||i===this.numX){
			continue;
		}
		
		this.S0[offset+PART_X_FTOT] += f.force[0];
		this.S0[offset+PART_Y_FTOT] += f.force[1];
		this.S0[offset+PART_Z_FTOT] += f.force[2];
		
		this.S0[offset+PART_X_FTOT] -= this.S0[offset+PART_XVEL]*f.damp;
		this.S0[offset+PART_Y_FTOT] -= this.S0[offset+PART_YVEL]*f.damp;
		this.S0[offset+PART_Z_FTOT] -= this.S0[offset+PART_ZVEL]*f.damp;
	}
}

ClothSim.prototype.applySpringForce = function(f){
	var p0 = this.S0.subarray(f.pi0*PART_MAXVAR+PART_XPOS,f.pi0*PART_MAXVAR+PART_XPOS+3);
	var p1 = this.S0.subarray(f.pi1*PART_MAXVAR+PART_XPOS,f.pi1*PART_MAXVAR+PART_XPOS+3);
	var v0 = this.S0.subarray(f.pi0*PART_MAXVAR+PART_XVEL,f.pi0*PART_MAXVAR+PART_XVEL+3);
	var v1 = this.S0.subarray(f.pi1*PART_MAXVAR+PART_XVEL,f.pi1*PART_MAXVAR+PART_XVEL+3);
	
	var vp0 = vec3.fromValues(p0[0],p0[1],p0[2]);
	var vp1 = vec3.fromValues(p1[0],p1[1],p1[2]);
	var vv0 = vec3.fromValues(v0[0],v0[1],v0[2]);
	var vv1 = vec3.fromValues(v1[0],v1[1],v1[2]);
	
	var deltaP = vec3.sub(vec3.create(),vp0,vp1);
	var deltaV = vec3.sub(vec3.create(),vv0,vv1);
	
	var curLen = vec3.distance(vp0,vp1);
	var leftTerm  = -f.k * (curLen-f.rest_dist);
	var rightTerm = -f.damp * ((vec3.dot(deltaV,deltaP))/curLen);
	vec3.normalize(deltaP,deltaP);
	vec3.scale(deltaP,deltaP,leftTerm+rightTerm);
	
	if(f.pi0!=0 && f.pi0!=this.numX)
	{
		this.S0[f.pi0*PART_MAXVAR+PART_X_FTOT]+=deltaP[0];
		this.S0[f.pi0*PART_MAXVAR+PART_Y_FTOT]+=deltaP[1];
		this.S0[f.pi0*PART_MAXVAR+PART_Z_FTOT]+=deltaP[2];
	}
	
	if(f.pi1!=0 && f.pi1!=this.numX)
	{
		this.S0[f.pi1*PART_MAXVAR+PART_X_FTOT]-=deltaP[0];
		this.S0[f.pi1*PART_MAXVAR+PART_Y_FTOT]-=deltaP[1];
		this.S0[f.pi1*PART_MAXVAR+PART_Z_FTOT]-=deltaP[2];
	}
//	   		var springForce = (deltaP.normalize()).multiplyScalar(leftTerm + rightTerm);
//
//	   		if(springs[i].p1 != 0 && springs[i].p1 != numX)
//	   			F[springs[i].p1].addSelf(springForce);
//	   		if(springs[i].p2 != 0 && springs[i].p2 != numX )
//	   			F[springs[i].p2].subSelf(springForce);
}

ClothSim.prototype.dotFinder = function(){

	this.resetForce();
	for(var i = 0;i<this.forces.length;++i)
	{
		var f = this.forces[i];
		switch(f.type)
		{
				case F_GRAV_E:
//				f.update(this.dt);
				this.applyGeneralForce(f);	
				break;
				case F_SPRING:
				this.applySpringForce(f);
				break;
		}
	}
		//set dotStat variable
	for(i = 0;i<this.numX*this.numY;++i)
	{
		var offset = i*PART_MAXVAR;
		//set acceleration
		this.dotStat[offset+DOT_PART_XVEL] = this.S0[offset+PART_X_FTOT]*1.0/this.S0[offset+PART_MASS];
		this.dotStat[offset+DOT_PART_YVEL] = this.S0[offset+PART_Y_FTOT]*1.0/this.S0[offset+PART_MASS];
		this.dotStat[offset+DOT_PART_ZVEL] = this.S0[offset+PART_Z_FTOT]*1.0/this.S0[offset+PART_MASS];
	}
}
ClothSim.prototype.initSim = function()
{
	var v = this.numY + 1;
	var u = this.numX + 1;
	var idx = 0;
	for(var j=0; j<v; ++j)
	{
		for(var i=0; i<u; ++i)
		{
			var offset = idx*PART_MAXVAR;
			this.S0[offset+PART_XPOS] = ((i/(u-1)) *2.0-1.)* this.hsize;
			this.S0[offset+PART_YPOS] = this.size+1;
			this.S0[offset+PART_ZPOS] = j/(v-1.0)*this.size;
			
			this.S0[offset+PART_XVEL ] = 0;
			this.S0[offset+PART_YVEL ] = 0;
			this.S0[offset+PART_ZVEL ] = 0;
			
			this.S0[offset+PART_DIAM] = 2.5;
			
			this.S0[offset+PART_R] = 1;
			this.S0[offset+PART_G] = 1;
			this.S0[offset+PART_B] = Math.random();
			
			++idx;
		}
	}
	
//	console.log(idx);
	
	faces = [];
	for(var i = 0; i<this.numY; i++)
	{
		for(var j = 0;j<this.numX; j++)
		{
			var i0 = i*(this.numX+1)+j;
			var i1 = i0+1;
			var i2 = i0+(this.numX+1);
			var i3 = i2 + 1;
			
			if((j+1)%2)
			{
				faces.push(i0,i2,i1);
				faces.push(i1,i2,i3);
			}
			else
			{
				faces.push(i0,i2,i3);
				faces.push(i0,i3,i1);
			}
		}
	}
	
	var p0=0,p1=0;
	this.faces = new Uint16Array(faces);
			//setup springs
		// Horizontal
		for (var l1 = 0; l1 < v; l1++)	// v
			for (var l2 = 0; l2 < (u - 1); l2++) {
				p0 = (l1*u)+l2;
				this.forces.push(new SpringForce(p0, p0 + 1,1000,0.5));
			}

		// Vertical
		for (l1 = 0; l1 < (u); l1++)
			for (l2 = 0; l2 < (v - 1); l2++) {
				p0 = (l2*u)+l1;
				this.forces.push(p0,p0+1,1000,0.5);
			}

		// Shearing Springs
		for (l1 = 0; l1 < (v - 1); l1++)
			for (l2 = 0; l2 < (u - 1); l2++) {
				p0 = (l1*u)+l2;
				p1 = ((l1+1)*u)+l2+1;
				this.forces.push(new SpringForce(p0, p1,1000,0.5));
				this.forces.push(new SpringForce(p1-1,p0+1,1000,0.5));
			}

		// Bend Springs
		for (l1 = 0; l1 < (v); l1++) {
			for (l2 = 0; l2 < (u - 2); l2++) {
				p0 = (l1*u)+l2;
				this.forces.push(new SpringForce(p0,p0+2,1000,0.5));
				
			}
			
			p0 = (l1 * u) + (u - 3);
			this.forces.push(new SpringForce(p0,p0+2,1000,0.5));
		}
		for (l1 = 0; l1 < (u); l1++) {
			for (l2 = 0; l2 < (v - 2); l2++) {
				p0 = (l2 * u) + l1;
				p1 = ((l2 + 2) * u) + l1;
				this.forces.push(new SpringForce(p0,p1,1000,0.5));
			}
			p0 = ((v - 3) * u) + l1;
			p1 = ((v - 1) * u) + l1;
			this.forces.push(new SpringForce(p0,p1,1000,0.5));
		}
	
	this.forces.push(new GravityForce(vec3.fromValues(0,-1,0),9.8,60));
	
	for(i = 0;i<this.forces.length;++i)
	{
		if(this.forces[i].type===F_SPRING)
		{
				var off_p0 = this.forces[i].pi0*PART_MAXVAR+PART_XPOS;
				var off_p1 = this.forces[i].pi1*PART_MAXVAR+PART_XPOS;
				var p0 = this.S0.subarray(off_p0,off_p0+3);
				var p1 = this.S0.subarray(off_p1,off_p1+3);
				this.forces[i].calcRest(p0,p1);
		}
	}
	
	
}

ClothSim.prototype.solver = function(){
	//implicit euler
	
	for(var i = 0;i<this.numX*this.numY;++i)
	{
		var offset = i*PART_MAXVAR;
		//update vel
		this.S1[offset+PART_XVEL] = this.S0[offset+PART_XVEL] + this.dotStat[offset+DOT_PART_XVEL]*this.dt;
		this.S1[offset+PART_YVEL] = this.S0[offset+PART_YVEL] + this.dotStat[offset+DOT_PART_YVEL]*this.dt;
		this.S1[offset+PART_ZVEL] = this.S0[offset+PART_ZVEL] + this.dotStat[offset+DOT_PART_ZVEL]*this.dt;
		//update pos
		this.S1[offset+PART_XPOS] = this.S0[offset+PART_XPOS] + this.S0[offset+PART_XVEL]*this.dt;
		this.S1[offset+PART_YPOS] = this.S0[offset+PART_YPOS] + this.S0[offset+PART_YVEL]*this.dt;
		this.S1[offset+PART_ZPOS] = this.S0[offset+PART_ZPOS] + this.S0[offset+PART_ZVEL]*this.dt;
	}
}

ClothSim.prototype.swap = function(){
	var temp = this.S0;
	this.S0 = this.S1;
	this.S1 = temp;
}
