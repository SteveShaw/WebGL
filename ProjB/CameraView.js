/*Added: surface normal to control light*/
// var VSHADER_SOURCE =
// 'attribute vec4 a_Position;\n' +
// 'attribute vec4 a_Color;\n' +
// 'uniform mat4 u_MvpMatrix;\n' +
// 'varying vec4 v_Color;\n' +
// 'void main() {\n' +
// '  gl_Position = u_MvpMatrix * a_Position;\n' +
// '  v_Color = a_Color;\n' +
// '}\n';

var VSHADER_SOURCE =
        'attribute vec4 a_Position;\n' +
        'attribute vec4 a_Normal;\n' +
		'attribute vec4 a_Color;\n' +
        'uniform mat4 u_MvpMatrix;\n' +
        'uniform mat4 u_NormalMatrix;\n'+ // Transformation matrix of normal
        'uniform vec3 u_LightColor;\n' +
        'uniform vec3 u_LightDirection;\n' +
        'uniform vec3 u_AmbientColor;\n' +
		'uniform bool u_UseLight;\n' +
		'uniform bool u_UseVertexColor;\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        '  gl_Position = u_MvpMatrix * a_Position;\n' +
        ' vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
        // The dot product of the light direction and the normal
        ' float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
        // Calculate the color due to diffuse reflection
        ' vec3 diffuse = u_LightColor * u_AmbientColor * (0.3+0.7*nDotL);\n' +
        // Add the surface colors due to diffuse and ambient reflection
        ' if(u_UseLight) v_Color = vec4(diffuse, 1.0);\n' +
		' else v_Color = vec4(u_AmbientColor, 1.0);\n' +
		'if(u_UseVertexColor) v_Color = a_Color;\n'+
        '}\n';

// Fragment shader program
var FSHADER_SOURCE =
        '#ifdef GL_ES\n' +
        'precision mediump float;\n' +
        '#endif\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        '  gl_FragColor = v_Color;\n' +
        '}\n';

var ANGLE_STEP = 45.0;
var gAngle = [0.0,0.0,0.0,0.0,0.0];
var gMoveOffset = [45.0,45.0,45.0,45.0,45.0];
var gLookAtPos = [0,0,0];
var gUseDynamicCamera = false;
var gDynamicCameraPosition = new Float32Array(3);
var gDynamicCameraLookAt = new Float32Array(3);

var FizzyText = function()
{
    this.message = "Robot Arm";
    this.Base = 0;
    this.Joint1 = 0;
    this.Joint2 = 0;
    this.Joint3 = 0;
    this.teapot = 0;
    this.stop = false;
    this.SpinUp = spinUp;
    this.SpinDown = spinDown;
	this.UseDynamicCamera =false;
	
	this.left = 0.5 * canvas.width / - 2;
	this.right = 0.5 * canvas.width /  2;
	this.top = canvas.height/2;
	this.bottom = canvas.height/-2;
	this.near = 1;
	this.far = 2000;
}

