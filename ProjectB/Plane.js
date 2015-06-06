//numX,numY: How many squares in X and Y dimensions
//gap: the size between nearby squares, same for X and Y dimensions
//size: The size of each square
GeoRectXY = function (center, width, height) {
	this.vertices = [];
	var pos = vec3.clone(center);
	this.center = vec3.clone(center);
	this.width = width;
	this.height = height;
	var halfWidth = width / 2;
	var halfHeight = height / 2;
	vec3.add(pos, center, [-halfWidth, -halfHeight, center[2]]);
	this.vertices.push(pos[0], pos[1], pos[2]);
	vec3.add(pos, center, [halfWidth, -halfHeight, center[2]]);
	this.vertices.push(pos[0], pos[1], pos[2]);
	vec3.add(pos, center, [halfWidth, halfHeight, center[2]]);
	this.vertices.push(pos[0], pos[1], pos[2]);
	vec3.add(pos, center, [-halfWidth, halfHeight, center[2]]);
	this.vertices.push(pos[0], pos[1], pos[2]);
}

GeoRectXY.prototype.constructor = GeoRectXY;
GeoRectXY.prototype.toString = function () {
	var str = 'center:[';
	str += this.center[0].toString();
	str += ',';
	str += this.center[1].toString();
	str += ',';
	str += this.center[2].toString();
	str += '];';
	str += 'Width:';
	str += this.width.toString();
	str += 'Height:';
	str += this.height.toString();

	return str;
}


//point  --- the point where plane go through
Plane = function (numX, numY, gap, size, point, normal) {

	this.type = OBJ_PLANE;

	var i, j;
	var halfNumX = Math.floor(numX / 2);
	var halfNumY = Math.floor(numY / 2);
	var halfSize = size / 2;
	var halfGap = gap / 2;
	var center = vec3.create();
	var curCenter = vec3.create();
	var stepSize = size + gap;
	var pos = vec3.create();
	var index = 0;

	this.gap = gap;
	this.size = size;
	this.normal = vec3.fromValues(0, 1, 0);
	this.point = vec3.clone(point);

	if (normal !== undefined) {
		//this.normal = vec3.clone(normal);
		vec3.copy(this.normal, normal);
		vec3.normalize(this.normal, this.normal);
	}


	this.geo = new Geometry();

	//	this.objs = [];
	//	this.objs.push(new Geometry());

	//	var boxes = this.objs[this.objs.length-1];

	//	var geo;

	var box;
	//we first define the plane at the orgin of the world space
	//and then using model transformation to transform the plane
	for (i = -halfNumX; i <= halfNumX; ++i) {

		var startCenter = vec3.create();
		//        vec3.add(startCenter, center, [i * stepSize, 0, dist]);
		vec3.add(startCenter, center, [i * stepSize, 0, 0]);

		for (j = -halfNumY; j <= halfNumY; ++j) {

			vec3.add(curCenter, startCenter, [0, j * stepSize, 0]);
			//        vec3.add(curCenter,startCenter,[0,j*stepSize,dist]);
			box = new GeoRectXY(curCenter, size, size);
			this.geo.vertices = this.geo.vertices.concat(box.vertices);

			// this.geo.normals.push(this.normal[0], this.normal[1], this.normal[2]);
			// this.geo.normals.push(this.normal[0], this.normal[1], this.normal[2]);
			// this.geo.normals.push(this.normal[0], this.normal[1], this.normal[2]);
			// this.geo.normals.push(this.normal[0], this.normal[1], this.normal[2]);
			this.geo.normals.push(0,0,1);
			this.geo.normals.push(0,0,1);
			this.geo.normals.push(0,0,1);
			this.geo.normals.push(0,0,1);

			this.geo.uvs.push(1.0, 1.0);
			this.geo.uvs.push(0.0, 0.0);
			this.geo.uvs.push(1.0, 0.0);
			this.geo.uvs.push(0.0, 1.0);


			//			vec3.add(curCenter, curCenter, [0, j * stepSize, 0]);
			//			vec3.add(pos, curCenter, [-halfSize, -halfSize, 0]);
			//			this.vertices.push(pos[0], pos[1], pos[2]); //v1;
			//			vec3.add(pos, curCenter, [halfSize, -halfSize, 0]);
			//			this.vertices.push(pos[0], pos[1], pos[2]); //v2;
			//			vec3.add(pos, curCenter, [halfSize, halfSize, 0]);
			//			this.vertices.push(pos[0], pos[1], pos[2]); //v3;
			//			vec3.add(pos, curCenter, [-halfSize, halfSize, 0]);
			//			this.vertices.push(pos[0], pos[1], pos[2]); //v4;

			this.geo.faces.push(index, index + 1, index + 2);
			this.geo.faces.push(index, index + 2, index + 3);

			index += 4;
		}
	}


	this.numX = 2 * halfNumX + 1;
	this.numY = 2 * halfNumY + 1;
	index = 0;

	var matte = Material(MATL_CHROME);
	vec3.copy(this.geo.ka, matte.ambient);
	vec3.copy(this.geo.kd, matte.diffuse);
	vec3.copy(this.geo.ks, matte.specular);
	this.geo.shn = matte.shiny;
	
	this.geo.ka_list.push(vec3.clone(matte.ambient));
	this.geo.kd_list.push(vec3.clone(matte.diffuse));
	this.geo.ks_list.push(vec3.clone(matte.specular));
	this.geo.shn_list.push(matte.shiny);
	// vec3.set(this.geo.ka, 0.4, 0.4, 0.4);
	// vec3.set(this.geo.kd, 0.42, 0.57, 0.45);
	// vec3.set(this.geo.ks, 1, 0.43, 0.36);

	//use geometry to generate meshes which will be send to render
	this.renderMesh = new RenderMesh(this.geo);

	//rotation quaternion to [0,0,1]
	var quatRot = quat.create();
	quat.rotationTo(quatRot, [0, 0, 1], this.normal);

	var mRot = mat4.create();
	mat4.fromQuat(mRot, quatRot);

	this.transRayMat = mat4.create();
	var mt = mat4.create();
	this.transPlaneMat = mat4.create();
	mat4.identity(mt);
	mat4.translate(mt, mt, this.point);
	mat4.multiply(this.transPlaneMat, mt, mRot);
	mat4.invert(this.transRayMat, this.transPlaneMat);
	
	this.transNormalMat = mat4.create();
	mat4.transpose(this.transNormalMat,this.transRayMat);
	
	this.canTrace = true;
    this.renderGL = true;
}

