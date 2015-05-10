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
        'attribute float a_PointSize;\n' +
        'attribute vec4 a_Color;\n' +
        'uniform mat4 u_MvpMatrix;\n' +
        //        'uniform mat4 u_NormalMatrix;\n'+ // Transformation matrix of normal
        //        'uniform vec3 u_LightColor;\n' +
        //        'uniform vec3 u_LightDirection;\n' +
        //        'uniform vec3 u_AmbientColor;\n' +
        //		'uniform bool u_UseLight;\n' +
        //		'uniform bool u_UseVertexColor;\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        //		'int x=-2;\n'+
        //		'int y=mabs(x);\n'+
        '  gl_Position = u_MvpMatrix * a_Position;\n' +
        '  gl_PointSize = a_PointSize;\n' +
        //		' v_TexCoord = a_TexCoord;\n'+
        //        ' vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
        // The dot product of the light direction and the normal
        //        ' float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
        // Calculate the color due to diffuse reflection
        //        ' vec3 diffuse = u_LightColor * u_AmbientColor * (0.3+0.7*nDotL);\n' +
        //		' v_Color = vec4(u_AmbientColor, 1.0);\n' +
        ' v_Color = a_Color;\n' +
        // Add the surface colors due to diffuse and ambient reflection
        //        ' if(u_UseLight) v_Color = vec4(diffuse, 1.0);\n' +
        //		' else v_Color = vec4(u_AmbientColor, 1.0);\n' +
        '}\n';

// Fragment shader program
var FSHADER_SOURCE =
        '#ifdef GL_ES\n' +
        'precision mediump float;\n' +
        '#endif\n' +
        //        'uniform bool u_DrawPoint;\n' +
        'varying vec4 v_Color;\n' +
        'uniform sampler2D u_Sampler;\n' +
        'uniform bool u_UseTexture;\n' +
        'void main() {\n' +
        'if(u_UseTexture)\n' +
        '{\n' +
        //			'float depth = gl_FragCoord.z / gl_FragCoord.w;\n'+
        //					'float fogFactor = 0.0;\n'+
        //		'float fogDensity = 0.5;\n'+
        'vec4 samplerColor = vec4(1.0);\n' +
        //		'vec3 fogColor = vec3(0.137,0.231,0.423);\n'+
        '  samplerColor = texture2D(u_Sampler,gl_PointCoord);\n' +
        'if(samplerColor.a==0.0){discard;}\n' +
        'else{\n' +
        //								'const float LOG2 = 1.442695;\n'+
        //						'fogFactor = exp2( - fogDensity * fogDensity * LOG2 );\n'+
        //						'fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );\n'+
        //		'vec3 color = mix(vec3(v_Color),fogColor,fogFactor);\n'+
        //        '  gl_FragColor = vec4(color,v_Color.a)*samplerColor;\n' +
        '  gl_FragColor = v_Color*samplerColor;\n' +
        //		'gl_FragColor = vec4(color,v_Color.a);\n'+
        //'gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );\n'+
        '}\n' +
        '}\n' +
        'else\n' +
        '{\n' +
        //		  '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
        //  '  if(dist < 0.5) { \n' +
        //	'  	gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0);\n' +
        //	'  } else { discard; }\n'+
        //				' if(v_Color.a==0.0){discard;}\n'+
        //				'else\n'+
        ' gl_FragColor = vec4(v_Color.rgb,1.0);\n' +
        '}\n' +
        '}\n'
//        'varying vec2 v_TexCoord;\n' +
//        'uniform sampler2D u_Sampler;\n' +
//        'uniform bool u_UseTexture;\n' +
//        'void main() {\n' +
////				'if(u_UseTexture)\n'+
////        '  gl_FragColor = v_Color*texture2D(u_Sampler,v_TexCoord);\n' +
////				'else\n'+
////		'if(u_DrawPoint){\n'+
////		  '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
////  '  if(dist < 0.5) { \n' +
////	'  	gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0);\n' +
////	'  }\n'+
////'else { discard; }\n'+
////		'gl_FragColor = v_Color;\n'+
////'}\n' +
//// 'else{\n'+
////				' gl_FragColor = v_Color;\n'+
//
//        '}}\n';

var ANGLE_STEP = 45.0;
var gAngle = [0.0, 0.0, 0.0, 0.0, 0.0];
var gMoveOffset = [45.0, 45.0, 45.0, 45.0, 45.0];
var gLookAtPos = [0, 0, 0];
var gSims = {}

