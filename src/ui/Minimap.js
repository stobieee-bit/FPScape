import { CONFIG } from '../config.js';

export class Minimap {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('minimap-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.compass = document.getElementById('compass');

        this.scale = 2; // pixels per world unit
        this.size = 152;
    }

    update() {
        const ctx = this.ctx;
        const player = this.game.player;
        const input = this.game.input;
        const half = this.size / 2;

        // Clear
        const inDungeon = player.currentDungeonFloor >= 0;
        ctx.fillStyle = inDungeon ? '#222222' : '#2D5A1E';
        ctx.fillRect(0, 0, this.size, this.size);

        ctx.save();
        ctx.translate(half, half);

        // Rotate map so player always faces "up"
        ctx.rotate(input.yaw);

        // Dungeon floor label
        if (inDungeon) {
            ctx.save();
            ctx.rotate(-input.yaw); // Un-rotate for text
            ctx.fillStyle = '#FF8800';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`Floor ${player.currentDungeonFloor + 1}`, -half + 4, -half + 12);
            ctx.restore();
        }

        // Draw terrain grid lines (subtle)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 0.5;
        const gridSize = 10 * this.scale;
        for (let x = -200; x <= 200; x += gridSize) {
            const wx = (x - player.position.x * this.scale);
            ctx.beginPath();
            ctx.moveTo(wx, -200);
            ctx.lineTo(wx, 200);
            ctx.stroke();
        }
        for (let z = -200; z <= 200; z += gridSize) {
            const wz = (z - player.position.z * this.scale);
            ctx.beginPath();
            ctx.moveTo(-200, wz);
            ctx.lineTo(200, wz);
            ctx.stroke();
        }

        // ── Dungeon-specific rendering ──
        if (inDungeon) {
            const floorData = this.game.environment.dungeonFloors?.[player.currentDungeonFloor];
            if (floorData) {
                const b = floorData.bounds;
                const bx1 = (b.minX - player.position.x) * this.scale;
                const bz1 = (b.minZ - player.position.z) * this.scale;
                const bw = (b.maxX - b.minX) * this.scale;
                const bh = (b.maxZ - b.minZ) * this.scale;
                ctx.strokeStyle = '#666666';
                ctx.lineWidth = 1;
                ctx.strokeRect(bx1, bz1, bw, bh);

                // Ladder up (green)
                if (floorData.ladderUpPos) {
                    const lx = (floorData.ladderUpPos.x - player.position.x) * this.scale;
                    const lz = (floorData.ladderUpPos.z - player.position.z) * this.scale;
                    ctx.fillStyle = '#00CC00';
                    ctx.fillRect(lx - 3, lz - 3, 6, 6);
                }
                // Ladder down (red)
                if (floorData.ladderDownPos) {
                    const lx = (floorData.ladderDownPos.x - player.position.x) * this.scale;
                    const lz = (floorData.ladderDownPos.z - player.position.z) * this.scale;
                    ctx.fillStyle = '#CC0000';
                    ctx.fillRect(lx - 3, lz - 3, 6, 6);
                }
            }
        }

