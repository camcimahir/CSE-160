// Unit cube geometry, uploaded to a single static GPU buffer ONCE.
// Faces are laid out back-to-back in the buffer so we can draw each face
// with gl.drawArrays(TRIANGLES, faceOffset, 6) without ever re-uploading.
//
// Layout (6 floats per vertex pair, 6 verts per face, 18 floats per face):
//   front  -> offset 0   (verts 0..5)
//   top    -> offset 6   (verts 6..11)
//   right  -> offset 12  (verts 12..17)
//   left   -> offset 18  (verts 18..23)
//   bottom -> offset 24  (verts 24..29)
//   back   -> offset 30  (verts 30..35)
var _CUBE_VERTS = new Float32Array([
    // front  (z=0 plane)
    0,0,0,  1,1,0,  1,0,0,
    0,0,0,  0,1,0,  1,1,0,
    // top    (y=1 plane)
    0,1,0,  0,1,1,  1,1,1,
    0,1,0,  1,1,1,  1,1,0,
    // right  (x=1 plane)
    1,0,0,  1,1,1,  1,0,1,
    1,0,0,  1,1,0,  1,1,1,
    // left   (x=0 plane)
    0,0,0,  0,0,1,  0,1,1,
    0,0,0,  0,1,1,  0,1,0,
    // bottom (y=0 plane)
    0,0,0,  1,0,1,  0,0,1,
    0,0,0,  1,0,0,  1,0,1,
    // back   (z=1 plane)
    0,0,1,  1,1,1,  0,1,1,
    0,0,1,  1,0,1,  1,1,1
]);

var _cubeGlBuffer = null;

function _ensureCubeBuffer() {
    if (_cubeGlBuffer) { return; }
    _cubeGlBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, _cubeGlBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, _CUBE_VERTS, gl.STATIC_DRAW);
}

class Cube {
    constructor() {
        this.type  = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
    }

    render() {
        _ensureCubeBuffer();

        var r = this.color[0], g = this.color[1],
            b = this.color[2], a = this.color[3];

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Bind ONCE per cube, set the attribute pointer ONCE per cube.
        gl.bindBuffer(gl.ARRAY_BUFFER, _cubeGlBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // 6 face draws, no buffer re-uploads. Just a uniform + drawArrays.
        gl.uniform4f(u_FragColor, r,     g,     b,     a);   // front
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.uniform4f(u_FragColor, r*.9,  g*.9,  b*.9,  a);   // top
        gl.drawArrays(gl.TRIANGLES, 6, 6);

        gl.uniform4f(u_FragColor, r*.8,  g*.8,  b*.8,  a);   // right
        gl.drawArrays(gl.TRIANGLES, 12, 6);

        gl.uniform4f(u_FragColor, r*.85, g*.85, b*.85, a);   // left
        gl.drawArrays(gl.TRIANGLES, 18, 6);

        gl.uniform4f(u_FragColor, r*.7,  g*.7,  b*.7,  a);   // bottom
        gl.drawArrays(gl.TRIANGLES, 24, 6);

        gl.uniform4f(u_FragColor, r*.75, g*.75, b*.75, a);   // back
        gl.drawArrays(gl.TRIANGLES, 30, 6);
    }
}
