SimBase = function () {
	this.forces = [];
	this.constraints = new Array();
	this.solvers = {};
	this.curSel = 0;
	this.timeStep = 1.0 / 100;
	this.time = 0;

    this.solverKey = -1;
}

SimBase.prototype.constructor = SimBase;
SimBase.prototype.addForce = function (f) {
	this.forces.push(f);
}
SimBase.prototype.addConstraints = function (c) {
	this.constraints.push(c);
}
SimBase.prototype.setSolver = function (key, solver) {
    this.solvers[key] = solver;
}

SimBase.prototype.dotFinder = function () {}

SimBase.prototype.solver = function () {}

SimBase.prototype.applyContraints = function () {}
SimBase.prototype.swap = function () {}
SimBase.prototype.render = function (gl) {}
SimBase.prototype.update = function (gl, timeStep) {

	this.time = Date.now();

	this.timeStep = timeStep;

	this.render(gl);

	this.dotFinder();
	//

	this.solver();
	this.applyContraints();

	this.swap();
}


ClothSim = function (numX, numY, cont) {
	SimBase.prototype.constructor.call(this);
	//	this.cont = cont; //the container object
	//	this.numX = numX;
	//	this.numY = numY;

	this.num_particles_width = numX;
	this.num_particles_height = numY;

	this.totalPoints = this.num_particles_height * this.num_particles_width;
	this.size = 40;
	this.drag = 1.0 / 1000;
	this.hsize = this.size / 2;
	this.startOff = cont.nextOff; //the start offset in the vertex array in container;
	cont.nextOff += (this.totalPoints) * PART_MAXVAR;
	//	this.curStat = cont.meshes.curVert.subarray(this.startOff,this.startOff+(this.totalPoints)*PART_MAXVAR);
	//	this.nextStat = cont.meshes.nextVert.subarray(this.startOff,this.startOff+(this.totalPoints)*PART_MAXVAR);
	this.S_cur = cont.meshes.curVert.subarray(this.startOff, this.startOff + (this.totalPoints) * PART_MAXVAR);
	this.S_old = cont.meshes.oldVert.subarray(this.startOff, this.startOff + (this.totalPoints) * PART_MAXVAR);
	this.faces = null;
	this.dt = 18.0 / 1000;
	this.ddt = this.dt * this.dt;
	this.useVerlert = false;
	this.startDotOff = cont.nextDotOff;
	cont.nextDotOff += this.totalPoints * DOT_PART_TOTAL;
	this.dotStat = cont.dotStat.subarray(this.startDotOff, this.startDotOff + (this.totalPoints) * DOT_PART_TOTAL);
	this.tempStat = new Float32Array(PART_TEMP_TOTAL);

	this.name = 'cloth';
	//	this.S_cur = this.curStat;
	//	this.S_old = this.nextStat;
	//	this.statArray = new Array();
	//	this.statArray.push(this.curStat);
	//	this.statArray.push(this.nextStat);

	//	this.cont = cont;
	//	this.S_cur = null;
	//	this.S_old = null;
}

ClothSim.prototype = Object.create(SimBase.prototype);
ClothSim.prototype.constructor = ClothSim;

