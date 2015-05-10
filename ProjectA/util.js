function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}

function clamp(x, a, b) {
	return (x < a) ? a : ((x > b) ? b : x);
}


function getAngle(from, to) {
	var theta = vec3.dot(from, to);
	theta /= (vec3.length(from) * vec3.length(to))
	console.log('theta=' + theta);
	return Math.acos(clamp(theta, -1, 1));
}

function normRnd(mean, std) {
	if (this.extra == undefined) {
		var u, v;
		var s = 0;
		while (s >= 1 || s == 0) {
			u = Math.random() * 2 - 1;
			v = Math.random() * 2 - 1;
			s = u * u + v * v;
		}
		var n = Math.sqrt(-2 * Math.log(s) / s);
		this.extra = v * n;
		return mean + u * n * std;
	} else {
		var r = mean + this.extra * std;
		this.extra = undefined;
		return r;
	}
}

function randomFloat(start, end) {
	if (end === undefined)
		return randomFloat(0, start);
	else
		return Math.random() * (end - start) + start;;
}

function randomSpread(center, spread) {
	return randomFloat(center - spread, center + spread);
}


function transfomHSV2RGB(h, s, v) {
	var r, g, b, i, f, p, q, t;
	if (h && s === undefined && v === undefined) {
		s = h.s, v = h.v, h = h.h;
	}
	i = Math.floor(h * 6);
	f = h * 6 - i;
	p = v * (1 - s);
	q = v * (1 - f * s);
	t = v * (1 - (1 - f) * s);
	switch (i % 6) {
	case 0:
		r = v, g = t, b = p;
		break;
	case 1:
		r = q, g = v, b = p;
		break;
	case 2:
		r = p, g = v, b = t;
		break;
	case 3:
		r = p, g = q, b = v;
		break;
	case 4:
		r = t, g = p, b = v;
		break;
	case 5:
		r = v, g = p, b = q;
		break;
	}
	return {
		r: r,
		g: g,
		b: b
	};
}

function convertHue(hue) {
	hue /= 360.0;
	if (hue < 0)
		hue += 1.0;
	return hue;
}


function calcTriangleNormal(p0, p1, p2) {
	var v1 = vec3.create();
	var v2 = vec3.create();
	var n = vec3.create();

	vec3.sub(v1, p1, p0);
	vec3.sub(v2, p2, p0);

	vec3.cross(n, v1, v2);

	return n;
}

function createTexture(gl) {
    var ctx = document.getElementById('image-texture').getContext('2d');
    ctx.beginPath();
    var edgecolor1 = "rgba(255,255,255,1)";
    var edgecolor2 = "rgba(255,255,255,0)";
    var gradblur = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradblur.addColorStop(0, edgecolor1);
    gradblur.addColorStop(1, edgecolor2);
    ctx.fillStyle = gradblur;
    ctx.arc(64, 64, 64, 0, Math.PI * 2, false);
    ctx.fill();
    var data = ctx.getImageData(0, 0, 128, 128).data;

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    var pixels = new Uint8Array(128 * 128 * 4);
    for (var i = 0; i < 128 * 128 * 4; i++) {
        pixels[i] = data[i];
    }
    ctx.clearRect(0, 0, 128, 128);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 128, 128, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    texture = tex;
}
	//Sphere Zone
SphereZone = function (center, outter, inner) {
	this.center = vec3.clone(center) || vec3.create();
	this.outter = outter || 0;
	this.inner = inner || 0;
}

