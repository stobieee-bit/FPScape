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

// ── Monster spawn definitions (mirrors client CONFIG.MONSTERS) ───────
const MONSTER_SPAWNS = [
    // Chickens
    { id: 'm0',  type: 'chicken',       x:  5,  z: 25,  hp: 3,  respawnTime: 15 },
    { id: 'm1',  type: 'chicken',       x:  8,  z: 28,  hp: 3,  respawnTime: 15 },
    { id: 'm2',  type: 'chicken',       x:  3,  z: 22,  hp: 3,  respawnTime: 15 },
    // Cows
    { id: 'm3',  type: 'cow',           x: 25,  z: 30,  hp: 8,  respawnTime: 15 },
    { id: 'm4',  type: 'cow',           x: 30,  z: 35,  hp: 8,  respawnTime: 15 },
    // Rats
    { id: 'm5',  type: 'rat',           x: -10, z:  5,  hp: 4,  respawnTime: 12 },
    { id: 'm6',  type: 'rat',           x: -8,  z:  8,  hp: 4,  respawnTime: 12 },
    // Goblins
    { id: 'm7',  type: 'goblin',        x: -35, z:  5,  hp: 5,  respawnTime: 20 },
    { id: 'm8',  type: 'goblin',        x: -38, z:  8,  hp: 5,  respawnTime: 20 },
    { id: 'm9',  type: 'goblin',        x: -32, z:  3,  hp: 5,  respawnTime: 20 },
    // Skeletons (wilderness)
    { id: 'm10', type: 'skeleton',      x: -40, z: -30, hp: 15, respawnTime: 30 },
    { id: 'm11', type: 'skeleton',      x: -45, z: -35, hp: 15, respawnTime: 30 },
    // Dark Wizards
    { id: 'm12', type: 'dark_wizard',   x:  10, z: -25, hp: 15, respawnTime: 35 },
    { id: 'm13', type: 'dark_wizard',   x:  15, z: -28, hp: 15, respawnTime: 35 },
    // Lesser Demons
    { id: 'm14', type: 'lesser_demon',  x: -50, z: -50, hp: 30, respawnTime: 50 },
    // Moss Giants
    { id: 'm15', type: 'moss_giant',    x: -60, z:  20, hp: 25, respawnTime: 45 },
    { id: 'm16', type: 'moss_giant',    x: -55, z:  25, hp: 25, respawnTime: 45 },
    // KBD
    { id: 'm17', type: 'kbd',           x:  0,  z: -60, hp: 80, respawnTime: 120 },
];

// ── Simplified loot tables per monster type ────────────────────────
const LOOT_TABLES = {
    chicken:      [{ item: 'raw_chicken', qty: 1, chance: 1.0 }, { item: 'feather', qty: 3, chance: 0.8 }, { item: 'bones', qty: 1, chance: 1.0 }],
    cow:          [{ item: 'raw_beef', qty: 1, chance: 1.0 }, { item: 'cowhide', qty: 1, chance: 1.0 }, { item: 'bones', qty: 1, chance: 1.0 }],
    rat:          [{ item: 'bones', qty: 1, chance: 1.0 }, { item: 'coins', qty: 5, chance: 0.5 }],
    goblin:       [{ item: 'bones', qty: 1, chance: 1.0 }, { item: 'coins', qty: 10, chance: 0.6 }, { item: 'goblin_mail', qty: 1, chance: 0.15 }],
    skeleton:     [{ item: 'bones', qty: 1, chance: 1.0 }, { item: 'coins', qty: 15, chance: 0.5 }, { item: 'iron_arrow', qty: 5, chance: 0.3 }],
    dark_wizard:  [{ item: 'bones', qty: 1, chance: 1.0 }, { item: 'mind_rune', qty: 8, chance: 0.6 }, { item: 'air_rune', qty: 10, chance: 0.5 }],
    lesser_demon: [{ item: 'bones', qty: 1, chance: 1.0 }, { item: 'coins', qty: 50, chance: 0.8 }, { item: 'fire_rune', qty: 10, chance: 0.4 }],
    moss_giant:   [{ item: 'bones', qty: 1, chance: 1.0 }, { item: 'coins', qty: 30, chance: 0.7 }, { item: 'iron_bar', qty: 1, chance: 0.3 }],
    kbd:          [{ item: 'dragon_bones', qty: 1, chance: 1.0 }, { item: 'coins', qty: 200, chance: 1.0 }, { item: 'rune_bar', qty: 2, chance: 0.3 }],
};

// Server-tracked ground items for loot visibility
const groundItems = []; // { serverId, itemId, qty, x, y, z, ownerId, spawnTime }
let nextLootId = 1;

