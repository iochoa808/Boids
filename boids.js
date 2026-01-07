// Isaac Ochoa Garriga - u1978919
// 21/10/2024
// Informàtica gràfica

class Vector { // accedir a element[0] i [1]
  x;
  y;
  constructor(x=0, y=0) {
    this.x = x;
    this.y = y;
  }

  static getDistance(vect1, vect2) {
    return Math.sqrt(Math.pow(vect1.x-vect2.x, 2) + Math.pow(vect2.y-vect2.y, 2));
  }

  static rotateVector(vec, angle) {
    let cosA = Math.cos(angle);
    let sinA = Math.sin(angle);
  
    return Vector(vec.x*cosA - vec.y*sinA, 
                  vec.x*sinA + vec.y*cosA);
  }

  static calcAvg2DVectors(vecArray) {
    let total = new Vector(0, 0);
    for (vec in vecArray) {
      total.add(vec);
    }
    return total / vecArray.length
  }

  add(vect2) {
    this.x += vect2.x;
    this.y += vect2.y;
  }

  substract(vect2) {
    this.x -= vect2.x;
    this.y -= vect2.y;
  }

  multiply(vect2) {
    this.x *= vect2.x;
    this.y *= vect2.y;
  }

  divide(vect2) {
    this.x /= vect2.x;
    this.y /= vect2.y;
  }

  length() {
    return Math.sqrt(this.x*this.x + this.y*this.y);
  }

  getUnitVect() {
    return new Vector(this.x/this.length(), this.y/this.length());
  }

  
}

// Algorisme the boid adaptat de: https://editor.p5js.org/codingtrain/sketches/ry4XZ8OkN
class Boid {
  
  position;
  velocity;
  acceleration;

  static boidModel = [
    0.018, 0.0, 0.0,
    -0.018, -0.009, 0.0,
    -0.018, 0.009, 0.0
  ];

  static PERCEPT_AREA = 0.2;
  static MAX_VEL = 0.05;
  static MAX_ACCEL = 0.15;

  static ALIGNMENT = 0.005;
  static SEPARATION = 0.01;
  static COHESION = 0.025;
  static STEER_AWAY_WALLS = 0.03;

  constructor(rand, position=new Vector(), velocity=new Vector(), maxSpeed=Boid.MAX_VEL, maxAccel=Boid.MAX_ACCEL, radius=Boid.PERCEPT_AREA,
              steerAwayFromWallsMult=Boid.STEER_AWAY_WALLS, alignMult=Boid.ALIGNMENT, separationMult=Boid.SEPARATION, cohesionMult=Boid.COHESION) {
    this.acceleration = new Vector();
    this.maxSpeed = maxSpeed;
    this.maxAccel = maxAccel;

    this.steerAwayFromWallsMult = steerAwayFromWallsMult;
    this.alignMult = alignMult;
    this.separationMult = separationMult;
    this.cohesionMult = cohesionMult;
    this.radius = radius;
    
    if (rand) {
      this.position = new Vector((Math.random() * 2) - 1, (Math.random() * 2) - 1);
      this.velocity = new Vector((Math.random() * this.maxSpeed) - this.maxSpeed/2,
                                 (Math.random() * this.maxSpeed) - this.maxSpeed/2);
    } else {
      this.position = position;
      this.velocity = velocity;
    }
  }

  getPosition() {
    return new Vector(this.position.x, this.position.y);
  }
  getVelocity() {
    return this.velocity;
  }
  getAcceleration() {
    return this.acceleration;
  }

  // Function to get all entities within a certain radius from the given entity
  getNearbyEntities(others) {
    let nearbyEntities = [];
    for (let i = 0; i < others.length; i++) {
      
      if (!Object.is(this, others[i])) {
        let distance = Vector.getDistance(this.position, others[i].position)
      
        // If the entity is within the radius, add it to the list
        if (distance <= this.radius)
          nearbyEntities.push(others[i]);
      }
    }  
    return nearbyEntities;
  }

