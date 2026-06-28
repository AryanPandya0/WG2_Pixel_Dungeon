class PlayerEntity extends Entity {
    constructor(x, y) {
        super(x, y, 32, 32, 100);
        this.faction = 'player';
        this.speed = 250;
        this.attackCooldown = 0;
        this.active = true;
        this.dashCooldown = 0;
        this.dashTime = 0;

        // Start with Relic Shotgun
        this.weapon = { ...WEAPON_DEFS['Relic Shotgun'] };
    }

    takeDamage(amount, sourceX, sourceY) {
        if (this.dashTime > 0) return; // Invincible while dashing
        super.takeDamage(amount, sourceX, sourceY);
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

        // Dash logic
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.dashTime > 0) {
            this.dashTime -= dt;
            Particles.spawn(this.x, this.y, '#00ffff'); // Dash trail
        }

        if (Input.isDown('Space') && this.dashCooldown <= 0 && (moveX !== 0 || moveY !== 0)) {
            this.dashCooldown = 1.0; // 1 second cooldown
            this.dashTime = 0.2;     // 0.2 sec duration
            this.vx = moveX * 1600;  // huge burst of speed
            this.vy = moveY * 1600;
            Engine.addShake(4);
            for (let i = 0; i < 10; i++) Particles.spawn(this.x, this.y, '#ffffff');
        }

        if (this.dashTime <= 0) {
            this.vx += moveX * this.speed * dt * 30; // Accel
            this.vy += moveY * this.speed * dt * 30;
            // Normal custom friction
            this.vx *= 0.8;
            this.vy *= 0.8;
        } else {
            // Less friction during dash
            this.vx *= 0.92;
            this.vy *= 0.92;
        }

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
        const w = this.weapon;
        this.attackCooldown = w.fireRate;

        // Calculate attack angle based on mouse position relative to center of screen (which is player)
        let dx = Input.mouse.x - window.innerWidth / 2;
        let dy = Input.mouse.y - window.innerHeight / 2;
        let angle = Math.atan2(dy, dx);

        // Spawn projectiles based on weapon definition
        const count = w.projectileCount;
        const halfSpread = (count - 1) * w.spread / 2;

        for (let i = 0; i < count; i++) {
            let spreadOffset;
            if (count === 1) {
                // Single projectile: random spread for flamethrower, none for others
                spreadOffset = w.special === 'flame' ? (Math.random() - 0.5) * w.spread * 2 : 0;
            } else {
                spreadOffset = -halfSpread + i * w.spread;
            }
            
            let projAngle = angle + spreadOffset;
            let p = new Projectile(this.x, this.y, projAngle, this.faction, w);
            Engine.projectiles.push(p);
        }

        // Apply recoil pushback
        this.vx -= Math.cos(angle) * w.recoil;
        this.vy -= Math.sin(angle) * w.recoil;

        // Muzzle flash particles (color matches weapon)
        const flashCount = w.special === 'flame' ? 2 : 6;
        for (let i = 0; i < flashCount; i++) {
            let sparkAngle = angle + (Math.random() - 0.5) * 0.5;
            let spark = new Particle(this.x + Math.cos(angle) * 15, this.y + Math.sin(angle) * 15, w.color);
            spark.vx = Math.cos(sparkAngle) * (Math.random() * 400 + 200);
            spark.vy = Math.sin(sparkAngle) * (Math.random() * 400 + 200);
            spark.life = 0.2; // Quick flash
            Engine.particles.push(spark);
        }

        // Screen shake scales with weapon heaviness
        const shakeAmount = w.type === 'heavy' ? 8 : (w.type === 'spread' ? 3 : 2);
        if (w.special !== 'flame') {
            Engine.addShake(shakeAmount);
        }
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
            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
        }

        ctx.restore();
    }
}

window.Player = null;
