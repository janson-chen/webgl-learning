import { Component, OnDestroy, OnInit } from '@angular/core';
import { degree2Radian, initShaders } from 'src/app/core/gl-utils';
import { mat4, vec3 } from "gl-matrix";
import { matM_N } from "src/app/lib/math";

@Component({
    selector: 'app-mesh',
    templateUrl: './gallery.component.html',
    styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit, OnDestroy {
    #cubeRotation = 0;
    #gl: any;
    #u_mvpMatrix = null;
    #viewProjMatrix = mat4.create();
    #modelMatrix = mat4.create();
    #requestFrame: any;
    #sphereVertexCount = 0
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

            varying vec4 v_Color;
            varying vec2 v_TexCoord;


            void main() {

                gl_Position = u_mvpMatrix * a_Position;

                gl_PointSize = 2.0; // only effect in drawing points
                v_TexCoord = a_TexCoord;

                vec3 lightDirection = normalize(vec3(0.5, 0.9, 0.8));
                vec4 color = vec4(1.0, 0.9, 0.5, 1.0);
                vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);
                float nDotL = max(dot(normal, lightDirection), 0.1);
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
                // gl_FragColor = v_Color;
                gl_FragColor = texture2D(u_Sampler, v_TexCoord) * v_Color;
            }
        `;
    }

    ngOnInit(): void {
        const canvas = document.querySelector<HTMLCanvasElement>('#webgl');

        if (canvas) {
            this.#gl = canvas.getContext("webgl") as any;
            if (this.#gl) {
                initShaders(this.#gl, this.vShaderSource, this.fShaderSource)
                this.initSphereVertexBuffers(this.#gl);
                // this.initTextures(this.#gl);
                this.initTextures2(this.#gl);

                this.#gl.clearColor(0.0, 0.0, 0.0, 1.0);
                this.#gl.enable(this.#gl.DEPTH_TEST);
                this.#gl.depthFunc(this.#gl.LEQUAL);
                this.#u_mvpMatrix = this.#gl.getUniformLocation(this.#gl.program, 'u_mvpMatrix');

                const viewProjMatrix = mat4.create();

                mat4.ortho(viewProjMatrix, -1, 1, -1, 1, 1, 1000);
                mat4.lookAt(viewProjMatrix, vec3.fromValues(0, 0, 1.0), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
                mat4.fromRotation(viewProjMatrix, Math.PI / 2, vec3.fromValues(1, 0, 0));
                mat4.copy(this.#viewProjMatrix, viewProjMatrix);

                this.#requestFrame = requestAnimationFrame(this.render.bind(this));
            }
        }
    }

    ngOnDestroy(): void {
        cancelAnimationFrame(this.#requestFrame);
    }

    private initSphereVertexBuffers(gl: any): number {
        const sphereVertexs: number[] = [];
        const subdivisions = 64;
        const delta = Math.PI * 2 / subdivisions;
        const r = 0.5;
        const matMN = new matM_N(subdivisions + 1, subdivisions + 1);

        let lastInterval = 0;
        for (let i = 0; i < 1.0; i += 1.0 / subdivisions) {
            const cr = Math.sqrt(r * r - (r -  Math.abs(i)) * (r - Math.abs(i)));
            let lastAngle = 0;
            for (let t = 0; t <= Math.PI * 2; t += delta) {
                lastAngle = t;
                sphereVertexs.push(cr * Math.cos(t), cr * Math.sin(t), i, 1.0, t / (Math.PI * 2), i);
            }
            //closure each circle.
            if (Math.PI * 2 - lastAngle > 0.001) {
                sphereVertexs.push(cr * Math.cos(Math.PI * 2), cr * Math.sin(Math.PI * 2), i, 1.0, 1.0, i);
            }
            lastInterval = i;
        }

        // closure interval
        if (lastInterval < 1.0) {
            for (let t = 0; t <= Math.PI * 2 + delta; t += delta) {
                sphereVertexs.push(0, 0, 1.0, 1.0, t / (Math.PI * 2), 1.0);
            }
        }

        // console.log('sphereVertexs', sphereVertexs);
        const verticesColors = new Float32Array(sphereVertexs);
        const vertexColorbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
        const FSIZE = verticesColors.BYTES_PER_ELEMENT;
        const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, FSIZE * 6, 0);
        gl.enableVertexAttribArray(a_Position);


        // set vertex indices
        const indices = [];
        // console.log('matMN', matMN);
        for (let i = 0; i <= subdivisions; i++) {
            for (let j = 0; j <= subdivisions; j++) {
                if (matMN.value[i + 1] && matMN.value[j + 1]) {
                    const lt = matMN.value[i][j], rt = matMN.value[i][j + 1], lb = matMN.value[i + 1][j], rb = matMN.value[i + 1][j + 1];
                    //triangles with plane
                    indices.push(lt, rb, rt, lt, lb, rb);
                    // trianges with line
                    // indices.push(lt, rb, rb, rt, rt, lt, lt, lb, lb, rb, rb, lt);
                }
            }

        }
        // console.log('indices', indices);
        const indicesTypeArray = new Uint16Array(indices);
        // console.log('indicesTypeArray', indicesTypeArray);
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicesTypeArray, gl.STATIC_DRAW);
        this.#indicesCount = indices.length;
        // set texCoord


        // console.log('texCoord', textureVetexs);
        const textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereVertexs), gl.STATIC_DRAW);
        const a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 6, FSIZE * 4);
        gl.enableVertexAttribArray(a_TexCoord);

        this.#sphereVertexCount = sphereVertexs.length / 6;

        return sphereVertexs.length;
    }

    private render(): void {
        this.drawScene(this.#gl);
        this.#requestFrame = requestAnimationFrame(this.render.bind(this));
    }

    private initTextures(gl: any): void {
        const u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
        const textureVetexs = new Uint8ClampedArray([
            0xFF, 0X50, 0xFF, 0X50, 0xFF, 0X50, 0xFF, 0X50,
            0X50, 0xFF, 0X50, 0xFF, 0X50, 0xFF, 0X50, 0xFF,
            0xFF, 0X50, 0xFF, 0X50, 0xFF, 0X50, 0xFF, 0X50,
            0X50, 0xFF, 0X50, 0xFF, 0X50, 0xFF, 0X50, 0xFF,
            0xFF, 0X50, 0xFF, 0X50, 0xFF, 0X50, 0xFF, 0X50,
            0X50, 0xFF, 0X50, 0xFF, 0X50, 0xFF, 0X50, 0xFF,
            0xFF, 0X50, 0xFF, 0X50, 0xFF, 0X50, 0xFF, 0X50,
            0X50, 0xFF, 0X50, 0xFF, 0X50, 0xFF, 0X50, 0xFF,
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
        // image.src = 'assets/images/03.jpg';
        image.src = 'assets/images/earth.jpg';
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
        // texture: Uint8ClampedArray
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 8, 8, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, image);

        // texture: image
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
        mat4.fromRotation(this.#modelMatrix, degree2Radian(this.#cubeRotation), vec3.fromValues(0, 0, 1)); // rotate round with x,y,z
        mat4.scale(this.#modelMatrix, this.#modelMatrix,  vec3.fromValues(1.5, 1.5, 1.5));
        mat4.translate(this.#modelMatrix, this.#modelMatrix, vec3.fromValues(0, 0, -0.5));
        mat4.mul(mvpMatrix, this.#viewProjMatrix, this.#modelMatrix);

        mat4.invert(this.#g_normalMatrix, this.#g_modelMatrix);
        mat4.transpose(this.#g_normalMatrix, this.#g_normalMatrix);
        const u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
        gl.uniformMatrix4fv(u_NormalMatrix, false, this.#g_normalMatrix);

        gl.uniformMatrix4fv(this.#u_mvpMatrix, false, mvpMatrix);

        // debug with points
        // gl.drawArrays(gl.POINTS, 0, this.#sphereVertexCount);

        // debug with lines
        // gl.drawElements(gl.LINES, this.#indicesCount, gl.UNSIGNED_SHORT, 0);

        // debug with triangles
        gl.drawElements(gl.TRIANGLES, this.#indicesCount, gl.UNSIGNED_SHORT, 0);
    }
}




