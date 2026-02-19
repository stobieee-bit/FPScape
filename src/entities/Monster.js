import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Monster {
    constructor(mesh, config, spawnPos) {
        this.mesh = mesh;
        this.config = config;
        this.name = config.name;
        this.spawnPos = spawnPos.clone();
        this.position = spawnPos.clone();

        // Stats
        this.maxHp = config.hp;
        this.hp = config.hp;
        this.combatLevel = config.combatLevel;
        this.attackLevel = config.attackLevel;
        this.strengthLevel = config.strengthLevel;
        this.defenceLevel = config.defenceLevel;
        this.attackSpeed = config.attackSpeed;
        this.attackTimer = 0;

        // State
        this.alive = true;
        this.state = 'idle'; // idle | wander | combat | dead
        this.aggroRange = config.aggroRange;
        this.wanderRadius = config.wanderRadius;
        this.moveSpeed = config.moveSpeed;

        // Wander
        this.wanderTarget = null;
        this.wanderTimer = 0;
        this.wanderCooldown = 3 + Math.random() * 4; // seconds between wanders

        // Combat
        this.combatTarget = null; // reference to player position
        this.inCombat = false;

        // Loot
        this.lootTable = config.lootTable;
        this.xpReward = config.xpReward;

        // Respawn
        this.respawnTime = config.respawnTime;
        this.respawnTimer = 0;

        // Animation
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 2 + Math.random();
        this.bobAmount = 0.05;
        this.baseY = spawnPos.y;
    }

    tick(playerPos) {
        if (!this.alive) {
            this.respawnTimer -= CONFIG.COMBAT.tickDuration;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }

        // Skip if player is on a different vertical level (dungeon floors)
        if (Math.abs(this.position.y - playerPos.y) > 10) return;

        // State machine
        switch (this.state) {
            case 'idle':
                this.wanderTimer -= CONFIG.COMBAT.tickDuration;
                if (this.wanderTimer <= 0) {
                    this._pickWanderTarget();
                    this.state = 'wander';
                }
                // Check aggro
                if (this.aggroRange > 0) {
                    const dist = this._distTo(playerPos);
                    if (dist < this.aggroRange) {
                        this.state = 'combat';
                        this.inCombat = true;
                        this.combatTarget = playerPos;
                    }
                }
                break;

            case 'wander':
                if (this.wanderTarget) {
                    const dist = this._distToXZ(this.wanderTarget);
                    if (dist < 0.5) {
                        this.wanderTarget = null;
                        this.state = 'idle';
                        this.wanderTimer = this.wanderCooldown;
                    }
                } else {
                    this.state = 'idle';
                    this.wanderTimer = this.wanderCooldown;
                }
                // Check aggro
                if (this.aggroRange > 0) {
                    const dist = this._distTo(playerPos);
                    if (dist < this.aggroRange) {
                        this.state = 'combat';
                        this.inCombat = true;
                        this.combatTarget = playerPos;
                    }
                }
                break;

            case 'combat':
                // Attack timer handled by CombatSystem
                // Leash: if player runs too far, give up chase
                {
                    const combatDist = this._distTo(playerPos);
                    const leashDist = Math.max(this.aggroRange * 2, 15);
                    if (combatDist > leashDist) {
                        this.stopCombat();
                        this.wanderTarget = { x: this.spawnPos.x, z: this.spawnPos.z };
                        this.state = 'wander';
                    }
                }
                break;
        }
    }

    updateMovement(dt) {
        // Run death animation even when not alive
        if (this._dying) {
            this._updateDeathAnimation(dt);
            return;
        }
        if (!this.alive) return;

        // Respawn fade-in
        if (this._fadeIn !== undefined && this._fadeIn < 1) {
            this._fadeIn = Math.min(1, this._fadeIn + dt * 2); // 0.5s fade
            const opacity = this._fadeIn;
            this.mesh.traverse(c => { if (c.material) c.material.opacity = opacity; });
            if (this._fadeIn >= 1) {
                this.mesh.traverse(c => { if (c.material) { c.material.transparent = false; c.material.opacity = 1; } });
                delete this._fadeIn;
            }
        }

        // Bob animation
        this.bobOffset += dt * this.bobSpeed;
        const bob = Math.sin(this.bobOffset) * this.bobAmount;
        let isWalking = false;

        if (this.state === 'combat' && this.combatTarget) {
            // Chase player during combat
            const dx = this.combatTarget.x - this.position.x;
            const dz = this.combatTarget.z - this.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            // Only chase if further than melee range
            if (dist > 1.5) {
                const speed = this.moveSpeed * 1.2 * dt; // Slightly faster when chasing
                this.position.x += (dx / dist) * speed;
                this.position.z += (dz / dist) * speed;
                isWalking = true;
            }

            // Always face the player
            if (dist > 0.1) {
                this.mesh.rotation.y = Math.atan2(dx, dz) + Math.PI;
            }
        } else if (this.state === 'wander' && this.wanderTarget) {
            // Move toward wander target
            const dx = this.wanderTarget.x - this.position.x;
            const dz = this.wanderTarget.z - this.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist > 0.1) {
                const speed = this.moveSpeed * dt;
                this.position.x += (dx / dist) * speed;
                this.position.z += (dz / dist) * speed;
                isWalking = true;

                // Face movement direction
                this.mesh.rotation.y = Math.atan2(dx, dz) + Math.PI;
            }
        }

        // Leg swing animation when walking
        const legSwing = isWalking ? Math.sin(this.bobOffset * 6) * 0.4 : 0;
        let legIdx = 0;
        for (const child of this.mesh.children) {
            if (child.position.y < 0.3 && child.geometry &&
                child.geometry.parameters && child.geometry.parameters.radiusTop <= 0.08) {
                child.rotation.x = legSwing * (legIdx % 2 === 0 ? 1 : -1);
                legIdx++;
            }
        }

        // Update mesh position
        this.mesh.position.set(
            this.position.x,
            this.baseY + bob,
            this.position.z
        );
    }

    _pickWanderTarget() {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * this.wanderRadius;
        this.wanderTarget = {
            x: this.spawnPos.x + Math.cos(angle) * dist,
            z: this.spawnPos.z + Math.sin(angle) * dist,
        };
    }

    _distTo(pos) {
        const dx = this.position.x - pos.x;
        const dz = this.position.z - pos.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    _distToXZ(pos) {
        const dx = this.position.x - pos.x;
        const dz = this.position.z - pos.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
            return true; // Died
        }
        return false;
    }

    /** Visual flinch reaction when hit */
    flinch() {
        if (!this.mesh || this._flinching) return;
        this._flinching = true;
        const origY = this.mesh.position.y;
        const origScaleY = this.mesh.scale.y;
        // Quick squash + red tint
        this.mesh.scale.y = origScaleY * 0.8;
        this.mesh.scale.x = (this.mesh.scale.x || 1) * 1.15;
        this.mesh.scale.z = (this.mesh.scale.z || 1) * 1.15;
        setTimeout(() => {
            if (this.mesh) {
                this.mesh.scale.y = origScaleY;
                this.mesh.scale.x = (this.mesh.scale.x || 1) / 1.15;
                this.mesh.scale.z = (this.mesh.scale.z || 1) / 1.15;
            }
            this._flinching = false;
        }, 120);
    }

    die() {
        this.alive = false;
        this.state = 'dead';
        this.inCombat = false;
        this.combatTarget = null;
        this.mesh.userData.interactable = false;
        this.respawnTimer = this.respawnTime;

        // Start death animation instead of instantly hiding
        this._dying = true;
        this._deathTime = 0;
        this._deathOriginY = this.mesh.position.y;
        // Enable transparency on all materials for fade-out
        this.mesh.traverse(c => {
            if (c.material) {
                c.material.transparent = true;
                c.material.opacity = 1;
            }
        });
    }

    _updateDeathAnimation(dt) {
        this._deathTime += dt;
        const t = this._deathTime;
        const DURATION = 0.8;

        if (t < 0.2) {
            // Phase 1: Dramatic squash
            const p = t / 0.2; // 0→1
            this.mesh.scale.y = 1 - p * 0.4;       // 1 → 0.6
            this.mesh.scale.x = 1 + p * 0.3;       // 1 → 1.3
            this.mesh.scale.z = 1 + p * 0.3;
        } else if (t < DURATION) {
            // Phase 2: Sink + fade + spin
            const p = (t - 0.2) / (DURATION - 0.2); // 0→1
            this.mesh.scale.y = 0.6;
            this.mesh.scale.x = 1.3 - p * 0.3;     // 1.3 → 1.0
            this.mesh.scale.z = 1.3 - p * 0.3;
            this.mesh.position.y = this._deathOriginY - p * 1.0;
            this.mesh.rotation.y += dt * 3;
            const opacity = 1 - p;
            this.mesh.traverse(c => { if (c.material) c.material.opacity = opacity; });
        } else {
            // Finalize: hide mesh, restore transforms for respawn
            this.mesh.visible = false;
            this.mesh.scale.set(1, 1, 1);
            this.mesh.position.y = this._deathOriginY;
            this.mesh.traverse(c => {
                if (c.material) {
                    c.material.transparent = false;
                    c.material.opacity = 1;
                }
            });
            this._dying = false;
        }
    }

    respawn() {
        // Cancel any in-progress death animation
        this._dying = false;
        this.mesh.scale.set(1, 1, 1);

        this.alive = true;
        this.hp = this.maxHp;
        this.state = 'idle';
        this.inCombat = false;
        this.combatTarget = null;
        this.attackTimer = 0;
        this.wanderTimer = this.wanderCooldown;
        this.position.copy(this.spawnPos);
        this.mesh.position.copy(this.spawnPos);
        this.mesh.visible = true;
        this.mesh.userData.interactable = true;

        // Fade-in on respawn
        this._fadeIn = 0;
        this.mesh.traverse(c => { if (c.material) { c.material.transparent = true; c.material.opacity = 0; } });
    }

    startCombat(playerPos) {
        this.state = 'combat';
        this.inCombat = true;
        this.wanderTarget = null;
        if (playerPos) this.combatTarget = playerPos;
    }

    stopCombat() {
        this.state = 'idle';
        this.inCombat = false;
        this.wanderTimer = this.wanderCooldown;
    }

    generateLoot() {
        const drops = [];
        for (const entry of this.lootTable) {
            if (Math.random() <= entry.chance) {
                drops.push({ item: entry.item, qty: entry.qty });
            }
        }
        return drops;
    }
}
