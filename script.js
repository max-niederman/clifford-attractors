const N_ITERATIONS = 35;
const NUM_POINTS_PER_PIXEL = 3;

main();

function main() {
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById("canvas");
    const gl = canvas.getContext("webgl2");

    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, `
        #version 300 es

        #define TAU 6.28318530718

        uniform float a;
        uniform float b;
        uniform float c;
        uniform float d;
        uniform vec2 scale;
        uniform int nIterations;
        uniform int nParticles;

        out vec3 color;

        vec2 attract(vec2 pos) {
            return sin(vec2(a, b) * pos.yx)
                    + vec2(c, d) * cos(vec2(a, b) * pos);
        }

        vec3 palette(float t) {
            const vec3 a = vec3(0.5, 0.5, 0.5);
            const vec3 b = vec3(0.5, 0.5, 0.5);
            const vec3 c = vec3(2.0, 1.0, 0.0);
            const vec3 d = vec3(0.5, 0.20, 0.6);

            return a + b * cos(TAU * (c * t + d));
        }

        void main() {
            float t = float(gl_VertexID) / float(nParticles);
            vec2 pos = vec2(cos(t), sin(t));

            for (int i = 0; i < nIterations; i++) {
                pos = attract(pos);
            }

            color = palette(t);
            gl_Position = vec4(scale * pos, 0, 1);
        }

    `);

    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER,
        `#version 300 es
        
        precision mediump float;

        in vec3 color;

        out vec4 fragColor;
        
        void main() {
            fragColor = vec4(color, 0.03);
        }`
    );

    const program = createProgram(gl, vertexShader, fragmentShader);

    const aLocation = gl.getUniformLocation(program, "a");
    const bLocation = gl.getUniformLocation(program, "b");
    const cLocation = gl.getUniformLocation(program, "c");
    const dLocation = gl.getUniformLocation(program, "d");
    const scaleLocation = gl.getUniformLocation(program, "scale");
    const nIterationsLocation = gl.getUniformLocation(program, "nIterations");
    const nParticlesLocation = gl.getUniformLocation(program, "nParticles");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    
    /**
     * Draw the scene.
     * @param {DOMHighResTimeStamp} now 
     */
    function draw(now) {
        resizeCanvasToDisplaySize(canvas);
        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        gl.uniform1f(aLocation, -1.8 + 0.1 * Math.sin(now * 0.001));
        gl.uniform1f(bLocation, 1.2 + 0.3 * Math.sin(now * 0.001 * 0.3));
        gl.uniform1f(cLocation, -1.6);
        gl.uniform1f(dLocation, -0.8);
        gl.uniform2fv(scaleLocation, [0.8 * canvas.height / canvas.width, 0.8]);
        gl.uniform1i(nIterationsLocation, N_ITERATIONS);
        gl.uniform1i(nParticlesLocation, NUM_POINTS_PER_PIXEL * canvas.width * canvas.height);

        gl.drawArrays(gl.POINTS, 0, NUM_POINTS_PER_PIXEL * canvas.width * canvas.height);

        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
}



/**
 * Create a WebGL shader.
 * @param {WebGL2RenderingContext} gl 
 * @param {number} type 
 * @param {string} source 
 * @returns {WebGLShader | null}
 */
function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source.trim());
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
   
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

/**
 * Create a WebGL shader program.
 * @param {WebGL2RenderingContext} gl 
 * @param {WebGLShader} vertexShader 
 * @param {WebGLShader} fragmentShader 
 * @returns {WebGLProgram | null}
 */
function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

/**
 * Resizes the canvas to match the size that the browser is displaying it.
 *
 * @param {HTMLCanvasElement} canvas - The canvas element to resize.
 */
function resizeCanvasToDisplaySize(canvas) {
  // Lookup the size the browser is displaying the canvas in CSS pixels.
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // Check if the canvas is not the same size.
  const needResize =
    canvas.width !== displayWidth || canvas.height !== displayHeight;

  if (needResize) {
    // Make the canvas the same size
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}
