import { Game } from './game';
import { BootScene } from './scenes/boot';
import { MainScene } from './scenes/main';

const game = new Game({
    width: 800,
    height: 600,
    scenes: [BootScene, MainScene],
});

game.start();