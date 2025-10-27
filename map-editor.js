// ========================================
// CONFIGURAÇÃO E CARREGAMENTO
// ========================================

console.log('[MAP EDITOR] Iniciando...');

// ========================================
// ELEMENTOS DO DOM
// ========================================
const tilesetCanvas = document.getElementById('tileset-canvas');
const mapCanvas = document.getElementById('map-canvas');
const tilesetCtx = tilesetCanvas.getContext('2d');
const mapCtx = mapCanvas.getContext('2d');

// Desabilitar antialiasing para pixel art
tilesetCtx.imageSmoothingEnabled = false;
mapCtx.imageSmoothingEnabled = false;

// ========================================
// CONSTANTES
// ========================================
const TILESET_TILE_SIZE = 16; // Tamanho original no tileset
let TILESET_COLS = 64;        // Colunas no tileset (será calculado)
let TILESET_ROWS = 64;        // Linhas no tileset (será calculado)
const MAX_HISTORY = 50;       // Máximo de ações no histórico

// ========================================
// CARREGAR TILESET
// ========================================
const tileset = new Image();
tileset.src = 'assets/Tilesets/spr_tileset_sunnysideworld_16px.png';

tileset.onload = () => {
    console.log('Tileset carregado');
    console.log(`Tamanho: ${tileset.width}x${tileset.height}px`);
    
    // Calcular dimensões reais do tileset
    TILESET_COLS = Math.floor(tileset.width / TILESET_TILE_SIZE);
    TILESET_ROWS = Math.floor(tileset.height / TILESET_TILE_SIZE);
    
    console.log(`Grid: ${TILESET_COLS}x${TILESET_ROWS} tiles`);
    console.log(`Total de tiles disponiveis: ${TILESET_COLS * TILESET_ROWS}`);
    
    // Configurar canvas do tileset
    const scale = 2; // Escala para visualização
    tilesetCanvas.width = tileset.width * scale;
    tilesetCanvas.height = tileset.height * scale;
    
    // Desenhar tileset inicial
    drawTileset();
    initializeEditor();
};

tileset.onerror = () => {
    console.error('[ERROR] Erro ao carregar tileset');
    alert('Erro: Não foi possível carregar o tileset. Verifique o caminho do arquivo.');
};

// ========================================
// ESTADO DO EDITOR
// ========================================
const editor = {
    // Ferramenta atual
    currentTool: 'brush',
    
    // Tile selecionado no tileset
    selectedTile: null,
    
    // Última posição desenhada (para evitar redesenhar)
    lastDrawnTile: null,
    
    // Camada ativa
    currentLayer: 'ground',
    
    // Zoom
    zoom: 1.0,
    minZoom: 0.25,
    maxZoom: 4.0,
    
    // Configurações visuais
    showGrid: true,
    showCollision: true,
    
    // Modo de desenho
    drawMode: 'replace', // 'replace' ou 'overlay'
    
    
    // Dimensões do mapa
    mapWidth: 40,
    mapHeight: 40,
    tileSize: 32,
    
    // Histórico de ações
    history: [],
    historyIndex: -1,
    
    // Seleção de área
    selection: null,
    
    // Clipboard
    clipboard: null,
    
    // Definir spawn
    settingSpawn: false,
    
    // Multi-seleção de tiles
    multiSelect: {
        active: false,
        startTile: null,
        endTile: null,
        tiles: []
    }
};

// ========================================
// DADOS DO MAPA - Full HD com zoom 2x (1920x1080)
// ========================================
const mapData = {
    name: 'Sem título',
    width: 30,   // 1920 / 64 = 30 tiles (zoom 2x)
    height: 17,  // 1080 / 64 = 17 tiles (zoom 2x)
    tileSize: 64, // Tiles maiores para zoom
    
    layers: {
        ground: [],
        objects: [],
        collision: []
    },
    
    spawn: {
        x: 15,  // Centro horizontal (30 / 2)
        y: 8    // Centro vertical (17 / 2)
    },
    
    metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
    }
};

// ========================================
// INICIALIZAR CAMADAS
// ========================================
function initializeLayers() {
    const layers = ['ground', 'objects', 'collision'];
    
    layers.forEach(layer => {
        mapData.layers[layer] = [];
        for (let y = 0; y < mapData.height; y++) {
            mapData.layers[layer][y] = [];
            for (let x = 0; x < mapData.width; x++) {
                mapData.layers[layer][y][x] = null;
            }
        }
    });
    
    console.log(`[INIT] Camadas inicializadas: ${mapData.width}x${mapData.height}`);
}

// ========================================
// CONFIGURAR CANVAS DO MAPA
// ========================================
function setupMapCanvas() {
    mapCanvas.width = mapData.width * mapData.tileSize * editor.zoom;
    mapCanvas.height = mapData.height * mapData.tileSize * editor.zoom;
    
    console.log(`[INIT] Canvas do mapa: ${mapCanvas.width}x${mapCanvas.height}px`);
}

