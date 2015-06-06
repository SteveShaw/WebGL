Sphere = function (r, center, scale, radX, radY, radZ) {
    this.radius = r;
    this.center = vec3.clone(center);
    this.scale = vec3.fromValues(1, 1, 1);
    if (scale !== undefined) {
        this.scale = vec3.clone(scale);

        //		console.log(this.scale);
    }
    vec3.scale(this.scale, this.scale, this.radius);
    //	this.rotation = vec3.clone(rotation); //x,y,z rotation

    this.type = OBJ_SPHERE;


    //create transform matrix
    this.transMat = mat4.create();
    var m = mat4.create();
    mat4.translate(m, m, this.center);
    mat4.multiply(this.transMat, this.transMat, m);

    if (radX !== undefined) {
        mat4.identity(m);
        mat4.rotateX(m, m, radX);
        mat4.multiply(this.transMat, this.transMat, m);
    }

    if (radY !== undefined) {
        mat4.identity(m);
        mat4.rotateY(m, m, radY);
        mat4.multiply(this.transMat, this.transMat, m);
    }

    if (radZ !== undefined) {
        mat4.identity(m);
        mat4.rotateZ(m, m, radZ);
        mat4.multiply(this.transMat, this.transMat, m);
    }

    mat4.identity(m);
    mat4.scale(m, m, this.scale);
    mat4.multiply(this.transMat, this.transMat, m);
    //    mat4.multiply(m, this.transMat, m);

    this.transRayMat = mat4.create();
    mat4.invert(this.transRayMat,this.transMat);
    //    console.log(mat4.str(this.transRayMat));

    //since we create the sphere using radius,not 1, we have to scale down the transform mat to 1/r;
    //    mat4.identity(m);
    //    var s = vec3.clone(this.scale);
    //    vec3.scale(s,s,1/r);
    //    mat4.scale(m,m,s);
    //    mat4.multiply(this.transMat,this.transMat,m);

    this.transNormalMat = mat4.create();
    mat4.transpose(this.transNormalMat, this.transRayMat);

    this.canTrace = true;
    this.renderGL = true;

    //add a bounding box
    this.bbox = new BBox(vec3.fromValues(-1,-1,-1),vec3.fromValues(1,1,1));
}

