	var VSHADER_SOURCE = 
		'attribute vec3 a_Position; \n' +
		'uniform mat4 u_ViewMatrix;\n' +
		'uniform mat4 u_ModelMatrix;\n' +
		'uniform mat4 u_ProjMatrix;\n' +
		'attribute vec2 a_TexCoord;\n' +
		'varying vec2 v_TexCoord;\n' +
		'void main() { \n' +
		' gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * vec4(a_Position, 1.0); \n' +
		' v_TexCoord = a_TexCoord;\n' +
		'} \n';

		var FSHADER_SOURCE = 'precision mediump float;' +
		'uniform sampler2D u_Sampler0;\n' +
		'varying vec2 v_TexCoord;\n' +
		'void main() { \n' +
		' gl_FragColor = texture2D(u_Sampler0, v_TexCoord);\n' +
		'} \n';

	var canvas = document.getElementById('webgl');
	var gl = canvas.getContext('webgl');
	gl.canvas.height *= 1.3;

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
			this.texture = null;
		} 

		setTexture(imageUrl){
			this.texture = gl.createTexture();
			var image = new Image();
			image.onload = () => {
				loadTexture(gl, this.texture, u_Sampler0, image);
			}
			image.crossOrigin = "anonymous";
			image.src = imageUrl;
		}
	}

	class object{
		constructor(){
			this.opening = [];
			this.option = [];
			this.ingame = [];
		}

		opening_init(){
			var vc = new vertex();
			vc.setTexture("https://3nlab.github.io/Project-Clicker/Image.jpg");
			vc.modelMatrix.translate(0.0,0.0,0.0);
			this.opening.push(vc);
		}
		option_init(){
			var vc = new vertex();
			vc.setTexture("https://3nlab.github.io/Project-Clicker/Image.png");
			vc.modelMatrix.translate(0.5,0.5,1.0).scale(0.5,0.5,1);
			this.option.push(vc);
		}
	}

	var obj = new object();

	class camera {
		constructor(){
			this.position = new Vector4();
			this.view = new Vector4();
			this.fov = 120;
			this.rot = 0;
			this.projMatrix = new Matrix4();
			this.viewMatrix = new Matrix4();
			const aspect = gl.canvas.height/gl.canvas.width;

			this.position.x = 0.0;
			this.position.y = 0.0;
			this.position.z = 10;
			const angleInRadians = this.rot * Math.PI / 180;		
			this.view.x = 0;
			this.view.y = 0;
			this.view.z = -1;
		
			//this.projMatrix.setPerspective(this.fov, (canvas.width)/(canvas.height), 0.1, 100);
			this.projMatrix.setOrtho(-1, 1, -aspect, aspect, 0.1, 1000.0);
			this.viewMatrix.setLookAt(this.position.x, this.position.y, this.position.z, this.position.x + this.view.x, this.position.y + this.view.y, this.position.z + this.view.z, 0, 1, 0);
			
			window.addEventListener("keydown", function(e){
				cam.checkKeyDown(e);
			}, false);
		}

		checkKeyDown(e) {
			if (e.keyCode === 65) {
				obj.opening.forEach((vc) => {
					draw_List.push(vc);
					console.log('input open');
				})
			}
			if (e.keyCode === 68) {
				obj.option.forEach((vc) => {
					console.log('input opt');
					draw_List.push(vc);
				})
			}
			if (e.keyCode === 83) {
				obj.option.forEach((vc) => {
					console.log('input opt');
					draw_List.push(vc);
				})}
			if (e.keyCode === 87) {
				this.position.z -= 0.2;
			}
			this.update();
		}

		update() {
			this.viewMatrix.setLookAt(this.position.x, this.position.y, this.position.z, this.position.x + this.view.x, this.position.y + this.view.y, this.position.z + this.view.z, 0, 1, 0);
			gl.uniformMatrix4fv(u_ViewMatrix, false, cam.viewMatrix.elements);
			//const angleInRadians = this.rot * Math.PI / 180;
		}
	}

	var cam = new camera();

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
	var draw_List = [];

	var vbuf;
	var ibuf;


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
		draw_List.forEach((vc0) => drawObject(vc0));
		window.requestAnimationFrame(Update_frame);
	}

	function loadTexture(gl, texture, u_Sampler, cubeImage){
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0); 

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubeImage);
	
		gl.uniform1i(u_Sampler, 0);
	}

	function initiate(){
		gl.enable(gl.DEPTH_TEST);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		
		a_Position = gl.getAttribLocation(gl.program, 'a_Position');
		a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
		u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
		u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
		u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
		u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');

		gl.uniformMatrix4fv(u_ProjMatrix, false, cam.projMatrix.elements);
	
		vbuf = gl.createBuffer();
		ibuf = gl.createBuffer();

		obj.opening_init();
		obj.option_init();

		gl.clearColor(0.9, 0.9, 0.9, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}

	function drawObject(obj){
		gl.uniformMatrix4fv(u_ModelMatrix, false, obj.modelMatrix.elements);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, obj.texture);
		gl.uniform1i(u_Sampler0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
		gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.indices, gl.STATIC_DRAW);

		gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, gl.false, 20, 0);
		gl.enableVertexAttribArray(a_Position);
		
		gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, gl.false, 20, 12);
		gl.enableVertexAttribArray(a_TexCoord);

		gl.drawElements(gl.TRIANGLES, obj.indices.length, gl.UNSIGNED_BYTE, 0);
	}

	function main() {
		if(!gl) { return; }
		if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) { return; }
		initiate();

		window.requestAnimationFrame(Update_frame);
	}