  steerAwayFromWalls() {

    let steering = new Vector();
    const mult = 0.5;
    const boundaryMargin = 0.85;

    
    // Check right wall
    if (this.position.x > boundaryMargin) 
      steering.add(new Vector(-this.position.x*this.position.x, 0));
    // Check left wall
    else if (this.position.x < -boundaryMargin) 
      steering.add(new Vector(this.position.x*this.position.x, 0));

    // Check top wall
    if (this.position.y > boundaryMargin)
      steering.add(new Vector(0, -this.position.y*this.position.y));
    // Check bottom wall
    else if (this.position.y < -boundaryMargin)
      steering.add(new Vector(0, this.position.y*this.position.y));

    if (steering.length() != 0) {
      // Always go at max speed
      steering = steering.getUnitVect()
      steering.multiply(new Vector(this.maxSpeed, this.maxSpeed));
      
      // Steering is the vector towards the desired direction
      steering.substract(this.velocity);

      // Don't change direction too fast
      if (steering.length() > this.maxAccel) {
        steering = steering.getUnitVect()
        steering.multiply(new Vector(this.maxAccel, this.maxAccel));
      }
    }
    steering.multiply(new Vector(this.steerAwayFromWallsMult, this.steerAwayFromWallsMult));
    return steering;
  }



  align(nearbyBoids) {
    let steering = new Vector();
    let total = 0;
    // Iterate over every boid nearby
    for (let other of nearbyBoids) {
      let distance = Vector.getDistance(this.position, other.position);
      // If its not me and I'm within the radius
      if (other != this && distance < this.radius) {
        steering.add(other.velocity);
        total++;
      }
    }
    if (total > 0) {
      // Get average of the directions
      steering.divide(new Vector(total, total));
      
      // Always go at max speed
      steering = steering.getUnitVect()
      steering.multiply(new Vector(this.maxSpeed, this.maxSpeed));
      
      // Steering is the vector towards the desired direction
      steering.substract(this.velocity);

      // Don't change direction too fast
      if (steering.length() > this.maxAccel) {
        steering = steering.getUnitVect()
        steering.multiply(new Vector(this.maxAccel, this.maxAccel));
      }
    }
    // Multiplying the vector by the strenght given by the parameter
    steering.multiply(new Vector(this.alignMult, this.alignMult));
    return steering;
  }

  separation(nearbyBoids) {
    let steering = new Vector();
    let total = 0;
    // Iterate over every boid nearby
    for (let other of nearbyBoids) {
      let distance = Vector.getDistance(this.position, other.position);
      // If its not me and I'm within the radius
      if (other != this && distance < this.radius) {
        let diff = new Vector(this.position.x, this.position.y)
        diff.substract(other.position);

        diff.divide(new Vector(distance*distance, distance*distance));
        steering.add(diff);
        total++;
      }
    }
    if (total > 0) {
      steering.divide(new Vector(total, total));

      // Always go at max speed
      steering = steering.getUnitVect()
      steering.multiply(new Vector(this.maxSpeed, this.maxSpeed));

      // Steering is the vector towards the desired direction
      steering.substract(this.velocity);

      // Don't change direction too fast
      if (steering.length() > this.maxAccel) {
        steering = steering.getUnitVect()
        steering.multiply(new Vector(this.maxAccel, this.maxAccel));
      }
    }
    // Multiplying the vector by the strenght given by the parameter
    steering.multiply(new Vector(this.separationMult, this.separationMult));
    return steering;
  }

