//This class is used to hold all information related to hit point

RayHit = function () {
    this.color = vec3.fromValues(1,1,1);//vec3.create(); //the texture color at hit point in solid texture
    this.t = 1e+10;
    this.local_hit_point = vec3.create();
    this.hit_on_object = false;
    this.hit_obj_idx = -1;	//the index of object it hits
    this.isEntering = false;
    this.hit_normal = vec3.create();
    this.hit_surface = -1;
}

RayHit.prototype.constructor = RayHit;
RayHit.prototype.clone = function(hit)
{
    vec3.copy(this.color,hit.color);
    this.t = hit.t;
    vec3.copy(this.local_hit_point,hit.local_hit_point);
    this.hit_on_object = hit.hit_on_object;
    this.hit_obj_idx = hit.hit_obj_idx;
    this.isEntering = hit.isEntering;
    this.hit_surface = hit.hit_surface;
    vec3.copy(this.hit_normal,hit.hit_normal);
	this.tex_idx = hit.tex_idx;
}

Intersection = function()
{
    this.hits = [];
    this.numHits = 0;
    this.hitPoint = vec3.create();
}
Intersection.prototype.constructor = Intersection;
Intersection.prototype.reset = function(inter)
{
    this.hits.length = 0;
    this.numHits = 0;
    this.hitPoint = vec3.create();
}
Intersection.prototype.clone = function(inter)
{
    this.hits.length = 0;
    for(var i = 0;i<inter.hits.length;++i)
    {
        this.hits.push(inter.hits[i]);
    }
    this.numHits = inter.numHits;
    vec3.copy(this.hitPoint,inter.hitPoint);
}
