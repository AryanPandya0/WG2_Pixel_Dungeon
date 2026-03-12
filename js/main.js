// main.js - Initializes menus and game start

document.addEventListener('DOMContentLoaded', () => {
    
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const mainMenuUrl = document.getElementById('main-menu');
    const gameOverUrl = document.getElementById('game-over');
    const victoryUrl = document.getElementById('victory-screen');
    
    // Disable start button until assets load
    startBtn.innerText = 'Loading Assets...';
    startBtn.disabled = true;
    
    Assets.loadAll(() => {
        startBtn.innerText = 'Enter the Dungeon';
        startBtn.disabled = false;
    });
    
    function startGame() {
        mainMenuUrl.classList.add('hidden');
        gameOverUrl.classList.add('hidden');
        victoryUrl.classList.add('hidden');
        
        Engine.state = 'PLAYING';
        Level.init(1);
    }
    
    startBtn.addEventListener('click', () => {
        if(startBtn.disabled) return;
        Engine.init();
        startGame();
    });
    
    restartBtn.addEventListener('click', () => {
        startGame();
    });
    
    playAgainBtn.addEventListener('click', () => {
        startGame();
    });

});
