class TilesetLoader {
    private tilesets: Map<string, HTMLImageElement>;

    constructor() {
        this.tilesets = new Map();
    }

    public async loadTilesets(tilesetPaths: string[]): Promise<void> {
        const loadPromises = tilesetPaths.map(path => this.loadTileset(path));
        await Promise.all(loadPromises);
    }

    private loadTileset(path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = path;
            img.onload = () => {
                this.tilesets.set(path, img);
                resolve();
            };
            img.onerror = () => {
                reject(new Error(`Failed to load tileset at ${path}`));
            };
        });
    }

    public getTileset(path: string): HTMLImageElement | undefined {
        return this.tilesets.get(path);
    }
}