Ray = function (pos, dir) {
	this.pos = vec3.clone(pos);
	this.dir = vec3.clone(dir);
	this.level = 0; //recursion level
	this.t0 = -1.0; //used for checkRayHit to save t
	//normalize
	//    vec3.normalize(this.dir,this.dir);
}
Ray.prototype.constructor = Ray;
Ray.prototype.setTime = function (t) {
	this.t0 = t;
}

//Ray.prototype.getIntersection = function()
//{
//    var out = vec3.create();
//}
RayImage = function (width, height) {
	this.width = width;
	this.height = height;
	//    this.colors = new Float32Array(width*height*3);
	this.colors = new Uint8Array(width * height * 3);
}
RayImage.prototype.constructor = RayImage;
