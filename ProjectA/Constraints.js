const C_SPRING = 0;
const C_PIN = 1;

WallConstraint = function (N, L, M, center) {
	this.N = vec3.clone(N);
	vec3.normalize(this.N, this.N);
	this.sqL = vec3.squaredLength(L);
	this.sqM = vec3.squaredLength(M);

//    console.log(this.sqL);
//    console.log(this.sqM);

	this.L = vec3.clone(L);
	vec3.normalize(this.L, this.L);
	this.M = vec3.clone(M);
	vec3.normalize(this.M, this.M);

	this.transform = mat4.create();
	this.transform[0] = this.L[0];
	this.transform[1] = this.L[1];
	this.transform[2] = this.L[2];

	this.transform[4] = this.M[0];
	this.transform[5] = this.M[1];
	this.transform[6] = this.M[2];

	this.transform[8] = this.N[0];
	this.transform[9] = this.N[1];
	this.transform[10] = this.N[2];

    mat4.transpose(this.transform, this.transform);
    //transpose since mat4 is col based

	var m = mat4.create();
	mat4.translate(m, m, [-center[0], -center[1], -center[2]]);
    this.center = vec3.clone(center);
	mat4.mul(this.transform, this.transform, m);
//    mat4.transpose(this.transform,this.transform);

	this.trans_vel = vec3.create();

//	console.log(mat4.str(this.transform));

}

WallConstraint.prototype.constructor = WallConstraint;

WallConstraint.prototype.satisfy = function (curPos, oldPos, curVel) {

	//first transform the postion into wall coordinate
	var trans_cur_pos = vec4.fromValues(curPos[0], curPos[1], curPos[2], 1);
	var trans_old_pos = vec4.fromValues(oldPos[0], oldPos[1], oldPos[2], 1);

	vec4.transformMat4(trans_cur_pos, trans_cur_pos, this.transform);
	vec4.transformMat4(trans_old_pos, trans_old_pos, this.transform);


	if (trans_cur_pos[2] <= 0 && trans_old_pos[2] > 0) {
		//touch the plane
		if (trans_cur_pos[1] * trans_cur_pos[1] <= this.sqM && trans_cur_pos[0] * trans_cur_pos[0] <= this.sqL) {
			//hit the plane, need change velocity
			var dotVN = vec3.dot(curVel, this.N);
			if (dotVN < 0) {
				//only in this case, the bouncy happens
				vec3.scale(this.trans_vel, this.N, vec3.dot(curVel, this.N) * 2);
				vec3.sub(curVel, curVel, this.trans_vel);
			}
		}
	}


	//	if(pos[0]<this.min[0])
	//	{
	//		pos[0] = this.min[0];
	//	}
	//	else if(pos[0]>this.max[0])
	//	{
	//		pos[0] = this.max[0];
	//	}

	//	if (pos[1] < this.min[1]) {
	//		pos[1] = this.min[1];
	//	} else if (pos[1] > this.max[1]) {
	//		pos[1] = this.max[1];
	//	}
	//	if(pos[2]<this.min[2])
	//	{
	//		pos[2] = this.min[2];
	//	}
	//	else if(pos[2]>this.max[2])
	//	{
	//		pos[2] = this.max[2];
	//	}
}

SpringConstraint = function (pi0, pi1, rd) {
	this.pi0 = pi0; //index of p0;
	this.pi1 = pi1; //index of p1;
	this.rd = rd; //rest distance
	this.squareRD = rd * rd;
	this.type = C_SPRING;
}

SpringConstraint.prototype.constructor = SpringConstraint;
SpringConstraint.prototype.satisfy = function (p0, p1) {
	var delta = vec3.create();
	vec3.sub(delta, p1, p0);
	var cur_dist = vec3.distance(p1, p0);
	if (cur_dist === 0) {
		return delta;
	}

	vec3.scale(delta, delta, (1.0 - this.rd / cur_dist) * 0.5);
	//vec3.scale(delta,delta,0.5);

	return delta;

	//	vec3.add(p0,p0,delta);
	//	vec3.sub(p1,p1,delta);


	//	var delta = vec3.create();
	//	vec3.sub(delta,p1,p0);
	//	var scale = this.squareRD/(vec3.squaredLength(delta)+this.squareRD) - 0.5;
	//	vec3.scale(delta,delta,scale);
	//	
	//	console.log(scale);

	//	return delta;
}

PinConstraint = function (pi, pos) {
	this.pos = vec3.create();
	vec3.copy(this.pos, pos);
	this.pi = pi;
	this.type = C_PIN;
}

PinConstraint.prototype.constructor = PinConstraint;
PinConstraint.prototype.satisfy = function (p) {
	vec3.copy(p, this.pos);
}
