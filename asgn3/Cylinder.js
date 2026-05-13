// Unit cylinder oriented along +X, from x = 0 to x = 1, with circular
// cross-sections of radius 0.5 in the YZ plane.
//
// Geometry is built once per (segments) value and uploaded to a single
// static GPU buffer. Each render() call just binds + draws — no per-frame
// CPU->GPU uploads.

var _CYL_CACHE = {};

function _buildCylinder(segments) {
    var entry = _CYL_CACHE[segments];
    if (entry && entry.glBuffer) { return entry; }

    var sideVerts   = [];
    var capPosVerts = [];   // x = 1 cap
    var capNegVerts = [];   // x = 0 cap

    var two_pi = Math.PI * 2.0;
    for (var i = 0; i < segments; i++) {
        var t1 = (i      / segments) * two_pi;
        var t2 = ((i + 1) / segments) * two_pi;
        var y1 = 0.5 * Math.cos(t1), z1 = 0.5 * Math.sin(t1);
        var y2 = 0.5 * Math.cos(t2), z2 = 0.5 * Math.sin(t2);

        sideVerts.push(
            0, y1, z1,   1, y1, z1,   1, y2, z2,
            0, y1, z1,   1, y2, z2,   0, y2, z2
        );
        capPosVerts.push(1, 0, 0,   1, y1, z1,   1, y2, z2);
        capNegVerts.push(0, 0, 0,   0, y2, z2,   0, y1, z1);
    }

    var sideCount   = sideVerts.length   / 3;
    var capPosCount = capPosVerts.length / 3;
    var capNegCount = capNegVerts.length / 3;

    // Pack everything into one big buffer: side, then +X cap, then -X cap.
    var combined = new Float32Array(sideVerts.length + capPosVerts.length + capNegVerts.length);
    combined.set(sideVerts, 0);
    combined.set(capPosVerts, sideVerts.length);
    combined.set(capNegVerts, sideVerts.length + capPosVerts.length);

    var glBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, combined, gl.STATIC_DRAW);

    entry = {
        glBuffer:     glBuffer,
        sideOffset:   0,
        capPosOffset: sideCount,
        capNegOffset: sideCount + capPosCount,
        sideCount:    sideCount,
        capPosCount:  capPosCount,
        capNegCount:  capNegCount
    };
    _CYL_CACHE[segments] = entry;
    return entry;
}

class Cylinder {
    constructor(segments) {
        this.type = 'cylinder';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.segments = segments || 16;
        this._geom = null;
    }

    render() {
        // Lazy-build because gl may not exist at script-load time.
        if (!this._geom || !this._geom.glBuffer) {
            this._geom = _buildCylinder(this.segments);
        }
        var geom = this._geom;
        var r = this.color[0], g = this.color[1],
            b = this.color[2], a = this.color[3];

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        gl.uniform1i(u_whichTexture, -2); // Solid color

        gl.bindBuffer(gl.ARRAY_BUFFER, geom.glBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        if (typeof a_UV !== 'undefined') gl.disableVertexAttribArray(a_UV);

        gl.uniform4f(u_FragColor, r, g, b, a);                               // side
        gl.drawArrays(gl.TRIANGLES, geom.sideOffset,   geom.sideCount);

        gl.uniform4f(u_FragColor, r * 0.8, g * 0.8, b * 0.8, a);             // +X cap
        gl.drawArrays(gl.TRIANGLES, geom.capPosOffset, geom.capPosCount);

        gl.uniform4f(u_FragColor, r * 0.7, g * 0.7, b * 0.7, a);             // -X cap
        gl.drawArrays(gl.TRIANGLES, geom.capNegOffset, geom.capNegCount);
    }
}
