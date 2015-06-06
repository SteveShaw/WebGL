// Vertex shader program----------------------------------
var VSHADER_SOURCE = [
'const int NUM_POINT_LIGHT = 2;',
'varying vec3 v_eyePointLightRay[NUM_POINT_LIGHT];',
'varying vec3 v_eyeVertexPos; //equal to modelviewmatrix*vertex',
'',
'attribute vec3 a_Position;',
'attribute vec3 a_VertexNormal;',
'uniform vec3 u_PointLightPos[NUM_POINT_LIGHT];',
'uniform mat4 u_ModelMatrix;',
'uniform mat4 u_ViewMatrix;',
'uniform mat4 u_ProjMatrix;',
'attribute vec2 a_TexCoord;',
'varying vec2 v_TexCoord;',
'varying vec3 v_eyeNormal;',
'varying vec3 v_modelNormal;',
'uniform mat4 u_NormalMatrix; //normal matrix = Transpose(Inv(View*Model));',
'uniform mat4 u_ModelNormalMatrix; //normal matrix = Transpose(Inv(Model));',
'uniform bool u_UseTexCoord;',
'void main()',
'{',
'	vec4 eyePos = u_ViewMatrix*u_ModelMatrix*vec4(a_Position,1.0);',
'	v_eyeVertexPos = eyePos.xyz;',
'	gl_Position = u_ProjMatrix * eyePos;',
'	v_eyeNormal = vec3(u_NormalMatrix*vec4(a_VertexNormal,0));',
'	v_modelNormal = vec3(u_ModelNormalMatrix*vec4(a_VertexNormal,0));',
'	for(int i = 0;i<NUM_POINT_LIGHT;++i)',
'	{',
'		vec4 eyeLightPos = u_ViewMatrix*vec4(u_PointLightPos[i],1.0);',
'		v_eyePointLightRay[i] = eyeLightPos.xyz - eyePos.xyz;',
'	}',
'',
'	if(u_UseTexCoord)',
'	{',
'		v_TexCoord = a_TexCoord;',
'	}',
'}'
].join('\n');

// Fragment shader program--------------------------------
var FSHADER_SOURCE = [
'#ifdef GL_ES',
'precision mediump float;',
'#endif',
'const int NUM_POINT_LIGHT = 2;',
'varying vec3 v_eyePointLightRay[NUM_POINT_LIGHT];',
'uniform bool u_useTexture;',
'uniform sampler2D u_Sampler;',
'varying vec2 v_TexCoord;',
'uniform vec3 u_MatKa;',
'uniform vec3 u_MatKd;',
'uniform vec3 u_MatKs;',
'uniform float u_MatShn;//shininess',
'uniform float u_MatR;//Roughness',
'uniform float u_MatF;//Incidence',
'',
'uniform vec3 u_EnvKa;',
'',
'uniform vec3 u_DirLightKd;',
'uniform float u_DirLightI;',
'',
'uniform vec3 u_PointLightKd[NUM_POINT_LIGHT];',
'uniform vec3 u_PointLightKs[NUM_POINT_LIGHT];',
'uniform float u_PointLightI[NUM_POINT_LIGHT];//light intensity',
'uniform float u_PointLightK0[NUM_POINT_LIGHT];//light intensity constant attenuation',
'uniform float u_PointLightK1[NUM_POINT_LIGHT];//light intensity linear attenutaion',
'uniform float u_PointLightK2[NUM_POINT_LIGHT];//light intensity quadric attenutaion',
'varying vec3 v_eyeNormal;',
'varying vec3 v_modelNormal;',
'varying vec3 v_eyeVertexPos; //equal to modelviewmatrix*vertex',
'uniform vec3 u_LightDir;',
'uniform bool u_UseCT;', //use cook torrence
'const vec3 v_eyeCamPos = vec3(0,0,0);',
'',
'vec3 ctColorFromPointLight()',
'{',
'	vec3 total = vec3(0,0,0);',
'',
'	for(int i= 0;i<NUM_POINT_LIGHT;++i)',
'	{',
'		vec3 color = vec3(0,0,0);',
'',
'		float d = length(v_eyePointLightRay[i]); //the ray direction must be from vertex to point light',
'		float att = 1.0/(u_PointLightK0[i]+u_PointLightK1[i]*d+u_PointLightK2[i]*d*d);',
'		vec3 L = normalize(v_eyePointLightRay[i]); //the ray direction must be from vertex to point light',
'		vec3 N = normalize(v_eyeNormal);',
'		vec3 V = normalize(v_eyeCamPos - v_eyeVertexPos);',
'		vec3 H = normalize(L+V);',
'		float NdotH = dot(N,H);',
'		float NdotV = dot(N,V);',
'		float VdotH = dot(V,H);',
'		float NdotL = dot(N,L);',
'		//geometric term',
'		float g = min(1.0,2.0*NdotH*NdotV/VdotH);',
'		g = min(g,2.0*NdotH*NdotL/VdotH);',
'',
'		//roughness',
'		float msq = u_MatR*u_MatR;',
'		float r = 1.0/(4.0*msq*pow(NdotH,4.0));',
'		float r_exp = (NdotH*NdotH-1.0)/(msq*NdotH*NdotH);',
'		r = r*exp(r_exp);',
'',
// '		float c = 1.5;',
// '		float alpha = acos(NdotH);',
// '		float r = c*exp(-alpha/msq);',
'',
'		//Frensel',
'		float F0 = u_MatF;',
// '		float HdotV = dot(H,V);',
'		float f = pow(1.0-VdotH,5.0)*(1.0-F0) + F0;',
'',
'		//Rs',
'		float Rs = (g*r*f)/(NdotV*NdotL*3.14);',
'',
'		float diffuse = NdotL;',
'		if(diffuse>0.0)',
'		{',
'			color += att*diffuse*u_MatKd*u_PointLightKd[i];',
'			color += att*diffuse*Rs*u_MatKs*u_PointLightKs[i];',
'		}',
'		total += u_PointLightI[i]*color;',
'	}',
'',
'	return total;',
'',
'}',
'',
'vec3 colorFromPointLight()',
'{',
'	vec3 total = vec3(0,0,0);',
'',
'	for(int i = 0;i<NUM_POINT_LIGHT;++i)',
'	{',
'		vec3 color = vec3(0,0,0);',
'',
'		float d = length(v_eyePointLightRay[i]); //the ray direction must be from vertex to point light',
'		float att = 1.0/(u_PointLightK0[i]+u_PointLightK1[i]*d+u_PointLightK2[i]*d*d);',
'		vec3 L = normalize(v_eyePointLightRay[i]); //the ray direction must be from vertex to point light',
'		vec3 N = normalize(v_eyeNormal);',
'		vec3 V = normalize(v_eyeCamPos - v_eyeVertexPos);',
'		vec3 C = dot(L,N)*N;',
'		vec3 R = C + C - L;',
// '		vec3 R = reflect(-L,N);',
// '		vec3 H = normalize(L+V);',
'',
'		float diffuse = max(dot(L,N),0.0);',
'		if(diffuse>0.0)',
'		{',
'			color += att*diffuse*u_MatKd*u_PointLightKd[i];',
'		}',
'',
'		float specular = max(dot(R,V),0.0);',
'		if(specular>0.0)',
'		{',
'			specular = pow(specular,u_MatShn);',
'			color += att*specular*u_MatKs*u_PointLightKs[i];',
'		}',
'		total += u_PointLightI[i]*color;',
'	}',
'',
'	return total;',
'}',
'',
'vec3 colorFromDirLight()',
'{',
'	vec3 L = normalize(u_LightDir);',
'	vec3 N = normalize(v_modelNormal);',
'',
'	float diffuse = max(dot(-L,N),0.0);',
'	vec3 color = diffuse*u_MatKd*u_DirLightKd;',
'	return u_DirLightI*color;',
'}',
'',
'void main() {',
'	if(u_useTexture) {',
'		gl_FragColor = texture2D(u_Sampler, v_TexCoord);',
'	}',
'	else {',
		'vec3 cp = vec3(0.0,0.0,0.0);',
// '		vec3 cp = colorFromPointLight();',
		'if(u_UseCT)',
'		cp = ctColorFromPointLight();',
'		else',
'		cp = colorFromPointLight();',
'		vec3 cd = colorFromDirLight();',
'		vec3 totalColor = u_MatKa*u_EnvKa + cp+cd;',
'',
// '		gl_FragColor = vec4(clamp(totalColor,vec3(0.0,0.0,0.0),vec3(1.0,1.0,1.0)),1.0);',
'		gl_FragColor = vec4(totalColor,1.0);',
'	}',
'}',
].join('\n');

