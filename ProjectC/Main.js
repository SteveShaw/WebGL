var VSHADER_SOURCE =
        //-------------ATTRIBUTES: of each vertex, read from our Vertex Buffer Object
        'attribute vec4 a_Position; \n' +		// vertex position (model coord sys)
        'attribute vec4 a_Normal; \n' +			// vertex normal vector (model coord sys)
        'attribute vec4 a_Color;\n' + 		// Per-vertex colors? they usually
		// set the Phong diffuse reflectance

        'attribute vec2 a_TexCoord;\n' + 		// Per-vertex colors? they usually
        // Phong diffuse reflectance for the entire shape
        'uniform mat4 u_MvpMatrix; \n' +
        'uniform mat4 u_ModelMatrix; \n' + 		// Model matrix
        'uniform mat4 u_NormalMatrix; \n' +  	// Inverse Transpose of ModelMatrix;

        //-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
        //'varying vec3 v_Kd; \n' +							// Phong Lighting: diffuse reflectance
		// (I didn't make per-pixel Ke,Ka,Ks )
        'varying vec4 v_Position; \n' +
        'varying vec3 v_transformedNormal; \n' +					// Why Vec3? its not a point, hence w==0
        'varying vec4 v_Color;\n' +
        'varying vec2 v_TexCoord;\n' +
        'void main() { \n' +
        // Set the CVV coordinate values from our given vertex. This 'built-in'
        // per-vertex value gets interpolated to set screen position for each pixel.
        '  gl_Position = u_MvpMatrix * a_Position;\n' +
        '  v_Position = u_ModelMatrix * a_Position; \n' +
        '  v_transformedNormal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
        '	 v_Color = a_Color; \n' +
		'	 v_TexCoord = a_TexCoord; \n' +
        '}\n';

var FSHADER_SOURCE= [
            '#ifdef GL_ES',
            'precision mediump float;',
            '#endif;',
            '#define NUMBER_OF_POINTLIGHTS 3',
            '#define NUMBER_OF_DIRECTIONLIGHTS 1',
            'varying vec4 v_Color;',
	'uniform vec4 u_eyePosWorld;',
            'varying vec3 v_transformedNormal;',
	'varying vec4 v_Position;',
            'uniform vec4 u_PointLightPosition[NUMBER_OF_POINTLIGHTS];',
            'uniform float u_PointLightDistance[NUMBER_OF_POINTLIGHTS];',
	'uniform bool u_PointLightSwitch[NUMBER_OF_POINTLIGHTS];',
	'uniform int u_PointLightAtt[NUMBER_OF_POINTLIGHTS];',
            'uniform vec3 u_PointLightKa[NUMBER_OF_POINTLIGHTS];',
            'uniform vec3 u_PointLightKd[NUMBER_OF_POINTLIGHTS];',
            'uniform vec3 u_PointLightKs[NUMBER_OF_POINTLIGHTS];',
            'uniform vec3 u_DirLightDirection[NUMBER_OF_DIRECTIONLIGHTS];',
            'uniform bool u_DirLightSwitch[NUMBER_OF_DIRECTIONLIGHTS];',
            'uniform vec3 u_DirLightKa[NUMBER_OF_DIRECTIONLIGHTS];',
            'uniform vec3 u_DirLightKd[NUMBER_OF_DIRECTIONLIGHTS];',
            'uniform vec3 u_DirLightKs[NUMBER_OF_DIRECTIONLIGHTS];',
            'uniform vec3 u_MaterialKe;',
            'uniform vec3 u_MaterialKd;',
            'uniform vec3 u_MaterialKa;',
            'uniform vec3 u_MaterialKs;',
            'uniform mat4 u_ViewMatrix;',
            'uniform float u_MaterialShininess;',
//            'uniform vec3 u_EnvAmbient;',
            'uniform bool u_UseLight;',
	        'uniform sampler2D u_Sampler;' ,
        'uniform bool u_UseTexture;' ,
	'varying vec2 v_TexCoord;'+
            'void main()',
            '{',
            '	vec3 pointKd = vec3( 0.0 );',
            '	vec3 pointKs = vec3( 0.0 );',
            '	vec3 pointKa = vec3( 0.0 );',
            'vec3 dirKd = vec3( 0.0 );',
            '	vec3 dirKs = vec3( 0.0 );',
            '	vec3 dirKa = vec3( 0.0 );',
            '	vec3 totalDiffuse = vec3( 0.0 );',
            '	vec3 totalSpecular = vec3( 0.0 );',
            '	vec3 totalAmbient = vec3(0.0);',
            '	vec3 normal = normalize(v_transformedNormal);',
            '	vec3 viewPosition = normalize(v_Position.xyz);',
            '	vec3 emissive = u_MaterialKe;',
            '  vec3 eyeDirection = normalize(u_eyePosWorld.xyz - v_Position.xyz);',
            '	for(int i = 0;i<NUMBER_OF_POINTLIGHTS;++i)',
            '	{',
            '		vec3 lightVector = u_PointLightPosition[i].xyz - v_Position.xyz;',
            '		float lightDistance = 1.0;',
	'float att = 1.0;',
//            '		if ( u_PointLightDistance[ i ] > 0.0 )',
            '		if (u_PointLightAtt[i]>0)',
	'{',
//            '			lightDistance = length(lightVector)/u_PointLightDistance[i];',
            '			att= 1.0 - min( ( length( lightVector ) / u_PointLightDistance[ i ] ), 1.0 );',
	'if(att>0.0){',
//	'att = 1.0/length(lightVector);',
	'if(u_PointLightAtt[i]==2)att = att*att;',
	'}',
	'}',
            '		lightVector = normalize( lightVector );',
            '		float dotProduct = dot( normal, lightVector );',
            '		float pointDiffuseWeight = max( dotProduct, 0.0 );',
	'if(u_PointLightSwitch[i])',
            '		pointKd += u_PointLightKd[ i ] * u_MaterialKd* pointDiffuseWeight*att;',
//            '		pointKd += u_PointLightKd[ i ] * u_MaterialKd* pointDiffuseWeight*lightDistance;',
            '		vec3 pointHalfVector = normalize( lightVector + eyeDirection);',
            '		float pointDotNormalHalf = max( dot( normal, pointHalfVector ), 0.0 );',
            '		float pointSpecularWeight = max( pow( pointDotNormalHalf, u_MaterialShininess ), 0.0 );',
            '		float specularNormalization = ( u_MaterialShininess + 2.0 ) / 8.0;',
            '		vec3 schlick = u_MaterialKs + vec3( 1.0 - u_MaterialKs ) * pow( max( 1.0 - dot( lightVector, pointHalfVector ), 0.0 ), 5.0 );',
//            '		pointKs += u_MaterialKs*u_PointLightKs[ i ]*pointSpecularWeight * pointDiffuseWeight * lightDistance * specularNormalization;',
	'if(u_PointLightSwitch[i])',
            '		pointKs += u_MaterialKs*u_PointLightKs[ i ]*pointSpecularWeight * att * specularNormalization;',
//            '		pointKs += u_MaterialKs*u_PointLightKs[ i ]*pointSpecularWeight * lightDistance * specularNormalization;',
	'if(u_PointLightSwitch[i])',
            '		pointKa += u_MaterialKa*u_PointLightKa[i];',
            '	}',
            '	for( int i = 0; i < NUMBER_OF_DIRECTIONLIGHTS; i ++ ) {',
            '	vec3 normLightDir = normalize(u_DirLightDirection[i]);',
            '		vec4 lightDirection = u_ViewMatrix * vec4( normLightDir, 0.0 );',
            '		vec3 dirVector = normalize( lightDirection.xyz );',
            '		float dotProduct = dot( normal, dirVector );',
            '		float dirDiffuseWeight = max( dotProduct, 0.0 );',
	'if(u_DirLightSwitch[i])',
            '		dirKd += u_MaterialKd * u_DirLightKd[ i ] * dirDiffuseWeight;',
            '		vec3 dirHalfVector = normalize( dirVector - viewPosition );',
            '		float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );',
            '		float dirSpecularWeight = max( pow( dirDotNormalHalf, u_MaterialShininess ), 0.0 );',
            '		float specularNormalization = ( u_MaterialShininess + 2.0 ) / 8.0;',
            '		vec3 schlick = u_MaterialKs + vec3( 1.0 - u_MaterialKs ) * pow( max( 1.0 - dot( dirVector, dirHalfVector ), 0.0 ), 5.0 );',
//            '		dirKs += u_MaterialKs * u_DirLightKs[ i ] * dirSpecularWeight * dirDiffuseWeight * specularNormalization;',
	'if(u_DirLightSwitch[i])',
            '		dirKs += u_MaterialKs * u_DirLightKs[ i ] * dirSpecularWeight * specularNormalization;',
//            '		dirKs += schlick * u_DirLightKs[ i ] * dirSpecularWeight * dirDiffuseWeight * specularNormalization;',
	'if(u_DirLightSwitch[i])',
            '		dirKa += u_MaterialKa * u_DirLightKa[ i ];',
            '	}',
            '	totalDiffuse += pointKd;',
            '	totalSpecular += pointKs;',
            '	totalAmbient += pointKa;',
            '	totalAmbient += dirKa;',
            '	totalDiffuse += dirKd;',
            '	totalSpecular += dirKs;',
//            '   totalAmbient = vec3(0.0);',
            '	if(u_UseLight)',
	'{',
	'if(u_UseTexture)',
            '	gl_FragColor = vec4(v_Color.xyz * ( emissive + totalDiffuse + totalAmbient +totalSpecular), 1.0)*texture2D(u_Sampler,v_TexCoord);',
	'else',
            '	gl_FragColor = vec4(v_Color.xyz * ( emissive + totalDiffuse + totalAmbient +totalSpecular), 1.0);',
	'}',
            '	else',
            '	gl_FragColor = v_Color;',
            '}'
        ].join("\n")