function createGUI(cam)
{
    var text = new FizzyText();
    var gui = new dat.GUI({autoPlace:true});//{autoPlace:true}

	var control = gui.addFolder('Robot Aram');
    // gui.add(text,"message");
    control.add(text,"message");
	
    // var base_controller = gui.add(text,"Base",-180,180)
    var base_controller = control.add(text,"Base",-180,180)
    // var joint1_controller = gui.add(text,"Joint1",-90,90);
    var joint1_controller = control.add(text,"Joint1",-90,90);
    // var joint2_controller = gui.add(text,"Joint2",-90,90);
    var joint2_controller = control.add(text,"Joint2",-90,90);
    // var joint3_controller = gui.add(text,"Joint3",-90,90);
    var joint3_controller = control.add(text,"Joint3",-90,90);
    // var teapot_controller = gui.add(text,"teapot",-30,0);
    var teapot_controller = control.add(text,"teapot",-30,0);
    // var stop_control = gui.add(text,"stop");
    var stop_control = control.add(text,"stop");
    // gui.add(text,"SpinUp");
    control.add(text,"SpinUp");
    // gui.add(text,"SpinDown");
    control.add(text,"SpinDown");

    base_controller.onChange(function(value) {
        gAngle[0] = value;
    })

    joint1_controller.onChange(function(value) {
        gAngle[1] = value;
    })

    joint2_controller.onChange(function(value) {
        gAngle[2] = value;
    })

    joint3_controller.onChange(function(value) {
        gAngle[3] = value;
    })

    teapot_controller.onChange(function(value) {
        gAngle[4] = value;
    })

    stop_control.onChange(function(value) {

        if(value)
        {
            myTmp = gMoveOffset;
            gMoveOffset = [0.0,0.0,0.0,0.0,0.0];
        }
        else
        {
            gMoveOffset = myTmp;
        }
    }
    );
	
	var orthoCtl = gui.addFolder('Frustum Control');
	orthoCtl.add(text,'left',-0.5 * canvas.width/2,0).onChange(
		function(value)
		{
			cam.left = value;
			cam.updateProjectionMatrix();
		}
	)
	
	orthoCtl.add(text,'right',0,0.5 * canvas.width/2).onChange(
		function(value)
		{
			cam.right = value;
			cam.updateProjectionMatrix();
		}
	)
	
	orthoCtl.add(text,'top',0,canvas.height/2).onChange(
		function(value)
		{
			cam.top = value;
			cam.updateProjectionMatrix();
		}
	)
	
	orthoCtl.add(text,'bottom',-canvas.height/2,0).onChange(
		function(value)
		{
			cam.bottom = value;
			cam.updateProjectionMatrix();
		}
	)
	
	orthoCtl.add(text,'near',0,10).onChange(
		function(value)
		{
			cam.near = value;
			cam.updateProjectionMatrix();
			camPerspective.near = value;
			camPerspective.updateProjectionMatrix();
		}
	)
	
	orthoCtl.add(text,'far',2000,5000).onChange(
		function(value)
		{
			cam.far = value;
			cam.updateProjectionMatrix();
			camPerspective.near = value;
			camPerspective.updateProjectionMatrix();
		}
	)
	
	var camCtrl = gui.addFolder('Camera Control');
	camCtrl.add(text,"UseDynamicCamera").onChange(
		function (value)
		{
			gUseDynamicCamera = value;
		}
	);
	
	control.open();
	orthoCtl.open();
	camCtrl.open();
	
	gui.width = 300;
	gui.open();
}

function draw2D(ctx) {
 ctx.clearRect(0, 0, 400, 400);  // Clear <hud>
  // Draw triangle with white lines
  // Draw white letters
 ctx.font = '18px "Times New Roman"';
 ctx.fillStyle = 'rgba(0, 0, 255, 1)';  // Set the letter color
 ctx.fillText('Robot Arm', 25, 25);
 ctx.font = 'bold 12px "Times New Roman"';
 ctx.fillStyle = 'rgba(0, 255, 0, 1)';  // Set the letter color
 ctx.fillText('Camera Movement: ASWD', 25, 50);
 ctx.fillText('Camera view direction : Shift + ASWD', 200, 50);
 ctx.fillText('Mouse --> Left: Drag; Right: Pan; Wheel: Zoom in/out', 25, 70);
}

