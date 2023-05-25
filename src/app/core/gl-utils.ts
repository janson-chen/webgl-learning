export const initShaders = (gl: any, vshader: string, fshader: string): boolean => {
    const program = createProgram(gl, vshader, fshader);
    if (!program) {
        console.log('Failed to create program');
        return false;
      }

      gl.useProgram(program);
      gl.program = program;

      return true;
};

export const createProgram = (gl: WebGLRenderingContext, vshader: string, fshader: string): WebGLProgram | null => {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
    if (!vertexShader || !fragmentShader) {
        return null;
    }
    const program = gl.createProgram();
    if (!program) {
        return null;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    // check the result of linking
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
        const error = gl.getProgramInfoLog(program);
        console.error("failed to link program");
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return null;
    }
    return program;
};

export const loadShader = (gl: WebGLRenderingContext, type: any, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) {
        console.error("unable to create shader");
        return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
        const error = gl.getShaderInfoLog(shader);
        console.error("Failed to compile the shader: " + error);
        gl.deleteShader(shader);
        return null;
    }
    return shader;
};

export const degree2Radian = (degree: number): number => {
    return Math.PI * degree / 180.0;
}

export const resizeCanvasToDisplaySize = (canvas: HTMLCanvasElement, multiplier = 1) => {
    multiplier = multiplier || 1;
    const width  = canvas.clientWidth  * multiplier | 0;
    const height = canvas.clientHeight * multiplier | 0;
    if (canvas.width !== width ||  canvas.height !== height) {
        canvas.width  = width;
        canvas.height = height;
        return true;
    }
    return false;
}
