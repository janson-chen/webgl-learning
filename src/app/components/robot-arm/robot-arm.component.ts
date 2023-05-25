import { Component, OnInit } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { degree2Radian, initShaders } from 'src/app/core/gl-utils';

@Component({
    selector: 'app-robot-arm',
    templateUrl: './robot-arm.component.html',
    styleUrls: ['./robot-arm.component.scss']
})
export class RobotArmComponent implements OnInit {
    #g_baseBuffer = null;     // Buffer object for a base
    #g_arm1Buffer = null;     // Buffer object for arm1
    #g_arm2Buffer = null;     // Buffer object for arm2
    #g_palmBuffer = null;     // Buffer object for a palm
    #g_fingerBuffer = null;   // Buffer object for fingers

    readonly #ANGLE_STEP = degree2Radian(3.0);     // The increments of rotation angle (degrees)
    #g_arm1Angle = degree2Radian(90.0);   // The rotation angle of arm1 (degrees)
    #g_joint1Angle = degree2Radian(45.0); // The rotation angle of joint1 (degrees)
    #g_joint2Angle = 0.0;  // The rotation angle of joint2 (degrees)
    #g_joint3Angle = 0.0;  // The rotation angle of joint3 (degrees)

    #g_mvpMatrix: mat4 = mat4.create();
    #g_modelMatrix: mat4 = mat4.create();
    #g_normalMatrix: mat4 = mat4.create();
    #g_matrixStack: mat4[] = []; // Array for storing a matrix

    get vShaderSource(): string {
        return `
            attribute vec4 a_Position;\n
            attribute vec4 a_Normal;\n
            uniform mat4 u_MvpMatrix;\n
            uniform mat4 u_NormalMatrix;\n
            varying vec4 v_Color;\n
            void main() {\n
                gl_Position = u_MvpMatrix * a_Position;\n
                vec3 lightDirection = normalize(vec3(0.0, 0.5, 0.8));\n
                vec4 color = vec4(0.5, 0.4, 0.5, 1.0);\n
                vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n
                float nDotL = max(dot(normal, lightDirection), 0.0);\n
                v_Color = vec4(color.rgb * nDotL + vec3(0.1), color.a);\n
            }\n
        `;
    }

    get fShaderSource(): string {
        return `
            #ifdef GL_ES\n
            precision mediump float;\n
            #endif\n
            varying vec4 v_Color;\n
            void main() {\n
                gl_FragColor = v_Color;\n
            }\n
        `;
    }

    ngOnInit(): void {
        this.main();
    }