// ========================================
// INICIALIZAR EDITOR
// ========================================
function initializeEditor() {
    console.log('[INIT] Inicializando editor...');
    
    // Inicializar estruturas
    initializeLayers();
    setupMapCanvas();
    
    // Desenhar mapa inicial
    drawMap();
    
    // Atualizar UI
    updateUI();
    
    console.log('[INIT] Editor pronto');
}

// ========================================
// ATUALIZAR UI
// ========================================
function updateUI() {
    // Atualizar informações do mapa
    const layerNames = {
        'ground': 'Chao',
        'objects': 'Objetos',
        'collision': 'Colisao'
    };
    document.getElementById('map-info').textContent = `Mapa: ${mapData.name} | Camada: ${layerNames[editor.currentLayer]}`;
    
    // Atualizar zoom
    document.getElementById('zoom-level').textContent = `${Math.round(editor.zoom * 100)}%`;
    
    // Atualizar tile selecionado
    if (editor.multiSelect.active && editor.multiSelect.tiles.length > 1) {
        const count = editor.multiSelect.tiles.length;
        const [startRow, startCol] = editor.multiSelect.startTile;
        const [endRow, endCol] = editor.multiSelect.endTile;
        const width = Math.abs(endCol - startCol) + 1;
        const height = Math.abs(endRow - startRow) + 1;
        document.getElementById('selected-tile-info').textContent = `Multi: ${width}x${height} (${count} tiles)`;
    } else if (editor.selectedTile) {
        const [row, col] = editor.selectedTile;
        document.getElementById('selected-tile-info').textContent = `Linha ${row}, Coluna ${col}`;
    } else {
        document.getElementById('selected-tile-info').textContent = 'Nenhum';
    }
    
    // Atualizar spawn
    document.getElementById('spawn-info').textContent = `X: ${mapData.spawn.x}, Y: ${mapData.spawn.y}`;
}

// ========================================
// DESENHAR TILESET
// ========================================
function drawTileset() {
    const scale = 2;
    
    // Limpar canvas
    tilesetCtx.clearRect(0, 0, tilesetCanvas.width, tilesetCanvas.height);
    
    // Desenhar tileset
    tilesetCtx.drawImage(
        tileset,
        0, 0,
        tileset.width,
        tileset.height,
        0, 0,
        tileset.width * scale,
        tileset.height * scale
    );
    
    // Desenhar grid
    if (document.getElementById('show-grid-tileset').checked) {
        drawTilesetGrid(scale);
    }
    
    // Destacar tile selecionado
    if (editor.selectedTile) {
        highlightSelectedTile(scale);
    }
}

// Desenhar grid no tileset
function drawTilesetGrid(scale) {
    const tileSize = TILESET_TILE_SIZE * scale;
    
    tilesetCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    tilesetCtx.lineWidth = 1;
    
    // Linhas verticais
    for (let x = 0; x <= TILESET_COLS; x++) {
        tilesetCtx.beginPath();
        tilesetCtx.moveTo(x * tileSize, 0);
        tilesetCtx.lineTo(x * tileSize, tilesetCanvas.height);
        tilesetCtx.stroke();
    }
    
    // Linhas horizontais
    for (let y = 0; y <= TILESET_ROWS; y++) {
        tilesetCtx.beginPath();
        tilesetCtx.moveTo(0, y * tileSize);
        tilesetCtx.lineTo(tilesetCanvas.width, y * tileSize);
        tilesetCtx.stroke();
    }
}

// Destacar tile(s) selecionado(s) no tileset
function highlightSelectedTile(scale) {
    const tileSize = TILESET_TILE_SIZE * scale;
    
    if (editor.multiSelect.active && editor.multiSelect.tiles.length > 0) {
        // Multi-seleção: desenhar retângulo ao redor de todos
        const tiles = editor.multiSelect.tiles;
        let minRow = Infinity, minCol = Infinity;
        let maxRow = -Infinity, maxCol = -Infinity;
        
        tiles.forEach(([row, col]) => {
            minRow = Math.min(minRow, row);
            minCol = Math.min(minCol, col);
            maxRow = Math.max(maxRow, row);
            maxCol = Math.max(maxCol, col);
        });
        
        tilesetCtx.strokeStyle = '#00ff00';
        tilesetCtx.lineWidth = 3;
        tilesetCtx.strokeRect(
            minCol * tileSize,
            minRow * tileSize,
            (maxCol - minCol + 1) * tileSize,
            (maxRow - minRow + 1) * tileSize
        );
        
        // Preencher com transparência
        tilesetCtx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        tilesetCtx.fillRect(
            minCol * tileSize,
            minRow * tileSize,
            (maxCol - minCol + 1) * tileSize,
            (maxRow - minRow + 1) * tileSize
        );
    } else if (editor.selectedTile) {
        // Seleção simples
        const [row, col] = editor.selectedTile;
        tilesetCtx.strokeStyle = '#00ff00';
        tilesetCtx.lineWidth = 3;
        tilesetCtx.strokeRect(
            col * tileSize,
            row * tileSize,
            tileSize,
            tileSize
        );
    }
}

