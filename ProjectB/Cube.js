//get solid checker texture
function getCheckerColor(local_hit, color) {
    var eps = -0.000187453738;
    var x = Math.floor(local_hit[0] + eps);
    var y = Math.floor(local_hit[1] + eps);
    var z = Math.floor(local_hit[2] + eps);

    if ((x + y + z) % 2 === 0) {
        vec3.copy(color, [0, 0, 0]);
    } else {
        vec3.copy(color, [1, 1, 1]);
    }
}

function getNormal(face_hit) {
    switch (face_hit) {
    case 0:
        return [-1, 0, 0];
    case 1:
        return [0, -1, 0];
    case 2:
        return [0, 0, -1];
    case 3:
        return [1, 0, 0];
    case 4:
        return [0, 1, 0];
    case 5:
        return [0, 0, 1];
    }
}
BBox = function(vmin, vmax)
{
    this.vmin = vec3.clone(vmin);
    this.vmax = vec3.clone(vmax);
}

BBox.prototype.constructor = BBox;

BBox.prototype.checkRayHit = function(rayPos,rayDir)
{

    var t_min = vec3.create();
    var t_max = vec3.create();


    var a = 1.0 / rayDir[0];
    if (a >= 0) {
        t_min[0] = (this.vmin[0] - rayPos[0])*a;
        t_max[0] = (this.vmax[0] - rayPos[0])*a;
    }
    else {
        t_min[0] = (this.vmax[0] - rayPos[0])*a;
        t_max[0] = (this.vmin[0] - rayPos[0])*a;
    }

    var b = 1.0 / rayDir[1];
    if (b >= 0) {
        t_min[1] = (this.vmin[1] - rayPos[1]) * b;
        t_max[1] = (this.vmax[1] - rayPos[1]) * b;
    }
    else {
        t_min[1] = (this.vmax[1] - rayPos[1]) * b;
        t_max[1] = (this.vmin[1] - rayPos[1]) * b;
    }

    var c = 1.0 / rayDir[2];
    if (c >= 0) {
        t_min[2] = (this.vmin[2] - rayPos[2]) * c;
        t_max[2] = (this.vmax[2] - rayPos[2]) * c;
    }
    else {
        t_min[2] = (this.vmax[2] - rayPos[2]) * c;
        t_max[2] = (this.vmin[2] - rayPos[2]) * c;
    }

    var t0, t1;

    // find largest entering t value

    if (t_min[0] > t_min[1])
        t0 = t_min[0];
    else
        t0 = t_min[1];

    if (t_min[2] > t0)
        t0 = t_min[2];

    // find smallest exiting t value

    if (t_max[0] < t_max[1])
        t1 = t_max[0];
    else
        t1 = t_max[1];

    if (t_max[2] < t1)
        t1 = t_max[2];

    return Boolean(t0 < t1 && t1 > 1e-5);
}
Cube = function (position, size, rotation, material, widthSegments, heightSegments, depthSegments) {

    this.type = OBJ_CUBE;

    this.size = vec3.clone(size);
    this.rotation = vec3.clone(rotation);
    this.position = vec3.clone(position);

    this.widthSegments = widthSegments || 1;
    this.heightSegments = heightSegments || 1;
    this.depthSegments = depthSegments || 1;


    var scope = this;

    var vertex = vec3.create();

    var width_half = 1 / 2;
    var height_half = 1 / 2;
    var depth_half = 1 / 2;

    this.geo = new Geometry();

    this.transMat = mat4.create();
    var m = mat4.create();
    mat4.translate(m, m, this.position);
    mat4.multiply(this.transMat, this.transMat, m);

    mat4.identity(m);
    mat4.rotateX(m, m, this.rotation[0]);
    mat4.multiply(this.transMat, this.transMat, m);

    mat4.identity(m);
    mat4.rotateY(m, m, this.rotation[1]);
    mat4.multiply(this.transMat, this.transMat, m);

    mat4.identity(m);
    mat4.rotateZ(m, m, this.rotation[2]);
    mat4.multiply(this.transMat, this.transMat, m);

    mat4.identity(m);
    mat4.scale(m, m, this.size);
    mat4.multiply(this.transMat, this.transMat, m);

    this.transRayMat = mat4.create();
    mat4.invert(this.transRayMat, this.transMat);

    this.transNormalMat = mat4.create();
    mat4.transpose(this.transNormalMat, this.transRayMat);

    var matte = Material(material);
    vec3.copy(this.geo.ka, matte.ambient);
    vec3.copy(this.geo.kd, matte.diffuse);
    vec3.copy(this.geo.ks, matte.specular);
    this.geo.shn = matte.shiny;
	
	this.geo.ka_list.push(vec3.clone(matte.ambient));
	this.geo.kd_list.push(vec3.clone(matte.diffuse));
	this.geo.ks_list.push(vec3.clone(matte.specular));
	this.geo.shn_list.push(matte.shiny);

    this.canTrace = true;
	this.skipTransform = false;
    this.renderGL = true;
};

