const Stairs = {
    x: 0,
    y: 0,
    radius: 32,
    active: false,

    spawn(x, y) {
        this.x = x;
        this.y = y;
        this.active = true;
    },

    update(dt) {
        if (!this.active) return;

        if (Player && !Player.dead) {
            let dist = Math.hypot(Player.x - this.x, Player.y - this.y);
            if (dist < this.radius + Player.radius) {
                if (Level.currentLevel < 3) {
                    this.active = false;
                    Level.init(Level.currentLevel + 1);
                } else {
                    Engine.state = 'VICTORY';
                    document.getElementById('victory-screen').classList.remove('hidden');
                }
            }
        }
    },

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        let img = Assets.get('stairs');
        if (img) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffff00';
            ctx.drawImage(img, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        }
        ctx.restore();
    }
};

const Level = {
    tileSize: 64,
    width: 50,
    height: 50,
    map: [],
    currentLevel: 1,

    init(levelIndex) {
        this.currentLevel = levelIndex;
        document.getElementById('level-indicator').innerText = `Level ${this.currentLevel}: ` +
            (this.currentLevel === 1 ? 'The Slime Pits' :
                (this.currentLevel === 2 ? 'The Shadow Halls' : 'The Necropolis'));

        this.generateMap();
    },

    isWall(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return true;
        return this.map[y * this.width + x] === 1;
    },

    checkCollision(px, py, radius) {
        let leftTile = Math.floor((px - radius) / this.tileSize);
        let rightTile = Math.floor((px + radius) / this.tileSize);
        let topTile = Math.floor((py - radius) / this.tileSize);
        let bottomTile = Math.floor((py + radius) / this.tileSize);

        for (let y = topTile; y <= bottomTile; y++) {
            for (let x = leftTile; x <= rightTile; x++) {
                if (this.isWall(x, y)) return true;
            }
        }
        return false;
    },

    update(dt) {
        if (Stairs.active) Stairs.update(dt);
        if (typeof BossManager !== 'undefined' && BossManager.active) BossManager.update(dt);
    },

    draw(ctx) {
        let startX = Math.max(0, Math.floor(Engine.camera.x / this.tileSize));
        let endX = Math.min(this.width, startX + Math.ceil(Engine.width / this.tileSize) + 1);
        let startY = Math.max(0, Math.floor(Engine.camera.y / this.tileSize));
        let endY = Math.min(this.height, startY + Math.ceil(Engine.height / this.tileSize) + 1);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (this.isWall(x, y)) {
                    let img = Assets.get('wall');
                    if (img) ctx.drawImage(img, Math.floor(x * this.tileSize), Math.floor(y * this.tileSize), this.tileSize + 1, this.tileSize + 1);
                } else {
                    let img = Assets.get('floor');
                    if (img) ctx.drawImage(img, Math.floor(x * this.tileSize), Math.floor(y * this.tileSize), this.tileSize + 1, this.tileSize + 1);
                }
            }
        }
        if (Stairs.active) Stairs.draw(ctx);
    },

    generateMap() {
        this.map = new Array(this.width * this.height).fill(1);
        let cx = Math.floor(this.width / 2);
        let cy = Math.floor(this.height / 2);

        window.Player = new PlayerEntity(cx * this.tileSize, cy * this.tileSize);
        Engine.entities = [];
        Engine.projectiles = [];
        Engine.particles = [];
        Stairs.active = false;

        if (typeof BossManager !== 'undefined') {
            BossManager.active = false;
            document.getElementById('boss-health-container').classList.add('hidden');
        }

        for (let oy = -3; oy <= 3; oy++) {
            for (let ox = -3; ox <= 3; ox++) {
                this.map[(cy + oy) * this.width + (cx + ox)] = 0;
            }
        }

        let walkers = [{ x: cx, y: cy, steps: 0, maxSteps: Level.currentLevel === 3 ? 150 : 250 }];
        let furthest = { x: cx, y: cy, dist: 0 };

        while (walkers.length > 0) {
            let w = walkers.pop();
            while (w.steps < w.maxSteps) {
                let dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
                let d = dirs[Math.floor(Math.random() * dirs.length)];
                w.x += d.x; w.y += d.y; w.steps++;
                if (w.x < 2 || w.x >= this.width - 2 || w.y < 2 || w.y >= this.height - 2) {
                    w.x -= d.x; w.y -= d.y; continue;
                }
                if (Math.random() < 0.1) {
                    for (let oy = -2; oy <= 2; oy++) {
                        for (let ox = -2; ox <= 2; ox++) {
                            if (w.y + oy > 0 && w.y + oy < this.height - 1 && w.x + ox > 0 && w.x + ox < this.width - 1) {
                                this.map[(w.y + oy) * this.width + (w.x + ox)] = 0;
                            }
                        }
                    }
                } else {
                    this.map[w.y * this.width + w.x] = 0;
                    this.map[(w.y) * this.width + (w.x + 1)] = 0;
                    this.map[(w.y + 1) * this.width + (w.x)] = 0;
                    this.map[(w.y + 1) * this.width + (w.x + 1)] = 0;
                }

                let dist = Math.hypot(w.x - cx, w.y - cy);
                if (dist > furthest.dist) furthest = { x: w.x, y: w.y, dist: dist };

                if (Math.random() < 0.05 && walkers.length < 5) walkers.push({ x: w.x, y: w.y, steps: w.steps, maxSteps: w.maxSteps });
            }
        }

        for (let y = 5; y < this.height - 5; y++) {
            for (let x = 5; x < this.width - 5; x++) {
                if (this.map[y * this.width + x] === 0 && Math.random() < 0.03) {
                    if (Math.hypot(x - cx, y - cy) > 5) {
                        Engine.entities.push(new Enemy(
                            x * this.tileSize + this.tileSize / 2,
                            y * this.tileSize + this.tileSize / 2,
                            Math.random() < 0.5 ? 'Skeleton' : 'Goblin'
                        ));
                    }
                }
            }
        }

        if (typeof BossManager !== 'undefined') {
            if (this.currentLevel === 1) BossManager.spawn(furthest.x * this.tileSize, furthest.y * this.tileSize, 'The Slime King');
            else if (this.currentLevel === 2) BossManager.spawn(furthest.x * this.tileSize, furthest.y * this.tileSize, 'The Shadow Knight');
            else BossManager.spawn(furthest.x * this.tileSize, furthest.y * this.tileSize, 'The Necromancer');
        }
    }
};