Plane.prototype.constructor = Plane;

Plane.prototype.intersect = function (rayPos, rayDir) {
	var denominator = vec3.dot([0, 0, 1], rayDir);
	var delta = vec3.create();
	vec3.sub(delta, [0, 0, 0], rayPos);
	//	vec3.normalize(delta, delta);
	//    vec3.sub(delta,this.point,ray.pos);
	var t = vec3.dot(delta, [0, 0, 1]);

	if (isZero(denominator)) {
		if (isZero(t)) {
			return 0;
		}

		return null;
	}
	t /= denominator;


	//    var pos = vec3.clone(ray.pos);
	//    vec3.scaleAndAdd(pos,pos,this.normal,-this.dist);
	//    var t = vec3.dot(pos,this.normal)/denominator;

	//    var t = - (vec3.dot(ray.pos,this.normal) + this.dist) / denominator;
	//    var t = - (dotPN +  this.dist) / denominator;
	//    console.log(t);
	//    return t;
	return t >= 0 ? t : null;
}

Plane.prototype.checkRayHit = function(ray,t)
{
	var rayPos = vec3.clone(ray.pos);
	vec3.transformMat4(rayPos, rayPos, this.transRayMat);

	var dir4 = vec4.fromValues(ray.dir[0], ray.dir[1], ray.dir[2], 0);
	vec4.transformMat4(dir4, dir4, this.transRayMat);
	//	vec3.transformMat4(ray.dir, ray.dir, this.transRayMat);
	var rayDir = vec3.create();
	vec3.set(rayDir, dir4[0], dir4[1], dir4[2]);

	t = this.intersect(rayPos, rayDir);
	if (t === null) {
		return false;
	}
	
	if(t>1e-5)
	{
		ray.setTime(t);
		return true;
	}
	
	
	return false;
}

