class MapGenerator {
    private tilesetLoader: TilesetLoader;

    constructor(tilesetLoader: TilesetLoader) {
        this.tilesetLoader = tilesetLoader;
    }

    public generateMap(width: number, height: number): number[][] {
        const map: number[][] = [];
        for (let y = 0; y < height; y++) {
            const row: number[] = [];
            for (let x = 0; x < width; x++) {
                const tileIndex = this.getRandomTileIndex();
                row.push(tileIndex);
            }
            map.push(row);
        }
        return map;
    }

    private getRandomTileIndex(): number {
        const tileset = this.tilesetLoader.getTileset();
        return Math.floor(Math.random() * tileset.length);
    }
}