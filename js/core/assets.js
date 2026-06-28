const Assets = {
    images: {},
    totalAssets: 0,
    loadedAssets: 0,

    // Mapping keys to image paths — organized by subfolder
    toLoad: {
        // Environment
        'floor': 'assets/floor.png',
        'wall': 'assets/wall.png',
        'stairs': 'assets/stairs.png',

        // Player
        'player': 'assets/sprites/player.png',

        // Enemies
        'skeleton': 'assets/enemies/skeleton.png',
        'goblin': 'assets/enemies/goblin.png',
        'wraith': 'assets/enemies/wraith.png',
        'bomber_imp': 'assets/enemies/bomber_imp.png',
        'shield_bearer': 'assets/enemies/shield_bearer.png',
        'shadow_assassin': 'assets/enemies/shadow_assassin.png',
        'corrupted_totem': 'assets/enemies/corrupted_totem.png',
        'mimic': 'assets/enemies/mimic.png',

        // Bosses
        'The Slime King': 'assets/bosses/slime_boss.png',
        'The Shadow Knight': 'assets/bosses/knight_boss.png',
        'The Necromancer': 'assets/bosses/necro_boss.png'
    },

    loadAll(callback) {
        this.totalAssets = Object.keys(this.toLoad).length;
        if (this.totalAssets === 0) {
            if (callback) callback();
            return;
        }

        for (let key in this.toLoad) {
            let img = new Image();
            img.onload = () => {
                // If it's a character or boss, remove white background
                if (key !== 'floor' && key !== 'wall' && key !== 'stairs') {
                    this.images[key] = this.removeBackground(img);
                } else {
                    this.images[key] = img;
                }

                this.loadedAssets++;
                if (this.loadedAssets === this.totalAssets && callback) {
                    callback();
                }
            };
            img.onerror = () => {
                console.error("Failed to load image:", this.toLoad[key]);
                this.loadedAssets++;
                if (this.loadedAssets === this.totalAssets && callback) {
                    callback();
                }
            };
            img.src = this.toLoad[key];
        }
    },

    removeBackground(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Sample background color from top-left pixel (0,0)
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];
        const threshold = 30; // tolerance for AI artifacts

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Check if pixel color is similar to top-left pixel
            const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
            if (diff < threshold) {
                data[i + 3] = 0; // set alpha to 0
            }
        }

        ctx.putImageData(imageData, 0, 0);
        const newImg = new Image();
        newImg.src = canvas.toDataURL();
        return newImg;
    },

    get(key) {
        return this.images[key];
    }
};
