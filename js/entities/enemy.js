// =====================================================
// ENEMY SYSTEM — 8 total enemy types with unique AI
// =====================================================

class Enemy extends Entity {
    constructor(x, y, type) {
        const stats = Enemy.STATS[type] || Enemy.STATS['Skeleton'];
        super(x, y, stats.size, stats.size, stats.hp);
        this.type = type;
        this.faction = 'enemy';
        this.speed = stats.speed;
        this.attackCooldown = 0;
        this.state = 'idle'; // idle, chase, special
        this.assetKey = stats.assetKey;
        this.dropChance = stats.dropChance;
        this.weaponDropChance = stats.weaponDropChance || 0;
        this.facingAngle = 0;

        // Type-specific state
        this.specialTimer = 0;
        this.isElite = false;
        this.stealthAlpha = 1.0;  // For Shadow Assassin
        this.isStealthed = false;
        this.bombTimer = -1;      // For Bomber Imp
        this.totemPulseTimer = 0; // For Corrupted Totem
        this.mimicRevealed = false; // For Mimic
        this.shootCooldown = 0;   // For Wraith
    }

    // Make this enemy an elite variant
    makeElite() {
        this.isElite = true;
        this.maxHp *= 2;
        this.hp = this.maxHp;
        this.speed *= 1.15;
        this.weaponDropChance = 1.0; // Guaranteed weapon drop
    }

    update(dt) {
        if (this.dead) return;

        let distToPlayer = Infinity;
        let pAngle = 0;

        if (Player && !Player.dead) {
            let dx = Player.x - this.x;
            let dy = Player.y - this.y;
            distToPlayer = Math.hypot(dx, dy);
            pAngle = Math.atan2(dy, dx);
            this.facingAngle = pAngle;

            if (distToPlayer < 500) {
                this.state = 'chase';
            } else {
                this.state = 'idle';
            }
        } else {
            this.state = 'idle';
        }

        // Dispatch to type-specific AI
        switch (this.type) {
            case 'Skeleton':
            case 'Goblin':
                this._basicMeleeAI(dt, pAngle, distToPlayer);
                break;
            case 'Wraith':
                this._wraithAI(dt, pAngle, distToPlayer);
                break;
            case 'Mimic':
                this._mimicAI(dt, pAngle, distToPlayer);
                break;
            case 'BomberImp':
                this._bomberImpAI(dt, pAngle, distToPlayer);
                break;
            case 'ShieldBearer':
                this._shieldBearerAI(dt, pAngle, distToPlayer);
                break;
            case 'ShadowAssassin':
                this._shadowAssassinAI(dt, pAngle, distToPlayer);
                break;
            case 'CorruptedTotem':
                this._corruptedTotemAI(dt, pAngle, distToPlayer);
                break;
        }

        // Enemy-Enemy collision simple separate
        for (let e of Engine.entities) {
            if (e !== this && e.faction === 'enemy' && !e.dead) {
                let dx = this.x - e.x;
                let dy = this.y - e.y;
                let dist = Math.hypot(dx, dy);
                if (dist < this.radius + e.radius) {
                    let overlap = (this.radius + e.radius) - dist;
                    let angle = Math.atan2(dy, dx);
                    let tx = this.x + Math.cos(angle) * overlap * 0.1;
                    let ty = this.y + Math.sin(angle) * overlap * 0.1;
                    if (!Level.checkCollision(tx, this.y, this.radius)) this.x = tx;
                    if (!Level.checkCollision(this.x, ty, this.radius)) this.y = ty;
                }
            }
        }

        super.update(dt);

        // Basic melee attack for melee types
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        if (this.type !== 'Wraith' && this.type !== 'CorruptedTotem' && this.type !== 'Mimic') {
            if (this.state === 'chase' && distToPlayer < this.radius + Player.radius + 5 && this.attackCooldown <= 0) {
                this.meleeAttack();
            }
        }
    }

    // ========== AI BEHAVIORS ==========

    _basicMeleeAI(dt, angle, dist) {
        if (this.state === 'chase' && dist > this.radius + Player.radius) {
            this.vx += Math.cos(angle) * this.speed * dt * 20;
            this.vy += Math.sin(angle) * this.speed * dt * 20;
        }
    }

