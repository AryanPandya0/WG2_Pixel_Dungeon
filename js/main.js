// main.js - Initializes menus, particles background, and game start

document.addEventListener('DOMContentLoaded', () => {
    
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const mainMenuUrl = document.getElementById('main-menu');
    const gameOverUrl = document.getElementById('game-over');
    const victoryUrl = document.getElementById('victory-screen');
    const btnText = startBtn.querySelector('.btn-text');
    const btnIcon = startBtn.querySelector('.btn-icon');
    
    // Disable start button until assets load
    btnText.innerText = 'Loading Assets...';
    btnIcon.style.display = 'none';
    startBtn.disabled = true;
    
    Assets.loadAll(() => {
        btnText.innerText = 'Enter the Dungeon';
        btnIcon.style.display = '';
        startBtn.disabled = false;
    });

    // ========================================
    // MENU PARTICLE SYSTEM
    // ========================================
    const particleCanvas = document.getElementById('menuParticles');
    const pCtx = particleCanvas.getContext('2d');
    let menuParticles = [];
    let menuAnimId = null;

    function resizeParticleCanvas() {
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;
    }
    resizeParticleCanvas();
    window.addEventListener('resize', resizeParticleCanvas);

    // Particle class for ambient floating dots
    class MenuParticle {
        constructor() {
            this.reset();
            // Randomize starting y so they don't all start at the bottom
            this.y = Math.random() * particleCanvas.height;
        }

        reset() {
            this.x = Math.random() * particleCanvas.width;
            this.y = particleCanvas.height + Math.random() * 50;
            this.size = Math.random() * 2.5 + 0.5;
            this.speedY = -(Math.random() * 0.6 + 0.15);
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.fadeSpeed = Math.random() * 0.003 + 0.001;

            // Color palette: cyan, blue, purple, white
            const colors = [
                [0, 255, 255],    // Cyan
                [100, 180, 255],  // Light blue
                [150, 100, 255],  // Purple
                [200, 200, 255],  // White-ish
                [0, 200, 180],    // Teal
            ];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.pulse = Math.random() * Math.PI * 2;
            this.pulseSpeed = Math.random() * 2 + 1;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.pulse += 0.02 * this.pulseSpeed;

            // Fade in and out
            const pulseFactor = Math.sin(this.pulse) * 0.3 + 0.7;
            this.currentOpacity = this.opacity * pulseFactor;

            if (this.y < -20 || this.x < -20 || this.x > particleCanvas.width + 20) {
                this.reset();
            }
        }

        draw(ctx) {
            const [r, g, b] = this.color;
            // Glow
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${this.currentOpacity * 0.15})`;
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${this.currentOpacity})`;
            ctx.fill();
        }
    }

    // Initialize particles
    const PARTICLE_COUNT = 120;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        menuParticles.push(new MenuParticle());
    }

    // Ambient fog / nebula layer
    let fogTime = 0;

    function drawFog(ctx, w, h) {
        fogTime += 0.003;
        // Slow-moving gradient fog
        const x1 = w * 0.5 + Math.sin(fogTime * 0.7) * w * 0.3;
        const y1 = h * 0.4 + Math.cos(fogTime * 0.5) * h * 0.2;
        const grad = ctx.createRadialGradient(x1, y1, 0, x1, y1, w * 0.5);
        grad.addColorStop(0, 'rgba(0, 60, 100, 0.06)');
        grad.addColorStop(0.5, 'rgba(20, 0, 60, 0.04)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Second fog patch
        const x2 = w * 0.3 + Math.cos(fogTime * 0.4) * w * 0.2;
        const y2 = h * 0.6 + Math.sin(fogTime * 0.6) * h * 0.15;
        const grad2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, w * 0.35);
        grad2.addColorStop(0, 'rgba(0, 80, 80, 0.05)');
        grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, w, h);
    }

    function menuLoop() {
        const w = particleCanvas.width;
        const h = particleCanvas.height;
        pCtx.clearRect(0, 0, w, h);

        // Dark base
        pCtx.fillStyle = '#030510';
        pCtx.fillRect(0, 0, w, h);

        // Fog
        drawFog(pCtx, w, h);

        // Particles
        for (let p of menuParticles) {
            p.update();
            p.draw(pCtx);
        }

        menuAnimId = requestAnimationFrame(menuLoop);
    }

    // Start menu animation
    menuLoop();

    function stopMenuAnimation() {
        if (menuAnimId) {
            cancelAnimationFrame(menuAnimId);
            menuAnimId = null;
        }
    }
    
    const cutsceneOverlay = document.getElementById('cutscene-overlay');
    const csLines = [
        document.getElementById('cs-line-1'),
        document.getElementById('cs-line-2'),
        document.getElementById('cs-line-3'),
        document.getElementById('cs-line-4')
    ];
    const csBgs = [
        document.getElementById('cs-bg-1'),
        document.getElementById('cs-bg-2'),
        document.getElementById('cs-bg-3'),
        document.getElementById('cs-bg-4')
    ];
    let cutsceneActive = false;
    let cutsceneTimeouts = [];

    function playCutscene(onComplete) {
        cutsceneActive = true;
        mainMenuUrl.classList.add('hidden');
        cutsceneOverlay.classList.remove('hidden');
        
        csLines.forEach(line => line.classList.remove('visible'));
        csBgs.forEach(bg => bg.classList.remove('visible'));
        
        let delay = 1000;
        csLines.forEach((line, index) => {
            cutsceneTimeouts.push(setTimeout(() => {
                if (cutsceneActive) {
                    // Start fading out previous backgrounds
                    csBgs.forEach((bg, i) => { if (i !== index) bg.classList.remove('visible'); });
                    // Fade in new background
                    csBgs[index].classList.add('visible');
                    // Fade in text
                    line.classList.add('visible');
                }
            }, delay));
            delay += 2500;
        });
        
        cutsceneTimeouts.push(setTimeout(() => {
            finishCutscene(onComplete);
        }, delay + 2000));
    }

    function finishCutscene(onComplete) {
        if (!cutsceneActive) return;
        cutsceneActive = false;
        cutsceneTimeouts.forEach(clearTimeout);
        
        cutsceneOverlay.style.transition = 'opacity 1.5s ease-out';
        cutsceneOverlay.style.opacity = '0';
        
        setTimeout(() => {
            cutsceneOverlay.classList.add('hidden');
            cutsceneOverlay.style.opacity = '1';
            onComplete();
        }, 1500);
    }

    cutsceneOverlay.addEventListener('click', () => {
        if (cutsceneActive) {
            finishCutscene(() => {
                Engine.init();
                startGame();
            });
        }
    });

    function startGame() {
        stopMenuAnimation();
        mainMenuUrl.classList.add('hidden');
        gameOverUrl.classList.add('hidden');
        victoryUrl.classList.add('hidden');
        
        Engine.state = 'PLAYING';
        Level.init(1);
    }
    
    startBtn.addEventListener('click', () => {
        if(startBtn.disabled) return;
        stopMenuAnimation();
        playCutscene(() => {
            Engine.init();
            startGame();
        });
    });
    
    restartBtn.addEventListener('click', () => {
        startGame();
    });
    
    playAgainBtn.addEventListener('click', () => {
        startGame();
    });

});
