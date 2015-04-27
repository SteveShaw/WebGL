CameraBase = function () {

    //THREE.Object3D.call( this );

    //this.type = 'Camera';

    this.matrix = new Matrix4();
    this.matrixWorldInverse = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.viewMatrix = new Matrix4();
    this.position = new Float32Array([0,0,0]);
    this.up = new Float32Array([0,1,0]);
    this.scale = new Float32Array([1,1,1]);

    this.quaternion = new Quaternion(0,0,0,1);
};

//CameraBase.prototype = Object.create();
CameraBase.prototype.constructor = CameraBase;

CameraBase.prototype.setQuaternionFromRotationMatrix = function(q,m)
{
    var te = m.elements,

            m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
            m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
            m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ],

            trace = m11 + m22 + m33,
            s;

        if ( trace > 0 ) {

            s = 0.5 / Math.sqrt( trace + 1.0 );

            q.w = 0.25 / s;
            q.x = ( m32 - m23 ) * s;
            q.y = ( m13 - m31 ) * s;
            q.z = ( m21 - m12 ) * s;

        } else if ( m11 > m22 && m11 > m33 ) {

            s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

            q.w = ( m32 - m23 ) / s;
            q.x = 0.25 * s;
            q.y = ( m12 + m21 ) / s;
            q.z = ( m13 + m31 ) / s;

        } else if ( m22 > m33 ) {

            s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

            q.w = ( m13 - m31 ) / s;
            q.x = ( m12 + m21 ) / s;
            q.y = 0.25 * s;
            q.z = ( m23 + m32 ) / s;

        } else {

            s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

            q.w = ( m21 - m12 ) / s;
            q.x = ( m13 + m31 ) / s;
            q.y = ( m23 + m32 ) / s;
            q.z = 0.25 * s;

        }
}

CameraBase.prototype.lookAt = function () {

    // This routine does not support cameras with rotated and/or translated parent(s)

    //var m1 = new Matrix4();

    return function ( centerX, centerY, centerZ ) {

        this.viewMatrix.setLookAt( this.position[0], this.position[1], this.position[2], centerX, centerY, centerZ, this.up[0], this.up[1],this.up[2] );

//        console.log(this.position);
        this.setQuaternionFromRotationMatrix( this.quaternion, this.viewMatrix );

    };

}();

CameraBase.prototype.updateMatrix = function() {

    this.matrix.setFromQuat(this.quaternion.x,this.quaternion.y,this.quaternion.z,this.quaternion.w);
    this.matrix.scale(this.scale[0],this.scale[1],this.scale[2]);
    var te = this.matrix.elements;
    te[ 12 ] = this.position[0];
    te[ 13 ] = this.position[1];
    te[ 14 ] = this.position[2];

}

CameraBase.prototype.clone = function ( camera ) {

    if ( camera === undefined ) camera = new CameraBase();

    camera.matrixWorldInverse.copy( this.matrixWorldInverse );
    camera.projectionMatrix.copy( this.projectionMatrix );

    return camera;
};

