import { CONFIG } from '../config.js';

export class SkillSystem {
    constructor(game) {
        this.game = game;
        this._xpDropContainer = document.getElementById('xp-drops');
        this._dropOffset = 0;
    }

    addXP(skillName, amount) {
        const player = this.game.player;
        const skill = player.skills[skillName];
        if (!skill) return;

        skill.xp += amount;

        const newLevel = this.getLevelForXP(skill.xp);
        if (newLevel > skill.level) {
            const oldLevel = skill.level;
            skill.level = newLevel;
            this._onLevelUp(skillName, oldLevel, newLevel);
        }

        // Update max HP if hitpoints leveled
        if (skillName === 'hitpoints') {
            player.maxHp = player.skills.hitpoints.level;
        }

        // Floating XP drop
        this._showXPDrop(skillName, amount);

        this.game.addChatMessage(
            `+${amount} ${CONFIG.SKILLS[skillName].name} XP`,
            'xp-drop'
        );
    }

    _showXPDrop(skillName, amount) {
        const info = CONFIG.SKILLS[skillName];
        const el = document.createElement('div');
        el.className = 'xp-drop-text';
        el.innerHTML = `<span class="xp-icon">${info.icon}</span> +${amount} XP`;
        el.style.color = info.color || '#FFFFFF';
        el.style.top = this._dropOffset + 'px';
        this._xpDropContainer.appendChild(el);
        this._dropOffset = (this._dropOffset + 24) % 72;
        setTimeout(() => el.remove(), 2000);
    }

    getLevelForXP(xp) {
        const table = CONFIG.XP_TABLE;
        for (let i = table.length - 1; i >= 1; i--) {
            if (xp >= table[i]) return i;
        }
        return 1;
    }

    getXPForLevel(level) {
        return CONFIG.XP_TABLE[level] || 0;
    }

    getXPToNextLevel(skillName) {
        const skill = this.game.player.skills[skillName];
        if (skill.level >= 99) return 0;
        const nextLevelXP = this.getXPForLevel(skill.level + 1);
        return nextLevelXP - skill.xp;
    }

    getXPProgress(skillName) {
        const skill = this.game.player.skills[skillName];
        if (skill.level >= 99) return 1;
        const currentLevelXP = this.getXPForLevel(skill.level);
        const nextLevelXP = this.getXPForLevel(skill.level + 1);
        const range = nextLevelXP - currentLevelXP;
        if (range <= 0) return 0;
        return (skill.xp - currentLevelXP) / range;
    }

    _onLevelUp(skillName, oldLevel, newLevel) {
        const skillInfo = CONFIG.SKILLS[skillName];
        this.game.addChatMessage(
            `Congratulations! Your ${skillInfo.name} level is now ${newLevel}!`,
            'level-up'
        );
        this.game.audio.playLevelUp();

        // If hitpoints leveled up, heal
        if (skillName === 'hitpoints') {
            this.game.player.maxHp = newLevel;
            this.game.player.hp = newLevel;
        }
    }

    processSkillingTick() {
        const player = this.game.player;
        if (!player.skilling || !player.skillingTarget) return;

        const skillType = player.skillingType;

        if (skillType === 'fishing') { this._processFishingTick(player); return; }
        if (skillType === 'cooking') { this._processCookingTick(player); return; }

        const node = player.skillingTarget;

        // Check if node was depleted by someone else or respawned
        if (node.depleted) {
            player.skilling = false;
            player.skillingTarget = null;
            this.game.addChatMessage('This resource is depleted.', 'system');
            return;
        }

        // Check distance (player might have moved)
        const dist = this.game.distanceToPlayer(node.mesh.position);
        if (dist > CONFIG.PLAYER.interactionRange) {
            player.skilling = false;
            player.skillingTarget = null;
            this.game.addChatMessage("You're too far away.", 'system');
            return;
        }

        // Attempt to harvest
        const skillLevel = player.skills[skillType].level;
        const baseChance = node.successChance;
        // Higher level = higher success chance (up to ~90%)
        const levelBonus = (skillLevel - node.requiredLevel) * 0.01;
        const chance = Math.min(0.9, baseChance + levelBonus);

        // Play sound + animation on each tick attempt
        if (skillType === 'woodcutting') {
            this.game.audio.playChop();
        } else {
            this.game.audio.playMine();
        }
        this._shakeResource(node);

        if (Math.random() < chance) {
            // Success!
            const fullyHarvested = node.harvest();

            // Add item to inventory
            const added = this.game.inventorySystem.addItem(node.yieldItem);
            if (added) {
                const itemName = CONFIG.ITEMS[node.yieldItem].name;
                this.game.addChatMessage(`You get some ${itemName.toLowerCase()}.`);
            } else {
                this.game.addChatMessage("Your inventory is full!", 'system');
                player.skilling = false;
                player.skillingTarget = null;
                return;
            }

            // Award XP
            this.addXP(skillType, node.xpPerHarvest);

            // If fully depleted, stop skilling
            if (fullyHarvested) {
                player.skilling = false;
                player.skillingTarget = null;
                this.game.addChatMessage(`The ${node.name.toLowerCase()} has been depleted.`);
            }
        }
        // Else: miss this tick, keep trying
    }

