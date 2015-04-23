//Code is based on Three.js (http://threejs.org) but with large modifications.

OrbitControls = function ( object, canvas ) {

    this.object = object;
    this.domElement = canvas;

   // API

    // Set to false to disable this control
    this.enabled = true;

    // "target" sets the location of focus, where the control orbits around
    // and where it pans with respect to.
    this.target = new Float32Array([0,0,0]);

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
    this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

    // Set to true to automatically rotate around the target
    this.autoRotate = false;
    this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

    // How far you can orbit vertically, upper and lower limits.
    // Range is 0 to Math.PI radians.
    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians

    // How far you can orbit horizontally, upper and lower limits.
    // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
    this.minAzimuthAngle = - Infinity; // radians
    this.maxAzimuthAngle = Infinity; // radians

    // Set to true to disable use of the keys
    this.noKeys = false;

    // The four arrow keys
    this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40, W: 87, A: 65, S:83,  D: 65};

    // Mouse buttons
    this.mouseButtons = { ORBIT: 0, ZOOM: 1, PAN: 2 };

    ////////////
    // internals

    var scope = this;

    var EPS = 0.000001;

    var rotateStart = new Float32Array([0,0]);
    var rotateEnd = new Float32Array([0,0]);
    var rotateDelta = new Float32Array([0,0]);

    var panStart = new Float32Array([0,0]);
    var panEnd = new Float32Array([0,0]);
    var panDelta = new Float32Array([0,0]);
    var panOffset = new Float32Array([0,0,0]);

    var offset = new Float32Array([0,0,0]);

    var dollyStart = new Float32Array([0,0]);
    var dollyEnd = new Float32Array([0,0]);
    var dollyDelta = new Float32Array([0,0]);

    var theta;
    var phi;
    var phiDelta = 0;
    var thetaDelta = 0;
    var scale = 1;
    var pan = new Float32Array([0,0,0]);

    var lastPosition = new Float32Array([0,0,0]);
    var lastQuaternion = new Quaternion(0,0,0,1);

    var STATE = { NONE : -1, ROTATE : 0, DOLLY : 1, PAN : 2};

    var state = STATE.NONE;

    // for reset

    this.target0 = new Float32Array(this.target);
    this.position0 = new Float32Array(this.object.position);

    // so camera.up is the orbit axis

    this.dot = function(v1,v2) {

        var sum = 0;
        sum += v1[0]*v2[0];
        sum += v1[1]*v2[1];
        sum += v1[2]*v2[2];

        return sum;
    };

    //cross product of 2 vector3
    this.crossVectors = function(v1,v2,dest) {
        if(dest===undefined) dest = new Float32Array(3);
        var ax = v1[0], ay = v1[1], az = v1[2];
        var bx = v2[0], by = v2[1], bz = v2[2];

        dest[0] = ay * bz - az * by;
        dest[1] = az * bx - ax * bz;
        dest[2] = ax * by - ay * bx;
    }

    this.setQuatFromVectors = function( quat, vFrom, vTo ) {

        if(quat===undefined) quat = new Quaternion(0,0,0,1);

        var v1 = new Float32Array([0,0,0]);

        var EPS = 0.000001;

        var r = this.dot(vFrom,vTo) + 1;

        if ( r < EPS ) {

            r = 0;

            if ( Math.abs( vFrom[0] ) > Math.abs( vFrom[2] ) ) {

                v1[0] = -vFrom[1];
                v1[1] = vFrom[0];
                v1[2] = 0;

            } else {
                v1[1] = -vFrom[2];
                v1[2] = vFrom[1];
                v1[0] = 0;
            }

        }
        else {
            this.crossVectors(vFrom,vTo,v1);
        }

        quat.x = v1[0];
        quat.y = v1[1];
        quat.z = v1[2];
        quat.w = r;

        quat.normalize();

    }

    var quat = new Quaternion();
    this.setQuatFromVectors( quat, this.object.up, new Float32Array([0, 1, 0]));
    var quatInverse = new Quaternion(0,0,0,1);
    quatInverse.copy(quat);
    quatInverse.inverse();
    quatInverse.normalize();

    // events

    //var changeEvent = { type: 'change' };
    //var startEvent = { type: 'start'};
    //var endEvent = { type: 'end'};

    //dot product of 2 vector3


    this.getPolarAngle = function () {

        return phi;

    };

    this.getAzimuthalAngle = function () {

        return theta;

    };

    this.getAutoRotationAngle =function() {

        return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;

    }

    this.distanceToSquared = function(v1,v2){
        var dx = v1[0] - v2[0];
        var dy = v1[1] - v2[1];
        var dz = v1[2] - v2[2];

        return dx * dx + dy * dy + dz * dz;
    }

    this.dotQuat = function(q1,q2) {

        return q1.x*q2.x  + q1.y*q2.y + q1.z*q2.z + q1.w*q2.w;
    }



    this.rotateLeft = function ( angle ) {


        if ( angle === undefined ) {

            angle = getAutoRotationAngle();

        }

        thetaDelta -= angle;

        // console.log('function rotateLeft: '+angle+';delta='+thetaDelta);
    };

    this.rotateUp = function ( angle ) {

        if ( angle === undefined ) {

            angle = getAutoRotationAngle();

        }

        phiDelta -= angle;

    };

    // pass in distance in world space to move left
    this.panLeft = function ( distance ) {

        var te = this.object.matrix.elements;

        // get X column of matrix
        //panOffset.set( te[ 0 ], te[ 1 ], te[ 2 ] );
        //panOffset.multiplyScalar( - distance );
        //		pan.add( panOffset );


        panOffset[0] = te[ 0 ]*(-distance);
        panOffset[0] = te[ 1 ]*(-distance);
        panOffset[0] = te[ 2 ]*(-distance);

        pan[0] += panOffset[0];
        pan[1] += panOffset[1];
        pan[2] += panOffset[2];

    };

    // pass in distance in world space to move up
    this.panUp = function ( distance ) {

        var te = this.object.matrix.elements;
        // console.log('camera matrix elements');
        // console.log(te)

        // get Y column of matrix
        //		panOffset.set( te[ 4 ], te[ 5 ], te[ 6 ] );
        //		panOffset.multiplyScalar( distance );

        //		pan.add( panOffset );

        panOffset[0] = te[ 4 ]*(distance);
        panOffset[0] = te[ 5 ]*(distance);
        panOffset[0] = te[ 6 ]*(distance);

        pan[0] += panOffset[0];
        pan[1] += panOffset[1];
        pan[2] += panOffset[2];

    };

    // pass in x,y of change desired in pixel space,
    // right and down are positive
    this.pan = function ( deltaX, deltaY ) {

        var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

        if ( scope.object.fov !== undefined ) {

            // perspective
            var position = scope.object.position;
            //			var offset = position.clone().sub( scope.target );
            var offset = new Float32Array(3);
            offset[0] = position[0] - scope.target[0];
            offset[1] = position[1] - scope.target[1];
            offset[0] = position[2] - scope.target[2];
            //			var targetDistance = offset.length();
            var targetDistance = Math.sqrt(offset[0]*offset[0]+offset[1]*offset[1]+offset[2]*offset[2]);

            // half of the fov is center to top of screen
            targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

            // we actually don't use screenWidth, since perspective camera is fixed to screen height
            scope.panLeft( 2 * deltaX * targetDistance / element.clientHeight  );
            scope.panUp( 2 * deltaY * targetDistance / element.clientHeight );

        } else if ( scope.object.top !== undefined ) {

            // orthographic
            scope.panLeft( deltaX * (scope.object.right - scope.object.left) / element.clientWidth );
            scope.panUp( deltaY * (scope.object.top - scope.object.bottom) / element.clientHeight );

        } else {

            // camera neither orthographic or perspective
            console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );

        }

    };

    this.getZoomScale = function() {

        // console.log('zoomSpeed='+this.zoomSpeed);
        return Math.pow( 0.95, this.zoomSpeed );

    };


    this.dollyIn = function ( dollyScale ) {

        if ( dollyScale === undefined ) {

            dollyScale = this.getZoomScale();

        }


        scale /= dollyScale;
    };

    this.dollyOut = function ( dollyScale ) {

        if ( dollyScale === undefined ) {

            dollyScale = this.getZoomScale();

        }


        scale *= dollyScale;

    };

    this.applyVectorFromQuaternion = function(v,q) {

        var x = v[0];
        var y = v[1];
        var z = v[2];

        var qx = q.x;
        var qy = q.y;
        var qz = q.z;
        var qw = q.w;

        // calculate quat * vector

        var ix =  qw * x + qy * z - qz * y;
        var iy =  qw * y + qz * x - qx * z;
        var iz =  qw * z + qx * y - qy * x;
        var iw = - qx * x - qy * y - qz * z;

        // calculate result * inverse quat

        v[0] = ix * qw + iw * - qx + iy * - qz - iz * - qy;
        v[1] = iy * qw + iw * - qy + iz * - qx - ix * - qz;
        v[2] = iz * qw + iw * - qz + ix * - qy - iy * - qx;

    }



    this.update = function () {

        var position = this.object.position;

        //       offset.copy( position ).sub( this.target );
        offset[0] = position[0];
        offset[1] = position[1];
        offset[2] = position[2];

        offset[0] -= this.target[0];
        offset[1] -= this.target[1];
        offset[2] -= this.target[2];

        // console.log('target=');
        // console.log(this.target);


        // rotate offset to "y-axis-is-up" space
        //offset.applyQuaternion( quat );
        this.applyVectorFromQuaternion(offset,quat);

        // angle from z-axis around y-axis

        theta = Math.atan2( offset[0], offset[2] );

        // angle from y-axis

        phi = Math.atan2( Math.sqrt( offset[0] * offset[0] + offset[2] * offset[2] ), offset[1]);

        if ( this.autoRotate && state === STATE.NONE ) {

            this.rotateLeft( getAutoRotationAngle() );

        }

        theta += thetaDelta;
        phi += phiDelta;

        // restrict theta to be between desired limits
        theta = Math.max( this.minAzimuthAngle, Math.min( this.maxAzimuthAngle, theta ) );

        // restrict phi to be between desired limits
        phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );

        // restrict phi to be betwee EPS and PI-EPS
        phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

        var radius = (Math.sqrt(offset[0]*offset[0]+offset[1]*offset[1]+offset[2]*offset[2])) * scale;

        // restrict radius to be between desired limits
        radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );

        // move target to panned location
        //		this.target.add( pan );

        this.target[0] += pan[0];
        this.target[1] += pan[1];
        this.target[2] += pan[2];

        offset[0] = radius * Math.sin( phi ) * Math.sin( theta );
        offset[1] = radius * Math.cos( phi );
        offset[2] = radius * Math.sin( phi ) * Math.cos( theta );

        // console.log('offset after math');
        // console.log(offset);

        // rotate offset back to "camera-up-vector-is-up" space
        //        offset.applyQuaternion( quatInverse );
        this.applyVectorFromQuaternion(offset,quatInverse);


        //		position.copy( this.target ).add( offset );
        position[0] = this.target[0];
        position[1] = this.target[1];
        position[2] = this.target[2];
        position[0] += offset[0];
        position[1] += offset[1];
        position[2] += offset[2];


        this.object.lookAt( this.target[0], this.target[1], this.target[2] );

        thetaDelta = 0;
        phiDelta = 0;
        scale = 1;
        //		pan.set( 0, 0, 0 );
        pan[0] = 0;pan[1]=0;pan[2]=0;

        // update condition is:
        // min(camera displacement, camera rotation in radians)^2 > EPS
        // using small-angle approximation cos(x/2) = 1 - x^2 / 8

        if ( this.distanceToSquared(lastPosition, this.object.position ) > EPS
                || 8 * (1 - this.dotQuat(lastQuaternion,this.object.quaternion)) > EPS ) {

            //this.dispatchEvent( changeEvent );

            //			lastPosition.copy( this.object.position );
            lastPosition[0] = this.object.position[0];
            lastPosition[0] = this.object.position[1];
            lastPosition[0] = this.object.position[2];
            lastQuaternion.copy (this.object.quaternion );

        }

    };


    this.reset = function () {

        state = STATE.NONE;

        //        this.target.copy( this.target0 );
        this.target[0] = this.target0[0];
        this.target[1] = this.target0[1];
        this.target[2] = this.target0[2];

        //		this.object.position.copy( this.position0 );
        this.object.position[0] = this.position0[0];
        this.object.position[1] = this.position0[1];
        this.object.position[2] = this.position0[2];

        this.update();

    };




    function onMouseDown( event ) {

        if ( scope.enabled === false ) return;
        event.preventDefault();

        if ( event.button === scope.mouseButtons.ORBIT ) {
            if ( scope.noRotate === true ) return;

            state = STATE.ROTATE;

            //			rotateStart.set( event.clientX, event.clientY );
            rotateStart[0] = event.clientX;
            rotateStart[1] = event.clientY;

        } else if ( event.button === scope.mouseButtons.ZOOM ) {
            if ( scope.noZoom === true ) return;

            state = STATE.DOLLY;

            //dollyStart.set( event.clientX, event.clientY );
            dollyStart[0] = event.clientX;
            dollyStart[1] = event.cientY;

        } else if ( event.button === scope.mouseButtons.PAN ) {
            if ( scope.noPan === true ) return;

            state = STATE.PAN;

            //panStart.set( event.clientX, event.clientY );
            panStart[0] = event.clientX;
            panStart[1] = event.clientY;

        }

        if ( state !== STATE.NONE ) {
            document.addEventListener( 'mousemove', onMouseMove, false );
            document.addEventListener( 'mouseup', onMouseUp, false );
            //this.dispatchEvent( startEvent );
        }

    }

    function onMouseMove( event ) {

        if ( this.enabled === false ) return;

        event.preventDefault();

        var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

        if ( state === STATE.ROTATE ) {

            if ( scope.noRotate === true ) return;

//            rotateEnd.set( event.clientX, event.clientY );
//            rotateDelta.subVectors( rotateEnd, rotateStart );
            rotateEnd[0] = event.clientX;
            rotateEnd[1] = event.clientY;
            rotateDelta[0] = rotateEnd[0] - rotateStart[0];
            rotateDelta[1] = rotateEnd[1] - rotateStart[1];

            // rotating across whole screen goes 360 degrees around

            scope.rotateLeft( 2 * Math.PI * rotateDelta[0] / element.clientWidth * scope.rotateSpeed );

            // rotating up and down along whole screen attempts to go 360, but limited to 180
            scope.rotateUp( 2 * Math.PI * rotateDelta[1] / element.clientHeight * scope.rotateSpeed );

//            rotateStart.copy( rotateEnd );
            rotateStart[0] = rotateEnd[0];
            rotateStart[1] = rotateEnd[1];

        } else if ( state === STATE.DOLLY ) {

            if ( scope.noZoom === true ) return;

            dollyEnd[0] = event.clientX;
            dollyEnd[1] = event.clientY;
            dollyDelta[0] = dollyEnd[0] - dollyStart[0];
            dollyDelta[1] = dollyEnd[1] - dollyStart[1];
//            dollyEnd.set( event.clientX, event.clientY );
//            dollyDelta.subVectors( dollyEnd, dollyStart );

            if ( dollyDelta[1] > 0 ) {

                scope.dollyIn();

            } else {

                scope.dollyOut();

            }

            //dollyStart.copy( dollyEnd );
            dollyStart[0] = dollyEnd[0];
            dollyStart[1] = dollyEnd[1];

        } else if ( state === STATE.PAN ) {

            if ( scope.noPan === true ) return;

//            panEnd.set( event.clientX, event.clientY );
            panEnd[0] = event.clientX;
            panEnd[1] = event.clientY;
//            panDelta.subVectors( panEnd, panStart );
            panDelta[0] = panEnd[0] - panStart[0];
            panDelta[1] = panEnd[1] - panStart[1];

            scope.pan( panDelta[0], panDelta[1] );

//            panStart.copy( panEnd );
            panStart[0] = panEnd[0];
            panStart[1] = panEnd[1];

        }

        if ( state !== STATE.NONE ) scope.update();

    }

    function onMouseUp( /* event */ ) {

        if ( scope.enabled === false ) return;

        document.removeEventListener( 'mousemove', onMouseMove, false );
        document.removeEventListener( 'mouseup', onMouseUp, false );
        //scope.dispatchEvent( endEvent );
        state = STATE.NONE;

    }

    function onMouseWheel( event ) {

        if ( scope.enabled === false || scope.noZoom === true || state !== STATE.NONE ) return;

        event.preventDefault();
        event.stopPropagation();

        var delta = 0;

        if ( event.wheelDelta !== undefined ) { // WebKit / Opera / Explorer 9

            delta = event.wheelDelta;

        } else if ( event.detail !== undefined ) { // Firefox

            delta = - event.detail;

        }

        if ( delta > 0 ) {

            scope.dollyOut();

        } else {

            scope.dollyIn();

        }

        scope.update();
        //scope.dispatchEvent( startEvent );
        //scope.dispatchEvent( endEvent );

    }

    function onKeyDown( event ) {

        if ( scope.enabled === false || scope.noKeys === true || scope.noPan === true ) return;

        switch ( event.keyCode ) {

        case scope.keys.UP:
		case scope.keys.W:
            scope.pan( 0, scope.keyPanSpeed );
            scope.update();
            break;

        case scope.keys.BOTTOM:
		case scope.keys.S:
            scope.pan( 0, - scope.keyPanSpeed );
            scope.update();
            break;

        case scope.keys.LEFT:
		case scope.keys.A:
            scope.pan( scope.keyPanSpeed, 0 );
            scope.update();
            break;

        case scope.keys.RIGHT:
		case scope.keys.D:
            scope.pan( - scope.keyPanSpeed, 0 );
            scope.update();
            break;

        }

    }

    canvas.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
    canvas.addEventListener( 'mousedown', onMouseDown, false );
    canvas.addEventListener( 'mousewheel', onMouseWheel, false );
    canvas.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox

    // window.addEventListener( 'keydown', onKeyDown, false );

    // force an update at start
    this.update();

};

OrbitControls.prototype = Object.create( EventDispatcher.prototype );
OrbitControls.prototype.constructor = OrbitControls;
