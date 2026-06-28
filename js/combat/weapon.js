// =====================================================
// WEAPON SYSTEM — 8 distinct weapons across 4 archetypes
// =====================================================

const WEAPON_DEFS = {
    'Relic Shotgun': {
        name: 'Relic Shotgun',
        type: 'spread',
        fireRate: 0.45,
        damage: 14,
        projectileCount: 3,
        spread: 0.15,        // radians between pellets
        speed: 550,
        range: 0.55,         // projectile lifetime
        recoil: 900,
        knockback: 350,
        color: '#ffaa00',
        projectileColor: '#00ffff',
        projectileRadius: 5,
        description: 'Classic spread. High knockback.',
        special: null
    },

    'Soul Pistol': {
        name: 'Soul Pistol',
        type: 'precision',
        fireRate: 0.18,
        damage: 8,
        projectileCount: 1,
        spread: 0,
        speed: 800,
        range: 1.5,
        recoil: 200,
        knockback: 100,
        color: '#aa88ff',
        projectileColor: '#bb99ff',
        projectileRadius: 4,
        description: 'Fast and accurate.',
        special: null
    },

    'Abyssal Rifle': {
        name: 'Abyssal Rifle',
        type: 'sustained',
        fireRate: 0.25,
        damage: 11,
        projectileCount: 2,
        spread: 0.08,
        speed: 700,
        range: 1.2,
        recoil: 400,
        knockback: 180,
        color: '#00aaff',
        projectileColor: '#0088ff',
        projectileRadius: 4,
        description: 'Medium rate, dual shot.',
        special: null
    },

    'Void Cannon': {
        name: 'Void Cannon',
        type: 'heavy',
        fireRate: 1.2,
        damage: 60,
        projectileCount: 1,
        spread: 0,
        speed: 350,
        range: 2.0,
        recoil: 1600,
        knockback: 600,
        color: '#ff00ff',
        projectileColor: '#ff44ff',
        projectileRadius: 12,
        description: 'Massive damage. Slow fire.',
        special: 'aoe'         // explodes on impact
    },

    'Chain Lightning': {
        name: 'Chain Lightning',
        type: 'magic',
        fireRate: 0.6,
        damage: 18,
        projectileCount: 1,
        spread: 0,
        speed: 900,
        range: 0.8,
        recoil: 150,
        knockback: 100,
        color: '#ffff00',
        projectileColor: '#ffff88',
        projectileRadius: 5,
        description: 'Chains to nearby enemies.',
        special: 'chain'
    },

    'Bone Crossbow': {
        name: 'Bone Crossbow',
        type: 'precision',
        fireRate: 0.7,
        damage: 28,
        projectileCount: 1,
        spread: 0,
        speed: 750,
        range: 2.0,
        recoil: 500,
        knockback: 250,
        color: '#ccbb88',
        projectileColor: '#eeddaa',
        projectileRadius: 4,
        description: 'Pierces through enemies.',
        special: 'pierce'
    },

    'Cursed Flamethrower': {
        name: 'Cursed Flamethrower',
        type: 'sustained',
        fireRate: 0.05,
        damage: 3,
        projectileCount: 1,
        spread: 0.3,          // wide random spread
        speed: 400,
        range: 0.3,
        recoil: 50,
        knockback: 30,
        color: '#ff4400',
        projectileColor: '#ff6600',
        projectileRadius: 6,
        description: 'Rapid fire, short range.',
        special: 'flame'
    },

    'Necro Staff': {
        name: 'Necro Staff',
        type: 'magic',
        fireRate: 0.55,
        damage: 15,
        projectileCount: 2,
        spread: 0.4,
        speed: 350,
        range: 3.0,
        recoil: 100,
        knockback: 80,
        color: '#00ff88',
        projectileColor: '#44ffaa',
        projectileRadius: 5,
        description: 'Homing projectiles.',
        special: 'homing'
    }
};

// All weapon names for random drops
const WEAPON_NAMES = Object.keys(WEAPON_DEFS);

// Get a random weapon definition (excluding a specific weapon)
function getRandomWeaponDef(excludeName) {
    let available = WEAPON_NAMES.filter(n => n !== excludeName);
    return WEAPON_DEFS[available[Math.floor(Math.random() * available.length)]];
}

// =====================================================
// WEAPON PICKUP — Glowing entity on the ground
// =====================================================
class WeaponPickup {
    constructor(x, y, weaponDef) {
        this.x = x;
        this.y = y;
        this.weaponDef = weaponDef;
        this.radius = 14;
        this.dead = false;
        this.bobTime = Math.random() * Math.PI * 2;
        this.showLabel = false;
    }

