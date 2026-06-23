class Polygon {
  constructor() {
    this.type = 'polygon';
    this.points = [];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 10.0;
  }

  render() {
    if (!this.points || this.points.length < 3) {
      return;
    }

    var rgba = this.color;
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    var vertices = [];
    var p0 = this.points[0];

    // Triangulate as a fan using the points in the clicked order.
    for (var i = 1; i < this.points.length - 1; i++) {
      var p1 = this.points[i];
      var p2 = this.points[i + 1];
      vertices.push(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1]);
    }

    drawPolygonTriangles(vertices);
  }
}

function drawPolygonTriangles(vertices) {
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
}