function rollLoot(monsterType) {
    const table = LOOT_TABLES[monsterType];
    if (!table) return [];
    const drops = [];
    for (const entry of table) {
        if (Math.random() <= entry.chance) {
            drops.push({ item: entry.item, qty: entry.qty });
        }
    }
    return drops;
}

// Monster runtime state
const monsters = new Map();
for (const spawn of MONSTER_SPAWNS) {
    monsters.set(spawn.id, {
        ...spawn,
        currentHp: spawn.hp,
        alive: true,
        respawnTimer: 0,
    });
}

function getMonsterSnapshot() {
    const arr = [];
    for (const [mId, m] of monsters) {
        arr.push({ id: mId, type: m.type, hp: m.currentHp, maxHp: m.hp, alive: m.alive });
    }
    return arr;
}

// ── Helpers ──────────────────────────────────────────────────────────

function send(ws, data) {
    if (ws.readyState === 1) {
        ws.send(JSON.stringify(data));
    }
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

    send(ws, {
        type: 'welcome',
        id,
        name,
        players: existingPlayers,
    });

    broadcast({
        type: 'player_join',
        ...getPlayerSnapshot(state),
    }, ws);

    // Send current monster state snapshot to new player
    send(ws, { type: 'monster_state', monsters: getMonsterSnapshot() });

    ws.on('message', (raw) => {
        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            return;
        }

        if (data.type === 'set_name') {
            // Player chose a custom name — sanitize and update
            let custom = String(data.name || '').replace(/[^a-zA-Z0-9_ -]/g, '').trim().slice(0, 16);
            if (custom.length >= 1) {
                state.name = custom;
                send(ws, { type: 'name_confirmed', name: custom });
                broadcast({ type: 'player_rename', id: state.id, name: custom }, ws);
                const ts2 = new Date().toLocaleTimeString();
                console.log(`[${ts2}] Player ${id} set name to: ${custom}`);
            }

        } else if (data.type === 'state') {
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
            let text = String(data.text || '').slice(0, 200).trim();
            if (!text) return;

            const ts = new Date().toLocaleTimeString();
            console.log(`[${ts}] [Chat] ${state.name}: ${text}`);

            broadcastAll({
                type: 'chat',
                id: state.id,
                name: state.name,
                text,
            });

        } else if (data.type === 'trade_request') {
            // Forward trade request to target player
            const targetId = data.targetId;
            for (const [otherWs, otherState] of players) {
                if (otherState.id === targetId) {
                    send(otherWs, { type: 'trade_request', fromId: state.id, fromName: state.name });
                    break;
                }
            }

        } else if (data.type === 'trade_accept') {
            // Target accepted trade — pair both players
            const targetId = data.targetId;
            state.tradePartner = targetId;
            for (const [otherWs, otherState] of players) {
                if (otherState.id === targetId) {
                    otherState.tradePartner = state.id;
                    // Notify both players that the trade session has started
                    send(ws, { type: 'trade_start', partnerId: targetId, partnerName: otherState.name });
                    send(otherWs, { type: 'trade_start', partnerId: state.id, partnerName: state.name });
                    break;
                }
            }

        } else if (data.type === 'trade_decline') {
            // Cancel/decline trade
            const partnerId = state.tradePartner || data.targetId;
            if (partnerId) {
                for (const [otherWs, otherState] of players) {
                    if (otherState.id === partnerId) {
                        send(otherWs, { type: 'trade_cancelled', reason: `${state.name} declined the trade.` });
                        otherState.tradePartner = null;
                        break;
                    }
                }
            }
            state.tradePartner = null;

        } else if (data.type === 'offer_update') {
            // Forward offer update to trade partner
            const partnerId = state.tradePartner;
            if (!partnerId) return;
            for (const [otherWs, otherState] of players) {
                if (otherState.id === partnerId) {
                    send(otherWs, { type: 'offer_update', offer: data.offer });
                    break;
                }
            }
            // Reset both accepted flags when offer changes
            state.tradeAccepted = false;
            for (const [, otherState] of players) {
                if (otherState.id === partnerId) {
                    otherState.tradeAccepted = false;
                    break;
                }
            }

        } else if (data.type === 'trade_confirm') {
            // Player confirmed/accepted the trade
            state.tradeAccepted = true;
            const partnerId = state.tradePartner;
            if (!partnerId) return;

            // Notify partner that we accepted
            let partnerWs = null;
            let partnerState = null;
            for (const [otherWs, otherState] of players) {
                if (otherState.id === partnerId) {
                    partnerWs = otherWs;
                    partnerState = otherState;
                    break;
                }
            }
            if (!partnerWs || !partnerState) return;

            send(partnerWs, { type: 'partner_accept' });

            // If both accepted, complete the trade
            if (state.tradeAccepted && partnerState.tradeAccepted) {
                send(ws, { type: 'trade_complete' });
                send(partnerWs, { type: 'trade_complete' });
                state.tradePartner = null;
                state.tradeAccepted = false;
                partnerState.tradePartner = null;
                partnerState.tradeAccepted = false;
            }

        } else if (data.type === 'attack_monster') {
            const mId = data.monsterId;
            const damage = parseInt(data.damage, 10);
            const m = monsters.get(mId);
            if (!m || !m.alive) return;

            // Validate distance — use generous range since server monster
            // positions are static spawns while client-side monsters chase players
            const dx = state.x - m.x;
            const dz = state.z - m.z;
            if (dx * dx + dz * dz > 2500) return;

            // Validate damage range
            if (isNaN(damage) || damage < 0 || damage > 50) return;

            m.currentHp = Math.max(0, m.currentHp - damage);

            broadcastAll({
                type: 'monster_hit',
                monsterId: mId,
                damage,
                attackerId: state.id,
                hpLeft: m.currentHp,
            });

            if (m.currentHp <= 0) {
                m.alive = false;
                m.respawnTimer = m.respawnTime;
                broadcastAll({
                    type: 'monster_die',
                    monsterId: mId,
                    killerId: state.id,
                });

                // Roll loot and spawn ground items (private to killer)
                const loot = rollLoot(m.type);
                for (const drop of loot) {
                    const serverId = `loot_${nextLootId++}`;
                    const gi = {
                        serverId,
                        itemId: drop.item,
                        qty: drop.qty,
                        x: m.x + (Math.random() - 0.5) * 1.5,
                        y: 0, // client will use terrain height
                        z: m.z + (Math.random() - 0.5) * 1.5,
                        ownerId: state.id,
                        spawnTime: Date.now(),
                    };
                    groundItems.push(gi);
                    // Send to killer only (private loot)
                    send(ws, {
                        type: 'loot_drop',
                        serverId: gi.serverId,
                        itemId: gi.itemId,
                        qty: gi.qty,
                        x: gi.x, z: gi.z,
                    });
                }
            }

        } else if (data.type === 'pickup_item') {
            const serverId = data.serverId;
            const idx = groundItems.findIndex(g => g.serverId === serverId);
            if (idx < 0) return;

            const gi = groundItems[idx];
            // Validate ownership: must be owner or public (ownerId cleared)
            if (gi.ownerId && gi.ownerId !== state.id) return;

            // Validate distance (within 8 units)
            const pdx = state.x - gi.x;
            const pdz = state.z - gi.z;
            if (pdx * pdx + pdz * pdz > 64) return;

            // Remove from server and confirm pickup
            groundItems.splice(idx, 1);
            send(ws, { type: 'pickup_confirmed', serverId, itemId: gi.itemId, qty: gi.qty });
            broadcastAll({ type: 'loot_despawn', serverId });
        }
    });

    ws.on('close', () => {
        // Cancel any active trade
        if (state.tradePartner) {
            for (const [otherWs, otherState] of players) {
                if (otherState.id === state.tradePartner) {
                    send(otherWs, { type: 'trade_cancelled', reason: `${state.name} disconnected.` });
                    otherState.tradePartner = null;
                    otherState.tradeAccepted = false;
                    break;
                }
            }
        }
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

// ── Monster respawn tick (every 1s) ──────────────────────────────────
setInterval(() => {
    for (const [mId, m] of monsters) {
        if (m.alive) continue;
        m.respawnTimer -= 1;
        if (m.respawnTimer <= 0) {
            m.alive = true;
            m.currentHp = m.hp;
            broadcastAll({ type: 'monster_respawn', monsterId: mId });
        }
    }
}, 1000);

// ── Broadcast full monster state every 2s ────────────────────────────
setInterval(() => {
    if (players.size === 0) return;
    broadcastAll({ type: 'monster_state', monsters: getMonsterSnapshot() });
}, 2000);

// ── Ground item loot visibility tick (every 5s) ─────────────────────
setInterval(() => {
    const now = Date.now();
    for (let i = groundItems.length - 1; i >= 0; i--) {
        const gi = groundItems[i];
        const age = now - gi.spawnTime;

        // After 3 minutes → despawn
        if (age > 180000) {
            broadcastAll({ type: 'loot_despawn', serverId: gi.serverId });
            groundItems.splice(i, 1);
            continue;
        }

        // After 60 seconds → make public (clear ownerId, broadcast to all)
        if (gi.ownerId && age > 60000) {
            gi.ownerId = null;
            broadcastAll({
                type: 'loot_public',
                serverId: gi.serverId,
                itemId: gi.itemId,
                qty: gi.qty,
                x: gi.x, z: gi.z,
            });
        }
    }
}, 5000);

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
