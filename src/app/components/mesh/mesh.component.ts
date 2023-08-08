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

    get vShaderSource(): string {
        return `
            attribute vec4 a_Position;
            attribute vec2 a_TexCoord;
            varying vec2 v_TexCoord;
            uniform mat4 u_mvpMatrix;

            void main() {
              gl_Position = u_mvpMatrix * a_Position;
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
                this.initVertexBuffers(this.#gl);
                this.initTextures(this.#gl);

                // Set the clear color and enable the depth test
                this.#gl.clearColor(0, 0, 0, 1);
                this.#gl.enable(this.#gl.DEPTH_TEST);
                this.#gl.depthFunc(this.#gl.LEQUAL);
                // Get the storage locations of uniform variables
                this.#u_mvpMatrix = this.#gl.getUniformLocation(this.#gl.program, 'u_mvpMatrix');

                const viewProjMatrix = mat4.create();

                // Calculate the view projection matrix
                mat4.ortho(viewProjMatrix, -1, 1, -1, 1, 1, 1000);
                mat4.lookAt(viewProjMatrix, vec3.fromValues(0, 0, 10), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));

                this.#requestFrame = requestAnimationFrame(this.render.bind(this));
            }
        }
    }

    ngOnDestroy(): void {
        cancelAnimationFrame(this.#requestFrame);
    }

    private initVertexBuffers(gl: any): number {
        const vertexs = [
            -1.0, 1.0, 0.0, 0.0, 1.0,
            -1.0, -1.0, 0.0, 0.0, 0.0,
            1.0, 1.0, 0.0, 1.0, 1.0,
            1.0, -1.0, 0.0, 1.0, 0.0,
        ];
        const verticesColors = new Float32Array(vertexs);
        const vertexColorbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
        const FSIZE = verticesColors.BYTES_PER_ELEMENT;
        const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
        gl.enableVertexAttribArray(a_Position);
        const a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
        gl.enableVertexAttribArray(a_TexCoord);

        return  4;
    }

    private drawScene(gl: any, deltaTime: number): void {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.#modelMatrix = mat4.create();
        const mvpMatrix = mat4.create();
        mat4.copy(this.#modelMatrix, this.#viewProjMatrix);
        mat4.fromScaling(this.#viewProjMatrix, vec3.fromValues(1, 1, 1));
        this.#cubeRotation += deltaTime;
        this.#cubeRotation += 1;
        mat4.fromRotation(this.#modelMatrix, degree2Radian(this.#cubeRotation), vec3.fromValues(1, 1, 1));
        mat4.translate(this.#modelMatrix, this.#modelMatrix, vec3.fromValues(0, 0, 0));
        mat4.mul(mvpMatrix, this.#viewProjMatrix, this.#modelMatrix);
        gl.uniformMatrix4fv(this.#u_mvpMatrix, false, mvpMatrix);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        console.log(deltaTime);
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

        const image = new Image();
        const texture = gl.createTexture();
        image.addEventListener('load', () => {
            this.loadTexture(gl, texture, u_Sampler, image);
        });
        image.src = 'assets/images/01.jpg';
    }

    private loadTexture(gl: any, texture: any, u_Sampler: any, image: any): void {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        // gl.uniform1i(u_Sampler, 0);
        this.drawScene(gl, 0);
    }
}




