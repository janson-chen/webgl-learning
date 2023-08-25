import { Component, OnDestroy, OnInit } from '@angular/core';
import { degree2Radian, initShaders } from 'src/app/core/gl-utils';
import { mat4, vec3 } from "gl-matrix";
import { matM_N } from "src/app/lib/math";

@Component({
    selector: 'app-mesh',
    templateUrl: './mesh.component.html',
    styleUrls: ['./mesh.component.scss']
})
export class MeshComponent implements OnInit, OnDestroy {
    #cubeRotation = 0;
    #gl: any;
    #u_mvpMatrix = null;
    #viewProjMatrix = mat4.create();
    #modelMatrix = mat4.create();
    #requestFrame: any;
    #planeVertexCount = 0
    #indicesCount = 0;
    #g_modelMatrix: mat4 = mat4.create();
    #g_normalMatrix: mat4 = mat4.create();

    get vShaderSource(): string {
        return `
            #ifdef GL_ES
            precision mediump float;
            #endif

            attribute vec4 a_Position;
            attribute vec2 a_TexCoord;
            attribute vec4 a_Normal;
            uniform sampler2D u_Sampler;
            uniform mat4 u_mvpMatrix;
            uniform mat4 u_NormalMatrix;

            varying vec2 v_TexCoord;


            void main() {
                vec4 pColor = texture2D(u_Sampler, a_TexCoord);
                float colorAsZ = (pColor.r + pColor.b + pColor.g) / 3.0;
                gl_Position = u_mvpMatrix * vec4(a_Position.x, a_Position.y, colorAsZ, a_Position.w);
                gl_PointSize = 2.0;
                v_TexCoord = a_TexCoord;
            }
        `;
    }

    get fShaderSource(): string {
        return `
            #ifdef GL_ES
            precision mediump float;
            #endif
            uniform sampler2D u_Sampler;
            varying vec2 v_TexCoord;

            void main() {
                gl_FragColor = texture2D(u_Sampler, v_TexCoord);
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
                this.initPlaneVertexBuffers(this.#gl);

                // textures
                // this.initTextures(this.#gl);

                this.initTextures2(this.#gl);
                // Set the clear color and enable the depth test
                this.#gl.clearColor(0.0, 0.0, 0.0, 1.0);
                this.#gl.enable(this.#gl.DEPTH_TEST);
                this.#gl.depthFunc(this.#gl.LEQUAL);
                // Get the storage locations of uniform variables
                this.#u_mvpMatrix = this.#gl.getUniformLocation(this.#gl.program, 'u_mvpMatrix');

                const viewProjMatrix = mat4.create();

                // Calculate the view projection matrix
                mat4.ortho(viewProjMatrix, -1, 1, -1, 1, 1000, 1);
                mat4.lookAt(viewProjMatrix, vec3.fromValues(0, 0, 0.1), vec3.fromValues(0, 0, 1), vec3.fromValues(0, 1, 0));

                mat4.copy(this.#viewProjMatrix, viewProjMatrix);

                this.#requestFrame = requestAnimationFrame(this.render.bind(this));
            }
        }
    }

    ngOnDestroy(): void {
        cancelAnimationFrame(this.#requestFrame);
    }

    private initPlaneVertexBuffers(gl: any): number {
        const planeVertexs = [];
        const textureVetexs = [];
        const subdivisionsX = 128; // row interval
        const subdivisionsY = 128; // column interval
        const interval = 1.0 / subdivisionsX; // n point has n - 1 interval
        const matMN = new matM_N(subdivisionsX + 1, subdivisionsY + 1);

        for (let i = -0.5; i <= 0.5; i += interval) {
            for (let t = -0.5; t <= 0.5; t += interval) {
                planeVertexs.push(i, t, 0, 1.0);
            }
        }

        const verticesColors = new Float32Array(planeVertexs);
        const vertexColorbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
        const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // set vertex indices
        const indices = [];
        for (let i = 0; i <= subdivisionsX; i++) {
            for (let j = 0; j <= subdivisionsY; j++) {
                if (matMN.value[i + 1] && matMN.value[j + 1]) {
                    const lt = matMN.value[i][j], rt = matMN.value[i][j + 1], lb = matMN.value[i + 1][j], rb = matMN.value[i + 1][j + 1];
                    indices.push(lt, rb, rt, lt, lb, rb);
                }
            }
        }

        const indicesTypeArray = new Uint16Array(indices);
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicesTypeArray, gl.STATIC_DRAW);
        this.#indicesCount = indices.length;
        // set texCoord
        for (let i = 0; i <= subdivisionsX; i++) {
            for (let j = 0; j <= subdivisionsY; j++) {
                textureVetexs.push(1.0 / subdivisionsX * i, 1.0 / subdivisionsY * j);
            }
        }

        // console.log('texCoord', textureVetexs);
        const textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        // console.log(textureVetexs);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureVetexs), gl.STATIC_DRAW);
        textureBuffer.BYTES_PER_ELEMENT;
        const a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_TexCoord);

        this.#planeVertexCount = planeVertexs.length;
        return planeVertexs.length;
    }

    private render(): void {
        this.drawScene(this.#gl);
        this.#requestFrame = requestAnimationFrame(this.render.bind(this));
    }

    private initTextures(gl: any): void {
        const u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
        const textureVetexs = new Uint8ClampedArray([
            0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00,
            0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF,
            0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00,
            0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF,
            0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00,
            0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF,
            0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00,
            0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF, 0x00, 0xFF,
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
        // image.src = 'assets/images/04.jpg';
        // image.src = 'assets/images/01.jpg';
        image.src = 'assets/images/03.jpg';
        // image.src = 'assets/images/clouds.jpeg';
    }

    private loadTexture(gl: any, texture: any, u_Sampler: any, image: any): void {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // NEAREST 不进行加权平均。 LINEAR 与邻近四个像素加权平均。
        // S,T   REPEAT, MIRRORED_REPEAT, CLAMP_TO_EDGE
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 8, 8, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, image);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // gl.generateMipmap(gl.TEXTURE_2D);
        gl.uniform1i(u_Sampler, 0);
        this.drawScene(gl);
    }

    private drawScene(gl: any): void {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.#modelMatrix = mat4.create();
        const mvpMatrix = mat4.create();
        this.#cubeRotation += 0.5;
        mat4.fromRotation(this.#modelMatrix, degree2Radian(this.#cubeRotation), vec3.fromValues(1, 1, 1));
        mat4.translate(this.#modelMatrix, this.#modelMatrix, vec3.fromValues(0, 0, 0));
        mat4.mul(mvpMatrix, this.#viewProjMatrix, this.#modelMatrix);

        mat4.invert(this.#g_normalMatrix, this.#g_modelMatrix);
        mat4.transpose(this.#g_normalMatrix, this.#g_normalMatrix);
        const u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
        gl.uniformMatrix4fv(u_NormalMatrix, false, this.#g_normalMatrix);

        gl.uniformMatrix4fv(this.#u_mvpMatrix, false, mvpMatrix);

        // gl.drawElements(gl.POINTS, this.#indicesCount, gl.UNSIGNED_SHORT , 0);
        // gl.drawElements(gl.LINES, this.#indicesCount, gl.UNSIGNED_SHORT, 0);
        gl.drawElements(gl.TRIANGLES, this.#indicesCount, gl.UNSIGNED_SHORT, 0);
    }
}




