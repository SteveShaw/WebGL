Cylinder = function(topR,bottomR,height,center,rotation)
{
    //this tampered cylinder have height along z-axis
    //the generic is h = 2, br = 1
    this.tr = topR;
    this.br = bottomR;
    this.height = height;

    this.scale = vec3.fromValues(bottomR,bottomR,height);

    this.sr = topR/bottomR;//scaled back to bottom radius = 1
    this.canTrace = true;
    this.renderGL = true;

    this.bbox = new BBox(vec3.fromValues(-1,-1,0),vec3.fromValues(1,1,1));

    //create transformation matrix

    this.transMat = mat4.create();
    var m = mat4.create();
    mat4.translate(m,m,center);
    mat4.multiply(this.transMat,this.transMat,m);

    mat4.identity(m);
    mat4.rotateX(m,m,rotation[0]);
    mat4.multiply(this.transMat,this.transMat,m);

    mat4.identity(m);
    mat4.rotateX(m,m,rotation[1]);
    mat4.multiply(this.transMat,this.transMat,m);

    mat4.identity(m);
    mat4.rotateX(m,m,rotation[2]);
    mat4.multiply(this.transMat,this.transMat,m);

    mat4.identity(m);
    mat4.scale(m,m,this.scale);
    mat4.multiply(this.transMat,this.transMat,m);

    this.transRayMat = mat4.create();
    mat4.invert(this.transRayMat,this.transMat);

    this.transNormalMat = mat4.create();
    mat4.transpose(this.transNormalMat,this.transRayMat);
	
	//perlin noise
	this.noiseGen = new PerlinNoise();
}

Cylinder.prototype.constructor = Cylinder;
Cylinder.prototype.checkRayHit = function(ray)
{
    var rayPos = vec3.clone(ray.pos);
    vec3.transformMat4(rayPos, rayPos, this.transRayMat);

    var dir4 = vec4.fromValues(ray.dir[0], ray.dir[1], ray.dir[2], 0);
    vec4.transformMat4(dir4, dir4, this.transRayMat);

    var rayDir = vec3.fromValues(dir4[0], dir4[1], dir4[2]);

    if(!this.bbox.checkRayHit(rayPos,rayDir))
    {
        return false;
    }

    var F = 1+(this.sr-1)*rayPos[2];
    var d = (this.sr-1)*rayDir[2];
    var A = rayDir[0]*rayDir[0] + rayDir[1]*rayDir[1] - d*d;
    var B = rayPos[0]*rayDir[0] + rayPos[1]*rayDir[1] - F*d;
    var C = rayPos[0]*rayPos[0] + rayPos[1]*rayPos[1] - F*F;

    var discrim = B*B - A*C;
    var hit;

    var is_hit = false;

    if(discrim > 0.0)
    {
        var root = Math.sqrt(discrim);
        var t1 = (-B-root)/A;
        var z_hit = rayPos[2] + rayDir[2]*t1;

        if(t1>1e-5 && z_hit<=1.0 && z_hit >=0.0)
        {
            ray.setTime(t1);
            is_hit = true;
        }
        var t2 = (-B+root)/A;
        z_hit = rayPos[2] + rayDir[2]*t2;
        if(t2>1e-5 && z_hit<=1.0 && z_hit>=0.0)
        {
            if(ray.t0>t2)
            {
                ray.setTime(t2);
                is_hit = true;
            }
        }
    }

    var tb = -rayPos[2]/rayDir[2];
    var x_hit = rayPos[0] + tb*rayDir[0];
    var y_hit = rayPos[1] + tb*rayDir[1];
    var sqr_sum = x_hit*x_hit + y_hit*y_hit;

    if(tb>1e-5 && sqr_sum <1.0)
    {
        if(ray.t0>tb)
        {
            ray.setTime(tb);
            is_hit = true;
        }
    }

    var tc = (1-rayPos[2])/rayDir[2];
    x_hit = rayPos[0] + tc*rayDir[0];
    y_hit = rayPos[1] + tc*rayDir[1];
    sqr_sum = x_hit*x_hit + y_hit*y_hit;
    if(tc>1e-5 && sqr_sum<(this.sr*this.sr))
    {
        ray.setTime(tc);
        is_hit = true;
    }

    return is_hit;

}