// ========================================
// DESENHAR MAPA
// ========================================
function drawMap() {
    const destSize = mapData.tileSize * editor.zoom;
    
    // Limpar canvas
    mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    
    // Desenhar camada de chão
    drawMapLayer('ground', destSize);
    
    // Desenhar camada de objetos
    drawMapLayer('objects', destSize);
    
    // Desenhar camada de colisão
    if (editor.showCollision) {
        drawCollisionLayer(destSize);
    }
    
    // Desenhar grid
    if (editor.showGrid) {
        drawMapGrid(destSize);
    }
    
    // Desenhar seleção
    if (editor.selection) {
        drawSelection(destSize);
    }
    
    // Desenhar spawn
    drawSpawn(destSize);
}

function drawMapLayer(layerName, destSize) {
    const layer = mapData.layers[layerName];
    
    for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
            const tile = layer[y][x];
            
            if (tile && Array.isArray(tile)) {
                const [tileRow, tileCol] = tile;
                
                mapCtx.drawImage(
                    tileset,
                    tileCol * TILESET_TILE_SIZE,
                    tileRow * TILESET_TILE_SIZE,
                    TILESET_TILE_SIZE,
                    TILESET_TILE_SIZE,
                    x * destSize,
                    y * destSize,
                    destSize,
                    destSize
                );
            } else if (layerName === 'ground') {
                // Fundo padrão para camada ground
                mapCtx.fillStyle = '#6ab04c';
                mapCtx.fillRect(x * destSize, y * destSize, destSize, destSize);
            }
        }
    }
}

function drawCollisionLayer(destSize) {
    const layer = mapData.layers.collision;
    
    for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
            if (layer[y][x]) {
                mapCtx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                mapCtx.fillRect(x * destSize, y * destSize, destSize, destSize);
                
                // X vermelho
                mapCtx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                mapCtx.lineWidth = 2;
                mapCtx.beginPath();
                mapCtx.moveTo(x * destSize, y * destSize);
                mapCtx.lineTo((x + 1) * destSize, (y + 1) * destSize);
                mapCtx.moveTo((x + 1) * destSize, y * destSize);
                mapCtx.lineTo(x * destSize, (y + 1) * destSize);
                mapCtx.stroke();
            }
        }
    }
}

function drawMapGrid(destSize) {
    mapCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    mapCtx.lineWidth = 1;
    
    // Linhas verticais
    for (let x = 0; x <= mapData.width; x++) {
        mapCtx.beginPath();
        mapCtx.moveTo(x * destSize, 0);
        mapCtx.lineTo(x * destSize, mapCanvas.height);
        mapCtx.stroke();
    }
    
    // Linhas horizontais
    for (let y = 0; y <= mapData.height; y++) {
        mapCtx.beginPath();
        mapCtx.moveTo(0, y * destSize);
        mapCtx.lineTo(mapCanvas.width, y * destSize);
        mapCtx.stroke();
    }
}

function drawSpawn(destSize) {
    const x = mapData.spawn.x * destSize + destSize / 2;
    const y = mapData.spawn.y * destSize + destSize / 2;
    
    // Círculo amarelo
    mapCtx.fillStyle = '#ffff00';
    mapCtx.beginPath();
    mapCtx.arc(x, y, destSize / 3, 0, Math.PI * 2);
    mapCtx.fill();
    
    // Borda
    mapCtx.strokeStyle = '#ffff00';
    mapCtx.lineWidth = 2;
    mapCtx.stroke();
}

console.log('[INIT] Parte 1: Configuracao e Carregamento - OK');

// ========================================
// DETECÇÃO AUTOMÁTICA DE CAMADA
// ========================================

// Detectar se um tile é chão ou objeto baseado na posição no tileset
function detectTileLayer(tileRow, tileCol) {
    // Tiles de chão (ground) - primeiras 3 linhas são geralmente terrenos
    // Linha 0: Gramas variadas
    // Linha 1: Terra, pedras, caminhos
    // Linha 2: Água, lama, areia
    const isGroundRow = tileRow <= 2;
    
    if (isGroundRow) {
        return 'ground';
    }
    
    // Linhas 3+ são objetos (árvores, flores, pedras grandes, etc)
    return 'objects';
}

// Aplicar camada automaticamente baseado no tile selecionado
function applyAutoLayer() {
    if (!editor.autoLayer || !editor.selectedTile) return;
    
    const [tileRow, tileCol] = editor.selectedTile;
    const detectedLayer = detectTileLayer(tileRow, tileCol);
    
    // Só muda se for diferente
    if (detectedLayer !== editor.currentLayer) {
        setLayer(detectedLayer);
        console.log(`[AUTO-LAYER] Tile [${tileRow},${tileCol}] detectado como: ${detectedLayer}`);
    }
}

