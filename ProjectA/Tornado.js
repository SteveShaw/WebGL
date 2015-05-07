Tornado = function (num, cont) {
	SimBase.prototype.constructor.call(this);

	this.totalPoints = num;

	this.startOff = cont.nextOff; //the start offset in the vertex array in container;
	cont.nextOff += (this.totalPoints) * PART_MAXVAR;

	this.S_cur = cont.meshes.curVert.subarray(this.startOff, this.startOff + (this.totalPoints) * PART_MAXVAR);
	this.S_old = cont.meshes.oldVert.subarray(this.startOff, this.startOff + (this.totalPoints) * PART_MAXVAR);

	this.dt = 10 / 1000;
	this.drag = 0.5;

	this.startDotOff = cont.nextDotOff;
	cont.nextDotOff += this.totalPoints * DOT_PART_TOTAL;

	this.dotStat = cont.dotStat.subarray(this.startDotOff, this.startDotOff + (this.totalPoints) * DOT_PART_TOTAL);

	this.tempStat = new Float32Array(PART_TEMP_TOTAL);

	this.faces = new Uint16Array(this.totalPoints);

	this.attractor = new Float32Array(PART_MAXVAR * 2);

	this.name = 'tornado';

	//this.velGen = new DiskZone([-20, -10, 0], [0, 1, 0], 30);
	//	this.posGen = new DiskZone([-20, -10, 0], [0, 1, 0], 10);

	//	this.posGen = new ConeZone([-40,0,50],[0,1,0],-20,40);
	this.posGen = new DiskZone([-50, 0, 50], [0, 1, 0], 30, 15);
	this.coneArea = new ConeZone([-40, 0, 50], [0, 1, 0], -30, 40);
	this.velGen = new ConeZone([0, 0, 0], [1, 0, 0], -20, 5);
	this.faces = new Uint16Array(this.totalPoints);

	this.count = 0;

	this.emitterPosition = [-40, 35, 50];
	this.fielder = {};
	this.fielder['pos'] = [-40, 40, 100]
	this.fielder['mass'] = 10000;
}

Tornado.prototype = Object.create(SimBase.prototype);
Tornado.prototype.constructor = Tornado;

Tornado.prototype.initParticle = function (curStat, oldStat, dotStat) {
	var curPos, curVel;
	var oldPos, oldVel;
	var curClr, oldClr;

	var i, offset;
	var genVal;

	curPos = curStat.subarray(PART_XPOS, PART_XPOS + 3);
	curVel = curStat.subarray(PART_XVEL, PART_XVEL + 3);

	oldPos = oldStat.subarray(PART_XPOS, PART_XPOS + 3);
	oldVel = oldStat.subarray(PART_XVEL, PART_XVEL + 3);

	//	vec3.copy(curPos,this.emitterPosition);
	//	vec3.copy(oldPos,curPos);
	//	
	//	vec3.copy(oldVel,this.velGen.getValue()[1]);
	//	vec3.copy(curVel,oldVel);

	genVal = this.posGen.getValue();
	vec3.copy(curPos, genVal);
	vec3.copy(oldPos, curPos);

	vec3.copy(curVel, [0, 0, 0]);
	vec3.copy(oldVel, curVel);

	curClr = curStat.subarray(PART_R, PART_R + 4);
	oldClr = oldStat.subarray(PART_R, PART_R + 4);

	vec4.copy(curClr, [0.7, Math.random(), Math.random(), 1.0]);
	vec4.copy(oldClr, curClr);

	curStat[PART_DIAM] = oldStat[PART_DIAM] = 12;
	//initial angular acceleration
	curStat[PART_ANG_VEL] = 0;
	curStat[PART_ANG] = 0;
}

Tornado.prototype.resetForce = function () {
	var i, partOff;
	var F;
	for (i = 0; i < this.totalPoints; ++i) {
		partOff = i * PART_MAXVAR;
		F = this.S_cur.subarray(partOff + PART_X_FTOT, partOff + PART_X_FTOT + 3);
		F[0] = F[1] = F[2] = 0;
	}
}

Tornado.prototype.initSim = function () {

	var i = 0;
	var offset = 0,
		dotOff;
	var curStat, oldStat, dotStat;
	for (i = 0; i < this.totalPoints; ++i) {
		this.faces[i] = i;
		offset = i * PART_MAXVAR;
		dotOff = i * DOT_PART_TOTAL;

		curStat = this.S_cur.subarray(offset, offset + PART_MAXVAR);
		oldStat = this.S_old.subarray(offset, offset + PART_MAXVAR);

		dotStat = this.dotStat.subarray(dotOff, dotOff + DOT_PART_TOTAL);

		this.initParticle(curStat, oldStat, dotStat);

		//		console.log(curStat.subarray(PART_XPOS,PART_XPOS+3));
	}

	//add gravity force

	this.forces.push(new GravityForce([0, -1, 0], 0.98, 0.01));
	this.constraints.push(new WallConstraint([0, -1, 0], [500, 0, 0], [0, 0, -500], [0, 50, 0]));
	this.constraints.push(new WallConstraint([0, 1, 0], [500, 0, 0], [0, 0, 500], [0, -10, 0]));
	this.constraints.push(new WallConstraint([0, 0, -1], [-500, 0, 0], [0, 500, 0], [0, 0, 100]));
	this.constraints.push(new WallConstraint([0, 0, 1], [-500, 0, 0], [0, 500, 0], [0, 0, 0]));
	this.constraints.push(new WallConstraint([-1, 0, 0], [0, -500, 0], [0, 0, 500], [0, 0, 0]));
	this.constraints.push(new WallConstraint([1, 0, 0], [0, 500, 0], [0, 0, 500], [-100, 0, 0]));
}

