BoolObj = function()
{
    this.left = null;
    this.right = null;
    this.bbox = null;
    this.renderGL = false;
    this.canTrace = true;
    this.leftIdx = -1;
    this.rightIdx = -1;
}
BoolObj.prototype.constructor = BoolObj;
BoolObj.prototype.traceRay = function(ray,intersection)
{
}


UnionBoolObj = function()
{
    BoolObj.call(this);
}

UnionBoolObj.prototype = Object.create(BoolObj.prototype);
UnionBoolObj.prototype.constructor = UnionBoolObj;
UnionBoolObj.prototype.createBoundingBox = function()
{
    if(this.left!==null && this.right!==null)
    {
        this.bbox = new BBox(vec3.clone(this.left.bbox.vmin),vec3.clone(this.left.bbox.vmax));
        this.bbox.vmin[0] = Math.min(this.bbox.vmin[0],this.right.bbox.vmin[0]);
        this.bbox.vmax[0] = Math.max(this.bbox.vmax[0],this.right.bbox.vmax[0]);
        this.bbox.vmin[1] = Math.min(this.bbox.vmin[1],this.right.bbox.vmin[1]);
        this.bbox.vmax[1] = Math.max(this.bbox.vmax[1],this.right.bbox.vmax[1]);
        this.bbox.vmin[2] = Math.min(this.bbox.vmin[2],this.right.bbox.vmin[2]);
        this.bbox.vmax[2] = Math.max(this.bbox.vmax[2],this.right.bbox.vmax[2]);
    }
}
UnionBoolObj.prototype.checkRayHit = function(ray)
{
    if(this.left===null || this.right === null)
    {
        return false;
    }

    var left_hit = this.left.checkRayHit(ray);
    var l_t0 = ray.t0;
    var right_hit = this.right.checkRayHit(ray);
    var r_t0 = ray.t0;

    if(left_hit&&(!right_hit))
    {
        ray.setTime(l_t0);
        return true;
    }
    else if(right_hit&&(!left_hit))
    {
        ray.setTime(r_t0);
        return true;
    }
    else if(left_hit&&right_hit)
    {
        ray.setTime(Math.min(l_t0,r_t0));
        return true;
    }

    return false;

    //    if(this.left.checkRayHit(ray))
    //    {
    //        return true;
    //    }

    //    if(this.right.checkRayHit(ray))
    //    {
    //        return true;
    //    }

    ////    var rt = ray.t0;

    ////    ray.setTime(Math.min(lt,rt));

    //    return false;

    //    return true;
}

UnionBoolObj.prototype.traceRay = function(ray,intersection,objIdx)
{

    if(this.left===null || this.right === null)
    {
        return false;
    }


    var left_inter = new Intersection();
    var right_inter = new Intersection();


    var is_left_hit = this.left.traceRay(ray,left_inter,this.leftIdx);
    var is_right_hit = this.right.traceRay(ray,right_inter,this.rightIdx);
    if(is_left_hit &&(!is_right_hit))
    {
        intersection.clone(left_inter);
    }
    else if(is_right_hit && (!is_left_hit))
    {
        intersection.clone(right_inter);
    }
    else if(is_left_hit && is_right_hit)
    {
        this.combine(left_inter,right_inter,intersection);
    }

    //    if((!this.left.traceRay(ray,left_inter,this.leftIdx)))
    //    {
    //        return false;
    //    }

    //    if(!this.right.traceRay(ray,right_inter,this.rightIdx))
    //    {
    //        return false;
    //    }


    return Boolean(intersection.numHits>0);

}

//combine intersections: left-- left intersections right --- right sections
UnionBoolObj.prototype.combine = function(left,right,inter)
{
    var left_inside = !(left.hits[0].isEntering);
    var right_inside = !(right.hits[0].isEntering);
    var cur_comb_inside = false;

    var comb_inside = Boolean(left_inside || right_inside);

    var l = 0, r = 0;
    var next_hit;
    var sel_idx = -1;
    while((l<left.numHits) && (r<right.numHits))
    {
        if(left.hits[l].t<=right.hits[r].t)
        {

            next_hit = left.hits[l++];
            left_inside = !left_inside;
            cur_comb_inside = Boolean(left_inside||right_inside);
            sel_idx = next_hit.hit_obj_idx;

            if(cur_comb_inside!==comb_inside)
            {
                inter.hits.push(new RayHit());
                inter.hits[inter.hits.length-1].clone(next_hit);
                inter.hits[inter.hits.length-1].isEntering = cur_comb_inside;
                comb_inside = cur_comb_inside;
            }
        }
        else
        {
            next_hit = right.hits[r++];
            right_inside = !right_inside;
            cur_comb_inside = Boolean(left_inside||right_inside);
            sel_idx = next_hit.hit_obj_idx;

            if(cur_comb_inside!==comb_inside)
            {
                inter.hits.push(new RayHit());
                inter.hits[inter.hits.length-1].clone(next_hit);
                inter.hits[inter.hits.length-1].isEntering = cur_comb_inside;
                comb_inside = cur_comb_inside;
            }
        }
    }

    while(l<left.numHits)
    {
        next_hit = left.hits[l++];
        left_inside = !left_inside;
        sel_idx = next_hit.hit_obj_idx;
        inter.hits.push(new RayHit());
        inter.hits[inter.hits.length-1].clone(next_hit);
        inter.hits[inter.hits.length-1].isEntering = left_inside;
    }

    while(r<right.numHits)
    {
        next_hit = right.hits[r++];
        right_inside = !right_inside;
        sel_idx = next_hit.hit_obj_idx;
        inter.hits.push(new RayHit());
        inter.hits[inter.hits.length-1].clone(next_hit);
        inter.hits[inter.hits.length-1].isEntering = right_inside;
    }

    inter.numHits = inter.hits.length;
}