ClothSim.prototype.initCloth = function()
{
    var x,y;

    var pos,oldPos,clr,oldClr;
    var vel,oldVel;
    var width = this.size;
    var height = this.size;

    var mass = 0.5;
    var diam = 5;
    var zoffset = 20;
    var xoffset = 20;
    for (x = 0; x < this.num_particles_width; x++) {
        for (y = 0; y < this.num_particles_height; y++) {
            index = y * this.num_particles_height + x;
            pos = this.S_cur.subarray(index * PART_MAXVAR + PART_XPOS, index * PART_MAXVAR + PART_XPOS + 3);
            vec3.copy(pos, [width * (x / this.num_particles_width) + xoffset, -height * (y / this.num_particles_height) + height, zoffset]);
            oldPos = this.S_old.subarray(index * PART_MAXVAR + PART_XPOS, index * PART_MAXVAR + PART_XPOS + 3);
            vec3.copy(oldPos, pos);

            //set velocity
            vel = this.S_cur.subarray(index * PART_MAXVAR + PART_XVEL, index * PART_MAXVAR + PART_XVEL + 3);
            vec3.copy(vel, [0, 0, 0]);
            oldVel = this.S_old.subarray(index * PART_MAXVAR + PART_XVEL, index * PART_MAXVAR + PART_XVEL + 3);
            vec3.copy(oldVel, vel);


            //set color
            clr = this.S_cur.subarray(index * PART_MAXVAR + PART_R, index * PART_MAXVAR + PART_R + 4);
            vec4.copy(clr, [1, 1, Math.random(), 1]);
            oldClr = this.S_old.subarray(index * PART_MAXVAR + PART_R, index * PART_MAXVAR + PART_R + 4);
            vec4.copy(oldClr, clr);

            //set mass
            this.S_cur[index * PART_MAXVAR + PART_MASS] = mass;
            this.S_old[index * PART_MAXVAR + PART_MASS] = mass;

            //set diameter
            this.S_cur[index * PART_MAXVAR + PART_DIAM] = diam;
            this.S_old[index * PART_MAXVAR + PART_DIAM] = diam;

            this.S_cur[index * PART_MAXVAR + PART_MOVEABLE] = 1;
        }
    }

    var u = this.num_particles_width;
    var v = this.num_particles_height;

    for (x = 0; x < 3; ++x) {
        this.S_cur[x * PART_MAXVAR + PART_MOVEABLE] = 0;
        this.S_cur[(u - 1 - x) * PART_MAXVAR + PART_MOVEABLE] = 0;
    }

}