Cube.prototype.constructor = Cube;
Cube.prototype.addMatte = function(material)
{
	var matte = Material(material);
	this.geo.ka_list.push(vec3.clone(matte.ambient));
	this.geo.kd_list.push(vec3.clone(matte.diffuse));
	this.geo.ks_list.push(vec3.clone(matte.specular));
	this.geo.shn_list.push(matte.shiny);
}
Cube.prototype.checkRayHit = function (ray) {
    var rayPos = vec3.clone(ray.pos);
    vec3.transformMat4(rayPos, rayPos, this.transRayMat);

    var dir4 = vec4.fromValues(ray.dir[0], ray.dir[1], ray.dir[2], 0);
    vec4.transformMat4(dir4, dir4, this.transRayMat);

    var rayDir = vec3.fromValues(dir4[0], dir4[1], dir4[2]);

    var t_min = vec3.create();
    var t_max = vec3.create();
    var a = 1.0 / rayDir[0];
    if (a > 0) {
        t_min[0] = (-1.0 - rayPos[0]) * a;
        t_max[0] = (1.0 - rayPos[0]) * a;
    } else {
        t_min[0] = (1.0 - rayPos[0]) * a;
        t_max[0] = (-1.0 - rayPos[0]) * a;
    }

    var b = 1.0 / rayDir[1];
    if (b > 0) {
        t_min[1] = (-1.0 - rayPos[1]) * b;
        t_max[1] = (1.0 - rayPos[1]) * b;
    } else {
        t_min[1] = (1.0 - rayPos[1]) * b;
        t_max[1] = (-1.0 - rayPos[1]) * b;
    }

    var c = 1.0 / rayDir[2];
    if (c > 0) {
        t_min[2] = (-1.0 - rayPos[2]) * c;
        t_max[2] = (1.0 - rayPos[2]) * c;
    } else {
        t_min[2] = (1.0 - rayPos[2]) * c;
        t_max[2] = (-1.0 - rayPos[2]) * c;
    }

    var t0, t1;

    //find largest entering t value
    if (t_min[0] > t_min[1]) {
        t0 = t_min[0];
    } else {
        t0 = t_min[1];
    }

    if (t_min[2] > t0) {
        t0 = t_min[2];
    }

    //find smallest existing t value

    if (t_max[0] < t_max[1]) {
        t1 = t_max[0];
    } else {
        t1 = t_max[1];
    }

    if (t_max[2] < t1) {
        t1 = t_max[2];
    }

    if (t0 < t1 && t1 > 1e-5) {
        if (t0 > 1e-5) {
            ray.setTime(t0);
        } else {
            ray.setTime(t1);
        }
        return true;
    }

    return false;
}

