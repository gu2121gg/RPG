import { loadImage } from '../utils/index';
import { loadAudio } from '../utils/index';

export async function loadAssets() {
    const sprites = await loadSprites();
    const audio = await loadAudioFiles();
    return { sprites, audio };
}

async function loadSprites() {
    const spritePaths = [
        // Adicione os caminhos dos sprites aqui
    ];
    const spritePromises = spritePaths.map(path => loadImage(path));
    return Promise.all(spritePromises);
}

async function loadAudioFiles() {
    const audioPaths = [
        // Adicione os caminhos dos arquivos de áudio aqui
    ];
    const audioPromises = audioPaths.map(path => loadAudio(path));
    return Promise.all(audioPromises);
}