  cohesion(nearbyBoids) {
    let steering = new Vector();
    let total = 0;
    // Iterate over every boid nearby
    for (let other of nearbyBoids) {
      let distance = new Vector(Vector.getDistance(this.position, other.position));
      // If its not me and I'm within the radius
      if (other != this && distance < this.radius) {
        steering.add(other.position);
        total++;
      }
    }
    if (total > 0) {
      // Get average of the position
      steering.divide(new Vector(total, total));
      steering.substract(this.position);

      // Always go at max speed
      steering = steering.getUnitVect()
      steering.multiply(new Vector(this.maxSpeed, this.maxSpeed));

      // Steering is the vector towards the desired direction
      steering.substract(this.velocity);

      // Don't go too fast
      if (steering.length() > this.maxAccel) {
        steering = steering.getUnitVect()
        steering.multiply(new Vector(this.maxAccel, this.maxAccel));
      }
    }
    // Multiplying the vector by the strenght given by the parameter
    steering.multiply(new Vector(this.cohesionMult, this.cohesionMult));
    return steering;
  }
  

  moveBoid(nearbyBoids, maxSpeed, maxAccel, radius, steerAwayFromWallsMult, alignMult, separationMult, cohesionMult) {
    
    // Restart acceleration vector
    this.acceleration = new Vector();

    // This can be changed with the sliders in main
    this.maxSpeed = maxSpeed;
    this.maxAccel = maxAccel;
    this.radius = radius;
    this.steerAwayFromWallsMult = steerAwayFromWallsMult;
    this.alignMult = alignMult;
    this.separationMult = separationMult;
    this.cohesionMult = cohesionMult;

    // Adding every factor to the acceleration
    this.acceleration.add(this.align(nearbyBoids));
    this.acceleration.add(this.separation(nearbyBoids));
    this.acceleration.add(this.cohesion(nearbyBoids));
    this.acceleration.add(this.steerAwayFromWalls());

    // Calculate new velocity and new position
    this.position.add(this.velocity);
    this.velocity.add(this.acceleration);

    // Limit velocity
    if (this.velocity.length() > this.maxSpeed) {
      this.velocity = this.velocity.getUnitVect()
      this.velocity.multiply(new Vector(this.maxSpeed, this.maxSpeed));
    }
    
    // If boid is out of bounds negate velocity so it comes back
    if      (this.position.x > 1.1 || this.position.x < -1.1) this.position.x *= -1;
    else if (this.position.y > 1.1 || this.position.y < -1.1) this.position.y *= -1;
    
    return this.acceleration;
  }
}

class Boids {
  boids = [];
  n;
  boidsModel = {
    points: [],
    velocities: [],
    accelerations: [],
    indices: [],
  };

  constructor(n=20) {
    this.n = n;

    for (let i = 0; i < n; i++) {
      this.boids.push(new Boid(true));
    }
  }


  tickBoids(maxSpeed=Boid.MAX_VEL, maxAccel=Boid.MAX_ACCEL, radius=Boid.PERCEPT_AREA, steerAwayFromWallsMult=Boid.STEER_AWAY_WALLS,
        alignMult=Boid.ALIGNMENT, separationMult=Boid.SEPARATION, cohesionMult=Boid.COHESION) {
    
    for (let entity of this.boids) {
      let nearby = entity.getNearbyEntities(this.boids, radius);
      entity.moveBoid(nearby, maxSpeed, maxAccel, radius, steerAwayFromWallsMult, alignMult, separationMult, cohesionMult);
    }
    
    return this.updateModel();
  }

  updateModel() {

    this.boidsModel.points = [];
    this.boidsModel.velocities = [];
    this.boidsModel.accelerations = [];
    this.boidsModel.indices = [];

    for (let i = 0; i < this.n; i++) {
      this.boidsModel.points.push(this.boids[i].position.x, this.boids[i].getPosition().y, 0.0);
      this.boidsModel.velocities.push(this.boids[i].getVelocity().x, this.boids[i].getVelocity().y, 0.0);
      this.boidsModel.accelerations.push(this.boids[i].getAcceleration().x, this.boids[i].getAcceleration().y, 0.0);
      this.boidsModel.indices.push(i);
    }
    return this.boidsModel;
  }

}