const Assets = {
    images: {},
    totalAssets: 0,
    loadedAssets: 0,
    
    // Mapping keys to image paths
    toLoad: {
        'floor': 'assets/floor.png',
        'wall': 'assets/wall.png',
        'stairs': 'assets/stairs.png',
        'player': 'assets/player.png',
        'skeleton': 'assets/skeleton.png',
        'goblin': 'assets/goblin.png',
        'The Slime King': 'assets/slime_boss.png',
        'The Shadow Knight': 'assets/knight_boss.png',
        'The Necromancer': 'assets/necro_boss.png'
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
            this.images[key] = img;
        }
    },
    
    get(key) {
        return this.images[key];
    }
};
