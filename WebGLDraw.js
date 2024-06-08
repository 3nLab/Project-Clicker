var VSHADER_SOURCE = 
	'attribute vec3 a_Position; \n' +
	'uniform mat4 u_ViewMatrix;\n' +
	'uniform mat4 u_ModelMatrix;\n' +
	'uniform mat4 u_ProjMatrix;\n' +
	'attribute vec2 a_TexCoord;\n' +
	'varying vec2 v_TexCoord;\n' +
	'void main() { \n' +
	' gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * vec4(a_Position, 1.0); \n' +
	' gl_PointSize = 10.0; \n' +
	' v_TexCoord = a_TexCoord;\n' +
	'} \n';

	var FSHADER_SOURCE = 'precision mediump float;' +
	'uniform sampler2D u_Sampler0;\n' +
	'uniform sampler2D u_Sampler1;\n' +
	'varying vec2 v_TexCoord;\n' +
	'void main() { \n' +
	' gl_FragColor = texture2D(u_Sampler0, v_TexCoord) + texture2D(u_Sampler1, v_TexCoord);\n' +
	'} \n';

var canvas = document.getElementById('webgl');
var gl = canvas.getContext('webgl');

class vertex{
	constructor(){
		this.vertices = new Float32Array([
			1, 1, 0, 1, 0,
			-1, 1, 0, 0, 0,
			-1, -1, 0, 0, 1,
			1, -1, 0, 1, 1
		]);
		this.indices = new Uint8Array ([
			0, 1, 2, 0, 2, 3
		]);
		this.modelMatrix = new Matrix4();
		this.a_TexCoord = new Float32Array([
			0.0, 0.0,
			1.0, 0.0,
			1.0, 1.0,
			0.0, 1.0
		]);
	} 
}

class camera {
	constructor(){
		this.position = new Vector4();
		this.view = new Vector4();
		this.fov = 120;
		this.rot = 0;
		this.projMatrix = new Matrix4();
		this.viewMatrix = new Matrix4();
		const aspect = canvas.width / canvas.height;

		this.position.x = 0.0;
		this.position.y = 0.0;
		this.position.z = 10;
		const angleInRadians = this.rot * Math.PI / 180;		
		this.view.x = 0;
		this.view.y = 0;
		this.view.z = -1;
	
		//this.projMatrix.setPerspective(this.fov, (canvas.width)/(canvas.height), 0.1, 100);
		this.projMatrix.setOrtho(-aspect, aspect, -1, 1, 0.1, 1000.0);
		this.viewMatrix.setLookAt(this.position.x, this.position.y, this.position.z, this.position.x + this.view.x, this.position.y + this.view.y, this.position.z + this.view.z, 0, 1, 0);
		
		window.addEventListener("keydown", function(e){
			cam.checkKeyDown(e);
		}, false);
	}

	checkKeyDown(e) {
		if (e.keyCode === 65) {
			this.position.x += 0.1;
		}
		if (e.keyCode === 68) {
			this.position.x -= 0.1;
		}
		if (e.keyCode === 83) {
			this.position.z += 0.2;
		}
		if (e.keyCode === 87) {
			this.position.z -= 0.2;
		}
		this.update();
	}

	update() {
		const angleInRadians = this.rot * Math.PI / 180;
		this.viewMatrix.setLookAt(this.position.x, this.position.y, this.position.z, this.position.x + this.view.x, this.position.y + this.view.y, this.position.z + this.view.z, 0, 1, 0);
	}
}

class Ray{
	constructor(position, view){
		this.position = position;
		this.view = view;
	}
}

var a_Position;
var a_TexCoord;
var u_ViewMatrix;
var u_ModelMatrix;
var u_ProjMatrix;
var u_Sampler0;
var u_Sampler1;

var vbuf;
var ibuf;

var cam = new camera();
var vc = new vertex();	

function screenToWorld(cam,x,y){
	var WX = x * 2 - 1;
	var WY = 1 - 2 * y;

	var viewPos = new Vector4([WX,WY,-1,1]);
	var invProjMat = cam.projMatrix.clone().invert();
	viewPos.multiply(invProjMat);

	var worldPos = viewPos.clone();
	var invViewMat = cam.viewMatrix.clone().invert();
	worldPos.multiply(invViewMat);

	return worldPos;
}

function raycast(position, view) {
	var ray = new Ray(position, view);
}

function Update_frame(){
	gl.uniformMatrix4fv(u_ViewMatrix, false, cam.viewMatrix.elements);
	gl.uniformMatrix4fv(u_ProjMatrix, false, cam.projMatrix.elements);
	drawObject(vc);
	window.requestAnimationFrame(Update_frame);
}

function loadTexture(gl, n, texture, u_Sampler, cubeImage){
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0); 

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	
	gl.texImage2D(gl.TEXTURE_2D, n, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubeImage);
 
	gl.uniform1i(u_Sampler, n);
}

function initiate(){
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	
	a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
	u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
	u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
	u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
	u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');

	vc.modelMatrix.setTranslate(0, 0, 0);

	vbuf = gl.createBuffer();
	ibuf = gl.createBuffer();

	gl.clearColor(0.9, 0.9, 0.9, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function drawObject(obj){
	gl.uniformMatrix4fv(u_ModelMatrix, false, obj.modelMatrix.elements);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture1);
    gl.uniform1i(u_Sampler1, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbuf); // 버텍스 데이터를 수정된 버퍼에 바인딩
    gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW); // 버텍스 데이터 설정

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf); // 인덱스 데이터를 수정된 버퍼에 바인딩
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.indices, gl.STATIC_DRAW); // 인덱스 데이터 설정

	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, gl.false, 20, 0);
	gl.enableVertexAttribArray(a_Position);
	
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, gl.false, 20, 12); // 수정된 부분
	gl.enableVertexAttribArray(a_TexCoord);

	gl.drawElements(gl.TRIANGLES, obj.indices.length, gl.UNSIGNED_BYTE, 0);
}

function main() {
	if(!gl) { return; }
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) { return; }
	initiate();

	cubeTexture0 = gl.createTexture();
	cubeTexture1 = gl.createTexture();
	cubeImage0 = new Image();
	cubeImage1 = new Image();
	cubeImage0.onload = function() {
		loadTexture(gl, 0, cubeTexture0, u_Sampler0, cubeImage0);
	}
	cubeImage1.onload = function() {
		loadTexture(gl, 1, cubeTexture1, u_Sampler1, cubeImage1);
	}
	cubeImage0.crossOrigin = "anonymous";
	cubeImage0.src = "https://3nlab.github.io/Project-Clicker/Image.jpg";
	cubeImage1.crossOrigin = "anonymous";
	cubeImage1.src = "https://3nlab.github.io/Project-Clicker/Image.png";
	drawObject(vc);

	window.requestAnimationFrame(Update_frame);
}
