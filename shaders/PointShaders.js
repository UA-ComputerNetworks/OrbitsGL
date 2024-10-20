class PointShaders {
  constructor(gl) {
    this.gl = gl
    this.colorPoint = [255, 255, 255] // Default to cyan
    this.pointSize = 2.0

    this.vertShaderLine = `#version 300 es
        in vec4 a_position;
        in vec4 a_color;

        uniform mat4 u_matrix;
        uniform float pointSize;

        out vec4 v_color;

        void main() {
            gl_Position = u_matrix * a_position;
            gl_PointSize = pointSize;
            // Pass the color to the fragment shader
            v_color = a_color / 255.0;  // Normalize the color
        }
        `

    this.fragShaderLine = `#version 300 es
        precision highp float;

        in vec4 v_color;

        out vec4 outColor;

        void main() {
            outColor = v_color;  // Apply the color passed from the vertex shader
        }
        `

    this.gridLines = 0
  }

  init() {
    let gl = this.gl
    this.program = compileProgram(gl, this.vertShaderLine, this.fragShaderLine)

    this.posAttrLocation = gl.getAttribLocation(this.program, 'a_position')
    this.colorAttrLocation = gl.getAttribLocation(this.program, 'a_color')
    this.matrixLocation = gl.getUniformLocation(this.program, 'u_matrix')

    // Load orbit coordinates.
    this.vertexArray = gl.createVertexArray()
    gl.bindVertexArray(this.vertexArray)

    // Position buffer setup
    this.positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    gl.enableVertexAttribArray(this.posAttrLocation)
    gl.vertexAttribPointer(this.posAttrLocation, 3, gl.FLOAT, false, 0, 0)

    // Color buffer setup
    this.colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer)
    gl.enableVertexAttribArray(this.colorAttrLocation)
    gl.vertexAttribPointer(
      this.colorAttrLocation,
      3,
      gl.UNSIGNED_BYTE,
      true,
      0,
      0
    )

    gl.useProgram(this.program)
  }

  draw(viewMatrix) {
    const gl = this.gl

    gl.useProgram(this.program)
    gl.bindVertexArray(this.vertexArray)
    gl.uniformMatrix4fv(this.matrixLocation, false, viewMatrix)

    const pointSizeLocation = gl.getUniformLocation(this.program, 'pointSize')
    gl.uniform1f(pointSizeLocation, this.pointSize)

    gl.drawArrays(gl.POINTS, 0, this.gridLines * 2)
  }

  setGeometry(points, colors) {
    let gl = this.gl

    this.gridLines = points.length / 2

    var positions = new Float32Array(points.length * 3)
    var colorArray = new Uint8Array(points.length * 3) // Color array for RGB

    for (let indPoint = 0; indPoint < points.length; indPoint++) {
      const index = indPoint * 3
      const point = points[indPoint]
      const color = colors[indPoint] // RGB color for each point

      // Set positions
      positions[index] = point[0]
      positions[index + 1] = point[1]
      positions[index + 2] = point[2]

      // Set colors
      colorArray[index] = color[0] // Red
      colorArray[index + 1] = color[1] // Green
      colorArray[index + 2] = color[2] // Blue
    }

    // Bind and update position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    // Bind and update color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW)
  }
}
