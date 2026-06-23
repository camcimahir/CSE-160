// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
let VSHADER_SOURCE= `
precision mediump float;
  attribute vec2 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = vec4(a_Position, 1.0, 1.0);  //returns 
    gl_PointSize = u_Size;
  }
`

// Fragment shader program
let FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;


function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas, {preserveDrawingBuffer: true});
  console.log('Canvas:', canvas);
  console.log('GL context:', gl);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }

}

//constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const POLYGON = 3;

// Globals related to UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; 
let g_selectedSize = 10;
let g_selectedSegments = 10;
let g_selectedPolygonPoints = 4;
let g_selectedType = POINT;
let g_polygonTempPoints = [];
let g_polygonTempColor = [1.0, 1.0, 1.0, 1.0];

function addActionForHtmkUI() {

  //button events
  document.getElementById('clearbutton').onclick = function() {
    g_shapesList = [];
    g_polygonTempPoints = [];
    renderAllShapes();
  };

  document.getElementById('pointButton').onclick = function() { g_selectedType=POINT; g_polygonTempPoints = []; renderAllShapes(); };
  document.getElementById('triButton').onclick = function() {  g_selectedType=TRIANGLE; g_polygonTempPoints = []; renderAllShapes(); };
  document.getElementById('circleButton').onclick = function() { g_selectedType=CIRCLE; g_polygonTempPoints = []; renderAllShapes(); };
  document.getElementById('polygonButton').onclick = function() { g_selectedType=POLYGON; g_polygonTempPoints = []; renderAllShapes(); };
  document.getElementById('drawMyShapeButton').onclick = function() { drawMyShape(); };

  //slider events
  document.getElementById('redSlider').addEventListener('mouseup', function () {g_selectedColor[0] = this.value / 100.0;});
  document.getElementById('greenSlider').addEventListener('mouseup', function () {g_selectedColor[1] = this.value / 100.0;});
  document.getElementById('blueSlider').addEventListener('mouseup', function () {g_selectedColor[2] = this.value / 100.0;});
  
  //size slider events
  document.getElementById('sizeSlider').addEventListener('mouseup', function () {g_selectedSize = this.value;});
  document.getElementById('segmentSlider').addEventListener('mouseup', function () {g_selectedSegments = this.value;});
  document.getElementById('polygonSlider').addEventListener('mouseup', function () {g_selectedPolygonPoints = this.value; g_polygonTempPoints = []; renderAllShapes();});

}

function main() {

  setupWebGL();

  connectVariablesToGLSL();

  addActionForHtmkUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) {
    if (g_selectedType != POLYGON && ev.buttons == 1) click(ev);
  };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}


var g_shapesList = [];

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = [];   // The array to store the size of a point

function click(ev) {

  let [x, y] = convertCoordinatesEventToGL(ev);

  if (g_selectedType == POLYGON) {
    if (g_polygonTempPoints.length === 0) {
      g_polygonTempColor = g_selectedColor.slice();
    }
    g_polygonTempPoints.push([x, y]);

    if (g_polygonTempPoints.length >= g_selectedPolygonPoints) {
      let polygon = new Polygon();
      polygon.points = g_polygonTempPoints.slice();
      polygon.color = g_polygonTempColor.slice();
      polygon.size = g_selectedSize;
      g_shapesList.push(polygon);
      g_polygonTempPoints = [];
      renderAllShapes();
    } else {
      renderAllShapes();
    }
    return;
  }

  //create and store the new point
  let point;
  if (g_selectedType == POINT){
    point = new Point();
  } else if (g_selectedType == TRIANGLE){
    point = new Triangle();
  } else if (g_selectedType == CIRCLE){
    point = new Circle();
  }

  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  if (g_selectedType == CIRCLE) {
    point.segments = g_selectedSegments;
  }
  g_shapesList.push(point);

  // draw everything that is supposed to be on the canvas
  renderAllShapes();
}


function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x, y]);
}

function renderAllShapes(){
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  renderPolygonTempPoints();
}

