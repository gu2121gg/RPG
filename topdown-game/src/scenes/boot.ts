import { Loader } from '../assets/loader';
import { Game } from '../game';

export class BootScene {
    private loader: Loader;

    constructor() {
        this.loader = new Loader();
    }

    public preload(): void {
        this.loader.loadAssets();
    }

    public create(): void {
        // Após carregar os assets, inicie a cena principal
        const game = new Game();
        game.start();
    }
}