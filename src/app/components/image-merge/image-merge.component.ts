import { Component, OnInit } from '@angular/core';
import { initShaders } from 'src/app/core/gl-utils';

@Component({
    selector: 'app-mix',
    templateUrl: './image-merge.component.html',
    styleUrls: ['./image-merge.component.scss']
})
export class ImageMergeComponent implements OnInit {
    weightFactor = 1.0;
    #gl: any;
    #player: any;
    #glCanvas: any;

    get vShaderSource(): string {
        return `
            attribute vec4 a_Position;
            attribute vec2 a_TexCoord;
            varying vec2 v_TexCoord;

            void main() {
              gl_Position = a_Position;
              v_TexCoord = a_TexCoord;
            }
        `;
    }

    get fShaderSource(): string {
        return `
            #ifdef GL_ES
            precision mediump float;
            #endif

            uniform sampler2D u_Sampler[2];
            uniform float u_WeightFactor;
            varying vec2 v_TexCoord;
            vec4 fragColor0;
            vec4 fragColor1;

            void main() {
                fragColor0 = texture2D(u_Sampler[0], v_TexCoord);
                fragColor1 = texture2D(u_Sampler[1], v_TexCoord);
                gl_FragColor = mix(fragColor0.rgba, fragColor1.rgba, u_WeightFactor);
            }
        `;
    }

    ngOnInit(): void {
        this.#player = document.querySelector<HTMLCanvasElement>('#webgl') as HTMLCanvasElement;

        if (this.#player) {
            this.#gl = this.#player.getContext("webgl") as any;
            if (this.#gl) {
                initShaders(this.#gl, this.vShaderSource, this.fShaderSource);
                const vCount = this.initVertexBuffers(this.#gl);
                this.initTextures(this.#gl, vCount);
            }
        }
    }

    reDrawImage(): void {
        this.drawScene(this.#gl, 4, this.weightFactor);
    }

    private initVertexBuffers(gl: any): number {
        const vertexs = [
            -1.0, 1.0, 0.0, 1.0,
            -1.0, -1.0, 0.0, 0.0,
            1.0, 1.0, 1.0, 1.0,
            1.0, -1.0, 1.0, 0.0,
        ];
        const verticesColors = new Float32Array(vertexs);
        const vertexColorbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
        const FSIZE = verticesColors.BYTES_PER_ELEMENT;
        const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
        gl.enableVertexAttribArray(a_Position);
        const a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
        gl.enableVertexAttribArray(a_TexCoord);

        return  4;
    }

    private initTextures(gl: any, n: number): void {
        const u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
        ['assets/images/01.jpg', 'assets/images/02.jpg'].forEach((imageUrl: string, index: number) => {
            const image = new Image();
            const texture = gl.createTexture();
            image.addEventListener('load', () => {
                this.loadTexture(gl, n, texture, u_Sampler, image, index);
            });
            image.src = imageUrl;
        });
    }

    private loadTexture(gl: any, n: number, texture: any, u_Sampler: any, image: any, texUnitIndex: number): void {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(texUnitIndex === 0 ? gl.TEXTURE0 : gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // important for setting the TEXTURE_MIN_FILTER, TEXTURE_MAG_FILTER, TEXTURE_WRAP_S, TEXTURE_WRAP_T
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.uniform1i(u_Sampler, texUnitIndex);
        this.drawScene(gl, n, texUnitIndex);
    }

    private drawScene(gl: any, vertexCount: number, texUnitIndex: number): void {
        const u_WeightFactor = this.#gl.getUniformLocation(this.#gl.program, 'u_WeightFactor');
        this.#gl.uniform1f(u_WeightFactor, this.weightFactor);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
        const ct = this.#player.getContext('2d');
        if (ct) {
            ct.drawImage(this.#glCanvas, 0, 0, this.#player.width, this.#player.height);
        }
    }
}