    update(dt) {
        if (this.dead) return;
        this.bobTime += dt * 3;

        // Check proximity to player for label + pickup
        if (window.Player && !Player.dead) {
            let dist = Math.hypot(this.x - Player.x, this.y - Player.y);
            this.showLabel = dist < 60;

            // Press E to swap
            if (dist < 50 && Input.wasPressed('KeyE')) {
                // Swap weapons
                let oldWeapon = Player.weapon;
                Player.weapon = { ...this.weaponDef };
                Player.attackCooldown = 0;

                // Drop old weapon here
                this.weaponDef = oldWeapon;

                // VFX
                for (let i = 0; i < 12; i++) {
                    Particles.spawn(this.x, this.y, Player.weapon.color);
                }
                Engine.addShake(3);
            }
        }
    }

    draw(ctx) {
        if (this.dead) return;
        const bobY = Math.sin(this.bobTime) * 4;

        ctx.save();
        ctx.translate(this.x, this.y + bobY);

        // Glow circle
        ctx.fillStyle = this.weaponDef.color;
        ctx.globalAlpha = 0.2 + Math.sin(this.bobTime * 1.5) * 0.1;
        ctx.shadowBlur = 25;
        ctx.shadowColor = this.weaponDef.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
        ctx.fill();

        // Core shape
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.weaponDef.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 4, 0, Math.PI * 2);
        ctx.fill();

        // Inner icon (weapon type indicator)
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icons = { spread: '⌁', precision: '◎', sustained: '≡', heavy: '◆', magic: '✦' };
        ctx.fillText(icons[this.weaponDef.type] || '•', 0, 0);

        ctx.restore();

        // Label when close
        if (this.showLabel) {
            ctx.save();
            ctx.font = '8px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 5;
            ctx.shadowColor = this.weaponDef.color;
            ctx.fillText(this.weaponDef.name, this.x, this.y - 28 + bobY);
            
            ctx.font = '6px "Press Start 2P"';
            ctx.fillStyle = this.weaponDef.color;
            ctx.fillText('[E] SWAP', this.x, this.y - 18 + bobY);
            ctx.restore();
        }
    }
}

// =====================================================
// ENHANCED PROJECTILE — Supports special weapon effects
// =====================================================
class Projectile {
    constructor(x, y, angle, faction, weaponDef = null) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.faction = faction;
        this.dead = false;
        this.hasHit = false;

        if (weaponDef) {
            this.speed = weaponDef.speed;
            this.damage = weaponDef.damage;
            this.radius = weaponDef.projectileRadius;
            this.life = weaponDef.range;
            this.color = weaponDef.projectileColor;
            this.special = weaponDef.special;
            this.knockback = weaponDef.knockback;
        } else {
            // Default enemy projectile
            this.speed = 600;
            this.damage = 25;
            this.radius = 5;
            this.life = 2.0;
            this.color = faction === 'player' ? '#00ffff' : '#ff00ff';
            this.special = null;
            this.knockback = 300;
        }

        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        // Homing tracking
        this.homingTarget = null;
        if (this.special === 'homing') {
            this._findHomingTarget();
        }