    _wraithAI(dt, angle, dist) {
        // Wraith keeps distance and fires slow projectiles
        this.shootCooldown -= dt;
        
        if (this.state === 'chase') {
            if (dist < 200) {
                // Move away
                this.vx -= Math.cos(angle) * this.speed * dt * 15;
                this.vy -= Math.sin(angle) * this.speed * dt * 15;
            } else if (dist > 350) {
                // Move closer
                this.vx += Math.cos(angle) * this.speed * dt * 10;
                this.vy += Math.sin(angle) * this.speed * dt * 10;
            }

            // Shoot slow projectile
            if (this.shootCooldown <= 0 && dist < 400) {
                this.shootCooldown = 2.0;
                let p = new Projectile(this.x, this.y, angle, this.faction);
                p.speed = 200;
                p.vx = Math.cos(angle) * 200;
                p.vy = Math.sin(angle) * 200;
                p.damage = 12;
                p.radius = 7;
                p.color = '#aa66ff';
                p.life = 3.0;
                Engine.projectiles.push(p);
                
                // Muzzle effect
                for (let i = 0; i < 4; i++) {
                    Particles.spawn(this.x, this.y, '#aa66ff');
                }
            }
        }
    }

    _mimicAI(dt, angle, dist) {
        if (!this.mimicRevealed) {
            // Stay still, look like a chest
            if (dist < 50) {
                // SURPRISE!
                this.mimicRevealed = true;
                Engine.addShake(5);
                for (let i = 0; i < 15; i++) {
                    Particles.spawn(this.x, this.y, '#ffaa00');
                }
                // Lunge at player
                this.vx += Math.cos(angle) * 600;
                this.vy += Math.sin(angle) * 600;
                
                if (Player && !Player.dead) {
                    Player.takeDamage(15, this.x, this.y);
                }
            }
        } else {
            // Once revealed, acts like aggressive melee
            if (this.state === 'chase' && dist > this.radius + Player.radius) {
                this.vx += Math.cos(angle) * this.speed * dt * 25;
                this.vy += Math.sin(angle) * this.speed * dt * 25;
            }
            
            if (dist < this.radius + Player.radius + 5 && this.attackCooldown <= 0) {
                this.meleeAttack();
            }
        }
    }

    _bomberImpAI(dt, angle, dist) {
        // Charges player, explodes on death or when very close
        if (this.state === 'chase') {
            this.vx += Math.cos(angle) * this.speed * dt * 25;
            this.vy += Math.sin(angle) * this.speed * dt * 25;

            // Start bomb timer when close
            if (dist < 40 && this.bombTimer < 0) {
                this.bombTimer = 0.8; // 0.8 second fuse
            }
        }

        if (this.bombTimer > 0) {
            this.bombTimer -= dt;
            // Visual warning: flash red
            if (this.bombTimer <= 0) {
                this._explode();
            }
        }
    }

    _shieldBearerAI(dt, angle, dist) {
        // Slowly advances toward player, blocks frontal damage
        if (this.state === 'chase' && dist > this.radius + Player.radius) {
            this.vx += Math.cos(angle) * this.speed * dt * 15;
            this.vy += Math.sin(angle) * this.speed * dt * 15;
        }
        // facingAngle is already set to pAngle in update()
    }

    _shadowAssassinAI(dt, angle, dist) {
        this.specialTimer += dt;

        if (!this.isStealthed && this.specialTimer > 3) {
            // Go invisible
            this.isStealthed = true;
            this.specialTimer = 0;
            this.speed = 200; // faster while stealthed
        }

        if (this.isStealthed) {
            this.stealthAlpha = Math.max(0.08, this.stealthAlpha - dt * 3);
            
            // Dash toward player
            if (dist > 30) {
                this.vx += Math.cos(angle) * this.speed * dt * 30;
                this.vy += Math.sin(angle) * this.speed * dt * 30;
            }

            // Backstab when close
            if (dist < this.radius + Player.radius + 10 && this.attackCooldown <= 0) {
                this.isStealthed = false;
                this.stealthAlpha = 1.0;
                this.speed = 140;
                this.specialTimer = 0;
                
                // Backstab: 2x damage
                if (Player && !Player.dead) {
                    Player.takeDamage(25, this.x, this.y);
                    Engine.addShake(6);
                    Particles.spawnText(Player.x, Player.y - 30, 'BACKSTAB!', '#ff0000');
                    for (let i = 0; i < 15; i++) {
                        Particles.spawn(this.x, this.y, '#ff3333');
                    }
                }
                this.attackCooldown = 2.0;
            }
        } else {
            this.stealthAlpha = Math.min(1, this.stealthAlpha + dt * 2);
            // Normal chase when visible
            this._basicMeleeAI(dt, angle, dist);
        }
    }

