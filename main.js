// Isaac Ochoa Garriga - u1978919
// 21/10/2024
// Informàtica gràfica

var gl, program;
var idMyColor, idMySize;
var N_POINTS = 100;

var show = false;
var radiusPercept = Boid.PERCEPT_AREA;
var maxVel = Boid.MAX_VEL;
var maxAccel = Boid.MAX_ACCEL;
var alignMult = Boid.ALIGNMENT;
var sepMult = Boid.SEPARATION;
var coheMult = Boid.COHESION;
var steerAwayWalls = Boid.STEER_AWAY_WALLS;

let myBoids = new Boids(N_POINTS);


function getRotationMatrix(angle) {
}

function getWebGLContext() {
  var canvas = document.getElementById("myCanvas");
  try {
    return canvas.getContext("webgl2");
  } catch(e) {}
  return null;
}

function initShaders() {
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, document.getElementById("myVertexShader").text);
  gl.compileShader(vertexShader);
  
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, document.getElementById("myFragmentShader").text);
  gl.compileShader(fragmentShader);
  
  program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  
  gl.linkProgram(program);
  
  gl.useProgram(program);
  
  program.vertexPositionAttribute = gl.getAttribLocation( program, "VertexPosition");
  gl.enableVertexAttribArray(program.vertexPositionAttribute);
  
  idMyColor = gl.getUniformLocation (program, "myColor" );
  idMySize = gl.getUniformLocation (program, "mySize" );
}

function initBuffers(model) {
  model.idBufferVertices = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.DYNAMIC_DRAW);

  // Bind the indices buffer
  model.idBufferIndices = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);
}

function initRendering() {
  gl.clearColor(0.15, 0.15, 0.15, 1.0);
}

function transformTriangle(position, velocity) {
  let angle = Math.atan2(velocity[1], velocity[0]); // Calculate the direction angle from velocity

  
  let rotationMatrix = [ Math.cos(angle), -Math.sin(angle), 0.0,
                         Math.sin(angle),  Math.cos(angle), 0.0,
                         0.0,              0.0,             1.0
                       ];

  // Translate and rotate the unit triangle for this entity
  let transformedVertices = [];

  for (let i = 0; i < Boid.boidModel.length; i += 3) {
    // Apply rotation
    let x = Boid.boidModel[i];
    let y = Boid.boidModel[i + 1];

    let rotatedX = rotationMatrix[0] * x + rotationMatrix[1] * y;
    let rotatedY = rotationMatrix[3] * x + rotationMatrix[4] * y;

    // Translate to the entity's current position
    transformedVertices.push(rotatedX + position[0], rotatedY + position[1], 0.0);
  }
  return transformedVertices;
}

function drawTriangles(model) {
  for (let i = 0; i < model.points.length; i += 3) {
    // Get the current position of the entity
    let position = [model.points[i], model.points[i + 1], model.points[i + 2]];
    let velocity = [model.velocities[i], model.velocities[i + 1], model.velocities[i + 2]];

    // Get the transformed vertices of the triangle
    let transformedVertices = transformTriangle(position, velocity);

    // Bind and upload the triangle vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, model.idBufferVertices);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(transformedVertices), gl.DYNAMIC_DRAW);
    
    // Set the color for the triangle
    gl.uniform4f(idMyColor, 1.0, 1.0, 1.0, 1.0); // White color
    
    // Draw the triangle (as GL_TRIANGLES)
    gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3); // 3 vertices per triangle
  }
}

function generateCircleVertices(center, radius, numSegments) {
  let circleVertices = [];

  for (let i = 0; i <= numSegments; i++) {
    let x = center[0] + radius * Math.cos((i / numSegments) * 2 * Math.PI); // X coordinate
    let y = center[1] + radius * Math.sin((i / numSegments) * 2 * Math.PI); // Y coordinate

    circleVertices.push(x, y, 0.0);
  }

  return circleVertices;
}

function drawCircles(model, radius, numSegments) {
  // Bind the buffer for drawing
  for (let i = 0; i < model.points.length; i += 3) {
    let center = [model.points[i], model.points[i + 1]];

    // Generate vertices for the circle
    let circleVertices = generateCircleVertices(center, radius, numSegments);

    // Create a buffer for the circle's vertices
    let circleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices), gl.STATIC_DRAW);

    // Enable and set up the vertex attributes for the circle
    gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.vertexPositionAttribute);

    // Set the transparent color (RGBA: red with alpha 0.2)
    gl.uniform4f(idMyColor, 1.0, 0.0, 0.0, 0.2); 

    // Draw the circle outline
    gl.drawArrays(gl.LINE_LOOP, 0, numSegments);
  }
}

