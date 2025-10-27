// ========================================
// CANVAS E CONFIGURAÇÃO
// ========================================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Configuração Full HD
canvas.width = 1920;
canvas.height = 1080;
ctx.imageSmoothingEnabled = false;

// ========================================
// CONSTANTES
// ========================================
const TILE_SIZE = 64;  // Aumentado de 32 para 64 (zoom 2x)
const PLAYER_SPEED = 5;  // Ajustado para a nova escala
const SPRITE_SCALE = 6;  // Dobrado para manter proporção

// Debug
let showCollisionDebug = false;

// ========================================
// MUNDO - Full HD (1920x1080)
// ========================================
// Com TILE_SIZE = 64: 1920/64 = 30 tiles, 1080/64 = 16.875 ≈ 17 tiles
let WORLD_WIDTH = 30;
let WORLD_HEIGHT = 17;

let worldMap = [];       // Camada de chão
let objectsLayer = [];   // Camada de objetos
let collisionLayer = []; // Camada de colisão

// ========================================
// CARREGAR ASSETS
// ========================================
const playerSprite = new Image();
playerSprite.src = 'assets/Player/Player.png';

const tileset = new Image();
tileset.src = 'assets/Tilesets/spr_tileset_sunnysideworld_16px.png';

let assetsLoaded = 0;
const totalAssets = 2;

function checkAssetsLoaded() {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
        console.log('[GAME] Assets carregados');
        loadDefaultMap();
        gameLoop();
    }
}

playerSprite.onload = () => {
    console.log('[GAME] Player sprite carregado');
    checkAssetsLoaded();
};

tileset.onload = () => {
    console.log('[GAME] Tileset carregado');
    checkAssetsLoaded();
};

playerSprite.onerror = () => {
    console.warn('[GAME] Erro ao carregar player sprite, usando fallback');
    checkAssetsLoaded();
};

tileset.onerror = () => {
    console.warn('[GAME] Erro ao carregar tileset, usando fallback');
    checkAssetsLoaded();
};

// ========================================
// PLAYER
// ========================================
const player = {
    x: (WORLD_WIDTH * TILE_SIZE) / 2,
    y: (WORLD_HEIGHT * TILE_SIZE) / 2,
    width: 32 * SPRITE_SCALE,
    height: 32 * SPRITE_SCALE,
    speed: PLAYER_SPEED,
    
    // Hitbox nos pés (reduzida em 40% para melhor precisão)
    hitbox: {
        offsetX: 70,   // 32 * 2 + 1 (1px para direita)
        offsetY: 116,  // 70 * 2 - 2 (2px para cima)
        width: 50,     // 80 * 0.6 (40% menor)
        height: 24     // 40 * 0.6 (40% menor)
    },
    
    // Animação
    direction: 'down',
    frame: 0,
    frameTick: 0,
    frameDelay: 8,
    isMoving: false,
    
    // Direções do spritesheet
    animations: {
        'down': 3,
        'right': 1,
        'left': 1,
        'up': 2
    }
};

// ========================================
// CÂMERA
// ========================================
const camera = {
    x: 0,
    y: 0,
    
    update() {
        // Centralizar câmera no player
        this.x = player.x - canvas.width / 2 + player.width / 2;
        this.y = player.y - canvas.height / 2 + player.height / 2;
        
        // Limitar aos limites do mundo
        const maxX = WORLD_WIDTH * TILE_SIZE - canvas.width;
        const maxY = WORLD_HEIGHT * TILE_SIZE - canvas.height;
        
        this.x = Math.max(0, Math.min(this.x, maxX));
        this.y = Math.max(0, Math.min(this.y, maxY));
    }
};

// ========================================
// CONTROLES
// ========================================
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    arrowup: false,
    arrowleft: false,
    arrowdown: false,
    arrowright: false
};

