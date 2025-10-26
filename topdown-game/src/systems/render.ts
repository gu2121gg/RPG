import { Game } from '../game';
import { Tilemap } from '../engine/tilemap';
import { Player } from '../entities/player';

export class Renderer {
    private game: Game;
    private tilemap: Tilemap;

    constructor(game: Game, tilemap: Tilemap) {
        this.game = game;
        this.tilemap = tilemap;
    }

    public render() {
        this.clearCanvas();
        this.tilemap.render();
        this.renderEntities();
    }

    private clearCanvas() {
        const context = this.game.getContext();
        context.clearRect(0, 0, this.game.getWidth(), this.game.getHeight());
    }

    private renderEntities() {
        const context = this.game.getContext();
        const entities = this.game.getEntities();

        entities.forEach(entity => {
            if (entity instanceof Player) {
                this.renderPlayer(entity);
            }
            // Add more entity types as needed
        });
    }

    private renderPlayer(player: Player) {
        const context = this.game.getContext();
        context.drawImage(player.getSprite(), player.x, player.y);
    }
}