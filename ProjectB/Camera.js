function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}

PerspectiveCamera = function (pos, up, fov, aspect, near, far) {
	this.matrix = mat4.create();
	this.matrixWorldInverse = mat4.create();
	this.projectionMatrix = mat4.create();
	this.viewMatrix = mat4.create();

	this.zoom = 1;
	this.fov = fov !== undefined ? fov : 50;
	this.aspect = aspect !== undefined ? aspect : 1;
	this.near = near !== undefined ? near : 0.1;
	this.far = far !== undefined ? far : 2000;

	this.position = pos !== undefined ? vec3.clone(pos) : vec3.create();
	this.lookDir = vec3.create();
	this.negPos = vec3.create();
	this.up = up !== undefined ? vec3.clone(up) : vec3.fromValues(0, 1, 0);
	vec3.normalize(this.up, this.up);
	//    this.up = new Float32Array([0, 1, 0]);
	this.scale = vec3.fromValues(1, 1, 1); //new Float32Array([1, 1, 1]);
	this.quatRot = quat.create();

	this.viewFrustum = {};
	this.imageSize = [];
	this.sample = []

	//camera image size
	this.x = 0;
	this.y = 0;
	this.width = 1024;
	this.height = 768;

	//private field
	this.invProjMat = mat4.create(); //inverse of projection matrix

	this.rays = [];
	//camera's axis in world space

	this.camN = vec3.create();
	this.camU = vec3.create();
	this.camV = vec3.create();

	this.dx = -1;
	this.dy = -1;
	//update projection matrix
	//	this.updateProjectionMatrix();
}

PerspectiveCamera.prototype.constructor = PerspectiveCamera;
PerspectiveCamera.prototype.updateProjectionMatrix = function () {
	var fov = 2 * Math.atan(Math.tan(this.fov * Math.PI / 180.0 * 0.5) / this.zoom) * 180.0 / Math.PI;
	mat4.perspective(this.projectionMatrix, fov, this.aspect, this.near, this.far);
	mat4.invert(this.invProjMat, this.projectionMatrix);

	//update view frustum
	var pos = vec4.fromValues(-1, 0, -1, 1);
	vec4.transformMat4(pos, pos, this.invProjMat);
	this.viewFrustum['left'] = pos[0] / pos[3];

	pos = vec4.fromValues(1, 0, -1, 1);
	vec4.transformMat4(pos, pos, this.invProjMat);
	this.viewFrustum['right'] = pos[0] / pos[3];

	pos = vec4.fromValues(0, 1, -1, 1);
	vec4.transformMat4(pos, pos, this.invProjMat);
	this.viewFrustum['top'] = pos[1] / pos[3];

	pos = vec4.fromValues(0, -1, -1, 1);
	vec4.transformMat4(pos, pos, this.invProjMat);
	this.viewFrustum['bottom'] = pos[1] / pos[3];

	//    console.log(this.viewFrustum['LL']);

	this.dx = (this.viewFrustum['right'] - this.viewFrustum['left']);
	this.dy = (this.viewFrustum['top'] - this.viewFrustum['bottom']);
	
}

PerspectiveCamera.prototype.lookAt = function (center) {
	vec3.sub(this.lookDir, center, this.position);
	mat4.lookAt(this.viewMatrix, this.position, center, this.up);

	//	var m = mat4.create();
	//	vec3.scale(this.negPos, this.position, -1);
	//	mat4.translate(this.viewMatrix, this.viewMatrix, this.negPos);
	var rotMat = mat3.create();
	mat3.fromMat4(rotMat, this.viewMatrix);
	quat.fromMat3(this.quatRot, rotMat);

	//update camera axies in world space

	vec3.sub(this.camN, this.position, center);
	vec3.normalize(this.camN, this.camN);
	vec3.cross(this.camU, this.up, this.camN);
	vec3.normalize(this.camU, this.camU);
	vec3.cross(this.camV, this.camN, this.camU);
	vec3.normalize(this.camV, this.camV);

	this.viewFrustum['LL'] = vec3.clone(this.position);
	vec3.scaleAndAdd(this.viewFrustum['LL'], this.viewFrustum['LL'], this.camU, this.viewFrustum['left']);
	vec3.scaleAndAdd(this.viewFrustum['LL'], this.viewFrustum['LL'], this.camV, this.viewFrustum['bottom']);
	vec3.scaleAndAdd(this.viewFrustum['LL'], this.viewFrustum['LL'], this.camN, -this.near);

}

PerspectiveCamera.prototype.updateMatrix = function () {
	mat4.fromQuat(this.matrix, this.quatRot);
	mat4.scale(this.matrix, this.matrix, this.scale);
	mat4.translate(this.matrix, this.matrix, this.position);
}

//x,y ---> the image pixel position
//xmax,ymax ---> the resolution of image
PerspectiveCamera.prototype.makeRay = function (x, y, q, p, nsample,xmax, ymax, jitter) {
	//    var origin = cam.position;
	//    var dir = vec3.create();
	var dir = vec3.clone(this.viewFrustum['LL']);
	//	var dir = vec3.create();

	var dx = this.dx / xmax;
	var dy = this.dy / ymax;

	var i, j;
	//using jittered sampleing
	//	for(i=0;i<4;++i)
	//	{
	//		for(j = 0;j<4;++j)
	//		{
	//			
	//		}
	//	}
	if (jitter) {
		vec3.scaleAndAdd(dir, dir, this.camU, dx * (x + (q+Math.random())/nsample));
		// vec3.scaleAndAdd(dir, dir, this.camU, dx * (x + getRandomArbitrary(-0.5,0.5)));
		// vec3.scaleAndAdd(dir, dir, this.camU, dy * (y + getRandomArbitrary(-0.5,0.5)));
		vec3.scaleAndAdd(dir, dir, this.camV, dy * (y + (p+Math.random())/nsample));
	} else {
		vec3.scaleAndAdd(dir, dir, this.camU, dx * (x + 0.5));
		vec3.scaleAndAdd(dir, dir, this.camV, dy * (y + 0.5));
	}
	//	var ix = dx * (x - xmax / 2 + 0.5);
	//	var iy = dy * (y - ymax / 2 + 0.5);

	//	vec3.scale(dir, this.camU, ix);
	//	vec3.scaleAndAdd(dir, dir, this.camV, iy);
	//	vec3.scaleAndAdd(dir, dir, this.camN, -this.near);
	vec3.sub(dir, dir, this.position);
	vec3.normalize(dir, dir);

	//    console.log(dir);

	return new Ray(this.position, dir);
	//    this.rays.push(new Ray(cam.Position,pos));
}