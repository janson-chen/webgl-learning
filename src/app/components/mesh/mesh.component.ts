import { Component, OnDestroy, OnInit } from '@angular/core';
import { degree2Radian, initShaders } from 'src/app/core/gl-utils';
import { mat4, vec3 } from "gl-matrix";

@Component({
    selector: 'app-mesh',
    templateUrl: './mesh.component.html',
    styleUrls: ['./mesh.component.scss']
})
export class MeshComponent implements OnInit, OnDestroy {
    readonly #nXm = 2;
    #cubeRotation = 0;
    #then = 0;
    #gl: any;
    #u_mvpMatrix = mat4.create();
    #viewProjMatrix = mat4.create();
    #angle = 0;
    #modelMatrix = mat4.create();
    #requestFrame: any;
    #u_time = 0;

    get vShaderSource(): string {
        return `
            attribute vec4 a_Position;
            attribute vec4 a_Color;
            uniform mat4 u_mvpMatrix;
            varying vec4 v_Color;
            void main() {
              gl_Position = u_mvpMatrix * a_Position;
              gl_PointSize = 10.0;
              v_Color = a_Color;
            }
        `;
    }

    get fShaderSource(): string {
        return `
            #ifdef GL_ES
            precision mediump float;
            #endif
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform float u_time;

            float random (in vec2 _st) {
                return fract(sin(dot(_st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }

            float noise (in vec2 _st) {
                vec2 i = floor(_st);
                vec2 f = fract(_st);

                // Four corners in 2D of a tile
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));

                vec2 u = f * f * f * (3.0 - 2.0 * f);

                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }

            #define NUM_OCTAVES 5
            // 翘曲域噪声用来模拟卷曲、螺旋状的纹理，比如烟雾、大理石等
            float fbm (in vec2 _st) {
                float v = 0.0;
                float a = 0.5;
                vec2 shift = vec2(100.0);
                // Rotate to reduce axial bias
                mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
                for (int i = 0; i < NUM_OCTAVES; ++i) {
                    v += a * noise(_st);
                    _st = rot * _st * 2.0 + shift;
                    a *= 0.5;
                }
                return v;
            }

            void main() {
                vec2 st = gl_FragCoord.xy / vec2(200).xy;
                // st += st * abs(sin(u_time * 0.1) * 3.0);
                vec3 color = vec3(1.0);

                vec2 q = vec2(0.0);
                q.x = fbm( st + 0.10 * u_time);
                q.y = fbm( st + vec2(1.0));

                vec2 r = vec2(0.0);
                r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2)+ 0.15 * u_time);
                r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8)+ 0.126 * u_time);

                float f = fbm(st + r);

                color = mix(vec3(0.01961, 0.619608, 0.666667), vec3(0.666667, 0.666667, 0.498039), clamp((f * f) * 4.0, 0.0, 1.0));
                color = mix(color, vec3(0.0, 0.0, 0.164706), clamp(length(q), 0.0, 1.0));
                color = mix(color, vec3(1, 1, 1), clamp(length(r.x), 0.0, 1.0));
                gl_FragColor = vec4((f * f * f + 0.6 * f * f + 0.5 * f) * color, 1.0);
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

                // Set the clear color and enable the depth test
                this.#gl.clearColor(0, 0, 0, 1);
                this.#gl.enable(this.#gl.DEPTH_TEST);
                this.#gl.depthFunc(this.#gl.LEQUAL);
                // Get the storage locations of uniform variables
                this.#u_mvpMatrix = this.#gl.getUniformLocation(this.#gl.program, 'u_mvpMatrix');
                this.#u_time = this.#gl.getUniformLocation(this.#gl.program, 'u_time');
                if (!this.#u_mvpMatrix) {
                    console.log('Failed to get the storage location of uniform variable');
                    return;
                }

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
        const vertexs = [];
        for (let i = 0; i < this.#nXm; i++) {
            for (let j = 0; j < this.#nXm; j++) {
                // vertic 1
                vertexs.push(i / this.#nXm, j / this.#nXm, 0, Math.random(), Math.random(), Math.random());
                // vertic 2
                // vertexs.push(i / this.#nXm, j / this.#nXm, Math.abs(Math.sin(i / 256)), Math.random(), Math.random(), Math.random());
            }
        }

        const verticesColors = new Float32Array(vertexs);

        // Create a buffer object
        const vertexColorbuffer = gl.createBuffer();
        if (!vertexColorbuffer) {
            console.log('Failed to create the buffer object');
            return -1;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

        const FSIZE = verticesColors.BYTES_PER_ELEMENT;

        const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        if (a_Position < 0) {
            console.log('Failed to get the storage location of a_Position');
            return -1;
        }
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
        gl.enableVertexAttribArray(a_Position);

        const a_Color = gl.getAttribLocation(gl.program, 'a_Color');
        if (a_Color < 0) {
            console.log('Failed to get the storage location of a_Color');
            return -1;
        }
        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
        gl.enableVertexAttribArray(a_Color);

        return verticesColors.length;
    }

    private drawScene(gl: any, viewProjMatrix: any, u_mvpMatrix: any, deltaTime: number, vertexCount: number): void {
        this.#angle += 0.1;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.#modelMatrix = mat4.create();
        const mvpMatrix = mat4.create();
        mat4.copy(this.#modelMatrix, viewProjMatrix);
        mat4.fromScaling(viewProjMatrix, vec3.fromValues(4, 4, 1));
        mat4.fromRotation(this.#modelMatrix, degree2Radian(this.#cubeRotation), vec3.fromValues(0, 0, 0));
        // mat4.rotate(viewProjMatrix, viewProjMatrix, degree2Radian(this.#cubeRotation), vec3.fromValues(0, 1, 0));
        mat4.translate(this.#modelMatrix, this.#modelMatrix, vec3.fromValues(-0.25, -0.25, 0));
        // mat4.translate(viewProjMatrix, viewProjMatrix, vec3.fromValues(-0.5, 0, 0));
        mat4.mul(mvpMatrix, viewProjMatrix, this.#modelMatrix);
        gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix);
        gl.uniform1f(this.#u_time, this.#angle);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
        this.#cubeRotation += deltaTime;
    }

    private render(now: number): void {
        now *= 0.005;
        const deltaTime = now - this.#then;
        this.#then = now;
        this.drawScene(this.#gl, this.#viewProjMatrix, this.#u_mvpMatrix, deltaTime, 4)
        this.#requestFrame = requestAnimationFrame(this.render.bind(this));
    }
}




