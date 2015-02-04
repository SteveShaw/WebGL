//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda
// became:
//
// ColoredMultiObject.js  MODIFIED for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin
//		--converted from 2D to 4D (x,y,z,w) vertices
//		--demonstrate how to keep & use MULTIPLE colored shapes in just one
//			Vertex Buffer Object(VBO). 
//		--demonstrate 'nodes' vs. 'vertices'; geometric corner locations where
//				OpenGL/WebGL requires multiple co-located vertices to implement the
//				meeting point of multiple diverse faces.
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'uniform mat4 u_ColorMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 1.0;\n' +
  '  v_Color = u_ColorMatrix * a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variable -- Rotation angle rate (degrees/second)
var ANGLE_STEP = 45.0;

var floatsPerVertex = 7;

var FizzyText = function()
{
    this.message = "Twisted Snake";
    this.twist = 90;
    this.stop = false;
    this.SpinUp = spinUp;
    this.SpinDown = spinDown;
    this.Color = false;
}

var r = 0.5;
var g = 0.5;
var b = 0.5;

var changeColor = false;

// Global vars for mouse click-and-drag for rotation.
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;

function main() {
//============================================================================
  // Retrieve <canvas> element
    var text = new FizzyText();
    var gui = new dat.GUI({autoPlace:true});
    gui.add(text,"message");
    var twist_controller = gui.add(text,"twist",0,180);
    var stop_control = gui.add(text,"stop");
    var color_control = gui.add(text,"Color");
    //var stop_color = gui.add(text,"SameColor");
    gui.add(text,"SpinUp");
    gui.add(text,"SpinDown");

    var twist_angle = text.twist;


    twist_controller.onChange(function(value)
    {
        twist_angle = value;
        document.getElementById("Info").innerHTML = "Twist Angle = "+value;
    })

    stop_control.onChange(function(value)
        {
            if(value)
            {
                myTmp = ANGLE_STEP;
                ANGLE_STEP = 0;
            }
            else
            {
                ANGLE_STEP = myTmp;
            }
        }
    );

    color_control.onChange(function(value)
        {
            changeColor = value;
        }
    );

  document.getElementById("Info").innerHTML = "Twist Angle = 90";
  var canvas = document.getElementById('webgl');

    canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) };

    // when user's mouse button goes down call mouseDown() function
    canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };

    // call mouseMove() function
    canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // 
  var n = initVertexBuffer(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);
	gl.enable(gl.DEPTH_TEST);
	
  // Get handle to graphics system's storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();

  var colorMatrix = new Matrix4();

    var u_ColorMatrix = gl.getUniformLocation(gl.program, 'u_ColorMatrix');
    if (!u_ColorMatrix) {
        console.log('Failed to get the storage location of u_ColorMatrix');
        return;
    }
  
  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;

//-----------------  

  //Start drawing: create 'tick' variable whose value is this function:
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix,colorMatrix, u_ColorMatrix,twist_angle);   // Draw shapes
    requestAnimationFrame(tick, canvas);
    									// Request that the browser re-draw the webpage
  };
  tick();							// start (and continue) animation: draw current image

    //draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);

	
}

function getRandomColor() {
    return Math.random()*(1-0.0)-0.5;
}



