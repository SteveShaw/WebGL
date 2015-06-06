Rectangle = function () {
	this.p0 = [-0.5, 0, -0.5];
	this.a = [0, 0, 1];
	this.b = [1, 0, 0];
	//this.normal = [0, 1, 0];
	this.canTrace = true;
	this.renderGL = true;
}

Rectangle.prototype.constructor = Rectangle;

Rectangle.prototype.genGeometry = function (pos, size, normal, material) {

	this.geo = new Geometry();
	this.geo.vertices = [-0.5, 0, 0.5, 0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, -0.5];
	this.geo.faces = [1, 3, 2, 0, 1, 2];
	for (var i = 0; i < 4; i++) {
		this.geo.normals.push(0, 1, 0);
	}

	this.getTransMat(pos, size, normal);
	var matte = Material(material);
	vec3.copy(this.geo.ka, matte.ambient);
	vec3.copy(this.geo.kd, matte.diffuse);
	vec3.copy(this.geo.ks, matte.specular);
	this.geo.shn = matte.shiny;

	this.renderMesh = new RenderMesh(this.geo);
}

// Rectangle.prototype.addMaterial = function(material)
// {
	// var matte = Material(material);
	// this.geo.ka_list.push(vec3.clone(matte.ambient));
	// this.geo.kd_list.push(vec3.clone(matte.diffuse));
	// this.geo.ks_list.push(vec3.clone(matte.specular));
	// this.geo.shn_list.push(matte.shiny);
// }



Rectangle.prototype.getTransMat = function (pos, size, normal) {
	this.transMat = mat4.create();
	var m = mat4.create();
	mat4.translate(m, m, pos);
	mat4.multiply(this.transMat, this.transMat, m);

	//rotate
	var q = quat.create();
	quat.rotationTo(q, [0, 1, 0], normal);

	this.normal = vec3.clone(normal);

	mat4.identity(m);
	mat4.fromQuat(m, q);

	mat4.multiply(this.transMat, this.transMat, m);

	mat4.identity(m);
	mat4.scale(m, m, size);

	mat4.multiply(this.transMat, this.transMat, m);

	this.transRayMat = mat4.create();
	mat4.invert(this.transRayMat, this.transMat);

	this.transNormalMat = mat4.create();
	mat4.transpose(this.transNormalMat, this.transRayMat);
}

Rectangle.prototype.checkRayHit = function (ray) {

	var rayPos = vec3.clone(ray.pos);
	vec3.transformMat4(rayPos, rayPos, this.transRayMat);

	var dir4 = vec4.fromValues(ray.dir[0], ray.dir[1], ray.dir[2], 0);
	vec4.transformMat4(dir4, dir4, this.transRayMat);

	var rayDir = vec3.fromValues(dir4[0], dir4[1], dir4[2]);

	var delta = vec3.create();
	vec3.sub(delta, [0, 0, 0], rayPos);

	var t = vec3.dot(delta, [0, 1, 0]);

	var ddotn = vec3.dot(rayDir, [0, 1, 0]);
	
	if (isZero(ddotn)) {
		return false;
	}

	t = t / ddotn;

	if (t < 1e-5) {
		return false;
	}

	var localHit = vec3.clone(rayPos);
	vec3.scaleAndAdd(localHit, localHit, rayDir, t);
	vec3.sub(delta, localHit, this.p0);

	var ddota = vec3.dot(delta, this.a);

	if (ddota < 0.0 || ddota > 1.0) {
		return false;
	}

	var ddotb = vec3.dot(delta, this.b);

	if (ddotb < 0.0 || ddotb > 1.0) {
		return false;
	}

	ray.setTime(t);
	//ray.t0 = t;
	//console.log('t=' + t);

	return true;
}


Rectangle.prototype.traceRay = function (ray, intersection, objIdx) {

	var rayPos = vec3.clone(ray.pos);
	vec3.transformMat4(rayPos, rayPos, this.transRayMat);

	var dir4 = vec4.fromValues(ray.dir[0], ray.dir[1], ray.dir[2], 0);
	vec4.transformMat4(dir4, dir4, this.transRayMat);

	var rayDir = vec3.fromValues(dir4[0], dir4[1], dir4[2]);

	var delta = vec3.create();
	vec3.sub(delta, [0, 0, 0], rayPos);

	var ddotn = vec3.dot(rayDir, [0, 1, 0]);
	if (ddotn === 0.0) {
		return false;
	}

	var t = vec3.dot(delta, [0, 1, 0]) / ddotn; //vec3.dot(rayDir, this.normal);

	if (t <= 1e-5) {
		return false;
	}

	var localHit = vec3.clone(rayPos);
	vec3.scaleAndAdd(localHit, localHit, rayDir, t);
	vec3.sub(delta, localHit, this.p0);

	var ddota = vec3.dot(delta, this.a);

	if (ddota < 0.0 || ddota > 1.0) {
		return false;
	}

	var ddotb = vec3.dot(delta, this.b);

	if (ddotb < 0.0 || ddotb > 1.0) {
		return false;
	}

	intersection.hits.push(new RayHit());

	var hit = intersection.hits[intersection.hits.length - 1];

	hit.t = t;
	hit.hit_on_object = true;
	hit.hit_obj_idx = objIdx;
    hit.isEntering = true;

	vec3.copy(hit.local_hit_point, localHit);
	//		vec3.copy(hit.color, this.geo.kd);

	vec4.set(dir4, 0, 1, 0, 0);
	vec4.transformMat4(dir4, dir4, this.transNormalMat);
	vec3.set(hit.hit_normal, dir4[0], dir4[1], dir4[2]);
	vec3.normalize(hit.hit_normal, hit.hit_normal);
	//	vec3.copy(hit.hit_normal, this.normal);

	++intersection.numHits;
	
	if(this.geo.texture>TEX_NONE)
	{
		hit = intersection.hits[0];
		var hit_pt = vec3.clone(ray.pos);
		vec3.scaleAndAdd(hit_pt,hit_pt,ray.dir,hit.t);
		this.geo.get3DChecker(hit_pt,hit.color);
	}

	return Boolean(intersection.numHits>0);
}