Sphere.prototype.constructor = Sphere;
Sphere.prototype.setScale = function (scale) {
    vec3.mul(this.scale, this.scale, scale);
    var m = mat4.create();
    mat4.scale(m, m, scale);
    mat4.multiply(this.transMat, this.transMat, m);
    //    mat4.invert(m,m);
    //    mat4.multiply(this.transRayMat,m,this.transRayMat);
    mat4.invert(this.transRayMat, this.transMat);
    mat4.transpose(this.transNormalMat, this.transRayMat);
    //    console.log(mat4.str(this.transRayMat));
}
Sphere.prototype.genGeometry = function (slices, stacks, material) {

    this.geo = new Geometry();
    var matte = Material(material);
    vec3.copy(this.geo.ka, matte.ambient);
    vec3.copy(this.geo.kd, matte.diffuse);
    vec3.copy(this.geo.ks, matte.specular);
    this.geo.shn = matte.shiny;
	
	this.geo.ka_list.push(vec3.clone(matte.ambient));
	this.geo.kd_list.push(vec3.clone(matte.diffuse));
	this.geo.ks_list.push(vec3.clone(matte.specular));
	this.geo.shn_list.push(matte.shiny);

    if(!this.renderGL) return;

    var x, y;
    var u, v;

    var phiStart = 0;
    var phiLength = Math.PI * 2;

    var thetaStart = 0;
    var thetaLength = Math.PI;

    var rawVerts = [];

    var vertices = [];
    var uvs = [];

    var vertex = vec3.create();

    for (y = 0; y <= stacks; y++) {

        var verticesRow = [];
        var uvsRow = [];

        for (x = 0; x <= slices; x++) {

            u = x / slices;
            v = y / stacks;

            //var vertex = vec3.create();

            //			vertex[0] = - this.radius * Math.cos( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );
            //			vertex[1] = this.radius * Math.cos( thetaStart + v * thetaLength );
            //			vertex[2] = this.radius * Math.sin( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );

            vertex[0] = -1.0* Math.cos( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );
            vertex[1] =  Math.cos( thetaStart + v * thetaLength );
            vertex[2] =  Math.sin( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );

            rawVerts.push(vec3.clone(vertex));

            //			rawVerts.push(-this.radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength));
            //			rawVerts.push(this.radius * Math.cos(thetaStart + v * thetaLength));
            //			rawVerts.push(this.radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength));
            // rawVerts.push(Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength));
            // rawVerts.push(Math.cos(thetaStart + v * thetaLength));
            // rawVerts.push(Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength));

            //            verticesRow.push(vertex);
            verticesRow.push(rawVerts.length - 1);
            uvsRow.push(vec2.fromValues(u, 1 - v));
        }

        vertices.push(verticesRow);
        uvs.push(uvsRow);
    }

    var v1, v2, v3, v4;
    var n1 = vec3.create();
    var n2 = vec3.create();
    var n3 = vec3.create();
    var n4 = vec3.create();
    var uv1, uv2, uv3, uv4;
    var f = 0;

    for ( y = 0; y < stacks; y ++ ) {

        for ( x = 0; x < slices; x ++ ) {

            v1 = vertices[ y ][ x + 1 ];
            v2 = vertices[ y ][ x ];
            v3 = vertices[ y + 1 ][ x ];
            v4 = vertices[ y + 1 ][ x + 1 ];

            vec3.normalize(n1,rawVerts[v1]);
            vec3.normalize(n2,rawVerts[v2]);
            vec3.normalize(n3,rawVerts[v3]);
            vec3.normalize(n4,rawVerts[v4]);

            uv1 = uvs[ y ][ x + 1 ];
            uv2 = uvs[ y ][ x ];
            uv3 = uvs[ y + 1 ][ x ];
            uv4 = uvs[ y + 1 ][ x + 1 ];

            if(Math.abs(rawVerts[v1][1]) === this.radius)
            {
                uv1[0] = (uv1[0] + uv2[1]) / 2;
                this.geo.faces.push(f++);
                this.geo.vertices.push(rawVerts[v1][0],rawVerts[v1][1],rawVerts[v1][2]);
                this.geo.normals.push(n1[0],n1[1],n1[2]);
                this.geo.uvs.push(uv1[0],uv1[1]);

                this.geo.faces.push(f++);
                this.geo.vertices.push(rawVerts[v3][0],rawVerts[v3][1],rawVerts[v3][2]);
                this.geo.normals.push(n3[0],n3[1],n3[2]);
                this.geo.uvs.push(uv3[0],uv3[1]);

                this.geo.faces.push(f++);
                this.geo.vertices.push(rawVerts[v4][0],rawVerts[v4][1],rawVerts[v4][2]);
                this.geo.normals.push(n4[0],n4[1],n4[2]);
                this.geo.uvs.push(uv4[0],uv4[1]);
            }
            else if(Math.abs(rawVerts[v3][1] === this.radius))
            {
                uv3[0] = ( uv3[0] + uv4[0] ) / 2;

                this.geo.faces.push(f++);
                this.geo.vertices.push(rawVerts[v1][0],rawVerts[v1][1],rawVerts[v1][2]);
                this.geo.normals.push(n1[0],n1[1],n1[2]);
                this.geo.uvs.push(uv1[0],uv1[1]);

                this.geo.faces.push(f++);
                this.geo.vertices.push(rawVerts[v2][0],rawVerts[v2][1],rawVerts[v2][2]);
                this.geo.normals.push(n2[0],n2[1],n2[2]);
                this.geo.uvs.push(uv2[0],uv2[1]);

                this.geo.faces.push(f++);
                this.geo.vertices.push(rawVerts[v3][0],rawVerts[v3][1],rawVerts[v3][2]);
                this.geo.normals.push(n3[0],n3[1],n3[2]);
                this.geo.uvs.push(uv3[0],uv3[1]);

            }
            else
            {
                this.geo.faces.push(f++);
                this.geo.vertices.push(rawVerts[v1][0],rawVerts[v1][1],rawVerts[v1][2]);
                this.geo.normals.push(n1[0],n1[1],n1[2]);
                this.geo.uvs.push(uv1[0],uv1[1]);

                this.geo.faces.push(f++);
                this.geo.vertices.push(rawVerts[v2][0],rawVerts[v2][1],rawVerts[v2][2]);
                this.geo.normals.push(n2[0],n2[1],n2[2]);
                this.geo.uvs.push(uv2[0],uv2[1]);

                this.geo.faces.push(f++);
                this.geo.vertices.push(rawVerts[v4][0],rawVerts[v4][1],rawVerts[v4][2]);
                this.geo.normals.push(n4[0],n4[1],n4[2]);
                this.geo.uvs.push(uv4[0],uv4[1]);


                this.geo.faces.push(f++);
                this.geo.vertices.push(rawVerts[v2][0],rawVerts[v2][1],rawVerts[v2][2]);
                this.geo.normals.push(n2[0],n2[1],n2[2]);
                this.geo.uvs.push(uv2[0],uv2[1]);

                this.geo.faces.push(f++);
                this.geo.vertices.push(rawVerts[v3][0],rawVerts[v3][1],rawVerts[v3][2]);
                this.geo.normals.push(n3[0],n3[1],n3[2]);
                this.geo.uvs.push(uv3[0],uv3[1]);

                this.geo.faces.push(f++);
                this.geo.vertices.push(rawVerts[v4][0],rawVerts[v4][1],rawVerts[v4][2]);
                this.geo.normals.push(n4[0],n4[1],n4[2]);
                this.geo.uvs.push(uv4[0],uv4[1]);
            }

        }

    }


    //create geomotry object to contain the related information

    //	this.createMesh(this.geo);
    //rearrange faces
    // var i, index;

    // for (i = 0; i < rawFaces.length; ++i) {
    // index = rawFaces[i];
    // this.geo.faces.push(i);

    // this.geo.vertices.push(rawVerts[index * 3]);
    // this.geo.vertices.push(rawVerts[index * 3 + 1]);
    // this.geo.vertices.push(rawVerts[index * 3 + 2]);

    // this.geo.uvs.push(rawUVs[index][0]);
    // this.geo.uvs.push(rawUVs[index][1]);
    // }

    // this.geo.computeNormals();


    // vec3.set(this.geo.ka, 0.25, 0.20725, 0.20725);
    // vec3.set(this.geo.kd, 1.0, 0.829, 0.829);
    // vec3.set(this.geo.ks, 0.296648, 0.296648, 0.296648);

    this.renderMesh = new RenderMesh(this.geo);

}

