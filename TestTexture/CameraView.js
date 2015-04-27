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
		'#define mabs(x) (x<0?-x:x)\n'+
        'attribute vec4 a_Position;\n' +
        'attribute vec4 a_Normal;\n' +
		'attribute vec2 a_TexCoord;\n'+
		'varying vec2 v_TexCoord;\n'+
        'uniform mat4 u_MvpMatrix;\n' +
        'uniform mat4 u_NormalMatrix;\n'+ // Transformation matrix of normal
        'uniform vec3 u_LightColor;\n' +
        'uniform vec3 u_LightDirection;\n' +
        'uniform vec3 u_AmbientColor;\n' +
		'uniform bool u_UseLight;\n' +
		'uniform bool u_UseVertexColor;\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
		'int x=-2;\n'+
		'int y=mabs(x);\n'+
		'  gl_Position = u_MvpMatrix * a_Position;\n' +
		' v_TexCoord = a_TexCoord;\n'+
        ' vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
        // The dot product of the light direction and the normal
        ' float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
        // Calculate the color due to diffuse reflection
        ' vec3 diffuse = u_LightColor * u_AmbientColor * (0.3+0.7*nDotL);\n' +
        // Add the surface colors due to diffuse and ambient reflection
        ' if(u_UseLight) v_Color = vec4(diffuse, 1.0);\n' +
		' else v_Color = vec4(u_AmbientColor, 1.0);\n' +
        '}\n';

// Fragment shader program
var FSHADER_SOURCE =
        '#ifdef GL_ES\n' +
        'precision mediump float;\n' +
        '#endif\n' +
        'varying vec4 v_Color;\n' +
        'varying vec2 v_TexCoord;\n' +
        'uniform sampler2D u_Sampler;\n' +
        'uniform bool u_UseTexture;\n' +
        'void main() {\n' +
				'if(u_UseTexture)\n'+
        '  gl_FragColor = v_Color*texture2D(u_Sampler,v_TexCoord);\n' +
				'else\n'+
				' gl_FragColor = v_Color;\n'+
        '}\n';

var ANGLE_STEP = 45.0;
var gAngle = [0.0,0.0,0.0,0.0,0.0];
var gMoveOffset = [45.0,45.0,45.0,45.0,45.0];
var gLookAtPos = [0,0,0];

