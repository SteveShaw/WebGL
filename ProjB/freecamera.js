PerspectiveCamera = function ( fov, aspect, near, far ) {

    CameraBase.call( this );

    this.zoom = 1;
    this.fov = fov !== undefined ? fov : 50;
    this.aspect = aspect !== undefined ? aspect : 1;
    this.near = near !== undefined ? near : 0.1;
    this.far = far !== undefined ? far : 2000;

    this.updateProjectionMatrix();

};

PerspectiveCamera.prototype = Object.create( CameraBase.prototype );
PerspectiveCamera.prototype.constructor = PerspectiveCamera;


/**
 * Uses Focal Length (in mm) to estimate and set FOV
 * 35mm (fullframe) camera is used if frame size is not specified;
 * Formula based on http://www.bobatkins.com/photography/technical/field_of_view.html
 */

PerspectiveCamera.prototype.setLens = function ( focalLength, frameHeight ) {

    if ( frameHeight === undefined ) frameHeight = 24;

    this.fov = 2 * this.radToDeg( Math.atan( frameHeight / ( focalLength * 2 ) ) );
    this.updateProjectionMatrix();

}


//PerspectiveCamera.prototype.setViewOffset = function ( fullWidth, fullHeight, x, y, width, height ) {

//    this.fullWidth = fullWidth;
//    this.fullHeight = fullHeight;
//    this.x = x;
//    this.y = y;
//    this.width = width;
//    this.height = height;

//    this.updateProjectionMatrix();
//};

//PerspectiveCamera.prototype.radToDeg = function() {

//    var radianToDegreesFactor = 180 / Math.PI;

//    return function ( radians ) {

//        return radians * radianToDegreesFactor;

//    };
//};


PerspectiveCamera.prototype.updateProjectionMatrix = function () {

    var fov = 2 * Math.atan( Math.tan( this.fov*Math.PI/180.0 * 0.5 ) / this.zoom ) * 180.0/Math.PI;
    this.projectionMatrix.setPerspective( fov, this.aspect, this.near, this.far );

//    if ( this.fullWidth ) {

//        var aspect = this.fullWidth / this.fullHeight;
//        var top = Math.tan( this.degToRad( fov * 0.5 ) ) * this.near;
//        var bottom = - top;
//        var left = aspect * bottom;
//        var right = aspect * top;
//        var width = Math.abs( right - left );
//        var height = Math.abs( top - bottom );

//        this.projectionMatrix.setFrustum(
//                 left + this.x * width / this.fullWidth,
//                 left + ( this.x + this.width ) * width / this.fullWidth,
//                 top - ( this.y + this.height ) * height / this.fullHeight,
//                 top - this.y * height / this.fullHeight,
//                 this.near,
//                 this.far
//                 );

//    } else {

//        this.projectionMatrix.setPerspective( fov, this.aspect, this.near, this.far );

//    }

};


PerspectiveCamera.prototype.clone = function () {

    var camera = new PerspectiveCamera();

    CameraBase.prototype.clone.call( this, camera );

    camera.zoom = this.zoom;
    camera.fov = this.fov;
    camera.aspect = this.aspect;
    camera.near = this.near;
    camera.far = this.far;

    camera.projectionMatrix.copy( this.projectionMatrix );

    return camera;
};
