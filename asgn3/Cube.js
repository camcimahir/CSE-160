// Cube.js - shared static buffer (ES5-friendly: no class / no arrow functions)

function CubeInstance() {
  this.matrix = new Matrix4();
  this.color = [1.0, 1.0, 1.0, 1.0];
  this.textureNum = -2;
}

var Cube = CubeInstance;

Cube.initBuffer = function () {
  if (Cube._buf) return;
  var verts = Cube._buildVertices();
  Cube._buf = gl.createBuffer();
  if (!Cube._buf) {
    console.log('Failed to create the cube buffer');
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, Cube._buf);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  Cube._count = 36;
};

Cube._buildVertices = function () {
  var out = [];
  function face(p0, p1, p2, p3) {
    out.push(p0[0], p0[1], p0[2], 0, 0);
    out.push(p1[0], p1[1], p1[2], 1, 0);
    out.push(p2[0], p2[1], p2[2], 1, 1);
    out.push(p0[0], p0[1], p0[2], 0, 0);
    out.push(p2[0], p2[1], p2[2], 1, 1);
    out.push(p3[0], p3[1], p3[2], 0, 1);
  }
  face([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]);
  face([1, 0, 1], [0, 0, 1], [0, 1, 1], [1, 1, 1]);
  face([0, 0, 1], [0, 0, 0], [0, 1, 0], [0, 1, 1]);
  face([1, 0, 0], [1, 0, 1], [1, 1, 1], [1, 1, 0]);
  face([0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]);
  face([0, 0, 1], [1, 0, 1], [1, 0, 0], [0, 0, 0]);
  return new Float32Array(out);
};

Cube.drawShared = function (model, color, texId) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, model.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  gl.uniform1i(u_whichTexture, texId);

  gl.bindBuffer(gl.ARRAY_BUFFER, Cube._buf);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 20, 0);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 20, 12);
  gl.enableVertexAttribArray(a_Position);
  gl.enableVertexAttribArray(a_UV);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
};

CubeInstance.prototype.render = function () {
  Cube.drawShared(this.matrix, this.color, this.textureNum);
};
