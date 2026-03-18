class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 32, 32, type === 'Skeleton' ? 50 : 80);
        this.type = type; // 'Skeleton' (fast, low hp), 'Goblin' (slower, higher hp)
        this.faction = 'enemy';
        this.speed = type === 'Skeleton' ? 120 : 80;
        this.attackCooldown = 0;
        this.state = 'idle'; // idle, chase
    }
    
    update(dt) {
        if (this.dead) return;
        
        let distToPlayer = null;
        let pAngle = 0;
        
        if (Player && !Player.dead) {
            let dx = Player.x - this.x;
            let dy = Player.y - this.y;
            distToPlayer = Math.hypot(dx, dy);
            pAngle = Math.atan2(dy, dx);
            
            if (distToPlayer < 400) { // Aggro range
                this.state = 'chase';
            } else {
                this.state = 'idle';
            }
        } else {
            this.state = 'idle';
        }
        
        if (this.state === 'chase' && distToPlayer > this.radius + Player.radius) {
            // Move towards player
            this.vx += Math.cos(pAngle) * this.speed * dt * 20;
            this.vy += Math.sin(pAngle) * this.speed * dt * 20;
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
        
        // Attack
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        
        if (this.state === 'chase' && distToPlayer < this.radius + Player.radius + 5 && this.attackCooldown <= 0) {
            this.attack();
        }
    }
    
    attack() {
        this.attackCooldown = 1.0;
        if (Player && !Player.dead) {
            Player.takeDamage(10, this.x, this.y);
            Engine.addShake(3);
        }
    }
    
    die() {
        super.die();
        // Drop small healing orb maybe?
        if (Math.random() < 0.2) {
            // health drop un-implemented
        }
    }
    
    draw(ctx) {
        if (this.dead) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Flip based on velocity
        if (this.vx < 0) {
            ctx.scale(-1, 1);
        }
        
        let img;
        if (this.type === 'Skeleton') {
            img = Assets.get('skeleton');
        } else {
            img = Assets.get('goblin');
        }
        
        if (img) {
            ctx.drawImage(img, -this.width/2, -this.height/2, this.width, this.height);
        }
        
        // HP Bar
        ctx.scale(this.vx < 0 ? -1 : 1, 1); // unflip for relative UI drawn on top if flipped
        
        ctx.fillStyle = 'black';
        ctx.fillRect(-15, -25, 30, 4);
        ctx.fillStyle = 'red';
        ctx.fillRect(-15, -25, 30 * (this.hp / this.maxHp), 4);
        
        ctx.restore();
    }
}
