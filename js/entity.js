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
        for (let i = 0; i < 5; i++) {
            Particles.spawn(this.x, this.y, '#ff4444');
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die() {
        this.dead = true;
        for (let i = 0; i < 15; i++) {
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

class HealOrb extends Entity {
    constructor(x, y) {
        super(x, y, 12, 12, 1);
        this.faction = 'neutral';
        this.healAmount = 25;
        this.life = 15; // Despawns after 15 seconds
        
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 150 + 50;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }
    
    update(dt) {
        if (this.dead) return;
        this.life -= dt;
        if (this.life <= 0) {
            this.dead = true;
            return;
        }
        
        super.update(dt);
        
        // Magnet effect if player is close 
        if (window.Player && !Player.dead) {
            let dx = Player.x - this.x;
            let dy = Player.y - this.y;
            let dist = Math.hypot(dx, dy);
            
            if (dist < 120) {
                this.vx += (dx / dist) * 600 * dt;
                this.vy += (dy / dist) * 600 * dt;
            }
            
            if (dist < this.radius + Player.radius) {
                Player.hp = Math.min(Player.maxHp, Player.hp + this.healAmount);
                this.dead = true;
                
                // Visuals for pickup
                for (let i=0; i<15; i++) Particles.spawn(this.x, this.y, '#00ff00');
                
                // Update UI explicitly
                let hb = document.getElementById('health-bar');
                if (hb) {
                    let pct = Math.max(0, (Player.hp / Player.maxHp) * 100);
                    hb.style.width = pct + '%';
                }
            }
        }
    }
    
    draw(ctx) {
        if (this.dead) return;
        
        // Blink before disappearing
        if (this.life < 3 && Math.floor(this.life * 10) % 2 === 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.fillStyle = '#00ff00';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ff00';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw cross
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -6, 4, 12);
        ctx.fillRect(-6, -2, 12, 4);
        
        ctx.restore();
    }
}
