class Entity {
    constructor(x, y, width, height, maxHp) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = width;
        this.height = height;
        this.radius = width / 2; // for simple circular collision
        
        this.hp = maxHp;
        this.maxHp = maxHp;
        this.dead = false;
        
        this.speed = 100;
        this.faction = 'neutral'; // 'player', 'enemy'
    }
    
    takeDamage(amount, sourceX, sourceY) {
        if (this.dead) return;
        this.hp -= amount;
        
        // Simple knockback
        if (sourceX !== undefined && sourceY !== undefined) {
            let dx = this.x - sourceX;
            let dy = this.y - sourceY;
            let mag = Math.hypot(dx, dy) || 1;
            this.vx += (dx / mag) * 300;
            this.vy += (dy / mag) * 300;
        }
        
        // Particle effect
        for(let i=0; i<5; i++) {
            Particles.spawn(this.x, this.y, '#ff4444');
        }
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }
    
    die() {
        this.dead = true;
        for(let i=0; i<15; i++) {
            Particles.spawn(this.x, this.y, '#aa0000');
        }
    }
    
    update(dt) {
        // Friction
        this.vx *= 0.85;
        this.vy *= 0.85;
        
        let targetX = this.x + this.vx * dt;
        let targetY = this.y + this.vy * dt;
        
        // Very basic wall collision
        if (!Level.checkCollision(targetX, this.y, this.radius)) {
            this.x = targetX;
        } else {
            this.vx = 0;
        }
        
        if (!Level.checkCollision(this.x, targetY, this.radius)) {
            this.y = targetY;
        } else {
            this.vy = 0;
        }
    }
    
    draw(ctx) {
        // Fallback drawing if not overridden
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
