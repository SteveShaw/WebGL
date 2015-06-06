//torus is built with a,b.
Torus = function(center,rotation,a,b)
{
    this.canTrace = true;
    this.renderGL = true;
    this.a = a;
    this.b = b;
    this.center = vec3.clone(center);
    this.rotation = vec3.clone(rotation);
    this.bbox = new BBox(vec3.fromValues(-a-b,-b,-a-b),vec3.fromValues(a+b,b,a+b));


	
    //built transMat
    this.transMat = mat4.create();
    var m = mat4.create();
    mat4.translate(m,m,this.center);
    mat4.mul(this.transMat,this.transMat,m);

    mat4.identity(m);
	
    if(rotation[0]!=0)
    {
        mat4.rotateX(m,m,rotation[0]);
        mat4.mul(this.transMat,this.transMat,m);
        mat4.identity(m);
    }

    if(rotation[1]!=0)
    {
        mat4.rotateY(m,m,rotation[1]);
        mat4.mul(this.transMat,this.transMat,m);
        mat4.identity(m);
    }
    if(rotation[2]!=0)
    {
        mat4.rotateZ(m,m,rotation[2]);
        mat4.mul(this.transMat,this.transMat,m);
        mat4.identity(m);
    }

    this.transRayMat = mat4.create();
    mat4.invert(this.transRayMat,this.transMat);

    this.transNormalMat = mat4.create();
    mat4.transpose(this.transNormalMat,this.transRayMat);
}

Torus.prototype.constructor = Torus;
Torus.prototype.checkRayHit = function(ray,t) {
	
	var rayPos = vec3.clone(ray.pos);
    vec3.transformMat4(rayPos, rayPos, this.transRayMat);

    var dir4 = vec4.fromValues(ray.dir[0], ray.dir[1], ray.dir[2], 0);
    vec4.transformMat4(dir4, dir4, this.transRayMat);

    var rayDir = vec3.fromValues(dir4[0], dir4[1], dir4[2]);

    if(!this.bbox.checkRayHit(rayPos,rayDir))
    {
        return false;
    }
	
	var roots = [];

    // define the coefficients of the quartic equation

    var sum_d_sqrd 	= vec3.squaredLength(rayDir);
    var e = vec3.squaredLength(rayPos) - this.a*this.a - this.b*this.b;
    var f = vec3.dot(rayDir,rayPos);
    var four_a_sqrd	= 4.0 * this.a * this.a;

    var c0 = e * e - four_a_sqrd * (this.b * this.b - rayPos[1] * rayPos[1]); 	// constant term
    var c1 = 4.0 * f * e + 2.0 * four_a_sqrd * rayPos[1] * rayDir[1];
    var c2 = 2.0 * sum_d_sqrd * e + 4.0 * f * f + four_a_sqrd * rayDir[1] * rayDir[1];
    var c3 = 4.0 * sum_d_sqrd * f;
    var c4 = sum_d_sqrd * sum_d_sqrd;  					// coefficient of t^4

    // find roots of the quartic equation

    var num_real_roots = solveQuartic(c0,c1,c2,c3,c4, roots);

    if(num_real_roots === 0)
    {
        return false;
    }
	
	roots.sort(function(a,b){return a-b;});
	
	for (var j = 0;j<num_real_roots;++j)
	{
		if(roots[j]>1e-5)
		{
			ray.setTime(roots[j]);
			return true;
		}
		
	}
	
	
	return false;
}
//add a new parameter : objIdx == object index
Torus.prototype.traceRay = function(ray,intersection,objIdx)
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
	
    var roots = [];

    // define the coefficients of the quartic equation

    var sum_d_sqrd 	= vec3.squaredLength(rayDir);
    var e = vec3.squaredLength(rayPos) - this.a*this.a - this.b*this.b;
    var f = vec3.dot(rayDir,rayPos);
    var four_a_sqrd	= 4.0 * this.a * this.a;

    var c0 = e * e - four_a_sqrd * (this.b * this.b - rayPos[1] * rayPos[1]); 	// constant term
    var c1 = 4.0 * f * e + 2.0 * four_a_sqrd * rayPos[1] * rayDir[1];
    var c2 = 2.0 * sum_d_sqrd * e + 4.0 * f * f + four_a_sqrd * rayDir[1] * rayDir[1];
    var c3 = 4.0 * sum_d_sqrd * f;
    var c4 = sum_d_sqrd * sum_d_sqrd;  					// coefficient of t^4

    // find roots of the quartic equation

    var num_real_roots = solveQuartic(c0,c1,c2,c3,c4, roots);

    if(num_real_roots === 0)
    {
        return false;
    }

    roots.sort(function(a,b){return a-b;});


    var hit;
    var n = vec3.create();
    var isEntering = true;
    for (var j = 0;j<num_real_roots;++j)
    {
        if(roots[j]>1e-5)
        {
            intersection.hits.push(new RayHit());
            hit = intersection.hits[intersection.hits.length - 1];
            hit.t = roots[j];
            hit.hit_on_object = true;
            hit.local_hit_point = vec3.clone(rayPos);
            hit.isEntering = isEntering;
            isEntering = !isEntering;
//            if(j%2===0)
//            {
//                hit.isEntering = true;
//            }

            vec3.scaleAndAdd(hit.local_hit_point, hit.local_hit_point, rayDir, hit.t);
            hit.hit_obj_idx = objIdx;
            this.computeNormal(hit.local_hit_point,n);
            //copy object color
            //            vec3.copy(hit.ka,this.ka);
            //            vec3.copy(hit.kd,this.kd);
            //            vec3.copy(hit.ks,this.ks);
            vec4.set(dir4, n[0], n[1],n[2],0);
            vec4.transformMat4(dir4, dir4, this.transNormalMat);
            vec3.set(hit.hit_normal, dir4[0], dir4[1], dir4[2]);
            vec3.normalize(hit.hit_normal, hit.hit_normal);
            ++intersection.numHits;
        }
    }


    return Boolean(intersection.numHits>0);
}
Torus.prototype.computeNormal = function(p,n){

    var param_squared = this.a * this.a + this.b * this.b;
    var sum_squared = vec3.squaredLength(p);

    n[0] = 4.0 * p[0] * (sum_squared - param_squared);
    n[1] = 4.0 * p[1] * (sum_squared - param_squared + 2.0 * this.a * this.a);
    n[2] = 4.0 * p[2] * (sum_squared - param_squared);
    vec3.normalize(n,n);
}