ClothSim.prototype.initSim = function () {
	//	this.S_cur = this.statArray[0];
	//	this.S_old = this.statArray[1];


        this.useVerlert = true;

	//	if (!this.useVerlert) {
	//		this.dt = 1.0 / 1000;
	//		this.ddt = this.dt * this.dt;
	//	} else {
	//		this.dt = 18.0 / 1000;
	//		this.ddt = this.dt * this.dt;
	//	}
    var x,y;
	//	var yoffset = 0;
	//set particle position
    this.initCloth();

//	for (x = 0; x < this.num_particles_width; x++) {
//		for (y = 0; y < this.num_particles_height; y++) {
//			index = y * this.num_particles_height + x;
//			pos = this.S_cur.subarray(index * PART_MAXVAR + PART_XPOS, index * PART_MAXVAR + PART_XPOS + 3);
//			vec3.copy(pos, [width * (x / this.num_particles_width) + xoffset, -height * (y / this.num_particles_height) + height, zoffset]);
//			oldPos = this.S_old.subarray(index * PART_MAXVAR + PART_XPOS, index * PART_MAXVAR + PART_XPOS + 3);
//			vec3.copy(oldPos, pos);

//			//set velocity
//			vel = this.S_cur.subarray(index * PART_MAXVAR + PART_XVEL, index * PART_MAXVAR + PART_XVEL + 3);
//			vec3.copy(vel, [0, 0, 0]);
//			oldVel = this.S_old.subarray(index * PART_MAXVAR + PART_XVEL, index * PART_MAXVAR + PART_XVEL + 3);
//			vec3.copy(oldVel, vel);


//			//set color
//			clr = this.S_cur.subarray(index * PART_MAXVAR + PART_R, index * PART_MAXVAR + PART_R + 4);
//			vec4.copy(clr, [1, 1, Math.random(), 1]);
//			oldClr = this.S_old.subarray(index * PART_MAXVAR + PART_R, index * PART_MAXVAR + PART_R + 4);
//			vec4.copy(oldClr, clr);

//			//set mass
//			this.S_cur[index * PART_MAXVAR + PART_MASS] = mass;
//			this.S_old[index * PART_MAXVAR + PART_MASS] = mass;

//			//set diameter
//			this.S_cur[index * PART_MAXVAR + PART_DIAM] = diam;
//			this.S_old[index * PART_MAXVAR + PART_DIAM] = diam;

//			this.S_cur[index * PART_MAXVAR + PART_MOVEABLE] = 1;
//		}
//	}


	// Connecting immediate neighbor particles with constraints (distance 1 and sqrt(2) in the grid)
	var pi0, pi1;

	var u = this.num_particles_width;
	var v = this.num_particles_height;

	for (x = 0; x < 3; ++x) {
		this.S_cur[x * PART_MAXVAR + PART_MOVEABLE] = 0;
		this.S_cur[(u - 1 - x) * PART_MAXVAR + PART_MOVEABLE] = 0;
		pos = this.S_cur.subarray(x * PART_MAXVAR + PART_XPOS, x * PART_MAXVAR + PART_XPOS + 3);
		this.constraints.push(new PinConstraint(x, pos));
		pos = this.S_cur.subarray((u - 1 - x) * PART_MAXVAR + PART_XPOS, (u - 1 - x) * PART_MAXVAR + PART_XPOS + 3);
		this.constraints.push(new PinConstraint((u - 1 - x), pos));
	}


	getParticle = function (x, y, width) {
		return y * width + x;
	}


	for (x = 0; x < u; x++) {
		for (y = 0; y < v; y++) {
			if (x < u - 1) {

				pi0 = getParticle(x, y, u);
				pi1 = getParticle(x + 1, y, u);
				//				console.log(pi0+','+pi1);
				this.forces.push(new SpringForce(pi0, pi1, 0.5, -0.1));

			}

			if (y < v - 1) //makeConstraint(getParticle(x,y),getParticle(x,y+1));
			{
				pi0 = getParticle(x, y, u);
				pi1 = getParticle(x, y + 1, u);
				this.forces.push(new SpringForce(pi0, pi1, 0.5, -0.1));
			}

			if (x < u - 1 && y < v - 1) //makeConstraint(getParticle(x,y),getParticle(x+1,y+1));
			{
				pi0 = getParticle(x, y, u);
				pi1 = getParticle(x + 1, y + 1, u);
				this.forces.push(new SpringForce(pi0, pi1, 0.5, -0.1));
			}

			if (x < u - 1 && y < v - 1) //makeConstraint(getParticle(x+1,y),getParticle(x,y+1));
			{
				pi0 = getParticle(x + 1, y, u);
				pi1 = getParticle(x, y + 1, u);
				this.forces.push(new SpringForce(pi0, pi1, 0.5, -0.1));
			}
		}
	}


	// Connecting secondary neighbors with constraints (distance 2 and sqrt(4) in the grid)
	//	for (x = 0; x < u; x++) {
	//		for (y = 0; y < v; y++) {
	//			if (x < u - 2) //makeConstraint(getParticle(x,y),getParticle(x+2,y));
	//			{
	//				pi0 = getParticle(x, y, u);
	//				pi1 = getParticle(x + 2, y, u);
	//				console.log(pi0+','+pi1);
	//				this.forces.push(new SpringForce(pi0, pi1, 1, -0.1));
	//			}
	//
	//			if (y < v - 2) //makeConstraint(getParticle(x,y),getParticle(x,y+2));
	//			{
	//				pi0 = getParticle(x, y, u);
	//				pi1 = getParticle(x, y + 2, u);
	//				console.log(pi0+','+pi1);
	//				this.forces.push(new SpringForce(pi0, pi1, 1, -0.1));
	//			}
	//
	//			if (x < u - 2 && y < v - 2) //makeConstraint(getParticle(x,y),getParticle(x+2,y+2));
	//			{
	//				pi0 = getParticle(x, y, u);
	//				pi1 = getParticle(x + 2, y + 2, u);
	//				console.log(pi0+','+pi1);
	//				this.forces.push(new SpringForce(pi0, pi1, 1, -0.1));
	//			}
	//
	//			if (x < u - 2 && y < v - 2) //makeConstraint(getParticle(x+2,y),getParticle(x,y+2));			}
	//			{
	//				pi0 = getParticle(x + 2, y, u);
	//				pi1 = getParticle(x, y + 2, u);
	//				console.log(pi0+','+pi1);
	//				this.forces.push(new SpringForce(pi0, pi1, 1, -0.1));
	//			}
	//		}
	//	}

	this.rawFaces = new Array();
	var a, b, c, d;

	//		for ( i = 0; i < stacks; i ++ ) {
	//
	//		for ( j = 0; j < slices; j ++ ) {
	//
	//			a = i * sliceCount + j;
	//			b = i * sliceCount + j + 1;
	//			c = (i + 1) * sliceCount + j + 1;
	//			d = (i + 1) * sliceCount + j;

	for (x = 0; x < u - 1; x++) {
		for (y = 0; y < v - 1; y++) {

			a = x * v + y;
			b = x * v + y + 1;
			c = (x + 1) * v + y + 1;
			d = (x + 1) * v + y;

			this.rawFaces.push(a, b, d);
			this.rawFaces.push(b, c, d);
			//			var i0 = y * u + v;
			//			var i1 = i0 + 1;
			//			var i2 = i0 + v;
			//			var i3 = i2 + 1;

			//			if ((y + 1) % 2) {
			//				faces.push(i0, i2, i1);
			//				faces.push(i1, i2, i3);
			//			} else {
			//				faces.push(i0, i2, i3);
			//				faces.push(i0, i3, i1);
			//			}
		}
	}


	this.faces = new Uint16Array(this.rawFaces);
	this.forces.push(new GravityForce(vec3.fromValues(0, -1, 0), 9.81, 0.125)); //1.0/80));

	var p0, p1;

	for (x = 0; x < this.forces.length; ++x) {
		if (this.forces[x].type === F_SPRING) {
			var off_p0 = this.forces[x].pi0 * PART_MAXVAR + PART_XPOS;
			var off_p1 = this.forces[x].pi1 * PART_MAXVAR + PART_XPOS;
			p0 = this.S_cur.subarray(off_p0, off_p0 + 3);
			p1 = this.S_cur.subarray(off_p1, off_p1 + 3);
			this.forces[x].calcRest(p0, p1);
			this.constraints.push(new SpringConstraint(this.forces[x].pi0, this.forces[x].pi1, this.forces[x].rest_dist));
		}

	}

	this.forces.push(new WindForce());

}