// ========================================
// FERRAMENTAS (PINCEL E BORRACHA)
// ========================================

// Converter coordenadas do mouse para coordenadas de tile no mapa
function mouseToMapTile(mouseX, mouseY) {
    const rect = mapCanvas.getBoundingClientRect();
    const x = mouseX - rect.left;
    const y = mouseY - rect.top;
    
    const tileSize = mapData.tileSize * editor.zoom;
    
    const tileX = Math.floor(x / tileSize);
    const tileY = Math.floor(y / tileSize);
    
    if (tileX < 0 || tileX >= mapData.width || tileY < 0 || tileY >= mapData.height) {
        return null;
    }
    
    return { x: tileX, y: tileY };
}

// Converter coordenadas do mouse para coordenadas de tile no tileset
function mouseToTilesetTile(mouseX, mouseY) {
    const rect = tilesetCanvas.getBoundingClientRect();
    const x = mouseX - rect.left;
    const y = mouseY - rect.top;
    
    const scale = 2;
    const tileSize = TILESET_TILE_SIZE * scale;
    
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);
    
    // Verificar limites (agora usa todas as linhas do tileset)
    if (col < 0 || col >= TILESET_COLS || row < 0 || row >= TILESET_ROWS) {
        return null;
    }
    
    return [row, col];
}

// Ferramenta: Pincel
function useBrush(tileX, tileY) {
    if (!editor.selectedTile && !editor.multiSelect.active) {
        console.warn('[BRUSH] Nenhum tile selecionado');
        return;
    }
    
    // Não redesenhar o mesmo tile
    if (editor.lastDrawnTile && 
        editor.lastDrawnTile.x === tileX && 
        editor.lastDrawnTile.y === tileY) {
        return;
    }
    
    const layer = mapData.layers[editor.currentLayer];
    
    // Multi-seleção: desenhar padrão de tiles
    if (editor.multiSelect.active && editor.multiSelect.tiles.length > 1) {
        const tiles = editor.multiSelect.tiles;
        
        // Calcular offset da seleção
        const [startRow, startCol] = editor.multiSelect.startTile;
        
        tiles.forEach(([tileRow, tileCol]) => {
            const offsetY = tileRow - startRow;
            const offsetX = tileCol - startCol;
            
            const targetY = tileY + offsetY;
            const targetX = tileX + offsetX;
            
            // Verificar limites
            if (targetX >= 0 && targetX < mapData.width && 
                targetY >= 0 && targetY < mapData.height) {
                
                // Modo overlay: só desenha se estiver vazio
                if (editor.drawMode === 'overlay' && layer[targetY][targetX] !== null) {
                    return; // Não sobrescreve
                }
                
                layer[targetY][targetX] = [tileRow, tileCol];
            }
        });
    } else {
        // Seleção simples: desenhar um tile
        const oldValue = layer[tileY][tileX];
        
        // Modo overlay: só desenha se estiver vazio
        if (editor.drawMode === 'overlay' && oldValue !== null) {
            console.log('[BRUSH] Modo overlay: tile ja ocupado, pulando');
            return;
        }
        
        layer[tileY][tileX] = [...editor.selectedTile];
        
        addToHistory({ type: 'paint', layer: editor.currentLayer, x: tileX, y: tileY, oldValue, newValue: [...editor.selectedTile] });
    }
    
    // Atualizar última posição desenhada
    editor.lastDrawnTile = { x: tileX, y: tileY };
    
    // Redesenhar mapa
    drawMap();
}

// Ferramenta: Borracha
function useEraser(tileX, tileY) {
    // Não apagar o mesmo tile repetidamente
    if (editor.lastDrawnTile && 
        editor.lastDrawnTile.x === tileX && 
        editor.lastDrawnTile.y === tileY) {
        return;
    }
    
    const layer = mapData.layers[editor.currentLayer];
    const oldValue = layer[tileY][tileX];
    
    // Apagar tile
    layer[tileY][tileX] = null;
    
    // Atualizar última posição
    editor.lastDrawnTile = { x: tileX, y: tileY };
    
    // Redesenhar mapa
    drawMap();
    
    // Adicionar ao histórico
    addToHistory({ type: 'erase', layer: editor.currentLayer, x: tileX, y: tileY, oldValue });
}

// Trocar ferramenta ativa
function setTool(toolName) {
    editor.currentTool = toolName;
    
    // Atualizar UI dos botões
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tool === toolName) {
            btn.classList.add('active');
        }
    });
    
    // Atualizar cursor do canvas
    mapCanvas.className = `${toolName}-tool`;
    
    console.log(`[TOOL] Ferramenta ativa: ${toolName}`);
}

