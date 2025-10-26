import { loadTilesets } from '../engine/tileset-loader';
import { loadAssets } from '../assets/loader';

export function initializeGameAssets() {
    const tilesets = loadTilesets();
    const assets = loadAssets();
    
    return { tilesets, assets };
}

export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}