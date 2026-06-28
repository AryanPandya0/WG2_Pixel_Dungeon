const Particles = {
    spawn(x, y, color = '#ffffff') {
        Engine.particles.push(new Particle(x, y, color));
    },
    spawnText(x, y, text, color = '#ffffff') {
        Engine.particles.push(new TextParticle(x, y, text, color));
    }
};

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 150 + 50;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.color = color;
        this.life = 1.0;
        this.dead = false;
        this.size = Math.random() * 3 + 2;
    }
    
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= 0.9;
        this.vy *= 0.9;
        this.life -= dt * 2.0;
        if (this.life <= 0) {
            this.dead = true;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class TextParticle {
    constructor(x, y, text, color) {
        this.x = x + (Math.random() * 20 - 10);
        this.y = y + (Math.random() * 20 - 10);
        this.text = typeof text === 'number' ? Math.ceil(text).toString() : text;
        this.color = color;
        this.vy = -(Math.random() * 50 + 50);
        this.vx = (Math.random() * 20 - 10);
        this.life = 1.0;
        this.dead = false;
    }
    
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy *= 0.95;
        this.life -= dt;
        if (this.life <= 0) {
            this.dead = true;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, this.x, this.y);
        
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        
        ctx.restore();
    }
}