var matrixStack = [];
var g_modelMatrix = mat4.create();
var g_normalMatrix = mat4.create();
var u_ProjMatrix;
var u_ModelViewMatrix;
var u_NormalMatrix;
var u_DiffuseColor;
var u_Sampler;
var u_useTexture;
var u_UseTexCoord;
var mainCam;
var canvas;
var scene;
var scenes = [];

var renderOnOff;
var camCtrl;
var camCtrl_list = [];
var g_ctrlSel = 0; //current selection is camera
var g_helpShow = false;

function PointLightControl()
{
	this.sel = 1;
	this.w = 1.0;
	this.k0 = 1.0;
	this.k1 = 0.0;
	this.k2 = 0.0;
	this.x = 0.0;
	this.y = 0.0;
	this.z = 0.0;
	this.theta = 0.0;
	this.phi = 0.0;
	this.r = 100.0;
}

function DirLightControl()
{
	this.w = 1.0;
	this.x = 1.0;
	this.y = -1.0;
	this.z = 1.0;
}

function RenderControl()
{
	this.CookTorrence = false;
	this.SuperSampling = false;
}

function SceneControl()
{
	this.scene = 0;
	this.Recursive = 3;
}

var pointLightCtrl = new PointLightControl();
var dirLightCtrl = new DirLightControl();
var renderCtrl = new RenderControl();
var sceneCtrl = new SceneControl();

function setLightCtrl()
{
	var sel = pointLightCtrl.sel;
	pointLightCtrl.w = scene.lights[sel].w;
	pointLightCtrl.k0 = scene.lights[sel].k0;
	pointLightCtrl.k1 = scene.lights[sel].k1*(1e+5);
	pointLightCtrl.k2 = scene.lights[sel].k2*(1e+7);
	pointLightCtrl.x = scene.lights[sel].center[0];
	pointLightCtrl.y = scene.lights[sel].center[1];
	pointLightCtrl.z = scene.lights[sel].center[2];
	pointLightCtrl.theta = scene.lights[sel].theta*180.0/Math.PI;
	pointLightCtrl.phi = scene.lights[sel].phi*180.0/Math.PI;
	pointLightCtrl.r = scene.lights[sel].radius;
}



var gui;