    private main(): void {
        const canvas = document.getElementById('webgl') as HTMLCanvasElement;
        if (canvas) {
            const gl = canvas.getContext("webgl") as any;
            initShaders(gl, this.vShaderSource, this.fShaderSource);
            const n = this.initVertexBuffers(gl);
            // Set the clear color and enable the depth test
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.enable(gl.DEPTH_TEST);
            // Get the storage locations of attribute and uniform variables
            const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
            const u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
            const u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

            if (a_Position < 0 || !u_MvpMatrix || !u_NormalMatrix) {
                console.log('Failed to get the storage location of attribute or uniform variable');
                return;
            }
            // Calculate the view projection matrix
            const viewProjMatrix = mat4.create();
            mat4.perspective(viewProjMatrix, degree2Radian(50.0), canvas.width / canvas.height, 1.0, 100.0);
            mat4.multiply(viewProjMatrix, viewProjMatrix, mat4.lookAt(mat4.clone(viewProjMatrix), vec3.fromValues(20.0, 10.0, 30.0), vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, 1.0, 0.0)));
            // Register the event handler to be called on key press
            document.onkeydown = (ev) => {
                this.keydown(ev, gl, n, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);
            };

            this.draw(gl, n, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);
        }
    }

    private initVertexBuffers(gl: any): number {
        const vertices_base = new Float32Array([
            5.0, 2.0, 5.0, -5.0, 2.0, 5.0, -5.0, 0.0, 5.0, 5.0, 0.0, 5.0, // v0-v1-v2-v3 front
            5.0, 2.0, 5.0, 5.0, 0.0, 5.0, 5.0, 0.0, -5.0, 5.0, 2.0, -5.0, // v0-v3-v4-v5 right
            5.0, 2.0, 5.0, 5.0, 2.0, -5.0, -5.0, 2.0, -5.0, -5.0, 2.0, 5.0, // v0-v5-v6-v1 up
            -5.0, 2.0, 5.0, -5.0, 2.0, -5.0, -5.0, 0.0, -5.0, -5.0, 0.0, 5.0, // v1-v6-v7-v2 left
            -5.0, 0.0, -5.0, 5.0, 0.0, -5.0, 5.0, 0.0, 5.0, -5.0, 0.0, 5.0, // v7-v4-v3-v2 down
            5.0, 0.0, -5.0, -5.0, 0.0, -5.0, -5.0, 2.0, -5.0, 5.0, 2.0, -5.0  // v4-v7-v6-v5 back
        ]);

        const vertices_arm1 = new Float32Array([  // Arm1(3x10x3)
            1.5, 10.0, 1.5, -1.5, 10.0, 1.5, -1.5, 0.0, 1.5, 1.5, 0.0, 1.5, // v0-v1-v2-v3 front
            1.5, 10.0, 1.5, 1.5, 0.0, 1.5, 1.5, 0.0, -1.5, 1.5, 10.0, -1.5, // v0-v3-v4-v5 right
            1.5, 10.0, 1.5, 1.5, 10.0, -1.5, -1.5, 10.0, -1.5, -1.5, 10.0, 1.5, // v0-v5-v6-v1 up
            -1.5, 10.0, 1.5, -1.5, 10.0, -1.5, -1.5, 0.0, -1.5, -1.5, 0.0, 1.5, // v1-v6-v7-v2 left
            -1.5, 0.0, -1.5, 1.5, 0.0, -1.5, 1.5, 0.0, 1.5, -1.5, 0.0, 1.5, // v7-v4-v3-v2 down
            1.5, 0.0, -1.5, -1.5, 0.0, -1.5, -1.5, 10.0, -1.5, 1.5, 10.0, -1.5  // v4-v7-v6-v5 back
        ]);

        const vertices_arm2 = new Float32Array([  // Arm2(4x10x4)
            2.0, 10.0, 2.0, -2.0, 10.0, 2.0, -2.0, 0.0, 2.0, 2.0, 0.0, 2.0, // v0-v1-v2-v3 front
            2.0, 10.0, 2.0, 2.0, 0.0, 2.0, 2.0, 0.0, -2.0, 2.0, 10.0, -2.0, // v0-v3-v4-v5 right
            2.0, 10.0, 2.0, 2.0, 10.0, -2.0, -2.0, 10.0, -2.0, -2.0, 10.0, 2.0, // v0-v5-v6-v1 up
            -2.0, 10.0, 2.0, -2.0, 10.0, -2.0, -2.0, 0.0, -2.0, -2.0, 0.0, 2.0, // v1-v6-v7-v2 left
            -2.0, 0.0, -2.0, 2.0, 0.0, -2.0, 2.0, 0.0, 2.0, -2.0, 0.0, 2.0, // v7-v4-v3-v2 down
            2.0, 0.0, -2.0, -2.0, 0.0, -2.0, -2.0, 10.0, -2.0, 2.0, 10.0, -2.0  // v4-v7-v6-v5 back
        ]);

        const vertices_palm = new Float32Array([  // Palm(2x2x6)
            1.0, 2.0, 3.0, -1.0, 2.0, 3.0, -1.0, 0.0, 3.0, 1.0, 0.0, 3.0, // v0-v1-v2-v3 front
            1.0, 2.0, 3.0, 1.0, 0.0, 3.0, 1.0, 0.0, -3.0, 1.0, 2.0, -3.0, // v0-v3-v4-v5 right
            1.0, 2.0, 3.0, 1.0, 2.0, -3.0, -1.0, 2.0, -3.0, -1.0, 2.0, 3.0, // v0-v5-v6-v1 up
            -1.0, 2.0, 3.0, -1.0, 2.0, -3.0, -1.0, 0.0, -3.0, -1.0, 0.0, 3.0, // v1-v6-v7-v2 left
            -1.0, 0.0, -3.0, 1.0, 0.0, -3.0, 1.0, 0.0, 3.0, -1.0, 0.0, 3.0, // v7-v4-v3-v2 down
            1.0, 0.0, -3.0, -1.0, 0.0, -3.0, -1.0, 2.0, -3.0, 1.0, 2.0, -3.0  // v4-v7-v6-v5 back
        ]);

        const vertices_finger = new Float32Array([  // Fingers(1x2x1)
            0.5, 2.0, 0.5, -0.5, 2.0, 0.5, -0.5, 0.0, 0.5, 0.5, 0.0, 0.5, // v0-v1-v2-v3 front
            0.5, 2.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, -0.5, 0.5, 2.0, -0.5, // v0-v3-v4-v5 right
            0.5, 2.0, 0.5, 0.5, 2.0, -0.5, -0.5, 2.0, -0.5, -0.5, 2.0, 0.5, // v0-v5-v6-v1 up
            -0.5, 2.0, 0.5, -0.5, 2.0, -0.5, -0.5, 0.0, -0.5, -0.5, 0.0, 0.5, // v1-v6-v7-v2 left
            -0.5, 0.0, -0.5, 0.5, 0.0, -0.5, 0.5, 0.0, 0.5, -0.5, 0.0, 0.5, // v7-v4-v3-v2 down
            0.5, 0.0, -0.5, -0.5, 0.0, -0.5, -0.5, 2.0, -0.5, 0.5, 2.0, -0.5  // v4-v7-v6-v5 back
        ]);

        // Normal
        const normals = new Float32Array([
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // v7-v4-v3-v2 down
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0  // v4-v7-v6-v5 back
        ]);

        // Indices of the vertices
        const indices = new Uint8Array([
            0, 1, 2, 0, 2, 3,    // front
            4, 5, 6, 4, 6, 7,    // right
            8, 9, 10, 8, 10, 11,    // up
            12, 13, 14, 12, 14, 15,    // left
            16, 17, 18, 16, 18, 19,    // down
            20, 21, 22, 20, 22, 23     // back
        ]);

        // Write coords to buffers, but don't assign to attribute variables
        this.#g_baseBuffer = this.initArrayBufferForLaterUse(gl, vertices_base, 3, gl.FLOAT);
        this.#g_arm1Buffer = this.initArrayBufferForLaterUse(gl, vertices_arm1, 3, gl.FLOAT);
        this.#g_arm2Buffer = this.initArrayBufferForLaterUse(gl, vertices_arm2, 3, gl.FLOAT);
        this.#g_palmBuffer = this.initArrayBufferForLaterUse(gl, vertices_palm, 3, gl.FLOAT);
        this.#g_fingerBuffer = this.initArrayBufferForLaterUse(gl, vertices_finger, 3, gl.FLOAT);
        if (!this.#g_baseBuffer || !this.#g_arm1Buffer || !this.#g_arm2Buffer || !this.#g_palmBuffer || !this.#g_fingerBuffer) return -1;
        // Write normals to a buffer, assign it to a_Normal and enable it
        if (!this.initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
        // Write the indices to the buffer object
        const indexBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        return indices.length;
    }

    private initArrayBufferForLaterUse(gl: WebGLRenderingContext, data: Float32Array, num: any, type: any): any {
        const buffer = gl.createBuffer() as any;   // Create a buffer object
        if (!buffer) {
            console.log('Failed to create the buffer object');
            return null;
        }
        // Write date into the buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

        // Store the necessary information to assign the object to the attribute variable later
        buffer.num = num;
        buffer.type = type;

        return buffer;
    }


    private initArrayBuffer(gl: any, attribute: any, data: Float32Array, num: number, type: any): boolean {
        const buffer = gl.createBuffer();   // Create a buffer object
        if (!buffer) {
            console.log('Failed to create the buffer object');
            return false;
        }
        // Write date into the buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

        // Assign the buffer object to the attribute variable
        const a_attribute = gl.getAttribLocation(gl.program, attribute);
        if (a_attribute < 0) {
            console.log('Failed to get the storage location of ' + attribute);
            return false;
        }
        gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
        // Enable the assignment of the buffer object to the attribute variable
        gl.enableVertexAttribArray(a_attribute);

        return true;
    }

    private keydown(ev: any, gl: any, o: any, viewProjMatrix: mat4, a_Position: any, u_MvpMatrix: any, u_NormalMatrix: any): void {
        switch (ev.keyCode) {
            case 40: // Up arrow key -> the positive rotation of joint1 around the z-axis
                if (this.#g_joint1Angle < degree2Radian(135.0)) this.#g_joint1Angle += this.#ANGLE_STEP;
                break;
            case 38: // Down arrow key -> the negative rotation of joint1 around the z-axis
                if (this.#g_joint1Angle > degree2Radian(-135.0)) this.#g_joint1Angle -= this.#ANGLE_STEP;
                break;
            case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
                this.#g_arm1Angle = (this.#g_arm1Angle + this.#ANGLE_STEP) % degree2Radian(360);
                break;
            case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
                this.#g_arm1Angle = (this.#g_arm1Angle - this.#ANGLE_STEP) % degree2Radian(360);
                break;
            case 90: // 'ｚ'key -> the positive rotation of joint2
                this.#g_joint2Angle = (this.#g_joint2Angle + this.#ANGLE_STEP) % degree2Radian(360);
                break;
            case 88: // 'x'key -> the negative rotation of joint2
                this.#g_joint2Angle = (this.#g_joint2Angle - this.#ANGLE_STEP) % degree2Radian(360);
                break;
            case 86: // 'v'key -> the positive rotation of joint3
                if (this.#g_joint3Angle < degree2Radian(60.0)) this.#g_joint3Angle = (this.#g_joint3Angle + this.#ANGLE_STEP) % degree2Radian(360);
                break;
            case 67: // 'c'key -> the nagative rotation of joint3
                if (this.#g_joint3Angle > degree2Radian(-60.0)) this.#g_joint3Angle = (this.#g_joint3Angle - this.#ANGLE_STEP) % degree2Radian(360);
                break;
            default:
                return; // Skip drawing at no effective action
        }
        // Draw
        this.draw(gl, o, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);
    }

    // Draw segments
    private drawSegment(gl: any, n: any, buffer: any, viewProjMatrix: mat4, a_Position: any, u_MvpMatrix: any, u_NormalMatrix: any) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        // Assign the buffer object to the attribute variable
        gl.vertexAttribPointer(a_Position, buffer.num, buffer.type, false, 0, 0);
        // Enable the assignment of the buffer object to the attribute variable
        gl.enableVertexAttribArray(a_Position);
        // Calculate the model view project matrix and pass it to u_MvpMatrix
        mat4.copy(this.#g_mvpMatrix, viewProjMatrix);
        mat4.multiply(this.#g_mvpMatrix, this.#g_mvpMatrix, this.#g_modelMatrix);
        gl.uniformMatrix4fv(u_MvpMatrix, false, this.#g_mvpMatrix);
        // Calculate matrix for normal and pass it to u_NormalMatrix
        mat4.invert(this.#g_normalMatrix, this.#g_modelMatrix);
        mat4.transpose(this.#g_normalMatrix, this.#g_normalMatrix);
        gl.uniformMatrix4fv(u_NormalMatrix, false, this.#g_normalMatrix);
        // Draw
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    }

    private draw(gl: any, n: any, viewProjMatrix: mat4, a_Position: any, u_MvpMatrix: any, u_NormalMatrix: any) {
        // Clear color and depth buffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Draw a base
        const baseHeight = 2.0;
        mat4.fromTranslation(this.#g_modelMatrix, vec3.fromValues(0.0, -12.0, 0.0));
        this.drawSegment(gl, n, this.#g_baseBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);

        // Arm1
        const arm1Length = 10.0;
        mat4.translate(this.#g_modelMatrix, this.#g_modelMatrix, vec3.fromValues(0.0, baseHeight, 0.0));
        mat4.rotate(this.#g_modelMatrix, this.#g_modelMatrix, this.#g_arm1Angle, vec3.fromValues(0.0, 1.0, 0.0)); // Rotate around the y-axis
        this.drawSegment(gl, n, this.#g_arm1Buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw

        // Arm2
        const arm2Length = 10.0;
        mat4.translate(this.#g_modelMatrix, this.#g_modelMatrix, vec3.fromValues(0.0, arm1Length, 0.0)); // Move to joint1
        mat4.rotate(this.#g_modelMatrix, this.#g_modelMatrix, this.#g_joint1Angle, vec3.fromValues(1.0, 0.0, 0.0)); // Rotate around the z-axis
        this.drawSegment(gl, n, this.#g_arm2Buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix); // Draw

        // A palm
        const palmLength = 2.0;
        mat4.translate(this.#g_modelMatrix, this.#g_modelMatrix, vec3.fromValues(0.0, arm2Length, 0.0)); // Move to palm
        mat4.rotate(this.#g_modelMatrix, this.#g_modelMatrix, this.#g_joint2Angle, vec3.fromValues(0.0, 1.0, 0.0)); // Rotate around the y-axis
        this.drawSegment(gl, n, this.#g_palmBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);  // Draw

        // Move to the center of the tip of the palm
        mat4.translate(this.#g_modelMatrix, this.#g_modelMatrix, vec3.fromValues(0.0, palmLength, 0.0));

        // Draw finger1
        this.pushMatrix(this.#g_modelMatrix);
        mat4.translate(this.#g_modelMatrix, this.#g_modelMatrix, vec3.fromValues(0.0, 0.0, 2.0));
        // Rotate around the x-axis
        mat4.rotate(this.#g_modelMatrix, this.#g_modelMatrix, this.#g_joint3Angle, vec3.fromValues(1.0, 0.0, 0.0));
        this.drawSegment(gl, n, this.#g_fingerBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);
        this.#g_modelMatrix = this.popMatrix();

        // Finger2
        mat4.translate(this.#g_modelMatrix, this.#g_modelMatrix, vec3.fromValues(0.0, 0.0, -2.0));
        mat4.rotate(this.#g_modelMatrix, this.#g_modelMatrix, -this.#g_joint3Angle, vec3.fromValues(1.0, 0.0, 0.0));
        this.drawSegment(gl, n, this.#g_fingerBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);
    }

    private pushMatrix(m: mat4): void { // Store the specified matrix to the array
        const m2 = mat4.clone(m);
        this.#g_matrixStack.push(m2);
    }

    private popMatrix(): mat4 { // Retrieve the matrix from the array
        return this.#g_matrixStack.pop() as mat4;
    }
}