function makeHexgon()
{


    var len = 0.02;
    var mid = len*Math.cos(Math.PI/3);
    var h = len*Math.sin(Math.PI/3)
    var z = 0.05;

    hexgonVertexes = new Float32Array(
        [
            0,0,z,1, r,g,b, //v0
            len,0,z,1, 0,g,b, //v1
            mid,h,z,1,r,b,0, //v2

            0,0,z,1, r,g,b, //v0
            mid,h,z,1,r,b,0, //v2
            -mid,h,z,1,0,0,g, //v3;

            0,0,z,1, r,g,b, //v0
            -mid,h,z,1,r,0,g, //v3
            -len,0,z,1,0,b,0, //v4

            0,0,z,1, r,g,b, //v0
            -len,0,z,1,r,b,0, //v4
            -mid,-h,z,1,0,b,g, //v5

            0,0,z,1, r,g,b, //v0
            -mid,-h,z,1,0,b,g, //v5
            mid,-h,z,1,r,0,g,//v6

            0,0,z,1, r,g,b, //v0
            mid,-h,z,1,r,0,g,//v6
            len,0,z,1, 0,g,b, //v1

            len,0,z,1, 0,g,b, //v1
            len,0,-z,1, r,g,b, //v7
            mid,h,-z,1,0,b,0, //v8
            //
            len,0,z,1, 0,g,b, //v1
            mid,h,z,1,r,b,0, //v2
            mid,h,-z,1,0,b,0, //v8
            //
            mid,h,z,1,r,b,0, //v2
            mid,h,-z,1,0,b,0, //v8
            -mid,h,z,1,r,0,g, //v3
            //
            -mid,h,z,1,0,0,g, //v3
            mid,h,-z,1,0,b,0, //v8
            -mid,h,-z,1,0,0,g, //v9
            //
            -mid,h,z,1,r,0,g, //v3
            -mid,h,-z,1,0,0,g, //v9
            -len,0,z,1,r,b,0, //v4

            -mid,h,-z,1,0,0,g, //v9
            -len,0,-z,1,0,b,0, //v10
            -len,0,z,1,r,b,0, //v4
            //
            //
            -len,0,z,1,r,b,0, //v4
            -len,0,-z,1,0,b,0, //v10
            -mid,-h,z,1,0,b,g, //v5


            -len,0,-z,1,0,b,0, //v10
            -mid,-h,-z,1,r,b,g, //v11
            -mid,-h,z,1,0,b,g, //v5
            //
            mid,-h,z,1,r,0,g,//v6
            -mid,-h,z,1,0,b,g, //v5
            -mid,-h,-z,1,r,b,g, //v11
            //
            -mid,-h,-z,1,r,b,g, //v11
            mid,-h,-z,1,0,0,g,//v12
            mid,-h,z,1,r,0,g,//v6

            //
            mid,-h,-z,1,r,0,g,//v12
            len,0,z,1, 0,g,b, //v1
            mid,-h,z,1,0,0,g,//v6
            //
            mid,-h,-z,1,r,0,g,//v12
            len,0,-z,1, r,g,b, //v7
            len,0,z,1, 0,g,b, //v1

        ]
    );


}

function initVertexBuffer(gl) {
//==============================================================================
	var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);
    var s60 = Math.sin(Math.PI/3);

    var len = 0.2;//0.6*s60;
    var z = 0.05;



    //console.log(len);


    //makeCylinder();
    makeHexgon();

    var triangle_cyls = new Float32Array(
        [


            -len,0, z,1.0,     r,g,b,  //Node 0
            len,0, z, 1.0,     r,0.0,0.0,  //Node 1
            0,len, z,1.0,       0.0,g,b, //Node 2
            //
            0,len, z,1.0,       0.0,g,b, //Node 2
            0.2,0.0, z, 1.0,     r,0.0,0.0,  //Node 1
            0.2,0.0, -z, 1.0,      r,g,b, //Node 4
            //0.0,len, -0.3,1.0,        0.0,0.1,1.0,// Node 5

            //
            0.2,0.0, -z, 1.0,      r,g,b, //Node 4
            0.0,len, -z,1.0,        r,0,b,// Node 5
            0,len, z,1.0,       0.0,g,b, //Node 2
            //
            //
            -0.2,0.0, -z, 1.0,     r,b,0, //Node 3
            0.0,len, -z,1.0,        r,0,b,// Node 5
            0.2,0.0, -z, 1.0,      r,g,b, //Node 4

            //0.3,0.3, -0.3, 1.0,      1.0,0.0,0.0, //Node 4
            //
            -0.2,0.0, -z, 1.0,     r,b,0, //Node 3
            0,len, z,1.0,       0.0,g,b, //Node 2
            0.0,len, -z,1.0,        r,0,b,// Node 5
            //
            //
            -0.2,0.0, z,1.0,     r,g,b,  //Node 0
            0,len, z,1.0,       0.0,g,b, //Node 2
            -0.2,0.0, -z, 1.0,     r,b,0, //Node 3






            //-0.3,0.3, -0.3, 1.0,     1.0,1.0,1.0,
            //0.3,0.3, -0.3, 1.0,      1.0,0.0,0.0,
            //0.0,len, -0.3,1.0,        0.0,0.1,1.0,




            //
            //0.3,-0.3, 0.0, 1.0,     0.5,0.2,0.3,
            //0.3,0.3, 0.0,1.0,     1.0,0.0,0.0,
            //len, 0.0,0.0,1.0,       0,0.0,1.0,1.0,
            //
            //
            //
            //
            //
            //0.3,-0.3, -0.3, 1.0,     0.5,0.2,0.3,
            //0.3,0.3, -0.3,1.0,     1.0,0.0,0.0,
            //len, 0.0,-0.3,1.0,       0,0.0,1.0,1.0,


        ]

    );

    var nn = 18;

    var total_size = hexgonVertexes.length+ triangle_cyls.length;

    console.log("length="+hexgonVertexes.length);

    var colorShapes = new Float32Array(total_size);

    for(i = 0,j = 0;j<triangle_cyls.length;++i,++j)
    {
        colorShapes[j] = triangle_cyls[j];
    }

    hvStart = i;

    for(j = 0;j<hexgonVertexes.length;++j,++i)
    {
        colorShapes[i] = hexgonVertexes[j];
    }


  // Create a buffer object
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }



    // Use handle to specify how to retrieve position data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);  
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w
  									
  gl.enableVertexAttribArray(a_Color);  
  									// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
}

