import { Component, OnDestroy, OnInit } from '@angular/core';
import { degree2Radian, initShaders } from 'src/app/core/gl-utils';
import { mat4, vec3 } from "gl-matrix";

@Component({
    selector: 'app-mesh',
    templateUrl: './mesh.component.html',
    styleUrls: ['./mesh.component.scss']
})
export class MeshComponent implements OnInit, OnDestroy {
    #cubeRotation = 0;
    #then = 0;
    #gl: any;
    #u_mvpMatrix = null;
    #viewProjMatrix = mat4.create();
    #modelMatrix = mat4.create();
    #requestFrame: any;
    #vertexCount = 0;
    #planeVertexCount = 0
    #g_modelMatrix: mat4 = mat4.create();
    #g_normalMatrix: mat4 = mat4.create();

    get vShaderSource(): string {
        return `
            attribute vec4 a_Position;
            attribute vec2 a_TexCoord;
            attribute vec4 a_Normal;
            
            uniform mat4 u_mvpMatrix;
            uniform mat4 u_NormalMatrix;

            varying vec4 v_Color;
            varying vec2 v_TexCoord;
            
            
            void main() {
                gl_Position = u_mvpMatrix * a_Position;
                gl_PointSize = 5.0;
                v_TexCoord = a_TexCoord;

                vec3 lightDirection = normalize(vec3(0.2, 0.9, 0.8));
                vec4 color = vec4(0.5, 0.9, 0.5, 1.0);
                vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);
                float nDotL = max(dot(normal, lightDirection), 0.0);
                v_Color = vec4(color.rgb * nDotL + vec3(0.7), color.a);
            }
        `;
    }

    get fShaderSource(): string {
        return `
            #ifdef GL_ES
            precision mediump float;
            #endif
            varying vec4 v_Color;
            uniform sampler2D u_Sampler;
            varying vec2 v_TexCoord;

            void main() {
                gl_FragColor = texture2D(u_Sampler, v_TexCoord) * v_Color;
            }
        `;
    }

