import { Component, OnDestroy, OnInit } from '@angular/core';
import { degree2Radian, initShaders, resizeCanvasToDisplaySize } from "../../core/gl-utils";
import { mat4, vec3 } from "gl-matrix";

@Component({
    selector: 'app-sky-box',
    templateUrl: './sky-box.component.html',
    styleUrls: ['./sky-box.component.scss']
})
export class SkyBoxComponent implements OnInit, OnDestroy {
    #gl: any;
    #viewProjMatrix = mat4.create();
    #cameraMatrix = mat4.create();
    #skyboxLocation = null;
    #positionLocation = null;
    #viewDirectionProjectionInverseLocation = null;
    #requestFrame: any;

    get vShaderSource(): string {
        return `
            attribute vec4 a_position;
            varying vec4 v_position;
            void main() {
                v_position = a_position;
                gl_Position = a_position;
                gl_Position.z = 1.0;
            }
        `;
    }

    get fShaderSource(): string {
        return `
            #ifdef GL_ES\n
            precision mediump float;\n
            #endif\n

            uniform samplerCube u_skybox;
            uniform mat4 u_viewDirectionProjectionInverse;
            varying vec4 v_position;
            void main() {
                vec4 t = u_viewDirectionProjectionInverse * v_position;
                gl_FragColor = textureCube(u_skybox, normalize(t.xyz / t.w));
            }
        `;
    }

    ngOnInit(): void {
        this.main();
    }

    ngOnDestroy(): void {
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
        cancelAnimationFrame(this.#requestFrame);
    }

    private main(): void {
        const canvas = document.querySelector('#webgl') as HTMLCanvasElement;
        if (canvas) {
            // 获取gl上下文
            this.#gl = canvas.getContext('webgl') as any;
            // 初始化着色器, 封装着色器对象
            initShaders(this.#gl, this.vShaderSource, this.fShaderSource);
            // 初始化缓冲区
            const n =this.initVertexBuffers(this.#gl);
            // 获取uniform变量地址
            this.#positionLocation = this.#gl.getAttribLocation(this.#gl.program, 'a_position');
            this.#skyboxLocation = this.#gl.getUniformLocation(this.#gl.program, 'u_skybox');
            this.#viewDirectionProjectionInverseLocation =
                this.#gl.getUniformLocation(this.#gl.program, 'u_viewDirectionProjectionInverse');

            // 初始化纹理
            this.initTextures(this.#gl);
            // 绘制场景
            this.#requestFrame = requestAnimationFrame(this.drawScene.bind(this));
        }
    }
    // 初始化缓冲区但并且分配着色器地址
    private initVertexBuffers(gl: any): number {
        const positions = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1
        ]);
        this.initArrayBuffer(gl, 'a_position', positions, 2, gl.FLOAT);
        return positions.length / 2;
    }

    private initArrayBuffer(gl: any, attribute: any, data: Float32Array, num: number, type: any): boolean {
        const buffer = gl.createBuffer();   // Create a buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        const a_attribute = gl.getAttribLocation(gl.program, attribute);
        gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
        gl.enableVertexAttribArray(a_attribute);
        return true;
    }

    private initTextures(gl: WebGLRenderingContext): void {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        const faceInfos = [
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                url: 'assets/images/computer-history-museum/pos-x.jpg',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                url: 'assets/images/computer-history-museum/neg-x.jpg',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                url: 'assets/images/computer-history-museum/pos-y.jpg',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                url: 'assets/images/computer-history-museum/neg-y.jpg',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                url: 'assets/images/computer-history-museum/pos-z.jpg',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
                url: 'assets/images/computer-history-museum/neg-z.jpg',
            },
        ];
        faceInfos.forEach(faceInfo => {
            const { target, url } = faceInfo;
            const level = 0;
            const internalFormat = gl.RGBA;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;
            //setup each face so it's immediately renderable;
            gl.texImage2D(target, level, internalFormat, 512, 512, 0, format, type, null);
            const image = new Image();
            image.src = url;
            image.addEventListener('load', () => {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                // texImage2D 重载方法
                gl.texImage2D(target, level, internalFormat, format, type, image);
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            });
        });
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }

    private drawScene(time = 0): void {
        time *= 0.002;
        resizeCanvasToDisplaySize(this.#gl.canvas);
        this.#gl.viewport(0, 0, this.#gl.canvas.width, this.#gl.canvas.height);
        this.#gl.enable(this.#gl.CULL_FACE); // 多边形剔除 front back front_and_back
        this.#gl.enable(this.#gl.DEPTH_TEST);
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
        // 设置相机姿态
        mat4.perspective(this.#cameraMatrix, degree2Radian(60.0), this.#gl.canvas.width / this.#gl.canvas.height, 1, 2000);
        const cameraPosition = vec3.fromValues(Math.cos(time * 0.1), 0, Math.sin(time * 0.1));
        mat4.lookAt(this.#cameraMatrix, cameraPosition, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
        mat4.invert(this.#viewProjMatrix, this.#cameraMatrix);
        // Set the uniforms
        this.#gl.uniformMatrix4fv(
            this.#viewDirectionProjectionInverseLocation, false,
            this.#viewProjMatrix);

        this.#gl.uniform1i(this.#skyboxLocation, 0);
        /*
        *   gl.NEVER (never pass)
            gl.LESS (pass if the incoming value is less than the depth buffer value)
            gl.EQUAL (pass if the incoming value equals the depth buffer value)
            gl.LEQUAL (pass if the incoming value is less than or equal to the depth buffer value)
            gl.GREATER (pass if the incoming value is greater than the depth buffer value)
            gl.NOTEQUAL (pass if the incoming value is not equal to the depth buffer value)
            gl.GEQUAL (pass if the incoming value is greater than or equal to the depth buffer value)
            gl.ALWAYS (always pass)
        * */
        // let our quad pass the depth test at 1.0
        this.#gl.depthFunc(this.#gl.LEQUAL);

        // Draw the geometry.
        this.#gl.drawArrays(this.#gl.TRIANGLES, 0, 6);
        this.#requestFrame = requestAnimationFrame(this.drawScene.bind(this));
    }
}