function renderPolygonTempPoints() {
  if (g_polygonTempPoints.length === 0) {
    return;
  }

  gl.disableVertexAttribArray(a_Position);
  gl.uniform4f(
    u_FragColor,
    g_polygonTempColor[0],
    g_polygonTempColor[1],
    g_polygonTempColor[2],
    1.0
  );
  gl.uniform1f(u_Size, 10.0);

  for (var i = 0; i < g_polygonTempPoints.length; i++) {
    var p = g_polygonTempPoints[i];
    gl.vertexAttrib3f(a_Position, p[0], p[1], 0.0);
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

function makeTriangle(vertices, color) {
  var triangle = new Triangle();
  triangle.vertices = vertices;
  triangle.color = color || [0.0, 0.0, 0.0, 1.0];
  triangle.size = 1;
  return triangle;
}

function drawMyShape() {
  g_shapesList = [];
  g_polygonTempPoints = [];

  var triangles = [
    // Face as a rotated square (two equal triangles)
    makeTriangle([-0.25, 0.53, 0.00, 0.78, 0.25, 0.53], [0.62, 0.43, 0.25, 1.0]),
    makeTriangle([-0.25, 0.53, 0.00, 0.28, 0.25, 0.53], [0.50, 0.33, 0.19, 1.0]),

    // Ears (outer and inner triangles)
    makeTriangle([-0.34, 0.60, -0.23, 0.76, -0.18, 0.56], [0.50, 0.33, 0.19, 1.0]),
    makeTriangle([-0.30, 0.62, -0.23, 0.72, -0.20, 0.60], [0.88, 0.67, 0.63, 1.0]),
    makeTriangle([0.34, 0.60, 0.23, 0.76, 0.18, 0.56], [0.50, 0.33, 0.19, 1.0]),
    makeTriangle([0.30, 0.62, 0.23, 0.72, 0.20, 0.60], [0.88, 0.67, 0.63, 1.0]),

    // Left eye (small black diamond)
    makeTriangle([-0.16, 0.56, -0.10, 0.60, -0.04, 0.56], [0.0, 0.0, 0.0, 1.0]),
    makeTriangle([-0.16, 0.56, -0.10, 0.52, -0.04, 0.56], [0.0, 0.0, 0.0, 1.0]),

    // Right eye (small black diamond)
    makeTriangle([0.04, 0.56, 0.10, 0.60, 0.16, 0.56], [0.0, 0.0, 0.0, 1.0]),
    makeTriangle([0.04, 0.56, 0.10, 0.52, 0.16, 0.56], [0.0, 0.0, 0.0, 1.0]),

    // Mouth inside the lower face triangle
    makeTriangle([-0.08, 0.43, 0.08, 0.43, 0.00, 0.35], [0.0, 0.0, 0.0, 1.0]),

    // Body forming a central M-like shape
    makeTriangle([0.00, 0.28, 0.00, -0.22, -0.30, -0.22], [0.50, 0.33, 0.19, 1.0]),
    makeTriangle([0.00, 0.28, 0.00, -0.22, 0.30, -0.22], [0.50, 0.33, 0.19, 1.0]),
    makeTriangle([-0.15, 0.06, 0.00, -0.19, 0.15, 0.06], [0.78, 0.62, 0.44, 1.0]),

    // Arms
    makeTriangle([-0.02, 0.10, -0.64, 0.01, -0.08, 0.18], [0.50, 0.33, 0.19, 1.0]),
    makeTriangle([-0.62, 0.01, -0.77, 0.07, -0.70, -0.08], [0.50, 0.33, 0.19, 1.0]),
    makeTriangle([-0.75, 0.05, -0.72, 0.00, -0.89, -0.01], [0.78, 0.62, 0.44, 1.0]),
    makeTriangle([-0.73, -0.01, -0.70, -0.06, -0.88, -0.07], [0.78, 0.62, 0.44, 1.0]),
    makeTriangle([0.02, 0.10, 0.64, 0.01, 0.08, 0.18], [0.50, 0.33, 0.19, 1.0]),
    makeTriangle([0.62, 0.01, 0.77, 0.07, 0.70, -0.08], [0.50, 0.33, 0.19, 1.0]),
    makeTriangle([0.75, 0.05, 0.72, 0.00, 0.89, -0.01], [0.78, 0.62, 0.44, 1.0]),
    makeTriangle([0.73, -0.01, 0.70, -0.06, 0.88, -0.07], [0.78, 0.62, 0.44, 1.0]),

    // Legs as a blocky M shape
    makeTriangle([-0.30, -0.74, -0.14, -0.74, -0.22, -0.60], [0.10, 0.58, 0.90, 1.0]),
    makeTriangle([0.14, -0.74, 0.30, -0.74, 0.22, -0.60], [0.10, 0.58, 0.90, 1.0]),
    makeTriangle([-0.30, -0.74, -0.30, -0.18, -0.18, -0.60], [0.06, 0.44, 0.78, 1.0]),
    makeTriangle([0.30, -0.74, 0.30, -0.18, 0.18, -0.60], [0.06, 0.44, 0.78, 1.0]),
    makeTriangle([-0.30, -0.18, 0.00, -0.66, -0.16, -0.20], [0.40, 0.83, 1.00, 1.0]),
    makeTriangle([0.30, -0.18, 0.00, -0.66, 0.16, -0.20], [0.40, 0.83, 1.00, 1.0]),

    // Separate right-side C shape from the reference sketch
    makeTriangle([0.44, -0.24, 0.74, -0.20, 0.72, -0.26], [1.00, 0.36, 0.30, 1.0]),
    makeTriangle([0.44, -0.24, 0.44, -0.58, 0.58, -0.41], [0.92, 0.24, 0.18, 1.0]),
    makeTriangle([0.44, -0.58, 0.72, -0.62, 0.70, -0.69], [1.00, 0.54, 0.40, 1.0])
  ];

  for (var i = 0; i < triangles.length; i++) {
    g_shapesList.push(triangles[i]);
  }

  renderAllShapes();
}
