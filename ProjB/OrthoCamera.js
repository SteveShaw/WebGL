//based on three.js (http://threej.org) with large modification

OrthographicCamera = function ( left, right, top, bottom, near, far ) {

    CameraBase.call( this );

    this.zoom = 1.5;

    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;

    this.near = ( near !== undefined ) ? near : 0.1;
    this.far = ( far !== undefined ) ? far : 2000;

    this.updateProjectionMatrix();

};

OrthographicCamera.prototype = Object.create( CameraBase.prototype );
OrthographicCamera.prototype.constructor = OrthographicCamera;

OrthographicCamera.prototype.updateProjectionMatrix = function () {

    var dx = ( this.right - this.left ) / ( 2 * this.zoom );
    var dy = ( this.top - this.bottom ) / ( 2 * this.zoom );
    var cx = ( this.right + this.left ) / 2;
    var cy = ( this.top + this.bottom ) / 2;

//    this.projectionMatrix.makeOrthographic( cx - dx, cx + dx, cy + dy, cy - dy, this.near, this.far );
    this.projectionMatrix.setOrtho(cx - dx, cx + dx, cy - dy, cy + dy, this.near, this.far);

};

OrthographicCamera.prototype.clone = function () {

    var camera = new OrthographicCamera();

    CameraBase.prototype.clone.call( this, camera );

    camera.zoom = this.zoom;

    camera.left = this.left;
    camera.right = this.right;
    camera.top = this.top;
    camera.bottom = this.bottom;

    camera.near = this.near;
    camera.far = this.far;

    camera.projectionMatrix.copy( this.projectionMatrix );

    return camera;
};
