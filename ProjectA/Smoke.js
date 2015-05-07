Smoke = function (num, cont) {

	SimBase.prototype.constructor.call(this);

	this.totalPoints = num;

	this.startOff = cont.nextOff; //the start offset in the vertex array in container;
	cont.nextOff += (this.totalPoints) * PART_MAXVAR;

	this.S_cur = cont.meshes.curVert.subarray(this.startOff, this.startOff + (this.totalPoints) * PART_MAXVAR);
	this.S_old = cont.meshes.oldVert.subarray(this.startOff, this.startOff + (this.totalPoints) * PART_MAXVAR);

	this.dt = 1 / 60;
	this.drag = 0.5;

	this.startDotOff = cont.nextDotOff;
	cont.nextDotOff += this.totalPoints * DOT_PART_TOTAL;

	this.dotStat = cont.dotStat.subarray(this.startDotOff, this.startDotOff + (this.totalPoints) * DOT_PART_TOTAL);

	this.tempStat = new Float32Array(PART_TEMP_TOTAL);

	this.faces = new Uint16Array(this.totalPoints);

	this.name = 'smoke';

	this.velGen = new DiskZone([-20, -10, 0], [0, 1, 0], 30);
	this.posGen = new DiskZone([-20, -10, 0], [0, 1, 0], 10);

	this.faces = new Uint16Array(this.totalPoints);
}


Smoke.prototype = Object.create(SimBase.prototype);
Smoke.prototype.constructor = Smoke;

Smoke.prototype.initSim = function () {
	var i, offset;
	var curPos, curVel, oldPos, oldVel;
	var curClr, oldClr;
	var hue, rgbColor;
	var speed,angle;

	for (i = 0; i < this.totalPoints; ++i) {
		
		this.faces[i] = i;
		
		offset = i * PART_MAXVAR;

		curPos = this.S_cur.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
		curClr = this.S_cur.subarray(offset + PART_R, offset + PART_R + 4);
		curVel = this.S_cur.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);

		oldPos = this.S_old.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
		oldClr = this.S_old.subarray(offset + PART_R, offset + PART_R + 4);
		oldVel = this.S_old.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);

//		vec3.copy(curPos, this.posGen.getValue());
		vec3.copy(curPos,[randomSpread(0,10),randomSpread(0,10),randomSpread(0,10)]);
		vec3.copy(oldPos, curPos);

		speed = randomSpread(200,160);
		angle = randomSpread(Math.PI/2,0.42);
//		this.curStat[offset+PART_XVEL] = Math.cos(angle)*speed;
//		this.curStat[offset+PART_YVEL] = Math.sin(angle)*speed;
//		this.curStat[offset+PART_ZVEL] = speed*Math.random();
//		vec3.copy(curVel, this.velGen.getValue());
		vec3.copy(curVel,[Math.cos(angle)*speed,Math.sin(angle)*speed,Math.sin(angle)*speed]);
		vec3.copy(oldVel, curVel);



		hue = randomSpread(25, 15);
		rgbColor = transfomHSV2RGB(convertHue(hue), 1.0, 1.0);
		vec4.copy(curClr, [rgbColor.r, rgbColor.g, rgbColor.b, 1.0]);
		vec4.copy(oldClr, curClr);

		this.S_cur[offset + PART_SPRITE_SIZE] = randomSpread(20, 20);
		this.S_cur[offset + PART_DIAM] = randomSpread(20, 20);
		this.S_old[offset + PART_DIAM] = this.S_cur[offset + PART_DIAM]
		this.S_cur[offset + PART_MOVEABLE] = 1;
		this.S_cur[offset + PART_MASS] = 0.5;
		this.S_cur[offset + PART_AGE] = 0;
		this.S_cur[offset + PART_LIFESPAN] = (getRandomArbitrary(0, 9) + 1) / 10;
//
//		this.dotStat[dotOff + DOT_PART_XVEL] = 0.005;
//		this.dotStat[dotOff + DOT_PART_YVEL] = 0;
//		this.dotStat[dotOff + DOT_PART_ZVEL] = 0;
	}

	this.forces.push(new WindForce());
}

Smoke.prototype.resetForce = function () {
	var F, offset;
	var idx;
	var zero = vec3.create();
	for (idx = 0; idx < this.totalPoints; ++idx) {
		offset = idx * PART_MAXVAR;
		F = this.S_cur.subarray(offset + PART_X_FTOT, offset + PART_X_FTOT + 3);
		vec3.copy(F, zero);
	}
}