var FlockPara = function()
{
    this.Kc = 60; //randomSpread(200,100);
    this.Ks = 80; //randomSpread(200,100);
    this.Ka = 60; //randomSpread(200,100);
    this.Kp = 200;
}

var flockPara = new FlockPara();

var ClothPara = function()
{
    this.solver= 3;
}
var clothPara = new ClothPara();

function createGUI()
{
    var gui = new dat.GUI({autoPlace:true});
    var flockCtrl = gui.addFolder('Flock Control');
    flockCtrl.add(flockPara,'Kc',50,100).onChange(
                function(value)
                {
                    flockPara.Kc = value;
                }

                );

    flockCtrl.add(flockPara,'Ks',50,100).onChange(
                function(value)
                {
                    flockPara.Ks = value;
                }

                );

    flockCtrl.add(flockPara,'Ka',50,100).onChange(
                function(value)
                {
                    flockPara.Ka = value;
                }

                );

    flockCtrl.add(flockPara,'Kp',200,300).onChange(
                function(value)
                {
                    flockPara.Kc = value;
                }

                );

    var clothCtrl = gui.addFolder('Cloth Control');
    clothCtrl.add(clothPara,'solver',{'Explicit Euler':0, 'Implicit Euler':1, 'Midpoint':2, 'Verlet':3}).onChange(

                function(value)
                {
                    gSims['cloth'].solverKey = value;
                    gSims['cloth'].initCloth();
                }

                );
    clothCtrl.open();
    gui.width = 220;
    gui.open();
}

function setSimPara()
{
    //flock
    gSims['flock'].config.Kc = flockPara.Kc;
    gSims['flock'].config.ks = flockPara.Ks;
    gSims['flock'].config.Ka = flockPara.Ka;
    gSims['flock'].config.Kp = flockPara.Kp;
}


function main() {

    container = document.getElementById('container');
    canvas = document.createElement('canvas'); //document.getElementById('webgl');
    // canvas = document.getElementById('webgl');
    //	var hud = document.getElementById('hud');
    // hud.removeEventListener('mousedown',null, false);
    //	var ctx = hud.getContext('2d');
    container.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var SCREEN_WIDTH = window.innerWidth;
    var SCREEN_HEIGHT = window.innerHeight;

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener("keypress", onKeyPress, false);


    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL left');
        return;
    }



    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }


    //    gl.depthFunc(gl.LEQUAL);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.blendEquation(gl.FUNC_ADD);

    //get vertex shader program's variables
    u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    //    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    //    u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    //    u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    //    u_AmbientColor = gl.getUniformLocation(gl.program, 'u_AmbientColor');
    //    u_DrawPoint = gl.getUniformLocation(gl.program, 'u_DrawPoint');
    u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    u_UseTexture = gl.getUniformLocation(gl.program, 'u_UseTexture');
    //	u_UseLight = gl.getUniformLocation(gl.program,'u_UseLight');
    //	u_UseVertexColor = gl.getUniformLocation(gl.program,'u_UseVertexColor');
    //	u_Sampler = gl.getUniformLocation(gl.program,'u_Sampler');
    //	u_UseTexture = gl.getUniformLocation(gl.program,'u_UseTexture');
    //
    //	gl.uniform1i(u_UseVertexColor,0);

    //    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    //    var lightDirection = new Vector3([0.5, 3.0, 4.0]);
    //    lightDirection.normalize(); // Normalize
    //    gl.uniform3fv(u_LightDirection, lightDirection.elements);

    //create GUI
    createGUI();
    //create 3d object
    groupAllVertices();

    initGLContext(gl);

    //	initTextures(gl);
    createTexture(gl);

    createCamera(SCREEN_WIDTH, SCREEN_HEIGHT);


    camCtrl = new OrbitControls(camPerspective, canvas);
    camCtrl.target[0] = 0; //camPerspective.position[0];
    camCtrl.target[1] = 0; //camPerspective.position[1];//50;
    camCtrl.target[2] = 0; //camPerspective.position[2];//0;

    document.onkeydown = function (ev) {
        handleKeys(ev)
    }
    //gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.clearColor(0.2, 0.2, 0.2, 1);
    //	gl.enable(gl.ALPHA_TEST);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //        gl.viewport(0,0,canvas.width,canvas.height);
    //     gl.viewport(0,0,0.5*canvas.width,canvas.height);
    // renderStaticScence(gl,camPerspective);
    // gl.viewport(canvas.width*0.5,0,0.5*canvas.width,canvas.height);
    // renderStaticScence(gl,camOrtho);
    var tick = function () {
        //		draw2D(ctx);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        var t = animate(gAngle); // Update the rotation angle
        gl.viewport(0, 0, canvas.width, canvas.height);
        //set sim system parameters
        setSimPara();
        renderAnimatedScene(gl, camPerspective, gAngle, t);
        camPerspective.updateMatrix();
        camCtrl.update();
        requestAnimationFrame(tick, canvas); // Request that the browser ?calls tick
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
var time_acc = 0;

function animate(angle) {
    //==============================================================================
    // Calculate the elapsed time
    var now = Date.now();
    var elapsed = now - g_last;
    time_acc += elapsed;
    //	ps.update(elapsed*0.01);
    //p.integrator(elapsed*0.01);
    g_last = now;
    return elapsed;
}

function spinUp() {
    ANGLE_STEP += 25;
}

function spinDown() {
    ANGLE_STEP -= 25;
}

function runStop() {
    if (ANGLE_STEP * ANGLE_STEP > 1) {
        myTmp = ANGLE_STEP;
        ANGLE_STEP = 0;
    } else {
        ANGLE_STEP = myTmp;
    }
}

function loadTexture(gl, texture, image) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    //	gl.enable(gl.BLEND);
    //	gl.blendEquation(gl.FUNC_ADD);
    //	gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    //	gl.blendFunc(gl.ONE, gl.ONE);
    //	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function initTextures(gl) {
    texPoint = gl.createTexture();

    texImage = new Image();

    texImage.onload = function () {
        loadTexture(gl, texPoint, texImage);
    }
    texImage.src = 'blob.png';

}