// Alternar modo de desenho
function toggleDrawMode() {
    if (editor.drawMode === 'replace') {
        editor.drawMode = 'overlay';
        console.log('[MODE] Modo overlay: nao sobrescreve tiles existentes');
    } else {
        editor.drawMode = 'replace';
        console.log('[MODE] Modo replace: substitui tiles existentes');
    }
    
    // Atualizar UI
    updateDrawModeUI();
}

// Atualizar UI do modo de desenho
function updateDrawModeUI() {
    const btn = document.getElementById('btn-draw-mode');
    if (btn) {
        if (editor.drawMode === 'overlay') {
            btn.textContent = 'Modo: Overlay';
            btn.style.background = '#4CAF50';
            btn.title = 'Nao sobrescreve tiles existentes';
        } else {
            btn.textContent = 'Modo: Replace';
            btn.style.background = 'rgba(255,255,255,0.2)';
            btn.title = 'Substitui tiles existentes';
        }
    }
}

// ========================================
// FERRAMENTAS AVANÇADAS (PREENCHER E SELECIONAR)
// ========================================

// Ferramenta: Preencher (Flood Fill)
function useFill(startX, startY) {
    if (!editor.selectedTile) {
        console.warn('[FILL] Nenhum tile selecionado');
        return;
    }
    
    const layer = mapData.layers[editor.currentLayer];
    const targetTile = layer[startY][startX];
    const replacementTile = [...editor.selectedTile];
    
    // Se o tile já é o mesmo, não fazer nada
    if (tilesAreEqual(targetTile, replacementTile)) {
        return;
    }
    
    const visited = new Set();
    const stack = [[startX, startY]];
    
    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const key = `${x},${y}`;
        
        // Verificar se já visitou
        if (visited.has(key)) continue;
        
        // Verificar limites
        if (x < 0 || x >= mapData.width || y < 0 || y >= mapData.height) continue;
        
        // Verificar se o tile é igual ao alvo
        if (!tilesAreEqual(layer[y][x], targetTile)) continue;
        
        // Marcar como visitado
        visited.add(key);
        
        // Substituir tile
        layer[y][x] = [...replacementTile];
        
        // Adicionar vizinhos à pilha
        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
    }
    
    drawMap();
    console.log(`[FILL] Preenchimento realizado em ${visited.size} tiles`);
}

// Comparar se dois tiles são iguais
function tilesAreEqual(tile1, tile2) {
    if (tile1 === null && tile2 === null) return true;
    if (tile1 === null || tile2 === null) return false;
    return tile1[0] === tile2[0] && tile1[1] === tile2[1];
}

console.log('[INIT] Parte 2: Ferramentas - OK');

// ========================================
// SELEÇÃO, COPIAR E COLAR
// ========================================

// Ferramenta: Selecionar
function useSelect(tileX, tileY) {
    if (!editor.selection) {
        // Iniciar seleção
        editor.selection = {
            startX: tileX,
            startY: tileY,
            endX: tileX,
            endY: tileY
        };
    } else {
        // Atualizar seleção
        editor.selection.endX = tileX;
        editor.selection.endY = tileY;
    }
    
    drawMap();
}

// Desenhar seleção
function drawSelection(destSize) {
    if (!editor.selection) return;
    
    const x1 = Math.min(editor.selection.startX, editor.selection.endX);
    const y1 = Math.min(editor.selection.startY, editor.selection.endY);
    const x2 = Math.max(editor.selection.startX, editor.selection.endX);
    const y2 = Math.max(editor.selection.startY, editor.selection.endY);
    
    // Retângulo tracejado
    mapCtx.strokeStyle = '#00ff00';
    mapCtx.lineWidth = 2;
    mapCtx.setLineDash([5, 5]);
    mapCtx.strokeRect(
        x1 * destSize,
        y1 * destSize,
        (x2 - x1 + 1) * destSize,
        (y2 - y1 + 1) * destSize
    );
    mapCtx.setLineDash([]);
}

// Copiar área selecionada
function copySelection() {
    if (!editor.selection) {
        console.warn('[COPY] Nenhuma area selecionada');
        return;
    }
    
    const x1 = Math.min(editor.selection.startX, editor.selection.endX);
    const y1 = Math.min(editor.selection.startY, editor.selection.endY);
    const x2 = Math.max(editor.selection.startX, editor.selection.endX);
    const y2 = Math.max(editor.selection.startY, editor.selection.endY);
    
    const width = x2 - x1 + 1;
    const height = y2 - y1 + 1;
    
    editor.clipboard = {
        width,
        height,
        layers: {}
    };
    
    // Copiar todas as camadas
    ['ground', 'objects', 'collision'].forEach(layerName => {
        const layer = mapData.layers[layerName];
        editor.clipboard.layers[layerName] = [];
        
        for (let y = 0; y < height; y++) {
            editor.clipboard.layers[layerName][y] = [];
            for (let x = 0; x < width; x++) {
                const tile = layer[y1 + y][x1 + x];
                editor.clipboard.layers[layerName][y][x] = tile ? [...tile] : null;
            }
        }
    });
    
    console.log(`[COPY] Copiado: ${width}x${height} tiles`);
}