ClothSim.prototype.applyGeneralForce = function (f) {
	var i, offset, F;
	for (i = 0; i < this.totalPoints; ++i) {
		offset = i * PART_MAXVAR;
		F = this.S_cur.subarray(offset + PART_X_FTOT, offset + PART_X_FTOT + 3);
		vec3.scaleAndAdd(F, F, f.force, this.S_cur[offset + PART_MASS]);
	}
}

ClothSim.prototype.applyWindForce = function (f) {
	var num = this.faces.length / 3;
	var i;

	var p0, p1, p2, n;
	var f0, f1, f2;
	var d = vec3.create();
	var F0, F1, F2;

	for (i = 0; i < num; ++i) {

		f0 = this.rawFaces[i * 3];
		f1 = this.rawFaces[i * 3 + 1];
		f2 = this.rawFaces[i * 3 + 2];

		p0 = this.S_cur.subarray(f0 * PART_MAXVAR + PART_XPOS, f0 * PART_MAXVAR + PART_XPOS + 3);
		p1 = this.S_cur.subarray(f1 * PART_MAXVAR + PART_XPOS, f1 * PART_MAXVAR + PART_XPOS + 3);
		p2 = this.S_cur.subarray(f2 * PART_MAXVAR + PART_XPOS, f2 * PART_MAXVAR + PART_XPOS + 3);

		n = calcTriangleNormal(p0, p1, p2);
		//		console.log(n);
		vec3.normalize(d, n);
		vec3.scale(n, n, vec3.dot(d, f.force));


		F0 = this.S_cur.subarray(i * 3 * PART_MAXVAR + PART_X_FTOT, i * 3 * PART_MAXVAR + PART_X_FTOT + 3);
		F1 = this.S_cur.subarray((i * 3 + 1) * PART_MAXVAR + PART_X_FTOT, (i * 3 + 1) * PART_MAXVAR + PART_X_FTOT + 3);
		F2 = this.S_cur.subarray((i * 3 + 2) * PART_MAXVAR + PART_X_FTOT, (i * 3 + 2) * PART_MAXVAR + PART_X_FTOT + 3);

		vec3.add(F0, F0, n);
		vec3.add(F1, F1, n);
		vec3.add(F2, F2, n);
	}
}

