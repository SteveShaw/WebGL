const OBJ_GEN = 0;
const OBJ_PLANE = 1;
const OBJ_SPHERE = 2;
const OBJ_CUBE = 3;
const OBJ_TORUS = 4;

const TEX_NONE = 0;
const TEX_CHECKER = 1;
const TEX_RING = 2;
const TEX_PERLIN_NOISE = 3;

Geometry = function () {
	this.vertices = [];
	this.faces = [];
	this.normals = [];
	this.uvs = [];

	this.ka = vec3.create();
	this.kd = vec3.create();
	this.ks = vec3.create();
	
	this.ka_list = [];
	this.kd_list = [];
	this.ks_list = [];
	this.shn_list = [];
	
	this.shn = 0;
	this.reflectivity = 0;
	this.refraction = 0;
	this.ior = 1;

	//for cook torrence Model
	this.F0 = 1.5;
	this.Roughness = 0.3;
	this.texture = TEX_NONE; //0---do not use texture 1---use checker 2----use noise texture
	this.checker_size = 15.0;
}

Geometry.prototype.constructor = Geometry;
Geometry.prototype.get3DChecker = function(pt,color)
{
	var eps = -0.000187453738;
	var x = pt[0]+eps;
	var y = pt[1]+eps;
	var z = pt[2]+eps;
	var val = Math.floor(x/this.checker_size+300);
	val += Math.floor(y/this.checker_size+300);
	val += Math.floor(z/this.checker_size+300);
	
	if(val<0)
	{
		val = (-val)%2;
	}
	else{
		val = val % 2;
	}
	
	if(val===0)
	{
		vec3.copy(color,[0,0,1]);
		return 0;
	}

	vec3.copy(color,[1,1,0]);
	return 1;
}
Geometry.prototype.get2DChecker = function(pt)
{
	var eps = -0.000187453738;
	var x = pt[0]+eps;
	var y = pt[1]+eps;
	var z = pt[2]+eps;
	var val = Math.floor(x/this.checker_size);
	val += Math.floor(y/this.checker_size);
	val += Math.floor(z/this.checker_size);
	
	var ix = Math.floor(x);
	var iy = Math.floor(y);
	// var fx = x - ix;
	// var fz = z - iz;
	
	
	val = (ix+iy);
	// var val = Math.sin(Math.PI*x);
	// val += Math.sin(Math.PI*y);
	// val += Math.sin(Math.PI*z);
	
	// if(val>0)
	// {
		// return 1;
	// }
	
	if(val<0)
	{
		val = -(val%2);
	}
	else{
		val = val % 2;
	}
	if(val===0)
	{
		return 0;
	}

	return 1;
}
Geometry.prototype.computeNormals = function () {
		var i = 0;
		var delta21 = vec3.create();
		var delta01 = vec3.create();
		var index = 0;
		var v0 = vec3.create();
		var v1 = vec3.create();
		var v2 = vec3.create();
		for (i = 0; i < this.faces.length / 3; ++i) {

			index = this.faces[3 * i];
			vec3.set(v0, this.vertices[3 * index], this.vertices[3 * index + 1], this.vertices[3 * index + 2]);
			index = this.faces[3 * i + 1];
			vec3.set(v1, this.vertices[3 * index], this.vertices[3 * index + 1], this.vertices[3 * index + 2]);
			index = this.faces[3 * i + 2];
			vec3.set(v2, this.vertices[3 * index], this.vertices[3 * index + 1], this.vertices[3 * index + 2]);

			vec3.sub(delta01, v0, v1);
			vec3.sub(delta21, v2, v1);

			vec3.cross(delta21, delta01, delta21);
			vec3.normalize(delta21, delta21);

			this.normals.push(delta21[0], delta21[1], delta21[2]);
			this.normals.push(delta21[0], delta21[1], delta21[2]);
			this.normals.push(delta21[0], delta21[1], delta21[2]);
		}
	}
	//This object is for rendering
RenderMesh = function (geoObj) {
	this.vertices = new Float32Array(geoObj.vertices);
	this.faces = new Uint16Array(geoObj.faces);

	this.normals = null;
	if (geoObj.normals.length > 0) {
		this.normals = new Float32Array(geoObj.normals);
	}

	this.uvs = null;

	if (geoObj.uvs.length > 0) {
		this.uvs = new Float32Array(geoObj.uvs);
	}

	this.vbo = null; //vertex buffer
	this.ibo = null; //index buffer
	this.nbo = null; //normal buffer
	this.tbo = null; //texture buffer;
}

RenderMesh.prototype.constructor = RenderMesh;
RenderMesh.prototype.createBuffers = function (gl) {
		this.vbo = gl.createBuffer();
		this.ibo = gl.createBuffer();

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.faces, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
		this.vbo.itemSize = 3;
		this.vbo.numItems = this.vertices.length / 3;

		if (this.uvs !== null) {
			this.tbo = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.tbo);
			gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);
			this.tbo.itemSize = 2;
			this.tbo.numItems = this.uvs.length / 2;
		}

		if (this.normals !== null) {
			this.nbo = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
			this.nbo.itemSize = 3;
			this.nbo.numItems = this.normals.length / 3;
		}

	}
	// RenderMesh.prototype.render = function(gl,attVertex,attColor,attNormal,attTex)
	// {
	// if(gl===undefined||attVertex===undefined)
	// {
	// return
	// }

// gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
// gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
// gl.vertexAttribPointer(attVertex, 3, gl.FLOAT, false, 0, 0);
// gl.enableVertexAttribArray(attVertex);  // Enable the assignment of the buffer object

// if(attColor!==undefined)
// {
// gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
// gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);
// gl.vertexAttribPointer(attColor, 3, gl.FLOAT, false, 0, 0);
// gl.enableVertexAttribArray(attColor);  // Enable the assignment of the buffer object
// }

// if(attNormal!==undefined)
// {
// gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
// gl.bufferData(gl.ARRAY_BUFFER, meshGrid.vertices, gl.STATIC_DRAW);
// gl.vertexAttribPointer(attNormal, 3, gl.FLOAT, false, 0, 0);
// gl.enableVertexAttribArray(attNormal);  // Enable the assignment of the buffer object
// }

// if(attTex!==undefined)
// {
// gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
// gl.bufferData(gl.ARRAY_BUFFER, meshGrid.vertices, gl.STATIC_DRAW);
// gl.vertexAttribPointer(attTex, 2, gl.FLOAT, false, 0, 0);
// gl.enableVertexAttribArray(attTex);  // Enable the assignment of the buffer object
// }
// }


//image texture plane
TexturePlane = function () {
	var obj = new Geometry();

	obj.vertices = [-0.99, 0.99, 1.0, -0.99, -0.99, 1.0, 0.99, 0.99, 1.0, 0.99, -0.99, 1.0];
	obj.normals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	obj.uvs = [0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0];
	obj.faces = [0, 1, 2, 3, 2, 1];


	this.renderMesh = new RenderMesh(obj);
	this.type = OBJ_GEN;
    this.renderGL = true;
    this.canTrace = false;
}
TexturePlane.prototype.constructor = TexturePlane;