Plane.prototype.traceRay = function (ray, intersection, objIdx) {
	//    var t = this.intersect(ray)
	//first we have to inverse transform the ray
	var rayPos = vec3.clone(ray.pos);
	vec3.transformMat4(rayPos, rayPos, this.transRayMat);

	var dir4 = vec4.fromValues(ray.dir[0], ray.dir[1], ray.dir[2], 0);
	vec4.transformMat4(dir4, dir4, this.transRayMat);
	//	vec3.transformMat4(ray.dir, ray.dir, this.transRayMat);
	var rayDir = vec3.create();
	vec3.set(rayDir, dir4[0], dir4[1], dir4[2]);

	var t = this.intersect(rayPos, rayDir);
	if (t === null) {
		return false;
	}

	if(t>1e-5)
	{
		var hit = new RayHit();//intersection.hits[intersection.hits.length-1];
		hit.t = t;
		hit.local_hit_point = vec3.clone(rayPos);
		hit.hit_obj_idx = objIdx;
		vec3.scaleAndAdd(hit.local_hit_point, hit.local_hit_point, rayDir, t);
		
		vec4.set(dir4,0,0,1,0);
		vec4.transformMat4(dir4,dir4,this.transNormalMat);
		vec3.set(hit.hit_normal, dir4[0],dir4[1],dir4[2]);
		vec3.normalize(hit.hit_normal,hit.hit_normal);
		
		var xfrac = hit.local_hit_point[0] - Math.floor(hit.local_hit_point[0] / (this.gap + this.size)) * (this.gap + this.size);
		var yfrac = hit.local_hit_point[1] - Math.floor(hit.local_hit_point[1] / (this.gap + this.size)) * (this.gap + this.size);

		xfrac = Math.abs(xfrac);
		yfrac = Math.abs(yfrac);

		if ((xfrac < this.size / 2 && yfrac < this.size / 2) || ((xfrac > this.size / 2 + this.gap) && (yfrac > this.size / 2 + this.gap)) ||
			(xfrac < this.size / 2 && yfrac > this.size / 2 + this.gap) || ((xfrac > this.size / 2 + this.gap) && (yfrac < this.size / 2))) {
			//return [1, 1, 1]; //inside the rect
			//vec3.set(rayHit.color, this.geo.kd[0],this.);
			//vec3.copy(hit.color, this.geo.kd);
			//			vec3.set(rayHit.color, 1, 1, 1);
			intersection.hits.push(hit);
			++intersection.numHits;
			
			return true;
		}
		//else {
			// //        console.log('select black');
			// // vec3.set(hit.color, this.geo.ka);
			// vec3.set(hit.color,0,0,0);
		// }
	}
	
	return false;
}

