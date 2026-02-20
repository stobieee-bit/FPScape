import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class NetworkManager {
    constructor(game) {
        this.game = game;
        this.ws = null;
        this.myId = null;
        this.myName = null;
        this.connected = false;
        this._sendTimer = 0;
        this._lastSent = null;
    }

    connect(url) {
        url = url || CONFIG.NETWORK.wsUrl;
        this._reconnectUrl = url;
        this._reconnectAttempts = 0;
        this._reconnecting = false;
        this._tryConnect(url);
    }

    _tryConnect(url) {
        try {
            this.ws = new WebSocket(url);
        } catch (e) {
            console.warn('Multiplayer: failed to connect', e);
            this._scheduleReconnect();
            return;
        }

        this.ws.onopen = () => this._onOpen();
        this.ws.onmessage = (e) => this._onMessage(e);
        this.ws.onclose = () => this._onClose();
        this.ws.onerror = () => {};
    }

    disconnect() {
        this._reconnecting = false;
        this._reconnectAttempts = 0;
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        this.myId = null;
        this.myName = null;
        this.game.remotePlayerManager.removeAll();
        this._updateStatusUI();
    }

    _scheduleReconnect() {
        if (!this._reconnectUrl) return;
        this._reconnecting = true;
        // Exponential backoff: 3s, 6s, 12s, max 30s
        const delay = Math.min(3000 * Math.pow(2, this._reconnectAttempts), 30000);
        this._reconnectAttempts++;
        console.log(`Multiplayer: reconnecting in ${(delay / 1000).toFixed(0)}s (attempt ${this._reconnectAttempts})`);
        this._updateStatusUI();
        this._reconnectTimer = setTimeout(() => {
            this._reconnectTimer = null;
            if (this._reconnecting) {
                this._tryConnect(this._reconnectUrl);
            }
        }, delay);
    }

    // Called from game loop every frame with dt
    update(dt) {
        if (!this.connected) return;
        this._sendTimer += dt;
        const interval = 1 / CONFIG.NETWORK.sendRate;
        if (this._sendTimer >= interval) {
            this._sendTimer -= interval;
            this._sendState();
        }
    }

    sendChat(text) {
        if (!this.connected) return;
        this._send({ type: 'chat', text });
    }

    // ── Internal ───────────────────────────────────────────────────

    _onOpen() {
        this.connected = true;
        this._reconnecting = false;
        this._reconnectAttempts = 0;
        console.log('Multiplayer: connected');
        // Send chosen name if the player entered one
        const chosenName = this.game._chosenName;
        if (chosenName) {
            this._send({ type: 'set_name', name: chosenName });
        }
        this._updateStatusUI();
    }

    _onClose() {
        const wasConnected = this.connected;
        this.connected = false;
        this.myId = null;
        this.myName = null;
        this.game.remotePlayerManager.removeAll();
        if (wasConnected) {
            this.game.addChatMessage('Disconnected from multiplayer.', 'system');
        }
        this._updateStatusUI();
        // Auto-reconnect if we had a URL and weren't manually disconnecting
        if (this._reconnectUrl && !this._reconnectTimer) {
            this._scheduleReconnect();
        }
    }

    _onMessage(event) {
        let data;
        try { data = JSON.parse(event.data); } catch { return; }

        const rpm = this.game.remotePlayerManager;

        switch (data.type) {
            case 'welcome':
                this.myId = data.id;
                this.myName = data.name;
                // Only show "Connected as" if no custom name pending
                // (name_confirmed will show the real name)
                if (!this.game._chosenName) {
                    this.game.addChatMessage(`Connected as ${data.name}`, 'system');
                }
                // Add all existing players
                for (const p of data.players) {
                    rpm.addPlayer(p.id, p.name, p);
                }
                this._updateStatusUI();
                break;

            case 'player_join':
                rpm.addPlayer(data.id, data.name, data);
                this.game.addChatMessage(`${data.name} has joined.`, 'system');
                this._updateStatusUI();
                break;

            case 'player_leave':
                const leaving = rpm.remotePlayers.get(data.id);
                const leaveName = leaving ? leaving.name : 'Someone';
                rpm.removePlayer(data.id);
                this.game.addChatMessage(`${leaveName} has left.`, 'system');
                this._updateStatusUI();
                break;

            case 'name_confirmed':
                this.myName = data.name;
                this.game.addChatMessage(`Connected as ${data.name}`, 'system');
                break;

            case 'player_rename': {
                const rp = rpm.remotePlayers.get(data.id);
                if (rp) {
                    rp.name = data.name;
                    if (rp.label) rp.label.textContent = data.name;
                }
                break;
            }

            case 'player_update':
                rpm.updatePlayerState(data.id, data);
                break;

            case 'chat': {
                const isMe = data.id === this.myId;
                const prefix = isMe ? 'You' : data.name;
                this.game.addChatMessage(`${prefix}: ${data.text}`, 'multiplayer');
                // Show chat bubble above remote player
                if (!isMe) {
                    rpm.showChatBubble(data.id, data.text);
                }
                break;
            }

            case 'monster_hit': {
                // Sync HP from server and trigger combat swing on remote attacker
                if (data.monsterId) {
                    const monster = this.game.environment.monsterById.get(data.monsterId);
                    if (monster && data.hpLeft !== undefined) {
                        monster.hp = data.hpLeft;
                    }
                    // Show hitsplat for remote players' attacks
                    if (data.attackerId && data.attackerId !== this.myId && monster) {
                        if (data.damage > 0) {
                            this.game.combatSystem._showHitsplat(monster.mesh, data.damage, false);
                            monster.flinch();
                        } else {
                            this.game.combatSystem._showHitsplat(monster.mesh, 0, true);
                        }
                    }
                }
                if (data.attackerId && data.attackerId !== this.myId) {
                    rpm.triggerCombatSwing(data.attackerId);
                }
                break;
            }

            case 'monster_state': {
                // Periodic full sync of all monster HP/alive states
                if (data.monsters && Array.isArray(data.monsters)) {
                    for (const ms of data.monsters) {
                        const monster = this.game.environment.monsterById.get(ms.id);
                        if (!monster) continue;
                        monster.hp = ms.hp;
                        if (!ms.alive && monster.alive) {
                            monster.die();
                        } else if (ms.alive && !monster.alive) {
                            monster.respawn();
                        }
                    }
                }
                break;
            }

            case 'monster_die': {
                const monster = this.game.environment.monsterById.get(data.monsterId);
                if (monster && monster.alive) {
                    monster.hp = 0;
                    monster.die();
                    // If we were targeting this monster, stop combat
                    const player = this.game.player;
                    if (player.combatTarget === monster) {
                        player.inCombat = false;
                        player.combatTarget = null;
                        this.game.addChatMessage(`The ${monster.name} has been defeated.`, 'system');
                    }
                }
                break;
            }

            case 'monster_respawn': {
                const monster = this.game.environment.monsterById.get(data.monsterId);
                if (monster && !monster.alive) {
                    monster.respawn();
                }
                break;
            }

            // ── Trade messages ──
            case 'trade_request': {
                if (this.game.tradeSystem) {
                    this.game.tradeSystem.onTradeRequest(data.fromId, data.fromName);
                }
                break;
            }

            case 'trade_start': {
                if (this.game.tradeSystem) {
                    this.game.tradeSystem.openTrade(data.partnerId, data.partnerName);
                }
                break;
            }

            case 'offer_update': {
                if (this.game.tradeSystem) {
                    this.game.tradeSystem.onOfferUpdate(data.offer);
                }
                break;
            }

            case 'partner_accept': {
                if (this.game.tradeSystem) {
                    this.game.tradeSystem.onPartnerAccept();
                }
                break;
            }

            case 'trade_complete': {
                if (this.game.tradeSystem) {
                    this.game.tradeSystem.onTradeComplete();
                }
                break;
            }

            case 'trade_cancelled': {
                if (this.game.tradeSystem) {
                    this.game.tradeSystem.onTradeCancelled(data.reason);
                }
                break;
            }

            // ── Loot visibility messages ──
            case 'loot_drop': {
                // Private loot dropped for us (killer)
                const pos = new THREE.Vector3(data.x, 0, data.z);
                pos.y = this.game.environment.terrain.getHeightAt(data.x, data.z);
                this.game.environment.spawnGroundItem(data.itemId, data.qty, pos, data.serverId);
                const itemDef = CONFIG.ITEMS[data.itemId];
                if (itemDef) {
                    this.game.addChatMessage(
                        `Loot: ${itemDef.icon || ''} ${itemDef.name}${data.qty > 1 ? ' x' + data.qty : ''}`,
                        'loot'
                    );
                }
                break;
            }

            case 'loot_public': {
                // Item became public — spawn if we don't already have it
                const env = this.game.environment;
                const existing = env.groundItems.find(g => g.serverId === data.serverId);
                if (!existing) {
                    const pos = new THREE.Vector3(data.x, 0, data.z);
                    pos.y = env.terrain.getHeightAt(data.x, data.z);
                    env.spawnGroundItem(data.itemId, data.qty, pos, data.serverId);
                }
                break;
            }

            case 'loot_despawn': {
                // Remove ground item
                this.game.environment.removeGroundItemByServerId(data.serverId);
                break;
            }

            case 'pickup_confirmed': {
                // Server confirmed pickup — add to inventory
                this.game.inventorySystem.addItem(data.itemId, data.qty);
                const itemDef = CONFIG.ITEMS[data.itemId];
                if (itemDef) {
                    this.game.addChatMessage(`You pick up: ${itemDef.name}${data.qty > 1 ? ' x' + data.qty : ''}.`);
                    this.game.audio.playPickup();
                }
                // Remove ground item visual
                this.game.environment.removeGroundItemByServerId(data.serverId);
                break;
            }
        }
    }

    /** Send monster attack to server for multiplayer sync */
    sendMonsterAttack(monsterId, damage) {
        if (!this.connected || !monsterId) return;
        this._send({ type: 'attack_monster', monsterId, damage });
    }

    // ── Trade send methods ──────────────────────────────────────────
    sendTradeRequest(targetId) {
        this._send({ type: 'trade_request', targetId });
    }

    sendTradeAccept(targetId) {
        this._send({ type: 'trade_accept', targetId });
    }

    sendTradeDecline(targetId) {
        this._send({ type: 'trade_decline', targetId });
    }

    sendOfferUpdate(offer) {
        this._send({ type: 'offer_update', offer });
    }

    sendTradeConfirm() {
        this._send({ type: 'trade_confirm' });
    }

    // ── Loot pickup ─────────────────────────────────────────────────
    sendPickupItem(serverId) {
        this._send({ type: 'pickup_item', serverId });
    }

    _sendState() {
        const player = this.game.player;
        const input = this.game.input;

        const state = {
            x: Math.round(player.position.x * 100) / 100,
            y: Math.round(player.position.y * 100) / 100,
            z: Math.round(player.position.z * 100) / 100,
            yaw: Math.round(input.yaw * 100) / 100,
            pitch: Math.round(input.pitch * 100) / 100,
            equipment: { ...player.equipment },
            combatLevel: player.getCombatLevel(),
            isRunning: player.isRunning,
        };

        // Delta check — skip if nothing meaningful changed
        if (this._lastSent) {
            const ls = this._lastSent;
            const posMoved = Math.abs(state.x - ls.x) > 0.01 ||
                             Math.abs(state.y - ls.y) > 0.01 ||
                             Math.abs(state.z - ls.z) > 0.01;
            const rotMoved = Math.abs(state.yaw - ls.yaw) > 0.01 ||
                             Math.abs(state.pitch - ls.pitch) > 0.01;
            const eqChanged = JSON.stringify(state.equipment) !== JSON.stringify(ls.equipment);
            const lvlChanged = state.combatLevel !== ls.combatLevel;
            const runChanged = state.isRunning !== ls.isRunning;

            if (!posMoved && !rotMoved && !eqChanged && !lvlChanged && !runChanged) return;
        }

        this._lastSent = state;
        this._send({ type: 'state', ...state });
    }

    _send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    _updateStatusUI() {
        const el = document.getElementById('mp-status');
        if (!el) return;

        el.style.display = 'block';

        // Clear previous content
        while (el.firstChild) el.removeChild(el.firstChild);

        const dot = document.createElement('span');
        dot.className = 'mp-dot';

        const text = document.createElement('span');

        if (this.connected) {
            const count = this.game.remotePlayerManager.remotePlayers.size + 1;
            dot.classList.add('mp-dot-green');
            text.textContent = ` ${count} player${count !== 1 ? 's' : ''} online`;
        } else if (this._reconnecting) {
            dot.classList.add('mp-dot-yellow');
            text.textContent = ' Reconnecting...';
        } else {
            dot.classList.add('mp-dot-red');
            text.textContent = ' Offline';
        }

        el.appendChild(dot);
        el.appendChild(text);
    }
}