        // ── Surface-only elements ──
        if (!inDungeon) {

        // Draw buildings with distinct POI icons
        for (const bData of CONFIG.WORLD_OBJECTS.buildings) {
            const dx = (bData.x - player.position.x) * this.scale;
            const dz = (bData.z - player.position.z) * this.scale;
            if (Math.abs(dx) > half || Math.abs(dz) > half) continue;

            switch (bData.type) {
                case 'castle':
                    ctx.fillStyle = '#AAAAAA';
                    ctx.fillRect(dx - 6, dz - 6, 12, 12);
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(dx - 6, dz - 6, 12, 12);
                    break;
                case 'furnace':
                    // Orange flame icon
                    ctx.fillStyle = '#FF6600';
                    ctx.beginPath();
                    ctx.arc(dx, dz, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#FFAA00';
                    ctx.beginPath();
                    ctx.arc(dx, dz - 1, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'anvil':
                    // Dark gray anvil square
                    ctx.fillStyle = '#666666';
                    ctx.fillRect(dx - 3, dz - 2, 6, 4);
                    ctx.fillStyle = '#999999';
                    ctx.fillRect(dx - 2, dz - 3, 4, 1);
                    break;
                case 'church':
                    // White cross
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(dx - 1, dz - 4, 2, 8);
                    ctx.fillRect(dx - 3, dz - 2, 6, 2);
                    break;
                case 'shop':
                    // Cyan diamond (shop)
                    ctx.fillStyle = '#00CCCC';
                    ctx.save();
                    ctx.translate(dx, dz);
                    ctx.rotate(Math.PI / 4);
                    ctx.fillRect(-3, -3, 6, 6);
                    ctx.restore();
                    break;
                case 'tavern':
                    // Warm orange circle (tavern/inn)
                    ctx.fillStyle = '#CC7722';
                    ctx.beginPath();
                    ctx.arc(dx, dz, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#FFAA44';
                    ctx.beginPath();
                    ctx.arc(dx, dz, 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'bank':
                    // Gold $ symbol area
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(dx - 3, dz - 3, 6, 6);
                    ctx.fillStyle = '#3C2D1E';
                    ctx.fillRect(dx - 1.5, dz - 1.5, 3, 3);
                    break;
                default:
                    ctx.fillStyle = '#888888';
                    ctx.fillRect(dx - 3, dz - 3, 6, 6);
                    break;
            }
        }

        // Draw resource nodes (colored by subtype)
        const treeColors = { normal: '#1B8A2F', oak: '#228B22', willow: '#2E8B57' };
        const rockColors = { copper: '#CD7F32', tin: '#C0C0C0', iron: '#A0522D', coal: '#444444', mithril: '#1A237E', adamant: '#2E7D32', runite: '#00ACC1' };
        for (const node of this.game.environment.resourceNodes) {
            if (node.depleted) continue;

            const dx = (node.mesh.position.x - player.position.x) * this.scale;
            const dz = (node.mesh.position.z - player.position.z) * this.scale;

            if (Math.abs(dx) > half || Math.abs(dz) > half) continue;

            if (node.type === 'tree') {
                ctx.fillStyle = treeColors[node.subType] || '#1B8A2F';
                const r = node.subType === 'normal' ? 2 : 3;
                ctx.beginPath();
                ctx.arc(dx, dz, r, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = rockColors[node.subType] || '#C4A020';
                ctx.beginPath();
                ctx.arc(dx, dz, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw fishing spot
        const fishSpot = this.game.environment.fishingSpot;
        if (fishSpot) {
            const fdx = (fishSpot.position.x - player.position.x) * this.scale;
            const fdz = (fishSpot.position.z - player.position.z) * this.scale;
            if (Math.abs(fdx) < half && Math.abs(fdz) < half) {
                ctx.fillStyle = '#3388FF';
                ctx.beginPath();
                ctx.arc(fdx, fdz, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw ground items
        for (const gi of this.game.environment.groundItems) {
            const gdx = (gi.mesh.position.x - player.position.x) * this.scale;
            const gdz = (gi.mesh.position.z - player.position.z) * this.scale;
            if (Math.abs(gdx) < half && Math.abs(gdz) < half) {
                ctx.fillStyle = '#FF4444';
                ctx.fillRect(gdx - 1.5, gdz - 1.5, 3, 3);
            }
        }

        // Draw NPCs (yellow diamond)
        for (const npc of this.game.environment.npcs) {
            const ndx = (npc.mesh.position.x - player.position.x) * this.scale;
            const ndz = (npc.mesh.position.z - player.position.z) * this.scale;
            if (Math.abs(ndx) < half && Math.abs(ndz) < half) {
                ctx.fillStyle = '#FFFF00';
                ctx.save();
                ctx.translate(ndx, ndz);
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-2.5, -2.5, 5, 5);
                ctx.restore();
            }
        }

        // Draw dungeon entrance
        const dungeonDx = (-45 - player.position.x) * this.scale;
        const dungeonDz = (-35 - player.position.z) * this.scale;
        if (Math.abs(dungeonDx) < half && Math.abs(dungeonDz) < half) {
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.arc(dungeonDx, dungeonDz, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        } // end if (!inDungeon)

        // Draw monsters (aggressive = bright red, passive = orange)
        for (const monster of this.game.environment.monsters) {
            if (!monster.alive) continue;

            const dx = (monster.position.x - player.position.x) * this.scale;
            const dz = (monster.position.z - player.position.z) * this.scale;

            if (Math.abs(dx) > half || Math.abs(dz) > half) continue;

            const isAggro = monster.aggroRange > 0;
            ctx.fillStyle = isAggro ? '#FF2222' : '#FF8844';
            ctx.beginPath();
            ctx.arc(dx, dz, 2.5, 0, Math.PI * 2);
            ctx.fill();
            // White border on in-combat monsters
            if (monster.inCombat) {
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // ── Remote players (cyan dots) ──
        if (this.game.remotePlayerManager) {
            const remotePlayers = this.game.remotePlayerManager.getRemotePlayers();
            for (const [id, rp] of remotePlayers) {
                const dx = (rp.currentPos.x - player.position.x) * this.scale;
                const dz = (rp.currentPos.z - player.position.z) * this.scale;

                if (Math.abs(dx) > half || Math.abs(dz) > half) continue;

                ctx.fillStyle = '#00EEEE';
                ctx.beginPath();
                ctx.arc(dx, dz, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }

        ctx.restore();

        // Draw player (always center, always pointing up, gold border)
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(half, half - 6);
        ctx.lineTo(half - 4, half + 3);
        ctx.lineTo(half + 4, half + 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Update compass
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        // Normalize yaw to 0-2PI
        let angle = ((input.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const idx = Math.round(angle / (Math.PI / 4)) % 8;
        this.compass.textContent = dirs[idx];
    }
}
