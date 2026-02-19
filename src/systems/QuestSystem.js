import { CONFIG } from '../config.js';

export class QuestSystem {
    constructor(game) {
        this.game = game;
        this.quests = {}; // questId -> { status: 'not_started'|'in_progress'|'complete', progress: {} }
        this.activeDialogue = null;

        // Cutscene system
        this._cutsceneActive = false;
        this._cutsceneSteps = [];
        this._cutsceneStepIndex = 0;
        this._cutsceneTimer = 0;
        this._cutsceneOrigCam = null;  // save original camera state
        this.questFlags = {};  // for branching dialogue (Step 11)
        this.triggeredEvents = []; // for world events (Step 10)

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

    _getActiveQuest(npcId) {
        const npcConfig = CONFIG.NPCS[npcId];
        // Quest chain NPCs: find the first incomplete quest in the chain
        if (npcConfig.questChain) {
            for (const qid of npcConfig.questChain) {
                const status = this.quests[qid]?.status || 'not_started';
                if (status !== 'complete') {
                    // Check prerequisites
                    const questConfig = CONFIG.QUESTS[qid];
                    if (questConfig?.prerequisite) {
                        const prereqStatus = this.quests[questConfig.prerequisite]?.status;
                        if (prereqStatus !== 'complete') return null; // prereq not done yet
                    }
                    return qid;
                }
            }
            return null; // All quests done
        }
        return npcConfig.quest || null;
    }

    _getDialogueKey(npcId) {
        const npcConfig = CONFIG.NPCS[npcId];
        const questId = this._getActiveQuest(npcId);
        if (!questId) {
            // Check if all quest chain quests are done
            if (npcConfig.questChain) {
                const allDone = npcConfig.questChain.every(qid => this.quests[qid]?.status === 'complete');
                if (allDone) return 'quest_complete';
            }
            return npcConfig.quest ? (this.quests[npcConfig.quest]?.status === 'complete' ? 'quest_complete' : 'default') : 'default';
        }

        const status = this.quests[questId]?.status || 'not_started';

        if (status === 'complete') return 'quest_complete';
        if (status === 'in_progress') {
            if (this.canTurnIn(questId)) return npcConfig.questChain ? `quest_turnin_${questId}` : 'quest_turnin';
            return npcConfig.questChain ? `quest_progress_${questId}` : 'quest_progress';
        }
        return npcConfig.questChain ? `quest_offer_${questId}` : 'quest_offer';
    }

    _showDialogueStep(npcConfig, dialogue, step) {
        if (step >= dialogue.length) {
            this.closeDialogue();
            return;
        }

        const entry = dialogue[step];

        // Check conditions on this step
        if (entry.condition) {
            const flagVal = this.questFlags[entry.condition.flag];
            if (flagVal !== entry.condition.value) {
                // Skip this step
                this._showDialogueStep(npcConfig, dialogue, step + 1);
                return;
            }
        }

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
            const questId = this._getActiveQuest(npcId);
            if (!questId) return;
            const questConfig = CONFIG.QUESTS[questId];
            this.quests[questId] = { status: 'in_progress', progress: {} };
            if (this.game.ui) this.game.ui.markDirty('quests');
            this.game.addChatMessage(`Quest started: ${questConfig.name}`, 'level-up');
        } else if (action === 'turnin_quest') {
            const npcId = this.activeDialogue.npcId;
            const questId = this._getActiveQuest(npcId);
            if (!questId) return;
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

            // Conditional rewards based on quest flags
            if (questConfig.rewards?.conditional) {
                const cond = questConfig.rewards.conditional;
                const flagVal = this.questFlags[cond.flag];
                // If expectedValue is defined, compare against it; otherwise use truthy/falsy
                const matches = cond.expectedValue !== undefined ? flagVal === cond.expectedValue : !!flagVal;
                const rewards = matches ? cond.true : cond.false;
                if (rewards) {
                    if (rewards.xp) {
                        for (const [skill, amount] of Object.entries(rewards.xp)) {
                            this.game.skillSystem.addXP(skill, amount);
                        }
                    }
                    if (rewards.items) {
                        for (const reward of rewards.items) {
                            this.game.inventorySystem.addItem(reward.item, reward.qty);
                        }
                    }
                }
            }

            this.quests[questId] = { status: 'complete', progress: {} };
            if (this.game.ui) this.game.ui.markDirty('quests');
            this.game.addChatMessage(`Quest complete: ${questConfig.name}!`, 'level-up');
            this.game.audio.playLevelUp();

            // World events triggered by quest completion
            this._triggerWorldEvents(questId);

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
            const npcId = this.activeDialogue?.npcId;
            const npcCfg = npcId && CONFIG.NPCS[npcId];
            const shopKey = npcCfg?.shop;
            const shopConfig = (typeof shopKey === 'string' && CONFIG.SHOPS?.[shopKey]) ? CONFIG.SHOPS[shopKey] : CONFIG.SHOP;
            this.game.shopSystem.open(shopConfig);
        } else if (action === 'open_bank') {
            this.closeDialogue();
            this.game.bankSystem.open();
        } else if (action === 'open_ge') {
            this.closeDialogue();
            this.game.grandExchangeSystem.open();
        } else if (action === 'assign_slayer') {
            this.closeDialogue();
            this.game.slayerSystem.assignTask();
        } else if (action === 'check_slayer') {
            this.closeDialogue();
            this.game.slayerSystem.checkTask();
        } else if (action.startsWith?.('set_flag:')) {
            // Format: 'set_flag:flagName:value'
            const parts = action.split(':');
            const flagName = parts[1];
            const flagValue = parts[2] === 'false' ? false : (parts[2] === 'true' ? true : parts[2]);
            this.questFlags[flagName] = flagValue;
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

    _triggerWorldEvents(questId) {
        const eventKey = questId + '_complete';
        const events = CONFIG.WORLD_EVENTS?.[eventKey];
        if (!events) return;

        for (const event of events) {
            if (this.triggeredEvents.includes(eventKey + '_' + event.type)) continue;

            if (event.type === 'spawnNPC') {
                this.game.environment.spawnNewNPC(event.data);
            } else if (event.type === 'spawnPortal') {
                this.game.environment.spawnPortal(event.data);
            }

            this.triggeredEvents.push(eventKey + '_' + event.type);
        }
    }

    replayWorldEvents() {
        for (const eventStr of this.triggeredEvents) {
            // Parse: "questId_complete_eventType"
            const parts = eventStr.split('_');
            const eventType = parts[parts.length - 1];
            const questPart = parts.slice(0, -1).join('_'); // everything before last underscore is the event key

            // Re-find the event config
            for (const [key, events] of Object.entries(CONFIG.WORLD_EVENTS || {})) {
                for (const event of events) {
                    if (questPart === key && event.type === eventType) {
                        if (event.type === 'spawnNPC') {
                            this.game.environment.spawnNewNPC(event.data);
                        } else if (event.type === 'spawnPortal') {
                            this.game.environment.spawnPortal(event.data);
                        }
                    }
                }
            }
        }
    }

    playCutscene(steps) {
        this._cutsceneActive = true;
        this._cutsceneSteps = steps;
        this._cutsceneStepIndex = 0;
        this._cutsceneTimer = 0;
        // Save original camera position/rotation
        const cam = this.game.engine.camera;
        this._cutsceneOrigCam = {
            pos: cam.position.clone(),
            rot: cam.rotation.clone(),
        };
        // Show cutscene overlay
        const overlay = document.getElementById('cutscene-overlay');
        if (overlay) overlay.classList.remove('hidden');
        this._startCutsceneStep();
    }

    _startCutsceneStep() {
        if (this._cutsceneStepIndex >= this._cutsceneSteps.length) {
            this._endCutscene();
            return;
        }
        const step = this._cutsceneSteps[this._cutsceneStepIndex];
        this._cutsceneTimer = step.duration || 2;

        const textEl = document.getElementById('cutscene-text');
        if (step.type === 'dialogue' && textEl) {
            textEl.textContent = step.speaker ? `${step.speaker}: ${step.text}` : step.text;
            textEl.classList.remove('hidden');
        } else if (textEl) {
            textEl.classList.add('hidden');
        }
    }

    updateCutscene(dt) {
        if (!this._cutsceneActive) return;

        const step = this._cutsceneSteps[this._cutsceneStepIndex];
        if (!step) { this._endCutscene(); return; }

        this._cutsceneTimer -= dt;

        if (step.type === 'camera_pan') {
            const cam = this.game.engine.camera;
            const progress = 1 - (this._cutsceneTimer / (step.duration || 2));
            const t = Math.min(1, Math.max(0, progress));
            // Smooth ease
            const ease = t * t * (3 - 2 * t);

            if (step.target) {
                cam.position.lerp(step.target, ease * dt * 2);
            }
            if (step.lookAt) {
                cam.lookAt(step.lookAt);
            }
        }

        if (this._cutsceneTimer <= 0) {
            this._cutsceneStepIndex++;
            this._startCutsceneStep();
        }
    }

    _endCutscene() {
        this._cutsceneActive = false;
        // Restore camera
        if (this._cutsceneOrigCam) {
            const cam = this.game.engine.camera;
            cam.position.copy(this._cutsceneOrigCam.pos);
            cam.rotation.copy(this._cutsceneOrigCam.rot);
        }
        // Hide overlay
        const overlay = document.getElementById('cutscene-overlay');
        if (overlay) overlay.classList.add('hidden');
        const textEl = document.getElementById('cutscene-text');
        if (textEl) textEl.classList.add('hidden');
    }

    getQuestStatus(questId) {
        return this.quests[questId]?.status || 'not_started';
    }
}