function main() {

	container = document.getElementById( 'container' );
    canvas = document.createElement( 'canvas' );//document.getElementById('webgl');
    // canvas = document.getElementById('webgl');
	var hud = document.getElementById('hud');
	// hud.removeEventListener('mousedown',null, false);
	var ctx = hud.getContext('2d');
	container.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var SCREEN_WIDTH = window.innerWidth;
    var SCREEN_HEIGHT = window.innerHeight;

    window.addEventListener( 'resize', onWindowResize, false );


    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL left');
        return;
    }


    
    gl.enable(gl.DEPTH_TEST);

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }



    //get vertex shader program's variables
    u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    u_AmbientColor = gl.getUniformLocation(gl.program, 'u_AmbientColor');
	u_UseLight = gl.getUniformLocation(gl.program,'u_UseLight');
	u_UseVertexColor = gl.getUniformLocation(gl.program,'u_UseVertexColor');
	
	gl.uniform1i(u_UseVertexColor,0);

    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    var lightDirection = new Vector3([0.5, 3.0, 4.0]);
    lightDirection.normalize(); // Normalize
    gl.uniform3fv(u_LightDirection, lightDirection.elements);

    //create 3d object
    groupAllVertices();

    createMeshObjects();

    initGLContext(gl);
	
	createCamera(SCREEN_WIDTH,SCREEN_HEIGHT);
	
	createGUI(camOrtho);



    
    camCtrl = new OrbitControls(camPerspective,canvas);
    camCtrl.target[0]=0;
    camCtrl.target[1]=50;
    camCtrl.target[2]=0;

    camCtrlOrtho = new OrbitControls(camOrtho,canvas);
    camCtrlOrtho.target[0]=0;
    camCtrlOrtho.target[1]=50;
    camCtrlOrtho.target[2]=0;
	

    document.onkeydown = function(ev) {
        handleKeys(ev)
    }
    //gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.clearColor(0.6,0.6,0.6,1);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // gl.viewport(0,0,0.5*canvas.width,canvas.height);
    // renderStaticScence(gl,camPerspective);
    // gl.viewport(canvas.width*0.5,0,0.5*canvas.width,canvas.height);
    // renderStaticScence(gl,camOrtho);
	var leftCam = camPerspective;
    var tick = function() {
		draw2D(ctx);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gAngle = animate(gAngle);  // Update the rotation angle
        gl.viewport(0,0,0.5*canvas.width,canvas.height);
		if(gUseDynamicCamera)leftCam = dynamicCam;
		else leftCam = camPerspective;
        renderAnimatedScene(gl, leftCam,gAngle);
        gl.viewport(canvas.width*0.5,0,0.5*canvas.width,canvas.height);
        renderAnimatedScene(gl, camOrtho, gAngle);
        leftCam.updateMatrix();
        camOrtho.updateMatrix();
        camCtrl.update();
        camCtrlOrtho.update();
        requestAnimationFrame(tick, canvas);   // Request that the browser ?calls tick
    };
    tick();
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // gl.viewport(0,0,0.5*canvas.width,canvas.height);
    // renderScence(gl, camPerspective,u_MvpMatrix, currentAngle);
    //    renderScence(gl, aspectRatio,u_MvpMatrix, currentAngle[0]);
    
}

var g_last = Date.now();
var offset = 30;
var horOffset = 20;

function animate(angle) {
    //==============================================================================
    // Calculate the elapsed time
    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;

    // Update the current rotation angle (adjusted by the elapsed time)
    //  limit the angle to move smoothly between +20 and -85 degrees:
    // if(angle[1] >   30.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
    // if(angle[1] <  -30.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
    
    // if(angle[2] > 60 && offset > 0)
    // {
    // offset = -offset;
    // }
    // if(angle[2] < -60 && offset<0)
    // {
    // offset = -offset;
    // }

    angle[0] += (gMoveOffset[0] * elapsed) / 1000.0;
	angle[1] += (gMoveOffset[1] * elapsed) / 2000.0;
	angle[2] += (gMoveOffset[2] * elapsed) / 3000.0;
	angle[3] += (gMoveOffset[3] * elapsed) / 4000.0;
	if(angle[1] > 30.0 && gMoveOffset[1] >0) gMoveOffset[1] = -gMoveOffset[1]
	if(angle[1] < -30.0 && gMoveOffset[1] <0) gMoveOffset[1] = -gMoveOffset[1]
	if(angle[2] > 45.0 && gMoveOffset[2] >0) gMoveOffset[2] = -gMoveOffset[2]
	if(angle[2] < -45.0 && gMoveOffset[2] <0) gMoveOffset[2] = -gMoveOffset[2]
		if(angle[3] > 40.0 && gMoveOffset[3] >0) gMoveOffset[3] = -gMoveOffset[3]
	if(angle[3] < -60.0 && gMoveOffset[3] <0) gMoveOffset[3] = -gMoveOffset[3]
	

    // var yAngle = angle[1];// + (ANGLE_STEP*elapsed)/1000.0;

    // var joint3Angle = angle[2];// + (offset*elapsed)/1000.0;

    // if(angle[3] > 0 && horOffset > 0)
    // {
    // horOffset = -horOffset;
    // }
    // if(angle[3] < -30 && horOffset < 0)
    // {
    // horOffset = -horOffset;
    // }

    // var horMove = angle[3] + (horOffset*elapsed)/1000.0;

    return [angle[0] %= 360,angle[1]%=360, angle[2]%=360, angle[3]%=360, angle[4]];
}

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