    _processFishingTick(player) {
        // Determine which fish type we're catching
        const fishType = player.skillingTarget?.fishType || 'shrimp';
        const fishConfig = CONFIG.FISHING[fishType];
        if (!fishConfig) { player.stopActions(); return; }

        // Find the nearest matching fishing spot
        let spotMesh = null;
        for (const spot of this.game.environment.fishingSpots) {
            if (spot.fishType === fishType) { spotMesh = spot.mesh; break; }
        }
        if (!spotMesh) spotMesh = this.game.environment.fishingSpot;
        if (!spotMesh) { player.stopActions(); return; }

        const dist = this.game.distanceToPlayer(spotMesh.position);
        if (dist > CONFIG.PLAYER.interactionRange) {
            player.skilling = false;
            player.skillingTarget = null;
            this.game.addChatMessage("You're too far away.", 'system');
            return;
        }

        // Check level
        const skillLevel = player.skills.fishing.level;
        if (skillLevel < fishConfig.requiredLevel) {
            player.stopActions();
            this.game.addChatMessage(`You need Fishing level ${fishConfig.requiredLevel}.`, 'system');
            return;
        }

        const levelBonus = (skillLevel - fishConfig.requiredLevel) * 0.01;
        const chance = Math.min(0.9, fishConfig.successChance + levelBonus);

        this.game.audio.playSplash();

        if (Math.random() < chance) {
            const added = this.game.inventorySystem.addItem(fishConfig.yieldItem);
            if (added) {
                const itemName = CONFIG.ITEMS[fishConfig.yieldItem].name;
                this.game.addChatMessage(`You catch some ${itemName.toLowerCase()}.`);
                this.addXP('fishing', fishConfig.xpPerCatch);
            } else {
                this.game.addChatMessage("Your inventory is full!", 'system');
                player.skilling = false;
                player.skillingTarget = null;
            }
        }
    }

    _processCookingTick(player) {
        const target = player.skillingTarget;
        if (!target || target.type !== 'campfire') { player.stopActions(); return; }

        const campfirePos = this.game.environment.campfirePosition;
        const dist = this.game.distanceToPlayer(campfirePos);
        if (dist > CONFIG.PLAYER.interactionRange) {
            player.stopActions();
            this.game.addChatMessage("You're too far away from the fire.", 'system');
            return;
        }

        const itemId = target.cookableId;
        const itemDef = CONFIG.ITEMS[itemId];
        if (!itemDef || !itemDef.cookable) { player.stopActions(); return; }

        // Check if we still have the item
        if (!this.game.inventorySystem.hasItem(itemId)) {
            player.stopActions();
            this.game.addChatMessage("You've run out of things to cook.", 'system');
            return;
        }

        // Check cooking level
        if (player.skills.cooking.level < itemDef.cookLevel) {
            player.stopActions();
            this.game.addChatMessage(`You need level ${itemDef.cookLevel} Cooking.`, 'system');
            return;
        }

        this.game.audio.playChop(); // sizzle sound substitute

        // Remove raw item
        this.game.inventorySystem.removeItem(itemId, 1);

        // Burn chance decreases with level
        const levelBonus = (player.skills.cooking.level - itemDef.cookLevel) * 0.02;
        const burnChance = Math.max(0.05, itemDef.burnChance - levelBonus);

        if (Math.random() < burnChance) {
            this.game.inventorySystem.addItem('burnt_food');
            this.game.addChatMessage('You accidentally burn the food.', 'damage');
        } else {
            this.game.inventorySystem.addItem(itemDef.cookedItem);
            const cookedName = CONFIG.ITEMS[itemDef.cookedItem].name;
            this.game.addChatMessage(`You cook the ${cookedName.toLowerCase()}.`);
            this.addXP('cooking', itemDef.cookXP);
        }

        // Check if we have more to cook
        if (!this.game.inventorySystem.hasItem(itemId)) {
            player.stopActions();
        }
    }

    _shakeResource(node) {
        const mesh = node.mesh;
        const originalRot = mesh.rotation.z;
        const shakeAmount = 0.08;
        const duration = 200;
        const start = performance.now();

        const animate = () => {
            const elapsed = performance.now() - start;
            if (elapsed > duration) {
                mesh.rotation.z = originalRot;
                return;
            }
            const progress = elapsed / duration;
            const decay = 1 - progress;
            mesh.rotation.z = originalRot + Math.sin(progress * Math.PI * 4) * shakeAmount * decay;
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
}