// Colar área copiada
function pasteSelection() {
    if (!editor.clipboard) {
        console.warn('[PASTE] Clipboard vazio');
        return;
    }
    
    if (!editor.selection) {
        console.warn('[PASTE] Selecione onde colar');
        return;
    }
    
    const pasteX = editor.selection.startX;
    const pasteY = editor.selection.startY;
    
    // Colar todas as camadas
    ['ground', 'objects', 'collision'].forEach(layerName => {
        const layer = mapData.layers[layerName];
        const clipLayer = editor.clipboard.layers[layerName];
        
        for (let y = 0; y < editor.clipboard.height; y++) {
            for (let x = 0; x < editor.clipboard.width; x++) {
                const destX = pasteX + x;
                const destY = pasteY + y;
                
                if (destX >= 0 && destX < mapData.width && 
                    destY >= 0 && destY < mapData.height) {
                    const tile = clipLayer[y][x];
                    layer[destY][destX] = tile ? [...tile] : null;
                }
            }
        }
    });
    
    drawMap();
    console.log(`[PASTE] Colado em (${pasteX}, ${pasteY})`);
}

// Cancelar seleção
function clearSelection() {
    editor.selection = null;
    drawMap();
}

// ========================================
// MULTI-SELEÇÃO DE TILES
// ========================================

// Atualizar lista de tiles selecionados
function updateMultiSelection() {
    if (!editor.multiSelect.active || !editor.multiSelect.startTile || !editor.multiSelect.endTile) {
        return;
    }
    
    const [startRow, startCol] = editor.multiSelect.startTile;
    const [endRow, endCol] = editor.multiSelect.endTile;
    
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    
    editor.multiSelect.tiles = [];
    
    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            editor.multiSelect.tiles.push([row, col]);
        }
    }
    
    // Atualizar selectedTile para compatibilidade com ferramentas antigas
    if (editor.multiSelect.tiles.length === 1) {
        editor.selectedTile = editor.multiSelect.tiles[0];
    }
}

// ========================================
// SISTEMA DE CAMADAS
// ========================================

// Trocar camada ativa
function setLayer(layerName) {
    editor.currentLayer = layerName;
    
    // Atualizar UI
    document.querySelectorAll('.layer-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.layer === layerName) {
            item.classList.add('active');
        }
    });
    
    // Atualizar header
    updateUI();
    
    console.log(`[LAYER] Camada ativa: ${layerName}`);
}

// Toggle visibilidade de camada
function toggleLayerVisibility(layerName, visible) {
    // A visibilidade é controlada pelos checkboxes
    drawMap();
}

// Zoom in
function zoomIn() {
    if (editor.zoom < editor.maxZoom) {
        editor.zoom = Math.min(editor.zoom * 1.25, editor.maxZoom);
        setupMapCanvas();
        drawMap();
        updateUI();
    }
}

// Zoom out
function zoomOut() {
    if (editor.zoom > editor.minZoom) {
        editor.zoom = Math.max(editor.zoom / 1.25, editor.minZoom);
        setupMapCanvas();
        drawMap();
        updateUI();
    }
}

// Definir spawn do player
function setSpawn() {
    console.log('[SPAWN] Clique no mapa para definir o spawn do player');
    // A posição será definida ao clicar no mapa
    editor.settingSpawn = true;
}

// Aplicar spawn
function applySpawn(tileX, tileY) {
    mapData.spawn.x = tileX;
    mapData.spawn.y = tileY;
    editor.settingSpawn = false;
    updateUI();
    drawMap();
    console.log(`[SPAWN] Spawn definido em (${tileX}, ${tileY})`);
}

console.log('[INIT] Parte 3: Selecao, Copiar/Colar, Camadas - OK');

// ========================================
// HISTÓRICO (DESFAZER/REFAZER)
// ========================================

// Adicionar ação ao histórico
function addToHistory(action) {
    // Remover ações após o índice atual
    editor.history = editor.history.slice(0, editor.historyIndex + 1);
    
    // Adicionar nova ação
    editor.history.push(action);
    
    // Limitar tamanho do histórico
    if (editor.history.length > MAX_HISTORY) {
        editor.history.shift();
    } else {
        editor.historyIndex++;
    }
    
    updateUndoRedoButtons();
}

// Desfazer última ação
function undo() {
    if (editor.historyIndex < 0) {
        console.warn('[UNDO] Nada para desfazer');
        return;
    }
    
    const action = editor.history[editor.historyIndex];
    editor.historyIndex--;
    
    // Reverter ação
    revertAction(action);
    drawMap();
    updateUndoRedoButtons();
    
    console.log('[UNDO] Acao desfeita');
}