function initGLContext(gl)
{
    //create vertex buffer
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, allPts, gl.STATIC_DRAW);
    //Get the storage location of a_Position, assign and enable buffer
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

    var colorBuffer = gl.createBuffer();
	    if (!colorBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
	gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,allColors,gl.STATIC_DRAW);
	 var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
	 if(a_Color < 0) {
	 console.log('Failed to get the storage location of a_Color');
    return -1;
	}
	    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

	
	
  //
    //create normal buffer;
    var normalBuffer = gl.createBuffer();
    if (!normalBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,allNormals,gl.STATIC_DRAW);
    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if(a_Normal < 0) {
        console.log('Failed to get the storage location of a_Normal');
        return -1;
    }
    // Assign the buffer object to a_Color variable
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0,0);
    gl.enableVertexAttribArray(a_Normal);  // Enable the assignment of the buffer object


    var indexBuffer = gl.createBuffer();
    if(!indexBuffer) {
        console.log('Failed to create index buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
    //gl.bindBuffer(gl.ARRAY_BUFFER,null);
}

var modelMatrix = new Matrix4(); // Model matrix
var viewMatrix = new Matrix4();  // View matrix
var projMatrix = new Matrix4();  // Projection matrix
var mvpMatrix = new Matrix4();   // Model view projection matrix
var quatMatrix = new Matrix4();
var normalMatrix = new Matrix4();
var quat = new Quaternion(0,0,0,1);
var qx = new Quaternion(0,0,0,1);
var qy = new Quaternion(0,0,0,1);

function drawCustomColorObject(gl, projectionMatrix, viewMatrix, modelViewMatrix, faceIndexArray)
{
	gl.uniform1i(u_UseVertexColor,1);
    mvpMatrix.set(projectionMatrix).multiply(viewMatrix).multiply(modelViewMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,faceIndexArray,gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES,faceIndexArray.length,gl.UNSIGNED_SHORT,0);
}

function drawObject(gl, projectionMatrix, viewMatrix, modelViewMatrix, faceIndexArray, colorArray)
{

    //enable color
    //console.log(colorArray);
	gl.uniform1i(u_UseVertexColor,0);
	gl.uniform1i(u_UseLight,1);
    gl.uniform3f(u_AmbientColor, colorArray[0],colorArray[1],colorArray[2]);
    mvpMatrix.set(projectionMatrix).multiply(viewMatrix).multiply(modelViewMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,faceIndexArray,gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES,faceIndexArray.length,gl.UNSIGNED_SHORT,0);
}

function renderStaticScence(gl, camera)
{

    modelMatrix.setTranslate(-200,100,-200);
    mvpMatrix.set(camera.projectionMatrix).multiply(camera.viewMatrix).multiply(modelMatrix);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    // Pass the transformation matrix for normal to u_NormalMatrix
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,axisIndices,gl.STATIC_DRAW);



    // Calculate matrix to transform normal based on the model matrix

    modelMatrix.setIdentity();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,panelBaseIndexArray,panelBaseAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,workAreaIndexArray,workAreaAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,bulbIndexArray,bulbAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,lightLargeBaseIndexArray,commonAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,lightBaseIndexArray,commonAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,cable1IndexArray,commonAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,cable2IndexArray,commonAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,cable3IndexArray,commonAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,cable4IndexArray,commonAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,aboutPanelIndexArray,aboutPanelAmbientColor);

    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,robotBaseIndexArray,commonAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,robotMotorIndexArray,robotMotorAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,robotBaseIndexArray,commonAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,joint1IndexArray,jointAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,hand1IndexArray,handAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,joint2IndexArray,jointAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,hand2IndexArray,handAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,joint3IndexArray,jointAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,hand3IndexArray,handAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,teapotIndexArray,teapotAmbientColor);

}