Sphere.prototype.checkRayHit = function (ray) {
    var rayPos = vec3.clone(ray.pos);
    vec3.transformMat4(rayPos, rayPos, this.transRayMat);

    var dir4 = vec4.fromValues(ray.dir[0], ray.dir[1], ray.dir[2], 0);
    vec4.transformMat4(dir4, dir4, this.transRayMat);

    var rayDir = vec3.fromValues(dir4[0], dir4[1], dir4[2]);
    //	vec3.set(ray.dir, dir4[0], dir4[1], dir4[2]);

    if(!this.bbox.checkRayHit(rayPos,rayDir))
    {
        return false;
    }
    //vector from ray to sphere --- the untransformed sphere is at world origin
    var r2s = vec3.create();
    vec3.sub(r2s, r2s, rayPos);
    var r2sSL = vec3.squaredLength(r2s);
    var tcaS = vec3.dot(rayDir, r2s);
    var rayDirSL = vec3.dot(rayDir, rayDir);
    var tca2, LM2, root;
    var t = -1;

    if (r2sSL > 1.0) {

        if (tcaS < 0) return false; //miss hit

        tca2 = tcaS * tcaS / rayDirSL;

        LM2 = r2sSL - tca2;

        if (LM2 > 1.0) return false; //still miss

        root = Math.sqrt((1.0 - LM2) / rayDirSL);
        t = tcaS / rayDirSL - root;

        if (t > 1e-5) {
            ray.setTime(t);
            return true;
        }

        t = t + 2 * root;

        if (t > 1e-5) {
            ray.setTime(t);
            return true;
        }

    } else {


        tca2 = tcaS * tcaS / rayDirSL;
        LM2 = r2sSL - tca2;
        if (LM2 > 1.0) return false; //still miss

        root = Math.sqrt((1.0 - LM2) / rayDirSL);
        t = tcaS / rayDirSL + root;

        if (t > 1e-5) {
            ray.setTime(t);
            return true;
        }
    }

    return false;
}