Cylinder.prototype.traceRay = function(ray,intersection,objIdx)
{
    var rayPos = vec3.clone(ray.pos);
    vec3.transformMat4(rayPos, rayPos, this.transRayMat);

    var dir4 = vec4.fromValues(ray.dir[0], ray.dir[1], ray.dir[2], 0);
    vec4.transformMat4(dir4, dir4, this.transRayMat);

    var rayDir = vec3.fromValues(dir4[0], dir4[1], dir4[2]);

    if(!this.bbox.checkRayHit(rayPos,rayDir))
    {
        return false;
    }

    var F = 1+(this.sr-1)*rayPos[2];
    var d = (this.sr-1)*rayDir[2];
    var A = rayDir[0]*rayDir[0] + rayDir[1]*rayDir[1] - d*d;
    var B = rayPos[0]*rayDir[0] + rayPos[1]*rayDir[1] - F*d;
    var C = rayPos[0]*rayPos[0] + rayPos[1]*rayPos[1] - F*F;

    var discrim = B*B - A*C;
    var hit;

    if(discrim > 0.0)
    {
        var root = Math.sqrt(discrim);
        var t1 = (-B-root)/A;
        var z_hit = rayPos[2] + rayDir[2]*t1;

        if(t1>1e-5 && z_hit<=1.0 && z_hit >=0.0)
        {
            intersection.hits.push(new RayHit());
            hit = intersection.hits[intersection.hits.length-1];
            hit.t = t1;
            hit.hit_surface = 0;
            hit.hit_obj_idx = objIdx;
        }
        var t2 = (-B+root)/A;
        z_hit = rayPos[2] + rayDir[2]*t2;
        if(t2>1e-5 && z_hit<=1.0 && z_hit>=0.0)
        {
            intersection.hits.push(new RayHit());
            hit = intersection.hits[intersection.hits.length-1];
            hit.t = t2;
            hit.hit_surface = 0;
            hit.hit_obj_idx = objIdx;
        }
    }

    var tb = -rayPos[2]/rayDir[2];
    var x_hit = rayPos[0] + tb*rayDir[0];
    var y_hit = rayPos[1] + tb*rayDir[1];
    var sqr_sum = x_hit*x_hit + y_hit*y_hit;

    if(tb>1e-5 && sqr_sum <1.0)
    {
        intersection.hits.push(new RayHit());
        hit = intersection.hits[intersection.hits.length-1];
        hit.t = tb;
        hit.hit_surface = 1;
        hit.hit_obj_idx = objIdx;
    }

    var tc = (1-rayPos[2])/rayDir[2];
    x_hit = rayPos[0] + tc*rayDir[0];
    y_hit = rayPos[1] + tc*rayDir[1];
    sqr_sum = x_hit*x_hit + y_hit*y_hit;
    if(tc>1e-5 && sqr_sum<(this.sr*this.sr))
    {
        intersection.hits.push(new RayHit());
        hit = intersection.hits[intersection.hits.length-1];
        hit.t = tc;
        hit.hit_surface = 2;
        hit.hit_obj_idx = objIdx;
    }

    intersection.numHits = intersection.hits.length;
    if(intersection.numHits===0)
    {
        return false;
    }

    if(intersection.numHits===1)
    {
        intersection.hits[0].isEntering = false;
        intersection.hits[0].hit_obj_idx = objIdx;
    }
    else
    {
        if(intersection.hits[0].t>intersection.hits[1].t)
        {
            var tmp = intersection.hits[0].t;
            intersection.hits[0].t = intersection.hits[1].t;
            intersection.hits[1].t = tmp;

            tmp = intersection.hits[0].hit_surface;
            intersection.hits[0].hit_surface = intersection.hits[1].hit_surface;
            intersection.hits[1].hit_surface = tmp;

        }
            intersection.hits[0].hit_obj_idx = objIdx;
            intersection.hits[0].isEntering = true;
            intersection.hits[1].hit_obj_idx = objIdx;
            intersection.hits[1].isEntering = false;
    }


    for(var i = 0;i<intersection.numHits;++i)
    {
        vec3.scaleAndAdd(intersection.hits[i].local_hit_point, rayPos, rayDir, intersection.hits[i].t);
        switch(intersection.hits[i].hit_surface)
        {
        case 0:
            var p = intersection.hits[i].local_hit_point;
            var sm = this.sr-1;
            vec4.set(dir4, p[0], p[1], -sm*(1+sm*p[2]),0);
            break;
        case 1:
            vec4.set(dir4,0,0,-1,0);
            break;
         case 2:
             vec4.set(dir4,0,0,1,0);
             break;
         default:
             vec4.set(dir4,0,0,0,0);
             break
        }

        vec4.transformMat4(dir4,dir4,this.transNormalMat);
        vec3.set(intersection.hits[i].hit_normal,dir4[0],dir4[1],dir4[2]);
        vec3.normalize(intersection.hits[i].hit_normal, intersection.hits[i].hit_normal);
    }
	
	if(this.geo.texture>TEX_NONE && intersection.numHits>0)
	{
		
		hit = intersection.hits[0];
		var hit_pt = hit.local_hit_point;
		// var hit_pt = vec3.clone(ray.pos);
		// vec3.scaleAndAdd(hit_pt,hit_pt,ray.dir,hit.t);
		
		if(this.geo.texture === TEX_RING)
		{
			var r = Math.sqrt(hit_pt[0]*hit_pt[0]*100+hit_pt[1]*hit_pt[1]*100);
			var denom = vec3.length(hit_pt);
			var theta = Math.acos(hit_pt[2]/denom);
			var r1 = Math.sin(theta*5)*3;
			r = Math.floor(r+r1);
			r = r%2;
			vec3.scaleAndAdd(hit.color,[0.2,0.2,0.2], [0.8,0.8,0.8],r);
		}
		else if(this.geo.texture === TEX_PERLIN_NOISE)
		{
			hit_pt = vec3.clone(ray.pos);
			vec3.scaleAndAdd(hit_pt,hit_pt,ray.dir,hit.t);
			var nv = this.noiseGen.turb(hit_pt);
		// var nv = this.noiseGen.turb(hit.local_hit_point);
		//nv = nv*1.1 + 0.1;
			vec3.set(hit.color,nv,nv,nv);
		//vec3.mul(hit.color,hit.color,[1,1,0.1]);
		//vec3.multiply(hit.color,hit.color,[1.0,0.5,0.81]);
		}
		else if(this.geo.texture === TEX_CHECKER)
		{
			hit_pt = vec3.clone(ray.pos);
			vec3.scaleAndAdd(hit_pt,hit_pt,ray.dir,hit.t);
			this.geo.get3DChecker(hit_pt,hit.color);
		}

		//vec3.set(hit.color,r,r,r);
		//var nv = this.noiseGen.turb(hit_pt);
		// var nv = this.noiseGen.turb(hit.local_hit_point);
		//nv = nv*1.1 + 0.1;
		//vec3.set(hit.color,nv,nv,nv);
		//vec3.mul(hit.color,hit.color,[1,1,0.1]);
		//vec3.multiply(hit.color,hit.color,[1.0,0.5,0.81]);
		// switch(this.geo.texture)
		// {
			// case TEX_CHECKER_TRANS:
				// // vec3.copy(hit_pt,hit.local_hit_point);
				// hit.tex_idx = this.geo.get3DChecker(hit.local_hit_point);
				// break;
			// case TEX_CHECKER_SKIP:
				// var hit_pt = vec3.create();
				// vec3.scaleAndAdd(hit_pt,ray.pos,ray.dir,hit.t);
				// hit.tex_idx = this.geo.get3DChecker(hit_pt);
				// break;
		// }
	}

    return Boolean(intersection.numHits>0);
}
// Cylinder.prototype.addMaterial = function(material)
// {
	// var matte = Material(material);
	// this.geo.ka_list.push(vec3.clone(matte.ambient));
	// this.geo.kd_list.push(vec3.clone(matte.diffuse));
	// this.geo.ks_list.push(vec3.clone(matte.specular));
	// this.geo.shn_list.push(matte.shiny);