Smoke.prototype.applyGeneralForce = function (f) {
	var idx;
	var F, offset;
	for (idx = 0; idx < this.totalPoints; ++idx) {
		offset = idx * PART_MAXVAR;
		F = this.S_cur.subarray(offset + PART_X_FTOT, offset + PART_X_FTOT + 3);
		vec3.add(F, F, f.force);
	}
}

Smoke.prototype.dotFinder = function () {

	var i;
	this.resetForce();

//	for (i = 0; i < this.forces.length; ++i) {
//		f = this.forces[i];
//		switch (f.type) {
//		case F_WIND:
//			applyGeneralForce(f);
//		}
//	}
	
	for(i=0;i<this.totalPoints;++i)
	{
		this.dotStat[i*DOT_PART_TOTAL+DOT_PART_XVEL] = 0.03;
		this.dotStat[i*DOT_PART_TOTAL+DOT_PART_YVEL] = 0;
		this.dotStat[i*DOT_PART_TOTAL+DOT_PART_ZVEL] = 0;
	}
}

Smoke.prototype.solver = function(){
	this.solvers['exp'].solve(this.totalPoints,this.S_cur,this.S_old,this.dotStat,this.dt);
}

Smoke.prototype.applyContraints = function(){
	
	var resetParticle = function(curStat,oldStat,posGen,velGen)
	{
		var curPos = curStat.subarray(PART_XPOS,PART_XPOS+3);
		var oldPos = oldStat.subarray(PART_XPOS,PART_XPOS+3);
//		vec3.copy(curStat,posGen.getValue());
//		vec3.copy(oldStat,curStat);
		
		var curVel = curStat.subarray(PART_XPOS,PART_XPOS+3);
		var oldVel = oldStat.subarray(PART_XPOS,PART_XPOS+3);
//		vec3.copy(curVel,velGen.getValue());
//		vec3.copy(oldVel,curVel);
		
		vec3.copy(curPos,[randomSpread(0,5),randomSpread(0,5),randomSpread(0,5)]);
		vec3.copy(oldPos, curPos);

		var speed = randomSpread(200,160);
		var angle = randomSpread(Math.PI/2,0.42);
//		this.curStat[offset+PART_XVEL] = Math.cos(angle)*speed;
//		this.curStat[offset+PART_YVEL] = Math.sin(angle)*speed;
//		this.curStat[offset+PART_ZVEL] = speed*Math.random();
//		vec3.copy(curVel, this.velGen.getValue());
		vec3.copy(curVel,[Math.cos(angle)*speed,Math.sin(angle)*speed,Math.sin(angle)*speed]);
		vec3.copy(oldVel, curVel);

		var hue = randomSpread(25,15);
		var rgbColor = transfomHSV2RGB(convertHue(hue),1.0,1.0);
		
		var curClr = curStat.subarray(PART_R,PART_R+3);
		var oldClr = oldStat.subarray(PART_R,PART_R+3);
		vec4.copy(curClr, [rgbColor.r, rgbColor.g, rgbColor.b, 1.0]);
		vec4.copy(oldClr, curClr);
		
		curStat[PART_AGE] = oldStat[PART_AGE] = 0;
		curStat[PART_DIAM] = oldStat[PART_DIAM] = randomSpread(20,20);
		curStat[PART_LIFESPAN] = oldStat[PART_LIFESPAN] = (getRandomArbitrary(0,9)+1)/10;
	}
		
	var i,offset,curStat,oldStat;
	var temp;
	
	for(i=0;i<this.totalPoints;++i)
	{
		offset = i*PART_MAXVAR;
		curStat = this.S_cur.subarray(offset,offset+PART_MAXVAR);
		oldStat = this.S_old.subarray(offset,offset+PART_MAXVAR);
		
	
		temp = curStat[PART_DIAM];
		curStat[PART_DIAM] = oldStat[PART_DIAM] - 20*this.dt;
		oldStat[PART_DIAM] = temp;
//		console.log(curStat[PART_DIAM]);
		
		curStat[PART_AGE] += this.dt;
		curStat[PART_A] = 1 - curStat[PART_AGE]/curStat[PART_LIFESPAN];
		
		
		if(curStat[PART_AGE] > curStat[PART_LIFESPAN])
		{
//			console.log('Reset Particles');
			resetParticle(curStat,oldStat,this.posGen,this.velGen);
//			console.log(curS[PART_AGE]);
		}
	}
}