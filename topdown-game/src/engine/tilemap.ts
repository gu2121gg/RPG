class Tilemap {
    private tiles: number[][];
    private tileSize: number;

    constructor(tileSize: number) {
        this.tileSize = tileSize;
        this.tiles = [];
    }

    public loadMap(mapData: number[][]): void {
        this.tiles = mapData;
    }

    public render(context: CanvasRenderingContext2D): void {
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                const tile = this.tiles[y][x];
                this.drawTile(context, tile, x, y);
            }
        }
    }

    private drawTile(context: CanvasRenderingContext2D, tile: number, x: number, y: number): void {
        // Implement the logic to draw the tile based on its ID
        // For example, you could use a tileset to get the correct image
        context.fillStyle = this.getTileColor(tile);
        context.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
    }

    private getTileColor(tile: number): string {
        // Placeholder for tile color logic
        switch (tile) {
            case 0: return 'white'; // Example for empty tile
            case 1: return 'green'; // Example for grass tile
            case 2: return 'brown'; // Example for dirt tile
            default: return 'black'; // Default color
        }
    }
}