function createGUI()
{
	gui = new dat.GUI({autoPlace:true});
	
	var menu_sc = gui.addFolder('Scene');
	menu_sc.add(sceneCtrl,'scene',{'Scene 1':0,'Scene 2':1}).onChange(
		function(value)
		{
			camCtrl = camCtrl_list[value];
			camCtrl.update();
			scene = scenes[value];
			setLightCtrl();
			
			renderCtrl.CookTorrence = scene.use_ct;
			renderCtrl.SuperSampling = scene.super_sampling;
			
			sceneCtrl.Recursive = scene.level;
		}
	);
	
	var level_ctrl = menu_sc.add(sceneCtrl,'Recursive', 2,9);
	level_ctrl.step(1);
	level_ctrl.onChange(
		function(value)
		{
			scene.level = value;
		}
	);
	
	level_ctrl.listen();
	
	
	
	var menu_pl = gui.addFolder('Point Light');
	menu_pl.add(pointLightCtrl,'sel', {'Light 1':1, 'Light 2':2}).onChange(
		function(value)
		{
			pointLightCtrl.sel = value;
			setLightCtrl();
		}
	);
	var w_ctrl = menu_pl.add(pointLightCtrl,'w',0.0,5.0);
	w_ctrl.onChange(
		function(value)
		{
			var sel = pointLightCtrl.sel;
			scene.lights[sel].w = value;
		}
	);
	w_ctrl.listen();
	
	var k0_ctrl = menu_pl.add(pointLightCtrl,'k0',0.1,2.0);
	k0_ctrl.onChange(
		function(value)
		{
			var sel = pointLightCtrl.sel;
			scene.lights[sel].k0 = value;
		}
	);
	k0_ctrl.listen();
	
	var k1_ctrl = menu_pl.add(pointLightCtrl,'k1',0.0,500.0);
	k1_ctrl.onChange(
		function(value)
		{
			var sel = pointLightCtrl.sel;
			scene.lights[sel].k1 = value/(1e+5);
		}
	);
	k1_ctrl.listen();
	
	var k2_ctrl = menu_pl.add(pointLightCtrl,'k2',0.0,1000.0);
	k2_ctrl.onChange(
		function(value)
		{
			var sel = pointLightCtrl.sel;
			scene.lights[sel].k2 = value/(1e+7);
		}
	);
	k2_ctrl.listen();
	
	var x_ctrl = menu_pl.add(pointLightCtrl,'x',-500,500);
	x_ctrl.onChange(
		function(value)
		{
			var sel = pointLightCtrl.sel;
			scene.lights[sel].center[0] = value;
			scene.lights[sel].update();
		}
	);
	x_ctrl.listen();
	
	var y_ctrl = menu_pl.add(pointLightCtrl,'y',-500,500);
	y_ctrl.onChange(
		function(value)
		{
			var sel = pointLightCtrl.sel;
			scene.lights[sel].center[1] = value;
			scene.lights[sel].update();
		}
	);
	y_ctrl.listen();
	
	var z_ctrl = menu_pl.add(pointLightCtrl,'z',-500,500);
	z_ctrl.onChange(
		function(value)
		{
			var sel = pointLightCtrl.sel;
			scene.lights[sel].center[2] = value;
			scene.lights[sel].update();
		}
	);
	z_ctrl.listen();
	
	var theta_ctrl = menu_pl.add(pointLightCtrl,'theta',-180.0,180.0);
	theta_ctrl.onChange(
		function(value)
		{
			var sel = pointLightCtrl.sel;
			scene.lights[sel].theta = value/180.0*Math.PI;
			scene.lights[sel].update();
		}
	);
	theta_ctrl.listen();
	
	var phi_ctrl = menu_pl.add(pointLightCtrl,'phi',-180.0,180.0);
	phi_ctrl.onChange(
		function(value)
		{
			var sel = pointLightCtrl.sel;
			scene.lights[sel].phi = value/180.0*Math.PI;
			scene.lights[sel].update();
		}
	);
	phi_ctrl.listen();
	
	var r_ctrl = menu_pl.add(pointLightCtrl,'r',5,100);
	r_ctrl.onChange(
		function(value)
		{
			var sel = pointLightCtrl.sel;
			scene.lights[sel].radius = value;
			scene.lights[sel].update();
		}
	);
	r_ctrl.listen();	
	
	var menu_render = gui.addFolder('Render Option');
	var ct_ctrl = menu_render.add(renderCtrl,'CookTorrence');
	ct_ctrl.onChange(
		function(value)
		{
			scene.use_ct = value;
		}
	);
	ct_ctrl.listen();
	
	var ss_ctrl = menu_render.add(renderCtrl,'SuperSampling');
	ss_ctrl.onChange(
		function(value)
		{
			scene.super_sampling = value;
		}
	);
	ss_ctrl.listen();
	// menu_pl.add(pointLightCtrl,'w',0.0,10.0).onChange
	
	// menuLightCtrl.add(lightCtrl,'Weight', 0.0,100.0).onChange
	// (
		// function(value)
		// {
			// lightCtrl.Weight = value;
		// }
	// );
	gui.width = 280;
	gui.open();
}

function initVertexBuffers(gl) {

	a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_PositionID < 0) {
		console.log('Failed to get the GPU storage location of a_Position');
		return -1;
	}

	a_TexCoordID = gl.getAttribLocation(gl.program, 'a_TexCoord');
	if (a_TexCoordID < 0) {
		console.log('Failed to get the GPU storage location of a_TexCoord');
		return -1;
	}

	u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
	u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
	u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
	u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
	u_ModelNormalMatrix = gl.getUniformLocation(gl.program, 'u_ModelNormalMatrix');
	u_useTexture = gl.getUniformLocation(gl.program, 'u_useTexture');
	u_UseTexCoord = gl.getUniformLocation(gl.program, 'u_UseTexCoord');
	u_UseCT = gl.getUniformLocation(gl.program, 'u_UseCT');


	//material color
	//get normal attribute 
	a_VertexNormalID = gl.getAttribLocation(gl.program, 'a_VertexNormal');
	if (a_VertexNormalID < 0) {
		console.log('Failed to get the GPU storage location of a_Normal');
		return -1;
	}
	//material uniforms
	u_MatKa = gl.getUniformLocation(gl.program, 'u_MatKa');
	u_MatKd = gl.getUniformLocation(gl.program, 'u_MatKd');
	u_MatKs = gl.getUniformLocation(gl.program, 'u_MatKs');
	u_MatShn = gl.getUniformLocation(gl.program, 'u_MatShn');
	u_MatF = gl.getUniformLocation(gl.program, 'u_MatF');
	u_MatR = gl.getUniformLocation(gl.program, 'u_MatR');


	u_EnvKa = gl.getUniformLocation(gl.program, 'u_EnvKa');

	//Directional light uniforms
	u_DirLightKd = gl.getUniformLocation(gl.program, 'u_DirLightKd');
	u_DirLightI = gl.getUniformLocation(gl.program, 'u_DirLightI');
	u_LightDir = gl.getUniformLocation(gl.program, 'u_LightDir');

	//point lights uniforms
	u_PointLightPos = gl.getUniformLocation(gl.program, 'u_PointLightPos');
	u_PointLightKd = gl.getUniformLocation(gl.program, 'u_PointLightKd');
	u_PointLightKs = gl.getUniformLocation(gl.program, 'u_PointLightKs');
	u_PointLightK0 = gl.getUniformLocation(gl.program, 'u_PointLightK0');
	u_PointLightK1 = gl.getUniformLocation(gl.program, 'u_PointLightK1');
	u_PointLightK2 = gl.getUniformLocation(gl.program, 'u_PointLightK2');
	u_PointLightI = gl.getUniformLocation(gl.program, 'u_PointLightI');


}

