import { CONFIG } from '../config.js';

export class ResourceNode {
    constructor(mesh, config) {
        this.mesh = mesh;
        this.type = config.type;           // 'tree' or 'rock'
        this.subType = config.subType;     // 'normal', 'oak', 'copper', etc.
        this.name = config.name;
        this.maxHP = config.hp;
        this.hp = config.hp;
        this.alive = true;
        this.depleted = false;
        this.respawnTime = config.respawnTime;
        this.respawnTimer = 0;
        this.requiredLevel = config.requiredLevel;
        this.xpPerHarvest = config.xpPerHarvest;
        this.yieldItem = config.yieldItem;
        this.successChance = config.successChance;

        // Store references to mesh children for show/hide
        this._mainParts = [];
        this._depletedPart = null;

        mesh.children.forEach(child => {
            if (child.name === 'stump' || child.name === 'depleted') {
                this._depletedPart = child;
            } else {
                this._mainParts.push(child);
            }
        });
    }

    harvest() {
        if (this.depleted) return false;

        this.hp -= 1;
        if (this.hp <= 0) {
            this.deplete();
            return true; // Fully harvested
        }
        return false; // Still has HP
    }

    deplete() {
        this.depleted = true;
        this.respawnTimer = this.respawnTime;

        // Hide main mesh parts, show depleted version
        for (const part of this._mainParts) {
            part.visible = false;
        }
        if (this._depletedPart) {
            this._depletedPart.visible = true;
        }

        // Remove interactable flag while depleted
        this.mesh.userData.interactable = false;
    }

    respawn() {
        this.depleted = false;
        this.hp = this.maxHP;

        // Show main mesh parts, hide depleted version
        for (const part of this._mainParts) {
            part.visible = true;
        }
        if (this._depletedPart) {
            this._depletedPart.visible = false;
        }

        // Restore interactable flag
        this.mesh.userData.interactable = true;
    }

    tick(dt) {
        if (!this.depleted) return;

        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) {
            this.respawn();
        }
    }

    getSkillName() {
        return this.type === 'tree' ? 'woodcutting' : 'mining';
    }
}
