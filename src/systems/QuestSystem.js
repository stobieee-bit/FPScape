import { CONFIG } from '../config.js';

export class QuestSystem {
    constructor(game) {
        this.game = game;
        this.quests = {}; // questId -> { status: 'not_started'|'in_progress'|'complete', progress: {} }
        this.activeDialogue = null;

        // Build dialogue UI
        this._buildDialogueUI();
    }

    _buildDialogueUI() {
        this._overlay = document.getElementById('dialogue-overlay');
        this._npcName = document.getElementById('dialogue-npc-name');
        this._text = document.getElementById('dialogue-text');
        this._optionsEl = document.getElementById('dialogue-options');
    }

    openDialogue(npcId) {
        const npcConfig = CONFIG.NPCS[npcId];
        if (!npcConfig) return;

        // Determine which dialogue to show based on quest state
        const dialogueKey = this._getDialogueKey(npcId);
        const dialogue = npcConfig.dialogues[dialogueKey];
        if (!dialogue) return;

        this.activeDialogue = { npcId, dialogueKey, step: 0 };
        this._showDialogueStep(npcConfig, dialogue, 0);

        // Release pointer lock for UI interaction
        this.game.input.cursorMode = true;
        document.exitPointerLock();
    }

    _getDialogueKey(npcId) {
        const npcConfig = CONFIG.NPCS[npcId];
        if (!npcConfig.quest) return 'default';

        const questId = npcConfig.quest;
        const status = this.quests[questId]?.status || 'not_started';

        if (status === 'complete') return 'quest_complete';
        if (status === 'in_progress') {
            // Check if player has fulfilled requirements
            if (this.canTurnIn(questId)) return 'quest_turnin';
            return 'quest_progress';
        }
        return 'quest_offer';
    }

    _showDialogueStep(npcConfig, dialogue, step) {
        if (step >= dialogue.length) {
            this.closeDialogue();
            return;
        }

        const entry = dialogue[step];
        this._npcName.textContent = npcConfig.name;
        this._text.textContent = entry.text;
        this._optionsEl.innerHTML = '';

        if (entry.options) {
            for (const opt of entry.options) {
                const btn = document.createElement('div');
                btn.className = 'dialogue-option';
                btn.textContent = opt.label;
                btn.addEventListener('click', () => {
                    if (opt.action) this._handleAction(opt.action);
                    if (opt.next !== undefined) {
                        this._showDialogueStep(npcConfig, dialogue, opt.next);
                    } else {
                        this.closeDialogue();
                    }
                });
                this._optionsEl.appendChild(btn);
            }
        } else {
            // Continue button
            const btn = document.createElement('div');
            btn.className = 'dialogue-option';
            btn.textContent = 'Continue';
            btn.addEventListener('click', () => {
                this._showDialogueStep(npcConfig, dialogue, step + 1);
            });
            this._optionsEl.appendChild(btn);
        }

        this._overlay.classList.remove('hidden');
    }

    closeDialogue() {
        this._overlay.classList.add('hidden');
        this.activeDialogue = null;
    }

    _handleAction(action) {
        if (action === 'accept_quest') {
            const npcId = this.activeDialogue.npcId;
            const questId = CONFIG.NPCS[npcId].quest;
            const questConfig = CONFIG.QUESTS[questId];
            this.quests[questId] = { status: 'in_progress', progress: {} };
            this.game.addChatMessage(`Quest started: ${questConfig.name}`, 'level-up');
        } else if (action === 'turnin_quest') {
            const npcId = this.activeDialogue.npcId;
            const questId = CONFIG.NPCS[npcId].quest;
            const questConfig = CONFIG.QUESTS[questId];

            // Remove required items (consumed on turn-in)
            if (questConfig.requirements?.items) {
                for (const req of questConfig.requirements.items) {
                    this.game.inventorySystem.removeItem(req.item, req.qty);
                }
            }

            // Kill requirements are checked but NOT consumed
            // (player.killCounts persist)

            // Give rewards
            if (questConfig.rewards) {
                if (questConfig.rewards.xp) {
                    for (const [skill, amount] of Object.entries(questConfig.rewards.xp)) {
                        this.game.skillSystem.addXP(skill, amount);
                    }
                }
                if (questConfig.rewards.items) {
                    for (const reward of questConfig.rewards.items) {
                        this.game.inventorySystem.addItem(reward.item, reward.qty);
                    }
                }
            }

            this.quests[questId] = { status: 'complete', progress: {} };
            this.game.addChatMessage(`Quest complete: ${questConfig.name}!`, 'level-up');
            this.game.audio.playLevelUp();

            // Achievement checks
            const completedCount = Object.values(this.quests).filter(q => q.status === 'complete').length;
            if (completedCount === 1) {
                this.game.achievementSystem?.unlock('first_quest');
            }
            const totalQuests = Object.keys(CONFIG.QUESTS).length;
            if (completedCount >= totalQuests) {
                this.game.achievementSystem?.unlock('all_quests');
            }
        } else if (action === 'open_shop') {
            this.closeDialogue();
            this.game.shopSystem.open();
        } else if (action === 'open_bank') {
            this.closeDialogue();
            this.game.bankSystem.open();
        } else if (action === 'assign_slayer') {
            this.closeDialogue();
            this.game.slayerSystem.assignTask();
        } else if (action === 'check_slayer') {
            this.closeDialogue();
            this.game.slayerSystem.checkTask();
        }
    }

    /**
     * Check whether the player meets ALL requirements (items + kills) for a quest.
     * Items are verified via inventorySystem.hasItem; kills via player.killCounts.
     */
    canTurnIn(questId) {
        const questConfig = CONFIG.QUESTS[questId];
        if (!questConfig.requirements) return true;

        // Check item requirements
        if (questConfig.requirements.items) {
            for (const req of questConfig.requirements.items) {
                if (!this.game.inventorySystem.hasItem(req.item, req.qty)) {
                    return false;
                }
            }
        }

        // Check kill requirements
        if (questConfig.requirements.kills) {
            const killCounts = this.game.player.killCounts || {};
            for (const [monster, qty] of Object.entries(questConfig.requirements.kills)) {
                if ((killCounts[monster] || 0) < qty) {
                    return false;
                }
            }
        }

        // Check skill requirements
        if (questConfig.requirements.skills) {
            for (const [skill, level] of Object.entries(questConfig.requirements.skills)) {
                if (this.game.player.skills[skill].level < level) {
                    return false;
                }
            }
        }

        return true;
    }

    getQuestStatus(questId) {
        return this.quests[questId]?.status || 'not_started';
    }
}