function setLightUniforms(gl, scene) {
	// var i = 0;
	// for(i = 0;i<scene.lights.length;++i)
	// {
	// if(scene.lights[i].type === LIGHT_DIRECTIONAL)
	// {
	// gl.uniform3fv(u_LightDir, scene.lights[i].dir);
	// gl.uniform3fv(u_DirLightKd, scene.lights[i].kd);
	// break;
	// }
	// }
	gl.uniform1i(u_UseCT, scene.use_ct);
	gl.uniform3fv(u_LightDir, lightDataFlatten(scene.lights, DATA_LIGHT_DIR, LIGHT_DIRECTIONAL));
	gl.uniform3fv(u_DirLightKd, lightDataFlatten(scene.lights, DATA_LIGHT_KD, LIGHT_DIRECTIONAL));
	gl.uniform1f(u_DirLightI, lightDataFlatten(scene.lights, DATA_LIGHT_I, LIGHT_DIRECTIONAL)[0]);

	gl.uniform1fv(u_PointLightI, lightDataFlatten(scene.lights, DATA_LIGHT_I, LIGHT_POINT));
	gl.uniform3fv(u_PointLightPos, lightDataFlatten(scene.lights, DATA_LIGHT_POS, LIGHT_POINT));
	gl.uniform3fv(u_PointLightKd, lightDataFlatten(scene.lights, DATA_LIGHT_KD, LIGHT_POINT));
	gl.uniform3fv(u_PointLightKs, lightDataFlatten(scene.lights, DATA_LIGHT_KS, LIGHT_POINT));
	gl.uniform1fv(u_PointLightK0, lightDataFlatten(scene.lights, DATA_LIGHT_K0, LIGHT_POINT));
	gl.uniform1fv(u_PointLightK1, lightDataFlatten(scene.lights, DATA_LIGHT_K1, LIGHT_POINT));
	gl.uniform1fv(u_PointLightK2, lightDataFlatten(scene.lights, DATA_LIGHT_K2, LIGHT_POINT));
}

function setEnvUniforms(gl, ka) {
	gl.uniform3fv(u_EnvKa, ka);
}

function setMatUniforms(gl, ka, kd, ks, shn, r, f) {
	gl.uniform3f(u_MatKa, ka[0], ka[1], ka[2]);
	gl.uniform3f(u_MatKd, kd[0], kd[1], kd[2]);
	gl.uniform3f(u_MatKs, ks[0], ks[1], ks[2]);
	gl.uniform1f(u_MatShn, shn);
	gl.uniform1f(u_MatR, r);
	gl.uniform1f(u_MatF, f);
}

function setMatrixUniforms(gl, cam) {

	//	var m = mat4.create();
	//	mat4.transpose(m, cam.projectionMatrix);
	gl.uniformMatrix4fv(u_ProjMatrix, false, cam.projectionMatrix);
	//	gl.uniformMatrix4fv(u_ModelViewMatrix, false, g_modelViewMatrix);
	//	gl.uniformMatrix4fv(u_ModelMatrix, false, cam.viewMatrix);
	//	gl.uniformMatrix4fv(u_ViewMatrix, false, g_modelViewMatrix);
	gl.uniformMatrix4fv(u_ModelMatrix, false, g_modelMatrix);
	gl.uniformMatrix4fv(u_ViewMatrix, false, cam.viewMatrix);

	//set normal matrix which equal to transpose --> inverse --> modelViewMatrx;
	mat4.multiply(g_normalMatrix, cam.viewMatrix, g_modelMatrix);
	mat4.invert(g_normalMatrix, g_normalMatrix);
	mat4.transpose(g_normalMatrix, g_normalMatrix);
	gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix);

	mat4.invert(g_normalMatrix, g_modelMatrix);
	mat4.transpose(g_normalMatrix, g_normalMatrix);
	gl.uniformMatrix4fv(u_ModelNormalMatrix, false, g_normalMatrix);

	//set fragment shader's model and view matrix
	// gl.uniformMatrix4fv(u_fModelMatrix,false,g_modelMatrix);
	// gl.uniformMatrix4fv(u_fViewMatrix,false,cam.viewMatrix);

}

function calculateMvMatrix(cam) {
	//    mat4.multiply(g_modelViewMatrix,cam.viewMatrix,g_modelViewMatrix);
	mat4.multiply(g_modelViewMatrix, g_modelViewMatrix, cam.viewMatrix);
}

//function createCamera(width,height)
//{
//    mainCam = new PerspectiveCamera([0,0,0],[1,1,0],45,width/height,1,2000);
//    mainCam.lookAt([0,0,-150]);
//    //console.log(mat4.str(mainCam.projectionMatrix));
//}

function pushMatrix() {
	var copy = mat4.create();
	mat4.copy(copy, g_modelMatrix);
	matrixStack.push(copy);
}

function popMatrix() {
	if (matrixStack.length == 0) {
		throw "Invalid popMatrix!";
	}
	g_modelMatrix = matrixStack.pop();
}