// Refazer ação
function redo() {
    if (editor.historyIndex >= editor.history.length - 1) {
        console.warn('[REDO] Nada para refazer');
        return;
    }
    
    editor.historyIndex++;
    const action = editor.history[editor.historyIndex];
    
    // Reaplicar ação
    applyAction(action);
    drawMap();
    updateUndoRedoButtons();
    
    console.log('[REDO] Acao refeita');
}

// Reverter uma ação
function revertAction(action) {
    const layer = mapData.layers[action.layer];
    
    switch (action.type) {
        case 'paint':
        case 'erase':
            layer[action.y][action.x] = action.oldValue;
            break;
    }
}

// Aplicar uma ação
function applyAction(action) {
    const layer = mapData.layers[action.layer];
    
    switch (action.type) {
        case 'paint':
            layer[action.y][action.x] = action.newValue;
            break;
        case 'erase':
            layer[action.y][action.x] = null;
            break;
    }
}

// Atualizar estado dos botões undo/redo
function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    
    if (undoBtn) {
        undoBtn.disabled = editor.historyIndex < 0;
    }
    
    if (redoBtn) {
        redoBtn.disabled = editor.historyIndex >= editor.history.length - 1;
    }
}

// Limpar histórico
function clearHistory() {
    editor.history = [];
    editor.historyIndex = -1;
    updateUndoRedoButtons();
}

// ========================================
// SALVAR/CARREGAR/EXPORTAR
// ========================================

// Salvar mapa no Local Storage
function saveMap() {
    const name = prompt('Nome do mapa:', mapData.name);
    if (!name) return;
    
    mapData.name = name;
    mapData.metadata.lastModified = new Date().toISOString();
    
    const saveData = JSON.stringify(mapData);
    localStorage.setItem(`map_${name}`, saveData);
    
    updateUI();
    console.log(`[SAVE] Mapa "${name}" salvo`);
    alert(`Mapa "${name}" salvo com sucesso!`);
}

// Carregar mapa do Local Storage
function loadMap() {
    const name = prompt('Nome do mapa para carregar:');
    if (!name) return;
    
    const saveData = localStorage.getItem(`map_${name}`);
    if (!saveData) {
        alert('Mapa não encontrado!');
        return;
    }
    
    const loaded = JSON.parse(saveData);
    Object.assign(mapData, loaded);
    
    // Reconfigurar canvas
    setupMapCanvas();
    drawMap();
    updateUI();
    clearHistory();
    
    console.log(`[LOAD] Mapa "${name}" carregado`);
    alert(`Mapa "${name}" carregado com sucesso!`);
}

// Exportar mapa como JSON
function exportMap() {
    const json = JSON.stringify(mapData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mapData.name}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    console.log(`[EXPORT] Mapa exportado: ${mapData.name}.json`);
}

