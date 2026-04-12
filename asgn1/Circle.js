class Circle {
  constructor() {
    this.type = 'circle';
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 10.0;
    this.segments = 10;
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    var size = this.size;
    var segments = Math.max(3, Math.floor(this.segments));

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniform1f(u_Size, size);

    var radius = this.size / 200.0;
    drawCircle(xy[0], xy[1], radius, segments);
  }
}

function drawCircle(centerX, centerY, radius, segments) {
  var vertices = [];
  var angleStep = (Math.PI * 2.0) / segments;

  for (var i = 0; i < segments; i++) {
    var angle1 = i * angleStep;
    var angle2 = (i + 1) * angleStep;

    vertices.push(centerX, centerY);
    vertices.push(centerX + Math.cos(angle1) * radius, centerY + Math.sin(angle1) * radius);
    vertices.push(centerX + Math.cos(angle2) * radius, centerY + Math.sin(angle2) * radius);
  }

  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, segments * 3);
}