function initSecondScene(scene, viewportWidth, viewportHeight) {
	//geometry class and plane class are has-a relationship
	var plane = new Plane(21, 21, 5, 30, [0, 0, -50], [0, 1, 0]);
	//	plane.geo.reflectivity = 0.8;
	plane.geo.Roughness = 0.4;
	plane.geo.F0 = 1.5;
	scene.addObj(plane);

	var rect = new Rectangle();
	rect.genGeometry([-50, 100, -150], [220, 1, 200], [0, 0, 1], MATL_SILVER_DULL);
	// rect.genGeometry([0, 100, -150], [300, 1, 200], [0, 0, 1], MATL_BLACK);
	rect.geo.reflectivity = 0.2;
	rect.geo.Roughness = 0.8;
	rect.geo.F0 = 1.0;
	rect.geo.texture = TEX_CHECKER;
	scene.addObj(rect);

	// rect = new Rectangle();
	// rect.genGeometry([150, 100, -100], [200, 1, 100], [-1, 0, 0], MATL_BLU_PLASTIC);
	// rect.geo.reflectivity = 0.2;
	// rect.geo.Roughness = 0.8;
	// rect.geo.F0 = 1.0;

	// scene.addObj(rect);

	// rect = new Rectangle();
	// rect.genGeometry([-150, 100, -100], [200, 1, 100], [1, 0, 0], MATL_BLU_PLASTIC);
	// rect.geo.reflectivity = 0.2;
	// rect.geo.Roughness = 0.8;
	// rect.geo.F0 = 1.0;

		// scene.addObj(rect);
	//Top
	rect = new Rectangle();
	rect.genGeometry([-50, 200, -100], [220, 1, 100], [0, -1, 0], MATL_BLU_PLASTIC);
	rect.geo.reflectivity = 0.2;
	rect.geo.Roughness = 0.8;
	rect.geo.F0 = 1.0;
	scene.addObj(rect);

	var sphere = new Sphere(50, [0, 60, 70]);
	sphere.setScale([0.8, 1.2, 0.7]);
	// sphere.genGeometry(100, 100,MATL_SILVER_SHINY);
	sphere.genGeometry(100, 100, MATL_TURQUOISE);
	sphere.geo.reflectivity = 0.8;
	sphere.geo.Roughness = 0.1;
	sphere.geo.F0 = 1.3;
	sphere.geo.refraction = 0.8;
	sphere.geo.ior = 0.8;
	scene.addObj(sphere);
	
//    scene.addObj(torus);

    //csg union object
    var csg_1 = new UnionBoolObj();
    csg_1.left = new Sphere(15,[100, 100, 90]);
//    csg_1.left.renderGL = false;
    csg_1.left.canTrace = false;
    csg_1.left.genGeometry(25,25,MATL_OBSIDIAN)
    csg_1.left.geo.reflectivity = 0.8;
    csg_1.right = new Sphere(33,[80, 60, 90]);
//    csg_1.right.renderGL = false;
    csg_1.right.canTrace = false;
    csg_1.right.genGeometry(25,25,MATL_JADE);
    csg_1.right.geo.reflectivity = 0.8;
    csg_1.right.geo.refraction = 0.7;
    csg_1.right.geo.ior = 0.8;
    scene.addObj(csg_1.left);
    csg_1.leftIdx = scene.objects.length-1;
    scene.addObj(csg_1.right);
    csg_1.rightIdx = scene.objects.length-1;
    scene.addObj(csg_1);
	
	var csg_rabbit = new UnionBoolObj();
	csg_1.canTrace = false;
	csg_rabbit.left = csg_1;
	csg_rabbit.leftIdx = scene.objects.length - 1;
	csg_rabbit.right = new Sphere(15,[60, 100, 90]);
	csg_rabbit.right.canTrace = false;
	csg_rabbit.right.genGeometry(25,25,MATL_OBSIDIAN);
	csg_rabbit.right.geo.reflectivity = 0.8;
	scene.addObj(csg_rabbit.right);
	csg_rabbit.rightIdx = scene.objects.length-1;
	scene.addObj(csg_rabbit);
	

    var csg_2 = new DiffBoolObj();
    csg_2.left = new Cube([-100, 90, -50], [30, 30, 30], [0, 0, 0], MATL_BLU_PLASTIC);
    csg_2.left.genGeometry();
    csg_2.left.canTrace = false;
    scene.addObj(csg_2.left);
    csg_2.leftIdx = scene.objects.length-1;
    csg_2.right = new Sphere(35,[-100,90,-50]);
    csg_2.right.genGeometry(50,50,MATL_RED_PLASTIC);
    csg_2.right.canTrace = false;
    scene.addObj(csg_2.right);
    csg_2.rightIdx = scene.objects.length-1;
    scene.addObj(csg_2);

    var csg_3 = new DiffBoolObj();
    csg_3.left = new Sphere(40,[-100,50,60]);
    csg_3.left.genGeometry(50,50,MATL_GOLD_DULL);
    csg_3.left.canTrace = false;
    scene.addObj(csg_3.left);
    csg_3.leftIdx = scene.objects.length - 1;
//    csg_3.right = 
    csg_3.right = new Sphere(35,[-100,50,60]);
    csg_3.right.genGeometry(50,50,MATL_CHROME);
    csg_3.right.canTrace = false;
    scene.addObj(csg_3.right);
    csg_3.rightIdx = scene.objects.length - 1;
    scene.addObj(csg_3);

    var csg_4 = new DiffBoolObj();
    csg_3.canTrace = false;
    csg_4.left = csg_3;
    csg_4.leftIdx = scene.objects.length - 1;
    csg_4.right = new Cylinder(40,40,40,[-100,50,60],[-Math.PI/2,0,0]);
    csg_4.right.genGeometry(50,50,false,MATL_TURQUOISE);
    csg_4.right.canTrace = false;
    scene.addObj(csg_4.right);
    csg_4.rightIdx = scene.objects.length - 1;
    scene.addObj(csg_4);


    var cone = new Cylinder(0,40,70,[-10,90,-80],[-Math.PI/2,0,0]);
    cone.genGeometry(50,50,false,MATL_GRN_PLASTIC);
	cone.geo.texture = TEX_RING;
//    cone.canTrace = false;
    scene.addObj(cone);
	
	var torus = new Torus([80,80,-20],[Math.PI/2,0,0],30,11);
	torus.genGeometry(50,50,MATL_RUBY);
	//torus.geo.reflectivity = 0.8;
	//torus.geo.refraction = 0.6;
	scene.addObj(torus);
//	var torus = new Torus([90,50,0], [0,0,0], 50,15);
//	
//	torus.geo.reflectivity = 0.8;
//    csg_3.le

	scene.createCamera(viewportWidth, viewportHeight, [0, 100, 350]);


	var texturePlane = new TexturePlane();
	scene.addObj(texturePlane);

	var dim = 256;
	scene.rayImage = new RayImage(dim, dim);

	scene.addLight(new DirLight([1, -1, -1]));
	var light = new PointLight([-20, 30, 0])
	light.setMoveSphere([-30,170,40],100,-Math.PI/4,0);// Math.PI*0.233);
	scene.addLight(light);
	light = new PointLight([0, 150, 50]);
	light.setMoveSphere([50,150,50],100, Math.PI/3, -Math.PI*0.2);
	scene.addLight(light);
//    var al = new AreaLight([0, 200, -100], [20, 1, 20], [0, -1, 0]);
//    al.w = 1.0;
//    scene.addLight(al);
    scene.lights[1].w = 1.0;
    scene.lights[1].k0 = 0.5;
    scene.lights[1].k1 = 0.0002;
    scene.lights[1].k2 = 0.00002;
    scene.lights[2].w = 0.8;
	scene.lights[2].k0 = 0.6;
	scene.lights[2].k1 = 0.00043;
    scene.lights[2].k2 = 0.000056;
	//	scene.addLight(new AreaLight([30, 40, -30], [5, 5], [0, -1, 0]));

	scene.makeRayImage();
	scene.addTexture(0, scene.rayImage.colors, false, true);
	var texHelp = new Image();

    texHelp.onload = function () {
        scene.addImageTexture(1,texHelp,false,true);
    }
    texHelp.src = 'help.png';
}

