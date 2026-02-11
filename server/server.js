const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;

// ── MIME types for static file serving ───────────────────────────────
const MIME = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

// Static files root — one level up from server/
const STATIC_ROOT = path.join(__dirname, '..');

// ── HTTP server (serves the game files) ──────────────────────────────
const httpServer = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';

    // Only serve files inside the game root (no traversal)
    const filePath = path.join(STATIC_ROOT, urlPath);
    if (!filePath.startsWith(STATIC_ROOT)) {
        res.writeHead(403); res.end('Forbidden'); return;
    }

    // Don't serve the server/ directory itself
    if (filePath.startsWith(path.join(STATIC_ROOT, 'server'))) {
        res.writeHead(403); res.end('Forbidden'); return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404); res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
});

// ── WebSocket server (upgrades from the same HTTP server) ────────────
const wss = new WebSocketServer({ server: httpServer });

const players = new Map();
let nextId = 1;

const adjectives = ['Swift', 'Bold', 'Dark', 'Iron', 'Shadow', 'Noble', 'Ancient', 'Mystic', 'Brave', 'Silent'];
const nouns = ['Knight', 'Mage', 'Archer', 'Warrior', 'Scout', 'Ranger', 'Rogue', 'Paladin', 'Hunter', 'Sage'];

function generateName() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 99);
    return `${adj}${noun}${num}`;
}

function broadcast(data, excludeWs = null) {
    const msg = JSON.stringify(data);
    for (const [ws] of players) {
        if (ws !== excludeWs && ws.readyState === 1) {
            ws.send(msg);
        }
    }
}

function broadcastAll(data) {
    const msg = JSON.stringify(data);
    for (const [ws] of players) {
        if (ws.readyState === 1) {
            ws.send(msg);
        }
    }
}

function getPlayerSnapshot(state) {
    return {
        id: state.id,
        name: state.name,
        x: state.x,
        y: state.y,
        z: state.z,
        yaw: state.yaw,
        pitch: state.pitch,
        equipment: state.equipment,
        combatLevel: state.combatLevel,
        isRunning: state.isRunning,
    };
}

// ── Connection handler ─────────────────────────────────────────────
wss.on('connection', (ws) => {
    const id = `p_${Date.now()}_${nextId++}`;
    const name = generateName();

    const state = {
        id,
        name,
        x: 0, y: 1.8, z: 0,
        yaw: 0, pitch: 0,
        equipment: { weapon: null, shield: null, body: null, legs: null, feet: null, head: null },
        combatLevel: 3,
        isRunning: false,
        lastUpdate: Date.now(),
    };

    players.set(ws, state);

    const ts = new Date().toLocaleTimeString();
    console.log(`[${ts}] ${name} (${id}) connected — ${players.size} online`);

    const existingPlayers = [];
    for (const [otherWs, otherState] of players) {
        if (otherWs !== ws) {
            existingPlayers.push(getPlayerSnapshot(otherState));
        }
    }

    ws.send(JSON.stringify({
        type: 'welcome',
        id,
        name,
        players: existingPlayers,
    }));

    broadcast({
        type: 'player_join',
        ...getPlayerSnapshot(state),
    }, ws);

    ws.on('message', (raw) => {
        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            return;
        }

        if (data.type === 'state') {
            state.x = data.x ?? state.x;
            state.y = data.y ?? state.y;
            state.z = data.z ?? state.z;
            state.yaw = data.yaw ?? state.yaw;
            state.pitch = data.pitch ?? state.pitch;
            state.equipment = data.equipment ?? state.equipment;
            state.combatLevel = data.combatLevel ?? state.combatLevel;
            state.isRunning = data.isRunning ?? state.isRunning;
            state.lastUpdate = Date.now();

            broadcast({
                type: 'player_update',
                ...getPlayerSnapshot(state),
            }, ws);

        } else if (data.type === 'chat') {
            let text = String(data.text || '').slice(0, 100).trim();
            if (!text) return;

            const ts = new Date().toLocaleTimeString();
            console.log(`[${ts}] [Chat] ${name}: ${text}`);

            broadcastAll({
                type: 'chat',
                id: state.id,
                name: state.name,
                text,
            });
        }
    });

    ws.on('close', () => {
        players.delete(ws);
        const ts = new Date().toLocaleTimeString();
        console.log(`[${ts}] ${name} (${id}) disconnected — ${players.size} online`);

        broadcast({ type: 'player_leave', id });
    });

    ws.on('error', () => {
        players.delete(ws);
        broadcast({ type: 'player_leave', id });
    });
});

// ── Stale client pruning (every 30s) ──────────────────────────────
setInterval(() => {
    const now = Date.now();
    for (const [ws, state] of players) {
        if (now - state.lastUpdate > 60000) {
            console.log(`[Prune] Removing stale player: ${state.name}`);
            ws.terminate();
            players.delete(ws);
            broadcast({ type: 'player_leave', id: state.id });
        }
    }
}, 30000);

// ── Start ─────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
    console.log(`FPScape server listening on port ${PORT}`);
    console.log(`Game:        http://localhost:${PORT}`);
    console.log(`Multiplayer: ws://localhost:${PORT}`);
});