SphereZone.prototype.constructor = SphereZone;
SphereZone.prototype.getValue = function () {
		var rand;
		do {
			rand = vec3.fromValues(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
		}
		while (rand.x == 0 && rand.y == 0 && rand.z == 0);
		//	rand.normalize();
		vec3.normalize(rand, rand);

		var d = Math.random();
		d = this.inner + (1 - d * d) * (this.outter - this.inner);
		//			rand.scaleBy( d / rand.length );
		vec3.scale(rand, rand, d / vec3.len(rand));
		var v = vec3.add(vec3.create(), this.center, rand);
		//		console.log(vec3.str(v));
		return v;

		//			return _center.add( rand );
	}
	//Disk Zone
	//Idea borrowed from http://flintparticles.org/
DiskZone = function (center, normal, outter, inner) {
	this.center = vec3.clone(center);
	this.normal = vec3.clone(normal);
	this.inner = inner || 0; //inner radius
	this.outter = outter || 0; //outter radius
	this.axies = new Array();

	if (normal[0] === 0) {
		this.axies.push(vec3.clone([1, 0, 0]));
	} else {
		this.axies.push(vec3.clone([normal[1], -normal[0], 0]));
		vec3.normalize(this.axies[0], this.axies[0]);
	}

	if (this.axies.length > 0) {
		this.axies.push(vec3.cross(vec3.create(), this.axies[0], normal));
		vec3.normalize(this.axies[1], this.axies[1]);
	}

	console.log(vec3.str(this.axies[0]));
	console.log(vec3.str(this.axies[1]));
}

DiskZone.prototype.constructor = DiskZone;

DiskZone.prototype.getValue = function () {
	var rand = Math.random();
	var radius = this.inner + (1 - rand * rand) * (this.outter - this.inner);
	var angle = 2 * Math.random() * Math.PI;
	var p1 = vec3.clone(this.axies[0]);
	vec3.scale(p1, p1, radius * Math.cos(angle));

	var p2 = vec3.clone(this.axies[1]);
	vec3.scale(p2, p2, radius * Math.sin(angle));

	var val = vec3.add(vec3.create(), this.center, p1);
	vec3.add(val, val, p2);

	//console.log(vec3.str(val));

	return val;
}

function interpolateColors(color1, color2, ratio) {
	var inv = 1 - ratio;
	var c = vec4.clone([0, 0, 0, 0]);
	vec4.scaleAndAdd(c, c, color1, ratio);
	vec4.scaleAndAdd(c, c, color2, inv);

	//		console.log(vec4.str(c));
	return c;
	//		var red = color1[0] * ratio + color2[0] * inv );
	//		var green = color1[0] * ratio + ( ( color2 >>> 8 ) & 255 ) * inv );
	//		var blue = Math.round( ( ( color1 ) & 255 ) * ratio + ( ( color2 ) & 255 ) * inv );
	//		var alpha = Math.round( ( ( color1 >>> 24 ) & 255 ) * ratio + ( ( color2 >>> 24 ) & 255 ) * inv );
	//		return vec4.clone([red<<16, green<<8, blue, alpha<<24])
	//return ( alpha << 24 ) | ( red << 16 ) | ( green << 8 ) | blue;
}


function getRandomColor(min, max) {
	return interpolateColors(min, max, Math.random());
}


//create sphere
//Sphere = function(slices,stacks,radius,offset)
//{
//	this.slices = slices;
//	
//	if (!slices || slices < 3) {
//		ths.slices = 64;
//  }
//	this.stacks = stacks;
//  if (!stacks || stacks < 2) {
//		this.stacks = 32;
//  }
//	
//	this.radius = radius;
//	
//	this.offset = [0,0,0];
//	
//	if(offset) vec3.copy(this.offset,offset);
//	
//  if (!radius) {
//		this.radius= 1;
//  }
//	var count = (this.stacks+1) * (this.slices + 1);
//	var rawVertArr = new Float32Array(count*3);
//	var rawNormals = new Float32Array(count*3);
//	var rawColor = new Float32Array(count*3);
//	var rawUV = new Float32Array(count*2);
//	
//	var indices = [];	
//	
//	var i,j;
//	
//	var perStackPI = Math.PI / this.stacks;
//	var halfPI = Math.PI/2;
//	var doublePI = Math.PI*2;
//	var index = 0;
//	var latitude1, sinLat1, cosLat1, longitude, sinLong, cosLong;
//	var x1, y1, z1, meshDataConf;
//	// create vertices
//  for (j = 0; j <= this.stacks; j++) 
//	{
//		latitude1 = perStackPI * j - halfPI;
//		sinLat1 = Math.sin(latitude1);
//    cosLat1 = Math.cos(latitude1);
//    for (i = 0; i <= slices; i++) {
//			longitude = (doublePI / slices) * i;
//      sinLong = Math.sin(longitude);
//      cosLong = Math.cos(longitude);
//      x1 = cosLong * cosLat1;
//      y1 = sinLat1;
//      z1 = sinLong * cosLat1;
//			
//			var norm = rawNormals.subarray(index*3,index*3+3);
//			var vert = rawVertArr.subarray(index*3,index*3+3);
//			var uv = rawUV.subarray(index*2,index*3+2);
//			var color = rawColor.subarray(index*3,index*3+3);
//      vec3.copy(norm, [x1, y1, z1]);
//      vec2.copy(uv, [1 - i / this.slices, j / this.stacks]);
//      vec3.copy(vert, [this.radius * x1+offset[0], this.radius * y1+offset[1], this.radius * z1+offset[2]]);
//			vec3.copy(color,[0,1,0]);
//      index++;
//		}
//	}
//    
//	// create indices
//  for (j = 0; j < stacks; j++) {
//		if (j > 0) {
//			indices.push(j * (slices + 1)); // make degenerate
//		}
//		for (i = 0; i <= slices; i++) {
//			index = j * (slices + 1) + i;
//			indices.push(index);
//			indices.push(index + slices + 1);
//		}
//		if (j + 1 < stacks) {
//			indices.push(index + slices + 1); // make degenerate
//		}
//	}
//	
//	//rearrange faces
//	var offset = 0;
//	
//	var faceArr = new Array();
//	var verArr = new Array();
//	var normArr = new Array();
//	var uvArr = new Array();
//	var colorArr = new Array();
//	
//	for(i = 0;i<indices.length;++i)
//	{
//		index = indices[i];
//		faceArr.push(offset);
//		
//		verArr.push(rawVertArr[index*3]);
//		verArr.push(rawVertArr[index*3+1]);
//		verArr.push(rawVertArr[index*3+2]);
//
//		normArr.push(rawNormals[index*3]);
//		normArr.push(rawNormals[index*3+1]);
//		normArr.push(rawNormals[index*3+2]);
//		
//		colorArr.push(rawColor[index*3]);
//		colorArr.push(rawColor[index*3+1]);
//		colorArr.push(rawColor[index*3+2]);		
//		
//		uvArr.push(rawUV[index*2]);
//		uvArr.push(rawUV[index*2+1]);
//		
//		++offset;
//	}
//	
//	this.faces = new Uint16Array(faceArr);
//	this.vertices = new Float32Array(verArr);
//	this.uvs = new Float32Array(uvArr);
//	this.colors = new Float32Array(colorArr);
//	this.normals = new Float32Array(normArr);
//}

function getVerletVelocity(curPos, oldPos, dt) {
	var delta = vec3.create();
	vec3.sub(delta, curPos, oldPos);
	vec3.scale(delta, delta, 1.0 / dt);
	return delta;
}

Sphere = function (slices, stacks, radius, offset) {

    this.offset = vec3.create();

	if (offset != undefined) {
		vec3.copy(this.offset, offset);
	}


	this.center = vec3.create();
	vec3.copy(this.center, this.offset);

	this.radius = radius;

	var x, y;
	var u, v;

	var phiStart = 0;
	var phiLength = Math.PI * 2;

	var thetaStart = 0;
	var thetaLength = Math.PI;

	this.rawFaces = new Array();
	this.rawVerts = new Array();
    this.rawUVs = new Array();

    var vertices = [];
    var uvs = [];

	for (y = 0; y <= stacks; y++) {

        var verticesRow = [];
        var uvsRow = [];

		for (x = 0; x <= slices; x++) {

			u = x / slices;
			v = y / stacks;

//            var vertex = vec3.create();
//            vec3[0] = -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength) + offset[0];
//            vec3[1] = radius * Math.cos(thetaStart + v * thetaLength) + offset[1];
//            vec3[2] = radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength) + offset[2];
            this.rawVerts.push(-radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength) + offset[0]);
            this.rawVerts.push(radius * Math.cos(thetaStart + v * thetaLength) + offset[1]);
            this.rawVerts.push(radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength) + offset[2]);

//            verticesRow.push(vertex);
            verticesRow.push(this.rawVerts.length / 3 - 1);
            uvsRow.push(vec2.fromValues(u, 1 - v));
		}

        vertices.push(verticesRow);
        uvs.push(uvsRow);
	}

	var v1, v2, v3, v4;
    //var n1,n2,n3,n4;
    var uv1,uv2,uv3,uv4;

	for (y = 0; y < stacks; y++) {

		for (x = 0; x < slices; x++) {

			v1 = vertices[y][x + 1];
			v2 = vertices[y][x];
			v3 = vertices[y + 1][x];
			v4 = vertices[y + 1][x + 1];

			//console.log(v1+','+v2+','+v3+','+v4);


			//			n1 = this.vertices[v1].clone().normalize();
			//			n2 = this.vertices[v2].clone().normalize();
			//			n3 = this.vertices[v3].clone().normalize();
			//			n4 = this.vertices[v4].clone().normalize();

			//			console.log(v1+','+v2+','+v3+','+v4);

            uv1 = vec2.clone(uvs[y][x + 1]);
            uv2 = vec2.clone(uvs[y][x]);
            uv3 = vec2.clone(uvs[y + 1][x])
            uv4 = vec2.clone(uvs[y + 1][x + 1]);

			if (Math.abs(this.rawVerts[v1 * 3 + 1]) === radius) {

                uv1[0] = (uv1[0] + uv2[0]) / 2;
				//				this.faces.push(new THREE.Face3(v1, v3, v4, [n1, n3, n4]));
				this.rawFaces.push(v1, v3, v4);
                this.rawUVs.push(uv1,uv3,uv4);

			} else if (Math.abs(this.rawVerts[v3 * 3 + 1]) === radius) {

                uv3[0] = (uv3[0] + uv4[0]) / 2;
				this.rawFaces.push(v1, v2, v3);
                this.rawUVs.push(uv1,uv2,uv3);
				//				this.faceVertexUvs[0].push([uv1, uv2, uv3]);

			} else {

				this.rawFaces.push(v1, v2, v4);
                this.rawUVs.push(uv1,uv2,uv4);
				//				this.faceVertexUvs[0].push([uv1, uv2, uv4]);

				//				this.faces.push(new THREE.Face3(v2, v3, v4, [n2.clone(), n3, n4.clone()]));
				this.rawFaces.push(v2, v3, v4);
                this.rawUVs.push(vec2.clone(uv2),uv3,vec2.clone(uv4));
				//				this.faceVertexUvs[0].push([uv2.clone(), uv3, uv4.clone()]);

			}

		}

	}

	//rearrange faces
    var i, index;

	var faceArr = new Array();
	var verArr = new Array();
    //	var normArr = new Array();
    var uvArr = new Array();
	var colorArr = new Array();

    console.log(this.rawUVs.length);
    console.log(this.rawFaces.length);

    for (i = 0; i < this.rawFaces.length; ++i) {
		index = this.rawFaces[i];
        faceArr.push(i);

		verArr.push(this.rawVerts[index * 3]);
		verArr.push(this.rawVerts[index * 3 + 1]);
		verArr.push(this.rawVerts[index * 3 + 2]);

		//		normArr.push(rawNormals[index*3]);
		//		normArr.push(rawNormals[index*3+1]);
		//		normArr.push(rawNormals[index*3+2]);

		colorArr.push(Math.random());
		colorArr.push(1.0);
		colorArr.push(1.0);

        uvArr.push(this.rawUVs[index][0]);
        uvArr.push(this.rawUVs[index][1]);
        //		uvArr.push(rawUV[index*2]);
		//		uvArr.push(rawUV[index*2+1]);

		++offset;
	}

	this.faces = new Uint16Array(faceArr);
    this.vertices = new Float32Array(verArr);
    this.uvs = new Float32Array(uvArr);
	this.colors = new Float32Array(colorArr);
	//	this.normals = new Float32Array(normArr);
}