// Plane.prototype.traceRay = function (ray, rayHit, intersection) {
	// //    var t = this.intersect(ray)
	// //first we have to inverse transform the ray
	// var rayPos = vec3.clone(ray.pos);
	// vec3.transformMat4(rayPos, rayPos, this.transRayMat);

	// var dir4 = vec4.fromValues(ray.dir[0], ray.dir[1], ray.dir[2], 0);
	// vec4.transformMat4(dir4, dir4, this.transRayMat);
	// //	vec3.transformMat4(ray.dir, ray.dir, this.transRayMat);
	// var rayDir = vec3.create();
	// vec3.set(rayDir, dir4[0], dir4[1], dir4[2]);

	// var t = this.intersect(rayPos, rayDir);
	// if (t === null) {
		// return false;
	// }

	// if(t>0.00001)
	// {
		// intersection.hits.push(new RayHit());
		// var hit = intersection.hits.[intersectionl.hits.length-1];
		// hit.t = t;
		// hit.local_hit_point = vec3.clone(rayPos);
		// vec3.scaleAndAdd(hit.local_hit_point, hit.local_hit_point, rayDir, t);
		
		// vec4.set(dir4,0,0,1,0);
		// vec4.transformMat4(dir4,dir4,this.transNormalMat);
		// vec3.set(hit.hit_normal, dir4[0],dir4[1],dir4[2]);
	// }
	
	// if (t < rayHit.t) {
		// rayHit.t = t;

		// rayHit.hit_on_object = true;

		// rayHit.local_hit_point = vec3.clone(rayPos);
		// vec3.scaleAndAdd(rayHit.local_hit_point, rayHit.local_hit_point, rayDir, t);

		// var xfrac = rayHit.local_hit_point[0] - Math.floor(rayHit.local_hit_point[0] / (this.gap + this.size)) * (this.gap + this.size);
		// var yfrac = rayHit.local_hit_point[1] - Math.floor(rayHit.local_hit_point[1] / (this.gap + this.size)) * (this.gap + this.size);

		// xfrac = Math.abs(xfrac);
		// yfrac = Math.abs(yfrac);

		// if ((xfrac < this.size / 2 && yfrac < this.size / 2) || ((xfrac > this.size / 2 + this.gap) && (yfrac > this.size / 2 + this.gap)) ||
			// (xfrac < this.size / 2 && yfrac > this.size / 2 + this.gap) || ((xfrac > this.size / 2 + this.gap) && (yfrac < this.size / 2))) {
			// //return [1, 1, 1]; //inside the rect
			// //vec3.set(rayHit.color, this.geo.kd[0],this.);
			// vec3.copy(rayHit.color, this.geo.kd);
			// //			vec3.set(rayHit.color, 1, 1, 1);
		// } else {
			// //        console.log('select black');
			// vec3.set(rayHit.color, 0, 0, 0);
		// }

		// return true;
	// }

	// return false;

// }


//Plane.prototype.traceRay = function(ray)
////{
////    var int_dist = this.intersect(ray);
////    if(int_dist===null)
////    {
////       return null;
////    }

////    var intersection_point = vec3.clone(ray.dir);
////    vec3.scale(intersection_point,intersection_point,int_dist);
////    vec3.add(intersection_point,intersection_point,ray.pos);
////    vec3.transformmat4(intersection_point,intersection_point,this.transraymat);


////    var xfrac = intersection_point[0] - math.floor(intersection_point[0]/(this.gap+this.size)) * (this.gap+this.size);
////    var yfrac = intersection_point[1] - math.floor(intersection_point[1]/(this.gap+this.size)) * (this.gap+this.size);

////    xfrac = math.abs(xfrac);
////    yfrac = math.abs(yfrac);

////    if((xfrac<this.size/2 && yfrac < this.size/2) || ((xfrac>this.size/2+this.gap) && (yfrac>this.size/2+this.gap)) ||
////    (xfrac<this.size/2 && yfrac > this.size/2 + this.gap) || ((xfrac>this.size/2+this.gap) && (yfrac<this.size/2)))
////    {
////        return [1,1,1]; //inside the rect
////    }
////    else
////    {
//////        console.log('select black');
////        return [0,0,0];
////    }
//}

//Plane.prototype.traceRay = function(ray)
//{

//    var hitPos = vec3.create();
////    var hisColor = vec3.create();

////    var hit = this.dist/ray.dir[2]
////    var hit = this.distanceToPoint(ray.pos);
////    console.log(ray.dir[2]);

//    vec3.scaleAndAdd(hitPos,ray.pos,ray.dir,hit);

//    console.log(hitPos);

//    //from the hit position, get the color
//    //first---we have to decide whether the hit point is inside one rectangle
//    var xfrac = hitPos[0] - Math.floor(hitPos[0]/(this.gap+this.size)) * (this.gap+this.size);
//    var yfrac = hitPos[1] - Math.floor(hitPos[1]/(this.gap+this.size)) * (this.gap+this.size);
//    xfrac = Math.abs(xfrac);
//    yfrac = Math.abs(yfrac);
//    if((xfrac<this.size/2 && yfrac < this.size/2) || (xfrac>this.size/2+this.gap) && (yfrac>this.size/2+this.gap))
//    {
//        return [1,1,1]; //inside the rect
//    }
//    else
//    {
////        console.log('select black');
//        return [0,0,0];
//    }
//}