var lineIndexArray = new Uint16Array([0,0]);
function drawAxes(gl,camera,pos_x,pos_y,pos_z, reset) {

	gl.uniform1i(u_UseLight,0);
    if(reset)
    {
        modelMatrix.setTranslate(pos_x,pos_y,pos_z);
    }
    else {

        modelMatrix.translate(pos_x,pos_y,pos_z);
    }


    mvpMatrix.set(camera.projectionMatrix).multiply(camera.viewMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    lineIndexArray[0] = axisIndices[0]
    lineIndexArray[1] = axisIndices[1]
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,lineIndexArray,gl.STATIC_DRAW);
    gl.uniform3f(u_AmbientColor, 1,0,0);
    gl.drawElements(gl.LINES,lineIndexArray.length,gl.UNSIGNED_SHORT,0);
    lineIndexArray[0] = axisIndices[2]
    lineIndexArray[1] = axisIndices[3]
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,lineIndexArray,gl.STATIC_DRAW);
    gl.uniform3f(u_AmbientColor, 0,1,0);
    gl.drawElements(gl.LINES,lineIndexArray.length,gl.UNSIGNED_SHORT,0);
    lineIndexArray[0] = axisIndices[4]
    lineIndexArray[1] = axisIndices[5]
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,lineIndexArray,gl.STATIC_DRAW);
    gl.uniform3f(u_AmbientColor, 0,0,1);
    gl.drawElements(gl.LINES,lineIndexArray.length,gl.UNSIGNED_SHORT,0);
}