function initGLContext(gl) {

    //create vertex buffer
    vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    //    gl.bufferData(gl.ARRAY_BUFFER, allPts, gl.STATIC_DRAW);
    //    gl.bufferData(gl.ARRAY_BUFFER, sims.S0, gl.DYNAMIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, meshCont.vertices.subarray(0, meshCont.nextOff), gl.DYNAMIC_DRAW);
    //Get the storage location of a_Position, assign and enable buffer
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    //    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, PART_MAXVAR * meshCont.elemSize, PART_XPOS * meshCont.elemSize);
    gl.enableVertexAttribArray(a_Position); // Enable the assignment of the buffer object

    a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    //    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, PART_MAXVAR * meshCont.elemSize, PART_R * meshCont.elemSize);
    gl.enableVertexAttribArray(a_Color); // Enable the assignment of the buffer object


    a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    if (a_PointSize < 0) {
        console.log('Failed to get the storage location of a_PointSize');
        return -1;
    }
    //    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, PART_MAXVAR * meshCont.elemSize, PART_DIAM * meshCont.elemSize);
    gl.enableVertexAttribArray(a_PointSize); // Enable the assignment of the buffer object


    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create index buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    //gl.bindBuffer(gl.ARRAY_BUFFER,null);
}

var modelMatrix = new Matrix4(); // Model matrix
var viewMatrix = new Matrix4(); // View matrix
var projMatrix = new Matrix4(); // Projection matrix
var mvpMatrix = new Matrix4(); // Model view projection matrix
var quatMatrix = new Matrix4();
var normalMatrix = new Matrix4();
//var quat = new Quaternion(0, 0, 0, 1);
var qx = new Quaternion(0, 0, 0, 1);
var qy = new Quaternion(0, 0, 0, 1);

function drawGrid(gl, camera, modelMatrix) {
    modelMatrix.setTranslate(0, 0, 0);
    gl.uniform1i(u_UseTexture, 0);
    //	gl.uniform1f(u_PointSize,1.0);

    //    normalMatrix.setInverseOf(modelMatrix);
    //    normalMatrix.transpose();
    //		gl.uniform1i(u_UseTexture,0);
    //    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    mvpMatrix.set(camera.projectionMatrix).multiply(camera.viewMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    //gl.uniform3f(u_AmbientColor, 0x88,0x88,0x88);
    //	gl.uniform1i(u_UseLight,1);
    //gl.uniform3f(u_AmbientColor, 0.88,0.88,0.88);

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, meshGrid.faces, gl.DYNAMIC_DRAW);
    gl.drawElements(gl.LINES, meshGrid.faces.length, gl.UNSIGNED_SHORT, 0);
}