    _corruptedTotemAI(dt, angle, dist) {
        // Stationary: buffs/heals nearby enemies every 3 seconds
        this.totemPulseTimer += dt;

        if (this.totemPulseTimer > 3.0) {
            this.totemPulseTimer = 0;
            const pulseRange = 200;

            for (let e of Engine.entities) {
                if (e !== this && e.faction === 'enemy' && !e.dead) {
                    let d = Math.hypot(e.x - this.x, e.y - this.y);
                    if (d < pulseRange) {
                        // Heal 15% HP
                        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.15);
                        // Speed buff for 2 seconds
                        e.speed *= 1.1;
                        setTimeout(() => { if (!e.dead) e.speed /= 1.1; }, 2000);
                        
                        // Visual
                        for (let i = 0; i < 5; i++) {
                            Particles.spawn(e.x, e.y, '#cc44ff');
                        }
                    }
                }
            }

            // Pulse ring visual
            for (let i = 0; i < 20; i++) {
                let a = (i / 20) * Math.PI * 2;
                let px = this.x + Math.cos(a) * pulseRange;
                let py = this.y + Math.sin(a) * pulseRange;
                let p = new Particle(px, py, '#9933ff');
                p.vx = 0;
                p.vy = 0;
                p.size = 3;
                p.life = 0.5;
                Engine.particles.push(p);
            }
        }
    }

    // ========== COMMON ACTIONS ==========

    meleeAttack() {
        this.attackCooldown = 1.0;
        if (Player && !Player.dead) {
            Player.takeDamage(10, this.x, this.y);
            Engine.addShake(3);
        }
    }

    _explode() {
        // Bomber Imp explosion
        const aoeRadius = 80;
        if (Player && !Player.dead) {
            let dist = Math.hypot(Player.x - this.x, Player.y - this.y);
            if (dist < aoeRadius) {
                let falloff = 1 - (dist / aoeRadius);
                Player.takeDamage(20 * falloff, this.x, this.y);
            }
        }
        // Also hurt other enemies
        for (let e of Engine.entities) {
            if (e !== this && !e.dead) {
                let dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < aoeRadius) {
                    e.takeDamage(10, this.x, this.y);
                }
            }
        }
        // Explosion VFX
        for (let i = 0; i < 30; i++) {
            let p = new Particle(this.x, this.y, Math.random() < 0.5 ? '#ff4400' : '#ffaa00');
            p.size = Math.random() * 6 + 3;
            let a = Math.random() * Math.PI * 2;
            let s = Math.random() * 250 + 100;
            p.vx = Math.cos(a) * s;
            p.vy = Math.sin(a) * s;
            Engine.particles.push(p);
        }
        Engine.addShake(10);
        this.hp = 0;
        this.die();
    }

    die() {
        super.die();

        // Bomber Imp: explode on death if hasn't already
        if (this.type === 'BomberImp' && this.bombTimer < 0) {
            this._explode();
            return; // _explode already calls die, prevent recursion
        }

        // Drop healing orb
        if (Math.random() < this.dropChance) {
            Engine.entities.push(new HealOrb(this.x, this.y));
        }

        // Weapon drop
        if (Math.random() < this.weaponDropChance) {
            let def = getRandomWeaponDef(Player ? Player.weapon.name : '');
            Engine.weaponPickups.push(new WeaponPickup(this.x, this.y, def));
        }
    }

    draw(ctx) {
        if (this.dead) return;

        // Mimic: draw as chest before revealed
        if (this.type === 'Mimic' && !this.mimicRevealed) {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // Draw a treasure chest
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(-12, -8, 24, 16);
            ctx.fillStyle = '#DAA520';
            ctx.fillRect(-10, -6, 20, 12);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(-3, -2, 6, 4);
            
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        // Shadow Assassin transparency
        if (this.type === 'ShadowAssassin') {
            ctx.globalAlpha = this.stealthAlpha;
        }

        // Bomber Imp flash when about to explode
        if (this.type === 'BomberImp' && this.bombTimer > 0) {
            if (Math.floor(this.bombTimer * 10) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }
        }

        // Elite glow
        if (this.isElite) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffaa00';
            ctx.fillStyle = 'rgba(255, 170, 0, 0.15)';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Flip based on velocity
        if (this.vx < 0) {
            ctx.scale(-1, 1);
        }

        let img = Assets.get(this.assetKey);
        if (img) {
            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
        }

        // HP Bar
        ctx.scale(this.vx < 0 ? -1 : 1, 1); // unflip for relative UI drawn on top if flipped

        // Shield Bearer: draw shield indicator
        if (this.type === 'ShieldBearer') {
            ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 3, -Math.PI / 3, Math.PI / 3);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
        }

        // HP bar background
        let barColor = this.isElite ? '#ffaa00' : 'red';
        ctx.fillStyle = 'black';
        ctx.fillRect(-15, -25, 30, 4);
        ctx.fillStyle = barColor;
        ctx.fillRect(-15, -25, 30 * (this.hp / this.maxHp), 4);

        // Elite crown indicator
        if (this.isElite) {
            ctx.fillStyle = '#ffaa00';
            ctx.font = '10px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('♛', 0, -30);
        }

        ctx.restore();
    }
}