function renderAnimatedScene(gl,camera,moveArray)
{
	var vecCamPos = new Vector3(gDynamicCameraPosition);
    var baseAngle = moveArray[0];
    var joint1Angle = moveArray[1];
    var joint2Angle = moveArray[2];
    var joint3Angle = moveArray[3];
    var teapotMove = moveArray[4]

    drawAxes(gl, camera,-200,150,-200,true);
	//draw grid
    modelMatrix.setTranslate(0,-10,0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    mvpMatrix.set(camera.projectionMatrix).multiply(camera.viewMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniform3f(u_AmbientColor, 0x88,0x88,0x88);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,gridIndexArray,gl.STATIC_DRAW);
    gl.drawElements(gl.LINES,gridIndexArray.length,gl.UNSIGNED_SHORT,0);
    // gl.drawElements(gl.LINES,2,gl.UNSIGNED_SHORT,);

	//draw other objects
	modelMatrix.setTranslate(-100,10,120);
	modelMatrix.scale(0.5,0.5,0.5);
	drawCustomColorObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,filmerPart0IndexArray);
	drawCustomColorObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,filmerPart1IndexArray);
	drawCustomColorObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,filmerPart2IndexArray);
	drawCustomColorObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,filmerPart3IndexArray);
	drawCustomColorObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,filmerPart4IndexArray);


    //draw static scene
    modelMatrix.setIdentity();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,panelBaseIndexArray,panelBaseAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,workAreaIndexArray,workAreaAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,bulbIndexArray,bulbAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,lightLargeBaseIndexArray,commonAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,lightBaseIndexArray,commonAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,cable1IndexArray,commonAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,cable2IndexArray,commonAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,cable3IndexArray,commonAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,cable4IndexArray,commonAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,aboutPanelIndexArray,aboutPanelAmbientColor);

    //draw animated scene
    quat.setFromAxisAngle(0,1,0,baseAngle);
    quatMatrix.setFromQuat(quat.x,quat.y,quat.z,quat.w);
    modelMatrix.translate(0.68738,18.23025,-0.35170);
    modelMatrix.concat(quatMatrix);
    modelMatrix.translate(-0.68738,-18.23025,0.35170);
	//new added 
	vecCamPos.elements.set(modelMatrix.multiplyVector3(vecCamPos).elements);
	
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    // Pass the transformation matrix for normal to u_NormalMatrix
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,robotBaseIndexArray,commonAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,robotMotorIndexArray,robotMotorAmbientColor);

    //rotate around joint1
    quat.setFromAxisAngle(0,0,1,joint1Angle);
    quatMatrix.setFromQuat(quat.x,quat.y,quat.z,quat.w);
    modelMatrix.translate(0.56308,18.18293,19.58883);
    modelMatrix.concat(quatMatrix);
    modelMatrix.translate(-0.56308,-18.18293,-19.58883);
    pushMatrix(modelMatrix);
    drawAxes(gl, camera,-0.52241,45.48640,20.04135,false);
    modelMatrix = popMatrix();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    // Pass the transformation matrix for normal to u_NormalMatrix
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,joint1IndexArray,jointAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,hand1IndexArray,handAmbientColor);

    //rotate around joint2
    quat.setFromAxisAngle(0,0,1,joint2Angle);
    quatMatrix.setFromQuat(quat.x,quat.y,quat.z,quat.w);
    modelMatrix.translate(0.35386,78.20634,13.51596);
    modelMatrix.concat(quatMatrix);
    modelMatrix.translate(-0.35386,-78.20634,-13.51596);
    pushMatrix(modelMatrix);
    drawAxes(gl, camera,-32.10315,90.55626,5.68675,false);
    modelMatrix = popMatrix();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    // Pass the transformation matrix for normal to u_NormalMatrix
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,joint2IndexArray,jointAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,hand2IndexArray,handAmbientColor);


    //rotate around joint3
    quat.setFromAxisAngle(0,0,1,joint3Angle);
    quatMatrix.setFromQuat(quat.x,quat.y,quat.z,quat.w);
    modelMatrix.translate(-61.64525,101.05690,13.22025);
    modelMatrix.concat(quatMatrix);
    modelMatrix.translate(61.64525,-101.05690,-13.22025);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    // Pass the transformation matrix for normal to u_NormalMatrix
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,joint3IndexArray,jointAmbientColor);

    modelMatrix.translate(-59.21120,101.23849,23.00860);
    modelMatrix.translate(teapotMove,0,0);
    modelMatrix.translate(59.21120,-101.23849,-23.00860);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    // Pass the transformation matrix for normal to u_NormalMatrix
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,hand3IndexArray,handAmbientColor);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,teapotIndexArray,teapotAmbientColor);
	
	if(gUseDynamicCamera)
	{
		//change dynamic camera's position
		dynamicCam.position.set(vecCamPos.elements);
		//var vecLookAtPos = new Vector3(gDynamicCameraLookAt);
		//gDynamicCameraLookAt.set(modelMatrix.multiplyVector3(vecLookAtPos).elements);
		dynamicCam.lookAt(gDynamicCameraLookAt[0],gDynamicCameraLookAt[1],gDynamicCameraLookAt[2]);
		dynamicCam.updateProjectionMatrix();
	}
}

function createCamera(width, height)
{
    camPerspective = new PerspectiveCamera(45,0.5*width/height,1,2000);
    camPerspective.position.set([0,200,500]);
    camPerspective.lookAt(0.0,0.0,0.0);
    camPerspective.aspect = 0.5*width/ height;
    camPerspective.updateProjectionMatrix();
    //camOrtho = new OrthographicCamera( 0.5 * width / - 2, 0.5 * width / 2, height / 2, height / - 2, 1, 2000 );
    camOrtho = new OrthographicCamera( 0.5 * width / - 2, 0.5 * width / 2, height / 2, height / - 2, 1, 2000 );
    camOrtho.up.set([0,1,0]);
    camOrtho.position.set([0,200,500]);
    camOrtho.lookAt(0.0,0.0,0.0);
	
		dynamicCam = new PerspectiveCamera(35,0.5*width/height,1,2000);
		dynamicCam.position.set([-102.43767,107.63019,22.75545]);
		gDynamicCameraPosition.set([-102.43767,107.63019,22.75545]);
		dynamicCam.aspect = 0.5*width/ height;
		// dynamicCam.lookAt(-300,115,22.75545);
		dynamicCam.lookAt(0,0,0);
		dynamicCam.updateProjectionMatrix();
		gDynamicCameraLookAt.set([0,0,0]);
	

    // console.log(cam.projectionMatrix.elements);
    // console.log(cam.viewMatrix.elements);
}