Sphere.prototype.traceRay = function (ray, intersection, objIdx) {
    //transform ray
    var rayPos = vec3.clone(ray.pos);
    vec3.transformMat4(rayPos, rayPos, this.transRayMat);

    var dir4 = vec4.fromValues(ray.dir[0], ray.dir[1], ray.dir[2], 0);
    vec4.transformMat4(dir4, dir4, this.transRayMat);

    var rayDir = vec3.fromValues(dir4[0], dir4[1], dir4[2]);
    //	vec3.set(ray.dir, dir4[0], dir4[1], dir4[2]);

    if(!this.bbox.checkRayHit(rayPos,rayDir))
    {
        return false;
    }


    //vector from ray to sphere --- the untransformed sphere is at world origin
    var r2s = vec3.create();
    vec3.sub(r2s, r2s, rayPos);
    var r2sSL = vec3.squaredLength(r2s);
    var tcaS = vec3.dot(rayDir, r2s);
    var rayDirSL = vec3.dot(rayDir, rayDir);
    var tca2, LM2, root, t;
    var hit;

    if (r2sSL > 1.0) {

        if (tcaS < 0) return false; //miss hit


        tca2 = tcaS * tcaS / rayDirSL;

        LM2 = r2sSL - tca2;

        if (LM2 > 1.0) return false; //still miss

        //next we have to find the 2 hit points
        //		var L2hc = 1.0 - deltaSL;

        root = Math.sqrt((1.0 - LM2) / rayDirSL);
        t = tcaS / rayDirSL - root;

        if (t > 0.00001) {
            intersection.hits.push(new RayHit());
            hit = intersection.hits[intersection.hits.length - 1];
            hit.t = t;
            hit.hit_on_object = true;
            hit.local_hit_point = vec3.clone(rayPos);
            hit.hit_obj_idx = objIdx;
            hit.isEntering = true;
            vec3.scaleAndAdd(hit.local_hit_point, hit.local_hit_point, rayDir, t);
            vec3.copy(hit.color, this.geo.kd);

            ++intersection.numHits;
            vec4.set(dir4, hit.local_hit_point[0], hit.local_hit_point[1], hit.local_hit_point[2], 0);
            vec4.transformMat4(dir4, dir4, this.transNormalMat);
            vec3.set(hit.hit_normal, dir4[0], dir4[1], dir4[2]);
            vec3.normalize(hit.hit_normal, hit.hit_normal);
            // return true;
        }

        t = t + 2 * root;

        if (t > 0.00001) {
            intersection.hits.push(new RayHit());
            hit = intersection.hits[intersection.hits.length - 1];
            hit.t = t;
            hit.hit_on_object = true;
            hit.hit_obj_idx = objIdx;
            hit.local_hit_point = vec3.clone(rayPos);
            vec3.scaleAndAdd(hit.local_hit_point, hit.local_hit_point, rayDir, t);
            vec3.copy(hit.color, this.geo.kd);
            ++intersection.numHits;
            vec4.set(dir4, hit.local_hit_point[0], hit.local_hit_point[1], hit.local_hit_point[2], 0);
            vec4.transformMat4(dir4, dir4, this.transNormalMat);
            vec3.set(hit.hit_normal, dir4[0], dir4[1], dir4[2]);
            vec3.normalize(hit.hit_normal, hit.hit_normal);
            // return true;
        }

        //		tArr.push(tcas / rayDirSL + root);
        //		tArr.push(t[0] - 2 * root);
        //		colorArr.push(vec3.fromValues(this.geo.diffuseColor[0], this.geo.diffuseColor[1], this.geo.diffuseColor[2]));
    } else {
        tca2 = tcaS * tcaS / rayDirSL;
        //		t.push
        LM2 = r2sSL - tca2;
        if (LM2 > 1.0) return false; //still miss
        root = Math.sqrt((1.0 - LM2) / rayDirSL);
        t = tcaS / rayDirSL + root;
        if (t > 0.00001) {
            intersection.hits.push(new RayHit());
            hit = intersection.hits[intersection.hits.length - 1];
            hit.t = t;
            hit.hit_on_object = true;
            hit.hit_obj_idx = objIdx;
//            hit.isEntering = true;
            hit.local_hit_point = vec3.clone(rayPos);
            vec3.scaleAndAdd(hit.local_hit_point, hit.local_hit_point, rayDir, t);
            vec3.copy(hit.color, this.geo.kd);

            vec4.set(dir4, hit.local_hit_point[0], hit.local_hit_point[1], hit.local_hit_point[2], 0);

            vec4.transformMat4(dir4, dir4, this.transNormalMat);
            vec3.set(hit.hit_normal, dir4[0], dir4[1], dir4[2]);
            vec3.normalize(hit.hit_normal, hit.hit_normal);
            ++intersection.numHits;
            // return true;
        }

        //		t.push(tcas / rayDirSL + root);
        //		colorArr.push(vec3.fromValues(this.geo.diffuseColor[0], this.geo.diffuseColor[1], this.geo.diffuseColor[2]));
    }

    return Boolean(intersection.numHits > 0);
}