// =====================================================
// ENEMY STAT DEFINITIONS
// =====================================================
Enemy.STATS = {
    'Skeleton': {
        hp: 50,
        speed: 120,
        size: 32,
        assetKey: 'skeleton',
        dropChance: 0.2,
        weaponDropChance: 0.03
    },
    'Goblin': {
        hp: 80,
        speed: 80,
        size: 32,
        assetKey: 'goblin',
        dropChance: 0.35,
        weaponDropChance: 0.05
    },
    'Wraith': {
        hp: 40,
        speed: 60,
        size: 32,
        assetKey: 'wraith',
        dropChance: 0.25,
        weaponDropChance: 0.06
    },
    'Mimic': {
        hp: 120,
        speed: 130,
        size: 32,
        assetKey: 'mimic',
        dropChance: 0.6,
        weaponDropChance: 0.15
    },
    'BomberImp': {
        hp: 35,
        speed: 150,
        size: 28,
        assetKey: 'bomber_imp',
        dropChance: 0.1,
        weaponDropChance: 0.02
    },
    'ShieldBearer': {
        hp: 150,
        speed: 50,
        size: 36,
        assetKey: 'shield_bearer',
        dropChance: 0.4,
        weaponDropChance: 0.08
    },
    'ShadowAssassin': {
        hp: 60,
        speed: 140,
        size: 30,
        assetKey: 'shadow_assassin',
        dropChance: 0.3,
        weaponDropChance: 0.1
    },
    'CorruptedTotem': {
        hp: 200,
        speed: 0,
        size: 32,
        assetKey: 'corrupted_totem',
        dropChance: 0.5,
        weaponDropChance: 0.12
    }
};

// =====================================================
// SPAWN TABLE — Weighted pools per level
// =====================================================
const SpawnTable = {
    // Returns a random enemy type for the given level
    getEnemyType(level) {
        const table = this.tables[level] || this.tables[3];
        let roll = Math.random();
        let cumulative = 0;
        
        for (let entry of table) {
            cumulative += entry.weight;
            if (roll < cumulative) {
                return entry.type;
            }
        }
        return table[table.length - 1].type;
    },

    // Check if this enemy should be elite
    shouldBeElite(level) {
        const baseChance = 0.05;
        return Math.random() < baseChance + (level - 1) * 0.02;
    },

    tables: {
        1: [
            { type: 'Skeleton', weight: 0.45 },
            { type: 'Goblin', weight: 0.30 },
            { type: 'Wraith', weight: 0.20 },
            { type: 'BomberImp', weight: 0.05 }
        ],
        2: [
            { type: 'Skeleton', weight: 0.20 },
            { type: 'Goblin', weight: 0.20 },
            { type: 'Wraith', weight: 0.15 },
            { type: 'Mimic', weight: 0.10 },
            { type: 'BomberImp', weight: 0.15 },
            { type: 'ShieldBearer', weight: 0.15 },
            { type: 'CorruptedTotem', weight: 0.05 }
        ],
        3: [
            { type: 'Skeleton', weight: 0.10 },
            { type: 'Goblin', weight: 0.10 },
            { type: 'Wraith', weight: 0.15 },
            { type: 'Mimic', weight: 0.10 },
            { type: 'BomberImp', weight: 0.10 },
            { type: 'ShieldBearer', weight: 0.10 },
            { type: 'ShadowAssassin', weight: 0.20 },
            { type: 'CorruptedTotem', weight: 0.15 }
        ]
    }
};
