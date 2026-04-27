// ColoredPoint.js (c) 2012 matsuda
let VSHADER_SOURCE= `
precision mediump float;
  attribute vec4 a_Position;
  uniform float u_Size;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    gl_PointSize = u_Size;
  }
`

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
let u_ModelMatrix;
let u_GlobalRotateMatrix;


function setupWebGL() {
  canvas = document.getElementById('webgl');

  gl = getWebGLContext(canvas);
  console.log('Canvas:', canvas);
  console.log('GL context:', gl);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

let g_globalAngle = 0;
let g_leftArmAngle = 0;
let g_leftArmFwdAngle = 0;
let g_leftForearmAngle = 0;
let g_rightArmAngle = 0;
let g_rightArmFwdAngle = 0;
let g_rightForearmAngle = 0;
let g_leftLegAngle = 0;
let g_leftShinAngle = 0;
let g_leftLegOutAngle = 0;
let g_rightLegAngle = 0;
let g_rightShinAngle = 0;
let g_rightLegOutAngle = 0;
let g_leftWristAngle = 0;
let g_rightWristAngle = 0;
let g_leftAnkleAngle = 0;
let g_rightAnkleAngle = 0;
let g_bodyOffsetY = 0;
let g_globalAngleX = 0;
let g_bodySpinY = 0;
let g_renderRequested = false;
let g_climbingAnimation = false;
let g_pokeActive = false;
let g_pokeStart = 0;

function requestRenderAllShapes() {
  g_renderRequested = true;
}

function addActionForHtmlUI() {

  document.getElementById('animationYellowOnButton').addEventListener('click', function () { g_climbingAnimation = true; });
  document.getElementById('animationYellowOffButton').addEventListener('click', function () {
    g_climbingAnimation = false;
    g_leftArmAngle = 0;  g_leftArmFwdAngle = 0;  g_leftForearmAngle = 0;
    g_rightArmAngle = 0; g_rightArmFwdAngle = 0; g_rightForearmAngle = 0;
    g_leftLegAngle = 0;  g_leftShinAngle = 0;  g_leftLegOutAngle = 0;
    g_rightLegAngle = 0; g_rightShinAngle = 0; g_rightLegOutAngle = 0;
    g_leftWristAngle = 0; g_rightWristAngle = 0;
    g_leftAnkleAngle = 0; g_rightAnkleAngle = 0;
    g_bodyOffsetY = 0;
    var ids = ['leftArmSlider','leftForearmSlider','rightArmSlider','rightForearmSlider',
               'leftLegSlider','leftShinSlider','rightLegSlider','rightShinSlider',
               'leftWristSlider','rightWristSlider','leftAnkleSlider','rightAnkleSlider'];
    for (var i = 0; i < ids.length; i++) { document.getElementById(ids[i]).value = 0; }
    requestRenderAllShapes();
  });

  document.getElementById('angleSlider').addEventListener('input', function () { g_globalAngle = Number(this.value); requestRenderAllShapes(); });

  document.getElementById('leftArmSlider').addEventListener('input', function () { g_leftArmAngle = Number(this.value); requestRenderAllShapes(); });
  document.getElementById('leftForearmSlider').addEventListener('input', function () { g_leftForearmAngle = Number(this.value); requestRenderAllShapes(); });
  document.getElementById('rightArmSlider').addEventListener('input', function () { g_rightArmAngle = Number(this.value); requestRenderAllShapes(); });
  document.getElementById('rightForearmSlider').addEventListener('input', function () { g_rightForearmAngle = Number(this.value); requestRenderAllShapes(); });

  document.getElementById('leftLegSlider').addEventListener('input', function () { g_leftLegAngle = Number(this.value); requestRenderAllShapes(); });
  document.getElementById('leftShinSlider').addEventListener('input', function () { g_leftShinAngle = Number(this.value); requestRenderAllShapes(); });
  document.getElementById('rightLegSlider').addEventListener('input', function () { g_rightLegAngle = Number(this.value); requestRenderAllShapes(); });
  document.getElementById('rightShinSlider').addEventListener('input', function () { g_rightShinAngle = Number(this.value); requestRenderAllShapes(); });

  document.getElementById('leftWristSlider').addEventListener('input', function () { g_leftWristAngle = Number(this.value); requestRenderAllShapes(); });
  document.getElementById('rightWristSlider').addEventListener('input', function () { g_rightWristAngle = Number(this.value); requestRenderAllShapes(); });
  document.getElementById('leftAnkleSlider').addEventListener('input', function () { g_leftAnkleAngle = Number(this.value); requestRenderAllShapes(); });
  document.getElementById('rightAnkleSlider').addEventListener('input', function () { g_rightAnkleAngle = Number(this.value); requestRenderAllShapes(); });

  setupMouseControls();
}

var g_mouseDragging = false;
var g_lastMouseX = 0;
var g_lastMouseY = 0;
function setupMouseControls() {
  if (!canvas) { return; }

  canvas.addEventListener('mousedown', function (ev) {
    if (ev.button !== 0) { return; }
    if (ev.shiftKey) {
      g_pokeActive = true;
      g_pokeStart = performance.now() / 1000.0;
      requestRenderAllShapes();
      ev.preventDefault();
      return;
    }
    g_mouseDragging = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
    ev.preventDefault();
  });

  window.addEventListener('mousemove', function (ev) {
    if (!g_mouseDragging) { return; }
    var dx = ev.clientX - g_lastMouseX;
    var dy = ev.clientY - g_lastMouseY;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
    g_globalAngle  += dx * 0.5;
    g_globalAngleX += dy * 0.5;
    if (g_globalAngleX >  89) { g_globalAngleX =  89; }
    if (g_globalAngleX < -89) { g_globalAngleX = -89; }
    var slider = document.getElementById('angleSlider');
    if (slider) {
      var yaw = ((g_globalAngle + 180) % 360 + 360) % 360 - 180;
      g_globalAngle = yaw;
      slider.value = yaw;
    }
    requestRenderAllShapes();
  });

  window.addEventListener('mouseup', function () {
    g_mouseDragging = false;
  });
}

function main() {

  setupWebGL();

  connectVariablesToGLSL();

  addActionForHtmlUI();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.enable(gl.DEPTH_TEST);

  g_renderRequested = true;
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;
var g_lastRenderTime = 0;
var g_smoothedFps = 0;

function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;

  updateAnimationAngles();

  if (g_climbingAnimation || g_pokeActive || g_renderRequested) {
    g_renderRequested = false;
    renderAllShapes();
  }

  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  // Shift-click poke dance animation.
  if (g_pokeActive) {
    var pokeDuration = 4.0;
    var pt = g_seconds - g_pokeStart;
    if (pt >= pokeDuration) {
      g_pokeActive = false;
      g_bodySpinY = 0;
      g_leftArmAngle      = Number(document.getElementById('leftArmSlider').value);
      g_leftForearmAngle  = Number(document.getElementById('leftForearmSlider').value);
      g_rightArmAngle     = Number(document.getElementById('rightArmSlider').value);
      g_rightForearmAngle = Number(document.getElementById('rightForearmSlider').value);
      g_leftLegAngle      = Number(document.getElementById('leftLegSlider').value);
      g_leftShinAngle     = Number(document.getElementById('leftShinSlider').value);
      g_rightLegAngle     = Number(document.getElementById('rightLegSlider').value);
      g_rightShinAngle    = Number(document.getElementById('rightShinSlider').value);
      g_leftWristAngle    = Number(document.getElementById('leftWristSlider').value);
      g_rightWristAngle   = Number(document.getElementById('rightWristSlider').value);
      g_leftAnkleAngle    = Number(document.getElementById('leftAnkleSlider').value);
      g_rightAnkleAngle   = Number(document.getElementById('rightAnkleSlider').value);
      g_leftArmFwdAngle = 0; g_rightArmFwdAngle = 0;
      g_leftLegOutAngle = 0; g_rightLegOutAngle = 0;
      g_bodyOffsetY = 0;
    } else {
      var omega = 10.0;
      var beat  = pt * omega;
      var s     = Math.sin(beat);
      var dip   = Math.abs(s);
      var step  = Math.sin(beat * 0.5);

      g_leftArmAngle       = -15 * s;
      g_rightArmAngle      = -15 * s;
      g_leftArmFwdAngle    = 0;
      g_rightArmFwdAngle   = 0;
      g_leftForearmAngle   = 0;             
      g_rightForearmAngle  = 0;
      g_leftWristAngle     =  25 * s;      
      g_rightWristAngle    = -25 * s;      

      g_leftLegAngle       =  5 + 10 * step;   
      g_rightLegAngle      =  5 - 10 * step;
      g_leftLegOutAngle    = 0;
      g_rightLegOutAngle   = 0;
      g_leftShinAngle      = 25 + 30 * dip;    
      g_rightShinAngle     = 25 + 30 * dip;
      g_leftAnkleAngle     = 0;
      g_rightAnkleAngle    = 0;

   
      g_bodyOffsetY        = -0.05 * dip;
      g_bodySpinY          = 0;
    }
    return; 
  }

  if (g_climbingAnimation) {

    var omega = 3.6;
    var t = g_seconds * omega;
    var c = Math.cos(t);               

    g_leftArmAngle       = 90;
    g_rightArmAngle      = 90;
    g_leftArmFwdAngle    = -55 * c;
    g_rightArmFwdAngle   =  55 * c;
    g_leftForearmAngle   = 90 + 8 * c;
    g_rightForearmAngle  = 90 - 8 * c;
    g_leftWristAngle     = 0;
    g_rightWristAngle    = 0;

    g_leftLegAngle       =  45 * c;
    g_rightLegAngle      = -45 * c;
    g_leftLegOutAngle    = 0;
    g_rightLegOutAngle   = 0;
    g_leftShinAngle      = 60 + 55 * c;
    g_rightShinAngle     = 60 - 55 * c;
    g_leftAnkleAngle     =  15 * c;
    g_rightAnkleAngle    = -15 * c;

    g_bodyOffsetY        = 0.025 * Math.abs(c) - 0.012;
  }
}

var C_BODY  = [0.50, 0.40, 0.28, 1.0];
var C_HEAD  = [0.55, 0.45, 0.30, 1.0];
var C_FACE  = [0.85, 0.74, 0.58, 1.0];
var C_BELLY = [0.72, 0.60, 0.45, 1.0];
var C_EYE   = [0.10, 0.06, 0.04, 1.0];
var C_LIMB  = [0.50, 0.40, 0.28, 1.0];
var C_HAND  = [0.40, 0.30, 0.20, 1.0];
var C_CLAW  = [0.18, 0.12, 0.06, 1.0];

function renderAllShapes() {
  var startTime = performance.now();

  var globalRotMat = new Matrix4()
    .rotate(g_globalAngleX, 1, 0, 0)
    .rotate(g_globalAngle + g_bodySpinY, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var bodyFrame = new Matrix4();
  bodyFrame.translate(0, 0.10 + g_bodyOffsetY, 0);

  var body = new Cube();
  body.color = C_BODY;
  body.matrix = new Matrix4(bodyFrame);
  body.matrix.translate(-0.18, -0.275, -0.15);
  body.matrix.scale(0.36, 0.55, 0.30);
  body.render();

  var belly = new Cube();
  belly.color = C_BELLY;
  belly.matrix = new Matrix4(bodyFrame);
  belly.matrix.translate(-0.13, -0.24, -0.16);
  belly.matrix.scale(0.26, 0.45, 0.02);
  belly.render();

  var headFrame = new Matrix4(bodyFrame);
  headFrame.translate(0, 0.30, -0.02);

  var head = new Cube();
  head.color = C_HEAD;
  head.matrix = new Matrix4(headFrame);
  head.matrix.translate(-0.15, -0.04, -0.15);
  head.matrix.scale(0.30, 0.26, 0.30);
  head.render();

  var faceMask = new Cube();
  faceMask.color = C_FACE;
  faceMask.matrix = new Matrix4(headFrame);
  faceMask.matrix.translate(-0.12, -0.02, -0.16);
  faceMask.matrix.scale(0.24, 0.18, 0.02);
  faceMask.render();

  var snout = new Cube();
  snout.color = C_FACE;
  snout.matrix = new Matrix4(headFrame);
  snout.matrix.translate(-0.06, -0.09, -0.19);
  snout.matrix.scale(0.12, 0.09, 0.04);
  snout.render();

  var nose = new Cube();
  nose.color = C_EYE;
  nose.matrix = new Matrix4(headFrame);
  nose.matrix.translate(-0.035, -0.07, -0.21);
  nose.matrix.scale(0.07, 0.03, 0.02);
  nose.render();

  var leftEye = new Cube();
  leftEye.color = C_EYE;
  leftEye.matrix = new Matrix4(headFrame);
  leftEye.matrix.translate(-0.115, 0.04, -0.17);
  leftEye.matrix.scale(0.06, 0.05, 0.02);
  leftEye.render();

  var rightEye = new Cube();
  rightEye.color = C_EYE;
  rightEye.matrix = new Matrix4(headFrame);
  rightEye.matrix.translate(0.055, 0.04, -0.17);
  rightEye.matrix.scale(0.06, 0.05, 0.02);
  rightEye.render();

  var leftShoulderFrame = new Matrix4(bodyFrame);
  leftShoulderFrame.translate(-0.18, 0.18, 0);
  leftShoulderFrame.rotate(g_leftArmFwdAngle, 1, 0, 0);
  leftShoulderFrame.rotate(g_leftArmAngle, 0, 0, 1);

  var leftArm = new Cylinder(16);
  leftArm.color = C_LIMB;
  leftArm.matrix = new Matrix4(leftShoulderFrame);
  leftArm.matrix.scale(-0.30, 0.10, 0.10);
  leftArm.render();

  var leftElbowFrame = new Matrix4(leftShoulderFrame);
  leftElbowFrame.translate(-0.30, 0, 0);
  leftElbowFrame.rotate(-g_leftForearmAngle, 0, 1, 0);

  var leftForearm = new Cube();
  leftForearm.color = C_LIMB;
  leftForearm.matrix = new Matrix4(leftElbowFrame);
  leftForearm.matrix.scale(0.26, 0.08, 0.08);
  leftForearm.matrix.translate(-1, -0.5, -0.5);
  leftForearm.render();

  var leftWristFrame = new Matrix4(leftElbowFrame);
  leftWristFrame.translate(-0.26, 0, 0);
  leftWristFrame.rotate(90, 1, 0, 0);
  leftWristFrame.rotate(-g_leftWristAngle, 0, 0, 1);

  var leftPalm = new Cube();
  leftPalm.color = C_HAND;
  leftPalm.matrix = new Matrix4(leftWristFrame);
  leftPalm.matrix.scale(0.06, 0.10, 0.14);
  leftPalm.matrix.translate(-1, -0.5, -0.5);
  leftPalm.render();

  for (var ci = 0; ci < 3; ci++) {
    var claw = new Cube();
    claw.color = C_CLAW;
    claw.matrix = new Matrix4(leftWristFrame);
    claw.matrix.translate(-0.06, -0.005, (ci - 1) * 0.045);
    claw.matrix.rotate(15, 0, 0, 1);
    claw.matrix.scale(0.14, 0.022, 0.024);
    claw.matrix.translate(-1, -0.5, -0.5);
    claw.render();
  }

  var rightShoulderFrame = new Matrix4(bodyFrame);
  rightShoulderFrame.translate(0.18, 0.18, 0);
  rightShoulderFrame.rotate(g_rightArmFwdAngle, 1, 0, 0);
  rightShoulderFrame.rotate(-g_rightArmAngle, 0, 0, 1);

  var rightArm = new Cylinder(16);
  rightArm.color = C_LIMB;
  rightArm.matrix = new Matrix4(rightShoulderFrame);
  rightArm.matrix.scale(0.30, 0.10, 0.10);
  rightArm.render();


  var rightElbowFrame = new Matrix4(rightShoulderFrame);
  rightElbowFrame.translate(0.30, 0, 0);
  rightElbowFrame.rotate(g_rightForearmAngle, 0, 1, 0);

  var rightForearm = new Cube();
  rightForearm.color = C_LIMB;
  rightForearm.matrix = new Matrix4(rightElbowFrame);
  rightForearm.matrix.scale(0.26, 0.08, 0.08);
  rightForearm.matrix.translate(0, -0.5, -0.5);
  rightForearm.render();

  var rightWristFrame = new Matrix4(rightElbowFrame);
  rightWristFrame.translate(0.26, 0, 0);
  rightWristFrame.rotate(90, 1, 0, 0);
  rightWristFrame.rotate(g_rightWristAngle, 0, 0, 1);

  var rightPalm = new Cube();
  rightPalm.color = C_HAND;
  rightPalm.matrix = new Matrix4(rightWristFrame);
  rightPalm.matrix.scale(0.06, 0.10, 0.14);
  rightPalm.matrix.translate(0, -0.5, -0.5);
  rightPalm.render();

  for (var cj = 0; cj < 3; cj++) {
    var clawR = new Cube();
    clawR.color = C_CLAW;
    clawR.matrix = new Matrix4(rightWristFrame);
    clawR.matrix.translate(0.06, -0.005, (cj - 1) * 0.045);
    clawR.matrix.rotate(-15, 0, 0, 1);
    clawR.matrix.scale(0.14, 0.022, 0.024);
    clawR.matrix.translate(0, -0.5, -0.5);
    clawR.render();
  }

  var leftHipFrame = new Matrix4(bodyFrame);
  leftHipFrame.translate(-0.10, -0.275, 0);
  leftHipFrame.rotate(-g_leftLegOutAngle, 0, 0, 1);
  leftHipFrame.rotate(g_leftLegAngle, 1, 0, 0);

  var leftLeg = new Cube();
  leftLeg.color = C_LIMB;
  leftLeg.matrix = new Matrix4(leftHipFrame);
  leftLeg.matrix.scale(0.13, 0.26, 0.13);
  leftLeg.matrix.translate(-0.5, -1, -0.5);
  leftLeg.render();

  var leftKneeFrame = new Matrix4(leftHipFrame);
  leftKneeFrame.translate(0, -0.26, 0);
  leftKneeFrame.rotate(-g_leftShinAngle, 1, 0, 0);

  var leftShin = new Cube();
  leftShin.color = C_LIMB;
  leftShin.matrix = new Matrix4(leftKneeFrame);
  leftShin.matrix.scale(0.11, 0.20, 0.11);
  leftShin.matrix.translate(-0.5, -1, -0.5);
  leftShin.render();

  var leftAnkleFrame = new Matrix4(leftKneeFrame);
  leftAnkleFrame.translate(0, -0.20, 0);
  leftAnkleFrame.rotate(g_leftAnkleAngle, 1, 0, 0);

  var leftFoot = new Cube();
  leftFoot.color = C_HAND;
  leftFoot.matrix = new Matrix4(leftAnkleFrame);
  leftFoot.matrix.scale(0.12, 0.05, 0.16);
  leftFoot.matrix.translate(-0.5, -1, -0.7);
  leftFoot.render();

  for (var fi = 0; fi < 3; fi++) {
    var fclaw = new Cube();
    fclaw.color = C_CLAW;
    fclaw.matrix = new Matrix4(leftAnkleFrame);
    fclaw.matrix.translate((fi - 1) * 0.04, -0.045, -0.115);
    fclaw.matrix.rotate(-15, 1, 0, 0);
    fclaw.matrix.scale(0.024, 0.022, 0.13);
    fclaw.matrix.translate(-0.5, -0.5, -1);
    fclaw.render();
  }

  var rightHipFrame = new Matrix4(bodyFrame);
  rightHipFrame.translate(0.10, -0.275, 0);
  rightHipFrame.rotate(g_rightLegOutAngle, 0, 0, 1);
  rightHipFrame.rotate(g_rightLegAngle, 1, 0, 0);

  var rightLeg = new Cube();
  rightLeg.color = C_LIMB;
  rightLeg.matrix = new Matrix4(rightHipFrame);
  rightLeg.matrix.scale(0.13, 0.26, 0.13);
  rightLeg.matrix.translate(-0.5, -1, -0.5);
  rightLeg.render();

  var rightKneeFrame = new Matrix4(rightHipFrame);
  rightKneeFrame.translate(0, -0.26, 0);
  rightKneeFrame.rotate(-g_rightShinAngle, 1, 0, 0);

  var rightShin = new Cube();
  rightShin.color = C_LIMB;
  rightShin.matrix = new Matrix4(rightKneeFrame);
  rightShin.matrix.scale(0.11, 0.20, 0.11);
  rightShin.matrix.translate(-0.5, -1, -0.5);
  rightShin.render();

  var rightAnkleFrame = new Matrix4(rightKneeFrame);
  rightAnkleFrame.translate(0, -0.20, 0);
  rightAnkleFrame.rotate(g_rightAnkleAngle, 1, 0, 0);

  var rightFoot = new Cube();
  rightFoot.color = C_HAND;
  rightFoot.matrix = new Matrix4(rightAnkleFrame);
  rightFoot.matrix.scale(0.12, 0.05, 0.16);
  rightFoot.matrix.translate(-0.5, -1, -0.7);
  rightFoot.render();

  for (var fj = 0; fj < 3; fj++) {
    var fclawR = new Cube();
    fclawR.color = C_CLAW;
    fclawR.matrix = new Matrix4(rightAnkleFrame);
    fclawR.matrix.translate((fj - 1) * 0.04, -0.045, -0.115);
    fclawR.matrix.rotate(-15, 1, 0, 0);
    fclawR.matrix.scale(0.024, 0.022, 0.13);
    fclawR.matrix.translate(-0.5, -0.5, -1);
    fclawR.render();
  }

  var now = performance.now();
  var renderMs = now - startTime;

  // Real frame rate based on time between successive renders, not on
  // 1000/renderMs (which is just CPU draw time, not actual fps).
  if (g_lastRenderTime > 0) {
    var frameDelta = now - g_lastRenderTime;
    if (frameDelta > 0) {
      var instantFps = 1000 / frameDelta;
      g_smoothedFps = (g_smoothedFps === 0)
        ? instantFps
        : g_smoothedFps * 0.9 + instantFps * 0.1;
    }
  }
  g_lastRenderTime = now;

  sendTextToHTML(' ms: ' + renderMs.toFixed(1) + ' fps: ' + Math.round(g_smoothedFps));
}

function sendTextToHTML(text) {
  var htmlElm = document.getElementById('numdot');
  if (!htmlElm) {
    console.log('Failed to get numdot from HTML');
    return;
  }
  htmlElm.innerHTML = text;
}
