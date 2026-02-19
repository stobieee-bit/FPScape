import { CONFIG } from '../config.js';

export class WorldMapSystem {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this._overlay = document.getElementById('worldmap-overlay');
        this._canvas = document.getElementById('worldmap-canvas');

        this._canvas.width = 600;
        this._canvas.height = 600;
        this._ctx = this._canvas.getContext('2d');
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        this.isOpen = true;
        this._overlay.classList.remove('hidden');
        this._overlay.style.pointerEvents = 'none';
    }

    close() {
        this.isOpen = false;
        this._overlay.classList.add('hidden');
    }

    /** Call this every frame from the main game render loop */
    liveUpdate() {
        if (!this.isOpen) return;
        try {
            this.render();
        } catch (e) {
            console.error('WorldMap render error:', e);
        }
    }

    render() {
        const ctx = this._ctx;
        const w = 600, h = 600;
        const scale = w / CONFIG.WORLD.size; // pixels per world unit
        const offset = w / 2;

        // Background
        ctx.fillStyle = '#2D5A1E';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < w; i += 20) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
        }

        // Wilderness zone (dark area) — z < -50 in world = top of map
        ctx.fillStyle = 'rgba(80, 0, 0, 0.3)';
        ctx.fillRect(offset - 30 * scale, offset - 80 * scale, 60 * scale, 30 * scale);
        ctx.fillStyle = '#FF4444';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('WILDERNESS', offset, offset - 62 * scale);

        // Volcanic biome (x > 85)
        ctx.fillStyle = 'rgba(180, 60, 20, 0.3)';
        ctx.fillRect(offset + 85 * scale, offset - 30 * scale, 55 * scale, 60 * scale);
        ctx.fillStyle = '#FF6633';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VOLCANIC', offset + 107 * scale, offset - 20 * scale);

        // Desert city (x 65-85, z 0-25)
        ctx.fillStyle = 'rgba(210, 180, 100, 0.25)';
        ctx.fillRect(offset + 65 * scale, offset, 20 * scale, 25 * scale);
        ctx.fillStyle = '#D4AA55';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('DESERT CITY', offset + 75 * scale, offset + 5 * scale);

        // Underwater cave entrance marker (18, 14)
        ctx.fillStyle = '#2288FF';
        ctx.beginPath();
        ctx.arc(offset + 18 * scale, offset + 14 * scale, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#44AAFF';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Cave Portal', offset + 18 * scale + 6, offset + 14 * scale + 3);

        // Volcano landmark (110, 0)
        ctx.fillStyle = '#FF4400';
        ctx.beginPath();
        ctx.moveTo(offset + 110 * scale, offset - 5);
        ctx.lineTo(offset + 110 * scale - 4, offset + 3);
        ctx.lineTo(offset + 110 * scale + 4, offset + 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FF6622';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Volcano', offset + 110 * scale + 5, offset + 2);

        // Water (pond)
        ctx.fillStyle = '#3388BB';
        ctx.textAlign = 'center';
        ctx.beginPath();
        ctx.arc(offset + 25 * scale, offset + 20 * scale, 5 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Buildings
        ctx.fillStyle = '#888888';
        for (const b of CONFIG.WORLD_OBJECTS.buildings) {
            const x = offset + b.x * scale;
            const z = offset + b.z * scale;
            const s = b.type === 'castle' ? 10 : 5;
            ctx.fillRect(x - s, z - s, s * 2, s * 2);
        }

        // Trees
        ctx.fillStyle = '#1B8A2F';
        for (const t of CONFIG.WORLD_OBJECTS.trees) {
            ctx.beginPath();
            ctx.arc(offset + t.x * scale, offset + t.z * scale, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Rocks
        ctx.fillStyle = '#C4A020';
        for (const r of CONFIG.WORLD_OBJECTS.rocks) {
            ctx.beginPath();
            ctx.arc(offset + r.x * scale, offset + r.z * scale, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Monsters
        ctx.fillStyle = '#FF4444';
        for (const m of CONFIG.WORLD_OBJECTS.monsters) {
            ctx.beginPath();
            ctx.arc(offset + m.x * scale, offset + m.z * scale, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // NPCs
        ctx.fillStyle = '#FFFF00';
        for (const [id, npc] of Object.entries(CONFIG.NPCS)) {
            const x = offset + npc.x * scale;
            const z = offset + npc.z * scale;
            ctx.save();
            ctx.translate(x, z);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-3, -3, 6, 6);
            ctx.restore();
            ctx.fillStyle = '#FFD700';
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(npc.name, x, z + 10);
            ctx.fillStyle = '#FFFF00';
        }

        // Dungeon entrance
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.arc(offset - 45 * scale, offset - 35 * scale, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FF0000';
        ctx.font = '8px sans-serif';
        ctx.fillText('Dungeon', offset - 45 * scale, offset - 35 * scale - 8);

        // Agility course
        ctx.fillStyle = '#00FF88';
        for (const obs of CONFIG.AGILITY_COURSE.obstacles) {
            ctx.beginPath();
            ctx.arc(offset + obs.x * scale, offset + obs.z * scale, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.font = '8px sans-serif';
        ctx.fillStyle = '#00FF88';
        ctx.fillText('Agility', offset + 60 * scale, offset + 53 * scale);

        // Live monster positions (from actual entities)
        if (this.game.environment && this.game.environment.monsters) {
            for (const m of this.game.environment.monsters) {
                if (!m.alive) continue;
                const mx = offset + m.position.x * scale;
                const mz = offset + m.position.z * scale;
                ctx.fillStyle = m.inCombat ? '#FF0000' : '#FF4444';
                ctx.beginPath();
                ctx.arc(mx, mz, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Player position + direction arrow
        // Use camera position as the definitive source — it's always in sync with actual view
        const cam = this.game.engine.camera;
        const playerX = cam.position.x;
        const playerZ = cam.position.z;
        const px = offset + playerX * scale;
        const pz = offset + playerZ * scale;
        // Direction arrow
        const yaw = cam.rotation.y;
        const arrowLen = 12;
        const ax = px - Math.sin(yaw) * arrowLen;
        const az = pz - Math.cos(yaw) * arrowLen;
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(px, pz);
        ctx.lineTo(ax, az);
        ctx.stroke();
        // Player dot — large bright green so it's unmistakable
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.arc(px, pz, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('You', px, pz - 10);

        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('World Map (press M to close)', w / 2, 16);
    }
}
