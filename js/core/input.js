const Input = {
    keys: {},
    mouse: { x: 0, y: 0, down: false },
    justPressed: {},
    
    init() {
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.justPressed[e.code] = true;
            }
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
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
    },

    wasPressed(code) {
        if (this.justPressed[code]) {
            this.justPressed[code] = false;
            return true;
        }
        return false;
    },

    // Call at end of each frame to clear justPressed states
    endFrame() {
        this.justPressed = {};
    }
};

Input.init();
