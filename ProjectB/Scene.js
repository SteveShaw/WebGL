function CookSpecular(N, L, V, R, F) {
		var H = vec3.create();
		vec3.add(H, L, V);
		vec3.normalize(H, H);
		var NdotH = vec3.dot(N, H);
		var VdotH = vec3.dot(V, H);
		var NdotL = vec3.dot(N, L);
		var NdotV = vec3.dot(N, V);

		var g = Math.min(1, 2 * NdotH * NdotV / VdotH);
		g = Math.min(g, 2 * NdotH * NdotL / VdotH);

		var R2 = R * R;
		var r = 1.0 / (R2 * Math.pow(NdotH, 4.0));
		r /= 4.0;
		var r_exp = (NdotH * NdotH - 1) / (R2 * NdotH * NdotH);
		r = r * Math.exp(r_exp);

		var f = Math.pow(1.0 - VdotH, 5.0);
		f *= (1 - F);
		f += F;

		var Rs = (f * r * g) / (Math.PI * NdotV * NdotL);

		return Rs;
	}
	//check whether to spawn a new transmitted ray
function TIR(N, V, ior) {
	var cos_theta_i = vec3.dot(N, V);
	var eta = ior;
	if (cos_theta_i < 0.0) {
		eta = 1.0 / ior;
	}

	var is_tir = 1.0 - cos_theta_i * cos_theta_i;
	is_tir /= (eta * eta);
	is_tir = 1 - is_tir;


	return is_tir;
}

