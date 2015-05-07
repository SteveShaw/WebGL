//const I_MIDPOINT = 0;
Integrator = function (dotFunc, simObj) {
	this.dotFunc = dotFunc;
	this.simObj = simObj;

	this.tempStat = new Float32Array(PART_TEMP_TOTAL);
}

Integrator.prototype.constructor = Integrator;

IntegratorExplicitEuler = function (dotFunc, simObj) {
	Integrator.prototype.constructor.call(this, dotFunc, simObj);
}

IntegratorExplicitEuler.prototype = Object.create(Integrator.prototype);
IntegratorExplicitEuler.prototype.constructor = IntegratorExplicitEuler;
IntegratorExplicitEuler.prototype.solve = function (numState, curState, oldState, dotState, dt) {

	var i, curPos, oldPos, curVel, oldVel, acc;
	var offset, dotOff;
	var tempVel = vec3.create();
	var tempPos = vec3.create();
	
	for (i = 0; i < numState; ++i) {
		offset = i * PART_MAXVAR;
		dotOff = i * DOT_PART_TOTAL;

		curPos = curState.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
		oldPos = oldState.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);

		curVel = curState.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
		oldVel = oldState.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);

		acc = dotState.subarray(dotOff + DOT_PART_XVEL, dotOff + DOT_PART_XVEL + 3);


		vec3.copy(tempVel, curVel);
		vec3.copy(tempPos, curPos);

		vec3.scaleAndAdd(curVel, curVel, acc, dt);
		vec3.scaleAndAdd(curPos, curPos, oldVel, dt);

		vec3.copy(oldVel, tempVel);
		vec3.copy(oldPos, tempPos);
	}
}

//Midpoint Euler Integrator
IntegratorMidPointEuler = function (dotFunc, simObj) {
	Integrator.prototype.constructor.call(this, dotFunc, simObj);
	//	this.type = I_MIDPOINT;
}


IntegratorMidPointEuler.prototype = Object.create(Integrator.prototype);
IntegratorMidPointEuler.prototype.constructor = IntegratorMidPointEuler;
IntegratorMidPointEuler.prototype.solve = function (numState, curState, oldState, dotState, dt) {
	var i, curPos, oldPos, curVel, oldVel, acc;
	var offset, dotOff;
	var tempVel = vec3.create();
	var tempPos = vec3.create();
	for (i = 0; i < numState; ++i) {
		offset = i * PART_MAXVAR;
		dotOff = i * DOT_PART_TOTAL;

		curPos = curState.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
		oldPos = oldState.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);

		curVel = curState.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
		oldVel = oldState.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);

		acc = dotState.subarray(dotOff + DOT_PART_XVEL, dotOff + DOT_PART_XVEL + 3);


		vec3.copy(tempVel, curVel);
		vec3.copy(tempPos, curPos);

		vec3.scaleAndAdd(curVel, oldVel, acc, dt / 2.0);
		vec3.scaleAndAdd(curPos, oldPos, oldVel, dt / 2.0);

		vec3.copy(oldVel, tempVel);
		vec3.copy(oldPos, tempPos);

	}

	//this.dotFunc();
	this.dotFunc.apply(this.simObj);

	for (i = 0; i < numState; ++i) {
		offset = i * PART_MAXVAR;
		dotOff = i * DOT_PART_TOTAL;

		curPos = curState.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
		oldPos = oldState.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);

		curVel = curState.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);
		oldVel = oldState.subarray(offset + PART_XVEL, offset + PART_XVEL + 3);

		acc = dotState.subarray(dotOff + DOT_PART_XVEL, dotOff + DOT_PART_XVEL + 3);

		vec3.copy(tempVel, curVel);
		vec3.copy(tempPos, curPos);

		vec3.scaleAndAdd(curVel, oldVel, acc, dt);
		vec3.scaleAndAdd(curPos, oldPos, oldVel, dt);

		vec3.add(curVel, curVel, oldVel);
		vec3.scale(curVel, curVel, 0.5);

		vec3.add(curPos, curPos, oldPos);
		vec3.scale(curPos, curPos, 0.5);

		vec3.copy(oldVel, tempVel);
		vec3.copy(oldPos, tempPos);

	}
}

IntegratorVerlet = function (dotFunc, simObj) {
	Integrator.prototype.constructor.call(this, dotFunc, simObj);
	this.drag = 0.99;
}

IntegratorVerlet.prototype = Object.create(Integrator.prototype);
IntegratorVerlet.prototype.constructor = IntegratorVerlet;
IntegratorVerlet.prototype.solve = function (numState, curState, oldState, dotState, dt) {

	var tempVec0 = this.tempStat.subarray(0,3);
	var tempVec1 = this.tempStat.subarray(3,6);
	
	var i,offset,dotOff;
	var curPos,oldPos,acc;
	
	for (i = 0; i < numState; ++i) {
		offset = i * PART_MAXVAR;
		dotOff = i * DOT_PART_TOTAL;

		//			if (this.S_cur[offset + PART_MOVEABLE]) === 0) continue;
		curPos = curState.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
		oldPos = oldState.subarray(offset + PART_XPOS, offset + PART_XPOS + 3);
		acc = dotState.subarray(dotOff + DOT_PART_XVEL, dotOff + DOT_PART_XVEL + 3);

		vec3.copy(tempVec1, curPos);

		vec3.sub(tempVec0, curPos, oldPos);
		vec3.scale(tempVec0, tempVec0, this.drag);
		vec3.add(curPos, curPos, tempVec0);

		vec3.scale(tempVec0, acc, dt*dt);
		vec3.add(curPos, curPos, tempVec0);


		vec3.copy(oldPos, tempVec1);

	}
}