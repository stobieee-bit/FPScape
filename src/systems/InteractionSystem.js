import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class InteractionSystem {
    constructor(game) {
        this.game = game;
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = CONFIG.PLAYER.interactionRange;
        this.hoveredEntity = null;
        this.hoveredMesh = null;
        this._crosshair = document.getElementById('crosshair');
        this._targetInfo = document.getElementById('target-info');
    }

    update() {
        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.game.engine.camera);
        const hits = this.raycaster.intersectObjects(this.game.environment.interactables, true);
        this.hoveredEntity = null;
        this.hoveredMesh = null;
        if (hits.length > 0) {
            let target = hits[0].object;
            while (target && !target.userData.interactable) target = target.parent;
            if (target && target.userData.interactable) {
                this.hoveredMesh = target;
                this.hoveredEntity = target._entityRef || null;
                this._updateHoverUI(target);
                return;
            }
        }
        this._clearHoverUI();
    }

    _updateHoverUI(target) {
        this._crosshair.classList.add('interactable');
        const data = target.userData;
        let infoText = data.name || '';
        let color = '#FFD700'; // default gold

        if (data.type === 'monster' && this.hoveredEntity) {
            infoText = `Attack ${data.name} (level ${this.hoveredEntity.combatLevel})`;
            if (this.hoveredEntity.inCombat) infoText += ` - HP: ${this.hoveredEntity.hp}/${this.hoveredEntity.maxHp}`;
            color = this.hoveredEntity.aggroRange > 0 ? '#FF4444' : '#FFFF00'; // red for aggressive, yellow for passive
        }
        if (data.type === 'tree') { infoText = `Chop down ${data.name}`; color = '#44CC44'; }
        if (data.type === 'rock') { infoText = `Mine ${data.name}`; color = '#AAAAAA'; }
        if (data.type === 'npc') {
            infoText = `Talk-to ${data.name}`;
            color = '#FFFF00';
            if (data.npcId && CONFIG.THIEVING[data.npcId]) {
                infoText += ` / Pickpocket (Right-click)`;
                color = '#CC66CC';
            }
        }
        if (data.type === 'ground_item') { infoText = `Take ${data.name}`; color = '#FF8844'; }
        if (data.type === 'fishing_spot') {
            const fishName = data.fishType ? CONFIG.FISHING[data.fishType]?.name : 'Shrimp';
            infoText = `${fishName || 'Net'} Fishing spot`;
            color = '#3388FF';
        }
        if (data.type === 'campfire') { infoText = 'Use Campfire (Cook / Brew)'; color = '#FF8800'; }
        if (data.type === 'furnace') { infoText = 'Use Furnace'; color = '#FF6600'; }
        if (data.type === 'anvil') { infoText = 'Use Anvil'; color = '#AAAAAA'; }
        if (data.type === 'sheep') { infoText = 'Shear Sheep'; color = '#FFFFFF'; }
        if (data.type === 'agility') { infoText = `Attempt ${data.name || 'Obstacle'}`; color = '#00CC00'; }
        if (data.type === 'rune_altar') { infoText = 'Craft Runes'; color = '#CC88FF'; }
        if (data.type === 'church') { infoText = 'Pray at Church'; color = '#33DDDD'; }
        if (data.type === 'gravestone') { infoText = 'Reclaim items from gravestone'; color = '#AAAAAA'; }

        this._targetInfo.textContent = infoText;
        this._targetInfo.style.color = color;
        this._targetInfo.classList.remove('hidden');
    }

    _clearHoverUI() {
        this._crosshair.classList.remove('interactable');
        this._targetInfo.classList.add('hidden');
    }

    onLeftClick() {
        if (!this.hoveredMesh) { this.game.player.stopActions(); return; }
        const data = this.hoveredMesh.userData;
        if (data.type === 'monster') this._handleMonsterClick(this.hoveredEntity);
        else if (data.type === 'tree') this._handleResourceClick(this.hoveredEntity, 'woodcutting');
        else if (data.type === 'rock') this._handleResourceClick(this.hoveredEntity, 'mining');
        else if (data.type === 'ground_item') this._handleGroundItemClick(this.hoveredMesh, this.hoveredEntity);
        else if (data.type === 'fishing_spot') this._handleFishingClick();
        else if (data.type === 'npc') this._handleNPCClick(data.npcId);
        else if (data.type === 'campfire') this._handleCampfireClick();
        else if (data.type === 'furnace') this._handleFurnaceClick();
        else if (data.type === 'anvil') this._handleAnvilClick();
        else if (data.type === 'sheep') this._handleSheepClick();
        else if (data.type === 'agility') this._handleAgilityClick(data.obstacleIndex);
        else if (data.type === 'rune_altar') this._handleRuneAltarClick();
        else if (data.type === 'church') this._handleChurchClick();
        else if (data.type === 'gravestone') this._handleGravestoneClick();
    }

    onRightClick(screenX, screenY) {
        if (!this.hoveredMesh) return;
        this.game.contextMenu.show(screenX, screenY, this.hoveredMesh, this.hoveredEntity);
    }

    // -- Existing handlers ---------------------------------------------------

    _handleMonsterClick(monster) {
        if (!monster || !monster.alive) return;
        const player = this.game.player;
        player.stopActions();
        const dist = this.game.distanceToPlayer(monster.position);
        if (dist > CONFIG.COMBAT.meleeRange) { this.game.addChatMessage("You're too far away to attack that.", 'system'); return; }
        player.inCombat = true;
        player.combatTarget = monster;
        player.attackTimer = 0;
        monster.startCombat();
        this.game.addChatMessage(`You attack the ${monster.name}.`);
    }

    _handleResourceClick(node, skillType) {
        if (node.depleted) { this.game.addChatMessage('This resource is depleted.', 'system'); return; }
        const player = this.game.player;
        player.stopActions();
        const dist = this.game.distanceToPlayer(node.mesh.position);
        if (dist > CONFIG.PLAYER.interactionRange) { this.game.addChatMessage("You're too far away.", 'system'); return; }
        const skillLevel = player.skills[skillType].level;
        if (skillLevel < node.requiredLevel) {
            this.game.addChatMessage(`You need level ${node.requiredLevel} ${CONFIG.SKILLS[skillType].name} to do that.`, 'system');
            return;
        }
        player.skilling = true;
        player.skillingTarget = node;
        player.skillingType = skillType;
        this.game.addChatMessage(`You swing your ${skillType === 'woodcutting' ? 'axe' : 'pickaxe'} at the ${node.name}.`);
    }

    _handleGroundItemClick(mesh, entity) {
        const dist = this.game.distanceToPlayer(mesh.position);
        if (dist > CONFIG.PLAYER.interactionRange) { this.game.addChatMessage("You're too far away.", 'system'); return; }
        const added = this.game.inventorySystem.addItem(entity.itemId, entity.qty);
        if (added) {
            const itemDef = CONFIG.ITEMS[entity.itemId];
            const itemName = itemDef.name;
            this.game.addChatMessage(`You pick up: ${itemName}${entity.qty > 1 ? ' x' + entity.qty : ''}.`);
            this.game.audio.playPickup();
            this._animatePickup(mesh);
            // Loot notification popup
            this._showLootNotification(itemDef.icon, itemName, entity.qty);
        } else {
            this.game.addChatMessage("Your inventory is full!", 'system');
        }
    }

    _animatePickup(mesh) {
        // Prevent double-pickup: remove from tracking immediately
        mesh.userData.interactable = false;
        const env = this.game.environment;
        const idx = env.groundItems.findIndex(g => g.mesh === mesh);
        if (idx >= 0) env.groundItems.splice(idx, 1);
        const iIdx = env.interactables.indexOf(mesh);
        if (iIdx >= 0) env.interactables.splice(iIdx, 1);

        // Animate mesh flying toward camera
        const startPos = mesh.position.clone();
        const startTime = performance.now();
        const duration = 300; // ms
        if (mesh.material) mesh.material.transparent = true;

        const animate = () => {
            const elapsed = performance.now() - startTime;
            const t = Math.min(1, elapsed / duration);
            const eased = t * t; // ease-in

            const camPos = this.game.engine.camera.position;
            mesh.position.lerpVectors(startPos, camPos, eased);
            mesh.scale.setScalar(1 - t * 0.7);
            if (mesh.material) mesh.material.opacity = 1 - t;

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                env.scene.remove(mesh);
                if (mesh.geometry) mesh.geometry.dispose();
                if (mesh.material) mesh.material.dispose();
            }
        };
        requestAnimationFrame(animate);
    }

    _showLootNotification(icon, name, qty) {
        const container = document.getElementById('loot-notifications');
        if (!container) return;
        const el = document.createElement('div');
        el.className = 'loot-notif';
        el.innerHTML = `<span class="loot-icon">${icon}</span>${name}${qty > 1 ? ' x' + qty : ''}`;
        container.appendChild(el);
        setTimeout(() => el.remove(), 3000);
        while (container.children.length > 5) container.removeChild(container.firstChild);
    }

    _handleFishingClick() {
        const player = this.game.player;
        if (!this.hoveredMesh) return;
        const dist = this.game.distanceToPlayer(this.hoveredMesh.position);
        if (dist > CONFIG.PLAYER.interactionRange) { this.game.addChatMessage("You're too far away.", 'system'); return; }

        const fishType = this.hoveredEntity?.fishType || this.hoveredMesh?.userData?.fishType || 'shrimp';
        const fishConfig = CONFIG.FISHING[fishType];
        if (!fishConfig) return;

        // Check level
        if (player.skills.fishing.level < fishConfig.requiredLevel) {
            this.game.addChatMessage(`You need Fishing level ${fishConfig.requiredLevel} to catch ${fishConfig.name}.`, 'system');
            return;
        }

        player.stopActions();
        player.skilling = true;
        player.skillingTarget = { type: 'fishing_spot', fishType };
        player.skillingType = 'fishing';
        this.game.addChatMessage(`You cast your net into the water, fishing for ${fishConfig.name.toLowerCase()}.`);
    }

    _getNPCPosition(npcId, npcConfig) {
        const npcEntry = this.game.environment.npcs.find(n => n.id === npcId);
        if (npcEntry) return { x: npcEntry.mesh.position.x, z: npcEntry.mesh.position.z };
        return { x: npcConfig.x, z: npcConfig.z };
    }

    _handleNPCClick(npcId) {
        const npcConfig = CONFIG.NPCS[npcId];
        if (!npcConfig) return;
        const npcPos = this._getNPCPosition(npcId, npcConfig);
        const dist = this.game.distanceToPlayer(npcPos);
        if (dist > CONFIG.PLAYER.interactionRange) { this.game.addChatMessage("You're too far away.", 'system'); return; }
        this.game.player.stopActions();
        this.game.questSystem.openDialogue(npcId);
    }

    _handleCampfireClick() {
        const player = this.game.player;
        const campfirePos = this.game.environment.campfirePosition;
        const dist = this.game.distanceToPlayer(campfirePos);
        if (dist > CONFIG.PLAYER.interactionRange) { this.game.addChatMessage("You're too far away.", 'system'); return; }
        const inv = this.game.inventorySystem;
        let cookableId = null;
        for (let i = 0; i < 28; i++) {
            const slot = inv.getSlot(i);
            if (slot) {
                const item = CONFIG.ITEMS[slot.itemId];
                if (item && item.cookable) { cookableId = slot.itemId; break; }
            }
        }
        if (!cookableId) { this.game.addChatMessage("You don't have anything to cook.", 'system'); return; }
        player.stopActions();
        player.skilling = true;
        player.skillingTarget = { type: 'campfire', cookableId };
        player.skillingType = 'cooking';
        this.game.addChatMessage(`You cook the ${CONFIG.ITEMS[cookableId].name.toLowerCase()} on the fire.`);
    }

    // -- New handlers --------------------------------------------------------

    // ── Furnace → Smelting selection UI ─────────────────────────────────
    _handleFurnaceClick() {
        if (this.hoveredMesh) {
            const dist = this.game.distanceToPlayer(this.hoveredMesh.position);
            if (dist > CONFIG.PLAYER.interactionRange) { this.game.addChatMessage("You're too far away.", 'system'); return; }
        }
        this._openSmeltingUI();
    }

    _openSmeltingUI() {
        const overlay = document.getElementById('smelting-overlay');
        const grid = document.getElementById('smelting-grid');
        grid.innerHTML = '';

        const inv = this.game.inventorySystem;
        const level = this.game.player.skills.smithing.level;

        for (const [barId, recipe] of Object.entries(CONFIG.SMITHING.smelting)) {
            const itemDef = CONFIG.ITEMS[barId];
            const hasLevel = level >= recipe.level;

            // Build ore requirement string
            const oreParts = [];
            let hasAll = true;
            for (const [oreId, qty] of Object.entries(recipe.ores)) {
                const have = inv.countItem(oreId);
                const enough = have >= qty;
                if (!enough) hasAll = false;
                const cls = enough ? 'has-ore' : 'no-ore';
                oreParts.push(`<span class="${cls}">${qty}x ${CONFIG.ITEMS[oreId]?.name || oreId}</span>`);
            }

            const canSmelt = hasLevel && hasAll;
            const el = document.createElement('div');
            el.className = `smelt-item${canSmelt ? '' : ' disabled'}`;
            el.innerHTML = `
                <div class="smelt-item-icon">${itemDef?.icon || '?'}</div>
                <div class="smelt-item-name">${itemDef?.name || barId}</div>
                <div class="smelt-item-ores">${oreParts.join(', ')}</div>
                ${!hasLevel ? `<div class="smelt-item-level">Lvl ${recipe.level}</div>` : ''}
            `;
            if (canSmelt) {
                el.addEventListener('click', () => this._doSmelt(barId, recipe));
            }
            grid.appendChild(el);
        }

        overlay.classList.remove('hidden');
        this.game.input.cursorMode = true;
        document.exitPointerLock();
        document.getElementById('smelting-close').onclick = () => this._closeSmeltingUI();
        document.addEventListener('keydown', this._smeltingEscHandler = (e) => {
            if (e.key === 'Escape') this._closeSmeltingUI();
        });
    }

    _closeSmeltingUI() {
        document.getElementById('smelting-overlay').classList.add('hidden');
        if (this._smeltingEscHandler) {
            document.removeEventListener('keydown', this._smeltingEscHandler);
            this._smeltingEscHandler = null;
        }
    }

    _doSmelt(barId, recipe) {
        const inv = this.game.inventorySystem;
        // Remove ores first (frees slots for the bar)
        for (const [oreId, qty] of Object.entries(recipe.ores)) {
            inv.removeItem(oreId, qty);
        }
        // Try to add the bar
        if (!inv.addItem(barId, 1)) {
            // Safety: give ores back if somehow still full
            for (const [oreId, qty] of Object.entries(recipe.ores)) {
                inv.addItem(oreId, qty);
            }
            this.game.addChatMessage("Your inventory is full!", 'system');
            return;
        }
        this.game.skillSystem.addXP('smithing', recipe.xp);
        this.game.audio.playPickup();
        this.game.addChatMessage(`You smelt a ${CONFIG.ITEMS[barId].name}.`);
        // Refresh so counts update
        this._openSmeltingUI();
    }

    // ── Anvil → Smithing selection UI ────────────────────────────────────
    _handleAnvilClick() {
        if (this.hoveredMesh) {
            const dist = this.game.distanceToPlayer(this.hoveredMesh.position);
            if (dist > CONFIG.PLAYER.interactionRange) { this.game.addChatMessage("You're too far away.", 'system'); return; }
        }
        this._openSmithingUI();
    }

    _openSmithingUI(activeBar) {
        const overlay = document.getElementById('smithing-overlay');
        const tabsEl = document.getElementById('smithing-bar-tabs');
        const grid = document.getElementById('smithing-grid');
        tabsEl.innerHTML = '';
        grid.innerHTML = '';

        const inv = this.game.inventorySystem;
        const level = this.game.player.skills.smithing.level;

        // Determine which bar types the player has (for tabs)
        const barTypes = [];
        const seen = new Set();
        for (const [, recipe] of Object.entries(CONFIG.SMITHING.anvil)) {
            if (!seen.has(recipe.bar)) {
                seen.add(recipe.bar);
                barTypes.push(recipe.bar);
            }
        }

        // Default to first bar player owns, or first available
        if (!activeBar) {
            activeBar = barTypes.find(b => inv.hasItem(b)) || barTypes[0];
        }

        // Build bar tabs
        for (const barId of barTypes) {
            const barDef = CONFIG.ITEMS[barId];
            const count = inv.countItem(barId);
            const tab = document.createElement('button');
            tab.className = `smithing-tab${barId === activeBar ? ' active' : ''}${count === 0 ? ' disabled' : ''}`;
            tab.textContent = `${barDef?.icon || ''} ${barDef?.name || barId} (${count})`;
            tab.addEventListener('click', () => {
                this._openSmithingUI(barId);
            });
            tabsEl.appendChild(tab);
        }

        // Build recipe grid for active bar
        for (const [itemId, recipe] of Object.entries(CONFIG.SMITHING.anvil)) {
            if (recipe.bar !== activeBar) continue;

            const itemDef = CONFIG.ITEMS[itemId];
            const hasLevel = level >= recipe.level;
            const barCount = inv.countItem(recipe.bar);
            const hasBars = barCount >= recipe.qty;
            const canSmith = hasLevel && hasBars;

            const el = document.createElement('div');
            el.className = `smith-item${canSmith ? '' : ' disabled'}`;

            const barsClass = hasBars ? 'has-bars' : 'no-bars';
            el.innerHTML = `
                <div class="smith-item-icon">${itemDef?.icon || '?'}</div>
                <div class="smith-item-name">${itemDef?.name || itemId}</div>
                <div class="smith-item-bars"><span class="${barsClass}">${recipe.qty} bar${recipe.qty > 1 ? 's' : ''}</span></div>
                ${!hasLevel ? `<div class="smith-item-level">Lvl ${recipe.level}</div>` : ''}
            `;
            if (canSmith) {
                el.addEventListener('click', () => this._doSmith(itemId, recipe, activeBar));
            }
            grid.appendChild(el);
        }

        overlay.classList.remove('hidden');
        this.game.input.cursorMode = true;
        document.exitPointerLock();
        document.getElementById('smithing-close').onclick = () => this._closeSmithingUI();
        document.addEventListener('keydown', this._smithingEscHandler = (e) => {
            if (e.key === 'Escape') this._closeSmithingUI();
        });
    }

    _closeSmithingUI() {
        document.getElementById('smithing-overlay').classList.add('hidden');
        if (this._smithingEscHandler) {
            document.removeEventListener('keydown', this._smithingEscHandler);
            this._smithingEscHandler = null;
        }
    }

    _doSmith(itemId, recipe, activeBar) {
        const inv = this.game.inventorySystem;
        // Remove bars first (frees slots for the product)
        inv.removeItem(recipe.bar, recipe.qty);
        // Try to add the smithed item
        if (!inv.addItem(itemId, 1)) {
            // Safety: give bars back if somehow still full
            inv.addItem(recipe.bar, recipe.qty);
            this.game.addChatMessage("Your inventory is full!", 'system');
            return;
        }
        this.game.skillSystem.addXP('smithing', recipe.xp);
        this.game.audio.playPickup();
        this.game.addChatMessage(`You smith a ${CONFIG.ITEMS[itemId].name}.`);
        // Refresh so bar counts update
        this._openSmithingUI(activeBar);
    }

    _handleSheepClick() {
        const dist = this.game.distanceToPlayer(this.hoveredMesh.position);
        if (dist > CONFIG.PLAYER.interactionRange) { this.game.addChatMessage("You're too far away.", 'system'); return; }

        const inv = this.game.inventorySystem;
        if (inv.isFull()) {
            this.game.addChatMessage("Your inventory is full!", 'system');
            return;
        }

        inv.addItem('wool', 1);
        this.game.addChatMessage('You shear the sheep and get some wool.');
    }

    _handleAgilityClick(obstacleIndex) {
        const player = this.game.player;
        const dist = this.game.distanceToPlayer(this.hoveredMesh.position);
        if (dist > CONFIG.PLAYER.interactionRange) { this.game.addChatMessage("You're too far away.", 'system'); return; }

        const obstacle = CONFIG.AGILITY.obstacles[obstacleIndex];
        if (!obstacle) return;

        const agilityLevel = player.skills.agility.level;
        if (agilityLevel < obstacle.level) {
            this.game.addChatMessage(`You need level ${obstacle.level} Agility to attempt this obstacle.`, 'system');
            return;
        }

        // Obstacles must be completed in order (0-4) for a lap
        const expectedIndex = (player.lastAgilityObstacle === undefined || player.lastAgilityObstacle === 4)
            ? 0
            : player.lastAgilityObstacle + 1;

        if (obstacleIndex !== expectedIndex && obstacleIndex !== 0) {
            this.game.addChatMessage('You need to start from the beginning of the course.', 'system');
            return;
        }

        // Reset lap tracking if starting over
        if (obstacleIndex === 0) {
            player.lastAgilityObstacle = 0;
        } else {
            player.lastAgilityObstacle = obstacleIndex;
        }

        this.game.skillSystem.addXP('agility', obstacle.xp);
        this.game.addChatMessage(`You successfully cross the ${obstacle.name || 'obstacle'}.`);

        // Completing all 5 obstacles (index 4 is the last) finishes a lap
        if (obstacleIndex === 4) {
            const completionXP = CONFIG.AGILITY.completionXP || 0;
            if (completionXP > 0) {
                this.game.skillSystem.addXP('agility', completionXP);
            }
            this.game.addChatMessage('You complete a lap of the agility course!');
            if (this.game.achievementSystem) this.game.achievementSystem.unlock('agility_lap');
        }
    }

    _handleRuneAltarClick() {
        const player = this.game.player;
        const dist = this.game.distanceToPlayer(this.hoveredMesh.position);
        if (dist > CONFIG.PLAYER.interactionRange) { this.game.addChatMessage("You're too far away.", 'system'); return; }

        const inv = this.game.inventorySystem;
        const rcLevel = player.skills.runecrafting.level;

        // Check for rune essence in inventory
        const essenceCount = inv.countItem('rune_essence');
        if (essenceCount <= 0) {
            this.game.addChatMessage("You don't have any rune essence.", 'system');
            return;
        }

        // Find highest-level rune the player can craft
        let bestRuneId = null;
        let bestRuneData = null;
        for (const [runeId, runeData] of Object.entries(CONFIG.RUNECRAFTING)) {
            if (rcLevel >= runeData.level) {
                bestRuneId = runeId;
                bestRuneData = runeData;
            }
        }

        if (!bestRuneData) {
            this.game.addChatMessage("You don't have a high enough Runecrafting level.", 'system');
            return;
        }

        // Calculate multiplier (more runes per essence at higher levels)
        let multiplier = 1;
        if (bestRuneData.multiplierLevel && rcLevel >= bestRuneData.multiplierLevel) {
            multiplier = Math.floor(rcLevel / bestRuneData.multiplierLevel);
            if (multiplier < 1) multiplier = 1;
        }

        inv.removeItem('rune_essence', essenceCount);
        const runesProduced = essenceCount * multiplier;
        inv.addItem(bestRuneId, runesProduced);
        this.game.skillSystem.addXP('runecrafting', bestRuneData.xp * essenceCount);
        const runeName = CONFIG.ITEMS[bestRuneId].name;
        this.game.addChatMessage(`You craft ${runesProduced} ${runeName}${runesProduced > 1 ? 's' : ''}.`);
        if (this.game.achievementSystem) this.game.achievementSystem.unlock('craft_runes');
    }

    _handleChurchClick() {
        const dist = this.game.distanceToPlayer(this.hoveredMesh.position);
        if (dist > CONFIG.PLAYER.interactionRange) { this.game.addChatMessage("You're too far away.", 'system'); return; }

        this.game.prayerSystem.restorePoints();
        this.game.addChatMessage('You pray at the church. Your prayer points have been restored.');
    }

    // -- Utility handlers (called from inventory / other systems) ------------

    _handleBuryBones() {
        const inv = this.game.inventorySystem;
        let bonesSlot = null;
        for (let i = 0; i < 28; i++) {
            const slot = inv.getSlot(i);
            if (slot) {
                const item = CONFIG.ITEMS[slot.itemId];
                if (item && item.prayerXP) { bonesSlot = slot; break; }
            }
        }

        if (!bonesSlot) {
            this.game.addChatMessage("You don't have any bones to bury.", 'system');
            return;
        }

        inv.removeItem(bonesSlot.itemId, 1);
        this.game.prayerSystem.buryBones(bonesSlot.itemId);
        this.game.addChatMessage(`You bury the ${CONFIG.ITEMS[bonesSlot.itemId].name.toLowerCase()}.`);
    }

    _handleFiremaking() {
        const player = this.game.player;
        const inv = this.game.inventorySystem;
        const fmLevel = player.skills.firemaking.level;

        // Find logs in inventory
        let logsSlot = null;
        for (let i = 0; i < 28; i++) {
            const slot = inv.getSlot(i);
            if (slot) {
                const item = CONFIG.ITEMS[slot.itemId];
                if (item && item.fmLevel !== undefined) { logsSlot = slot; break; }
            }
        }

        if (!logsSlot) {
            this.game.addChatMessage("You don't have any logs.", 'system');
            return;
        }

        const logItem = CONFIG.ITEMS[logsSlot.itemId];
        if (fmLevel < (logItem.fmLevel || 1)) {
            this.game.addChatMessage(`You need level ${logItem.fmLevel} Firemaking to burn those logs.`, 'system');
            return;
        }

        inv.removeItem(logsSlot.itemId, 1);
        this.game.skillSystem.addXP('firemaking', logItem.fmXP || 40);
        this.game.addChatMessage(`You light the ${logItem.name.toLowerCase()} and a fire springs to life.`);
        if (this.game.achievementSystem) this.game.achievementSystem.unlock('first_fire');

        // Spawn a temporary fire mesh at the player position
        const fireGeo = new THREE.ConeGeometry(0.3, 0.8, 6);
        const fireMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        const fireMesh = new THREE.Mesh(fireGeo, fireMat);
        fireMesh.position.copy(player.position);
        fireMesh.position.y = 0.4;
        this.game.engine.scene.add(fireMesh);

        // Remove fire after 60 seconds
        setTimeout(() => {
            this.game.engine.scene.remove(fireMesh);
            fireGeo.dispose();
            fireMat.dispose();
        }, 60000);
    }

    // ── Fletching: Craft arrows/bows from logs ──
    _handleFletching(logId) {
        const player = this.game.player;
        const inv = this.game.inventorySystem;
        const fletchLevel = player.skills.fletching?.level || 1;

        // Find all recipes that use this log type and the player can make
        const candidates = [];
        for (const [productId, recipe] of Object.entries(CONFIG.FLETCHING)) {
            if (recipe.logs === logId && fletchLevel >= recipe.level) {
                candidates.push({ productId, recipe });
            }
        }

        if (candidates.length === 0) {
            this.game.addChatMessage("You don't have the Fletching level to make anything with those logs.", 'system');
            return;
        }

        // Prefer the highest-level arrow recipe, then bows
        const arrowRecipes = candidates.filter(c => c.recipe.feathers > 0);
        const bowRecipes = candidates.filter(c => c.recipe.feathers === 0);

        // Try arrows first (higher priority), then bows
        const ordered = [...arrowRecipes.reverse(), ...bowRecipes.reverse()];

        for (const { productId, recipe } of ordered) {
            if (this._doFletch(productId, recipe)) return;
        }

        this.game.addChatMessage("You don't have the required materials.", 'system');
    }

    _doFletch(productId, recipe) {
        const inv = this.game.inventorySystem;

        // Check logs
        if (!inv.hasItem(recipe.logs)) return false;

        // Check feathers if needed
        if (recipe.feathers > 0 && !inv.hasItem('feather', recipe.feathers)) {
            this.game.addChatMessage(`You need ${recipe.feathers} feathers to fletch ${recipe.name.toLowerCase()}.`, 'system');
            return false;
        }

        // Consume ingredients
        inv.removeItem(recipe.logs, 1);
        if (recipe.feathers > 0) inv.removeItem('feather', recipe.feathers);

        // Produce output
        const added = inv.addItem(productId, recipe.qty);
        if (!added) {
            // Rollback — inventory full
            inv.addItem(recipe.logs, 1);
            if (recipe.feathers > 0) inv.addItem('feather', recipe.feathers);
            this.game.addChatMessage("Your inventory is full.", 'system');
            return false;
        }

        this.game.skillSystem.addXP('fletching', recipe.xp * recipe.qty);
        this.game.addChatMessage(`You fletch ${recipe.qty > 1 ? recipe.qty + ' ' : ''}${recipe.name.toLowerCase()}.`);
        return true;
    }

    // ── Thieving: Pickpocket NPC ──
    handleThieving(npcId) {
        const player = this.game.player;
        if (player.stunned) {
            this.game.addChatMessage("You're stunned and can't pickpocket right now.", 'system');
            return;
        }

        const thievingData = CONFIG.THIEVING[npcId];
        if (!thievingData) {
            this.game.addChatMessage("You can't pickpocket this NPC.", 'system');
            return;
        }

        const npcConfig = CONFIG.NPCS[npcId];
        if (!npcConfig) return;
        const npcPos = this._getNPCPosition(npcId, npcConfig);
        const dist = this.game.distanceToPlayer(npcPos);
        if (dist > CONFIG.PLAYER.interactionRange) {
            this.game.addChatMessage("You're too far away.", 'system');
            return;
        }

        const level = player.skills.thieving?.level || 1;
        if (level < thievingData.requiredLevel) {
            this.game.addChatMessage(`You need Thieving level ${thievingData.requiredLevel} to pickpocket ${thievingData.name}.`, 'system');
            return;
        }

        // Success/fail roll
        const successChance = thievingData.successBase + (level - thievingData.requiredLevel) * 0.02;
        if (Math.random() < successChance) {
            // Success!
            const inv = this.game.inventorySystem;
            for (const loot of thievingData.loot) {
                inv.addItem(loot.item, loot.qty);
                const itemName = CONFIG.ITEMS[loot.item]?.name || loot.item;
                this.game.addChatMessage(`You pickpocket: ${itemName}${loot.qty > 1 ? ' x' + loot.qty : ''}.`);
            }
            this.game.skillSystem.addXP('thieving', thievingData.xp);
            this.game.addChatMessage(`You successfully pickpocket the ${thievingData.name}.`, 'level-up');
        } else {
            // Fail - get stunned
            player.stunned = true;
            player.stunTimer = thievingData.stunTicks * CONFIG.COMBAT.tickDuration;
            this.game.addChatMessage(`You fail to pickpocket the ${thievingData.name}. You've been stunned!`, 'damage');
            // Take small damage
            const stunDmg = Math.floor(Math.random() * 3) + 1;
            player.hp = Math.max(0, player.hp - stunDmg);
            this.game.addChatMessage(`The ${thievingData.name} hits you for ${stunDmg} damage.`, 'damage');
            if (player.hp <= 0) {
                this.game.combatSystem._onPlayerDeath();
            }
        }
    }

    // ── Gravestone: Reclaim items ──
    _handleGravestoneClick() {
        if (!this.hoveredMesh) return;
        const dist = this.game.distanceToPlayer(this.hoveredMesh.position);
        if (dist > CONFIG.PLAYER.interactionRange) { this.game.addChatMessage("You're too far away.", 'system'); return; }

        const entity = this.hoveredEntity;
        if (!entity || entity.type !== 'gravestone' || !entity.items) return;

        const inv = this.game.inventorySystem;
        let reclaimed = 0;
        for (const item of entity.items) {
            if (inv.addItem(item.itemId, item.qty)) {
                reclaimed++;
                const itemName = CONFIG.ITEMS[item.itemId]?.name || item.itemId;
                this.game.addChatMessage(`Reclaimed: ${itemName}${item.qty > 1 ? ' x' + item.qty : ''}.`);
            } else {
                this.game.addChatMessage("Your inventory is full! Some items remain.", 'system');
                break;
            }
        }

        if (reclaimed === entity.items.length) {
            this.game.environment.removeGravestone(this.hoveredMesh);
            this.game.addChatMessage('You reclaim all your items from the gravestone.');
        } else {
            // Remove reclaimed items from gravestone
            entity.items.splice(0, reclaimed);
        }
    }

    // ── Herblore: Brew potions at campfire ──
    handlePotionBrew() {
        const player = this.game.player;
        const campfirePos = this.game.environment.campfirePosition;
        if (!campfirePos) { this.game.addChatMessage("You need to be near a campfire.", 'system'); return; }
        const dist = this.game.distanceToPlayer(campfirePos);
        if (dist > CONFIG.PLAYER.interactionRange) { this.game.addChatMessage("You need to be near a campfire.", 'system'); return; }

        const inv = this.game.inventorySystem;
        const herbloreLevel = player.skills.herblore?.level || 1;

        // Find highest-level potion the player can make
        let bestPotion = null;
        let bestPotionId = null;
        for (const [potionId, recipe] of Object.entries(CONFIG.HERBLORE)) {
            if (herbloreLevel >= recipe.level) {
                if (inv.countItem('herb') >= recipe.herb && inv.countItem('vial') >= recipe.vial) {
                    if (!bestPotion || recipe.level > bestPotion.level) {
                        bestPotion = recipe;
                        bestPotionId = potionId;
                    }
                }
            }
        }

        if (!bestPotion) {
            this.game.addChatMessage("You don't have the herbs and vials, or your Herblore level is too low.", 'system');
            return;
        }

        // Remove ingredients first (frees slots for the potion)
        inv.removeItem('herb', bestPotion.herb);
        inv.removeItem('vial', bestPotion.vial);
        // Try to add the potion
        if (!inv.addItem(bestPotionId, 1)) {
            // Safety: give ingredients back if somehow still full
            inv.addItem('herb', bestPotion.herb);
            inv.addItem('vial', bestPotion.vial);
            this.game.addChatMessage("Your inventory is full!", 'system');
            return;
        }
        this.game.skillSystem.addXP('herblore', bestPotion.xp);
        this.game.addChatMessage(`You brew a ${bestPotion.name}.`, 'level-up');
    }
}