Cube.prototype.traceRay = function (ray, intersection,objIdx) {
    var rayPos = vec3.clone(ray.pos);
    vec3.transformMat4(rayPos, rayPos, this.transRayMat);

    var dir4 = vec4.fromValues(ray.dir[0], ray.dir[1], ray.dir[2], 0);
    vec4.transformMat4(dir4, dir4, this.transRayMat);

    var rayDir = vec3.fromValues(dir4[0], dir4[1], dir4[2]);

    var t_min = vec3.create();
    var t_max = vec3.create();
    var a = 1.0 / rayDir[0];
    if (a > 0) {
        t_min[0] = (-1.0 - rayPos[0]) * a;
        t_max[0] = (1.0 - rayPos[0]) * a;
    } else {
        t_min[0] = (1.0 - rayPos[0]) * a;
        t_max[0] = (-1.0 - rayPos[0]) * a;
    }

    var b = 1.0 / rayDir[1];
    if (b > 0) {
        t_min[1] = (-1.0 - rayPos[1]) * b;
        t_max[1] = (1.0 - rayPos[1]) * b;
    } else {
        t_min[1] = (1.0 - rayPos[1]) * b;
        t_max[1] = (-1.0 - rayPos[1]) * b;
    }

    var c = 1.0 / rayDir[2];
    if (c > 0) {
        t_min[2] = (-1.0 - rayPos[2]) * c;
        t_max[2] = (1.0 - rayPos[2]) * c;
    } else {
        t_min[2] = (1.0 - rayPos[2]) * c;
        t_max[2] = (-1.0 - rayPos[2]) * c;
    }

    var t0, t1, face_in, face_out;

    //find largest entering t value
    if (t_min[0] > t_min[1]) {
        t0 = t_min[0];
        face_in = (a >= 0.0) ? 0 : 3;
    } else {
        t0 = t_min[1];
        face_in = (b >= 0.0) ? 1 : 4;
    }

    if (t_min[2] > t0) {
        t0 = t_min[2];
        face_in = (c >= 0.0) ? 2 : 5;
    }

    //find smallest existing t value

    if (t_max[0] < t_max[1]) {
        t1 = t_max[0];
        face_out = (a >= 0.0) ? 3 : 0;
    } else {
        t1 = t_max[1];
        face_out = (b >= 0.0) ? 4 : 1;
    }

    if (t_max[2] < t1) {
        t1 = t_max[2];
        face_out = (c >= 0.0) ? 5 : 2;
    }

    if (t0 < t1 && t1 > 0.00001) {
        var hit;
		var hit_pt = vec3.create();
		
        if (t0 > 0.00001) {
            intersection.hits.push(new RayHit());
            hit = intersection.hits[intersection.hits.length - 1];
            hit.t = t0;
            hit.hit_on_object = true;
			hit.hit_obj_idx = objIdx;
            hit.isEntering = true;
			vec3.scaleAndAdd(hit.local_hit_point, hit.local_hit_point, rayDir, t0);
            // if (!this.skipTransform) {
                // hit.local_hit_point = vec3.clone(rayPos);
                // vec3.scaleAndAdd(hit.local_hit_point, hit.local_hit_point, rayDir, t0);
            // } else {
                // hit.local_hit_point = vec3.clone(ray.pos);
                // vec3.scaleAndAdd(hit.local_hit_point, hit.local_hit_point, ray.dir, t0);
            // }
            vec3.copy(hit.hit_normal, getNormal(face_in));
            vec4.set(dir4, hit.hit_normal[0], hit.hit_normal[1], hit.hit_normal[2], 0);
            vec4.transformMat4(dir4, dir4, this.transNormalMat);
            vec3.set(hit.hit_normal, dir4[0], dir4[1], dir4[2]);
            vec3.normalize(hit.hit_normal, hit.hit_normal);
            ++intersection.numHits;
			
			//check texture option
			if(this.geo.texture>TEX_NONE)
			{
				switch(this.geo.texture)
				{
					case TEX_CHECKER_TRANS:
						vec3.copy(hit_pt,hit.local_hit_point);
						hit.tex_idx = this.geo.getChecker(hit_pt);
						break;
					case TEX_CHECKER_SKIP:
						vec3.scaleAndAdd(hit_pt,ray.pos,ray.dir,t0);
						hit.tex_idx = this.geo.getChecker(hit_pt);
						break;
				}
				
				
			}
        }

        intersection.hits.push(new RayHit());
        hit = intersection.hits[intersection.hits.length - 1];
        hit.t = t1;
        hit.hit_on_object = true;
		hit.hit_obj_idx = objIdx;
		vec3.scaleAndAdd(hit.local_hit_point, hit.local_hit_point, rayDir, t1);
        // if (!this.skipTransform) {
            // hit.local_hit_point = vec3.clone(rayPos);
            // vec3.scaleAndAdd(hit.local_hit_point, hit.local_hit_point, rayDir, t1);
        // } else {
            // hit.local_hit_point = vec3.clone(ray.pos);
            // vec3.scaleAndAdd(hit.local_hit_point, hit.local_hit_point, ray.dir, t1);
        // }
        vec3.copy(hit.hit_normal, getNormal(face_out));
        vec4.set(dir4, hit.hit_normal[0], hit.hit_normal[1], hit.hit_normal[2], 0);
        vec4.transformMat4(dir4, dir4, this.transNormalMat);
        vec3.set(hit.hit_normal, dir4[0], dir4[1], dir4[2]);
        vec3.normalize(hit.hit_normal, hit.hit_normal);
        ++intersection.numHits;
		
		if(this.geo.texture>TEX_NONE && intersection.numHits===1)
			{
				switch(this.geo.texture)
				{
					case TEX_CHECKER_TRANS:
						vec3.copy(hit_pt,hit.local_hit_point);
						hit.tex_idx = this.geo.getChecker(hit_pt);
						break;
					case TEX_CHECKER_SKIP:
						vec3.scaleAndAdd(hit_pt,ray.pos,ray.dir,t0);
						hit.tex_idx = this.geo.getChecker(hit_pt);
						break;
				}

			}
    }

    return Boolean(intersection.numHits > 0);

}

Cube.prototype.genGeometry = function () {

    // var offset = 0;

    this.geo.vertices = [
             1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, // v0-v1-v2-v3 front
             1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, // v0-v3-v4-v5 right
             1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
             -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, // v1-v6-v7-v2 left
             -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, // v7-v4-v3-v2 down
             1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0 // v4-v7-v6-v5 back
         ];

    this.geo.normals = [
             0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
             1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
             0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
             -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
             0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
             0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1
         ];



    this.geo.uvs = [
             1, 0, 0, 0, 0, 1, 1, 1,
             0, 0, 0, 1, 1, 1, 1, 0,
             1, 1, 1, 0, 0, 0, 0, 1,
             1, 0, 0, 0, 0, 1, 1, 1,
             0, 1, 1, 1, 1, 0, 0, 0,
             0, 1, 1, 1, 1, 0, 0, 0
         ];



    this.geo.faces = [
             0, 1, 2, 0, 2, 3, // front
             4, 5, 6, 4, 6, 7, // right
             8, 9, 10, 8, 10, 11, // up
             12, 13, 14, 12, 14, 15, // left
             16, 17, 18, 16, 18, 19, // down
             20, 21, 22, 20, 22, 23 // back
         ];

    this.renderMesh = new RenderMesh(this.geo);
}