Sphere.prototype.constructor = Sphere;

//If you want a upside down cone
//The vector is [0,1,0]
ConeZone = function (apex, axis, angle, height, truncatedHeight) {
	this.apex = vec3.create();
    if (apex !== undefined)
		vec3.copy(this.apex, apex);
	this.axis = vec3.create();
    if (axis !== undefined)
		vec3.copy(this.axis, axis);
	this.angle = angle;

	this.height = height;

    this.truncatedHeight = truncatedHeight||0;

	this.perps = new Array();

	if (axis[0] === 0) {
		this.perps.push(vec3.fromValues(1, 0, 0));
	} else {
		this.perps.push(vec3.fromValues(axis[1], -axis[0], 0));
		vec3.normalize(this.perps[0], this.perps[0]);
	}

	this.perps.push(vec3.create());
	vec3.cross(this.perps[1], axis, this.perps[0]);
	vec3.normalize(this.perps[1], this.perps[1]);
}


ConeZone.prototype.getValue = function () {

    var maxDist = this.height;
    var minDist = this.truncatedHeight;

	var h = Math.random();
    h = minDist + ( 1 - h * h ) * ( maxDist - minDist );
	var r = Math.random();
	r = (1 - r * r) * Math.tan(this.angle / 2) * h;
	var a = Math.random() * 2 * Math.PI;
	var p1 = vec3.clone(this.perps[0]);
	vec3.scale(p1, p1, r * Math.cos(a));
	var p2 = vec3.clone(this.perps[1]);
	vec3.scale(p2, p2, r * Math.sin(a));
	var ax = vec3.clone(this.axis);
	vec3.scale(ax, ax, h);
	vec3.add(p1, p1, p2);
	vec3.add(p1, p1, ax);

	var pos = vec3.clone(this.apex);
	vec3.add(pos, pos, p1);

	return [a, pos];
	//				var h:Number = Math.random();
	//			h = _minDist + ( 1 - h * h ) * ( _maxDist - _minDist );
	//			
	//			var r:Number = Math.random();
	//			r = ( 1 - r * r ) * radiusAtHeight( h );


}

ConeZone.prototype.contains = function (pos) {


    var maxDist = this.height;
    var minDist = this.truncatedHeight;
    var q = vec3.create();
	vec3.sub(q, pos, this.apex);
	var d = vec3.dot(q, this.axis);

    if (d < minDist || d > maxDist) {

		return false;
	}
	var dec = vec3.clone(this.axis);
	vec3.scale(dec, dec, d);
	vec3.sub(q, q, dec);
	var len = vec3.squaredLength(q);

	var r = Math.tan(this.angle / 2) * d;

	return len <= r * r;
}
