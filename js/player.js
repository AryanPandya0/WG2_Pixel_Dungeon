class PlayerEntity extends Entity {
    constructor(x, y) {
        super(x, y, 32, 32, 100);
        this.faction = 'player';
        this.speed = 250;
        this.attackCooldown = 0;
        this.active = true;
    }
    
    update(dt) {
        if (!this.active || this.dead) return;
        
        let moveX = 0;
        let moveY = 0;
        
        if (Input.isDown('KeyW') || Input.isDown('ArrowUp')) moveY -= 1;
        if (Input.isDown('KeyS') || Input.isDown('ArrowDown')) moveY += 1;
        if (Input.isDown('KeyA') || Input.isDown('ArrowLeft')) moveX -= 1;
        if (Input.isDown('KeyD') || Input.isDown('ArrowRight')) moveX += 1;
        
        // Normalize movement
        if (moveX !== 0 && moveY !== 0) {
            let mag = Math.hypot(moveX, moveY);
            moveX /= mag;
            moveY /= mag;
        }
        
        this.vx += moveX * this.speed * dt * 30; // Accel
        this.vy += moveY * this.speed * dt * 30;
        
        // Custom friction for player
        this.vx *= 0.8;
        this.vy *= 0.8;
        
        // Base update for position changes & collision
        super.update(dt);
        
        // Attack logic
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }
        
        if (Input.mouse.down && this.attackCooldown <= 0) {
            this.attack();
        }
        
        // Update UI
        let hb = document.getElementById('health-bar');
        if (hb) {
            let pct = Math.max(0, (this.hp / this.maxHp) * 100);
            hb.style.width = pct + '%';
        }
    }
    
    attack() {
        this.attackCooldown = 0.25; // 4 attacks per sec
        
        // Calculate attack angle based on mouse position relative to center of screen (which is player)
        let dx = Input.mouse.x - window.innerWidth / 2;
        let dy = Input.mouse.y - window.innerHeight / 2;
        let angle = Math.atan2(dy, dx);
        
        // Spawn projectile
        Engine.projectiles.push(new Projectile(this.x, this.y, angle, this.faction));
        Engine.addShake(2);
    }
    
    die() {
        super.die();
        this.active = false;
        Engine.state = 'GAMEOVER';
        document.getElementById('game-over').classList.remove('hidden');
    }
    
    draw(ctx) {
        if (this.dead) return;
        ctx.save();
        
        let dx = Input.mouse.x - window.innerWidth / 2;
        
        ctx.translate(this.x, this.y);
        if (dx < 0) {
            ctx.scale(-1, 1);
        }
        
        let img = Assets.get('player');
        if (img) {
            ctx.drawImage(img, -this.width/2, -this.height/2, this.width, this.height);
        }
        
        ctx.restore();
    }
}

class Projectile {
    constructor(x, y, angle, faction) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * 600;
        this.vy = Math.sin(angle) * 600;
        this.faction = faction;
        this.radius = 5;
        this.damage = 25;
        this.dead = false;
        this.life = 2.0;
    }
    
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        
        if (this.life <= 0 || Level.checkCollision(this.x, this.y, this.radius)) {
            this.dead = true;
            for(let i=0; i<3; i++) Particles.spawn(this.x, this.y, '#00ffff');
            return;
        }
        
        // Trail particle
        if (Math.random() < 0.5) {
            Particles.spawn(this.x, this.y, '#00aaaa');
        }
        
        // Entity collision
        for (let e of Engine.entities) {
            if (e.faction !== this.faction && !e.dead) {
                let dist = Math.hypot(this.x - e.x, this.y - e.y);
                if (dist < this.radius + e.radius) {
                    e.takeDamage(this.damage, this.x, this.y);
                    this.dead = true;
                    for(let i=0; i<5; i++) Particles.spawn(this.x, this.y, '#00ffff');
                    break;
                }
            }
        }
        
        // Player collision
        if (this.faction !== 'player' && Player && !Player.dead) {
            let dist = Math.hypot(this.x - Player.x, this.y - Player.y);
            if (dist < this.radius + Player.radius) {
                Player.takeDamage(this.damage, this.x, this.y);
                this.dead = true;
                Engine.addShake(5);
            }
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.faction === 'player' ? '#00ffff' : '#ff00ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

window.Player = null;
