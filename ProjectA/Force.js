const F_MOUSE  = 1;
const F_GRAV_E = 2;
const F_GRAV_P = 3;                            // you 'grab' and 'wiggle' one particle(or several).
const F_WIND = 4;
const F_BUBBLE = 5;
const F_DRAG = 6;
const F_SPRING = 7;
const F_SPRINGSET = 8;
const F_CHARGE = 9;
const F_TOTAL = 10;

//#define F_GRAV_E    2       // Earth-gravity: pulls all particles 'downward'.
//#define F_GRAV_P    3       // Planetary-gravity; particle-pair (e0,e1) attract
//                            // each other with force== grav* mass0*mass1/ dist^2
//#define F_WIND      4       // Blowing-wind-like force-field;fcn of 3D position
//#define F_BUBBLE    5       // Constant inward force towards centerpoint if
//                            // particle is > max_radius away from centerpoint.
//#define F_DRAG      6       // Viscous drag -- proportional to neg. velocity.
//#define F_SPRING    7       // ties together 2 particles; distance sets force
//#define F_SPRINGSET 8       // a big collection of identical springs; lets you
//                            // make cloth & rubbery shapes as one force-making
//                            // object, instead of many many F_SPRING objects.
//#define F_CHARGE    9       // attract/repel by charge and inverse distance;
//                            // applies to all charged particles.
//#define F_MAXKINDS  10      // 'max' is always the LAST name in our list;
//                            // gives the total number of choices for forces.
ForceBase = function(){
	this.enabled = false;
	this.force = null;
}
ForceBase.prototype.constructor = ForceBase;
ForceBase.prototype.calcForce = function()
{
}

GravityForce = function(dir,g,damp){
	ForceBase.prototype.constructor.call(this);
	this.dir = dir;
	this.g = g;
	this.type = F_GRAV_E;
	this.enabled = true;
	this.damp = damp;
	this.force = vec3.scale(vec3.create(),this.dir,this.g);
}
GravityForce.prototype = Object.create(ForceBase.prototype);
GravityForce.prototype.constructor = GravityForce;
GravityForce.prototype.calcForce = function()
{
	this.force = vec3.scale(vec3.create(),this.dir,this.g);
}
GravityForce.prototype.update = function(dt){
	var damp = Math.pow(this.damp,dt);
	vec3.scale(this.force,this.force,damp);
}


/****************************************************************/
//Spring Force
SpringForce = function(pi0,pi1,k,damp)
{
	ForceBase.prototype.constructor.call(this);
	this.type = F_SPRING;
	this.k = k;
	this.damp = damp;
	this.pi0 = pi0;
	this.pi1 = pi1;
	this.rest_dist = 0;
	this.enabled = true;
	this.force =  null;
}
SpringForce.prototype = Object.create(ForceBase.prototype);
SpringForce.prototype.constructor = ForceBase;
//ep0, ep1 are position of this.e0, this.e1 in the particle arrays
SpringForce.prototype.calcRest = function(ep0,ep1){
	//var vp0 = vec3.fromValues(ep0[0],ep0[1],ep0[2]);
	//var vp1 = vec3.fromValues(ep1[0],ep1[1],ep1[2]);
	this.rest_dist = vec3.dist(ep0,ep1);
}
SpringForce.prototype.calcForce = function(ep0,ep1)
{
	var vp0 = vec3.fromValues(ep0[0],ep0[1],ep0[2]);
	var vp1 = vec3.fromValues(ep1[0],ep1[1],ep1[2]);
	var cur_dist = vec3.dist(vp0,vp1);
	this.force = vec3.sub(vec3.create(),vp0,vp1);
	var magnitude = Math.abs(cur_dist-this.rest_dist)*this.k;
	vec3.normalize(this.force,this.force);
	vec3.scale(this.force,this.force,-magnitude);
	console.log(vec3.str(this.force));
}


WindForce = function()
{
	ForceBase.prototype.constructor.call(this);
	this.type = F_WIND;
	this.dirStep = 1/7000.0;
	this.forceStep = [1/2000.0,1/3000.0,1/2000.0];
}

WindForce.prototype = Object.create(ForceBase.prototype);
WindForce.prototype.constructor = WindForce;

WindForce.prototype.update = function(t)
{
	var mag = Math.cos(t*this.dirStep)*10+10;
	this.force = vec3.fromValues(Math.sin(this.forceStep[0]*t),Math.cos(this.forceStep[1]*t),Math.sin(this.forceStep[2]*t));
	vec3.normalize(this.force,this.force);
	vec3.scale(this.force,this.force,mag);
}