ClothSim.prototype.applySpringForce = function (f) {

	var p0 = this.S_cur.subarray(f.pi0 * PART_MAXVAR + PART_XPOS, f.pi0 * PART_MAXVAR + PART_XPOS + 3);
	var p1 = this.S_cur.subarray(f.pi1 * PART_MAXVAR + PART_XPOS, f.pi1 * PART_MAXVAR + PART_XPOS + 3);
	var v0 = this.S_cur.subarray(f.pi0 * PART_MAXVAR + PART_XVEL, f.pi0 * PART_MAXVAR + PART_XVEL + 3);
	var v1 = this.S_cur.subarray(f.pi1 * PART_MAXVAR + PART_XVEL, f.pi1 * PART_MAXVAR + PART_XVEL + 3);

	var curLen = vec3.distance(p0, p1);

	var deltaP = this.tempStat.subarray(PART_TEMP_X0, PART_TEMP_X0 + 3);
	vec3.sub(deltaP, p0, p1);
	var deltaV = this.tempStat.subarray(PART_TEMP_X1, PART_TEMP_X1 + 3);
	vec3.sub(deltaV, v0, v1);

	if (this.useVerlert) {
		var curPos = this.S_cur.subarray(f.pi0 * PART_MAXVAR + PART_XPOS, f.pi0 * PART_MAXVAR + PART_XPOS + 3);
		var oldPos = this.S_old.subarray(f.pi0 * PART_MAXVAR + PART_XPOS, f.pi0 * PART_MAXVAR + PART_XPOS + 3);

		var deltaV0 = vec3.sub(vec3.create(), curPos, oldPos);
		vec3.scale(deltaV0, deltaV0, 1.0 / this.dt);

		curPos = this.S_cur.subarray(f.pi1 * PART_MAXVAR + PART_XPOS, f.pi1 * PART_MAXVAR + PART_XPOS + 3);
		oldPos = this.S_old.subarray(f.pi1 * PART_MAXVAR + PART_XPOS, f.pi1 * PART_MAXVAR + PART_XPOS + 3);

		var deltaV1 = vec3.sub(vec3.create(), curPos, oldPos);
		vec3.scale(deltaV1, deltaV1, 1.0 / this.dt);

		vec3.sub(deltaV, deltaV0, deltaV1);
	}


	var leftTerm = -f.k * (curLen - f.rest_dist);
	var rightTerm = f.damp * ((vec3.dot(deltaV, deltaP)) / curLen);
	//	var rightTerm = 0;
	vec3.normalize(deltaP, deltaP);
	vec3.scale(deltaP, deltaP, leftTerm + rightTerm);

	var Fi0 = this.S_cur.subarray(f.pi0 * PART_MAXVAR + PART_X_FTOT, f.pi0 * PART_MAXVAR + PART_X_FTOT + 3);
	vec3.add(Fi0, Fi0, deltaP);

	var Fi1 = this.S_cur.subarray(f.pi1 * PART_MAXVAR + PART_X_FTOT, f.pi1 * PART_MAXVAR + PART_X_FTOT + 3);
	vec3.sub(Fi1, Fi1, deltaP);

}

