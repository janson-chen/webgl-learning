import { Component, OnInit } from '@angular/core';
import { getWebGLContext, initShaders } from 'src/app/core/gl-utils';
import { mat4, vec3 } from "gl-matrix";

@Component({
  selector: 'app-mesh',
  templateUrl: './mesh.component.html',
  styleUrls: ['./mesh.component.scss']
})
export class MeshComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    const VSHADER_SOURCE =
      'attribute vec4 a_Position;\n' +
      'attribute vec4 a_Color;\n' +
      'uniform mat4 u_mvpMatrix;\n' +
      'varying vec4 v_Color;\n' +
      'void main() {\n' +
      '  gl_Position = u_mvpMatrix * a_Position;\n' +
      '  v_Color = a_Color;\n' +
      '}\n';


    const FSHADER_SOURCE =
      '#ifdef GL_ES\n' +
      'precision mediump float;\n' +
      '#endif\n' +
      'varying vec4 v_Color;\n' +
      'void main() {\n' +
      '  gl_FragColor = v_Color;\n' +
      '}\n';

    const canvas = document.querySelector<HTMLCanvasElement>('#webgl');

    // Get the rendering context for WebGL
    if (canvas) {
      const gl = getWebGLContext(canvas);
      if (gl) {
        // Initialize shaders
      initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)
      const vertexCount = this.initVertexBuffers(gl);

      // Set the clear color and enable the depth test
      gl.clearColor(0, 0, 0, 1);
      gl.enable(gl.DEPTH_TEST);

      // Get the storage locations of uniform variables
      var u_mvpMatrix = gl.getUniformLocation(gl.program, 'u_mvpMatrix');
      if (!u_mvpMatrix) {
        console.log('Failed to get the storage location of uniform variable');
        return;
      }

      var modelMatrix = mat4.create();
      var viewMatrix = mat4.create();
      var projMatrix = mat4.create();
      var mvpMatrix = mat4.create();

      // Calculate the view projection matrix
      // viewMatrix.setLookAt(0, 0, 5, 0, 0, -100, 0, 1, 0);
      mat4.lookAt(viewMatrix, vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, -100), vec3.fromValues(0, 1, 0));
      mat4.perspective(projMatrix, 30, canvas.width / canvas.height, 1, 100);
      // projMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);

      // Clear <canvas>
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      for (var i = 0; i < 10; i++) {
        var x = Math.random() * Math.pow(-1, i);
        var z = Math.random() * i * 5;
        mat4.fromTranslation(modelMatrix, vec3.fromValues(x, 0, -z));
        mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(x, 0, -z));
        // Calculate a model view projection matrix
        mat4.multiply(modelMatrix, mat4.multiply(mat4.create(), mat4.clone(projMatrix), viewMatrix), modelMatrix);
        // Set the matrix to u_mvpMatrix
        gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix);

        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
      }
      }
    }
  }

  private initVertexBuffers(gl: any): number {
    var verticesColors = new Float32Array([
      // vertex    　　　 color
      0.0, 1.0, 0.0, 0.0, 0.0, 1.0,
      -0.5, -1.0, 0.0, 0.0, 0.0, 1.0,
      0.5, -1.0, 0.0, 0.0, 1.0, 0.0,
    ]);
    var n = 3;

    // Create a buffer object
    var vertexColorbuffer = gl.createBuffer();
    if (!vertexColorbuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    var FSIZE = verticesColors.BYTES_PER_ELEMENT;

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
      console.log('Failed to get the storage location of a_Color');
      return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);

    return n;
  }
}