// }
Cylinder.prototype.genGeometry = function(rseg,hseg,open,material)
{
    this.geo = new Geometry();
    var matte = new Material(material);
    vec3.copy(this.geo.ka, matte.ambient);
    vec3.copy(this.geo.kd, matte.diffuse);
    vec3.copy(this.geo.ks, matte.specular);
    this.geo.shn = matte.shiny;

    var x, z, vertices = [], uvs = [];
    var vertex = vec3.create();
    var half_height = 0.5;

    var raw_verts = [];

    for ( z = 0; z <= hseg; z ++ ) {

        var verticesRow = [];
        var uvsRow = [];

        var v = z / hseg;
        var radius = 1- v * (  1.0 - this.sr );

        for ( x = 0; x <= rseg; x ++ ) {

            var u = x / rseg;

            vertex[0] = radius * Math.sin( u * Math.PI *2);
            vertex[2] = v;// * this.height;// + half_height;
            vertex[1] = radius * Math.cos( u * Math.PI *2);

            raw_verts.push( vec3.clone(vertex));

            verticesRow.push( raw_verts.length - 1 );
            uvsRow.push( vec2.fromValues(u,1-v));
        }

        vertices.push( verticesRow );
        uvs.push( uvsRow );

    }

    var tanTheta = (1.0 - this.sr);
    var na = vec3.create();
    var nb = vec3.create();
    var v1,v2,v3,v4;
    var uv1,uv2,uv3,uv4;
    var f = 0;

    for ( x = 0; x < rseg; x ++ ) {

        if ( this.tr !== 0 ) {

            vec3.copy(na,raw_verts[ vertices[ 0 ][ x ] ]);
            vec3.copy(nb,raw_verts[ vertices[ 0 ][ x + 1] ]);

        } else {

            vec3.copy(na,raw_verts[ vertices[ 1 ][ x ] ]);
            vec3.copy(nb,raw_verts[ vertices[ 1 ][ x + 1] ]);

        }

        na[2] = Math.sqrt(na[0]*na[0] + na[1]*na[1])*tanTheta;
        nb[2] = Math.sqrt(nb[0]*nb[0] + nb[1]*nb[1])*tanTheta;

        vec3.normalize(na,na);
        vec3.normalize(nb,nb);

        for ( z = 0; z < hseg; z ++ ) {

            v1 = raw_verts[vertices[ z ][ x ]];
            v2 = raw_verts[vertices[ z + 1 ][ x ]];
            v3 = raw_verts[vertices[ z + 1 ][ x + 1 ]];
            v4 = raw_verts[vertices[ z ][ x + 1 ]];

            uv1 = uvs[ z ][ x ];
            uv2 = uvs[ z + 1 ][ x ];
            uv3 = uvs[ z + 1 ][ x + 1 ];
            uv4 = uvs[ z ][ x + 1 ];

            this.geo.faces.push(f++);
            this.geo.vertices.push(v1[0],v1[1],v1[2]);
            this.geo.faces.push(f++);
            this.geo.vertices.push(v2[0],v2[1],v2[2]);
            this.geo.faces.push(f++);
            this.geo.vertices.push(v4[0],v4[1],v4[2]);
            this.geo.normals.push(na[0],na[1],na[2]);
            this.geo.normals.push(na[0],na[1],na[2]);
            this.geo.normals.push(nb[0],nb[1],nb[2]);
            this.geo.uvs.push(uv1[0],uv1[1]);
            this.geo.uvs.push(uv2[0],uv2[1]);
            this.geo.uvs.push(uv4[0],uv4[1]);

            this.geo.faces.push(f++);
            this.geo.vertices.push(v2[0],v2[1],v2[2]);
            this.geo.faces.push(f++);
            this.geo.vertices.push(v3[0],v3[1],v3[2]);
            this.geo.faces.push(f++);
            this.geo.vertices.push(v4[0],v4[1],v4[2]);
            this.geo.normals.push(na[0],na[1],na[2]);
            this.geo.normals.push(nb[0],nb[1],nb[2]);
            this.geo.normals.push(nb[0],nb[1],nb[2]);
            this.geo.uvs.push(uv2[0],uv2[1]);
            this.geo.uvs.push(uv3[0],uv3[1]);
            this.geo.uvs.push(uv4[0],uv4[1]);
        }

    }

    // top cap

    if ( open === false && this.tr > 0 ) {
        this.geo.vertices.push(0,0,1);

        for ( x = 0; x < rseg; x ++ ) {

            v1 = raw_verts[vertices[ hseg ][ x ]];
            v2 = raw_verts[vertices[ hseg ][ x + 1 ]];
            v3 = raw_verts[raw_verts.length - 1];


            uv1 = uvs[ hseg ][ x ];
            uv2 = uvs[ hseg ][ x + 1 ];

            this.geo.faces.push(f++);
            this.geo.vertices.push(v1[0],v1[1],v1[2]);
            this.geo.faces.push(f++);
            this.geo.vertices.push(v2[0],v2[1],v2[2]);
            this.geo.faces.push(f++);
            this.geo.vertices.push(v3[0],v3[1],v3[2]);
            this.geo.normals.push(0,0,1);
            this.geo.normals.push(0,0,1);
            this.geo.normals.push(0,0,1);
            this.geo.uvs.push(uv1[0],uv1[1]);
            this.geo.uvs.push(uv2[0],uv2[1]);
            this.geo.uvs.push(uv2[0],0);
        }

    }

    // bottom cap

    if ( open === false  ) {

        this.geo.vertices.push(0,0,0);

        for ( x = 0; x < rseg; x ++ ) {

            v1 = raw_verts[vertices[ 0 ][ x + 1 ]]
            v2 = raw_verts[vertices[ 0 ][ x ]];
            v3 = raw_verts[raw_verts.length - 1];

            uv1 = uvs[ 0 ][ x + 1 ];
            uv2 = uvs[ 0 ][ x ];

            this.geo.faces.push(f++);
            this.geo.vertices.push(v1[0],v1[1],v1[2]);
            this.geo.faces.push(f++);
            this.geo.vertices.push(v2[0],v2[1],v2[2]);
            this.geo.faces.push(f++);
            this.geo.vertices.push(v3[0],v3[1],v3[2]);
            this.geo.normals.push(0,0,-1);
            this.geo.normals.push(0,0,-1);
            this.geo.normals.push(0,0,-1);
            this.geo.uvs.push(uv1[0],uv1[1]);
            this.geo.uvs.push(uv2[0],uv2[1]);
            this.geo.uvs.push(uv2[0],0);
        }

    }

    this.renderMesh = new RenderMesh(this.geo);
}
