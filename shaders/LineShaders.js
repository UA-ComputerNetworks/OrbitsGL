class LineShaders {
  constructor(gl) {
    this.gl = gl
    this.colorOrbit = [127, 127, 127]
    this.lineWidth = 2.0 // Default line width
    this.lineStyle = 'solid' // Default line style (solid/dashed)

    this.vertShaderLine = `#version 300 es
        in vec4 a_position;
        in vec4 a_color;
        uniform mat4 u_matrix;
        out vec4 v_color;

        void main() {
            gl_Position = u_matrix * a_position;
            v_color = a_color;
        }
    `

    this.fragShaderLine = `#version 300 es
        precision highp float;
        in vec4 v_color;
        out vec4 outColor;

        void main() {
            outColor = v_color;
        }
    `
    this.gridLines = 0
  }

  init() {
    const gl = this.gl
    this.program = compileProgram(gl, this.vertShaderLine, this.fragShaderLine)

    this.posAttrLocation = gl.getAttribLocation(this.program, 'a_position')
    this.colorAttrLocation = gl.getAttribLocation(this.program, 'a_color')
    this.matrixLocation = gl.getUniformLocation(this.program, 'u_matrix')

    this.vertexArray = gl.createVertexArray()
    gl.bindVertexArray(this.vertexArray)

    this.positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    gl.enableVertexAttribArray(this.posAttrLocation)
    gl.vertexAttribPointer(this.posAttrLocation, 3, gl.FLOAT, false, 0, 0)

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

    // Set line width (WebGL line width has hardware-dependent limitations)
    gl.lineWidth(this.lineWidth)

    gl.drawArrays(gl.LINES, 0, this.gridLines * 2)
  }

  setGeometry(points, color) {
    const gl = this.gl
    this.gridLines = points.length / 2

    const positions = new Float32Array(points.length * 3)
    for (let i = 0; i < points.length; i++) {
      const index = i * 3
      const point = points[i]
      positions[index] = point[0]
      positions[index + 1] = point[1]
      positions[index + 2] = point[2]
    }

    gl.bindVertexArray(this.vertexArray)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    this.setColors(color)
  }

  setColors(color = [255, 255, 255]) {
    const gl = this.gl
    const colorArray = new Uint8Array(this.gridLines * 6)

    for (let i = 0; i < this.gridLines * 2; i++) {
      const startIndex = i * 3
      colorArray[startIndex] = color[0]
      colorArray[startIndex + 1] = color[1]
      colorArray[startIndex + 2] = color[2]
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW)
  }

  setStyle(width = 10.0, style = 'solid') {
    this.lineWidth = width // Default to 2.0 if not provided
    this.lineStyle = style // Default to "solid"

    if (style === 'dashed') {
      console.warn('Dashed lines are currently not implemented.')
    }
  }
}
