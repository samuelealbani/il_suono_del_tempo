/**
 * based on the Daniel Shiffman tutorial entitled The Nature Of Code 2
 * chap 4
 * https://youtube.com/playlist?list=PLRqwX-V7Uu6ZV4yEcW3uDwOgGXKUUsPOM
 */

class Emitter {
    constructor() {
        this.rainParticles = [];
        this.snowParticles = [];
    }

    emitRain(num) {
        for (let i = 0; i < num; i++) {
            this.rainParticles.push(new Particle(random(width), -10));
        }
    }

    emitSnow(num) {
        for (let i = 0; i < num; i++) {
            this.snowParticles.push(new Particle(random(width), -1));
        }
    }

    update() {
        // these update the positions applying gravity
        for (let particle of this.rainParticles) {
            let gravity = createVector(0, 0.1);

            particle.applyForce(gravity);
            particle.update();
        }
        for (let particle of this.snowParticles) {
            let gravity = createVector(0.0000, 0.0001);

            particle.applyForce(gravity);
            particle.update();
        }

        // these delete from the arrays the dead particles
        for (let i = this.rainParticles.length - 1; i >= 0; i--) {
            if (this.rainParticles[i].isDead()) {
                this.rainParticles.splice(i, 1);
            }
        }
        for (let i = this.snowParticles.length - 1; i >= 0; i--) {
            if (this.snowParticles[i].isDead()) {
                this.snowParticles.splice(i, 1);
            }
        }
    }

    display() {
        for (let particle of this.rainParticles) {
            particle.displayRain();
        }

        for (let particle of this.snowParticles) {
            particle.displaySnow();
        }
    }
}