function drawObject(gl, projectionMatrix, viewMatrix, modelViewMatrix, faceIndexArray, colorArray) {

    //enable color
    //console.log(colorArray);
    mvpMatrix.set(projectionMatrix).multiply(viewMatrix).multiply(modelViewMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, faceIndexArray, gl.DYNAMIC_DRAW);
    gl.drawElements(gl.TRIANGLES, faceIndexArray.length, gl.UNSIGNED_SHORT, 0);
}

function drawPoint(gl, projectionMatrix, viewMatrix, modelViewMatrix) {

    mvpMatrix.set(projectionMatrix).multiply(viewMatrix).multiply(modelViewMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    //    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,faceIndexArray,gl.STATIC_DRAW);
    //    gl.drawElements(gl.POINTS,faceIndexArray.length,gl.UNSIGNED_SHORT,0);
    //	gl.drawArrays(
}

var count = 0;

function renderAnimatedScene(gl, camera, moveArray, t) {
    //		console.log(vec3.str(p.position));
    //	copyArrays(p.position,allPts,meshGrid.vertices.length);
    //gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    //gl.bufferData(gl.ARRAY_BUFFER, allPts, gl.STATIC_DRAW);
    //gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    //gl.enableVertexAttribArray(a_Position);
    //	gl.bufferSubData(gl.ARRAY_BUFFER,0,meshCont.meshes.curVert.subarray(0,meshCont.nextOff));
    //	gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);
    //	gl.bufferData(gl.ARRAY_BUFFER,meshCont.meshes.curVert,gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, meshCont.vertices.subarray(0, meshCont.nextOff), gl.DYNAMIC_DRAW);

    gl.enable(gl.DEPTH_TEST);
    //render grid plane
    drawGrid(gl, camPerspective, modelMatrix);

    //	cloth.update(gl);
    pushMatrix(modelMatrix);
    gSims['flock'].renderFlock(gl,modelMatrix,camera.projectionMatrix,camera.viewMatrix,quatMatrix,mvpMatrix,u_MvpMatrix);
    modelMatrix = popMatrix();

    drawPoint(gl, camera.projectionMatrix, camera.viewMatrix, modelMatrix,u_MvpMatrix);

    //render tornado
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gSims['tornado'].faces, gl.DYNAMIC_DRAW);
    gl.drawElements(gl.POINTS, gSims['tornado'].faces.length, gl.UNSIGNED_SHORT, 0);

    //render sphere
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sph.faces, gl.DYNAMIC_DRAW);
    gl.drawElements(gl.TRIANGLES, sph.faces.length, gl.UNSIGNED_SHORT, 0);

    if (meshSphere.isUpdate) {
        vec3.copy(sph.offset, [0, 0, -Math.cos(count/50)*0.8]);
        count++;
        vec3.add(sph.center, sph.center, sph.offset); meshSphere.update(sph.offset);
    }
    //	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,meshCube.faces,gl.DYNAMIC_DRAW);
    //	gl.drawElements(gl.LINES,meshCube.faces.length,gl.UNSIGNED_SHORT,0);
    //	draw sphere
    //	gl.bufferData(gl.ARRAY_BUFFER,);
    //	gl.bufferSubData(gl.ARRAY_BUFFER,cloth.startOff,meshCont.vertices.subarray(cloth.startOff,meshCont.nextOff));
    //    gl.bufferData(gl.ARRAY_BUFFER, meshCont.vertices.subarray(0,meshCont.nextOff), gl.DYNAMIC_DRAW);
    //			gl.uniform1i(u_UseTexture,0);
    //    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,cloth.faces,gl.STATIC_DRAW);
    //    gl.drawElements(gl.TRIANGLES,cloth.faces.length,gl.UNSIGNED_SHORT,0);
    //

    //    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,storm.faces,gl.STATIC_DRAW);
    //    gl.drawElements(gl.POINTS,storm.faces.length,gl.UNSIGNED_SHORT,0);

    //gl.drawArrays(gl.POINTS,cloth.startOff/PART_MAXVAR,cloth.totalPoints+storm.totalPoints);
    //	gl.drawArrays(gl.POINTS,storm.startOff/PART_MAXVAR,storm.totalPoints);
    //	gl.uniform2i(u_UseTexture,0);
    //	gl.drawArrays(gl.POINTS,flock.startOff/PART_MAXVAR,flock.totalPoints);
    //	    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,flock.faces,gl.DYNAMIC_DRAW);
    //    gl.drawElements(gl.POINTS,flock.faces.length,gl.UNSIGNED_SHORT,0);

    //	if(time_acc>flock.dt)
    //    {
    //		time_acc-=flock.dt;
    //		flock.update(gl);
    //    }

    //update sphere


    //	for (var i = 0; i < gSimArr.length; ++i) {
    //
    //					gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gSimArr[i].faces, gl.DYNAMIC_DRAW);
    //
    //
    //		if (gSimArr[i].name === 'cloth') {
    //			gl.uniform1i(u_UseTexture, 0);
    //			gl.enable(gl.DEPTH_TEST);
    //
    //			gl.drawElements(gl.POINTS, gSimArr[i].faces.length, gl.UNSIGNED_SHORT, 0);
    //			gSimArr[i].setContact(sph.center, sph.radius);
    //		} else if (gSimArr[i].name ==='fireworks' || gSimArr[i].name === 'flock') {
    //			gl.disable(gl.DEPTH_TEST);
    //			gl.uniform1i(u_UseTexture, 1);
    //			gl.bindTexture(gl.TEXTURE_2D, texture)
    //			gl.activeTexture(gl.TEXTURE0);
    //			gl.uniform1i(u_Sampler, 0); //			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,gSimArr[i].faces,gl.DYNAMIC_DRAW);
    ////			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gSimArr[i].faces, gl.STATIC_DRAW);
    //			gl.drawElements(gl.POINTS, gSimArr[i].faces.length, gl.UNSIGNED_SHORT, 0);
    //		} else {
    //			gl.uniform1i(u_UseTexture, 0);
    //			gl.enable(gl.DEPTH_TEST);
    ////			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gSimArr[i].faces, gl.STATIC_DRAW);
    //			gl.drawElements(gl.POINTS, gSimArr[i].faces.length, gl.UNSIGNED_SHORT, 0);
    //		}
    //	}

    //cloth
    gl.uniform1i(u_UseTexture, 0);
    gl.enable(gl.DEPTH_TEST);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gSims['cloth'].faces, gl.DYNAMIC_DRAW);
    gl.drawElements(gl.TRIANGLES, gSims['cloth'].faces.length, gl.UNSIGNED_SHORT, 0);
    gSims['cloth'].setContact(sph.center, sph.radius);

    gl.uniform1i(u_UseTexture, 1);
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(u_Sampler, 0); //			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,gSimArr[i].faces,gl.DYNAMIC_DRAW);
//    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gSims['flock'].faces, gl.DYNAMIC_DRAW);