function generateVelocityLineVertices(position, velocity, scale = 1.0) {
  let startX = position[0];
  let startY = position[1];
  
  // Scale the velocity to control the length of the line
  let endX = position[0] + velocity[0] * scale;
  let endY = position[1] + velocity[1] * scale;

  // Return the two points of the line (start and end)
  return [
    startX, startY, 0.0,   // Start point (entity's position)
    endX, endY, 0.0        // End point (position + velocity)
  ];
}

function drawVectors(model, scale) {
  for (let i = 0; i < model.points.length; i += 3) {
    let position = [model.points[i], model.points[i + 1]];
    let acceleration = [model.accelerations[i], model.accelerations[i + 1]];
    
    // Generate the two vertices (start and end of the line)
    let lineVertices = generateVelocityLineVertices(position, acceleration, scale);
    
    // Create a buffer for the line's vertices
    let lineBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW);
    
    // Enable and set up the vertex attributes for the line
    gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.vertexPositionAttribute);
    
    gl.uniform4f(idMyColor, 1.0, 0.0, 1.0, 1.0);
    
    // Draw the line
    gl.drawArrays(gl.LINES, 0, 2);  // 2 points per line (start and end)
  }
}


function drawScene() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  let boidsModel = myBoids.tickBoids(maxSpeed=maxVel, maxAccel=maxAccel, radius=radiusPercept, steerAwayFromWallsMult=steerAwayWalls,
                                alignMult=alignMult, separationMult=sepMult, cohesionMult=coheMult);

  drawTriangles(boidsModel);

  if (show) {
    drawCircles(boidsModel, radiusPercept, 50);
    drawVectors(boidsModel, 100);
  }
  
  requestAnimationFrame(drawScene); // Continue the animation loop
}

function initWebGL() {
  gl = getWebGLContext();
  if (!gl) {
    alert("WebGL 2.0 no está disponible");
    return;
  }
  initShaders();
  initBuffers(myBoids.updateModel());  // Initialize buffers for the starting model
  gl.clearColor(0.15, 0.15, 0.15, 1.0)
  
  requestAnimationFrame(drawScene);
}




window.addEventListener("DOMContentLoaded", (event) => {
  let showToggle = document.getElementById("showToggle");
  showToggle.innerHTML = "OFF";
  showToggle.style.background = "LightGray";
  if (showToggle) {
    showToggle.addEventListener('click', function() {
      // Toggle the state
      show = !show;

      if (show) {
        showToggle.innerHTML = "ON";
        showToggle.style.backgroundColor = "Gray";
      } else {
        showToggle.innerHTML = "OFF";
        showToggle.style.backgroundColor = "LightGray";
      }
    });
  }

  let radiusSlider = document.getElementById("radius");
  radiusSlider.value = radiusPercept*250;
  if (radiusSlider) {
    
    radiusPercept = radiusSlider.value/250;

    radiusSlider.oninput = function() {
      radiusPercept = this.value/250;
      console.log("Perception Radius:", radiusPercept);
    };
  }

  let alignmentSlider = document.getElementById("alignment");
  alignmentSlider.value = alignMult*10000;
  if (alignmentSlider) {
    
    alignMult = alignmentSlider.value/10000;

    alignmentSlider.oninput = function() {
      alignMult = this.value/10000;
      console.log("AlignMult:", alignMult);
    };
  }

  let separationSlider = document.getElementById("separation");
  separationSlider.value = sepMult*5000;
  if (separationSlider) {
    
    sepMult = separationSlider.value/5000;

    separationSlider.oninput = function() {
      sepMult = this.value/5000;
      console.log("SeparationMult:", sepMult);
    };
  }

  let cohesionSlider = document.getElementById("cohesion");
  cohesionSlider.value = coheMult*2000;
  if (cohesionSlider) {
    
    coheMult = cohesionSlider.value/2000;

    cohesionSlider.oninput = function() {
      coheMult = this.value/2000;
      console.log("CohesionMult:", coheMult);
    };
  }
});


initWebGL();