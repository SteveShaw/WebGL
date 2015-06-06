const LIGHT_DIRECTIONAL = 0; //Directional Light
const LIGHT_POINT = 1;
const LIGHT_AREA = 2;
const LIGHT_SPHERE_POINT = 2;

const DATA_LIGHT_POS = 0;
const DATA_LIGHT_DIR = 1;
const DATA_LIGHT_KD = 2;
const DATA_LIGHT_KS = 3;
const DATA_LIGHT_I = 4;
const DATA_LIGHT_K0 = 5;
const DATA_LIGHT_K1 = 6;
const DATA_LIGHT_K2 = 7;

DirLight = function (dir) {
	this.type = LIGHT_DIRECTIONAL;

	this.w = 0.0;
	this.kd = vec3.fromValues(1.0, 1.0, 1.0);
	this.ks = vec3.fromValues(1.0, 1.0, 1.0);
	this.dir = vec3.fromValues(1, -1, 0);

	this.isCastShadow = false;
	// this.isEffect = true;

	if (dir !== undefined) {
		vec3.copy(this.dir, dir);
	}

	this.invDir = vec3.clone(this.dir);
	vec3.scale(this.invDir, this.invDir, -1);

	vec3.normalize(this.invDir, this.invDir);
	vec3.normalize(this.dir, this.dir);
}
DirLight.prototype.constructor = DirLight;

PointLight = function (pos) {
	this.type = LIGHT_POINT;
	this.kd = vec3.fromValues(1.0, 1.0, 1.0);
	this.ks = vec3.fromValues(1.0, 0.8, 1.0);
	this.pos = vec3.clone(pos);
	this.invDir = vec3.create();
	this.isCastShadow = true;
	this.w = 0.6;
	// this.isEffect = true;
	this.theta = 0.0;
	this.phi = 0.0;
	this.center = vec3.create();
	this.k0 = 1.0;
	this.k1 = 0;
	this.k2 = 0;
	this.radius = 100;
}
PointLight.prototype.constructor = PointLight;
PointLight.prototype.setMoveSphere = function(center,radius,theta,phi)
{
	vec3.copy(this.center,center);
	this.radius = radius;
	this.pos[1] = radius + this.center[1];
	this.pos[2] = this.center[2];
	this.pos[0] = this.center[0];
	
	if(theta!==undefined)
	{
		this.theta = theta;
	}
	
	if(phi!==undefined)
	{
		this.phi = phi;
	}
	
	if((theta!==undefined) || (phi!==undefined))
	{
		this.pos[1] = this.center[1] + this.radius*Math.cos(this.theta);
		this.pos[2] = this.center[2] + this.radius*Math.sin(this.theta)*Math.cos(this.phi);
		this.pos[0] = this.center[0] + this.radius*Math.sin(this.theta)*Math.sin(this.phi);
	}
}
PointLight.prototype.rotate = function(deltaTheta,deltaPhi)
{
	this.theta += deltaTheta;
	this.phi += deltaPhi;
	this.pos[1] = this.center[1] + this.radius*Math.cos(this.theta);
	this.pos[2] = this.center[2] + this.radius*Math.sin(this.theta)*Math.cos(this.phi);
	this.pos[0] = this.center[0] + this.radius*Math.sin(this.theta)*Math.sin(this.phi);
}
PointLight.prototype.move = function(delta)
{
	vec3.add(this.center,this.center,delta);
	this.pos[1] = this.center[1] + this.radius*Math.cos(this.theta);
	this.pos[2] = this.center[2] + this.radius*Math.sin(this.theta)*Math.cos(this.phi);
	this.pos[0] = this.center[0] + this.radius*Math.sin(this.theta)*Math.sin(this.phi);
}
PointLight.prototype.update = function()
{
	this.pos[1] = this.center[1] + this.radius*Math.cos(this.theta);
	this.pos[2] = this.center[2] + this.radius*Math.sin(this.theta)*Math.cos(this.phi);
	this.pos[0] = this.center[0] + this.radius*Math.sin(this.theta)*Math.sin(this.phi);
}

