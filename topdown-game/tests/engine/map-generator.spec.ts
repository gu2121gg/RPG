import { MapGenerator } from '../../src/engine/map-generator';

describe('MapGenerator', () => {
    let mapGenerator: MapGenerator;

    beforeEach(() => {
        mapGenerator = new MapGenerator();
    });

    it('should create a map with the correct dimensions', () => {
        const width = 10;
        const height = 10;
        const map = mapGenerator.generateMap(width, height);
        expect(map).toHaveLength(height);
        expect(map[0]).toHaveLength(width);
    });

    it('should fill the map with default tiles', () => {
        const width = 5;
        const height = 5;
        const map = mapGenerator.generateMap(width, height);
        for (let row of map) {
            for (let tile of row) {
                expect(tile).toBeDefined();
            }
        }
    });

    it('should load tilesets correctly', async () => {
        await mapGenerator.loadTilesets();
        expect(mapGenerator.tilesets).toBeTruthy();
        expect(mapGenerator.tilesets.length).toBeGreaterThan(0);
    });

    it('should generate a map based on the loaded tilesets', async () => {
        await mapGenerator.loadTilesets();
        const map = mapGenerator.generateMapFromTilesets(10, 10);
        expect(map).toHaveLength(10);
        expect(map[0]).toHaveLength(10);
        // Additional checks can be added based on tileset properties
    });
});