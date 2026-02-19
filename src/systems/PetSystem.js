import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class PetSystem {
    constructor(game) {
        this.game = game;
        this.ownedPets = new Set();
        this.activePet = null;
        this.petMesh = null;
        this._targetPos = new THREE.Vector3();
    }

    summonPet(petId) {
        if (!this.ownedPets.has(petId)) return;
        this.dismissPet();

        const petConfig = CONFIG.PETS[petId];
        if (!petConfig) return;

        this.petMesh = this.game.assets.createPet(petId);
        const p = this.game.player.position;
        this.petMesh.position.set(p.x - 2, p.y, p.z - 2);
        this.game.engine.scene.add(this.petMesh);
        this.activePet = petId;
        this.game.player.activePet = petId;
        this.game.addChatMessage(`${petConfig.icon} ${petConfig.name} is now following you.`, 'system');
    }

    dismissPet() {
        if (this.petMesh) {
            this.game.engine.scene.remove(this.petMesh);
            this.petMesh = null;
        }
        this.activePet = null;
        this.game.player.activePet = null;
    }

    update(dt) {
        if (!this.petMesh || !this.activePet) return;

        const player = this.game.player;
        // Calculate target position: 2 units behind player based on yaw
        const yaw = this.game.input.yaw;
        this._targetPos.set(
            player.position.x + Math.sin(yaw) * 2,
            player.position.y,
            player.position.z + Math.cos(yaw) * 2
        );

        // Get terrain height at target
        if (player.currentDungeonFloor >= 0) {
            const floorData = this.game.environment.dungeonFloors?.[player.currentDungeonFloor];
            if (floorData) this._targetPos.y = floorData.y;
        } else {
            this._targetPos.y = this.game.terrain.getHeightAt(this._targetPos.x, this._targetPos.z);
        }

        // Smooth follow
        this.petMesh.position.lerp(this._targetPos, 3 * dt);

        // Face player
        const dx = player.position.x - this.petMesh.position.x;
        const dz = player.position.z - this.petMesh.position.z;
        this.petMesh.rotation.y = Math.atan2(dx, dz);

        // Small bob animation
        this.petMesh.position.y += Math.sin(Date.now() * 0.003) * 0.02;
    }

    rollSkillingPet(skillId) {
        for (const [petId, cfg] of Object.entries(CONFIG.PETS)) {
            if (cfg.source !== skillId) continue;
            // Scale chance by level (higher level = slightly better chance)
            const level = this.game.player.skills[skillId]?.level || 1;
            const scaledChance = cfg.chance * (1 + level / 99);
            if (Math.random() < scaledChance) {
                this._onPetObtained(petId);
            }
            break;
        }
    }

    rollBossPet(monsterType) {
        for (const [petId, cfg] of Object.entries(CONFIG.PETS)) {
            if (cfg.source !== monsterType) continue;
            if (Math.random() < cfg.chance) {
                this._onPetObtained(petId);
            }
            break;
        }
    }

    rollCluePet(tier) {
        const petId = 'bloodhound';
        const cfg = CONFIG.PETS[petId];
        if (!cfg || tier !== 'hard') return;
        if (Math.random() < cfg.chance) {
            this._onPetObtained(petId);
        }
    }

    _onPetObtained(petId) {
        if (this.ownedPets.has(petId)) return; // Already owned
        const cfg = CONFIG.PETS[petId];
        if (!cfg) return;

        this.ownedPets.add(petId);
        this.game.inventorySystem.addItem(cfg.item, 1);
        this.game.addChatMessage(`You have a funny feeling like you're being followed... ${cfg.icon} ${cfg.name}!`, 'level-up');
        this.game.audio.playLevelUp();

        // Sparkle burst at player
        this.game.particleSystem.createLevelUpBurst(this.game.player.position);

        // Achievements
        this.game.achievementSystem.unlock('pet_owner');
        if (this.ownedPets.size >= 3) {
            this.game.achievementSystem.unlock('pet_collector');
        }
    }
}