ClothSim.prototype.resetForce = function () {
	var F;
	var zeroV = vec3.fromValues(0, 0, 0);
	for (var i = 0; i < this.totalPoints; ++i) {
		F = this.S_cur.subarray(i * PART_MAXVAR + PART_X_FTOT, i * PART_MAXVAR + PART_X_FTOT + 3);
		vec3.copy(F, zeroV);
	}
}

ClothSim.prototype.dotFinder = function () {

	this.resetForce();

	for (var i = 0; i < this.forces.length; ++i) {
		var f = this.forces[i];
		switch (f.type) {
		case F_GRAV_E:
			//				f.update(this.dt);
			this.applyGeneralForce(f);
			break;
		case F_SPRING:
			this.applySpringForce(f);
			break;
		case F_WIND:
			this.forces[i].update(this.time);
			this.applyWindForce(this.forces[i]);
			break;
		default:
			break;
		}
	}
	//set dotStat variable
	var offset, dotOff;
	var acc, F;
	var curPos, oldPos, deltaV, dragV = vec3.create(),
		zeroV = vec3.create();

	for (i = 0; i < this.totalPoints; ++i) {
		offset = i * PART_MAXVAR;
		dotOff = i * DOT_PART_TOTAL;
		//set acceleration
		acc = this.dotStat.subarray(dotOff + DOT_PART_XVEL, dotOff + DOT_PART_XVEL + 3);
		F = this.S_cur.subarray(offset + PART_X_FTOT, offset + PART_X_FTOT + 3);

		vec3.copy(acc, zeroV);

		if (this.S_cur[offset + PART_MOVEABLE] < 1) continue;

		vec3.scale(acc, F, 1.0 / this.S_cur[offset + PART_MASS]);


		if (this.useVerlert) {
			//we use curPos and lastPos to get velocity
			curPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
			oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
			deltaV = getVerletVelocity(curPos, oldPos, this.dt);
		} else {
			deltaV = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
		}
		vec3.normalize(dragV, deltaV);
		vec3.scale(dragV, dragV, this.drag * vec3.squaredLength(deltaV));
		vec3.scale(dragV, dragV, 1.0 / this.S_cur[PART_MASS]);
		vec3.sub(acc, acc, dragV);

		//		if (this.S_cur[offset + PART_MOVEABLE] === 1) {
		//			vec3.scale(acc, F, 1.0 / this.S_cur[offset + PART_MASS]);
		//		}
		//        this.dotStat[dotOff+DOT_PART_XVEL] = this.S_cur[offset+PART_X_FTOT]*1.0/this.S_cur[offset+PART_MASS];
		//        this.dotStat[dotOff+DOT_PART_YVEL] = this.S_cur[offset+PART_Y_FTOT]*1.0/this.S_cur[offset+PART_MASS];
		//        this.dotStat[dotOff+DOT_PART_ZVEL] = this.S_cur[offset+PART_Z_FTOT]*1.0/this.S_cur[offset+PART_MASS];
	}

}


ClothSim.prototype.solver = function () {


//	var temp0 = this.tempStat.subarray(PART_TEMP_X0, PART_TEMP_X0 + 3);
//	var temp1 = this.tempStat.subarray(PART_TEMP_X1, PART_TEMP_X1 + 3);

//	var offset = 0;
//	var dotOff = 0;
//	var curPos, oldPos, acc;
//	var curVel, oldVel
//	var i = 0;

//	if (this.useVerlert) {
//        this.solvers[3].solve(this.totalPoints, this.S_cur, this.S_old, this.dotStat, this.dt);
//	} else {
//        this.solvers[2].solve(this.totalPoints, this.S_cur, this.S_old, this.dotStat, this.dt);
//	}
        this.solvers[this.solverKey].solve(this.totalPoints, this.S_cur, this.S_old, this.dotStat, this.dt);
}