Tornado.prototype.dotFinder = function () {

	this.resetForce();
	//update the big mass position
	var fieldPos = this.fielder['pos'];
	var fieldMass = this.fielder['mass'];


	//apply gravity to
	var i, distSq, delta = vec3.create();
	var curPos, offset, dotOff;
	var F, mag, acc;


	for (i = 0; i < this.totalPoints; ++i) {

		offset = i * PART_MAXVAR;
		dotOff = i * DOT_PART_TOTAL;

		curPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
		F = this.S_cur.subarray(offset + PART_X_FTOT, offset + PART_X_FTOT + 3);

		vec3.add(F, F, this.forces[0].force);


		distSq = vec3.squaredDistance(curPos, fieldPos);

		vec3.sub(delta, fieldPos, curPos);

		mag = fieldMass / distSq;

		vec3.normalize(delta, delta);
		vec3.scale(delta, delta, mag);

		vec3.add(F, F, delta);

		acc = this.dotStat.subarray(dotOff + DOT_PART_XVEL, dotOff + DOT_PART_XVEL + 3);
		vec3.copy(acc, F);
	}

}

//Tornado.prototype.initSim = function () {
//	
//	var i, offset;
//	
//	var curPos,oldPos,curVel,oldVel;
//	var curClr, oldClr;
//	var genVal;
//	
////	for(i=0;i<2;++i)
////	{
////		
////	}
//	curPos = this.attractor.subarray(PART_XPOS,PART_XPOS+3);
//	vec3.copy(curPos,[0,10,0]);
//	curVel = this.attractor.subarray(PART_XVEL,PART_XVEL+3);
//	vec3.copy(curVel,[0,5,0]);
//	this.attractor[PART_MASS] = 1000.0;
//	
//	for( i = 0; i < this.totalPoints; ++i)
//	{
//		
//		this.faces[i] = i;
//		
//		offset = i*PART_MAXVAR;
//		
//		curPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
//		curClr = this.S_cur.subarray(offset + PART_R, offset + PART_R + 4);
//		curVel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
//
//		oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
//		oldClr = this.S_old.subarray(offset + PART_R, offset + PART_R + 4);
//		oldVel = this.S_old.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
//
//		genVal = this.posGen.getValue();
//		vec3.copy(curPos, genVal[1]);
//		vec3.copy(oldPos, curPos);
//
//		vec3.copy(curVel,[0,0,0]);
//		vec3.copy(oldVel,curVel);
//
//		vec4.copy(curClr,[0.7,Math.random(),Math.random(),1.0]);
//		vec4.copy(oldClr, curClr);
//
////		this.S_cur[offset + PART_SPRITE_SIZE] = randomSpread(20, 20);
//		this.S_cur[offset + PART_DIAM] = 5;
//		this.S_old[offset + PART_DIAM] = this.S_cur[offset + PART_DIAM]
//		this.S_cur[offset + PART_MOVEABLE] = 1;
//		this.S_cur[offset + PART_MASS] = 0.5;
//		
//		this.S_cur[offset + PART_ANG_VEL] = 5;
//		this.S_cur[offset + PART_ANG] = genVal[0];
////		this.S_cur[offset + PART_AGE] = 0;
////		this.S_cur[offset + PART_LIFESPAN] = (getRandomArbitrary(0, 9) + 1) / 10;
//	}
//}



Tornado.prototype.solver = function () {
	this.solvers['exp'].solve(this.totalPoints, this.S_cur, this.S_old, this.dotStat, this.dt);

	var i, offset;
	for (i = 0; i < this.totalPoints; ++i) {

		offset = i * PART_MAXVAR;


	}
	//	var i, offset;
	//	var curPos,oldPos,r;
	//	
	//	var center = [-40,0,50];
	//	
	//	this.count++;
	//	
	//	var roff, period;
	//	for(i = 0; i< this.totalPoints; ++i)
	//	{
	//		offset = i*PART_MAXVAR;
	//	
	//		this.S_cur[offset+PART_ANG] += this.S_cur[offset+PART_ANG_VEL]*this.dt;
	//		
	//		curPos = this.S_cur.subarray(offset+PART_XPOS,offset+PART_XPOS+3);
	//		oldPos = this.S_old.subarray(offset+PART_XPOS,offset+PART_XPOS+3);
	//		//this.S_cur[offset+
	//		center[1] = oldPos[1];
	//		
	//		roff = (curPos[1]/40)*20;
	//		period = Math.floor(200*roff);
	//		
	//		r = vec3.dist(oldPos,center);
	////				center[0] += roff*Math.cos(Math.PI*2*this.count/period);
	////		center[1] += 
	//
	//		curPos[1] = oldPos[1];
	//		
	//		oldPos[0] = r*Math.cos(this.S_cur[offset+PART_ANG]) + center[0];
	//		curPos[0] = oldPos[0] + roff*Math.cos(Math.PI*2*this.count/period);
	//		oldPos[2] = r*Math.sin(this.S_cur[offset+PART_ANG]) + center[2];
	//		curPos[2] = oldPos[2] + roff*Math.sin(Math.PI*2*this.count/period);
	//	}
}

Tornado.prototype.applyContraints = function () {


	var i, j, offset;
	var curPos, curVel, oldPos;

	var c;

	for (i = 0; i < this.totalPoints; ++i) {
		offset = i * PART_MAXVAR;
		curPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
		oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
		curVel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);

		for (j = 0; j < this.constraints.length; ++j) {
			c = this.constraints[j];
			c.satisfy(curPos, oldPos, curVel);
		}
	}
}