function createAxis()
{
    // axisVertices = new Float32Array( [
    // 0, 0, 0,  1, 1,0,0,
    // 50, 0, 0, 1,1,0.6,0,
    // 0, 0, 0,  1, 0,1,0,
    // 0, 50, 0, 1, 0.6,1,0,
    // 0, 0, 0,  1, 0,0,1,
    // 0, 0, 50, 1, 0,0.6,1,
    // ] );

    axisVertices = new Float32Array( [
                                        0, 0, 0,  1, //1,0,0,
                                        50, 0, 0, 1,//1,0.6,0,
                                        0, 0, 0,  1, //0,1,0,
                                        0, 50, 0, 1, //0.6,1,0,
                                        0, 0, 0,  1, //0,0,1,
                                        0, 0, 50, 1, //0,0.6,1,
                                    ] );

    axisColors = new Float32Array(
                [
                    1,0,0,
                    1,0.6,0,
                    0,1,0,
                    0.6,1,0,
                    0,0,1,
                    0,0.6,1,
                ]
                )

    axisNormals = new Float32Array(
                [
                    1,1,0,
                    1,1,1,
                    1,1,1,
                    1,1,1,
                    1,1,1,
                    1,1,1
                ]
                )
    axisIndices = new Uint16Array(
                [
                    0,1,2,3,4,5,
                ]
                );
}

function copyArrays(srcArray, dstArray, offset)
{
	for(var j = 0; j<srcArray.length; ++j)
	{
		dstArray[j+offset] = srcArray[j];
	}
}

function setArrays(dstArray, val, len)
{
	for(var j = 0;j< len;++j)
	{
		dstArray[j] = val;
	}
}

function setRandomValues(dstArray,len,offset)
{
	for(var i = 0;i<len;++i)
	{
		dstArray[offset+i]=Math.random();
	}
}

function groupAllVertices()
{
    createRobotArm();
    createAxis();
    genGrid(300, 30);
	createOtherObjects();

    var total_vertex_length = robotArmVertexArray.length + axisVertices.length + gridVertexArray.length + filmerVertexArray.length;
	var total_normal_length = total_vertex_length/4*3;
	
    allPts = new Float32Array(total_vertex_length);
    allNormals = new Float32Array(total_normal_length);
	allColors = new Float32Array(total_normal_length);
	
	//copy vertex 
	var offset = 0;
	copyArrays(robotArmVertexArray,allPts,offset);
    offset += robotArmVertexArray.length;
	copyArrays(axisVertices,allPts,offset);
	offset += axisVertices.length;
	copyArrays(gridVertexArray,allPts,offset);
	offset += gridVertexArray.length;
	copyArrays(filmerVertexArray,allPts,offset);
	
	//copy normal and color
	setArrays(allColors,1,allNormals.length);
	setArrays(allNormals,1,allNormals.length);
	offset = 0;
	copyArrays(robotArmNormalArray,allNormals,offset);
	offset += robotArmNormalArray.length;
	copyArrays(axisNormals,allNormals,offset);
	offset += axisNormals.length;
	copyArrays(gridNormalArray,allNormals,offset);
	offset += gridNormalArray.length;
	setRandomValues(allColors,filmerVertexArray.length/4*3,offset);
	//copyArrays(filmerColorArray,allColors,offset);
	
	
    //	console.log(cubeVt.length);
	//set index
    offset = robotArmVertexArray.length/4
    for(var i = 0; i< axisIndices.length; ++i)
    {
        axisIndices[i] += offset;
    }
    offset += axisVertices.length/4;
    for(var i = 0; i< gridIndexArray.length; ++i)
    {
        gridIndexArray[i] +=  offset;
    }
	offset += gridVertexArray.length/4;
    for(var i = 0; i< filmerPart0IndexArray.length; ++i)
    {
        filmerPart0IndexArray[i] += offset;
    }
    for(var i = 0; i< filmerPart1IndexArray.length; ++i)
    {
        filmerPart1IndexArray[i] +=  offset;
    }
	for(var i = 0; i< filmerPart2IndexArray.length; ++i)
    {
        filmerPart2IndexArray[i] +=  offset;
    }
	for(var i = 0; i< filmerPart3IndexArray.length; ++i)
    {
        filmerPart3IndexArray[i] +=  offset;
    }
	for(var i = 0; i< filmerPart4IndexArray.length; ++i)
    {
        filmerPart4IndexArray[i] +=  offset;
    }
	
    console.log(allColors.length);
}

