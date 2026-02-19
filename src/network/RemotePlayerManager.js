import * as THREE from 'three';
import { CONFIG } from '../config.js';

// ── Weapon tier → color map ──────────────────────────────────────────
const WEAPON_COLORS = {
    bronze: 0xB87333, iron: 0x888888, steel: 0xBBBBBB,
    mithril: 0x4466AA, adamant: 0x336633, rune: 0x3399CC,
};

function getWeaponTierColor(weaponId) {
    if (!weaponId) return null;
    for (const [tier, color] of Object.entries(WEAPON_COLORS)) {
        if (weaponId.startsWith(tier + '_')) return color;
    }
    return 0xAAAAAA; // default grey
}

function getWeaponType(weaponId) {
    if (!weaponId) return null;
    if (weaponId.includes('dagger')) return 'dagger';
    if (weaponId.includes('mace')) return 'mace';
    if (weaponId.includes('sword') || weaponId.includes('scimitar')) return 'sword';
    if (weaponId.includes('bow')) return 'bow';
    if (weaponId.includes('staff')) return 'staff';
    return 'sword'; // default
}

export class RemotePlayerManager {
    constructor(game) {
        this.game = game;
        this.remotePlayers = new Map(); // Map<id, RemotePlayer>
        this._labelContainer = document.getElementById('hud');

        // Shared weapon geometries (created once, reused)
        this._weaponGeos = {
            sword:  new THREE.BoxGeometry(0.04, 0.7, 0.02),
            dagger: new THREE.BoxGeometry(0.03, 0.4, 0.015),
            mace:   new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4),
            bow:    new THREE.TorusGeometry(0.2, 0.015, 4, 8, Math.PI),
            staff:  new THREE.CylinderGeometry(0.02, 0.015, 0.9, 5),
        };
        // Mace head geometry
        this._maceHeadGeo = new THREE.SphereGeometry(0.06, 5, 4);
    }

    addPlayer(id, name, state) {
        if (this.remotePlayers.has(id)) return;

        // Create 3D mesh using the procedural humanoid builder
        const mesh = this.game.assets.createRemotePlayer(id);
        mesh.position.set(state.x || 0, state.y || 1.8, state.z || 0);
        this.game.engine.scene.add(mesh);

        // Make interactable for context menu (trade, examine)
        mesh.userData.interactable = true;
        mesh.userData.type = 'remote_player';
        mesh.userData.name = name;
        mesh.userData.playerId = id;
        this.game.environment.interactables.push(mesh);

        // Floating name label (HTML overlay)
        const label = document.createElement('div');
        label.className = 'player-name-label';
        label.textContent = name;
        const lvlSpan = document.createElement('span');
        lvlSpan.className = 'player-level';
        lvlSpan.textContent = ` (Lvl ${state.combatLevel || 3})`;
        label.appendChild(lvlSpan);
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
            _armSwingPhase: 0,       // walking arm swing animation
            _combatSwingTime: 0,     // combat swing countdown (seconds)
            _weaponMesh: null,       // currently attached weapon mesh
            _currentWeaponId: null,  // track which weapon is equipped
            _chatBubble: null,       // active HTML chat bubble element
            _chatBubbleTimer: 0,     // auto-remove countdown
        };

        // Attach initial weapon if equipped
        this._updateWeaponMesh(rp);

        this.remotePlayers.set(id, rp);
    }

    removePlayer(id) {
        const rp = this.remotePlayers.get(id);
        if (!rp) return;

        this.game.engine.scene.remove(rp.mesh);
        rp.label.remove();
        if (rp._chatBubble) rp._chatBubble.remove();

        // Remove from interactables
        const idx = this.game.environment.interactables.indexOf(rp.mesh);
        if (idx >= 0) this.game.environment.interactables.splice(idx, 1);

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
            // Safely update label using DOM methods
            while (rp.label.firstChild) rp.label.removeChild(rp.label.firstChild);
            rp.label.appendChild(document.createTextNode(rp.name));
            const lvlSpan = document.createElement('span');
            lvlSpan.className = 'player-level';
            lvlSpan.textContent = ` (Lvl ${rp.combatLevel})`;
            rp.label.appendChild(lvlSpan);
        }

        // Update equipment visuals if changed
        if (JSON.stringify(state.equipment) !== JSON.stringify(rp.equipment)) {
            rp.equipment = { ...state.equipment };
            this._updateEquipmentColor(rp);
            this._updateWeaponMesh(rp);
        }
    }

    /** Trigger a combat swing animation on a remote player (called on monster_hit). */
    triggerCombatSwing(playerId) {
        const rp = this.remotePlayers.get(playerId);
        if (rp) rp._combatSwingTime = 0.4; // 0.4s swing animation
    }

    /** Show a chat bubble above a remote player. */
    showChatBubble(playerId, text) {
        const rp = this.remotePlayers.get(playerId);
        if (!rp) return;

        // Remove existing bubble
        if (rp._chatBubble) rp._chatBubble.remove();

        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.textContent = text.slice(0, 60);
        bubble.style.display = 'none';
        this._labelContainer.appendChild(bubble);

        rp._chatBubble = bubble;
        rp._chatBubbleTimer = 5; // seconds
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

            // ── Arm swing animation ──
            this._animateArms(rp, dt, moving);

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

            // ── Chat bubble projection ──
            if (rp._chatBubble) {
                rp._chatBubbleTimer -= dt;
                if (rp._chatBubbleTimer <= 0) {
                    rp._chatBubble.remove();
                    rp._chatBubble = null;
                } else {
                    const bubbleWorldPos = new THREE.Vector3(
                        rp.currentPos.x,
                        rp.currentPos.y - 1.8 + 2.7, // above name label
                        rp.currentPos.z
                    );
                    const bsp = bubbleWorldPos.clone().project(camera);
                    if (bsp.z > 1 || bsp.z < -1) {
                        rp._chatBubble.style.display = 'none';
                    } else {
                        const hw = window.innerWidth / 2;
                        const hh = window.innerHeight / 2;
                        const bx = (bsp.x * hw) + hw;
                        const by = -(bsp.y * hh) + hh;
                        rp._chatBubble.style.display = 'block';
                        rp._chatBubble.style.left = bx + 'px';
                        rp._chatBubble.style.top = by + 'px';
                    }
                }
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

    // ── Arm Swing Animation ─────────────────────────────────────────────
    _animateArms(rp, dt, moving) {
        const parts = rp.mesh.userData._parts;
        if (!parts || !parts.armL || !parts.armR) return;

        // Combat swing overrides walk swing
        if (rp._combatSwingTime > 0) {
            rp._combatSwingTime -= dt;
            // Swing right arm forward in an arc
            const t = 1 - (rp._combatSwingTime / 0.4); // 0→1 over duration
            const swingAngle = Math.sin(t * Math.PI) * 1.2; // arc up to ~70° forward
            parts.armR.rotation.x = -swingAngle;
            parts.armL.rotation.x = 0;
            return;
        }

        if (moving) {
            rp._armSwingPhase += dt * (rp.isRunning ? 10 : 6);
            const swing = Math.sin(rp._armSwingPhase) * 0.5;
            parts.armR.rotation.x = swing;
            parts.armL.rotation.x = -swing;
        } else {
            // Idle — arms at rest
            parts.armR.rotation.x *= 0.9; // smooth return
            parts.armL.rotation.x *= 0.9;
        }
    }

    // ── Weapon Mesh Attachment ───────────────────────────────────────────
    _updateWeaponMesh(rp) {
        const weaponId = rp.equipment?.weapon;

        // No change needed
        if (weaponId === rp._currentWeaponId) return;
        rp._currentWeaponId = weaponId;

        // Remove old weapon
        if (rp._weaponMesh) {
            const parts = rp.mesh.userData._parts;
            if (parts && parts.armR) {
                parts.armR.remove(rp._weaponMesh);
            } else {
                rp.mesh.remove(rp._weaponMesh);
            }
            rp._weaponMesh = null;
        }

        if (!weaponId) return;

        const color = getWeaponTierColor(weaponId);
        const type = getWeaponType(weaponId);
        const mat = new THREE.MeshStandardMaterial({
            color: color || 0xAAAAAA,
            metalness: 0.5,
            roughness: 0.4,
        });

        let wpnMesh;
        if (type === 'mace') {
            // Mace: handle + sphere head
            const group = new THREE.Group();
            const handle = new THREE.Mesh(this._weaponGeos.mace, mat);
            group.add(handle);
            const head = new THREE.Mesh(this._maceHeadGeo, mat);
            head.position.y = 0.28;
            group.add(head);
            wpnMesh = group;
        } else if (type === 'bow') {
            wpnMesh = new THREE.Mesh(this._weaponGeos.bow, mat);
            wpnMesh.rotation.z = Math.PI / 2;
        } else {
            // Sword, dagger, staff — simple box/cyl
            const geo = this._weaponGeos[type] || this._weaponGeos.sword;
            wpnMesh = new THREE.Mesh(geo, mat);
        }

        // Attach to right arm. Arms are at (0.35, 1.1, 0) in model space,
        // so we position the weapon relative to the arm center
        const parts = rp.mesh.userData._parts;
        if (parts && parts.armR) {
            wpnMesh.position.set(0, -0.35, -0.08);
            parts.armR.add(wpnMesh);
        } else {
            // Fallback: attach to group directly
            wpnMesh.position.set(0.45, 0.9, -0.08);
            wpnMesh.rotation.z = -0.2;
            rp.mesh.add(wpnMesh);
        }

        rp._weaponMesh = wpnMesh;
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