//    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 6);
//    gl.drawElements(gl.TRIANGLES, gSims['flock'].faces.length, gl.UNSIGNED_SHORT, 0);

    gl.disable(gl.DEPTH_TEST);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gSims['fire'].faces, gl.DYNAMIC_DRAW);
    pushMatrix(modelMatrix);
    gSims['fire'].renderParticle(gl,modelMatrix,camera.projectionMatrix,camera.viewMatrix,quatMatrix,mvpMatrix,u_MvpMatrix);
    modelMatrix = popMatrix();

    //draw smoke
    drawPoint(gl, camera.projectionMatrix, camera.viewMatrix, modelMatrix,u_MvpMatrix);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gSims['smoke'].faces, gl.DYNAMIC_DRAW);
    gSims['smoke'].renderParticle(gl);

    //fireworks
/*****    gl.uniform1i(u_UseTexture, 1);
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(u_Sampler, 0); //			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,gSimArr[i].faces,gl.DYNAMIC_DRAW);
    gl.disable(gl.DEPTH_TEST);
    //			gl.uniform1i(u_UseTexture, 1);
    //			gl.bindTexture(gl.TEXTURE_2D, texture)
    //			gl.activeTexture(gl.TEXTURE0);
    //			gl.uniform1i(u_Sampler, 0); //			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,gSimArr[i].faces,gl.DYNAMIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gSims['fireworks'].faces, gl.DYNAMIC_DRAW);
    gl.drawElements(gl.POINTS, gSims['fireworks'].faces.length, gl.UNSIGNED_SHORT, 0);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gSims['smoke'].faces, gl.DYNAMIC_DRAW);
    gl.drawElements(gl.POINTS, gSims['smoke'].faces.length, gl.UNSIGNED_SHORT, 0);


    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tornado.faces, gl.DYNAMIC_DRAW);
    gl.drawElements(gl.POINTS, tornado.faces.length, gl.UNSIGNED_SHORT, 0);******/


    gSims['cloth'].update(gl, t);
    gSims['flock'].update(gl, t);
    gSims['fire'].update(gl, t);
    gSims['smoke'].update(gl, t);
    gSims['tornado'].update(gl,t);