        // Chain lightning state
        this.chainsLeft = this.special === 'chain' ? 3 : 0;
        this.chainedEntities = new Set();
    }

    _findHomingTarget() {
        let closest = null;
        let closestDist = 400; // max homing range
        const targets = this.faction === 'player' ? Engine.entities : (window.Player ? [Player] : []);

        for (let e of targets) {
            if (e.dead) continue;
            let d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d < closestDist) {
                closestDist = d;
                closest = e;
            }
        }
        this.homingTarget = closest;
    }

    update(dt) {
        // Homing behavior
        if (this.special === 'homing' && this.homingTarget && !this.homingTarget.dead) {
            let dx = this.homingTarget.x - this.x;
            let dy = this.homingTarget.y - this.y;
            let targetAngle = Math.atan2(dy, dx);
            
            // Smoothly turn toward target
            let angleDiff = targetAngle - this.angle;
            // Normalize to [-PI, PI]
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            this.angle += angleDiff * 5 * dt;
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;

        if (this.life <= 0 || Level.checkCollision(this.x, this.y, this.radius)) {
            if (this.special === 'aoe') {
                this._explode();
            }
            this.dead = true;
            for (let i = 0; i < 3; i++) Particles.spawn(this.x, this.y, this.color);
            return;
        }

        // Trail particle
        if (this.special === 'flame') {
            // Flames spawn lots of particles
            if (Math.random() < 0.8) {
                let p = new Particle(this.x, this.y, 
                    Math.random() < 0.5 ? '#ff4400' : '#ffaa00');
                p.size = Math.random() * 5 + 3;
                p.life = 0.3;
                Engine.particles.push(p);
            }
        } else if (Math.random() < 0.5) {
            let trailColor = this.color;
            if (this.faction !== 'player') trailColor = '#ff00ff';
            let p = new Particle(this.x, this.y, trailColor);
            p.size = this.radius * 0.4;
            p.vx *= 0.3;
            p.vy *= 0.3;
            Engine.particles.push(p);
        }

        // Entity collision
        for (let e of Engine.entities) {
            if (e.faction !== this.faction && !e.dead) {
                // Shield Bearer frontal block check
                if (e.type === 'ShieldBearer' && this.faction === 'player') {
                    let angleToEnemy = Math.atan2(e.y - this.y, e.x - this.x);
                    let facingAngle = e.facingAngle || 0;
                    let angleDiff = Math.abs(angleToEnemy - facingAngle);
                    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                    
                    // If hitting the shield (front 120 degrees)
                    if (angleDiff < Math.PI / 3) {
                        let dist = Math.hypot(this.x - e.x, this.y - e.y);
                        if (dist < this.radius + e.radius) {
                            // Deflect!
                            this.dead = true;
                            for (let i = 0; i < 5; i++) Particles.spawn(this.x, this.y, '#aaaaff');
                            Particles.spawnText(e.x, e.y - 20, 'BLOCKED', '#8888ff');
                            Engine.addShake(2);
                            break;
                        }
                    }
                }

                let dist = Math.hypot(this.x - e.x, this.y - e.y);
                if (dist < this.radius + e.radius) {
                    e.takeDamage(this.damage, this.x, this.y);

                    if (this.special === 'chain') {
                        this._chainToNext(e);
                    }

                    if (this.special === 'aoe') {
                        this._explode();
                    }

                    if (this.special !== 'pierce') {
                        this.dead = true;
                    } else {
                        // Pierce: reduce damage slightly, don't die
                        this.damage *= 0.7;
                        if (this.damage < 3) this.dead = true;
                    }

                    for (let i = 0; i < 5; i++) Particles.spawn(this.x, this.y, this.color);
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

    _explode() {
        // AoE damage in radius
        const aoeRadius = 80;
        for (let e of Engine.entities) {
            if (e.faction !== this.faction && !e.dead) {
                let dist = Math.hypot(this.x - e.x, this.y - e.y);
                if (dist < aoeRadius) {
                    let falloff = 1 - (dist / aoeRadius);
                    e.takeDamage(this.damage * falloff * 0.6, this.x, this.y);
                }
            }
        }
        // Big visual explosion
        for (let i = 0; i < 25; i++) {
            let p = new Particle(this.x, this.y, Math.random() < 0.5 ? '#ff44ff' : '#ff88ff');
            p.size = Math.random() * 6 + 3;
            let a = Math.random() * Math.PI * 2;
            let s = Math.random() * 300 + 100;
            p.vx = Math.cos(a) * s;
            p.vy = Math.sin(a) * s;
            Engine.particles.push(p);
        }
        Engine.addShake(8);
    }

    _chainToNext(hitEntity) {
        this.chainedEntities.add(hitEntity);
        if (this.chainsLeft <= 0) return;

        // Find nearest un-chained enemy
        let closest = null;
        let closestDist = 150;

        for (let e of Engine.entities) {
            if (e.faction !== this.faction && !e.dead && !this.chainedEntities.has(e)) {
                let d = Math.hypot(hitEntity.x - e.x, hitEntity.y - e.y);
                if (d < closestDist) {
                    closestDist = d;
                    closest = e;
                }
            }
        }

        if (closest) {
            // Create chain visual (lightning line particles)
            let steps = 6;
            for (let i = 0; i < steps; i++) {
                let t = i / steps;
                let px = hitEntity.x + (closest.x - hitEntity.x) * t + (Math.random() - 0.5) * 15;
                let py = hitEntity.y + (closest.y - hitEntity.y) * t + (Math.random() - 0.5) * 15;
                let p = new Particle(px, py, '#ffff00');
                p.size = 3;
                p.life = 0.3;
                p.vx = 0;
                p.vy = 0;
                Engine.particles.push(p);
            }

            // Damage the chained enemy
            closest.takeDamage(this.damage * 0.7, hitEntity.x, hitEntity.y);
            this.chainedEntities.add(closest);
            this.chainsLeft--;

            // Recursively chain
            if (this.chainsLeft > 0) {
                this._chainToNext(closest);
            }
        }
    }

    draw(ctx) {
        ctx.save();

        // Flame projectiles are just particles, draw a small ember
        if (this.special === 'flame') {
            ctx.fillStyle = Math.random() < 0.5 ? '#ff6600' : '#ffaa00';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();

        if (this.special === 'aoe') {
            // Void cannon: larger, pulsing
            let pulseR = this.radius + Math.sin(Date.now() * 0.01) * 3;
            ctx.arc(this.x, this.y, pulseR, 0, Math.PI * 2);
        } else {
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        }

        ctx.fill();
        ctx.restore();
    }
}

window.Projectile = Projectile;
