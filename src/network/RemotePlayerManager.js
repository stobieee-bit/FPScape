import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class RemotePlayerManager {
    constructor(game) {
        this.game = game;
        this.remotePlayers = new Map(); // Map<id, RemotePlayer>
        this._labelContainer = document.getElementById('hud');
    }

    addPlayer(id, name, state) {
        if (this.remotePlayers.has(id)) return;

        // Create 3D mesh using the procedural humanoid builder
        const mesh = this.game.assets.createRemotePlayer(id);
        mesh.position.set(state.x || 0, state.y || 1.8, state.z || 0);
        this.game.engine.scene.add(mesh);

        // Floating name label (HTML overlay)
        const label = document.createElement('div');
        label.className = 'player-name-label';
        label.innerHTML = `${name} <span class="player-level">(Lvl ${state.combatLevel || 3})</span>`;
        label.style.display = 'none';
        this._labelContainer.appendChild(label);

        const rp = {
            id,
            name,
            mesh,
            label,
            currentPos: new THREE.Vector3(state.x || 0, state.y || 1.8, state.z || 0),
            targetPos: new THREE.Vector3(state.x || 0, state.y || 1.8, state.z || 0),
            currentYaw: state.yaw || 0,
            targetYaw: state.yaw || 0,
            equipment: state.equipment || {},
            combatLevel: state.combatLevel || 3,
            isRunning: state.isRunning || false,
            lastUpdateTime: Date.now(),
            _bobPhase: Math.random() * Math.PI * 2,
        };

        this.remotePlayers.set(id, rp);
    }

    removePlayer(id) {
        const rp = this.remotePlayers.get(id);
        if (!rp) return;

        this.game.engine.scene.remove(rp.mesh);
        rp.label.remove();
        this.remotePlayers.delete(id);
    }

    removeAll() {
        for (const [id] of this.remotePlayers) {
            this.removePlayer(id);
        }
    }

    updatePlayerState(id, state) {
        const rp = this.remotePlayers.get(id);
        if (!rp) return;

        rp.targetPos.set(state.x, state.y, state.z);
        rp.targetYaw = state.yaw;
        rp.isRunning = state.isRunning;
        rp.lastUpdateTime = Date.now();

        // Update combat level label if changed
        if (state.combatLevel !== rp.combatLevel) {
            rp.combatLevel = state.combatLevel;
            rp.label.innerHTML = `${rp.name} <span class="player-level">(Lvl ${rp.combatLevel})</span>`;
        }

        // Update equipment visuals if changed
        if (JSON.stringify(state.equipment) !== JSON.stringify(rp.equipment)) {
            rp.equipment = { ...state.equipment };
            this._updateEquipmentColor(rp);
        }
    }

    // Called every frame from game loop
    update(dt) {
        const camera = this.game.engine.camera;
        const lerpFactor = Math.min(1, dt * CONFIG.NETWORK.lerpFactor);

        for (const [id, rp] of this.remotePlayers) {
            // ── Position interpolation ──
            const dist = rp.currentPos.distanceTo(rp.targetPos);
            if (dist > 20) {
                // Teleport — snap directly
                rp.currentPos.copy(rp.targetPos);
            } else {
                rp.currentPos.lerp(rp.targetPos, lerpFactor);
            }

            // ── Yaw interpolation (angle wrapping) ──
            let yawDiff = rp.targetYaw - rp.currentYaw;
            if (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
            if (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
            rp.currentYaw += yawDiff * lerpFactor;

            // ── Walk/run bob ──
            const moving = dist > 0.05;
            if (moving) {
                rp._bobPhase += dt * (rp.isRunning ? 12 : 7);
                const bob = Math.sin(rp._bobPhase) * 0.06;
                rp.mesh.position.set(rp.currentPos.x, rp.currentPos.y - 1.8 + bob, rp.currentPos.z);
            } else {
                rp.mesh.position.set(rp.currentPos.x, rp.currentPos.y - 1.8, rp.currentPos.z);
            }

            // Face the direction they're looking (yaw)
            // Humanoid model faces +Z, player yaw 0 = looking -Z, so add PI
            rp.mesh.rotation.y = rp.currentYaw + Math.PI;

            // ── Name label projection ──
            const labelWorldPos = new THREE.Vector3(
                rp.currentPos.x,
                rp.currentPos.y - 1.8 + 2.4, // above head
                rp.currentPos.z
            );
            const screenPos = labelWorldPos.clone().project(camera);

            if (screenPos.z > 1 || screenPos.z < -1) {
                // Behind camera or too far
                rp.label.style.display = 'none';
            } else {
                const hw = window.innerWidth / 2;
                const hh = window.innerHeight / 2;
                const sx = (screenPos.x * hw) + hw;
                const sy = -(screenPos.y * hh) + hh;
                rp.label.style.display = 'block';
                rp.label.style.left = sx + 'px';
                rp.label.style.top = sy + 'px';
            }

            // ── Stale detection ──
            if (Date.now() - rp.lastUpdateTime > 15000) {
                rp.label.style.opacity = '0.4';
            } else {
                rp.label.style.opacity = '1';
            }
        }
    }

    // Returns iterator for minimap
    getRemotePlayers() {
        return this.remotePlayers;
    }

    // Simple equipment color on body mesh
    _updateEquipmentColor(rp) {
        // Find the torso mesh in the group and tint it based on armor
        const body = rp.equipment?.body;
        if (!body) return;

        // Map armor tiers to colors
        const armorColors = {
            bronze_chainbody: 0xB87333, bronze_platebody: 0xB87333,
            iron_chainbody: 0x888888, iron_platebody: 0x888888,
            steel_platebody: 0xBBBBBB,
            mithril_platebody: 0x4466AA,
            adamant_platebody: 0x336633,
            rune_platebody: 0x3399CC,
        };

        const color = armorColors[body];
        if (!color) return;

        // The humanoid group's children: head(0), body(1), ...
        // Body is typically the second child added in _buildHumanoidNPC
        rp.mesh.traverse((child) => {
            if (child.isMesh && child.userData.part === 'torso') {
                child.material = child.material.clone();
                child.material.color.setHex(color);
            }
        });
    }
}