var GS_VSHADER = [
            '#define NUMBER_OF_POINTLIGHTS 3',
            '#define NUMBER_OF_DIRECTIONLIGHTS 1',
        'attribute vec4 a_Position;',
        'attribute vec4 a_Normal;', 
        'attribute vec4 a_Color;',
        'attribute vec2 a_TexCoord;',
        'uniform mat4 u_MvpMatrix;', 
        'uniform mat4 u_ModelMatrix;',
        'uniform mat4 u_NormalMatrix;',
            'uniform mat4 u_ViewMatrix;',
        // set the Phong diffuse reflectance
            'varying vec4 v_Color;',
	'varying vec2 v_TexCoord;',
            'uniform vec4 u_eyePosWorld;',
            'varying vec3 v_transformedNormal;',
            'varying vec4 v_Position;',
            'uniform vec4 u_PointLightPosition[NUMBER_OF_POINTLIGHTS];',
            'uniform float u_PointLightDistance[NUMBER_OF_POINTLIGHTS];',
            'uniform bool u_PointLightSwitch[NUMBER_OF_POINTLIGHTS];',
	'uniform int u_PointLightAtt[NUMBER_OF_POINTLIGHTS];',
            'uniform vec3 u_PointLightKa[NUMBER_OF_POINTLIGHTS];',
            'uniform vec3 u_PointLightKd[NUMBER_OF_POINTLIGHTS];',
            'uniform vec3 u_PointLightKs[NUMBER_OF_POINTLIGHTS];',
            'uniform vec3 u_DirLightDirection[NUMBER_OF_DIRECTIONLIGHTS];',
            'uniform bool u_DirLightSwitch[NUMBER_OF_DIRECTIONLIGHTS];',
            'uniform vec3 u_DirLightKa[NUMBER_OF_DIRECTIONLIGHTS];',
            'uniform vec3 u_DirLightKd[NUMBER_OF_DIRECTIONLIGHTS];',
            'uniform vec3 u_DirLightKs[NUMBER_OF_DIRECTIONLIGHTS];',
            'uniform vec3 u_MaterialKe;',
            'uniform vec3 u_MaterialKd;',
            'uniform vec3 u_MaterialKa;',
            'uniform vec3 u_MaterialKs;',
            'uniform float u_MaterialShininess;',
            'void main()',
            '{',
	        '  gl_Position = u_MvpMatrix * a_Position;',
        '  v_Position = u_ModelMatrix * a_Position;',
	'  v_transformedNormal = normalize(vec3(u_NormalMatrix * a_Normal));',
            '	vec3 pointKd = vec3( 0.0 );',
            '	vec3 pointKs = vec3( 0.0 );',
            '	vec3 pointKa = vec3( 0.0 );',
            'vec3 dirKd = vec3( 0.0 );',
            '	vec3 dirKs = vec3( 0.0 );',
            '	vec3 dirKa = vec3( 0.0 );',
            '	vec3 totalDiffuse = vec3( 0.0 );',
            '	vec3 totalSpecular = vec3( 0.0 );',
            '	vec3 totalAmbient = vec3(0.0);',
            '	vec3 normal = normalize(v_transformedNormal);',
            '	vec3 viewPosition = normalize(v_Position.xyz);',
            '	vec3 emissive = u_MaterialKe;',
            '  vec3 eyeDirection = normalize(u_eyePosWorld.xyz - v_Position.xyz);',
            '	for(int i = 0;i<NUMBER_OF_POINTLIGHTS;++i)',
            '	{',
            '		vec3 lightVector = u_PointLightPosition[i].xyz - v_Position.xyz;',
            '		float lightDistance = 1.0;',
	'float att = 1.0;',
//            '		if ( u_PointLightDistance[ i ] > 0.0 )',
            '		if (u_PointLightAtt[i]>0)',
	'{',
//            '			lightDistance = length(lightVector)/u_PointLightDistance[i];',
            '			att= 1.0 - min( ( length( lightVector ) / u_PointLightDistance[ i ] ), 1.0 );',
	'if(att>0.0){',
//	'att = 1.0/length(lightVector);',
	'if(u_PointLightAtt[i]==2)att = att*att;',
	'}',
	'}',
            '		lightVector = normalize( lightVector );',
            '		float dotProduct = dot( normal, lightVector );',
            '		float pointDiffuseWeight = max( dotProduct, 0.0 );',
	'if(u_PointLightSwitch[i])',
            '		pointKd += u_PointLightKd[ i ] * u_MaterialKd* pointDiffuseWeight*att;',
//            '		pointKd += u_PointLightKd[ i ] * u_MaterialKd* pointDiffuseWeight*lightDistance;',
            '		vec3 pointHalfVector = normalize( lightVector + eyeDirection);',
            '		float pointDotNormalHalf = max( dot( normal, pointHalfVector ), 0.0 );',
            '		float pointSpecularWeight = max( pow( pointDotNormalHalf, u_MaterialShininess ), 0.0 );',
            '		float specularNormalization = ( u_MaterialShininess + 2.0 ) / 8.0;',
            '		vec3 schlick = u_MaterialKs + vec3( 1.0 - u_MaterialKs ) * pow( max( 1.0 - dot( lightVector, pointHalfVector ), 0.0 ), 5.0 );',
//            '		pointKs += u_MaterialKs*u_PointLightKs[ i ]*pointSpecularWeight * pointDiffuseWeight * lightDistance * specularNormalization;',
	'if(u_PointLightSwitch[i])',
            '		pointKs += u_MaterialKs*u_PointLightKs[ i ]*pointSpecularWeight * att * specularNormalization;',
//            '		pointKs += u_MaterialKs*u_PointLightKs[ i ]*pointSpecularWeight * lightDistance * specularNormalization;',
	'if(u_PointLightSwitch[i])',
            '		pointKa += u_MaterialKa*u_PointLightKa[i];',
            '	}',
            '	for( int i = 0; i < NUMBER_OF_DIRECTIONLIGHTS; i ++ ) {',
            '	vec3 normLightDir = normalize(u_DirLightDirection[i]);',
            '		vec4 lightDirection = u_ViewMatrix * vec4( normLightDir, 0.0 );',
            '		vec3 dirVector = normalize( lightDirection.xyz );',
            '		float dotProduct = dot( normal, dirVector );',
            '		float dirDiffuseWeight = max( dotProduct, 0.0 );',
	'if(u_DirLightSwitch[i])',
            '		dirKd += u_MaterialKd * u_DirLightKd[ i ] * dirDiffuseWeight;',
            '		vec3 dirHalfVector = normalize( dirVector - viewPosition );',
            '		float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );',
            '		float dirSpecularWeight = max( pow( dirDotNormalHalf, u_MaterialShininess ), 0.0 );',
            '		float specularNormalization = ( u_MaterialShininess + 2.0 ) / 8.0;',
            '		vec3 schlick = u_MaterialKs + vec3( 1.0 - u_MaterialKs ) * pow( max( 1.0 - dot( dirVector, dirHalfVector ), 0.0 ), 5.0 );',
//            '		dirKs += u_MaterialKs * u_DirLightKs[ i ] * dirSpecularWeight * dirDiffuseWeight * specularNormalization;',
	'if(u_DirLightSwitch[i])',
            '		dirKs += u_MaterialKs * u_DirLightKs[ i ] * dirSpecularWeight * specularNormalization;',
//            '		dirKs += schlick * u_DirLightKs[ i ] * dirSpecularWeight * dirDiffuseWeight * specularNormalization;',
	'if(u_DirLightSwitch[i])',
            '		dirKa += u_MaterialKa * u_DirLightKa[ i ];',
            '	}',
            '	totalDiffuse += pointKd;',
            '	totalSpecular += pointKs;',
            '	totalAmbient += pointKa;',
            '	totalAmbient += dirKa;',
            '	totalDiffuse += dirKd;',
            '	totalSpecular += dirKs;',
//            '   totalAmbient = vec3(0.0);',
            '	v_Color = vec4(a_Color.xyz * ( emissive + totalDiffuse + totalAmbient +totalSpecular), 1.0);',
		'	 v_TexCoord = a_TexCoord;', 
            '}'
].join("\n")

// Fragment shader program
var GS_FSHADER =
         '#ifdef GL_ES\n' +
        'precision mediump float;\n' +
            '#endif;\n'+
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
var gAngle = [0.0,0.0];
var gMoveOffset = [45.0,10.0];

var meshHorse = [];
var meshParrot = [];
var meshGrid = {};
var cameraLight = {};
var pointLightEnv = {}; //enviroment point light
var rotatePointLight = {};
var diffuseLightEnv = {};
var renderModel = 0;

var modelMatrix = new Matrix4(); // Model matrix
var viewMatrix = new Matrix4();  // View matrix
var projMatrix = new Matrix4();  // Projection matrix
var mvpMatrix = new Matrix4();   // Model view projection matrix
var quatMatrix = new Matrix4();
var normalMatrix = new Matrix4();
var quat = new Quaternion(0,0,0,1);
var qx = new Quaternion(0,0,0,1);
var qy = new Quaternion(0,0,0,1);
var materials = [];