function main() {

	container = document.getElementById( 'container' );
    canvas = document.createElement( 'canvas' );//document.getElementById('webgl');
    // canvas = document.getElementById('webgl');
//	var hud = document.getElementById('hud');
	// hud.removeEventListener('mousedown',null, false);
//	var ctx = hud.getContext('2d');
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
	u_Sampler = gl.getUniformLocation(gl.program,'u_Sampler');
	u_UseTexture = gl.getUniformLocation(gl.program,'u_UseTexture');
	
	gl.uniform1i(u_UseVertexColor,0);

    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    var lightDirection = new Vector3([0.5, 3.0, 4.0]);
    lightDirection.normalize(); // Normalize
    gl.uniform3fv(u_LightDirection, lightDirection.elements);

    //create 3d object
    groupAllVertices();

    initGLContext(gl);
	initTextures(gl);
	
	createCamera(SCREEN_WIDTH,SCREEN_HEIGHT);
	
    
    camCtrl = new OrbitControls(camPerspective,canvas);
    camCtrl.target[0]=0;
    camCtrl.target[1]=50;
    camCtrl.target[2]=0;

    document.onkeydown = function(ev) {
        handleKeys(ev)
    }
    //gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.clearColor(0.2,0.2,0.2,1);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // gl.viewport(0,0,0.5*canvas.width,canvas.height);
    // renderStaticScence(gl,camPerspective);
    // gl.viewport(canvas.width*0.5,0,0.5*canvas.width,canvas.height);
    // renderStaticScence(gl,camOrtho);
    var tick = function() {
//		draw2D(ctx);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gAngle = animate(gAngle);  // Update the rotation angle
        gl.viewport(0,0,canvas.width,canvas.height);
        renderAnimatedScene(gl, camPerspective,gAngle);
       camPerspective.updateMatrix();
        camCtrl.update();
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

function loadTexture(gl,texture,image)
{
	gl.bindTexture(gl.TEXTURE_2D,texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
	gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
	gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
	gl.bindTexture(gl.TEXTURE_2D,null);
}

function initTextures(gl)
{
	textureHead = gl.createTexture();
	
	imageHead = new Image();
	
	imageHead.onload = function()
	{
		loadTexture(gl,textureHead,imageHead);
	}
		imageHead.src = 'head.jpg';
	
	textureJaw = gl.createTexture();
	imageJaw = new Image();
	imageJaw.onload = function()
	{
		loadTexture(gl,textureJaw,imageJaw);
	}
	imageJaw.src = 'jaw.png';
	
	textureLeg = gl.createTexture();
	imageLeg = new Image();
	
	imageLeg.onload = function()
	{
		loadTexture(gl,textureLeg,imageLeg);
	}
	imageLeg.src = 'leg.png';
	
	textureKey = gl.createTexture();
	imageKey = new Image();
	imageKey.onload = function()
	{
		loadTexture(gl,textureKey,imageKey);
	}
	imageKey.src = 'key.png';
	
	texturePin = gl.createTexture();
	imagePin = new Image();
	imagePin.onload = function()
	{
		loadTexture(gl,texturePin,imagePin);
	}
	imagePin.src = 'Pin.png';
	
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
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object
	
	  var texBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,texBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,allUVs,gl.STATIC_DRAW);
	a_TexCorrd = gl.getAttribLocation(gl.program,'a_TexCoord');
	gl.vertexAttribPointer(a_TexCorrd,2,gl.FLOAT,false,0,0);
	gl.enableVertexAttribArray(a_TexCorrd);

//    var colorBuffer = gl.createBuffer();
//	    if (!colorBuffer) {
//        console.log('Failed to create the buffer object');
//        return -1;
//    }
//	gl.bindBuffer(gl.ARRAY_BUFFER,colorBuffer);
//	gl.bufferData(gl.ARRAY_BUFFER,allColors,gl.STATIC_DRAW);
//	 var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
//	 if(a_Color < 0) {
//	 console.log('Failed to get the storage location of a_Color');
//    return -1;
//	}
//	    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
//    gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object
//
//	
//	
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

function drawGrid(gl,camera, modelMatrix)
{
    modelMatrix.setTranslate(0,0,0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
		gl.uniform1i(u_UseTexture,0);
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    mvpMatrix.set(camera.projectionMatrix).multiply(camera.viewMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    //gl.uniform3f(u_AmbientColor, 0x88,0x88,0x88);
	gl.uniform1i(u_UseLight,1);
   gl.uniform3f(u_AmbientColor, 0.88,0.88,0.88);

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,meshGrid.faces,gl.STATIC_DRAW);
    gl.drawElements(gl.LINES,meshGrid.faces.length,gl.UNSIGNED_SHORT,0);
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



function renderAnimatedScene(gl,camera,moveArray)
{
    var baseAngle = moveArray[0];
    var joint1Angle = moveArray[1];
    var joint2Angle = moveArray[2];
    var joint3Angle = moveArray[3];
    var teapotMove = moveArray[4]

		drawGrid(gl,camPerspective,modelMatrix);
//		modelMatrix.setScale(0.2,0.2,0.2);
		modelMatrix.setIdentity();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    // Pass the transformation matrix for normal to u_NormalMatrix
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
//    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,hand3IndexArray,handAmbientColor);
//    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,teapotIndexArray,teapotAmbientColor);
		gl.uniform1i(u_UseTexture,1);
		gl.activeTexture(gl.TEXTURE0);
		gl.uniform1i(u_Sampler,0);
	gl.bindTexture(gl.TEXTURE_2D,textureJaw);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,meshToaster.jawFaceArray,meshToaster.material.jaw.ka);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,meshToaster.headEyesFaceArray,meshToaster.material.eye.ka);
		gl.activeTexture(gl.TEXTURE1);
		gl.uniform1i(u_Sampler,1);
	gl.bindTexture(gl.TEXTURE_2D,textureHead);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,meshToaster.headHeadFaceArray,meshToaster.material.head.ka);
	
		gl.activeTexture(gl.TEXTURE2);
		gl.uniform1i(u_Sampler,2);
	gl.bindTexture(gl.TEXTURE_2D,textureLeg);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,meshToaster.rightLegFaceArray,meshToaster.material.leg.ka);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,meshToaster.leftLegFaceArray,meshToaster.material.leg.ka);
	
		gl.activeTexture(gl.TEXTURE3);
		gl.uniform1i(u_Sampler,3);
	gl.bindTexture(gl.TEXTURE_2D,textureKey);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,meshToaster.wkkFaceArray,meshToaster.material.wkk.ka);
		gl.activeTexture(gl.TEXTURE4);
		gl.uniform1i(u_Sampler,4);
	gl.bindTexture(gl.TEXTURE_2D,texturePin);
    drawObject(gl,camera.projectionMatrix,camera.viewMatrix,modelMatrix,meshToaster.wksFaceArray,meshToaster.material.wks.ka);
}