window.addEventListener('keydown', (e) => {
    // Toggle debug com tecla C
    if (e.key.toLowerCase() === 'c') {
        showCollisionDebug = !showCollisionDebug;
        const btn = document.getElementById('debug-btn');
        if (btn) {
            btn.classList.toggle('active', showCollisionDebug);
            btn.textContent = showCollisionDebug ? '✅ Debug ON' : '🔍 Debug Colisão';
        }
        console.log(`[DEBUG] Colisão: ${showCollisionDebug ? 'ON' : 'OFF'}`);
        e.preventDefault();
        return;
    }
    
    const key = e.key.toLowerCase();
    if (key in keys) {
        keys[key] = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) {
        keys[key] = false;
        e.preventDefault();
    }
});

// ========================================
// CARREGAR MAPA
// ========================================
function loadDefaultMap() {
    // Tentar carregar mapa do localStorage (vindo do editor)
    const tempMap = localStorage.getItem('tempMap');
    
    if (tempMap) {
        try {
            const mapData = JSON.parse(tempMap);
            console.log(`[GAME] Carregando mapa: ${mapData.name}`);
            
            WORLD_WIDTH = mapData.width;
            WORLD_HEIGHT = mapData.height;
            
            worldMap = mapData.layers.ground;
            objectsLayer = mapData.layers.objects;
            collisionLayer = mapData.layers.collision;
            
            // Definir spawn do player
            if (mapData.spawn) {
                player.x = mapData.spawn.x * TILE_SIZE;
                player.y = mapData.spawn.y * TILE_SIZE;
            }
            
            console.log(`[GAME] Mapa carregado: ${WORLD_WIDTH}x${WORLD_HEIGHT}`);
            return;
        } catch (error) {
            console.error('[GAME] Erro ao carregar mapa:', error);
        }
    }
    
    // Fallback: gerar mapa padrão Full HD
    console.log('[GAME] Gerando mapa padrão Full HD...');
    
    // Usar dimensões Full HD com zoom (30x17 tiles @ 64px)
    WORLD_WIDTH = 30;
    WORLD_HEIGHT = 17;
    
    // Inicializar arrays
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        worldMap[y] = [];
        objectsLayer[y] = [];
        collisionLayer[y] = [];
        
        for (let x = 0; x < WORLD_WIDTH; x++) {
            // Grama padrão
            worldMap[y][x] = [0, 0];
            objectsLayer[y][x] = null;
            collisionLayer[y][x] = false;
        }
    }
    
    console.log(`[GAME] Mapa padrão gerado: ${WORLD_WIDTH}x${WORLD_HEIGHT} (Full HD)`);
}