function initScene(scene, viewportWidth, viewportHeight) {
	//geometry class and plane class are has-a relationship
	var plane = new Plane(21, 21, 5, 30, [0, 0, -50], [0, 1, 0]);
	plane.geo.reflectivity = 0.8;
	plane.geo.Roughness = 0.4;
	plane.geo.F0 = 1.5;
	scene.addObj(plane);
	
	var r = 50;
	var center = [0,20,-30];
	

	var pos = vec3.clone(center);
	pos[2] = -40;
	var sphere = new Sphere(18, pos);//[0, 40, -80]);
	// sphere.genGeometry(100, 100,MATL_SILVER_SHINY);
	sphere.genGeometry(100, 100, MATL_RED_PLASTIC);
	sphere.geo.reflectivity = 0.8;
	sphere.geo.Roughness = 0.1;
	sphere.geo.F0 = 1.3;
	sphere.geo.refraction = 0.6;
	sphere.geo.ior = 0.9;
	scene.addObj(sphere);
	
	pos[1] += 30;
	pos[0] -= 20;
	var torus = new Torus(pos,[0,0,0],17,6);
	pos[1] = center[1];
	pos[0] = center[0];
	torus.genGeometry(50,50,MATL_SILVER_DULL);
	torus.geo.reflectivity = 0.8;
	torus.geo.Roughness = 0.3;
	torus.geo.F0 = 0.8;
	torus.geo.refraction = 0.6;
	torus.geo.ior = 1.1;
	scene.addObj(torus);
	
	pos[0] = center[0] - 35;
	sphere = new Sphere(15, pos);//[-50, 40, -30]);
	sphere.genGeometry(100, 100, MATL_EMERALD);
	sphere.geo.reflectivity = 0.8;
	sphere.geo.Roughness = 0.2;
	sphere.geo.F0 = 1.2;
	scene.addObj(sphere);

	pos[0] = center[0] + r;
	var box = new Cube(pos, [10, 10, 10], [0, 0, Math.PI / 3], MATL_PEWTER);
	// box.canTrace = false;
	box.geo.Roughness = 0.1;
	box.geo.F0 = 0.48;
	box.genGeometry();
	box.geo.reflectivity = 0.8;
	scene.addObj(box);
	
	vec3.copy(pos,center);
	vec3.add(pos,pos,[30,-20,-100]);
	var cone = new Cylinder(10,20,30,pos,[-Math.PI/2,0,0]);
    cone.genGeometry(50,50,false,MATL_PEARL);
	//cone.geo.reflectivity = 0.8;
	cone.geo.checker_size = 5.0;
	cone.geo.texture = TEX_CHECKER;
	scene.addObj(cone);
	
	pos[1] += 55;
	sphere = new Sphere(22,pos,[1.2,0.8,1.0]);
	sphere.genGeometry(100, 100, MATL_GOLD_SHINY);
	sphere.geo.reflectivity = 0.8;
	scene.addObj(sphere);
	//cone.geo.texture = TEX_CHECKER_SKIP;
	var csg_1 = new DiffBoolObj();
	csg_1.left = new Sphere(8, [16, 25, 0] );
	csg_1.left.genGeometry(50,50,MATL_BLU_PLASTIC);
	csg_1.left.canTrace = false;
	scene.addObj(csg_1.left);
	csg_1.leftIdx = scene.objects.length - 1;
	csg_1.right = new Cylinder(1.8,2,20,[14,27.5,-10],[0,0,0]);
	csg_1.right.genGeometry(50,50,false,MATL_COPPER_SHINY);
	csg_1.right.canTrace = false;
	scene.addObj(csg_1.right);
	csg_1.rightIdx= scene.objects.length - 1;
	scene.addObj(csg_1);
	
	var csg_2 = new DiffBoolObj();
	csg_1.canTrace = false;
	csg_2.left = csg_1;
	csg_2.leftIdx = scene.objects.length - 1;
	
	csg_2.right = new Cylinder(1.5,2,20,[15.3,23,-10],[0,0,0]);
	csg_2.right.genGeometry(50,50,false,MATL_COPPER_SHINY);
	csg_2.right.canTrace = false;
	scene.addObj(csg_2.right);
	csg_2.rightIdx = scene.objects.length - 1;
	scene.addObj(csg_2);
	
    // var csg_3 = new DiffBoolObj();
    // csg_3.left = new Sphere(40,[-100,50,60]);
    // csg_3.left.genGeometry(50,50,MATL_GOLD_DULL);
    // csg_3.left.canTrace = false;
    // scene.addObj(csg_3.left);
    // csg_3.leftIdx = scene.objects.length - 1;
// //    csg_3.right = 
    // csg_3.right = new Sphere(35,[-100,50,60]);
    // csg_3.right.genGeometry(50,50,MATL_CHROME);
    // csg_3.right.canTrace = false;
    // scene.addObj(csg_3.right);
    // csg_3.rightIdx = scene.objects.length - 1;
    // scene.addObj(csg_3);

    // var csg_4 = new DiffBoolObj();
    // csg_3.canTrace = false;
    // csg_4.left = csg_3;
    // csg_4.leftIdx = scene.objects.length - 1;
    // csg_4.right = new Cylinder(40,40,40,[-100,50,60],[-Math.PI/2,0,0]);
    // csg_4.right.genGeometry(50,50,false,MATL_TURQUOISE);
    // csg_4.right.canTrace = false;
    // scene.addObj(csg_4.right);
    // csg_4.rightIdx = scene.objects.length - 1;
    // scene.addObj(csg_4);


	scene.createCamera(viewportWidth, viewportHeight, [10,20,70]);



	//add texture
	//    var geo = new Geometry();
	//    geo.vertices = [-0.95,  0.95, 1.0, -0.95,  -0.95, 1.0, 0.95,  0.95, 1.0, 0.95,  -0.95, 1.0];
	//    geo.normals = [0,0,0, 0,0,0, 0,0,0, 0,0,0];
	//    geo.uvs = [0.0,1.0, 0.0,0.0, 1.0,1.0, 1.0,0.0];
	//    geo.faces = [0,1,2,3,2,1];

	//    scene.addMesh(new RenderMesh(geo));
	var texturePlane = new TexturePlane();
	scene.addObj(texturePlane);

	var dim = 256;
	// var imageHeight = 256;
	// var imageWidth = Math.floor(imageHeight*0.5*canvas.width/canvas.height);
	// scene.rayImage = new RayImage(128*canvas.width/canvas.height,256);
	scene.rayImage = new RayImage(dim, dim);

	scene.addLight(new DirLight([1, -1, -1]));
	var light = new PointLight([-20, 30, 0])
	light.setMoveSphere([-30,170,40],100,-Math.PI/4,0);// Math.PI*0.233);
	scene.addLight(light);
	light = new PointLight([0, 150, 50]);
	light.setMoveSphere([50,150,50],100, Math.PI/3, -Math.PI*0.2);
	scene.addLight(light);
//    var al = new AreaLight([0, 200, -100], [20, 1, 20], [0, -1, 0]);
//    al.w = 1.0;
//    scene.addLight(al);
    scene.lights[1].w = 1.0;
    scene.lights[1].k0 = 0.5;
    scene.lights[1].k1 = 0.0002;
    scene.lights[1].k2 = 0.00002;
    scene.lights[2].w = 0.8;
	scene.lights[2].k0 = 0.6;
	scene.lights[2].k1 = 0.00043;
    scene.lights[2].k2 = 0.000056;
	// scene.addLight(new AreaLight([30, 40, -30], [5, 5], [0, -1, 0]));

	scene.makeRayImage();
	scene.addTexture(0, scene.rayImage.colors, false, true);
	
	var texHelp = new Image();

    texHelp.onload = function () {
        scene.addImageTexture(1,texHelp,false,true);
    }
    texHelp.src = 'help.png';
}