    ngOnInit(): void {
        const canvas = document.querySelector<HTMLCanvasElement>('#webgl');

        // Get the rendering context for WebGL
        if (canvas) {
            this.#gl = canvas.getContext("webgl") as any;
            if (this.#gl) {
                // Initialize shaders
                initShaders(this.#gl, this.vShaderSource, this.fShaderSource)
                this.initSphereVertexBuffers(this.#gl);
                // this.initTextures(this.#gl);
                this.initPlaneVertexBuffers(this.#gl);

                // textures
                this.initTextures2(this.#gl);
                // Set the clear color and enable the depth test
                this.#gl.clearColor(0, 0, 0, 1);
                this.#gl.enable(this.#gl.DEPTH_TEST);
                this.#gl.depthFunc(this.#gl.LEQUAL);
                // Get the storage locations of uniform variables
                this.#u_mvpMatrix = this.#gl.getUniformLocation(this.#gl.program, 'u_mvpMatrix');

                const viewProjMatrix = mat4.create();

                // Calculate the view projection matrix
                mat4.ortho(viewProjMatrix, -1, 1, -1, 1, 1, 1000);
                mat4.lookAt(viewProjMatrix, vec3.fromValues(0, 0, 0.1), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));

                mat4.copy(this.#viewProjMatrix, viewProjMatrix);
        
                this.#requestFrame = requestAnimationFrame(this.render.bind(this));
            }
        }
    }

    ngOnDestroy(): void {
        cancelAnimationFrame(this.#requestFrame);
    }

    private initSphereVertexBuffers(gl: any): number {
        const sphereVertexs = [];
        const delta = Math.PI / 32;
        const r = 0.5;
        
        for (let i = -0.5; i < 0.5; i += 0.05) {
            const cr = Math.sqrt(r * r - (r - Math.abs(i)) * (r - Math.abs(i)));

            for (let t = 0.0; t < Math.PI * 2; t += delta) {
                sphereVertexs.push(cr * Math.sin(t), cr * Math.cos(t), i < 0 ? i + r : i - r, 1.0);
            }

        }

        sphereVertexs.push(0.0, 0.0, -0.5, 1);

        const verticesColors = new Float32Array(sphereVertexs);
        const vertexColorbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
        const FSIZE = verticesColors.BYTES_PER_ELEMENT;
        const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
    

        this.#vertexCount = sphereVertexs.length;
        return  sphereVertexs.length;
    }

    private initPlaneVertexBuffers(gl: any): number {
        const planeVertexs = [];
        const ndarr = [];
        const textureVetexs = [];
        // 10 x 10 points plane
        const subdivisionsX = 2;
        const subdivisionsY = 2;
        const interval = 1.0 / subdivisionsX;        
        
        for (let i = -0.5; i <= 0.5; i += interval) {
            const arr = [];
            for (let t = -0.5; t <= 0.5; t += interval) {
                arr.push(i, t, Math.random() / 2, 1.0);
            }

            ndarr.push(arr);
        }


        for (let i = 0; i < ndarr.length; i++) {
            if (ndarr[i + 1]) {
                for (let k = 0; k <= subdivisionsX * 4; k += 4) {
                    if (ndarr[i][k + 7]) {
                        planeVertexs.push(ndarr[i][k], ndarr[i][k + 1], ndarr[i][k + 2], ndarr[i][k + 3],
                             ndarr[i][k + 4], ndarr[i][k + 5], ndarr[i][k + 6], ndarr[i][k + 7],
                              ndarr[i + 1][k], ndarr[i + 1][k + 1], ndarr[i + 1][k + 2], ndarr[i + 1][k + 3],
                              ndarr[i + 1][k + 4], ndarr[i + 1][k + 5], ndarr[i + 1][k + 6], ndarr[i + 1][k + 7]);
                    }
                }
            }
        }

        const verticesColors = new Float32Array(planeVertexs);
        const vertexColorbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
        const FSIZE = verticesColors.BYTES_PER_ELEMENT;
        const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // set texCoord
        for (let i = 0; i < verticesColors.length / 4; i++) {
            textureVetexs.push(1.0 / verticesColors.length * i);
        }
        const textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        console.log(textureVetexs);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesColors), gl.STATIC_DRAW);
        const a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord'); 
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_TexCoord);

        this.#planeVertexCount = planeVertexs.length;
        return  planeVertexs.length;
    }

    private drawScene(gl: any, deltaTime: number): void {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.#modelMatrix = mat4.create();
        const mvpMatrix = mat4.create();
        this.#cubeRotation += deltaTime;
        this.#cubeRotation += 1;
        mat4.fromRotation(this.#modelMatrix, degree2Radian(this.#cubeRotation), vec3.fromValues(0, 1, 0));
        mat4.translate(this.#modelMatrix, this.#modelMatrix, vec3.fromValues(0, 0, 0));
        mat4.mul(mvpMatrix, this.#viewProjMatrix, this.#modelMatrix);

        mat4.invert(this.#g_normalMatrix, this.#g_modelMatrix);
        mat4.transpose(this.#g_normalMatrix, this.#g_normalMatrix);
        const u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
        gl.uniformMatrix4fv(u_NormalMatrix, false, this.#g_normalMatrix);

        gl.uniformMatrix4fv(this.#u_mvpMatrix, false, mvpMatrix);
        // draw objects
        gl.drawArrays(gl.POINTS, 0, this.#vertexCount / 4);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.#vertexCount / 4);
    }

    private render(now: number): void {
        now *= 0.005;
        const deltaTime = now - this.#then;
        this.#then = now;
        this.drawScene(this.#gl, deltaTime)
        this.#requestFrame = requestAnimationFrame(this.render.bind(this));
    }

    private initTextures(gl: any): void {
        const u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
        const textureVetexs = new Uint8ClampedArray([
            0xFF, 0xCC, 0xFF, 0xCC,
            0xCC, 0xFF, 0xCC, 0xFF,
            0xFF, 0xCC, 0xFF, 0xCC,
            0xCC, 0xFF, 0xCC, 0xFF,
      
        ]);
       

        const texture = gl.createTexture();
        this.loadTexture(gl, texture, u_Sampler, textureVetexs);
    }

    private initTextures2(gl: any): void {
        const u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');

        const image = new Image();
        const texture = gl.createTexture();
        image.addEventListener('load', () => {
            this.loadTexture(gl, texture, u_Sampler, image);
        });
        image.src = 'assets/images/01.jpg';
    }

    private loadTexture(gl: any, texture: any, u_Sampler: any, image: any): void {
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 4, 4, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, image);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // gl.generateMipmap(gl.TEXTURE_2D);
        gl.uniform1i(u_Sampler, 0);
        this.drawScene(gl, 0);
    }
}