function lightDataFlatten(lights, dataType, lightType) {
	var sum = [];
	for (var i = 0; i < lights.length; ++i) {
		if (lights[i].type === lightType) {
			switch (dataType) {
			case DATA_LIGHT_POS:
				//if(lights[i].pos.length>0)
				sum.push(lights[i].pos[0], lights[i].pos[1], lights[i].pos[2]);
				break;
			case DATA_LIGHT_DIR:
				sum.push(lights[i].dir[0], lights[i].dir[1], lights[i].dir[2]);
				break;
			case DATA_LIGHT_KD:
				sum.push(lights[i].kd[0], lights[i].kd[1], lights[i].kd[2]);
				break;
			case DATA_LIGHT_KS:
				sum.push(lights[i].ks[0], lights[i].ks[1], lights[i].ks[2]);
				break;
			case DATA_LIGHT_I:
				sum.push(lights[i].w);
				break;
			case DATA_LIGHT_K0:
				sum.push(lights[i].k0);
				break;
			case DATA_LIGHT_K1:
				sum.push(lights[i].k1);
				break;
			case DATA_LIGHT_K2:
				sum.push(lights[i].k2);
				break;
			}
		}
	}
	return sum;
}

//Area light
//normal -- normal vector: normalized
//center -- the center of the area light
//size ---  width, height of the rectangle, z value is set to 1
//here we define a generic rectangle and apply transformation to it
AreaLight = function (center, size, normal) {
	
	this.center = vec3.clone(center);
	this.size = vec3.clone(size);
	this.normal = vec3.clone(normal);
	this.type = LIGHT_AREA;
	this.kd = [1.0, 1.0, 1.0];
	this.ks = [1.0, 0.0, 1.0];
	this.isCastShadow = true;
	vec3.normalize(this.normal, this.normal);
	this.invDir = vec3.clone(this.normal);
	vec3.scale(this.invDir, this.invDir, -1.0);
	// this.isEffect = true;

	this.source = new Rectangle();
	this.source.getTransMat(this.center, this.size, this.normal);

	this.a = vec3.clone(this.source.a);
	var dir = vec4.fromValues(this.a[0], this.a[1], this.a[2], 0);
	vec4.transformMat4(dir, dir, this.source.transMat);
	vec3.set(this.a, dir[0], dir[1], dir[2]);

	this.b = vec3.clone(this.source.b);
	vec4.set(dir, this.b[0], this.b[1], this.b[2], 0);
	vec4.transformMat4(dir, dir, this.source.transMat);
	vec3.set(this.b, dir[0], dir[1], dir[2]);
	
	console.log(this.a);
	console.log(this.b);

	this.samples = [];
	this.cur_sp = vec3.create(); //current sample point
	this.sample_points = 36;
	this.sample_lights = [];

	var scope = this;

	this.count = 0;
	this.w = 0.8;
	
	this.k0 = 1.0;
	this.k1 = 0.0;
	this.k2 = 0.0;

	gen_samples();
	//generate sampled point lights
	gen_sample_lights();

	// for (var i = 0; i < this.sample_points; ++i) {
		// this.shuffled_indices.push(i);
	// }
	// shuffle(this.shuffled_indices);


	function gen_samples() {

		var n = Math.floor(Math.sqrt(scope.sample_points));

		for (var j = 0; j < n; j++)
			for (var k = 0; k < n; k++) {
				x = k + Math.random();
				x /= n;
				y = j + Math.random();
				y /= n;

				scope.samples.push(vec2.fromValues(x, y));
			}

	}
	
	function gen_sample_lights(){
		var l = null;
		for(var i =0;i<scope.samples.length;++i)
		{
			scope.sample_lights.push(new PointLight(scope.center));
			l = scope.sample_lights[i];
			vec3.scaleAndAdd(l.pos,l.pos,scope.a,0.5-scope.samples[i][0]);
			vec3.scaleAndAdd(l.pos,l.pos,scope.b,0.5-scope.samples[i][1]);
			l.w = 1.0/scope.samples.length*scope.w;
			vec3.copy(l.kd,scope.kd);
			vec3.copy(l.ks,scope.ks);
		}
	}
}

AreaLight.prototype.constructor = AreaLight;
