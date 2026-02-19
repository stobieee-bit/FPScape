import { CONFIG } from '../config.js';

export class ContextMenu {
    constructor(game) {
        this.game = game;
        this._menu = document.getElementById('context-menu');
        this._title = document.getElementById('context-menu-title');
        this._options = document.getElementById('context-menu-options');

        document.addEventListener('mousedown', (e) => {
            if (e.button === 0 && !this._menu.contains(e.target)) this.hide();
        });
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') this.hide();
        });
    }

    show(screenX, screenY, mesh, entity) {
        const data = mesh.userData;
        this._title.textContent = data.name || 'Object';
        this._options.innerHTML = '';

        const actions = this._getActions(data, entity);
        for (const action of actions) {
            const opt = document.createElement('div');
            opt.className = 'context-option';
            opt.textContent = action.label;
            opt.addEventListener('mousedown', (e) => { if (e.button !== 0) return; e.stopPropagation(); action.handler(); this.hide(); });
            this._options.appendChild(opt);
        }

        const cancel = document.createElement('div');
        cancel.className = 'context-option';
        cancel.textContent = 'Cancel';
        cancel.addEventListener('mousedown', (e) => { if (e.button !== 0) return; e.stopPropagation(); this.hide(); });
        this._options.appendChild(cancel);

        this._menu.style.left = screenX + 'px';
        this._menu.style.top = screenY + 'px';
        this._menu.classList.remove('hidden');

        // Auto-enter cursor mode so player can click options immediately
        if (!this.game.input.cursorMode) {
            this._openedCursorMode = true;
            this.game.input.cursorMode = true;
            document.exitPointerLock();
        }

        requestAnimationFrame(() => {
            const rect = this._menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) this._menu.style.left = (window.innerWidth - rect.width - 5) + 'px';
            if (rect.bottom > window.innerHeight) this._menu.style.top = (window.innerHeight - rect.height - 5) + 'px';
        });
    }

    hide() {
        this._menu.classList.add('hidden');
        // Re-lock pointer if we auto-entered cursor mode for the menu
        if (this._openedCursorMode) {
            this._openedCursorMode = false;
            this.game.input.cursorMode = false;
            this.game.input.requestLock();
        }
    }

    _getActions(data, entity) {
        const actions = [];
        switch (data.type) {
            case 'monster':
                if (entity && entity.alive) {
                    actions.push({ label: `Attack ${data.name} (level ${entity.combatLevel})`, handler: () => this.game.interactionSystem._handleMonsterClick(entity) });
                }
                break;
            case 'tree':
                if (entity && !entity.depleted) actions.push({ label: `Chop down ${data.name}`, handler: () => this.game.interactionSystem._handleResourceClick(entity, 'woodcutting') });
                break;
            case 'rock':
                if (entity && !entity.depleted) actions.push({ label: `Mine ${data.name}`, handler: () => this.game.interactionSystem._handleResourceClick(entity, 'mining') });
                break;
            case 'npc':
                actions.push({ label: `Talk-to ${data.name}`, handler: () => this.game.interactionSystem._handleNPCClick(data.npcId) });
                // Pickpocket option if NPC is in thieving config
                if (data.npcId && CONFIG.THIEVING[data.npcId]) {
                    actions.push({ label: `Pickpocket ${data.name}`, handler: () => this.game.interactionSystem.handleThieving(data.npcId) });
                }
                break;
            case 'campfire':
                actions.push({ label: 'Cook', handler: () => this.game.interactionSystem._handleCampfireClick() });
                actions.push({ label: 'Brew potion', handler: () => this.game.interactionSystem.handlePotionBrew() });
                break;
            case 'gravestone':
                actions.push({ label: 'Reclaim items', handler: () => this.game.interactionSystem._handleGravestoneClick() });
                break;
            case 'ground_item':
                actions.push({ label: `Take ${data.name}`, handler: () => this.game.interactionSystem._handleGroundItemClick(entity?.mesh || null, entity) });
                break;
            case 'fishing_spot':
                actions.push({ label: 'Net Fishing spot', handler: () => this.game.interactionSystem._handleFishingClick() });
                break;
            case 'furnace':
                actions.push({ label: 'Smelt bars', handler: () => this.game.interactionSystem._openSmeltingUI() });
                break;
            case 'anvil':
                actions.push({ label: 'Smith item', handler: () => this.game.interactionSystem._openSmithingUI() });
                break;
            case 'sheep':
                actions.push({ label: 'Shear Sheep', handler: () => this.game.interactionSystem._handleSheepClick() });
                break;
            case 'agility_obstacle':
                actions.push({ label: `Cross ${data.name}`, handler: () => {
                    const idx = CONFIG.AGILITY_COURSE.obstacles.findIndex(o => o.name === data.name);
                    this.game.interactionSystem._handleAgilityClick(idx);
                }});
                break;
            case 'rune_altar':
                actions.push({ label: 'Craft runes', handler: () => this.game.interactionSystem._handleRuneAltarClick() });
                break;
            case 'church':
                actions.push({ label: 'Pray at altar', handler: () => this.game.interactionSystem._handleChurchClick() });
                break;
            case 'remote_player':
                if (data.playerId && this.game.tradeSystem) {
                    actions.push({ label: `Trade ${data.name}`, handler: () => this.game.tradeSystem.requestTrade(data.playerId) });
                }
                break;
        }
        actions.push({ label: `Examine ${data.name}`, handler: () => this._examine(data, entity) });
        return actions;
    }

    _examine(data, entity) {
        let msg = '';
        switch (data.type) {
            case 'monster': msg = entity ? `${data.name} - Combat level ${entity.combatLevel}. HP: ${entity.hp}/${entity.maxHp}.` : `It's a ${data.name}.`; break;
            case 'tree': if (entity) { const c = CONFIG.TREES[data.subType]; msg = `A ${data.name.toLowerCase()}. Requires level ${c.requiredLevel} Woodcutting.`; } else msg = `It's a ${data.name.toLowerCase()}.`; break;
            case 'rock': if (entity) { const c = CONFIG.ROCKS[data.subType]; msg = `A ${data.name.toLowerCase()}. Requires level ${c.requiredLevel} Mining.`; } else msg = `It's a ${data.name.toLowerCase()}.`; break;
            case 'furnace': msg = 'A furnace for smelting ores into bars.'; break;
            case 'anvil': msg = 'An anvil for smithing bars into equipment.'; break;
            case 'sheep': msg = 'A fluffy sheep. You can shear it for wool.'; break;
            case 'agility_obstacle': msg = `${data.name} - Part of the agility course.`; break;
            case 'rune_altar': msg = 'A mysterious altar used to craft runes from essence.'; break;
            case 'church': msg = 'A holy altar. Pray here to restore prayer points.'; break;
            case 'gravestone': msg = 'A gravestone marking where you died. Click to reclaim items.'; break;
            case 'building': msg = `It's the ${data.name}.`; break;
            default: msg = `It's a ${(data.name || 'something')}.`; break;
        }
        this.game.addChatMessage(msg);
    }
}