var count = 0;

function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix, colorMatrix, u_ColorMatrix, twist_angle) {
//==============================================================================
    //var offset = Math.sin(Math.PI/3)*0.6;
    var offset = 0.21;

    // Clear <canvas>  colors AND the depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);




    if(changeColor==true)
    {
        var scaleR = getRandomColor();
        var scaleG = getRandomColor();
        var scaleB = getRandomColor();
        if(currentAngle>0 && currentAngle<1)
        {
            colorMatrix.setTranslate(scaleR, scaleG, scaleB);
        }


    }
    else
    {
        colorMatrix.setIdentity();
    }


    gl.uniformMatrix4fv(u_ColorMatrix,false,colorMatrix.elements);

    document.getElementById("RunTimeInfo").innerHTML = "Current Angle = "+currentAngle;

    //-------Draw Spinning Tetrahedron
    modelMatrix.setRotate(currentAngle,0,0,1);  // 'set' means DISCARD old matrix,
    // (drawing axes centered in CVV), and then make new
    // drawing axes moved to the lower-left corner of CVV.
    //modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
    // to match WebGL display canvas.
    //modelMatrix.scale(0.5, 0.5, 0.5);
    // if you DON'T scale, tetra goes outside the CVV; clipped!
    //modelMatrix.rotate(currentAngle, 1, 0, 0);  // Make new drawing axes that
    //modelMatrix.rotate(-currentAngle,1,0,0);
    //modelMatrix.setIdentity();
    modelMatrix.rotate(currentAngle+twist_angle, 1, 0, 0);  // Make new drawing axes that
    modelMatrix.translate(0.0,offset, 0.0);  // 'set' means DISCARD old matrix,

    var dist = Math.sqrt(xMdragTot*xMdragTot + yMdragTot*yMdragTot);
    modelMatrix.rotate(dist*120.0, -yMdragTot+0.0001, xMdragTot+0.0001, 0.0);


    //modelMatrix.rotate(currentAngle,0,0 ,1);
    //modelMatrix.rotate(20.0, 0,1,0);
    // that spin around y axis (0,1,0) of the previous
    // drawing axes, using the same origin.

    // DRAW TETRA:  Use this matrix to transform & draw
    //						the first set of vertices stored in our VBO:
    // Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    // Draw just the first set of vertices: start at vertex 0...
    gl.drawArrays(gl.TRIANGLES, 0, n);

    pushMatrix(modelMatrix);

    //modelMatrix.rotate(90,0,0,1);
    //modelMatrix.setIdentity();

    //modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
    // to match WebGL display canvas.
    //modelMatrix.scale(0.2, 0.2, 1);
    //// if you DON'T scale, cyl goes outside the CVV; clipped!
    modelMatrix.rotate(currentAngle+twist_angle, 1, 0, 0);  // spin around y axis.
    modelMatrix.translate(offset,0,0);
    //// Drawing:
    //// Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    //// Draw just the the cylinder's vertices:
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
        hvStart/floatsPerVertex, // start at this vertex number, and
        hexgonVertexes.length/floatsPerVertex);	// draw this many vertices.

    //return;

    modelMatrix = popMatrix();

    modelMatrix.rotate(currentAngle+twist_angle, 1, 0, 0);  // Make new drawing axes that
    modelMatrix.translate(offset,-offset,0);
    modelMatrix.rotate(-90,0,0,1);

    //modelMatrix.translate(0.0,offset,0.0)

    //modelMatrix.scale(0.5, 0.5, 0.5);
    //modelMatrix.rotate(currentAngle, 1, 0, 0);  // Make new drawing axes that
    //modelMatrix.rotate(currentAngle-90, 1, 0, 1);  // Make new drawing axes that
    //modelMatrix.translate(-offset,0, 0.0);  // 'set' means DISCARD old matrix,

    //modelMatrix.rotate(90-currentAngle,0,0 ,1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, n);


    //draw another joint
    pushMatrix(modelMatrix);
    modelMatrix.rotate(currentAngle+twist_angle, 1, 0, 0);  // spin around y axis.
    modelMatrix.translate(offset,0,0);
    //// Drawing:
    //// Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    //// Draw just the the cylinder's vertices:
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
        hvStart/floatsPerVertex, // start at this vertex number, and
        hexgonVertexes.length/floatsPerVertex);	// draw this many vertices.


    modelMatrix = popMatrix();
    //modelMatrix.setTranslate(0,0,0);
    //modelMatrix.setRotate(-180,0,0,1);
    modelMatrix.rotate(currentAngle+twist_angle, 1, 0, 0);  // Make new drawing axes that
    modelMatrix.translate(offset,-offset,0);
    //modelMatrix.rotate(currentAngle, 1, 0, 0);  // Make new drawing axes that

    //modelMatrix.translate(0.0,0.0, 0.0);  // 'set' means DISCARD old matrix,
    modelMatrix.rotate(-90, 0, 0, 1);  // Make new drawing axes that
    //modelMatrix.rotate(-currentAngle,0,0 ,1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, n);

    //return;

    //draw another joint
    pushMatrix(modelMatrix);
    modelMatrix.rotate(currentAngle+twist_angle, 1, 0, 0);  // spin around y axis.
    modelMatrix.translate(offset,0,0);
    //// Drawing:
    //// Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    //// Draw just the the cylinder's vertices:
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
        hvStart/floatsPerVertex, // start at this vertex number, and
        hexgonVertexes.length/floatsPerVertex);	// draw this many vertices.

    //modelMatrix.setTranslate(0,0,0);
    //modelMatrix.setRotate(90,0,0,1);
    modelMatrix = popMatrix();
    modelMatrix.rotate(currentAngle+twist_angle, 1, 0, 0);  // Make new drawing axes that
    modelMatrix.translate(offset,-offset,0);
    modelMatrix.rotate(-90,0,0,1);
    //modelMatrix.rotate(currentAngle, 1, 0, 0);  // Make new drawing axes that

    //modelMatrix.translate(0.0,0.0, 0.0);  // 'set' means DISCARD old matrix,
    //modelMatrix.rotate(currentAngle, 0, 0, 1);  // Make new drawing axes that
    //modelMatrix.rotate(currentAngle, 1, 0, 1);  // Make new drawing axes that

    //modelMatrix.rotate(90+currentAngle,0,0 ,1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, n);

    //draw another joint

    modelMatrix.rotate(currentAngle+twist_angle, 1, 0, 0);  // spin around y axis.
    modelMatrix.translate(offset,0,0);
    //// Drawing:
    //// Pass our current matrix to the vertex shaders:
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    //// Draw just the the cylinder's vertices:
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
        hvStart/floatsPerVertex, // start at this vertex number, and
        hexgonVertexes.length/floatsPerVertex);	// draw this many vertices.

    //gl.drawArrays(gl.TRIANGLES, 3, 3);
    //gl.drawArrays(gl.TRIANGLES, 6, 3);

    // NEXT, create different drawing axes, and...
    //modelMatrix.setTranslate(0.4, 0.4, 0.0);  // 'set' means DISCARD old matrix,
    //// (drawing axes centered in CVV), and then make new
    //// drawing axes moved to the lower-left corner of CVV.
    //modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
    //// to match WebGL display canvas.
    //modelMatrix.scale(0.3, 0.3, 0.3);
    //// Make it smaller:
    //modelMatrix.rotate(currentAngle, 1, 1, 0);  // Spin on XY diagonal axis
    //// DRAW CUBE:		Use ths matrix to transform & draw
    ////						the second set of vertices stored in our VBO:
    //gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    //// Draw just the first set of vertices: start at vertex SHAPE_0_SIZE
    //gl.drawArrays(gl.TRIANGLES, 12,36);
}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
//  if(angle >  120.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
//  if(angle < -120.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

