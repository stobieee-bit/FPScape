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
        try {
            this.ws = new WebSocket(url);
        } catch (e) {
            console.warn('Multiplayer: failed to connect', e);
            return;
        }

        this.ws.onopen = () => this._onOpen();
        this.ws.onmessage = (e) => this._onMessage(e);
        this.ws.onclose = () => this._onClose();
        this.ws.onerror = () => {};
    }

    disconnect() {
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
        console.log('Multiplayer: connected');
    }

    _onClose() {
        this.connected = false;
        this.myId = null;
        this.myName = null;
        this.game.remotePlayerManager.removeAll();
        this.game.addChatMessage('Disconnected from multiplayer.', 'system');
        this._updateStatusUI();
    }

    _onMessage(event) {
        let data;
        try { data = JSON.parse(event.data); } catch { return; }

        const rpm = this.game.remotePlayerManager;

        switch (data.type) {
            case 'welcome':
                this.myId = data.id;
                this.myName = data.name;
                this.game.addChatMessage(`Connected as ${data.name}`, 'system');
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

            case 'player_update':
                rpm.updatePlayerState(data.id, data);
                break;

            case 'chat': {
                const isMe = data.id === this.myId;
                const prefix = isMe ? 'You' : data.name;
                this.game.addChatMessage(`${prefix}: ${data.text}`, 'multiplayer');
                break;
            }
        }
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
        if (this.connected) {
            const count = this.game.remotePlayerManager.remotePlayers.size + 1;
            el.style.display = 'block';
            el.innerHTML = `<span id="mp-player-count">${count}</span> player${count !== 1 ? 's' : ''} online`;
        } else {
            el.style.display = 'none';
        }
    }
}