function drawScene(gl, scene, left, top, viewportWidth, viewportHeight) {
	gl.viewport(left, top, viewportWidth, viewportHeight);

	setEnvUniforms(gl, scene.ka);
	setLightUniforms(gl, scene);
	scene.updateCamera(viewportWidth, viewportHeight);
	mat4.identity(g_modelMatrix);


	var i;

	for (i = 0; i < scene.objects.length - 1; ++i) {

		if(!scene.objects[i].renderGL) continue; //render GL 
			
		pushMatrix();


		if (scene.objects[i].type === OBJ_PLANE) {
			//            var planePoint = scene.objects[i].dist;
			//			mat4.translate(g_modelViewMatrix, g_modelViewMatrix, scene.objects[i].point);
			//			mat4.rotateZ(g_modelViewMatrix, g_modelViewMatrix, -Math.PI / 3);
			//			mat4.rotateY(g_modelViewMatrix, g_modelViewMatrix, Math.PI / 6);

			mat4.multiply(g_modelMatrix, g_modelMatrix, scene.objects[i].transPlaneMat);
		} else {

			mat4.multiply(g_modelMatrix, g_modelMatrix, scene.objects[i].transMat);
		}

		//calculateMvMatrix(scene.mainCam);

		setMatUniforms(gl, scene.objects[i].geo.ka, scene.objects[i].geo.kd, scene.objects[i].geo.ks, scene.objects[i].geo.shn, scene.objects[i].geo.Roughness, scene.objects[i].geo.F0);

		setMatrixUniforms(gl, scene.mainCam);

		gl.bindBuffer(gl.ARRAY_BUFFER, scene.objects[i].renderMesh.vbo);
		gl.enableVertexAttribArray(a_PositionID);
		gl.vertexAttribPointer(a_PositionID, scene.objects[i].renderMesh.vbo.itemSize, gl.FLOAT, false, 0, 0);


		gl.bindBuffer(gl.ARRAY_BUFFER, scene.objects[i].renderMesh.nbo);
		gl.enableVertexAttribArray(a_VertexNormalID);
		gl.vertexAttribPointer(a_VertexNormalID, scene.objects[i].renderMesh.nbo.itemSize, gl.FLOAT, false, 0, 0);
		//        gl.uniform4f(u_DiffuseColor,scene.meshObjs[i].diffuseColor[0],scene.meshObjs[i].diffuseColor[1],scene.meshObjs[i].diffuseColor[2],scene.meshObjs[i].diffuseColor[3]);
		//		var color = scene.objects[i].renderMesh.diffuseColor;
		// var color = scene.objects[i].renderMesh.kd;
		// gl.uniform4f(u_DiffuseColor, color[0], color[1], color[2], 1.0);

		if (scene.objects[i].renderMesh.uvs !== null) {
			gl.bindBuffer(gl.ARRAY_BUFFER, scene.objects[i].renderMesh.tbo);
			gl.enableVertexAttribArray(a_TexCoordID);
			gl.vertexAttribPointer(a_TexCoordID, scene.objects[i].renderMesh.tbo.itemSize, gl.FLOAT, false, 0, 0);

		}


		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, scene.objects[i].renderMesh.ibo);
		gl.drawElements(gl.TRIANGLES, scene.objects[i].renderMesh.faces.length, gl.UNSIGNED_SHORT, 0);

		popMatrix();
	}
}

