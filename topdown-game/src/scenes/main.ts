import { Scene } from 'your-scene-library'; // Substitua pelo nome correto da biblioteca de cena
import { Player } from '../entities/player';
import { MapGenerator } from '../engine/map-generator';
import { TilesetLoader } from '../engine/tileset-loader';
import { Tilemap } from '../engine/tilemap';

export class MainScene extends Scene {
    private player: Player;
    private mapGenerator: MapGenerator;
    private tilemap: Tilemap;

    constructor() {
        super();
        this.mapGenerator = new MapGenerator();
        this.tilemap = new Tilemap();
        this.player = new Player();
    }

    preload() {
        // Carregar assets necessários
        TilesetLoader.load();
        this.mapGenerator.loadAssets();
    }

    create() {
        // Gerar o mapa e adicionar o jogador
        this.tilemap.generate(this.mapGenerator.generateMap());
        this.addEntity(this.player);
    }

    update(deltaTime: number) {
        // Atualizar lógica do jogo
        this.player.update(deltaTime);
        this.tilemap.update(deltaTime);
    }

    render() {
        // Renderizar o mapa e o jogador
        this.tilemap.render();
        this.player.render();
    }
}