const Input = {
    keys: {},
    mouse: { x: 0, y: 0, down: false },
    
    init() {
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        canvas.addEventListener('mousedown', () => this.mouse.down = true);
        canvas.addEventListener('mouseup', () => this.mouse.down = false);
    },
    
    isDown(code) {
        return !!this.keys[code];
    }
};

Input.init();
