//Code is based on Three.js (http://threejs.org) but with large modifications.

OrbitControls = function (object, canvas) {

	this.object = object;
	this.domElement = canvas;

	// API

	// Set to false to disable this control
	this.enabled = true;

	// "target" sets the location of focus, where the control orbits around
	// and where it pans with respect to.
	this.target = vec3.fromValues(0, 0, -1);

	// This option actually enables dollying in and out; left as "zoom" for
	// backwards compatibility
	this.noZoom = false;
	this.zoomSpeed = 1.0;

	// Limits to how far you can dolly in and out
	this.minDistance = 0;
	this.maxDistance = Infinity;

	// Set to true to disable this control
	this.noRotate = false;
	this.rotateSpeed = 1.0;

	// Set to true to disable this control
	this.noPan = false;
	this.keyPanSpeed = 7.0; // pixels moved per arrow key push

	// Set to true to automatically rotate around the target
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	this.minAzimuthAngle = -Infinity; // radians
	this.maxAzimuthAngle = Infinity; // radians

	// Set to true to disable use of the keys
	this.noKeys = false;

	// The four arrow keys
	this.keys = {
		LEFT: 37,
		UP: 38,
		RIGHT: 39,
		BOTTOM: 40,
		W: 87,
		A: 65,
		S: 83,
		D: 65
	};

	// Mouse buttons
	this.mouseButtons = {
		ORBIT: 0,
		ZOOM: 1,
		PAN: 2
	};

	////////////
	// internals

	var scope = this;

	var EPS = 0.000001;

	var rotateStart = vec2.create(); //new Float32Array([0,0]);
	var rotateEnd = vec2.create(); //new Float32Array([0,0]);
	var rotateDelta = vec2.create(); //new Float32Array([0,0]);

	var panStart = vec2.create(); //new Float32Array([0,0]);
	var panEnd = vec2.create(); //new Float32Array([0,0]);
	var panDelta = vec2.create(); //new Float32Array([0,0]);
	var panOffset = vec3.create(); //new Float32Array([0,0,0]);

	var offset = vec3.create(); //new Float32Array([0,0,0]);

	var dollyStart = vec2.create(); //new Float32Array([0,0]);
	var dollyEnd = vec2.create(); //new Float32Array([0,0]);
	var dollyDelta = vec2.create(); //new Float32Array([0,0]);

	var theta;
	var phi;
	var phiDelta = 0;
	var thetaDelta = 0;
	var scale = 1;
	var pan = vec3.create(); //new Float32Array([0,0,0]);

	var lastPosition = vec3.create(); //new Float32Array([0,0,0]);
	var lastQuaternion = quat.create(); //new Quaternion(0,0,0,1);

	var STATE = {
		NONE: -1,
		ROTATE: 0,
		DOLLY: 1,
		PAN: 2
	};

	var state = STATE.NONE;

	// for reset

	this.target0 = vec3.clone(this.target); //new Float32Array(this.target);
	this.position0 = vec3.clone(this.object.position); //new Float32Array(this.object.position);

	// so camera.up is the orbit axis
	var quatRot = quat.create();
	quat.rotationTo(quatRot, this.object.up, [0, 1, 0]);
	quat.normalize(quatRot, quatRot);
	var quatInverse = quat.create(); //new Quaternion(0,0,0,1);
	quat.invert(quatInverse, quatRot);
	quat.normalize(quatInverse, quatInverse);

	// events

	//var changeEvent = { type: 'change' };
	//var startEvent = { type: 'start'};
	//var endEvent = { type: 'end'};


	this.getPolarAngle = function () {

		return phi;

	};

	this.getAzimuthalAngle = function () {

		return theta;

	};

	this.getAutoRotationAngle = function () {

		return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;

	}

	this.rotateLeft = function (angle) {


		if (angle === undefined) {

			angle = this.getAutoRotationAngle();

		}

		thetaDelta -= angle;

		// console.log('function rotateLeft: '+angle+';delta='+thetaDelta);
	};

	this.rotateUp = function (angle) {

		if (angle === undefined) {

			angle = this.getAutoRotationAngle();

		}

		phiDelta -= angle;

	};

	// pass in distance in world space to move left
	this.panLeft = function (distance) {

		var te = this.object.matrix;

		// get X column of matrix
		//panOffset.set( te[ 0 ], te[ 1 ], te[ 2 ] );
		//panOffset.multiplyScalar( - distance );
		//		pan.add( panOffset );
		vec3.set(panOffset, te[0], te[1], te[2]);
		vec3.scale(panOffset, panOffset, -distance);
		vec3.add(pan, pan, panOffset);

	};

	// pass in distance in world space to move up
	this.panUp = function (distance) {

		var te = this.object.matrix.elements;

		vec3.set(panOffset, te[4], te[5], te[6]);
		vec3.scale(panOffset, panOffset, -distance);
		vec3.add(pan, pan, panOffset);
	};

	// pass in x,y of change desired in pixel space,
	// right and down are positive
	this.pan = function (deltaX, deltaY) {

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		if (scope.object.fov !== undefined) {

			var offset = vec3.clone(scope.object.position);
			vec3.sub(offset, offset, scope.target);
			var targetDistance = vec3.length(offset);

			// half of the fov is center to top of screen
			targetDistance *= Math.tan((scope.object.fov / 2) * Math.PI / 180.0);

			// we actually don't use screenWidth, since perspective camera is fixed to screen height
			scope.panLeft(2 * deltaX * targetDistance / element.clientHeight);
			scope.panUp(2 * deltaY * targetDistance / element.clientHeight);
		}
	};

	this.getZoomScale = function () {

		// console.log('zoomSpeed='+this.zoomSpeed);
		return Math.pow(0.95, this.zoomSpeed);

	};


	this.dollyIn = function (dollyScale) {

		if (dollyScale === undefined) {

			dollyScale = this.getZoomScale();

		}


		scale /= dollyScale;
	};

	this.dollyOut = function (dollyScale) {

		if (dollyScale === undefined) {

			dollyScale = this.getZoomScale();

		}


		scale *= dollyScale;

	};


	this.update = function () {

		//		var position = this.object.position;

		vec3.sub(offset, this.object.position, this.target);
		vec3.transformQuat(offset, offset, quatRot);

		theta = Math.atan2(offset[0], offset[2]);

		// angle from y-axis

		phi = Math.atan2(Math.sqrt(offset[0] * offset[0] + offset[2] * offset[2]), offset[1]);

		//		if (this.autoRotate && state === STATE.NONE) {
		//
		//			this.rotateLeft(this.getAutoRotationAngle());
		//
		//		}

		theta += thetaDelta;
		phi += phiDelta;

		// restrict theta to be between desired limits
		theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, theta));

		// restrict phi to be between desired limits
		phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));

		// restrict phi to be betwee EPS and PI-EPS
		phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

		//		var radius = (Math.sqrt(offset[0] * offset[0] + offset[1] * offset[1] + offset[2] * offset[2])) * scale;
		var radius = vec3.length(offset) * scale;

		// restrict radius to be between desired limits
		radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));

		// move target to panned location
		//		this.target.add( pan );
		vec3.add(this.target, this.target, pan);


		offset[0] = radius * Math.sin(phi) * Math.sin(theta);
		offset[1] = radius * Math.cos(phi);
		offset[2] = radius * Math.sin(phi) * Math.cos(theta);


		// console.log('offset after math');
		// rotate offset back to "camera-up-vector-is-up" space
		//        offset.applyQuaternion( quatInverse );
		vec3.transformQuat(offset, offset, quatInverse);
		vec3.add(this.object.position, this.target, offset);
		this.object.lookAt(this.target);

		thetaDelta = 0;
		phiDelta = 0;
		scale = 1;
		vec3.set(pan, 0, 0, 0);

		// update condition is:
		// min(camera displacement, camera rotation in radians)^2 > EPS
		// using small-angle approximation cos(x/2) = 1 - x^2 / 8

		if (vec3.squaredDistance(lastPosition, this.object.position) > EPS || 8 * (1 - quat.dot(lastQuaternion, this.object.quatRot)) > EPS) {

			//this.dispatchEvent( changeEvent );

			//			lastPosition.copy( this.object.position );
			vec3.copy(lastPosition, this.object.position);
			quat.copy(lastQuaternion, this.object.quatRot);
		}

	};


	this.reset = function () {

		state = STATE.NONE;

		//        this.target.copy( this.target0 );
		vec3.copy(this.target, this.target0);
		vec3.copy(this.object.position, this.position0);
		this.update();

	};




	function onMouseDown(event) {

		if (scope.enabled === false) return;
		event.preventDefault();

		if (event.button === scope.mouseButtons.ORBIT) {
			if (scope.noRotate === true) return;

			state = STATE.ROTATE;

			vec2.set(rotateStart, event.clientX, event.clientY);

		} else if (event.button === scope.mouseButtons.ZOOM) {
			if (scope.noZoom === true) return;

			state = STATE.DOLLY;

			//dollyStart.set( event.clientX, event.clientY );
			vec2.set(dollyStart, event.clientX, event.clientY);

		} else if (event.button === scope.mouseButtons.PAN) {
			if (scope.noPan === true) return;

			state = STATE.PAN;

			vec2.set(panStart, event.clientX, event.clientY);
		}

		if (state !== STATE.NONE) {
			document.addEventListener('mousemove', onMouseMove, false);
			document.addEventListener('mouseup', onMouseUp, false);
			//this.dispatchEvent( startEvent );
		}

	}

	function onMouseMove(event) {

		if (this.enabled === false) return;

		event.preventDefault();

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		if (state === STATE.ROTATE) {

			if (scope.noRotate === true) return;

			vec2.set(rotateEnd, event.clientX, event.clientY);
			vec2.sub(rotateDelta, rotateEnd, rotateStart);
			// rotating across whole screen goes 360 degrees around

			scope.rotateLeft(2 * Math.PI * rotateDelta[0] / element.clientWidth * scope.rotateSpeed);

			// rotating up and down along whole screen attempts to go 360, but limited to 180
			scope.rotateUp(2 * Math.PI * rotateDelta[1] / element.clientHeight * scope.rotateSpeed);

			//            rotateStart.copy( rotateEnd );
			vec2.copy(rotateStart, rotateEnd);

		} else if (state === STATE.DOLLY) {

			if (scope.noZoom === true) return;

			vec2.set(dollyEnd, event.clientX, event.clientY);
			vec2.sub(dollyDelta, dollyEnd, dollyStart);

			if (dollyDelta[1] > 0) {

				scope.dollyIn();

			} else {

				scope.dollyOut();

			}

			//dollyStart.copy( dollyEnd );
			vec2.copy(dollyStart, dollyEnd);

		} else if (state === STATE.PAN) {

			if (scope.noPan === true) return;

			vec2.set(panEnd, event.clientX, event.clientY);
			vec2.sub(panDelta, panEnd, panStart);
			scope.pan(panDelta[0], panDelta[1]);

			vec2.copy(panStart, panEnd);

		}

		if (state !== STATE.NONE) scope.update();

	}

	function onMouseUp( /* event */ ) {

		if (scope.enabled === false) return;

		document.removeEventListener('mousemove', onMouseMove, false);
		document.removeEventListener('mouseup', onMouseUp, false);
		//scope.dispatchEvent( endEvent );
		state = STATE.NONE;

	}

	function onMouseWheel(event) {

		if (scope.enabled === false || scope.noZoom === true || state !== STATE.NONE) return;

		event.preventDefault();
		event.stopPropagation();

		var delta = 0;

		if (event.wheelDelta !== undefined) { // WebKit / Opera / Explorer 9

			delta = event.wheelDelta;

		} else if (event.detail !== undefined) { // Firefox

			delta = -event.detail;

		}

		if (delta > 0) {

			scope.dollyOut();

		} else {

			scope.dollyIn();

		}

		scope.update();
		//scope.dispatchEvent( startEvent );
		//scope.dispatchEvent( endEvent );

	}

	function onKeyDown(event) {

		if (scope.enabled === false || scope.noKeys === true || scope.noPan === true) return;

		switch (event.keyCode) {

			//		case scope.keys.UP:
		case scope.keys.W:
			scope.pan(0, scope.keyPanSpeed);
			scope.update();
			break;

			//		case scope.keys.BOTTOM:
		case scope.keys.S:
			scope.pan(0, -scope.keyPanSpeed);
			scope.update();
			break;

			//		case scope.keys.LEFT:
		case scope.keys.A:
			scope.pan(scope.keyPanSpeed, 0);
			scope.update();
			break;

			//		case scope.keys.RIGHT:
		case scope.keys.D:
			scope.pan(-scope.keyPanSpeed, 0);
			scope.update();
			break;

		}

	}

	canvas.addEventListener('contextmenu', function (event) {
		event.preventDefault();
	}, false);
	canvas.addEventListener('mousedown', onMouseDown, false);
	canvas.addEventListener('mousewheel', onMouseWheel, false);
	canvas.addEventListener('DOMMouseScroll', onMouseWheel, false); // firefox

	//window.addEventListener('keydown', onKeyDown, false);

	// force an update at start
	this.update();

};

OrbitControls.prototype = Object.create(EventDispatcher.prototype);
OrbitControls.prototype.constructor = OrbitControls;