//get transmitted ray direction
function getTransmittedRayDirection(outT, N, V, ior) {
	var eta = ior;
	var cos_theta_i = vec3.dot(N, V);
	var normal = vec3.clone(N);

	if (cos_theta_i < 0) {
		cos_theta_i *= -1.0;
		vec3.scale(normal, normal, -1.0);
		eta = 1.0 / ior;
	}

	var tir = 1.0 - cos_theta_i * cos_theta_i;
	tir /= (eta * eta);
	tir = 1 - tir;


	// var cos_theta_t = Math.sqrt(tir);
	var scale_factor = Math.sqrt(tir) - cos_theta_i / eta;
	vec3.scale(outT, V, -1.0 / eta);
	vec3.scaleAndAdd(outT, outT, normal, -1.0 * scale_factor);
	vec3.normalize(outT, outT);
}
Scene = function (gl) {
	//    this.meshObjs = [];
	this.objects = [];
	this.gl = gl;
	this.rayImage = null;
	this.rays = [];
	this.textures = {};
	this.mainCam = null;
	this.lights = [];
	this.ka = [1.0, 1.0, 1.0]; //environmental ambient color
	this.super_sampling = false;
	this.use_ct = false; //use cook torrence shading
	this.level = 3;
};
Scene.prototype = {

	constructor: Scene,

	addLight: function (light) {
		this.lights.push(light);
	},

    addObj: function (obj) {
        if (!(this.gl === undefined)) {
            if(obj.renderGL)
            {
                obj.renderMesh.createBuffers(this.gl);

            }
//                obj.renderMesh.createBuffers(this.gl);

        }
        this.objects.push(obj);
    },

	//the geometry objects contained in a obj will be the raw data of mesh object which are used to render
	//    addMesh:function(mesh){

	//        if(!(this.gl===undefined))  {
	//            mesh.createBuffers(this.gl);

	//        }
	//        this.meshObjs.push(mesh);
	//    },

	addTexture: function (index, img, clampToEdge, linear) {

		var texture = {};
		//        texture.fileName=name;
		texture.img = img;
		texture.index = index;
		texture.texture = this.gl.createTexture();
		
		var tex_width = this.rayImage.width;
	
		var tex_height = this.rayImage.width;

		this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, tex_width, tex_height,0, this.gl.RGB, this.gl.UNSIGNED_BYTE, img);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

		if (clampToEdge) {
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		}
		if (linear) {
			this.gl.generateMipmap(this.gl.TEXTURE_2D);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
		}
		this.gl.bindTexture(this.gl.TEXTURE_2D, null);
		this.textures[index] = texture;


	},
	
	addImageTexture: function (index, img, clampToEdge, linear) {
		
		var texture = {};
		//        texture.fileName=name;
		texture.img = img;
		texture.index = index;
		texture.texture = this.gl.createTexture();
		
		//this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

		if (clampToEdge) {
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		}
		if (linear) {
			this.gl.generateMipmap(this.gl.TEXTURE_2D);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
		}
		this.gl.bindTexture(this.gl.TEXTURE_2D, null);
		this.textures[index] = texture;
	},

	rebindTexture: function (index, img) {
		//var texture = this.textures[index].texture;
		//this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);
		//		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, this.rayImage.width, this.rayImage.height,
		//			0, this.gl.RGB, this.gl.UNSIGNED_BYTE, img);
		this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0,
			0, 0,
			this.rayImage.width, this.rayImage.height,
			this.gl.RGB, this.gl.UNSIGNED_BYTE, img);
	},

	createCamera: function (width, height, position) {
		var pos = vec3.fromValues(0, 10, 90);
		if (position !== undefined) {
			vec3.copy(pos, position);
		}

		this.mainCam = new PerspectiveCamera(pos, [0, 1, 0], 45, width / height, 3, 2000);
		this.mainCam.updateProjectionMatrix();
		this.mainCam.lookAt([0, 0, -50]);
		//		this.mainCam.updateMatrix();
	},
	updateCamera: function (width, height) {
		this.mainCam.aspect = width / height;
		this.mainCam.updateMatrix();
		this.mainCam.updateProjectionMatrix();
	},
	
	moveCamera: function(delta){
		vec3.add(this.mainCam.position,this.mainCam.position,delta);
		// var center = vec3.clone(this.mainCam.position);
		// vec3.add(center,center,this.mainCam.lookDir);
		//vec3.add(this.mainCam.lookPos,this.mainCam.lookPos,delta);
		// this.mainCam.lookAt(center);
	},

	isInShadow: function (hit, light) {
		var shadowRay = null;
		var dir;
		var ts = 1e+10;
		switch (light.type) {
		case LIGHT_DIRECTIONAL:
			shadowRay = new Ray(hit, light.invDir);
			break;
		case LIGHT_POINT:
			var dir = vec3.create();
			vec3.sub(dir, light.pos, hit);
			ts = vec3.length(dir);
			vec3.normalize(dir, dir);
			vec3.copy(light.invDir, dir);
			shadowRay = new Ray(hit, dir);
			break;

			//		case LIGHT_AREA:
			//			var dir = vec3.create();
			//			light.getSample(dir);
			//			vec3.sub(dir, dir, hit);
			//			vec3.normalize(dir, dir);
			//			// vec3.copy(light.invDir, dir);
			//			shadowRay = new Ray(hit, dir);
			//			break;
		}
		if (!light.isCastShadow) {
			return 0;
		}
		// if(light.type===LIGHT_DIRECTIONAL) //for directional light, the direction of the light is the ray direction
		// {
		// shadowRay = new Ray(hit,light.invDir);
		// }

		// if(shadowRay===null) return false;

		for (var i = 0; i < this.objects.length - 1; ++i) {
			if (!this.objects[i].canTrace) continue;
			if (this.objects[i].checkRayHit(shadowRay)) {
				if (shadowRay.t0 < ts) {
					return true;
				}
			}
		}

		return false;
	},
	
	shadingLight: function(light,best,color,mixColor,R,C,V,att){
		
			var LdotN = vec3.dot(light.invDir, best.hits[0].hit_normal);
			
			// var geo = this.objects[best.hits[0].hit_obj_idx].geo;
			// var tex_idx = best.hits[0].tex_idx;
			if (LdotN > 0) {
				
				vec3.multiply(mixColor, this.objects[best.hits[0].hit_obj_idx].geo.kd, light.kd);
				vec3.multiply(mixColor, best.hits[0].color,mixColor);
				// vec3.multiply(mixColor, geo.kd_list[tex_idx], light.kd);
				vec3.scaleAndAdd(color, color, mixColor, LdotN * light.w*att);
			}
			//calculate specular
			//N,L,V,R,F

			if (light.type === LIGHT_POINT) {
				if (!this.use_ct) {
					vec3.scale(C, best.hits[0].hit_normal, LdotN);
					vec3.scale(R, C, 2.0);
					vec3.sub(R, R, light.invDir);
					// vec3.sub(H, light.invDir, ray.dir);
					// vec3.normalize(H,H);
					// specular = vec3.dot(H,best.hits[0].hit_normal);
					specular = vec3.dot(R, V);
					if (specular > 0) {
						var phong = Math.pow(specular, this.objects[best.hits[0].hit_obj_idx].geo.shn);
						// var phong = Math.pow(specular, geo.shn_list[tex_idx]);
						vec3.multiply(mixColor, this.objects[best.hits[0].hit_obj_idx].geo.ks, light.ks);
						// vec3.multiply(mixColor, geo.ks_list[tex_idx], light.ks);
						vec3.scaleAndAdd(color, color, mixColor, phong * light.w*att);
					}
				} else {
					if (LdotN > 0) {
						var Roughness = this.objects[best.hits[0].hit_obj_idx].geo.Roughness;
						// var Roughness = geo.Roughness;
						var F = this.objects[best.hits[0].hit_obj_idx].geo.F0;
						// var F = geo.F0;
						specular = CookSpecular(best.hits[0].hit_normal, light.invDir, V, Roughness, F);
						vec3.multiply(mixColor, this.objects[best.hits[0].hit_obj_idx].geo.ks, light.ks);
						// vec3.multiply(mixColor, geo.ks_list[tex_idx], light.ks);
						vec3.scaleAndAdd(color, color, mixColor, specular * light.w * LdotN*att);
					}
				}
			}
	},

	traceRay: function (ray, best, color) {

		var idx = 0, l = 0, al_idx = -1;
		var geoObj;

		// var rayHit = new RayHit();
		var inter = new Intersection();
		//		var curHits = [];

		vec3.set(color, 0, 0, 0);

		for (idx = 0; idx < this.objects.length - 1; ++idx) {

			geoObj = this.objects[idx];

			if (!geoObj.canTrace) continue;
			// geoObj.traceRay(ray, rayHit);
			inter.reset();

			geoObj.traceRay(ray, inter, idx);

			if (inter.numHits > 0) {
				if (best.numHits === 0 || best.hits[0].t > inter.hits[0].t) {
					best.clone(inter);
					//best.hits[0].hit_obj_idx = idx;
				}
			}
		}


		if (best.numHits === 0) {
			//miss all objects
			return;
		}

		var light = null;
		

		
		vec3.scaleAndAdd(best.hitPoint, ray.pos, ray.dir, best.hits[0].t);

		var shadowRayStart = vec3.clone(best.hitPoint);
		vec3.scaleAndAdd(shadowRayStart, shadowRayStart, ray.dir, -0.0001); //move the hit point towards eye a little bit to avoid self shadow

		var diffuse = 0;
		var specular = 0;
		var H = vec3.create();
		var V = vec3.create();
		vec3.scale(V, ray.dir, -1.0);
		var C = vec3.create();
		var R = vec3.create();
		var mixColor = vec3.create();
		var dist = 0.0;
		var att = 0.0;

		for (idx = 0; idx < this.lights.length; ++idx) {
			light = this.lights[idx];

			if(light.w===0.0)
			{
				continue;
			}
			
			att = 1.0;
			
			if(light.type===LIGHT_POINT)
			{
				dist = vec3.distance(best.hitPoint,light.pos);
				att = 1/(light.k0+light.k1*dist+light.k2*dist*dist);
			}

			if (light.type !== LIGHT_AREA) {
				if (this.isInShadow(shadowRayStart, light)) {
					continue;
				}
				this.shadingLight(light,best,color,mixColor,R,C,V,att);
			}
			else{
				al_idx = idx;
			}
		}
		
		//process area light
		if(al_idx>0)
		{
			var num = this.lights[al_idx].sample_lights.length;
				for(l = 0;l<num;++l)
				{
					dist = vec3.distance(best.hitPoint,light.pos);
					att = 1/(light.k0+light.k1*dist+light.k2*dist*dist);
					light = this.lights[al_idx].sample_lights[l];
					if(this.isInShadow(shadowRayStart,light))
					{
						continue;
					}
					this.shadingLight(light,best,color,mixColor,R,C,V,att);
				}

		}

		// if(color[0]>1.0) color[0] = 1.0;
		// if(color[1]>1.0) color[1] = 1.0;
		// if(color[2]>1.0) color[2] = 1.0;

		if (ray.level < this.level) {
			if (this.objects[best.hits[0].hit_obj_idx].geo.reflectivity > 0.7) {
				var reflectColor = vec3.create();
				var bestNextLevel = new Intersection();
				vec3.copy(R, ray.dir);
				var dRN = vec3.dot(R, best.hits[0].hit_normal);
				vec3.scaleAndAdd(R, R, best.hits[0].hit_normal, -2.0 * dRN);
				var newRay = new Ray(shadowRayStart, R);
				newRay.level = ray.level + 1;

				this.traceRay(newRay, bestNextLevel, reflectColor);

				if (bestNextLevel.numHits > 0) {
					vec3.scaleAndAdd(color, color, reflectColor, 0.7);
				}

			}

			if (this.objects[best.hits[0].hit_obj_idx].geo.refraction > 0.5) {
				var ior = this.objects[best.hits[0].hit_obj_idx].geo.ior;

				if (TIR(best.hits[0].hit_normal, V, ior) > 0.0) {
					var dirT = vec3.create();
					getTransmittedRayDirection(dirT, best.hits[0].hit_normal, V, ior);
					var transmittedRayStart = vec3.clone(best.hitPoint);
					vec3.scaleAndAdd(transmittedRayStart, transmittedRayStart, ray.dir, 1e-4); //move the hit point inside the object
					var transmittedRay = new Ray(transmittedRayStart, dirT);
					transmittedRay.level = ray.level + 1;
					var refractColor = vec3.create();
					var bestRefract = new Intersection();
					this.traceRay(transmittedRay, bestRefract, refractColor);

					if (bestRefract.numHits > 0) {
						vec3.scaleAndAdd(color, color, refractColor, 0.7);
					}
				}

			}
		}

		if(ray.level===0)
		{
			vec3.multiply(mixColor, best.hits[0].color,this.objects[best.hits[0].hit_obj_idx].geo.ka);
			vec3.add(color, color, mixColor);//ka_list[best.hits[0].tex_idx]);
			// vec3.add(color, color, this.objects[best.hits[0].hit_obj_idx].geo.ka);//ka_list[best.hits[0].tex_idx]);
		}
		
		//vec3.mul(color,color,best.hits[0].color);
		
		if (color[0] > 1.0) color[0] = 1.0;
		if (color[1] > 1.0) color[1] = 1.0;
		if (color[2] > 1.0) color[2] = 1.0;
		
		
		

		// if (this.objects[best.hits[0].hit_obj_idx].geo.checker_texture) {
			// vec3.mul(color, color, best.hits[0].color);
		// }
		

	},

	makeRayImage: function () {

		var ray;
		var sampleColor;
		var color = vec3.create();

		var i, j, idx;
		var p, q;

		var best = new Intersection();


		var samples = this.super_sampling ? 4 : 1;
		var jitter = this.super_sampling;


		for (j = 0; j < scene.rayImage.height; j++) { // for the j-th row of pixels
			for (i = 0; i < scene.rayImage.width; i++) { // and the i-th pixel on that row,
				idx = (j * scene.rayImage.width + i) * 3; // pixel (i,j) array index (red)

				sampleColor = vec3.fromValues(0, 0, 0);

				for (p = 0; p < samples; ++p) {
					for (q = 0; q < samples; ++q) {
						//						rayHit.t = 1e+10;
						ray = scene.mainCam.makeRay(i,j, q, p, samples,scene.rayImage.width, scene.rayImage.height, jitter);

						best.reset();
						this.traceRay(ray, best, color);

						if (best.numHits > 0) {
							// vec3.add(sampleColor, sampleColor, best.hits[0].color);
							vec3.add(sampleColor, sampleColor, color);
						}

					}
				}

				vec3.scale(sampleColor, sampleColor, 1.0 / samples / samples);

				scene.rayImage.colors[idx] = sampleColor[0] * 255;
				scene.rayImage.colors[idx + 1] = sampleColor[1] * 255;
				scene.rayImage.colors[idx + 2] = sampleColor[2] * 255;

			}
		}
	}
}
