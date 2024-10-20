/**
 * Class implementing the shaders for drawing of lines (points).
 */
class PointShaders {
  /**
   * Constructor.
   *
   * @param {WebGLRenderingContext} gl
   *      The WebGL rendering context to use.
   */
  constructor(gl) {
    this.gl = gl // Save the WebGL context for use in other methods
    this.colorPoint = [255, 0, 0] // Default point color (RGB, gray)
    this.pointSize = 2.0 // Default point size

    // Vertex shader, defines how points are transformed and rendered
    this.vertShaderLine = `#version 300 es
            in vec4 a_position;   // Attribute for point position
            in vec4 a_color;      // Attribute for point color

            uniform mat4 u_matrix;  // Transformation matrix (passed from JavaScript)
            uniform float pointSize; // Size of the point (passed from JavaScript)

            out vec4 v_color;    // Output color to be passed to fragment shader

            void main() {
                gl_Position = u_matrix * a_position; // Apply the transformation matrix
                gl_PointSize = pointSize; // Set the size of the point
                v_color = a_color; // Pass the color to the fragment shader
            }
        `

    // Fragment shader, defines the color of each point
    this.fragShaderLine = `#version 300 es
            precision highp float; // High precision for color values

            in vec4 v_color;     // Input color from vertex shader
            out vec4 outColor;   // Output color for the pixel

            void main() {
                outColor = v_color; // Set the pixel color
            }
        `

    this.gridLines = 0 // Variable to track the number of points (lines)
  }

  /**
   * Initialize shaders and buffers.
   */
  init() {
    let gl = this.gl // Get the WebGL context

    // Compile and link the vertex and fragment shaders into a program
    this.program = compileProgram(gl, this.vertShaderLine, this.fragShaderLine)

    // Get the location of attributes and uniforms in the shader program
    this.posAttrLocation = gl.getAttribLocation(this.program, 'a_position') // Location of a_position
    this.colorAttrLocation = gl.getAttribLocation(this.program, 'a_color') // Location of a_color
    this.matrixLocation = gl.getUniformLocation(this.program, 'u_matrix') // Location of u_matrix

    // Create a vertex array object to store the state of buffers
    this.vertexArray = gl.createVertexArray()
    gl.bindVertexArray(this.vertexArray) // Bind the vertex array object

    // Create a buffer for position data
    this.positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer) // Bind the position buffer
    gl.enableVertexAttribArray(this.posAttrLocation) // Enable the position attribute
    gl.vertexAttribPointer(this.posAttrLocation, 3, gl.FLOAT, false, 0, 0) // Set the pointer to read 3 floats per vertex (x, y, z)

    // Create a buffer for color data
    this.colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer) // Bind the color buffer
    gl.enableVertexAttribArray(this.colorAttrLocation) // Enable the color attribute
    gl.vertexAttribPointer(
      this.colorAttrLocation,
      4,
      gl.UNSIGNED_BYTE,
      true,
      0,
      0
    ) // Set the pointer to read 3 bytes per color (R, G, B), normalized to [0, 1]

    // Use the compiled shader program
    gl.useProgram(this.program)
  }

  /**
   * Draw the points (grid of lines).
   *
   * @param {*} viewMatrix
   *      The view matrix to transform the points.
   */
  draw(viewMatrix) {
    const gl = this.gl

    // Use the shader program
    gl.useProgram(this.program)
    // Bind the vertex array object (containing the state of buffers)
    gl.bindVertexArray(this.vertexArray)
    // Pass the transformation matrix to the shader
    gl.uniformMatrix4fv(this.matrixLocation, false, viewMatrix)

    // Get the location of point size in the shader
    const pointSizeLocation = gl.getUniformLocation(this.program, 'pointSize')
    console.log('Point size: ', this.pointSize)
    // Set the point size in the shader
    gl.uniform1f(pointSizeLocation, this.pointSize)

    // Draw the points (POINTS primitive)
    gl.drawArrays(gl.POINTS, 0, this.gridLines * 2) // Multiplies by 2 unnecessarily, may cause rendering issues
  }

  /**
   * Set the geometry for the points.
   *
   * @param {Array} points
   *      Array of point positions.
   */
  setGeometry(points) {
    let gl = this.gl

    this.gridLines = points.length / 2 // Number of points (dividing by 2 seems incorrect for 3D points)

    var positions = new Float32Array(points.length * 3) // Buffer for position data

    // Fill the position buffer with point coordinates
    for (let indPoint = 0; indPoint < points.length; indPoint++) {
      const index = indPoint * 3 // Calculate position index
      const point = points[indPoint] // Get the current point

      // Store the x, y, z coordinates
      positions[index] = point[0]
      positions[index + 1] = point[1]
      positions[index + 2] = point[2]
    }

    // Bind the position buffer and fill it with the position data
    gl.bindVertexArray(this.vertexArray)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    // Set the color data for the points
    this.setColors(gl)
  }

  /**
   * Set the colors for the points.
   */
  setColors() {
    let gl = this.gl

    // Create an array to hold color data (6 bytes per point, 2 points per line)
    const colorArray = new Uint8Array(this.gridLines * 8) // 8 bytes per point (RGBA)

    for (let indPoint = 0; indPoint < this.gridLines * 2; indPoint++) {
      const startIndex = indPoint * 4 // Calculate RGBA index
      colorArray[startIndex] = this.colorPoint[0] // Red
      colorArray[startIndex + 1] = this.colorPoint[1] // Green
      colorArray[startIndex + 2] = this.colorPoint[2] // Blue
      colorArray[startIndex + 3] = 255 // Alpha (fully opaque)
    }

    // Bind the color buffer and fill it with color data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW)
  }
}