//ClothSim.prototype.solver = function(){
//	//verlet solver
//	for(var i = 0;i<this.totalPoints;++i)
//	{
//		
//	}
//	//implicit euler
//	
//	for(var i = 0;i<this.totalPoints;++i)
//	{
//		var offset = i*PART_MAXVAR;
//		var dotOff = i*DOT_PART_TOTAL;
//		//update vel
//		this.S_old[offset+PART_XVEL] = this.S_cur[offset+PART_XVEL] + this.dotStat[dotOff+DOT_PART_XVEL]*this.dt;
//		this.S_old[offset+PART_YVEL] = this.S_cur[offset+PART_YVEL] + this.dotStat[dotOff+DOT_PART_YVEL]*this.dt;
//		this.S_old[offset+PART_ZVEL] = this.S_cur[offset+PART_ZVEL] + this.dotStat[dotOff+DOT_PART_ZVEL]*this.dt;
//		//update pos
//		this.S_old[offset+PART_XPOS] = this.S_cur[offset+PART_XPOS] + this.S_cur[offset+PART_XVEL]*this.dt;
//		this.S_old[offset+PART_YPOS] = this.S_cur[offset+PART_YPOS] + this.S_cur[offset+PART_YVEL]*this.dt;
//		this.S_old[offset+PART_ZPOS] = this.S_cur[offset+PART_ZPOS] + this.S_cur[offset+PART_ZVEL]*this.dt;
//		
//		if(this.S_old[offset+PART_YPOS]<0)
//		{
//			this.S_old[offset+PART_YPOS] = 0;
//		}
//		
//		this.S_old[offset+PART_MASS] = this.S_cur[offset+PART_MASS];
//		this.S_old[offset+PART_DIAM] = this.S_cur[offset+PART_DIAM];
//		
//		
//		this.S_old[offset+PART_R] = this.S_cur[offset+PART_R];
//		this.S_old[offset+PART_G] = this.S_cur[offset+PART_G];
//		this.S_old[offset+PART_B] = this.S_cur[offset+PART_B];
//	}
//}

ClothSim.prototype.swap = function () {

}

ClothSim.prototype.applyContraints = function () {

	var i, c;
	var p0, p1;

	for (i = 0; i < this.constraints.length; ++i) {
		c = this.constraints[i];
		switch (c.type) {
		case C_SPRING:
			p0 = this.S_cur.subarray(c.pi0 * PART_MAXVAR + PART_XPOS, c.pi0 * PART_MAXVAR + PART_XPOS + 3);
			p1 = this.S_cur.subarray(c.pi1 * PART_MAXVAR + PART_XPOS, c.pi1 * PART_MAXVAR + PART_XPOS + 3);

			var delta = c.satisfy(p0, p1);

			if (this.S_cur[c.pi0 * PART_MAXVAR + PART_MOVEABLE] < 1) {
				vec3.sub(p1, p1, delta);
			} else if (this.S_cur[c.pi1 * PART_MAXVAR + PART_MOVEABLE] < 1) {
				vec3.add(p0, p0, delta);
			} else {
				vec3.add(p0, p0, delta);
				vec3.sub(p1, p1, delta);
			}


			break;
		}
	}

	this.ballConstraints();

	//	for (i = 0; i < this.constraints.length; ++i) {
	//		c = this.constraints[i];
	//		switch (c.type) {
	//		case C_PIN:
	//			p0 = this.S_cur.subarray(c.pi * PART_MAXVAR + PART_XPOS, c.pi * PART_MAXVAR + PART_XPOS + 3);
	//			c.satisfy(p0);
	//			break;
	//		}
	//	}

	//	console.log('end applyconstraint');

}