function genMaterialList()
{
    materials.push([0.2,0.2,0.2],[0.42,0.57,0.45],[1,0.43,0.36],100.0);
    materials.push([0.1,0.1,0.1],[0.6,0.0,0.0],[0.6,0.6,0.6],100.0);
    materials.push([0.05,0.05,0.05],[0.0,0.6,0.0],[0.2,0.2,0.2],60.0);
    materials.push([0.05,0.05,0.05],[0.0,0.2,0.6],[0.1,0.2,0.3],5.0);
    materials.push([0.0,0.0,0.0],[0.01,0.01,0.01],[0.5,0.5,0.5],32.0);
    materials.push([0.02,0.02,0.02],[0.01,0.01,0.01],[0.4,0.4,0.4],10.0);
    materials.push([0.329412, 0.223529, 0.027451],[0.780392, 0.568627, 0.113725],[0.992157, 0.941176, 0.807843],27.8974);
    materials.push([0.2125,   0.1275,   0.054],[0.714,    0.4284,   0.18144],[0.393548, 0.271906, 0.166721],25.6);
    materials.push([0.25,     0.148,    0.06475],[0.4,0.2368,0.1036],[0.774597,0.458561,0.200621],76.8);
    materials.push([0.25,0.25,0.25],[0.4,0.4,0.4],[0.774597,0.774597,0.774597],76.8);
    materials.push([0.19125,0.0735,0.0225],[0.7038,0.27048,0.0828],[0.256777, 0.137622, 0.086014],12.8);
    materials.push([0.2295,0.08825,0.0275],[0.5508,0.2118,0.066],[0.580594,0.223257,0.0695701],51.2);
    materials.push([0.24725,0.1995,0.0745],[0.75164,0.60648,0.22648],[0.628281,0.555802,0.366065],51.2);
    materials.push([0.24725,0.2245,0.0645],[0.34615,0.3143,0.0903],[0.797357,0.723991,0.208006],83.2);
    materials.push([0.105882, 0.058824, 0.113725],[0.427451, 0.470588, 0.541176],[0.333333, 0.333333, 0.521569],9.84615);
    materials.push([0.19225,  0.19225,  0.19225],[0.50754,  0.50754,  0.50754],[0.508273, 0.508273, 0.508273],51.2);
    materials.push([0.23125,  0.23125,  0.23125],[0.2775,   0.2775,   0.2775],[0.773911, 0.773911, 0.773911],89.6);
    materials.push([0.0215,  0.1745,   0.0215],[0.07568, 0.61424,  0.07568],[0.633,   0.727811, 0.633],76.8);
    materials.push([0.135,    0.2225,   0.1575],[0.54,     0.89,     0.63],[0.316228, 0.316228, 0.316228],12.8);
    materials.push([0.05375,  0.05,     0.06625],[0.18275,  0.17,     0.22525],[0.332741, 0.328634, 0.346435],38.4);
    materials.push([0.25,     0.20725,  0.20725],[1.0,      0.829,    0.829],[0.296648, 0.296648, 0.296648],11.264);
    materials.push([0.1745,   0.01175,  0.01175],[0.61424,  0.04136,  0.04136],[0.727811, 0.626959, 0.626959],76.8);
    materials.push([0.1,      0.18725,  0.1745],[0.396,    0.74151,  0.69102],[0.297254, 0.30829,  0.306678],12.8);
}

//create GUI
var FizzyText = function()
{
    this.message = "3D Light Control";
    this.Ambient = [128,128,128];
    this.Diffusion = [0,25.5,0];
    this.Specular = [255.0,255.0,255.0];
    this.X = pointLightEnv.position[0];
    this.Y = pointLightEnv.position[1];
    this.Z = pointLightEnv.position[2];
    this.distance = pointLightEnv.distance;
    this.Material = 0;
		this.switch = true;
	this.ATT = 1;
	this.Model = renderModel;
}

var CamLight = function()
{
	this.Distance = cameraLight.distance;
	this.Ambient = [cameraLight.ka[0]*255.0, cameraLight.ka[1]*255.0, cameraLight.ka[2]*255.0];
	this.Diffusion = [cameraLight.kd[0]*255.0, cameraLight.kd[1]*255.0, cameraLight.kd[2]*255.0];
	this.Specular = [cameraLight.ks[0]*255.0, cameraLight.ks[1]*255.0, cameraLight.ks[2]*255.0];
	this.switch = true;
	this.ATT = 1;
}
//create rotate light GUI
var RotLight = function()
{
	this.Distance = rotatePointLight.distance;
	this.Ambient = [rotatePointLight.ka[0]*255.0, rotatePointLight.ka[1]*255.0, rotatePointLight.ka[2]*255.0];
	this.Diffusion = [rotatePointLight.kd[0]*255.0, rotatePointLight.kd[1]*255.0, rotatePointLight.kd[2]*255.0];
	this.Specular = [rotatePointLight.ks[0]*255.0, rotatePointLight.ks[1]*255.0, rotatePointLight.ks[2]*255.0];
	this.switch = true;
	this.ATT = 1;
}

//create directional light GUI
var DirLight = function()
{
	this.Ambient = [diffuseLightEnv.ka[0]*255.0, diffuseLightEnv.ka[1]*255.0, diffuseLightEnv.ka[2]*255.0];
	this.Diffusion = [diffuseLightEnv.kd[0]*255.0, diffuseLightEnv.kd[1]*255.0, diffuseLightEnv.kd[2]*255.0];
	this.Specular = [diffuseLightEnv.ks[0]*255.0, diffuseLightEnv.ks[1]*255.0, diffuseLightEnv.ks[2]*255.0];
	this.switch = diffuseLightEnv.switch;
}

function createGUI()
{
    var text = new FizzyText();
	var rotLightElem = new RotLight();
	var dirLightElem = new DirLight();
	var camLightElem = new CamLight();
    var gui = new dat.GUI({autoPlace:true});//{autoPlace:true}
	
	var modelCtrl = gui.addFolder('Render Model Selection');
	modelCtrl.add(text,'Model',{Phong:0,Gouraud:1}).onChange(function(value){
		renderModel = value - '0';
	});

    var horseMtlCtrl = gui.addFolder('Horse');
    horseMtlCtrl.add(text,'Material', { Custom: 0, Red_Plastic: 1, GRN_PLASTIC: 2, BLU_PLASTIC:3,BLACK_PLASTIC:4,
                     BLACK_RUBBER:5, BRASS:6, BRONZE_DULL:7, BRONZE_SHINY:8, MATL_CHROME:9,
                         COPPER_DULL:10, COPPER_SHINY:11, GOLD_DULL:12, GOLD_SHINY:13,
                         PEWTER:14, SILVER_DULL:15, SILVER_SHINY:16, EMERALD:17,
                         JADE:18, OBSIDIAN:19, PEARL:20, RUBY:21, TURQUOISE:22}).onChange(function(value)
                {
                    meshHorse.material.ka = materials[value*4];
			meshHorse.material.kd = materials[value*4+1];
                    meshHorse.material.ks = materials[value*4+2];
                    meshHorse.material.shn = materials[value*4+3];
                }

                );

//    horseMtlCtrl.open();

    var parrotMtlCtrl = gui.addFolder('Parrot');
    parrotMtlCtrl.add(text,'Material', { Custom: 0, Red_Plastic: 1, GRN_PLASTIC: 2, BLU_PLASTIC:3,BLACK_PLASTIC:4,
                     BLACK_RUBBER:5, BRASS:6, BRONZE_DULL:7, BRONZE_SHINY:8, MATL_CHROME:9,
                         COPPER_DULL:10, COPPER_SHINY:11, GOLD_DULL:12, GOLD_SHINY:13,
                         PEWTER:14, SILVER_DULL:15, SILVER_SHINY:16, EMERALD:17,
                         JADE:18, OBSIDIAN:19, PEARL:20, RUBY:21, TURQUOISE:22}).onChange(function(value)
                {
                    meshParrot.material.ka = materials[value*4];
                    meshParrot.material.kd = materials[value*4+1];
                    meshParrot.material.ks = materials[value*4+2];
                    meshParrot.material.shn = materials[value*4+3];
		}

                );

//    parrotMtlCtrl.open();

	
	//add camear light control
	var camLightCtrl =gui.addFolder('Camera Point Light'); 
	camLightCtrl.addColor(camLightElem,'Ambient').onChange(function(value){
		cameraLight.ka[0] = value[0]/255;
		cameraLight.ka[1] = value[1]/255;
		cameraLight.ka[2] = value[2]/255;
	});
	camLightCtrl.addColor(camLightElem,'Diffusion').onChange(function(value){
		cameraLight.kd[0] = value[0]/255;
		cameraLight.kd[1] = value[1]/255;
		cameraLight.kd[2] = value[2]/255;
	});
	camLightCtrl.addColor(camLightElem,'Specular').onChange(function(value){
		cameraLight.ks[0] = value[0]/255;
		cameraLight.ks[1] = value[1]/255;
		cameraLight.ks[2] = value[2]/255;
	});
	camLightCtrl.add(camLightElem,'Distance',100,2000).onChange(function(value){
		cameraLight.distance = value;
	});
	camLightCtrl.add(camLightElem,'switch').onChange(function(value){
		cameraLight.switch = value;
	});
	camLightCtrl.add(camLightElem,'ATT',{None:0, Distance:1, SqureDistance:2}).onChange(function(value){
		cameraLight.att = value;
	});
//	camLightCtrl.open();
		
    var control = gui.addFolder('Point Light');
    control.addColor(text,'Ambient').onChange(function(value)
    {
        pointLightEnv.ka[0] = value[0]/255;
			pointLightEnv.ka[1] = value[1]/255;
        pointLightEnv.ka[2] = value[2]/255;
    });

    control.addColor(text,'Diffusion').onChange(function(value)
    {
        pointLightEnv.kd[0] = value[0]/255;
        pointLightEnv.kd[1] = value[1]/255;
        pointLightEnv.kd[2] = value[2]/255;
    });

    control.addColor(text,'Specular').onChange(function(value)
																							 {
        pointLightEnv.ks[0] = value[0]/255;
        pointLightEnv.ks[1] = value[1]/255;
        pointLightEnv.ks[2] = value[2]/255;
    });

    control.add(text,"X",-1000.0,1000.0).onChange(function(value)
    {
        pointLightEnv.position[0] = value;
    }
    )
    control.add(text,"Y",-1000.0,1000.0).onChange(function(value)
    {
        pointLightEnv.position[1] = value;
    }
    )
    control.add(text,"Z",-1000.0,1000.0).onChange(function(value)
																									{
        pointLightEnv.position[2] = value;
    }
    )
    control.add(text,'distance', 10,1000).onChange(function(value)
    {
        pointLightEnv.distance = value;
    });
																									 
		control.add(text,'switch').onChange(function(value){
			pointLightEnv.switch = value;
		});

	control.add(text,'ATT',{None:0, Distance:1, SqureDistance:2}).onChange(function(value){
		pointLightEnv.att = value;
	});
//    control.open();
	
	var rotLightCtrl =gui.addFolder('Rotating Point Light'); 
	rotLightCtrl.addColor(rotLightElem,'Ambient').onChange(function(value){
		rotatePointLight.ka[0] = value[0]/255;
		rotatePointLight.ka[1] = value[1]/255;
		rotatePointLight.ka[2] = value[2]/255;
	});
	rotLightCtrl.addColor(rotLightElem,'Diffusion').onChange(function(value){
		rotatePointLight.kd[0] = value[0]/255;
		rotatePointLight.kd[1] = value[1]/255;
		rotatePointLight.kd[2] = value[2]/255;
	});
	rotLightCtrl.addColor(rotLightElem,'Specular').onChange(function(value){
		rotatePointLight.ks[0] = value[0]/255;
		rotatePointLight.ks[1] = value[1]/255;
		rotatePointLight.ks[2] = value[2]/255;
	});
	rotLightCtrl.add(rotLightElem,'Distance',100,2000).onChange(function(value){
		rotatePointLight.distance = value;
	});
	rotLightCtrl.add(rotLightElem,'switch').onChange(function(value){
		rotatePointLight.switch = value;
	});
	
	rotLightCtrl.add(rotLightElem,'ATT',{None:0, Distance:1, SqureDistance:2}).onChange(function(value){
		rotatePointLight.att = value;
	});
// rotLightCtrl.open();																												

	var dirLightCtrl =gui.addFolder('Directional Light'); 
	dirLightCtrl.addColor(dirLightElem,'Ambient').onChange(function(value){
		diffuseLightEnv.ka[0] = value[0]/255;
		diffuseLightEnv.ka[1] = value[1]/255;
		diffuseLightEnv.ka[2] = value[2]/255;
	});
	dirLightCtrl.addColor(dirLightElem,'Diffusion').onChange(function(value){
		diffuseLightEnv.kd[0] = value[0]/255;
diffuseLightEnv.kd[1] = value[1]/255;
		diffuseLightEnv[2] = value[2]/255;
	});
	dirLightCtrl.addColor(dirLightElem,'Specular').onChange(function(value){
		diffuseLightEnv.ks[0] = value[0]/255;
diffuseLightEnv.ks[1] = value[1]/255;
		diffuseLightEnv.ks[2] = value[2]/255;
	});
	dirLightCtrl.add(dirLightElem,'switch').onChange(function(value){
		diffuseLightEnv.switch = value;
	});
	
// dirLightCtrl.open();																												
	
    gui.width = 300;
    gui.open();
}