//Difference
DiffBoolObj = function()
{
    BoolObj.call(this);
}

DiffBoolObj.prototype = Object.create(BoolObj.prototype);
DiffBoolObj.prototype.constructor = DiffBoolObj;
DiffBoolObj.prototype.checkRayHit = function(ray)
{
    if(!this.left.checkRayHit(ray))
    {
        return false;
    }

    var l_t0 = ray.t0;
    if(!this.right.checkRayHit(ray))
    {
        ray.setTime(l_t0);
        return true;
    }

//    var r_t0 = ray.t0;

    var inter = new Intersection();

    var left_inter = new Intersection();
    var right_inter = new Intersection();

    this.left.traceRay(ray,left_inter,this.leftIdx);
    this.right.traceRay(ray,right_inter,this.rightIdx);

    this.combine(left_inter,right_inter,inter);
    if(inter.numHits>0)
    {
    ray.setTime(inter.hits[0].t);
    }

    return Boolean(inter.numHits>0);
}

DiffBoolObj.prototype.traceRay = function(ray,intersection,objIdx)
{
    var left_inter = new Intersection();
    var right_inter = new Intersection();

//    var is_left_hit = this.left.traceRay(ray.left_inter,this.leftIdx);
//    if(!is_left_hit)
//    {
//        return false;
//    }

    if(!this.left.traceRay(ray,left_inter,this.leftIdx))
    {
        return false;
    }

    if(!this.right.traceRay(ray,right_inter,this.rightIdx))
    {
        intersection.clone(left_inter);
        return true;
    }

    this.combine(left_inter,right_inter,intersection);
    return Boolean(intersection.numHits>0);
}

DiffBoolObj.prototype.combine = function(left,right,inter)
{
    var left_inside = !(left.hits[0].isEntering);
    var right_inside = !(right.hits[0].isEntering);
    var cur_comb_inside = false;

    var left_hit_idx = left.hits[0].hit_obj_idx;

    var comb_inside = Boolean(left_inside && (!right_inside));

    var l = 0, r = 0;
    var next_hit;
//    var sel_idx = -1;
    while((l<left.numHits) && (r<right.numHits))
    {
        if(left.hits[l].t<=right.hits[r].t)
        {
            next_hit = left.hits[l++];
            left_inside = !left_inside;
            cur_comb_inside = Boolean(left_inside&&(!right_inside));
            left_hit_idx = next_hit.hit_obj_idx;
            if(cur_comb_inside!==comb_inside)
            {
                inter.hits.push(new RayHit());
                inter.hits[inter.hits.length-1].clone(next_hit);
                inter.hits[inter.hits.length-1].isEntering = cur_comb_inside;
                comb_inside = cur_comb_inside;
            }
        }
        else
        {
            next_hit = right.hits[r++];
            right_inside = !right_inside;
            cur_comb_inside = Boolean(left_inside&(!right_inside));
            if(cur_comb_inside!==comb_inside)
            {
                inter.hits.push(new RayHit());
                inter.hits[inter.hits.length-1].clone(next_hit);
                inter.hits[inter.hits.length-1].isEntering = cur_comb_inside;
                comb_inside = cur_comb_inside;
                if(comb_inside)
                {
                    vec3.scale(inter.hits[inter.hits.length-1].hit_normal,inter.hits[inter.hits.length-1].hit_normal,-1.0);
//                    inter.hits[inter.hits.length-1].hit_obj_idx = left_hit_idx;
                }
            }
        }
    }

    while(l<left.numHits)
    {
        next_hit = left.hits[l++];
        left_inside = !left_inside;
        inter.hits.push(new RayHit());
        inter.hits[inter.hits.length-1].clone(next_hit);
        inter.hits[inter.hits.length-1].isEntering = left_inside;
    }

    inter.numHits = inter.hits.length;
}