var matIdentity = mat4.create();

function drawTextureScene(gl, scene, left, top, viewportWidth, viewportHeight) {
	gl.viewport(left, top, viewportWidth, viewportHeight);

	mat4.identity(matIdentity);
	gl.uniformMatrix4fv(u_ProjMatrix, false, matIdentity);
	gl.uniformMatrix4fv(u_ModelMatrix, false, matIdentity);
	gl.uniformMatrix4fv(u_ViewMatrix, false, matIdentity);

	var objIdx = scene.objects.length - 1;

	gl.bindBuffer(gl.ARRAY_BUFFER, scene.objects[objIdx].renderMesh.vbo);
	gl.enableVertexAttribArray(a_PositionID);
	gl.vertexAttribPointer(a_PositionID, scene.objects[objIdx].renderMesh.vbo.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, scene.objects[objIdx].renderMesh.tbo);
	gl.enableVertexAttribArray(a_TexCoordID);
	gl.vertexAttribPointer(a_TexCoordID, scene.objects[objIdx].renderMesh.tbo.itemSize, gl.FLOAT, false, 0, 0);
	//        gl.uniform4f(u_DiffuseColor,scene.meshObjs[0].diffuseColor[0],scene.meshObjs[0].diffuseColor[1],scene.meshObjs[0].diffuseColor[2],scene.meshObjs[0].diffuseColor[3]);

	
	if(!g_helpShow)
	{
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, scene.textures[0].texture);
		gl.uniform1i(u_Sampler, 0);
	}
	else
	{
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, scene.textures[1].texture);
		gl.uniform1i(u_Sampler, 1);		
	}
	//    scene.rebindTexture();

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, scene.objects[objIdx].renderMesh.ibo);
	gl.drawElements(gl.TRIANGLES, scene.objects[objIdx].renderMesh.faces.length, gl.UNSIGNED_SHORT, 0);
	

}

function handleKeyPress(evt) {
	

	switch (evt.charCode) { //determine the key pressed
	case 116:
	case 84:
		//re trace image 
		renderOnOff = false;
		scene.makeRayImage();
		scene.rebindTexture(0, scene.rayImage.colors);
		renderOnOff = true;
		break;
		
	case 120: //'x' show help
	case 88:
		g_helpShow = !g_helpShow;
		break;
	
	case 97://key a 
		scene.moveCamera([-10,0,0]);
		vec3.add(camCtrl.target,camCtrl.target,[-10,0,0]);
		break;
	case 100://key d
		scene.moveCamera([10,0,0]);
		vec3.add(camCtrl.target,camCtrl.target,[10,0,0]);
		break;
	case 115://key s 
		scene.moveCamera([0,-10,0]);
		vec3.add(camCtrl.target,camCtrl.target,[0,-10,0]);
		break;
	case 119://key w
		scene.moveCamera([0,10,0]);
		vec3.add(camCtrl.target,camCtrl.target,[0,10,0]);
		break;
	}
}


function main() {
	//==============================================================================

	renderOnOff = true;
	// Retrieve <canvas> element
	canvas = document.getElementById('webgl');

	// (ignore the size settings from our HTML file; fill all but a 20-pixel
	// border with a canvas whose width is twice its height.)
	// Get the rendering context for WebGL
	window.addEventListener('resize', onWindowResize, false);

	//add key down event handler
	window.addEventListener("keypress", handleKeyPress, false);
	var gl = getWebGLContext(canvas);
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;


	//browserResize();			// Re-size this canvas before we use it.

	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to intialize shaders.');
		return;
	}


	initVertexBuffers(gl);

	
	scenes.push(new Scene(gl));
	scene = scenes[scenes.length-1];
	//    var texScene = new Scene(gl);
	initScene(scene, canvas.width / 2, canvas.height);
	camCtrl_list.push(new OrbitControls(scene.mainCam, canvas));
	camCtrl = camCtrl_list[camCtrl_list.length-1];
	vec3.copy(camCtrl.target, [0, 0, -50]);
	
	scenes.push(new Scene(gl));
	scene = scenes[scenes.length-1];
	initSecondScene(scene, canvas.width / 2, canvas.height);
	camCtrl_list.push(new OrbitControls(scene.mainCam, canvas));
	camCtrl = camCtrl_list[camCtrl_list.length-1];
	vec3.copy(camCtrl.target, [0, 0, -50]);
	
	setLightCtrl();
	createGUI();

	
	
	

	//    initTextureScene(texScene);
	// Specify how we will clear the WebGL context in <canvas>
	gl.clearColor(0.2, 0.2, 0.2, 1.0);
	
	scene = scenes[0];
	camCtrl = camCtrl_list[0];

	// renderOnOff = true;


	var tick = function () {

		
		camCtrl.update();
		//gui.__folders['Point Light'].__controllers[0].updateDisplay();
		//		draw2D(ctx);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.uniform1i(u_UseTexCoord, 0);
		gl.uniform1i(u_useTexture, 0);

		gl.enable(gl.DEPTH_TEST);
		drawScene(gl, scene, 0, 0, canvas.width / 2, canvas.height);


		gl.uniform1i(u_useTexture, 1);
		gl.uniform1i(u_UseTexCoord, 1);



		if (renderOnOff) {
			gl.disable(gl.DEPTH_TEST);
			//        drawTextureScene(gl,texScene,canvas.width/2,0,canvas.width/2,canvas.height);
			drawTextureScene(gl, scene, canvas.width / 2, 0, canvas.width / 2, canvas.height);
			//			camCtrl.update();
		}
		

		requestAnimationFrame(tick, canvas); // Request that the browser ?calls tick
	};
	tick();
}




function onWindowResize() {
	//==============================================================================

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	//    mainCam.aspect = canvas.width/canvas.height;
	//    mainCam.updateProjectionMatrix();
}
