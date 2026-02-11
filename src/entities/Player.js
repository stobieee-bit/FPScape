import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Player {
    constructor() {
        this.position = new THREE.Vector3(0, CONFIG.PLAYER.height, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = true;

        // Skills - init from config
        this.skills = {};
        for (const key of Object.keys(CONFIG.SKILLS)) {
            if (key === 'hitpoints') {
                this.skills[key] = { level: 10, xp: 1154 };
            } else {
                this.skills[key] = { level: 1, xp: 0 };
            }
        }

        this.hp = 10;
        this.maxHp = 10;

        // Combat state
        this.inCombat = false;
        this.combatTarget = null;
        this.attackTimer = 0;
        this.dead = false;
        this.attackStyle = 'melee'; // melee | ranged | magic
        this.meleeStyle = 'accurate'; // accurate | aggressive | defensive | controlled
        this.rangedStyle = 'accurate'; // accurate | longrange
        this.magicStyle = 'standard'; // standard | defensive
        this.selectedSpell = null;

        // Skilling state
        this.skilling = false;
        this.skillingTarget = null;
        this.skillingType = null;

        // Run energy (0-100)
        this.runEnergy = 100;
        this.isRunning = false;

        // Special attack energy (0-100)
        this.specialAttackEnergy = 100;
        this.specialAttackActive = false;

        // Auto-retaliate
        this.autoRetaliate = true;

        // Wilderness skull system
        this.skulled = false;
        this.skullTimer = 0;

        // Potion buff timers { attack: { boost: 3, timer: 60 }, ... }
        this.activeBuffs = {};

        // Thieving stun
        this.stunned = false;
        this.stunTimer = 0;

        // Poison state
        this.poisoned = false;
        this.poisonDamage = 0;
        this.poisonTicksLeft = 0;

        // Eat cooldown (ticks)
        this.eatCooldown = 0;

        // Equipment slots
        this.equipment = {};
        for (const slot of CONFIG.EQUIPMENT_SLOTS) {
            this.equipment[slot] = null;
        }

        // Agility tracking
        this.lastAgilityObstacle = -1;
        this.agilityLapStarted = false;

        // Kill counts for quest tracking
        this.killCounts = {};

        // Cached vectors for movement calc
        this._forward = new THREE.Vector3();
        this._right = new THREE.Vector3();
        this._moveDir = new THREE.Vector3();
    }

    getCombatLevel() {
        const base = (this.skills.defence.level + this.skills.hitpoints.level +
                      Math.floor(this.skills.prayer.level * 0.5)) / 4;
        const melee = (this.skills.attack.level + this.skills.strength.level) * 0.325;
        const ranged = this.skills.ranged.level * 0.4875;
        const magic = this.skills.magic.level * 0.4875;
        return Math.max(3, Math.floor(base + Math.max(melee, ranged, magic)));
    }

    getTotalLevel() {
        let total = 0;
        for (const skill of Object.values(this.skills)) {
            total += skill.level;
        }
        return total;
    }

    getEquipmentBonus(stat) {
        let total = 0;
        for (const slot of CONFIG.EQUIPMENT_SLOTS) {
            const itemId = this.equipment[slot];
            if (itemId) {
                const item = CONFIG.ITEMS[itemId];
                if (item && item[stat]) {
                    total += item[stat];
                }
            }
        }
        return total;
    }

    update(dt, input, camera, getTerrainHeight) {
        if (this.dead) return;

        const move = input.getMoveDirection();
        const isMoving = move.x !== 0 || move.z !== 0;

        // Run energy - agility bonus for regen
        this.isRunning = input.isRunning() && this.runEnergy > 0;
        const agilityBonus = 1 + this.skills.agility.level * 0.02;
        if (isMoving && this.isRunning) {
            this.runEnergy = Math.max(0, this.runEnergy - dt * 8);
        } else if (this.runEnergy < 100) {
            this.runEnergy = Math.min(100, this.runEnergy + dt * 3 * agilityBonus);
        }

        const speed = this.isRunning ? CONFIG.PLAYER.runSpeed : CONFIG.PLAYER.walkSpeed;

        this._forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
        this._forward.y = 0;
        this._forward.normalize();

        this._right.set(1, 0, 0).applyQuaternion(camera.quaternion);
        this._right.y = 0;
        this._right.normalize();

        this._moveDir.set(0, 0, 0);
        this._moveDir.addScaledVector(this._forward, -move.z);
        this._moveDir.addScaledVector(this._right, move.x);

        if (this._moveDir.lengthSq() > 0) {
            this._moveDir.normalize();
            this.velocity.x = this._moveDir.x * speed;
            this.velocity.z = this._moveDir.z * speed;
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
        }

        if (!this.onGround) {
            this.velocity.y += CONFIG.PLAYER.gravity * dt;
        }

        this.position.x += this.velocity.x * dt;
        this.position.z += this.velocity.z * dt;
        this.position.y += this.velocity.y * dt;

        const terrainY = getTerrainHeight(this.position.x, this.position.z) + CONFIG.PLAYER.height;
        if (this.position.y <= terrainY) {
            this.position.y = terrainY;
            this.velocity.y = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        const halfWorld = CONFIG.WORLD.size / 2 - 2;
        this.position.x = Math.max(-halfWorld, Math.min(halfWorld, this.position.x));
        this.position.z = Math.max(-halfWorld, Math.min(halfWorld, this.position.z));

        camera.position.set(
            this.position.x,
            this.position.y - CONFIG.PLAYER.height + CONFIG.PLAYER.eyeHeight,
            this.position.z
        );

        const euler = new THREE.Euler(input.pitch, input.yaw, 0, 'YXZ');
        camera.quaternion.setFromEuler(euler);
    }

    die() {
        this.dead = true;
        this.inCombat = false;
        this.combatTarget = null;
        this.skilling = false;
        this.skillingTarget = null;
    }

    respawn() {
        this.dead = false;
        this.hp = this.maxHp;
        this.runEnergy = 100;
        this.position.set(0, CONFIG.PLAYER.height, 0);
        this.velocity.set(0, 0, 0);
        this.inCombat = false;
        this.combatTarget = null;
    }

    stopActions() {
        this.inCombat = false;
        this.combatTarget = null;
        this.attackTimer = 0;
        this.skilling = false;
        this.skillingTarget = null;
        this.skillingType = null;
    }

    eat(itemId) {
        const item = CONFIG.ITEMS[itemId];
        if (!item || !item.heals) return false;
        if (this.hp >= this.maxHp) return false;
        this.hp = Math.min(this.maxHp, this.hp + item.heals);
        return true;
    }
}
