const BossManager = {
    active: false,
    bossInstance: null,
    
    spawn(x, y, name) {
        this.active = true;
        this.bossInstance = new Boss(x, y, name);
        Engine.entities.push(this.bossInstance);
        
        let bc = document.getElementById('boss-health-container');
        bc.classList.remove('hidden');
        document.getElementById('boss-name').innerText = name;
        
        // Setup initial UI bar
        this.updateUI();
    },
    
    update(dt) {
        if (!this.active || !this.bossInstance) return;
        
        this.updateUI();
        
        if (this.bossInstance.dead) {
            this.active = false;
            document.getElementById('boss-health-container').classList.add('hidden');
            
            // Spawn stairs
            Stairs.spawn(this.bossInstance.x, this.bossInstance.y);
            
            // Big explosion
            for(let i=0; i<50; i++) Particles.spawn(this.bossInstance.x, this.bossInstance.y, '#ffffff');
            Engine.addShake(20);
        }
    },
    
    updateUI() {
        if (!this.bossInstance) return;
        let p = Math.max(0, (this.bossInstance.hp / this.bossInstance.maxHp) * 100);
        document.getElementById('boss-health-bar').style.width = p + '%';
    }
};

class Boss extends Entity {
    constructor(x, y, name) {
        let maxHp = name === 'The Slime King' ? 500 : (name === 'The Shadow Knight' ? 800 : 1500);
        super(x, y, 64, 64, maxHp);
        this.name = name;
        this.faction = 'enemy';
        this.speed = 50; 
        this.radius = 40;
        
        this.stateTimer = 0;
        this.attackPhase = 0;
        this.attackTimer = 0;
    }
    
    update(dt) {
        if (this.dead) return;
        
        let dx = Player.x - this.x;
        let dy = Player.y - this.y;
        let dist = Math.hypot(dx, dy);
        let angleToPlayer = Math.atan2(dy, dx);
        
        // General logic based on Boss Name
        if (this.name === 'The Slime King') {
            this.slimeLogic(dt, angleToPlayer, dist);
        } else if (this.name === 'The Shadow Knight') {
            this.knightLogic(dt, angleToPlayer, dist);
        } else if (this.name === 'The Necromancer') {
            this.necroLogic(dt, angleToPlayer, dist);
        }
        
        // Entity interactions
        for (let e of Engine.entities) {
            if (e !== this && !e.dead) {
                let edx = this.x - e.x;
                let edy = this.y - e.y;
                let edist = Math.hypot(edx, edy);
                if (edist < this.radius + e.radius) {
                    let overlap = (this.radius + e.radius) - edist;
                    let angle = Math.atan2(edy, edx);
                    
                    // Boss pushes everything easily
                    // Only move the other entity if it won't hit a wall
                    let ex = e.x - Math.cos(angle) * overlap * 0.8;
                    let ey = e.y - Math.sin(angle) * overlap * 0.8;
                    
                    if (!Level.checkCollision(ex, e.y, e.radius)) e.x = ex;
                    if (!Level.checkCollision(e.x, ey, e.radius)) e.y = ey;
                }
            }
        }
        
        super.update(dt);
        
        // Melee damage to player
        if (dist < this.radius + Player.radius + 10) {
            Player.takeDamage(20 * dt, this.x, this.y);
        }
    }
    
    slimeLogic(dt, angle, dist) {
        this.stateTimer += dt;
        this.attackTimer -= dt;
        
        // Moves slowly, every 3 seconds it jumps
        if (this.stateTimer > 3.0) {
            this.stateTimer = 0;
            // Jump
            this.vx += Math.cos(angle) * 800;
            this.vy += Math.sin(angle) * 800;
            Engine.addShake(5);
            
            // Shoot 8 ways
            for(let i=0; i<8; i++) {
                let a = (i/8) * Math.PI * 2;
                Engine.projectiles.push(new Projectile(this.x, this.y, a, this.faction));
            }
        }
    }
    
    knightLogic(dt, angle, dist) {
        this.stateTimer += dt;
        this.attackTimer -= dt;
        
        // Chase player
        if (dist > this.radius + Player.radius) {
            this.vx += Math.cos(angle) * this.speed * 2 * dt;
            this.vy += Math.sin(angle) * this.speed * 2 * dt;
        }
        
        // Attack
        if (this.attackTimer <= 0 && dist < 200) {
            this.attackTimer = 1.5;
            // Charge attack
            this.vx += Math.cos(angle) * 1200;
            this.vy += Math.sin(angle) * 1200;
        }
    }
    
    necroLogic(dt, angle, dist) {
        this.stateTimer += dt;
        this.attackTimer -= dt;
        
        // Tries to keep distance
        if (dist < 300) {
            this.vx -= Math.cos(angle) * this.speed * dt * 20;
            this.vy -= Math.sin(angle) * this.speed * dt * 20;
        } else if (dist > 400) {
            this.vx += Math.cos(angle) * this.speed * dt * 20;
            this.vy += Math.sin(angle) * this.speed * dt * 20;
        }
        
        if (this.attackTimer <= 0) {
            this.attackTimer = 2.0;
            
            // Summon Skeletons or shoot
            if (Math.random() < 0.5) {
                // Shoot 3 spread
                for(let i=-1; i<=1; i++) {
                    let a = angle + i * 0.2;
                    let p = new Projectile(this.x, this.y, a, this.faction);
                    p.damage = 15;
                    p.radius = 8;
                    Engine.projectiles.push(p);
                }
            } else {
                // Summon
                for (let sx of [50, -50]) {
                    let spawnX = this.x + sx;
                    let spawnY = this.y;
                    if (!Level.checkCollision(spawnX, spawnY, 16)) {
                        Engine.entities.push(new Enemy(spawnX, spawnY, 'Skeleton'));
                    }
                }
            }
        }
    }
    
    draw(ctx) {
        if (this.dead) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        
        let img = Assets.get(this.name);
        
        // Flip based on movement
        if (this.vx < 0) {
            ctx.scale(-1, 1);
        }
        
        if (img) {
            ctx.drawImage(img, -this.radius, -this.radius, this.radius*2, this.radius*2);
        }
        
        ctx.restore();
    }
}