//    gSims['fireworks'].update(gl, t);

//    tornado.update(gl, t);
    //	for(i = 0;i<gSimArr.length;++i)
    //	{
    ////		if(gSimArr[i].name!=='fireworks')
    //
    //		gSimArr[i].update(gl,t);
    //	}


}

function createCamera(width, height) {
    camPerspective = new PerspectiveCamera(45, width / height, 0.1, 2000);
    camPerspective.position.set([0, 50, 150]);
    //    camPerspective = new PerspectiveCamera(60,width/height,1,300);
    //    camPerspective.position.set([0,20,50]);
    camPerspective.lookAt(0.0, 0.0, 0.0);
    camPerspective.aspect = width / height;
    camPerspective.updateProjectionMatrix();

}


function copyArrays(srcArray, dstArray, offset) {
    for (var j = 0; j < srcArray.length; ++j) {
        dstArray[j + offset] = srcArray[j];
    }
}

function setArrays(dstArray, val, len) {
    for (var j = 0; j < len; ++j) {
        dstArray[j] = val;
    }
}

function setRandomValues(dstArray, len, offset) {
    for (var i = 0; i < len; ++i) {
        dstArray[offset + i] = Math.random();
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
    var r = 0xF0 / 0xFF,
            g = 0xF0 / 0xFF,
            b = 0xF0 / 0xFF;
    //    var r = 1.0, g=0, b=0;
    meshGrid = {};

    var y = -10;

    for (var i = -size; i <= size; i += step) {

        vertices.push(-size, y, i);
        normals.push(1, 1, 1);
        uvs.push(0, 0);
        colors.push(r, g, b);
        vertices.push(size, y, i);
        normals.push(1, 1, 1);
        uvs.push(0, 0);
        colors.push(r, g, b);
        vertices.push(i, y, -size);
        normals.push(1, 1, 1);
        uvs.push(0, 0);
        colors.push(r, g, b);
        vertices.push(i, y, size);
        normals.push(1, 1, 1);
        uvs.push(0, 0);
        colors.push(r, g, b);
        indices.push(idx, idx + 1, idx + 2, idx + 3)
        idx += 4;
    }

    meshGrid.vertices = new Float32Array(vertices);
    meshGrid.normals = new Float32Array(normals);
    meshGrid.faces = new Uint16Array(indices);
    meshGrid.colors = new Float32Array(colors);
}


function groupAllVertices() {

    var i;
    meshCont = new Container(7000); //all vertices are stored in this object
    //	genGrid(300,40);
    genGrid(100, 5);

    //create bounding cube

    gridStat = new MeshObject(meshGrid.vertices.length / 3, meshCont);
    gridStat.setData(meshGrid.vertices, meshGrid.faces, meshGrid.colors);

    delete meshGrid.vertices;
    delete meshGrid.colors;

    var offset = meshGrid.faces.length;

    //	var cube = new BoundingCube([-50,40,50],100,100,100);
    //	for(i=0;i<cube.faces.length;++i)
    //	{
    //		cube.faces[i] += offset;
    //	}
    //	offset += cube.faces.length;
    //
    //	meshCube = new MeshObject(cube.vertices.length/3,meshCont);
    //	meshCube.setData(cube.vertices,cube.faces);
    sph = new Sphere(20, 20, 10, [35, 25, 15]);
    meshSphere = new MeshObject(sph.vertices.length / 3, meshCont);
    meshSphere.setData(sph.vertices, sph.colors);
    meshSphere.isUpdate = true;

    for (i = 0; i < sph.faces.length; ++i) {
        sph.faces[i] += offset;
    }
    offset += sph.faces.length;


    var flock = new Flocking(60, meshCont);
    flock.initSim();
    for (i = 0; i < flock.faces.length; ++i) {
        flock.faces[i] += offset; //meshGrid.faces.length;
    }
    offset += flock.faces.length;


    gSims[flock.name] = flock;

    //	//create storm system
//    var storm = new Storm(200, meshCont);
//    storm.initSim();
//    //
//    //	console.log(storm.faces.length);
//    for (i = 0; i < storm.faces.length; ++i) {
//        //		storm.faces[i] += cloth.faces.length;
//        storm.faces[i] += offset;
//    }

//    gSims[storm.name] = storm;
//    //gSimArr.push(storm);

//    offset += storm.faces.length;

    var fire = new Fire(1500, meshCont);
    fire.initSim();
    for (i = 0; i < fire.faces.length; ++i) {
        fire.faces[i] += offset;
    }

    offset += fire.faces.length;
    gSims[fire.name] = fire;
//    smoke.setSolver('exp', new IntegratorExplicitEuler(smoke.dotFinder, smoke));

    var smoke = new Smoke(2000,meshCont);
    smoke.initSim();
    for (i = 0; i < smoke.faces.length; ++i) {
        smoke.faces[i] += offset;
    }
    offset += smoke.faces.length;
    gSims[smoke.name] = smoke;

    var tornado = new Tornado(200, meshCont);
    tornado.initSim();

    for (i = 0; i < tornado.faces.length; ++i) {
        tornado.faces[i] += offset;
    }

    offset += tornado.faces.length;
    tornado.setSolver('exp', new IntegratorExplicitEuler(tornado.dotFinder, tornado));
    gSims[tornado.name] = tornado;



    var cloth = new ClothSim(16, 16, meshCont);
    ////	console.log(meshCont.nextOff);
    cloth.initSim();
    cloth.setContact([20, 25, 15], 10);

    for (i = 0; i < cloth.faces.length; ++i) {
        cloth.faces[i] += offset; //meshGrid.faces.length;
        //		cloth.faces[i] += flock.faces.length;
    }
    //	gSimArr.push(cloth);
    offset += cloth.faces.length;
    gSims[cloth.name] = cloth;

    var mpEuler = new IntegratorMidPointEuler(cloth.dotFinder, cloth);
    cloth.setSolver(2, mpEuler);
    var expEuler = new IntegratorExplicitEuler(cloth.dotFinder, cloth);
    cloth.setSolver(0, expEuler);
    var verlet = new IntegratorVerlet(cloth.dotFinder, cloth);
    cloth.setSolver(3, verlet);

    cloth.solverKey = clothPara.solver;

}

function handleKeys(event) {

    var offset = 10;

    if (event.shiftKey) {
        switch (event.keyCode) { //determine the key pressed
        case 65: //a key
        case 37: //left arrow
            camCtrl.target[0] -= offset;
            break;
        case 68: //d key
        case 39: //right arrow
            camCtrl.target[0] += offset;
            break;
        case 83: //s key
        case 40: //down arrow
            camCtrl.target[1] -= offset;
            break;
        case 87: //w key
        case 38: //up arrow
            camCtrl.target[1] += offset;
            break;
        }
    } else {

        switch (event.keyCode) { //determine the key pressed
        case 65: //a key
        case 37: //left arrow
            camPerspective.position[0] -= offset;
            camCtrl.target[0] -= offset;
            break;
        case 68: //d key
        case 39: //right arrow
            camPerspective.position[0] += offset;
            camCtrl.target[0] += offset;
            break;
        case 83: //s key
            camPerspective.position[1] -= offset;
            camCtrl.target[1] -= offset;
            break;
        case 40: //down arrow
            camPerspective.position[2] += offset;
            camCtrl.target[2] += offset;
            break;
        case 87: //w key
            camPerspective.position[1] += offset;
            camCtrl.target[1] += offset;
            break;
        case 38: //up arrow
            camPerspective.position[2] -= offset;
            camCtrl.target[2] -= offset;
            break;
        }
    }
}

var runMode = 0;

function onKeyPress(event) {
    var keyChar = String.fromCharCode(event.keyCode);
    switch (keyChar) {
    case 'p':
        runMode = 2;
        break;
    default:
        break;
    }
}

//Event Handler
function onWindowResize(event) {

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    //renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;


    //gl.viewport(0,0,SCREEN_WIDTH*0.5,SCREEN_HEIGHT);

    camPerspective.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camPerspective.updateProjectionMatrix();
}