function getGLUniform(gl,pos)
{
	var container = gl.programArray[pos];
//	gl.program = gl.programArray[0].program;
    // Get the storage locations of uniform variables: the scene
    container.u_eyePosWorld = gl.getUniformLocation(container.program, 'u_eyePosWorld');
    container.u_ModelMatrix = gl.getUniformLocation(container.program, 'u_ModelMatrix');
    container.u_MvpMatrix = gl.getUniformLocation(container.program, 	'u_MvpMatrix');
    container.u_NormalMatrix = gl.getUniformLocation(container.program,'u_NormalMatrix');
    container.u_ViewMatrix= gl.getUniformLocation(container.program,'u_ViewMatrix');
    if (!container.u_ModelMatrix	|| !container.u_MvpMatrix || !container.u_NormalMatrix|| !container.u_eyePosWorld
			 ||!container.u_ViewMatrix) {
        console.log('Failed to get matrix storage locations');
        return;
    }

    //  ... for Point light source:
    container.u_PLPos  = gl.getUniformLocation(container.program, 	'u_PointLightPosition');
    container.u_PLDist  = gl.getUniformLocation(container.program, 'u_PointLightDistance');
	container.u_PLSwitch = gl.getUniformLocation(container.program,'u_PointLightSwitch');
    container.u_PLKa = gl.getUniformLocation(container.program, 'u_PointLightKa');
    container.u_PLKd = gl.getUniformLocation(container.program, 'u_PointLightKd');
    container.u_PLKs = gl.getUniformLocation(container.program, 'u_PointLightKs');
    container.u_PLAtt = gl.getUniformLocation(container.program, 'u_PointLightAtt');

    if( !container.u_PLPos || !container.u_PLDist || !container.u_PLKa || !container.u_PLKd || !container.u_PLKs || !container.u_PLSwitch|| !container.u_PLAtt) {
        console.log('Failed to get the point light storage locations');
        return;
    }

    // for direction light
    container.u_DLDir = gl.getUniformLocation(container.program, 'u_DirLightDirection');
    container.u_DLKa = gl.getUniformLocation(container.program, 'u_DirLightKa');
    container.u_DLKd = gl.getUniformLocation(container.program, 'u_DirLightKd');
	container.u_DLSwitch = gl.getUniformLocation(container.program,'u_DirLightSwitch');
    container.u_DLKs = gl.getUniformLocation(container.program, 'u_DirLightKs');
    if( !container.u_DLDir || !container.u_DLKa || !container.u_DLKd || !container.u_DLKs || ! container.u_DLSwitch) {
        console.log('Failed to get the direction light storage locations');
        return;
    }

    // ... for Phong material/reflectance:
    container.u_Ke = gl.getUniformLocation(container.program, 'u_MaterialKe');
    container.u_Ka = gl.getUniformLocation(container.program, 'u_MaterialKa');
    container.u_Kd = gl.getUniformLocation(container.program, 'u_MaterialKd');
    container.u_Ks = gl.getUniformLocation(container.program, 'u_MaterialKs');
	container.u_Shiny = gl.getUniformLocation(container.program, 'u_MaterialShininess');
//    u_EnvAmbient = gl.getUniformLocation(gl.program, 'u_EnvAmbient');

    if(!container.u_Ke || !container.u_Ka || !container.u_Kd || !container.u_Ks || !container.u_Shiny ) {
//    if(!u_Ke || !u_Ka || !u_Kd || !u_Ks || !u_Shiny || !u_EnvAmbient) {
        console.log('Failed to get the Phong Reflectance storage locations');
        return;
    }

  container.u_UseLight =  gl.getUniformLocation(container.program, 'u_UseLight');
	
	container.u_UseTexture = gl.getUniformLocation(container.program, 'u_UseTexture');
	if(!container.u_UseTexture) {
		console.log('Failed to get use texture variable');
		return;
	}

	container.u_Sampler = gl.getUniformLocation(container.program, 'u_Sampler');
	if(!container.u_Sampler) {
		console.log('Failed to get use sampler variable');
		return;
	}

    //	gl.uniform1i(u_Kshiny, 4);							// Kshiny shinyness exponent
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
		imageHead.src = 'head.png';
	
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
function setLightUniform(gl,pos)
{
	var container = gl.programArray[pos];
    var pos = [cameraLight.position[0], cameraLight.position[1], cameraLight.position[2],1];
    pos.push(pointLightEnv.position[0], pointLightEnv.position[1], pointLightEnv.position[2],1);
    pos.push(rotatePointLight.position[0], rotatePointLight.position[1], rotatePointLight.position[2],1);
    gl.uniform4fv(container.u_PLPos,pos);
    delete pos;

    var color = [];
    color.push(cameraLight.ka[0],cameraLight.ka[1],cameraLight.ka[2]);
    color.push(pointLightEnv.ka[0], pointLightEnv.ka[1], pointLightEnv.ka[2]);
    color.push(rotatePointLight.ka[0], rotatePointLight.ka[1], rotatePointLight.ka[2]);
    gl.uniform3fv(container.u_PLKa, color);

    delete color;
    color = [];
    color.push(cameraLight.kd[0],cameraLight.kd[1],cameraLight.kd[2]);
    color.push(pointLightEnv.kd[0], pointLightEnv.kd[1], pointLightEnv.kd[2]);
    color.push(rotatePointLight.kd[0], rotatePointLight.kd[1], rotatePointLight.kd[2]);
    gl.uniform3fv(container.u_PLKd, color);

    delete color;
    color = [];
    color.push(cameraLight.ks[0],cameraLight.ks[1],cameraLight.ks[2]);
    color.push(pointLightEnv.ks[0], pointLightEnv.ks[1], pointLightEnv.ks[2]);
    color.push(rotatePointLight.ks[0], rotatePointLight.ks[1], rotatePointLight.ks[2]);
    gl.uniform3fv(container.u_PLKs, color);
    delete color;

		var att = [0,0,0];
//	if(cameraLight.att==='0')
//		dist[0] = 0;
//	else if(cameraLight.att==='1')
//		dist[0] = cameraLight.distance;
//	else if(cameraLight.att==='2')
//		dist[0] = cameraLight.distance*cameraLight.distance;
////	console.log(cameraLight.att);
	switch(cameraLight.att)
	{
			case '0':
			att[0] = 0;
			break;
			case '1':
			att[0] = 1;
			break;
			case '2':
			att[0] = 2;
			break;
	}
	switch(pointLightEnv.att)
	{
			case '0':
			att[1] = 0;
			break;
			case '1':
			att[1] = 1;
			break;
			case '2':
			att[1] = 2;
			break;
	}
		switch(rotatePointLight.att)
	{
			case '0':
			att[2] = 0;
			break;
			case '1':
			att[2] = 1;
			break;
			case '2':
			att[2] = 2;
			break;
	}
	
		
	gl.uniform1iv(container.u_PLAtt,att);
//	console.log(dist);
    var dist = [cameraLight.distance, pointLightEnv.distance, rotatePointLight.distance]
    gl.uniform1fv(container.u_PLDist,dist);
	
	 var lightSwitch = [cameraLight.switch, pointLightEnv.switch, rotatePointLight.switch];
			 gl.uniform1iv(container.u_PLSwitch, lightSwitch);


    //set directional light
    gl.uniform3fv(container.u_DLDir, diffuseLightEnv.dir);
    gl.uniform3fv(container.u_DLKa, diffuseLightEnv.ka);
    gl.uniform3fv(container.u_DLKd, diffuseLightEnv.kd);
    gl.uniform3fv(container.u_DLKs, diffuseLightEnv.ks);
	lightSwitch = [diffuseLightEnv.switch];
	gl.uniform1iv(container.u_DLSwitch,lightSwitch);
    // light = pointLightEnv;

    // gl.uniform4f(u_PLPos, 1,light.position[0], light.position[1], light.position[2],1.0);
    // gl.uniform3f(u_PLKa, 1,light.ka[0], light.ka[1], light.ka[2]);
    // gl.uniform3f(u_PLKd, 1,light.kd[0], light.kd[1], light.kd[2]);
    // gl.uniform3f(u_PLKd, 1,light.ks[0], light.ks[1], light.ks[2]);
    // gl.uniform1f(u_PLDist,1,light.distance);
}

function setMaterialUniform(gl,pos,camera, material)
{
	var container = gl.programArray[pos];
    //set eye position
    gl.uniform4f( container.u_eyePosWorld, camera.position[0], camera.position[1], camera.position[2], 1);
    //set material
    // // Set the Phong materials' reflectance:
    gl.uniform3f(container.u_Ke, 0.0, 0.0, 0.0);				// Ke emissive
    gl.uniform3f(container.u_Ka, material.ka[0], material.ka[1], material.ka[2]);				// Ka ambient
    gl.uniform3f(container.u_Kd, material.kd[0], material.kd[1], material.kd[2]);				// Kd	diffuse
    gl.uniform3f(container.u_Ks, material.ks[0], material.ks[1], material.ks[2]);				// Ks specular

    gl.uniform1f(container.u_Shiny, material.shn);
//    gl.uniform3f(u_EnvAmbient, 0.5,0.5,0.5);
}


function createCameraAndLight(width, height)
{
    cameraLight.ka = [0.4,0.4,0.4];
    cameraLight.kd = [0.5,0.5,0.5];
    cameraLight.ks = [0.8,0.6,0.7];
    cameraLight.distance = 500;
    cameraLight.position = [0,100,500];
	cameraLight.switch = true;
	cameraLight.att = '1';

    pointLightEnv.ka = [0.5,0.5,0.5];
    pointLightEnv.kd = [0,0.1,0];
    pointLightEnv.ks = [1.0,1.0,1.0];
    pointLightEnv.distance = 650;
    pointLightEnv.position = [200.0, 300.0, -200.0]
		pointLightEnv.switch = true;
	pointLightEnv.att = '1';

    rotatePointLight.ka = [0.3,0.3,0.3];
    rotatePointLight.kd = [1.0,0.0,0.32];
    rotatePointLight.ks = [0.7,0.8,0.9];
    rotatePointLight.position = [0,400,300];
    rotatePointLight.distance = 500;
	rotatePointLight.switch = true;
	rotatePointLight.att = '1';


    diffuseLightEnv.ka = [0.1,0.1,0.1];
    diffuseLightEnv.kd = [0.2,0.2,0.2];
    diffuseLightEnv.ks = [0.1,0.1,0.1];
    diffuseLightEnv.dir = [0,1,0]
		diffuseLightEnv.switch = true;

    camPerspective = new PerspectiveCamera(45,width/height,1,2000);
    camPerspective.position.set([0,100,500]);//eye position

    camPerspective.lookAt(0.0,100,0.0);
    camPerspective.aspect = width/ height;
    camPerspective.updateProjectionMatrix();

}

//create shader program
function initMyShaders(gl, vshader, fshader) {
  var program = createProgram(gl, vshader, fshader);
	
  if (!program) {
    console.log('Failed to create program');
    return false;
  }

	if(gl.programArray===undefined)
	{
		gl.programArray = [];
	}
	var glContainer = {};
	glContainer.program = program;
//  gl.useProgram(program);
//  gl.program = program;
	gl.programArray.push(glContainer);

  return true;
}

function draw2D(ctx) {
 ctx.clearRect(0, 0, 600, 400);  // Clear <hud>
  // Draw triangle with white lines
  // Draw white letters
 ctx.font = '16px "Times New Roman"';
 ctx.fillStyle = 'rgba(0, 255, 255, 1)';  // Set the letter color
 ctx.fillText('Project C: Lighting. The models used in this project are from Three.js(http://threejs.org)', 25, 25);
 ctx.font = 'bold 12px "Times New Roman"';
 ctx.fillStyle = 'rgba(255, 255, 0, 1)';  // Set the letter color
 ctx.fillText('Pan left/right: Ctrl + Left or A/Right or D', 25, 50);
 ctx.fillText('Tilt Up/Down : Shift + Up or W/Down or S', 25, 70);
 ctx.fillText('Move Forward/Backward, Ctrl + Up/Down', 25, 90);
 ctx.fillText('Mouse --> Left: Drag; Wheel: Zoom in/out', 300, 90);
}
function main() {

    genMaterialList();
    container = document.getElementById( 'container' );
	canvas = document.createElement( 'canvas' );//document.getElementById('webgl');
    // canvas = document.getElementById('webgl');
    	var hud = document.getElementById('hud');
//     hud.removeEventListener('mousedown',null, false);
    	var ctx = hud.getContext('2d');
    container.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var SCREEN_WIDTH = window.innerWidth;
    var SCREEN_HEIGHT = window.innerHeight;

    window.addEventListener( 'resize', onWindowResize, false );

    document.onkeydown = function(ev) {
        handleKeys(ev)
    }


    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL left');
        return;
    }
    
    gl.enable(gl.DEPTH_TEST);

    // Initialize shaders
//    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
//        console.log('Failed to intialize shaders.');
//        return;
//    }

	if(!initMyShaders(gl,VSHADER_SOURCE,FSHADER_SOURCE)) {
		console.log('Failed to Initialize Phong shader program.');
		return;
	}
	if(!initMyShaders(gl,GS_VSHADER,GS_FSHADER)) {
		console.log('Failed to Initialize Gour shader program.');
		return;
	}
	//gl.useProgram(gl.programArray[0].program);
    getGLUniform(gl,0);
	getGLUniform(gl,1);

    //create 3d object
    groupAllVertices();
    createObjectColor();
	initTextures(gl);
    initGLContext(gl,0);
	initGLContext(gl,1);
    createCameraAndLight(SCREEN_WIDTH,SCREEN_HEIGHT);
    createGUI();
    
    camCtrl = new OrbitControls(camPerspective,canvas);
    camCtrl.target[0]=0;
    camCtrl.target[1]=100;
    camCtrl.target[2]=0;

    gl.clearColor(0.0,0.0,0.0,1);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // gl.viewport(0,0,canvas.width,canvas.height);
    // renderStaticScence(gl,camPerspective);

    curHorseVertices = new Float32Array(meshHorse[0].vertices);//we only change those vertices runtime
    curHorseNormals = new Float32Array(meshHorse.rawFaces.length*3);
    curParrotVertices = new Float32Array(meshParrot[0].vertices);
    curParrotNormals = new Float32Array(meshParrot.rawFaces.length*3);
    //curToasterNormals = [];
    var tick = function() {
			draw2D(ctx);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gAngle = animate(gAngle);  // Update the rotation angle
        gl.viewport(0,0,canvas.width,canvas.height);
        renderAnimatedScene(gl,renderModel,camPerspective,gAngle);
        //camPerspective.updateMatrix();
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
var duration = 1000;
var lastFrame = 0;
var curFrame = 0;
var curTime = 0;
var lastFrameParrot = 0;
var curFrameParrot = 0;



function animate(angle) {
    //==============================================================================
    // Calculate the elapsed time
    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;

    curTime += elapsed;

    if(curTime > duration)
    {
        curTime %= duration;
    }

    curTime = Math.min(curTime,duration);
    var interpolation = duration / meshHorse.length;
    var frame = Math.floor( curTime / interpolation );
    if(frame >= meshHorse.length)
    {
        frame = frame%meshHorse.length;
    }
    var factor = 0;	//interpolate factor
    if ( frame != curFrame )
    {
        // factor = 1;
        lastFrame = curFrame;
        curFrame = frame;
    }
    factor = (curTime%interpolation)/interpolation;

    for(var i = 0;i<curHorseVertices.length;++i)
    {
        curHorseVertices[i] = (1-factor)*meshHorse[lastFrame].vertices[i]+factor*meshHorse[frame].vertices[i];
    }

    for(i=0;i<meshHorse.rawInteropVertices.length;++i)
    {
        meshHorse.rawInteropVertices[i] = (1-factor)*horsesVertex[lastFrame].vertices[i]+factor*horsesVertex[frame].vertices[i];
    }
    //we have to recalcuate the normals from raw correspondence between vertices and normals
    var rawNormals = calculateVertexNormals(meshHorse.rawInteropVertices, meshHorse.rawFaces);
    genMatchedNormals(meshHorse.rawFaces,rawNormals,curHorseNormals);

    //curHorseNormals = calculateVertexNormals(curHorseVertices,meshHorse.faces);


    //calculate parrot frame
    interpolation = duration / meshParrot.length;
    frame = Math.floor( curTime / interpolation );

    if(frame >= meshParrot.length)
    {
        frame = frame%meshParrot.length;
    }


    if ( frame != curFrameParrot)
    {
        // factor = 1;
        lastFrameParrot= curFrameParrot;
        curFrameParrot = frame;
    }
    factor = (curTime%interpolation)/interpolation;

    for(i = 0;i<curParrotVertices.length;++i)
    {
        curParrotVertices[i] = (1-factor)*meshParrot[lastFrameParrot].vertices[i]+factor*meshParrot[frame].vertices[i];
    }

    for(i=0;i<meshParrot.rawInteropVertices.length;++i)
    {
        meshParrot.rawInteropVertices[i] = (1-factor)*parrotVertex[lastFrameParrot].vertices[i]+factor*parrotVertex[curFrameParrot].vertices[i];
		}

    delete rawNormals;
    rawNormals = calculateVertexNormals(meshParrot.rawInteropVertices, meshParrot.rawFaces);
    genMatchedNormals(meshParrot.rawFaces,rawNormals,curParrotNormals);

    angle[0] += (gMoveOffset[0] * elapsed) / 1000.0;
    angle[1] += (gMoveOffset[1] * elapsed)*0.002;
    if(angle[1]>150 && gMoveOffset[1]>0)
    {
        gMoveOffset[1] = -gMoveOffset[1];
    }
    if(angle[1]<5 && gMoveOffset[1]<0)
    {
        gMoveOffset[1] = -gMoveOffset[1];
    }


    var time = now * 0.005;
    rotatePointLight.position[0] = Math.sin( time * 0.7 ) * 300;
    rotatePointLight.position[1] = Math.cos( time * 0.5 ) * 400;
    rotatePointLight.position[2] = Math.cos( time * 0.3 ) * 300;
    return [angle[0],angle[1]];
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

function initGLContext(gl,pos)
{
    //create vertex buffer
	var container = gl.programArray[pos];
    container.vertexBuffer = gl.createBuffer();
    if (!container.vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }


    //copy vertices
    var offset = 0;
    container.totalVertices = new Float32Array(meshGrid.vertices.length+meshToaster.vertexArray.length+meshHorse[0].vertices.length+meshParrot[0].vertices.length);
    //copy grid vertices
    copyArrays(meshGrid.vertices,container.totalVertices,offset);
    //copy toaster vertices
    offset+=meshGrid.vertices.length;
    copyArrays(meshToaster.vertexArray,container.totalVertices,offset);
    offset+=meshToaster.vertexArray.length;
    meshHorse.vertexOffset = offset;
    meshParrot.vertexOffset = offset+meshHorse[0].vertices.length;
   

    container.totalNormals = new Float32Array(container.totalVertices.length);
    //copy grid normals
    copyArrays(meshGrid.normals,container.totalNormals,0);
    //copy toaster normals
    copyArrays(meshToaster.normalArray,container.totalNormals,meshGrid.vertices.length);

    //adjust face index for following meshes
    offset = meshGrid.vertices.length/3;
		if(pos==0)
		{
			adjustFaceIndices(meshToaster.faces, meshToaster.faces.length, offset);
    adjustFaceIndices(meshToaster.jawFaceArray, meshToaster.jawFaceArray.length,offset);
    adjustFaceIndices(meshToaster.headHeadFaceArray, meshToaster.headHeadFaceArray.length,offset);
    adjustFaceIndices(meshToaster.headEyesFaceArray, meshToaster.headEyesFaceArray.length,offset);
    adjustFaceIndices(meshToaster.leftLegFaceArray, meshToaster.leftLegFaceArray.length,offset);
    adjustFaceIndices(meshToaster.rightLegFaceArray, meshToaster.rightLegFaceArray.length,offset);
    adjustFaceIndices(meshToaster.wkkFaceArray, meshToaster.wkkFaceArray.length,offset);
    adjustFaceIndices(meshToaster.wksFaceArray, meshToaster.wksFaceArray.length,offset);
    offset += meshToaster.vertexArray.length/3;
    meshHorse.facesAdjust = new Uint16Array(meshHorse.faces);
    //adjust horse face indexes
    adjustFaceIndices(meshHorse.facesAdjust,meshHorse.facesAdjust.length,offset);
    offset += meshHorse[0].vertices.length/3;
    //adjust parrot face indexes
    meshParrot.facesAdjust = new Uint16Array(meshParrot.faces);
    adjustFaceIndices(meshParrot.facesAdjust,meshParrot.facesAdjust.length,offset);
		}


    gl.bindBuffer(gl.ARRAY_BUFFER, container.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, container.totalVertices, gl.STATIC_DRAW);

    //Get the storage location of a_Position, assign and enable buffer
//    container.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    container.a_Position = gl.getAttribLocation(container.program, 'a_Position');
    if(container.a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(container.a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(container.a_Position);  // Enable the assignment of the buffer object

    //
    //create normal buffer;
    container.normalBuffer = gl.createBuffer();
    if (!container.normalBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, container.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,container.totalNormals,gl.STATIC_DRAW);
    container.a_Normal = gl.getAttribLocation(container.program, 'a_Normal');
    if(container.a_Normal < 0) {
        console.log('Failed to get the storage location of a_Normal');
        return -1;
    }
    // Assign the buffer object to a_Color variable
    gl.vertexAttribPointer(container.a_Normal, 3, gl.FLOAT, false, 0,0);
    gl.enableVertexAttribArray(container.a_Normal);  // Enable the assignment of the buffer object

    //create color buffer
    container.totalColor = new Float32Array(meshGrid.colors.length+meshHorse.colors.length+meshParrot.colors.length+meshToaster.colorArray.length);
    copyArrays(meshGrid.colors,container.totalColor,0);
    offset = meshGrid.colors.length;
    copyArrays(meshToaster.colorArray,container.totalColor,offset);
    offset += meshToaster.colorArray.length;
    copyArrays(meshHorse.colors,container.totalColor,offset);
    offset += meshHorse.colors.length;
    copyArrays(meshParrot.colors,container.totalColor,offset);

    container.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,container.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,container.totalColor,gl.STATIC_DRAW);
    container.a_Color = gl.getAttribLocation(container.program, 'a_Color');
    gl.vertexAttribPointer(container.a_Color, 3, gl.FLOAT, false,0,0);
    gl.enableVertexAttribArray(container.a_Color);

	//copy UVs
	container.totalUVs = new Float32Array(meshGrid.uvs.length+meshHorse.uvs.length+meshParrot.uvs.length+meshToaster.texArray.length);	
    copyArrays(meshGrid.uvs,container.totalUVs,0);
    offset = meshGrid.uvs.length;
    copyArrays(meshToaster.texArray,container.totalUVs,offset);
    offset += meshToaster.texArray.length;
    copyArrays(meshHorse.uvs,container.totalUVs,offset);
    offset += meshHorse.uvs.length;
    copyArrays(meshParrot.uvs,container.totalUVs,offset);
		   container.texBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,container.texBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,container.totalUVs,gl.STATIC_DRAW);
	container.a_TexCorrd = gl.getAttribLocation(container.program,'a_TexCoord');
	gl.vertexAttribPointer(container.a_TexCorrd,2,gl.FLOAT,false,0,0);
	gl.enableVertexAttribArray(container.a_TexCorrd);
	
    container.indexBuffer = gl.createBuffer();
    if(!container.indexBuffer) {
        console.log('Failed to create index buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,container.indexBuffer);
    //gl.bindBuffer(gl.ARRAY_BUFFER,null);
}



//function drawCustomColorObject(gl, projectionMatrix, viewMatrix, modelViewMatrix, faceIndexArray)
//{
//	gl.uniform1i(u_UseVertexColor,1);
//    mvpMatrix.set(projectionMatrix).multiply(viewMatrix).multiply(modelViewMatrix);
//    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
//    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,faceIndexArray,gl.STATIC_DRAW);
//    gl.drawElements(gl.TRIANGLES,faceIndexArray.length,gl.UNSIGNED_SHORT,0);
//}

function drawObject(gl,pos, projectionMatrix, viewMatrix, modelViewMatrix, faceIndexArray)
{

	var container = gl.programArray[pos];
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(container.u_NormalMatrix, false, normalMatrix.elements);
    mvpMatrix.set(projectionMatrix).multiply(viewMatrix).multiply(modelViewMatrix);
    gl.uniformMatrix4fv(container.u_MvpMatrix, false, mvpMatrix.elements);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,faceIndexArray,gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES,faceIndexArray.length,gl.UNSIGNED_SHORT,0);
}



function drawGrid(gl,pos,camera, modelMatrix)
{
	var container = gl.programArray[pos];
    modelMatrix.setTranslate(0,0,0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(container.u_NormalMatrix, false, normalMatrix.elements);
    mvpMatrix.set(camera.projectionMatrix).multiply(camera.viewMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(container.u_MvpMatrix, false, mvpMatrix.elements);
    //gl.uniform3f(u_AmbientColor, 0x88,0x88,0x88);

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,meshGrid.faces,gl.STATIC_DRAW);
    gl.drawElements(gl.LINES,meshGrid.faces.length,gl.UNSIGNED_SHORT,0);
}

function rebindBuffer(gl,pos)
{
	var container = gl.programArray[pos];
	    gl.bindBuffer(gl.ARRAY_BUFFER, container.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, container.totalVertices, gl.STATIC_DRAW);
	gl.vertexAttribPointer(container.a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(container.a_Position); 
	
	gl.bindBuffer(gl.ARRAY_BUFFER, container.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,container.totalNormals,gl.STATIC_DRAW);
	gl.vertexAttribPointer(container.a_Normal, 3, gl.FLOAT, false, 0,0);
    gl.enableVertexAttribArray(container.a_Normal); 
	
	gl.bindBuffer(gl.ARRAY_BUFFER,container.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,container.totalColor,gl.STATIC_DRAW);
    gl.vertexAttribPointer(container.a_Color, 3, gl.FLOAT, false,0,0);
    gl.enableVertexAttribArray(container.a_Color);
	
	gl.bindBuffer(gl.ARRAY_BUFFER,container.texBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,container.totalUVs,gl.STATIC_DRAW);
	gl.vertexAttribPointer(container.a_TexCorrd,2,gl.FLOAT,false,0,0);
	gl.enableVertexAttribArray(container.a_TexCorrd);
	
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,container.indexBuffer);
	
}

function renderAnimatedScene(gl,pos,camera,angles)
{
	var container = gl.programArray[pos];
	gl.useProgram(container.program);
    copyArrays(curHorseVertices,container.totalVertices,meshHorse.vertexOffset);
    copyArrays(curHorseNormals,container.totalNormals,meshHorse.vertexOffset);
    copyArrays(curParrotVertices,container.totalVertices,meshParrot.vertexOffset);
    copyArrays(curParrotNormals,container.totalNormals,meshParrot.vertexOffset);

	rebindBuffer(gl,pos);
//    gl.bindBuffer(gl.ARRAY_BUFFER, container.vertexBuffer);
//    gl.bufferData(gl.ARRAY_BUFFER, container.totalVertices, gl.STATIC_DRAW);
//    gl.bindBuffer(gl.ARRAY_BUFFER, container.normalBuffer);
//    gl.bufferData(gl.ARRAY_BUFFER, container.totalNormals, gl.STATIC_DRAW);

	if(container.u_UseLight)
	{
    gl.uniform1i(container.u_UseLight,1);
	}
	gl.uniform1i(container.u_UseTexture,0);
    gl.uniformMatrix4fv(container.u_ModelMatrix, false, modelMatrix.elements);
    setMaterialUniform(gl, pos, camPerspective, meshGrid.material);
    drawGrid(gl,pos,camera,modelMatrix);
    //var i = 0;
    //gl.uniform4f(u_eyePosWorld, camera.position[0], camera.position[1], camera.position[2], 1);
	//
    // modelMatrix.setTranslate(50,0,-20);
	modelMatrix.setTranslate(Math.cos(gAngle[0]*0.5*Math.PI/180)*400, 5, Math.sin(gAngle[0]*0.5*Math.PI/180)*400);
    modelMatrix.scale(0.1,0.1,0.1);
	modelMatrix.translate(meshHorse.bodyCenter[0],meshHorse.bodyCenter[1],meshHorse.bodyCenter[2]);
	quat.setFromAxisAngle(0,1,0,-gAngle[0]*0.5);
    quatMatrix.setFromQuat(quat.x,quat.y,quat.z,quat.w);
	modelMatrix.concat(quatMatrix);
	modelMatrix.translate(-meshHorse.bodyCenter[0],-meshHorse.bodyCenter[1],-meshHorse.bodyCenter[2]);
	//modelMatrix.rotate(90-gAngle[0]*0.5,0,1,0);
	
	//modelMatrix.translate(-center[0],-center[1],-center[2]);
    gl.uniformMatrix4fv(container.u_ModelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(container.u_ViewMatrix, false, camera.viewMatrix.elements);
    setLightUniform(gl,pos);
    gl.uniform1i(container.u_UseLight,1);
    //setLightUniform(pointLightEnv,1);
    setMaterialUniform(gl,pos,camPerspective, meshHorse.material);
    drawObject(gl,pos,camera.projectionMatrix,camera.viewMatrix,modelMatrix,meshHorse.facesAdjust);

    modelMatrix.setTranslate(-100,150,-10);
    modelMatrix.scale(0.3,0.3,0.3);
    gl.uniformMatrix4fv(container.u_ModelMatrix, false, modelMatrix.elements);
    //setLightUniform(cameraLight,0);
    //setLightUniform(pointLightEnv,1);
    setMaterialUniform(gl,pos,camPerspective, meshParrot.material);
    drawObject(gl,pos,camera.projectionMatrix,camera.viewMatrix,modelMatrix,meshParrot.facesAdjust);


    //render toasters
	center = [meshToaster.headBox[0]/2+meshToaster.headBox[1]/2,
								meshToaster.headBox[2]/2+meshToaster.headBox[3]/2,
								meshToaster.headBox[4]/2+meshToaster.headBox[5]/2];
	modelMatrix.setIdentity();
	modelMatrix.translate(Math.cos(gAngle[0]*Math.PI/180)*300, 5, Math.sin(gAngle[0]*Math.PI/180)*300);
    //modelMatrix.translate(0,gAngle[1],0);
     modelMatrix.scale(0.7,0.7,0.7);
    // modelMatrix.translate(350,50,20);
	pushMatrix(modelMatrix);
	modelMatrix.translate(center[0],center[1],center[2]);
	modelMatrix.rotate(gAngle[0],0,1,0);
	modelMatrix.translate(-center[0],-center[1],-center[2]);
    gl.uniformMatrix4fv(container.u_ModelMatrix, false, modelMatrix.elements);
//    setMaterialUniform(camPerspective, meshToaster.material.head);
	gl.uniform1i(container.u_UseTexture,1);
		gl.activeTexture(gl.TEXTURE0);
		gl.uniform1i(container.u_Sampler,0);
	gl.bindTexture(gl.TEXTURE_2D,textureHead);
     drawObject(gl,pos,camera.projectionMatrix,camera.viewMatrix,modelMatrix,meshToaster.headHeadFaceArray);
    setMaterialUniform(gl,pos,camPerspective, meshToaster.material.eye);
     drawObject(gl,pos,camera.projectionMatrix,camera.viewMatrix,modelMatrix,meshToaster.headEyesFaceArray);
	 
	 	center = [meshToaster.keyBox[0]/2+meshToaster.keyBox[1]/2,
								meshToaster.keyBox[2]/2+meshToaster.keyBox[3]/2,
								meshToaster.keyBox[4]/2+meshToaster.keyBox[5]/2];
	modelMatrix.translate(center[0],center[1],center[2]);
	modelMatrix.rotate(gAngle[0],0,0,1);
	modelMatrix.translate(-center[0],-center[1],-center[2]);
	 gl.activeTexture(gl.TEXTURE3);
		gl.uniform1i(container.u_Sampler,3);
	gl.bindTexture(gl.TEXTURE_2D,textureKey);
    setMaterialUniform(gl,pos,camPerspective, meshToaster.material.wkk);
     drawObject(gl,pos,camera.projectionMatrix,camera.viewMatrix,modelMatrix,meshToaster.wkkFaceArray);
		gl.activeTexture(gl.TEXTURE4);
		gl.uniform1i(container.u_Sampler,4);
	gl.bindTexture(gl.TEXTURE_2D,texturePin);
    setMaterialUniform(gl,pos,camPerspective, meshToaster.material.wks);
     drawObject(gl,pos,camera.projectionMatrix,camera.viewMatrix,modelMatrix,meshToaster.wksFaceArray);
	
	modelMatrix = popMatrix();
	pushMatrix(modelMatrix);
	center = [meshToaster.jawBox[0]/2+meshToaster.jawBox[1]/2,
								meshToaster.jawBox[2]/2+meshToaster.jawBox[3]/2,
								meshToaster.jawBox[4]/2+meshToaster.jawBox[5]/2];
		gl.activeTexture(gl.TEXTURE1);
		gl.uniform1i(container.u_Sampler,1);
	gl.bindTexture(gl.TEXTURE_2D,textureJaw);
    gl.uniformMatrix4fv(container.u_ModelMatrix, false, modelMatrix.elements);
	modelMatrix.translate(center[0],center[1],center[2]);
	modelMatrix.rotate(-gAngle[0],0,1,0);
	modelMatrix.translate(-center[0],-center[1],-center[2]);
    setMaterialUniform(gl,pos,camPerspective, meshToaster.material.jaw);
     drawObject(gl,pos,camera.projectionMatrix,camera.viewMatrix,modelMatrix,meshToaster.jawFaceArray);

		gl.activeTexture(gl.TEXTURE2);
		gl.uniform1i(container.u_Sampler,2);
	gl.bindTexture(gl.TEXTURE_2D,textureLeg);
    setMaterialUniform(gl,pos,camPerspective, meshToaster.material.leg);
     drawObject(gl,pos,camera.projectionMatrix,camera.viewMatrix,modelMatrix,meshToaster.leftLegFaceArray);
    setMaterialUniform(gl,pos,camPerspective, meshToaster.material.leg);
     drawObject(gl,pos,camera.projectionMatrix,camera.viewMatrix,modelMatrix,meshToaster.rightLegFaceArray);
}



// function genGrid(size, step) {


// // var idx = 0;
// var vertices = []
// // var colors = []
// var normals = []
// var indices = []
// var idx = 0;
// var r = 0x88,g = 0x88, b = 0x88;

// for ( var i = - size; i <= size; i += step ) {

// vertices.push(-size,0,i,1.0);
// normals.push(1,1,1);

// vertices.push(size,0,i,1.0);
// normals.push(1,1,1);
// vertices.push(i,0,-size,1.0);
// normals.push(1,1,1);
// vertices.push(i,0,size,1.0);
// normals.push(1,1,1);
// indices.push(idx,idx+1,idx+2,idx+3)
// idx+=4

// }

// gridVertexArray = new Float32Array(vertices);
// gridNormalArray = new Float32Array(normals);
// gridIndexArray = new Uint16Array(indices);
// }
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

//function createAxis()
//{
//    // axisVertices = new Float32Array( [
//    // 0, 0, 0,  1, 1,0,0,
//    // 50, 0, 0, 1,1,0.6,0,
//    // 0, 0, 0,  1, 0,1,0,
//    // 0, 50, 0, 1, 0.6,1,0,
//    // 0, 0, 0,  1, 0,0,1,
//    // 0, 0, 50, 1, 0,0.6,1,
//    // ] );
//
//    axisVertices = new Float32Array( [
//                                        0, 0, 0,  1, //1,0,0,
//                                        50, 0, 0, 1,//1,0.6,0,
//                                        0, 0, 0,  1, //0,1,0,
//                                        0, 50, 0, 1, //0.6,1,0,
//                                        0, 0, 0,  1, //0,0,1,
//                                        0, 0, 50, 1, //0,0.6,1,
//                                    ] );
//
//    axisColors = new Float32Array(
//                [
//                    1,0,0,
//                    1,0.6,0,
//                    0,1,0,
//                    0.6,1,0,
//                    0,0,1,
//                    0,0.6,1,
//                ]
//                )
//
//    axisNormals = new Float32Array(
//                [
//                    1,1,0,
//                    1,1,1,
//                    1,1,1,
//                    1,1,1,
//                    1,1,1,
//                    1,1,1
//                ]
//                )
//    axisIndices = new Uint16Array(
//                [
//                    0,1,2,3,4,5,
//                ]
//                );
//}

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

function adjustFaceIndices(faceArray,len,offset)
{
    for(var i=0;i<len;++i)
    {
        faceArray[i] += offset;
    }
}



function generateNormals(tsVertexArray)
{
    //offset += tsRightLegFaceArray.length;
    return calculateVertexNormals(tsVertexArray,meshesToaster.faces);
}

function genMatchedVBO(vertexArray, faceArray, normalArray,  container)
{
    var frame = {}
    frame.vertices = new Float32Array(faceArray.length*3);
    frame.normals = new Float32Array(faceArray.length*3);
    var offset = 0;
    var vi = 0;
	var uvOffset = 0;
    for(var f = 0;f<faceArray.length;++f)
    {
        vi = faceArray[f];
        frame.vertices[offset] = vertexArray[vi*3];
        frame.vertices[offset+1] = vertexArray[vi*3+1];
        frame.vertices[offset+2] = vertexArray[vi*3+2];
        frame.normals[offset] = normalArray[vi*3];
        frame.normals[offset+1] = normalArray[vi*3+1];
        frame.normals[offset+2] = normalArray[vi*3+2];
        offset += 3;
    }
	
    container.push(frame);
}

function genArrangedFacesAndColor(faceArray, colorArray, uvArray, container)
{
    container.faces = new Uint16Array(faceArray.length);
    container.colors = new Float32Array(faceArray.length*3);
	container.uvs = new Float32Array(faceArray.length*2);
	var uvOffset = 0;

    for(var f = 0;f<faceArray.length;++f)
    {
        container.faces[f] = f;
				container.uvs[uvOffset] = uvArray[i*2];
				container.uvs[uvOffset+1] = uvArray[i*2+1]; 
			uvOffset += 2;
    }


    var len = faceArray.length/3;
    var offset = 0;
    for(var i = 0;i<len;++i)
    {
        container.colors[offset]=colorArray[i*3];
			container.colors[offset+1]=colorArray[i*3+1];
        container.colors[offset+2]=colorArray[i*3+2];

        container.colors[offset+3]=colorArray[i*3];
        container.colors[offset+4]=colorArray[i*3+1];
        container.colors[offset+5]=colorArray[i*3+2];

        container.colors[offset+6]=colorArray[i*3];
        container.colors[offset+7]=colorArray[i*3+1];
        container.colors[offset+8]=colorArray[i*3+2];

        offset+=9;

    }
}


function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}

function genMatchedNormals(rawFaces, rawNormals, outNormals)
{
    var length = rawFaces.length;
    var offset = 0;
    var vi = 0;
    for(var i = 0;i<length;++i)
    {
        vi = rawFaces[i];
        outNormals[offset] = rawNormals[vi*3];
        outNormals[offset+1] = rawNormals[vi*3+1];
        outNormals[offset+2] = rawNormals[vi*3+2];
        offset+=3;
    }
}


function groupAllVertices()
{
    createExtraMeshes();
    //process extra meshes: toaster
    //calcuate normals
    meshToaster.normalArray = calculateVertexNormals(meshToaster.vertexArray, meshToaster.faces);
    createMeshes();
    genGrid(1000, 30);
    //genToasterMeshes();

    var vertices = []
    var total_vertex_length = 0;
    var faces = []
    //var horseTextures = []
    var offset = 0;
	var uvs = [];
    var faceLength = horseFaces.length;

    while(offset<faceLength)
    {
        offset++;
        faces.push(horseFaces[offset++]);
        faces.push(horseFaces[offset++]);
        faces.push(horseFaces[offset++]);

        offset++;

        for (var j = 0; j < 3; j ++ )
        {
            var uvIndex = horseFaces[ offset++ ];
            uvs.push(horseTexArray[2*uvIndex]);
            uvs.push(horseTexArray[2*uvIndex+1]);
        }
    }


    meshHorse.rawFaces = new Uint16Array(faces);
    meshHorse.rawInteropVertices = new Float32Array(horsesVertex[0].vertices.length);//raw vertices to be interpolate
    genArrangedFacesAndColor(faces,horseColors,uvs,meshHorse);
    for(var i = 0;i<horsesVertex.length;++i)
    {
        var normals = calculateVertexNormals(horsesVertex[i].vertices,meshHorse.rawFaces);
        genMatchedVBO(horsesVertex[i].vertices,meshHorse.rawFaces,normals,meshHorse);
    }
	
	meshHorse.bodyBox = getBoundingBox(meshHorse.rawFaces,horsesVertex[0].vertices);
	meshHorse.bodyCenter = [meshHorse.bodyBox[0]/2+meshHorse.bodyBox[1]/2,
							meshHorse.bodyBox[2]/2+meshHorse.bodyBox[3]/2,
							meshHorse.bodyBox[4]/2+meshHorse.bodyBox[5]/2];
	

    //set horse color
    meshHorse.material = {}
    meshHorse.material.ka = [0.2,0.2,0.2];
//    meshHorse.material.ka = [0.1,      0.18725,  0.1745];
    meshHorse.material.kd = [0.42,0.57,0.45];
//    meshHorse.material.kd = [0.396,    0.74151,  0.69102];
    meshHorse.material.ks = [1,0.43,0.36];
//    meshHorse.material.ks = [0.297254, 0.30829,  0.306678];
    meshHorse.material.shn = 100; //shininess

    //parrot
    delete faces;
	delete uvs;
    faces = []
		uvs = [];
    faceLength = parrotFaces.length;
    offset = 0;
    while(offset<faceLength)
    {
        offset++;
        faces.push(parrotFaces[offset++]);
        faces.push(parrotFaces[offset++]);
        faces.push(parrotFaces[offset++]);

        offset++;

        for (var j = 0; j < 3; j ++ )
        {
            uvIndex = parrotFaces[ offset++ ];
            uvs.push(parrotTexArray[2*uvIndex]);
            uvs.push(parrotTexArray[2*uvIndex+1]);
        }
    }

    meshParrot.rawFaces = new Uint16Array(faces);
    meshParrot.rawInteropVertices = new Float32Array(parrotVertex[0].vertices.length);//raw vertices to be interpolate
    //meshParrot.colors = new Float32Array(parrotColors);
    genArrangedFacesAndColor(faces,parrotColors,uvs,meshParrot);
    for(var i=0;i<parrotVertex.length;++i)
    {
        normals = calculateVertexNormals(parrotVertex[i].vertices,meshParrot.rawFaces);
        genMatchedVBO(parrotVertex[i].vertices,meshParrot.rawFaces,normals,meshParrot);
    }

    meshParrot.material = {}
    meshParrot.material.ka = [0.2, 0.2, 0.2];
    meshParrot.material.kd = [0.5, 0.5, 0.5];
    meshParrot.material.ks = [0.2, 0.2, 1.0];
    meshParrot.material.shn = 100; //shininess

    //delete realFaces;
    delete faces;
    delete uvs;

    //meshToaster.material = {};
    //generate unused color array for toaser meshes (since we have to align all the vertice array, normal array and color array)
}


var hTheta = 0.0;
var vTheta = 0.0;
var vThetaOffset = Math.PI*0.0001;
var hThetaOffset = Math.PI*0.005;
function handleKeys(event) {

    var offset = 10;

    if(event.shiftKey) {
		var zoffset = camPerspective.position[2] - camCtrl.target[2];
		var xoffset = camPerspective.position[0] - camCtrl.target[0];
		var r = Math.sqrt(xoffset*xoffset+zoffset*zoffset);
        switch(event.keyCode) {//determine the key pressed
        case 65://a key
        case 37://left arrow
			camCtrl.target[0] -= r*(Math.sin(hTheta+hThetaOffset)-Math.sin(hTheta));
			camCtrl.target[2] -= r*(Math.cos(hTheta+hThetaOffset)-Math.cos(hTheta));
			hTheta += hThetaOffset;
            //			camCtrlOrtho.target[0] -= offset;
            break;
        case 68://d key
        case 39://right arrow
			camCtrl.target[0] += r*(Math.sin(hTheta+hThetaOffset)-Math.sin(hTheta));
			camCtrl.target[2] -= r*(Math.cos(hTheta+hThetaOffset)-Math.cos(hTheta));
			hTheta += hThetaOffset;
            //			camCtrlOrtho.target[0] += offset;
            break;
        case 83://s key
        case 40://down arrow
			vTheta+= vThetaOffset;
			if(vTheta < -Math.PI*80/180 && vThetaOffset<0) vThetaOffset = -vThetaOffset;
			if(vTheta > Math.PI*80/180 && vThetaOffset>0) vThetaOffset = -vThetaOffset;
			camCtrl.target[1] -= r*Math.tan(vTheta);
            //			camCtrlOrtho.target[1] -= offset;
            break;
        case 87://w key
        case 38://up arrow
			vTheta+= vThetaOffset;
			if(vTheta < -Math.PI*80/180 && vThetaOffset<0) vThetaOffset = -vThetaOffset;
			if(vTheta > Math.PI*80/180 && vThetaOffset>0) vThetaOffset = -vThetaOffset;
			camCtrl.target[1] += r*Math.tan(vTheta);
            //			camCtrlOrtho.target[1] += offset;
            break;
        }
    }
    else {

			if(event.ctrlKey) {
        switch(event.keyCode) {//determine the key pressed
        case 65://a key
        case 37://left arrow
            camPerspective.position[0]-=offset;
            camCtrl.target[0]-=offset;
            cameraLight.position[0]-=offset;
            //			camOrtho.position[0]-=offset;
            //			camCtrlOrtho.target[0]-=offset;
            break;
        case 68://d key
        case 39://right arrow
            camPerspective.position[0]+=offset;
            camCtrl.target[0]+=offset;
            cameraLight.position[0]+=offset;
            //			camOrtho.position[0]+=offset;
            //			camCtrlOrtho.target[0]+=offset;
            break;
        case 83://s key
            camPerspective.position[1]-=offset;
            camCtrl.target[1]-=offset;
            cameraLight.position[1]-=offset;
            //			camOrtho.position[1]-=offset;
            //			camCtrlOrtho.target[1]-=offset;
            break;
        case 40://down arrow
            camPerspective.position[2]+=offset;
            camCtrl.target[2]+=offset;
            cameraLight.position[2]+=offset;
            //			camOrtho.position[2]+=offset;
            //			camCtrlOrtho.target[2]+=offset;
            break;
        case 87://w key
            camPerspective.position[1]+=offset;
            camCtrl.target[1]+=offset;
            cameraLight.position[1]+=offset;
            //			camOrtho.position[1]+=offset;
            //			camCtrlOrtho.target[1]+=offset;
            break;
        case 38://up arrow
            camPerspective.position[2]-=offset;
            camCtrl.target[2]-=offset;
            cameraLight.position[2]-=offset;
            //			camOrtho.position[2]-=offset;
            //			camCtrlOrtho.target[2]-=offset;
            break;
        }
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

    camPerspective.aspect = SCREEN_WIDTH/ SCREEN_HEIGHT;
    camPerspective.updateProjectionMatrix();

    //    camOrtho.left   = - 0.5 * SCREEN_WIDTH / 2;
    //    camOrtho.right  =   0.5 * SCREEN_WIDTH / 2;
    //    camOrtho.top    =   SCREEN_HEIGHT / 2;
    //    camOrtho.bottom = - SCREEN_HEIGHT / 2;
    //    camOrtho.updateProjectionMatrix();

    //renderScence(gl, camPerspective, camPerspective.aspect,u_MvpMatrix, currentAngle);
}