//==================HTML Button Callbacks
function spinUp() {
  ANGLE_STEP += 25; 
}

function spinDown() {
 ANGLE_STEP -= 25; 
}

function runStop() {
  if(ANGLE_STEP*ANGLE_STEP > 1) {
    myTmp = ANGLE_STEP;
    ANGLE_STEP = 0;
  }
  else {
  	ANGLE_STEP = myTmp;
  }
}

function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
    var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);

    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
        (canvas.width/2);			// normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
        (canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);

    isDrag = true;											// set our mouse-dragging flag
    xMclik = x;													// record where mouse-dragging began
    yMclik = y;
};


function myMouseMove(ev, gl, canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)

    if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

    // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
    var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);

    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
        (canvas.width/2);			// normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
        (canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

    // find how far we dragged the mouse:
    xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
    yMdragTot += (y - yMclik);
    xMclik = x;													// Make next drag-measurement from here.
    yMclik = y;
};

function myMouseUp(ev, gl, canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
    var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);

    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
        (canvas.width/2);			// normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
        (canvas.height/2);
    console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);

    isDrag = false;											// CLEAR our mouse-dragging flag, and
    // accumulate any final bit of mouse-dragging we did:
    xMdragTot += (x - xMclik);
    yMdragTot += (y - yMclik);
};