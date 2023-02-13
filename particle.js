/**
 * based on the Daniel Shiffman tutorial entitled The Nature Of Code 2
 * chap 4
 * https://youtube.com/playlist?list=PLRqwX-V7Uu6ZV4yEcW3uDwOgGXKUUsPOM
 */

class Particle{
    constructor(_x, _y, _id){
      this.location = createVector(_x, _y);
      this.velocity = createVector(0, 0);
      this.velocity.mult(random(0.1, 2));
      this.acceleration = createVector(0, 0);
      this.size = 5;
      this.x = _x;
      this.y = _y;
      this.a = random(255); 
      this.alphaSpeed = -0.5;
      this.id = _id;
    }
  
    displayRain(){
      this.a = map(this.location.y, 0, height, 255, 0);
      stroke(255, this.a);
      strokeWeight(2);
      line(this.location.x, this.location.y, this.location.x, this.location.y+this.size);
    }

    displaySnow(){
      noStroke();
      fill(255, this.a);
      textSize(32);
      textFont('Arial');
      text('*', this.location.x, this.location.y);
    }
  
    applyForce(force){
      this.acceleration.add(force);
    }
  
    update(){
      this.velocity.add(this.acceleration);
      this.location.add(this.velocity);
    }
  
    isDead(){
      return (this.location.y > height-100);
    }
}