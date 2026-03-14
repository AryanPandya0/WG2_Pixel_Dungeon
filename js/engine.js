const Engine = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    lastTime: 0,
    deltaTime: 0,
    state: 'MENU', // MENU, PLAYING, GAMEOVER, VICTORY

    // Game objects
    entities: [],
    particles: [],
    projectiles: [],

    // Camera
    camera: {
        x: 0,
        y: 0,
        shake: 0
    },

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.ctx.imageSmoothingEnabled = false;

        this.zoom = 2.0; // Zoom level (2x)

        this.levelIntro = {
            timer: 0,
            duration: 3, // 3 seconds
            title: '',
            opacity: 0
        };

        this.resize();

        window.addEventListener('resize', () => this.resize());

        // Start loop
        requestAnimationFrame((t) => this.loop(t));
    },

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx.imageSmoothingEnabled = false;
    },

    addShake(amount) {
        this.camera.shake = Math.min(this.camera.shake + amount, 20);
    },

    startLevelIntro(title) {
        this.levelIntro.title = title;
        this.levelIntro.timer = this.levelIntro.duration;
    },

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        this.deltaTime = (timestamp - this.lastTime) / 1000;
        // Cap dt to prevent huge jumps if tab was inactive
        if (this.deltaTime > 0.1) this.deltaTime = 0.1;
        this.lastTime = timestamp;

        this.update(this.deltaTime);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    },

    update(dt) {
        if (this.state !== 'PLAYING') return;

        // Update level intro
        if (this.levelIntro.timer > 0) {
            this.levelIntro.timer -= dt;
            if (this.levelIntro.timer < 1) {
                this.levelIntro.opacity = this.levelIntro.timer;
            } else {
                this.levelIntro.opacity = 1;
            }
        } else {
            this.levelIntro.opacity = 0;
        }

        // Update player
        if (window.Player && Player.active) {
            Player.update(dt);

            // Update camera to follow player with zoom smoothing
            const centerX = this.width / (2 * this.zoom);
            const centerY = this.height / (2 * this.zoom);

            this.camera.targetX = Player.x - centerX;
            this.camera.targetY = Player.y - centerY;

            this.camera.x += (this.camera.targetX - this.camera.x) * 0.1;
            this.camera.y += (this.camera.targetY - this.camera.y) * 0.1;
        }

        // Update screen shake
        if (this.camera.shake > 0) {
            this.camera.shake *= 0.9;
            if (this.camera.shake < 0.1) this.camera.shake = 0;
        }

        // Level updates (collisions with walls)
        Level.update(dt);

        // Entities (enemies/bosses)
        for (let i = this.entities.length - 1; i >= 0; i--) {
            let e = this.entities[i];
            e.update(dt);
            if (e.dead) {
                this.entities.splice(i, 1);
            }
        }

        // Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update(dt);
            if (p.dead) {
                this.projectiles.splice(i, 1);
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].dead) this.particles.splice(i, 1);
        }
    },

    draw() {
        this.ctx.fillStyle = '#111122';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.state === 'MENU') return;

        this.ctx.save();

        // Apply zoom scale
        this.ctx.scale(this.zoom, this.zoom);

        // Apply camera and shake
        let camX = this.camera.x;
        let camY = this.camera.y;

        if (this.camera.shake > 0) {
            camX += (Math.random() - 0.5) * this.camera.shake;
            camY += (Math.random() - 0.5) * this.camera.shake;
        }

        this.ctx.translate(-Math.floor(camX), -Math.floor(camY));

        // Draw Level Floors & Walls
        Level.draw(this.ctx);

        // Draw all game objects sorted by Y depth for a bit of isometric feel (optional, mostly top down)
        let renderables = [].concat(this.entities, this.projectiles, window.Player && Player.active ? [Player] : []);
        renderables.sort((a, b) => a.y - b.y);

        for (let r of renderables) {
            r.draw(this.ctx);
        }

        // Particles on top
        this.ctx.globalCompositeOperation = 'lighter';
        for (let p of this.particles) {
            p.draw(this.ctx);
        }
        this.ctx.globalCompositeOperation = 'source-over';
        if (window.Player && Player.active) {
            const gradient = this.ctx.createRadialGradient(
                Player.x, Player.y, 100,
                Player.x, Player.y, 600
            );
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, 'rgba(0,0,5,0.8)');

            this.ctx.fillStyle = gradient;

            // Ensure gradient covers the whole screen by drawing a very large rectangle relative to player
            const coverSize = Math.max(this.width, this.height) + 1200;
            this.ctx.fillRect(Player.x - coverSize / 2, Player.y - coverSize / 2, coverSize, coverSize);
        }

        this.ctx.restore();

        // Draw Level Intro Overlay
        if (this.levelIntro.opacity > 0) {
            this.drawLevelIntro();
        }
    },

    drawLevelIntro() {
        this.ctx.save();
        this.ctx.fillStyle = `rgba(10, 10, 20, ${this.levelIntro.opacity * 0.7})`;
        this.ctx.fillRect(0, this.height / 2 - 50, this.width, 100);

        this.ctx.font = '32px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.fillStyle = `rgba(0, 255, 255, ${this.levelIntro.opacity})`;
        this.ctx.fillText(this.levelIntro.title, this.width / 2, this.height / 2);

        // Draw pixel border for intro
        this.ctx.strokeStyle = `rgba(0, 255, 255, ${this.levelIntro.opacity * 0.5})`;
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([8, 8]); // Pixelated dash
        this.ctx.strokeRect(0, this.height / 2 - 50, this.width, 100);
        this.ctx.restore();
    }
};