ClothSim.prototype.setContact = function (center, radius) {
	this.ballCenter = vec3.clone(center);
	this.radius = radius;
}

ClothSim.prototype.ballConstraints = function () {

	var squareR = this.radius * this.radius;
	var i, vel, len, offset, pos, delta = vec3.create();
	var zeroV = [0, 0, 0];
	for (i = 0; i < this.totalPoints; ++i) {
		offset = i * PART_MAXVAR;
		pos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
		vel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
		vec3.sub(delta, pos, this.ballCenter);

		len = vec3.length(delta);

		if (vec3.squaredLength(delta) < squareR) {
			vec3.normalize(delta, delta);
			vec3.scale(delta, delta, (this.radius - len));
			vec3.add(pos, pos, delta);

			vec3.copy(vel, zeroV);
		}

	}
}

ClothSim.prototype.contactBall = function (ballCenter, radius) {
	var m = mat4.create();
	mat4.translate(m, m, ballCenter);
	mat4.scale(m, m, [radius, radius, radius]);
	var invM = mat4.create();
	mat4.invert(invM, m);

	var center = [0, 0, 0];
	var curPos, curVel, offset;
	var transPos = [0, 0, 0, 1];
	var delta = [0, 0, 0];
	var posOff = [0, 0, 0];
	var invV = vec3.create();
	for (var i = 0; i < this.totalPoints; ++i) {
		offset = i * PART_MAXVAR;
		//transform into the coordinate inside a unit sphere
		curPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
		curVel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);

		transPos[0] = curPos[0];
		transPos[1] = curPos[1];
		transPos[2] = curPos[2];

		vec4.transformMat4(transPos, transPos, invM);
		vec3.sub(delta, transPos.slice(0, 3), center);
		var dist = vec3.length(delta)
		if (dist < 1.0) {
			vec3.scale(delta, delta, (radius - dist) / dist);
			vec3.copy(invV, [m[0], m[1], m[2]]);
			vec3.scale(invV, invV, 1.0 / vec3.dot(invV, invV));
			posOff[0] = vec3.dot(delta, invV);


			vec3.copy(invV, [m[4], m[5], m[6]]);
			vec3.scale(invV, invV, 1.0 / vec3.dot(invV, invV));
			posOff[1] = vec3.dot(delta, invV);

			vec3.copy(invV, [m[8], m[9], m[10]]);
			vec3.scale(invV, invV, 1.0 / vec3.dot(invV, invV));
			posOff[2] = vec3.dot(delta, invV);

			//change the position since it has been contact with the ball
			vec3.add(curPos, curPos, posOff);
			vec3.copy(curVel, center); //make it stall
		}



		//				float distance = glm::length(delta0);
		//		if (distance < 1.0f) {
		//			delta0 = (radius - distance) * delta0 / distance;
		//
		//			// Transform the delta back to original space
		//			glm::vec3 delta;
		//			glm::vec3 transformInv;
		//			transformInv = glm::vec3(ellipsoid[0].x, ellipsoid[1].x, ellipsoid[2].x);
		//			transformInv /= glm::dot(transformInv, transformInv);
		//			delta.x = glm::dot(delta0, transformInv);
		//			transformInv = glm::vec3(ellipsoid[0].y, ellipsoid[1].y, ellipsoid[2].y);
		//			transformInv /= glm::dot(transformInv, transformInv);
		//			delta.y = glm::dot(delta0, transformInv);
		//			transformInv = glm::vec3(ellipsoid[0].z, ellipsoid[1].z, ellipsoid[2].z);
		//			transformInv /= glm::dot(transformInv, transformInv);
		//			delta.z = glm::dot(delta0, transformInv);
		//			X[i] +=  delta ;
		//			V[i] = glm::vec3(0);
	}
}