function handleKeys(event) {

    var offset = 10;

    if(event.shiftKey) {
        switch(event.keyCode) {//determine the key pressed
        case 65://a key
        case 37://left arrow
            camCtrl.target[0] -= offset;
			camCtrlOrtho.target[0] -= offset;			
            break;
        case 68://d key
        case 39://right arrow
            camCtrl.target[0] += offset;
			camCtrlOrtho.target[0] += offset;			
            break;
        case 83://s key
        case 40://down arrow
            camCtrl.target[1] -= offset;
			camCtrlOrtho.target[1] -= offset;			
            break;
        case 87://w key
        case 38://up arrow
            camCtrl.target[1] += offset;
			camCtrlOrtho.target[1] += offset;			
            break;
        }
    }
    else {

        switch(event.keyCode) {//determine the key pressed
        case 65://a key
        case 37://left arrow
            camPerspective.position[0]-=offset;
			camCtrl.target[0]-=offset;
			camOrtho.position[0]-=offset;
			camCtrlOrtho.target[0]-=offset;
            break;
        case 68://d key
        case 39://right arrow
            camPerspective.position[0]+=offset;
			camCtrl.target[0]+=offset;
			camOrtho.position[0]+=offset;
			camCtrlOrtho.target[0]+=offset;			
            break;
        case 83://s key
            camPerspective.position[1]-=offset;
			camCtrl.target[1]-=offset;
			camOrtho.position[1]-=offset;
			camCtrlOrtho.target[1]-=offset;			
            break;
        case 40://down arrow
            camPerspective.position[2]+=offset;
			camCtrl.target[2]+=offset;
			camOrtho.position[2]+=offset;
			camCtrlOrtho.target[2]+=offset;			
            break;
        case 87://w key
            camPerspective.position[1]+=offset;
			camCtrl.target[1]+=offset;
			camOrtho.position[1]+=offset;
			camCtrlOrtho.target[1]+=offset;			
            break;
        case 38://up arrow
            camPerspective.position[2]-=offset;
			camCtrl.target[2]-=offset;
			camOrtho.position[2]-=offset;
			camCtrlOrtho.target[2]-=offset;			
            break;
        }
    }
    //camPerspective.lookAt(gLookAtPos[0], gLookAtPos[1], gLookAtPos[2]);
    //camCtrl.target[0] = gLookAtPos[0];
    //camCtrl.target[1] = gLookAtPos[1];
    //camCtrl.target[2] = gLookAtPos[2];

    //camPerspective.updateMatrix();
    //camCtrl.update();

    // console.log(event.keyCode);
    //renderScence(gl,ratio,u_MvpMatrix,angle);
}


//Event Handler
function onWindowResize( event ) {

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    //renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;


    //gl.viewport(0,0,SCREEN_WIDTH*0.5,SCREEN_HEIGHT);

    camPerspective.aspect = 0.5*SCREEN_WIDTH/ SCREEN_HEIGHT;
    camPerspective.updateProjectionMatrix();

    camOrtho.left   = - 0.5 * SCREEN_WIDTH / 2;
    camOrtho.right  =   0.5 * SCREEN_WIDTH / 2;
    camOrtho.top    =   SCREEN_HEIGHT / 2;
    camOrtho.bottom = - SCREEN_HEIGHT / 2;
    camOrtho.updateProjectionMatrix();

    //renderScence(gl, camPerspective, camPerspective.aspect,u_MvpMatrix, currentAngle);
}