function createCamera(width, height)
{
    camPerspective = new PerspectiveCamera(45,width/height,1,2000);
    camPerspective.position.set([0,200,500]);
    camPerspective.lookAt(0.0,0.0,0.0);
    camPerspective.aspect = width/ height;
    camPerspective.updateProjectionMatrix();
	
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

function genGrid(size, step) {


    // var idx = 0;
    var vertices = []
    // var colors = []
    var normals = []
    var indices = []
    var colors = []
    var idx = 0;
	var uvs = [];
    var r = 0xF0/0xFF,g = 0xF0/0xFF, b = 0xF0/0xFF;
		meshGrid = {};

    for ( var i = - size; i <= size; i += step ) {

        vertices.push(-size,0,i);
        normals.push(1,1,1);
			uvs.push(0,0);
        colors.push(r,g,b);
        vertices.push(size,0,i);
        normals.push(1,1,1);
			uvs.push(0,0);
        colors.push(r,g,b);
        vertices.push(i,0,-size);
        normals.push(1,1,1);
			uvs.push(0,0);
        colors.push(r,g,b);
        vertices.push(i,0,size);
        normals.push(1,1,1);
			uvs.push(0,0);
        colors.push(r,g,b);
        indices.push(idx,idx+1,idx+2,idx+3)
        idx+=4
    }

    meshGrid.vertices = new Float32Array(vertices);
    meshGrid.normals = new Float32Array(normals);
    meshGrid.faces = new Uint16Array(indices);
    meshGrid.colors = new Float32Array(colors);
	meshGrid.uvs = new Float32Array(uvs);
    meshGrid.material = {};
    meshGrid.material.ka = [0.2,0.2,0.2];
    meshGrid.material.kd = [0.1,0.1,0.1];
    meshGrid.material.ks = [0.2,0.2,0.2];
    meshGrid.material.shn = 200;
}

function groupAllVertices()
{
	createExtraMeshes();
	genGrid(300,40);
	
	meshToaster.normals = calculateVertexNormals(meshToaster.vertexArray,meshToaster.faces);

//    var total_vertex_length = robotArmVertexArray.length + axisVertices.length + gridVertexArray.length + filmerVertexArray.length;
    var total_vertex_length = meshToaster.vertexArray.length+meshGrid.vertices.length;
	var total_normal_length = meshToaster.normals.length+meshGrid.normals.length;
	var total_uvs_length = meshToaster.texArray.length+meshGrid.uvs.length;
	console.log(meshToaster.texArray.length);
	
    allPts = new Float32Array(total_vertex_length);
    allNormals = new Float32Array(total_normal_length);
	allUVs = new Float32Array(total_uvs_length);
//	allColors = new Float32Array(total_normal_length);
	
	//copy vertex 
	var offset = 0;
	copyArrays(meshToaster.vertexArray,allPts,offset);
	offset += meshToaster.vertexArray.length;
	copyArrays(meshGrid.vertices,allPts,offset);
	//copy normal and color
	offset = 0;
	copyArrays(meshToaster.normals,allNormals,offset);
	offset += meshToaster.normals.length;
	copyArrays(meshGrid.normals,allNormals,offset);
	offset = 0;
	copyArrays(meshToaster.texArray,allUVs,offset);
	offset += meshToaster.texArray.length;
	copyArrays(meshGrid.uvs,allUVs,offset);
	
	for(var i = 0;i<meshGrid.faces.length;++i)
	{
		meshGrid.faces[i] += meshToaster.vertexArray.length/3;
	}
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
            break;
        case 68://d key
        case 39://right arrow
            camPerspective.position[0]+=offset;
			camCtrl.target[0]+=offset;
            break;
        case 83://s key
            camPerspective.position[1]-=offset;
			camCtrl.target[1]-=offset;
            break;
        case 40://down arrow
            camPerspective.position[2]+=offset;
			camCtrl.target[2]+=offset;
            break;
        case 87://w key
            camPerspective.position[1]+=offset;
			camCtrl.target[1]+=offset;
            break;
        case 38://up arrow
            camPerspective.position[2]-=offset;
			camCtrl.target[2]-=offset;
            break;
        }
    }
}


//Event Handler
function onWindowResize( event ) {

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    //renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;


    //gl.viewport(0,0,SCREEN_WIDTH*0.5,SCREEN_HEIGHT);

    camPerspective.aspect = SCREEN_WIDTH/ SCREEN_HEIGHT;
    camPerspective.updateProjectionMatrix();
}