// ========================================
// DESENHAR CAMADAS
// ========================================
function drawLayer(layer, startRow, endRow, startCol, endCol, isGroundLayer = false) {
    if (!layer || layer.length === 0) return;
    
    for (let y = startRow; y < endRow; y++) {
        if (!layer[y]) continue;
        
        for (let x = startCol; x < endCol; x++) {
            const tile = layer[y][x];
            const screenX = x * TILE_SIZE - camera.x;
            const screenY = y * TILE_SIZE - camera.y;
            
            // Se for camada ground e tile vazio, desenhar grama padrão
            if (isGroundLayer) {
                if (!tile || !Array.isArray(tile) || tile === null) {
                    // Grama padrão (tile [0,0])
                    // Tileset é 16px, escalado para TILE_SIZE (64px = zoom 4x)
                    if (tileset.complete && tileset.naturalWidth > 0) {
                        ctx.drawImage(
                            tileset,
                            0, 0, 16, 16,
                            Math.floor(screenX),
                            Math.floor(screenY),
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else {
                        ctx.fillStyle = '#6ab04c';
                        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                    }
                } else {
                    // Desenhar tile específico
                    const [tileRow, tileCol] = tile;
                    ctx.drawImage(
                        tileset,
                        tileCol * 16,
                        tileRow * 16,
                        16,
                        16,
                        Math.floor(screenX),
                        Math.floor(screenY),
                        TILE_SIZE,
                        TILE_SIZE
                    );
                }
            } else {
                // Outras camadas: só desenhar se tile existir
                if (tile && Array.isArray(tile)) {
                    const [tileRow, tileCol] = tile;
                    
                    if (tileset.complete && tileset.naturalWidth > 0) {
                        ctx.drawImage(
                            tileset,
                            tileCol * 16,
                            tileRow * 16,
                            16,
                            16,
                            Math.floor(screenX),
                            Math.floor(screenY),
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    }
                }
            }
        }
    }
}

function drawMap() {
    const startCol = Math.floor(camera.x / TILE_SIZE);
    const endCol = Math.min(startCol + Math.ceil(canvas.width / TILE_SIZE) + 1, WORLD_WIDTH);
    const startRow = Math.floor(camera.y / TILE_SIZE);
    const endRow = Math.min(startRow + Math.ceil(canvas.height / TILE_SIZE) + 1, WORLD_HEIGHT);
    
    // 1. Desenhar camada de chão
    drawLayer(worldMap, startRow, endRow, startCol, endCol, true);
    
    // 2. Desenhar camada de objetos
    drawLayer(objectsLayer, startRow, endRow, startCol, endCol, false);
    
    // 3. Desenhar colisões (debug)
    if (showCollisionDebug) {
        drawCollisionDebug(startRow, endRow, startCol, endCol);
    }
}

// ========================================
// DEBUG DE COLISÃO
// ========================================
function drawCollisionDebug(startRow, endRow, startCol, endCol) {
    if (!collisionLayer || collisionLayer.length === 0) return;
    
    for (let y = startRow; y < endRow; y++) {
        if (!collisionLayer[y]) continue;
        
        for (let x = startCol; x < endCol; x++) {
            if (collisionLayer[y][x]) {
                const screenX = x * TILE_SIZE - camera.x;
                const screenY = y * TILE_SIZE - camera.y;
                
                // Retângulo vermelho
                ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                
                // Borda
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                ctx.lineWidth = 2;
                ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                
                // X
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX + TILE_SIZE, screenY + TILE_SIZE);
                ctx.moveTo(screenX + TILE_SIZE, screenY);
                ctx.lineTo(screenX, screenY + TILE_SIZE);
                ctx.stroke();
            }
        }
    }
}

// ========================================
// DESENHAR PLAYER
// ========================================
function drawPlayer() {
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;
    
    // Sprite do player (espelho para esquerda)
    const row = player.animations[player.direction];
    const col = player.isMoving ? Math.floor(player.frame) : 0;
    
    if (playerSprite.complete && playerSprite.naturalWidth > 0) {
        if (player.direction === 'left') {
            ctx.save();
            ctx.scale(-1, 1);
            const flippedX = -Math.floor(screenX + player.width);
            ctx.drawImage(
                playerSprite,
                col * 32,
                row * 32,
                32,
                32,
                flippedX,
                Math.floor(screenY),
                player.width,
                player.height
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                playerSprite,
                col * 32,
                row * 32,
                32,
                32,
                Math.floor(screenX),
                Math.floor(screenY),
                player.width,
                player.height
            );
        }
    } else {
        // Fallback
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(screenX, screenY, player.width, player.height);
    }
    
    // Desenhar hitbox em modo debug
    if (showCollisionDebug) {
        const hitboxScreenX = screenX + player.hitbox.offsetX;
        const hitboxScreenY = screenY + player.hitbox.offsetY;
        
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(hitboxScreenX, hitboxScreenY, player.hitbox.width, player.hitbox.height);
        
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.fillRect(hitboxScreenX, hitboxScreenY, player.hitbox.width, player.hitbox.height);
    }
}

// ========================================
// COLISÃO
// ========================================
function checkCollision(x, y) {
    const hitboxX = x + player.hitbox.offsetX;
    const hitboxY = y + player.hitbox.offsetY;
    const hitboxWidth = player.hitbox.width;
    const hitboxHeight = player.hitbox.height;
    
    // 4 cantos da hitbox
    const corners = [
        { x: Math.floor(hitboxX / TILE_SIZE), y: Math.floor(hitboxY / TILE_SIZE) },
        { x: Math.floor((hitboxX + hitboxWidth - 1) / TILE_SIZE), y: Math.floor(hitboxY / TILE_SIZE) },
        { x: Math.floor(hitboxX / TILE_SIZE), y: Math.floor((hitboxY + hitboxHeight - 1) / TILE_SIZE) },
        { x: Math.floor((hitboxX + hitboxWidth - 1) / TILE_SIZE), y: Math.floor((hitboxY + hitboxHeight - 1) / TILE_SIZE) }
    ];
    
    for (const corner of corners) {
        // Limites do mundo
        if (corner.x < 0 || corner.x >= WORLD_WIDTH || corner.y < 0 || corner.y >= WORLD_HEIGHT) {
            return true;
        }
        
        // Camada de colisão
        if (collisionLayer[corner.y] && collisionLayer[corner.y][corner.x]) {
            return true;
        }
    }
    
    return false;
}

// ========================================
// ATUALIZAR PLAYER
// ========================================
function updatePlayer() {
    let dx = 0;
    let dy = 0;
    
    if (keys.w || keys.arrowup) {
        dy -= 1;
        player.direction = 'up';
    }
    if (keys.s || keys.arrowdown) {
        dy += 1;
        player.direction = 'down';
    }
    if (keys.a || keys.arrowleft) {
        dx -= 1;
        player.direction = 'left';
    }
    if (keys.d || keys.arrowright) {
        dx += 1;
        player.direction = 'right';
    }
    
    player.isMoving = (dx !== 0 || dy !== 0);
    
    if (player.isMoving) {
        // Normalizar diagonal
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        // Tentar mover no eixo X
        const newX = player.x + dx * player.speed;
        if (!checkCollision(newX, player.y)) {
            player.x = newX;
        }
        
        // Tentar mover no eixo Y
        const newY = player.y + dy * player.speed;
        if (!checkCollision(player.x, newY)) {
            player.y = newY;
        }
        
        // Atualizar animação
        player.frameTick++;
        if (player.frameTick >= player.frameDelay) {
            player.frameTick = 0;
            player.frame = (player.frame + 1) % 4;
        }
    } else {
        player.frame = 0;
        player.frameTick = 0;
    }
}

// ========================================
// UI DE DEBUG
// ========================================
function drawDebugUI() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 280, 100);
    
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 280, 100);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('DEBUG MODE', 20, 35);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#ffff00';
    ctx.fillText('Colisoes visiveis', 20, 55);
    
    ctx.fillStyle = '#ff0000';
    ctx.fillText('Vermelho = Area bloqueada', 20, 75);
    
    ctx.fillStyle = '#00ff00';
    ctx.fillText('Verde = Hitbox do player', 20, 95);
}

// ========================================
// GAME LOOP
// ========================================
function gameLoop() {
    // Atualizar
    updatePlayer();
    camera.update();
    
    // Desenhar
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    drawPlayer();
    
    // UI de debug
    if (showCollisionDebug) {
        drawDebugUI();
    }
    
    // Continuar loop
    requestAnimationFrame(gameLoop);
}

// ========================================
// EVENT LISTENER - BOTÃO DEBUG
// ========================================
document.getElementById('debug-btn')?.addEventListener('click', () => {
    showCollisionDebug = !showCollisionDebug;
    const btn = document.getElementById('debug-btn');
    if (btn) {
        btn.classList.toggle('active', showCollisionDebug);
        btn.textContent = showCollisionDebug ? '✅ Debug ON' : '🔍 Debug Colisão';
    }
    console.log(`[DEBUG] Colisão: ${showCollisionDebug ? 'ON' : 'OFF'}`);
});

// ========================================
// INICIALIZAÇÃO
// ========================================
console.log('[GAME] Carregando assets...');