// Importar mapa de arquivo JSON
function importMap() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const loaded = JSON.parse(event.target.result);
                Object.assign(mapData, loaded);
                
                setupMapCanvas();
                drawMap();
                updateUI();
                clearHistory();
                
                console.log(`[IMPORT] Mapa importado: ${file.name}`);
                alert('Mapa importado com sucesso!');
            } catch (error) {
                alert('Erro ao importar mapa: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Criar novo mapa
function newMap() {
    if (!confirm('Criar novo mapa? Alterações não salvas serão perdidas.')) {
        return;
    }
    
    mapData.name = 'Sem título';
    mapData.metadata.created = new Date().toISOString();
    
    initializeLayers();
    setupMapCanvas();
    drawMap();
    updateUI();
    clearHistory();
    
    console.log('[NEW] Novo mapa criado');
}

// Testar mapa no jogo
function testMap() {
    // Salvar temporariamente no localStorage
    localStorage.setItem('tempMap', JSON.stringify(mapData));
    
    // Abrir jogo em nova aba com parâmetro de teste
    const gameUrl = 'index.html?test=true&t=' + Date.now();
    window.open(gameUrl, 'MapPreview');
    
    console.log('[TEST] Testando mapa em nova janela...');
    alert('Mapa sera aberto em nova janela!\n\nFeche a janela para voltar ao editor.');
}

console.log('[INIT] Parte 4: Historico e Salvar/Carregar - OK');

// ========================================
// EVENT LISTENERS
// ========================================

// Event Listeners - Tileset Canvas
let tilesetMouseDown = false;

tilesetCanvas.addEventListener('mousedown', (e) => {
    const tile = mouseToTilesetTile(e.clientX, e.clientY);
    if (tile) {
        tilesetMouseDown = true;
        editor.multiSelect.active = true;
        editor.multiSelect.startTile = tile;
        editor.multiSelect.endTile = tile;
        updateMultiSelection();
        drawTileset();
    }
});

tilesetCanvas.addEventListener('mousemove', (e) => {
    if (!tilesetMouseDown) return;
    
    const tile = mouseToTilesetTile(e.clientX, e.clientY);
    if (tile) {
        editor.multiSelect.endTile = tile;
        updateMultiSelection();
        drawTileset();
    }
});

tilesetCanvas.addEventListener('mouseup', () => {
    tilesetMouseDown = false;
    updateUI();
});

tilesetCanvas.addEventListener('mouseleave', () => {
    tilesetMouseDown = false;
});

// Event Listeners - Map Canvas
mapCanvas.addEventListener('mousedown', (e) => {
    const tile = mouseToMapTile(e.clientX, e.clientY);
    if (!tile) return;
    
    const { x: tileX, y: tileY } = tile;
    
    // Se está definindo spawn
    if (editor.settingSpawn) {
        applySpawn(tileX, tileY);
        return;
    }
    
    // Usar ferramenta atual
    switch (editor.currentTool) {
        case 'brush':
            useBrush(tileX, tileY);
            break;
        case 'eraser':
            useEraser(tileX, tileY);
            break;
        case 'fill':
            useFill(tileX, tileY);
            break;
        case 'select':
            useSelect(tileX, tileY);
            break;
    }
});

mapCanvas.addEventListener('mousemove', (e) => {
    const tile = mouseToMapTile(e.clientX, e.clientY);
    if (!tile) return;
    
    const { x: tileX, y: tileY } = tile;
    
    // Se mouse pressionado, continuar desenhando
    if (e.buttons === 1) {
        switch (editor.currentTool) {
            case 'brush':
                useBrush(tileX, tileY);
                break;
            case 'eraser':
                useEraser(tileX, tileY);
                break;
            case 'select':
                useSelect(tileX, tileY);
                break;
        }
    }
});

mapCanvas.addEventListener('mouseup', () => {
    editor.lastDrawnTile = null;
});

// Event Listeners - Botões
document.getElementById('btn-undo')?.addEventListener('click', undo);
document.getElementById('btn-redo')?.addEventListener('click', redo);
document.getElementById('btn-new')?.addEventListener('click', newMap);
document.getElementById('btn-save')?.addEventListener('click', saveMap);
document.getElementById('btn-load')?.addEventListener('click', importMap);
document.getElementById('btn-export')?.addEventListener('click', exportMap);
document.getElementById('btn-test')?.addEventListener('click', testMap);
document.getElementById('zoom-in')?.addEventListener('click', zoomIn);
document.getElementById('zoom-out')?.addEventListener('click', zoomOut);
document.getElementById('btn-set-spawn')?.addEventListener('click', setSpawn);
document.getElementById('btn-draw-mode')?.addEventListener('click', toggleDrawMode);

// Event Listeners - Camadas
document.querySelectorAll('.layer-item').forEach(item => {
    item.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
            setLayer(item.dataset.layer);
        }
    });
    
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (checkbox) {
        checkbox.addEventListener('change', () => {
            drawMap();
        });
    }
});

// Event Listeners - Ferramentas
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setTool(btn.dataset.tool);
    });
});

// Event Listeners - Checkboxes
document.getElementById('show-grid')?.addEventListener('change', (e) => {
    editor.showGrid = e.target.checked;
    drawMap();
});

document.getElementById('show-collision')?.addEventListener('change', (e) => {
    editor.showCollision = e.target.checked;
    drawMap();
});

document.getElementById('show-grid-tileset')?.addEventListener('change', () => {
    drawTileset();
});


// Event Listeners - Teclado
document.addEventListener('keydown', (e) => {
    // Atalhos de ferramentas
    if (!e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'b':
                setTool('brush');
                e.preventDefault();
                break;
            case 'e':
                setTool('eraser');
                e.preventDefault();
                break;
            case 'f':
                setTool('fill');
                e.preventDefault();
                break;
            case 's':
                setTool('select');
                e.preventDefault();
                break;
            case '+':
            case '=':
                zoomIn();
                e.preventDefault();
                break;
            case '-':
            case '_':
                zoomOut();
                e.preventDefault();
                break;
            case 'o':
                toggleDrawMode();
                e.preventDefault();
                break;
            case 'escape':
                clearSelection();
                e.preventDefault();
                break;
        }
    }
    
    // Atalhos com Ctrl
    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'z':
                undo();
                e.preventDefault();
                break;
            case 'y':
                redo();
                e.preventDefault();
                break;
            case 'c':
                copySelection();
                e.preventDefault();
                break;
            case 'v':
                pasteSelection();
                e.preventDefault();
                break;
            case 's':
                saveMap();
                e.preventDefault();
                break;
            case 'o':
                importMap();
                e.preventDefault();
                break;
            case 'e':
                exportMap();
                e.preventDefault();
                break;
        }
    }
});

// ========================================
// INICIALIZAÇÃO FINAL
// ========================================

// Atualizar botões iniciais
updateUndoRedoButtons();
updateDrawModeUI();

// ========================================
// LOG DE INICIALIZAÇÃO
// ========================================
console.log('[INIT] Parte 5: Event Listeners - OK');
console.log('[INIT] MAP EDITOR COMPLETO');
console.log('[INIT] Aguardando carregamento do tileset...');