Torus.prototype.genGeometry = function (radialSegments, tubularSegments, material){
	
	//build geo
	this.geo = new Geometry();
	var matte = new Material(material);
	vec3.copy(this.geo.ka, matte.ambient);
	vec3.copy(this.geo.kd, matte.diffuse);
	vec3.copy(this.geo.ks, matte.specular);
	this.geo.shn = matte.shiny;
	
	this.geo.ka_list.push(vec3.clone(matte.ambient));
	this.geo.kd_list.push(vec3.clone(matte.diffuse));
	this.geo.ks_list.push(vec3.clone(matte.specular));
	this.geo.shn_list.push(matte.shiny);
	
	var center = vec3.create();
	var vertex = vec3.create();
	var n = vec3.create();
	var uvs = [];
	// var normals = [];
	
	var i,j;
	var u,v;
	
	var arc = Math.PI*2.0;

	for ( j = 0; j <= radialSegments; j ++ ) {

		for ( i = 0; i <= tubularSegments; i ++ ) {

			u = i / tubularSegments * arc;
			v = j / radialSegments * Math.PI * 2;

			center[2] = this.a * Math.cos( u );
			center[0] = this.a * Math.sin( u );

			// var vertex = vec3.create();
			vertex[2] = ( this.a + this.b * Math.cos( v ) ) * Math.cos( u );
			vertex[0] = ( this.a + this.b * Math.cos( v ) ) * Math.sin( u );
			vertex[1] = this.b * Math.sin( v );

			this.geo.vertices.push(vertex[0],vertex[1],vertex[2]);
			// this.geo.vertices.push(( this.a + this.b * Math.cos( v ) ) * Math.cos( u ));
			// this.geo.vertices.push(( this.a + this.b * Math.cos( v ) ) * Math.sin( u ));
			// this.geo.vertices.push(this.b * Math.sin( v ));

			this.geo.uvs.push(i/tubularSegments);
			this.geo.uvs.push(j/radialSegments);
			// uvs.push( new THREE.Vector2( i / tubularSegments, j / radialSegments ) );
			vec3.sub(n,vertex,center);
			vec3.normalize(n,n);
			this.geo.normals.push(n[0],n[1],n[2]);
		}

	}

	var a,b,c,d;
	
	for ( j = 1; j <= radialSegments; j ++ ) {

		for ( i = 1; i <= tubularSegments; i ++ ) {

			a = ( tubularSegments + 1 ) * j + i - 1;
			b = ( tubularSegments + 1 ) * ( j - 1 ) + i - 1;
			c = ( tubularSegments + 1 ) * ( j - 1 ) + i;
			d = ( tubularSegments + 1 ) * j + i;
			
			this.geo.faces.push(a,b,d);
			this.geo.faces.push(b,c,d);
		}

	}
	
	this.renderMesh = new RenderMesh(this.geo);
}
