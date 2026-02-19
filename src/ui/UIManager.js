import { CONFIG } from '../config.js';

export class UIManager {
    constructor(game) {
        this.game = game;

        // OSRS orb refs
        this._orbHpFill = document.getElementById('orb-hp-fill');
        this._orbHpText = document.getElementById('orb-hp-text');
        this._orbPrayerFill = document.getElementById('orb-prayer-fill');
        this._orbPrayerText = document.getElementById('orb-prayer-text');
        this._orbRunFill = document.getElementById('orb-run-fill');
        this._orbRunText = document.getElementById('orb-run-text');

        this._combatLevel = document.getElementById('combat-level');
        this._inventoryGrid = document.getElementById('inventory-grid');
        this._skillsGrid = document.getElementById('skills-grid');
        this._chatMessages = document.getElementById('chat-messages');
        this._coordsDisplay = document.getElementById('coords');
        this._lastInvSnapshot = '';

        // Special attack orb
        this._orbSpecFill = document.getElementById('orb-spec-fill');
        this._orbSpecText = document.getElementById('orb-spec-text');

        // Skull indicator
        this._skullIndicator = document.getElementById('skull-indicator');

        this._buildSkillsPanel();
        this._buildEquipmentSlots();
        this._buildPrayerPanel();
        this._buildSpellbookPanel();
        this._buildQuestPanel();
        this._buildSettingsPanel();

        // Tab switching (mousedown for instant response in cursor mode)
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.add('active');
            });
        });

        // Attack style buttons (melee/ranged/magic)
        document.querySelectorAll('#style-buttons .style-btn').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                this.game.player.attackStyle = btn.dataset.style;
                document.querySelectorAll('#style-buttons .style-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._updateSubstyleButtons();
                this.game.addChatMessage(`Attack style: ${btn.dataset.style}`, 'system');
            });
        });

        // Combat sub-style buttons (accurate/aggressive/defensive/controlled etc.)
        document.querySelectorAll('.substyle-btn').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                const sub = btn.dataset.substyle;
                const player = this.game.player;
                if (player.attackStyle === 'melee') {
                    player.meleeStyle = sub;
                } else if (player.attackStyle === 'ranged') {
                    player.rangedStyle = sub;
                } else if (player.attackStyle === 'magic') {
                    player.magicStyle = sub;
                }
                document.querySelectorAll('.substyle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._updateXPInfoText();
                this.game.addChatMessage(`Combat style: ${sub}`, 'system');
            });
        });

        // Initial sub-style setup
        this._updateSubstyleButtons();

        // Inventory click handling — use mousedown for instant response.
        this._inventoryGrid.addEventListener('mousedown', e => {
            if (e.button === 0) this._onInventoryClick(e);
            if (e.button === 2) this._onInventoryRightClick(e);
        });
        this._inventoryGrid.addEventListener('contextmenu', e => e.preventDefault());

        // Inventory hover tooltip
        this._invTooltip = document.getElementById('inv-tooltip');
        this._inventoryGrid.addEventListener('mouseover', e => this._onInvSlotHover(e));
        this._inventoryGrid.addEventListener('mouseout', e => {
            if (e.target.closest('.inv-slot')) this._hideInvTooltip();
        });

        // Run orb click to toggle run
        this._orbRunEl = document.getElementById('orb-run');
        if (this._orbRunEl) {
            this._orbRunEl.addEventListener('mousedown', (e) => { if (e.button !== 0) return;
                this.game.input.toggleRun();
                const running = this.game.input._runToggled;
                this.game.addChatMessage(running ? 'Run mode: ON' : 'Run mode: OFF', 'system');
            });
        }

        // Special attack orb click to toggle special
        const orbSpec = document.getElementById('orb-spec');
        if (orbSpec) {
            orbSpec.addEventListener('mousedown', (e) => { if (e.button !== 0) return;
                const p = this.game.player;
                p.specialAttackActive = !p.specialAttackActive;
                this.game.addChatMessage(p.specialAttackActive ? 'Special attack: READY' : 'Special attack: OFF', 'system');
            });
        }

        // Auto-retaliate button
        const autoRetBtn = document.getElementById('auto-retaliate-btn');
        if (autoRetBtn) {
            autoRetBtn.addEventListener('mousedown', (e) => { if (e.button !== 0) return;
                const p = this.game.player;
                p.autoRetaliate = !p.autoRetaliate;
                autoRetBtn.classList.toggle('active', p.autoRetaliate);
                this.game.addChatMessage(`Auto-retaliate: ${p.autoRetaliate ? 'ON' : 'OFF'}`, 'system');
            });
        }
    }

    _updateSubstyleButtons() {
        const player = this.game.player;
        const container = document.getElementById('substyle-buttons');
        if (!container) return;

        // Define sub-styles per main style
        const substyles = {
            melee: [
                { id: 'accurate', label: 'Accurate', xp: 'Attack + HP' },
                { id: 'aggressive', label: 'Aggressive', xp: 'Strength + HP' },
                { id: 'defensive', label: 'Defensive', xp: 'Defence + HP' },
                { id: 'controlled', label: 'Controlled', xp: 'Shared + HP' },
            ],
            ranged: [
                { id: 'accurate', label: 'Accurate', xp: 'Ranged + HP' },
                { id: 'longrange', label: 'Longrange', xp: 'Ranged + Def + HP' },
            ],
            magic: [
                { id: 'standard', label: 'Standard', xp: 'Magic + HP' },
                { id: 'defensive', label: 'Defensive', xp: 'Magic + Def + HP' },
            ],
        };

        const current = substyles[player.attackStyle] || substyles.melee;
        const activeSubstyle = player.attackStyle === 'melee' ? player.meleeStyle
            : player.attackStyle === 'ranged' ? player.rangedStyle
            : player.magicStyle;

        container.innerHTML = '';
        for (const sub of current) {
            const btn = document.createElement('button');
            btn.className = 'substyle-btn' + (sub.id === activeSubstyle ? ' active' : '');
            btn.dataset.substyle = sub.id;
            btn.textContent = sub.label;
            btn.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                if (player.attackStyle === 'melee') player.meleeStyle = sub.id;
                else if (player.attackStyle === 'ranged') player.rangedStyle = sub.id;
                else if (player.attackStyle === 'magic') player.magicStyle = sub.id;
                container.querySelectorAll('.substyle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._updateXPInfoText();
                this.game.addChatMessage(`Combat style: ${sub.label}`, 'system');
            });
            container.appendChild(btn);
        }
        this._updateXPInfoText();
    }

    _updateXPInfoText() {
        const player = this.game.player;
        const el = document.getElementById('xp-style-info');
        if (!el) return;

        const xpMap = {
            melee: {
                accurate: 'XP: Attack + Hitpoints',
                aggressive: 'XP: Strength + Hitpoints',
                defensive: 'XP: Defence + Hitpoints',
                controlled: 'XP: Atk/Str/Def + Hitpoints',
            },
            ranged: {
                accurate: 'XP: Ranged + Hitpoints',
                longrange: 'XP: Ranged + Defence + Hitpoints',
            },
            magic: {
                standard: 'XP: Magic + Hitpoints',
                defensive: 'XP: Magic + Defence + Hitpoints',
            },
        };

        const styleMap = xpMap[player.attackStyle] || xpMap.melee;
        const activeSubstyle = player.attackStyle === 'melee' ? player.meleeStyle
            : player.attackStyle === 'ranged' ? player.rangedStyle
            : player.magicStyle;
        el.textContent = styleMap[activeSubstyle] || 'XP: Hitpoints';
    }

    _buildSkillsPanel() {
        this._skillsGrid.innerHTML = '';
        // Add total level header
        const header = document.createElement('div');
        header.className = 'skills-total';
        header.id = 'skills-total';
        header.textContent = 'Total: 16';
        this._skillsGrid.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'skills-grid-inner';
        for (const [skillId, info] of Object.entries(CONFIG.SKILLS)) {
            const el = document.createElement('div');
            el.className = 'skill-cell';
            el.dataset.skill = skillId;
            el.innerHTML = `<span class="skill-icon">${info.icon}</span><span class="skill-lvl" data-skill="${skillId}">1</span>`;
            el.title = `${info.name}: Level 1`;
            el.addEventListener('mousedown', (e) => { if (e.button === 0) this._showSkillGuide(skillId); });
            el.addEventListener('mouseenter', (e) => this._showSkillTooltip(e, skillId));
            el.addEventListener('mouseleave', () => this._hideSkillTooltip());
            grid.appendChild(el);
        }
        this._skillsGrid.appendChild(grid);
    }

    _buildEquipmentSlots() {
        const container = document.getElementById('equipment-slots');
        if (!container) return;
        container.innerHTML = '';
        const layout = ['head', 'weapon', 'body', 'shield', 'legs', 'feet'];
        for (const slot of layout) {
            const el = document.createElement('div');
            el.className = 'equip-slot';
            el.dataset.slot = slot;
            el.innerHTML = `<div class="equip-label">${slot}</div><div class="equip-item">-</div>`;
            el.addEventListener('mousedown', (e) => { if (e.button === 0) this._onEquipSlotClick(slot); });
            container.appendChild(el);
        }
    }

    _buildPrayerPanel() {
        const container = document.getElementById('prayer-list');
        if (!container) return;
        container.innerHTML = '';
        for (const [prayerId, prayer] of Object.entries(CONFIG.PRAYERS)) {
            const el = document.createElement('div');
            el.className = 'prayer-entry';
            el.dataset.prayer = prayerId;
            const shortName = prayer.name.split(' ')[0];
            el.title = `${prayer.name} (Level ${prayer.level})`;
            el.innerHTML = `<span class="prayer-icon">${prayer.icon || '\u271D'}</span><span class="prayer-name">${shortName}</span>`;
            el.addEventListener('mousedown', (e) => { if (e.button !== 0) return;
                if (this.game.prayerSystem) this.game.prayerSystem.togglePrayer(prayerId);
            });
            container.appendChild(el);
        }
    }

    _buildSpellbookPanel() {
        const container = document.getElementById('spell-list');
        if (!container) return;
        container.innerHTML = '';
        for (const [spellId, spell] of Object.entries(CONFIG.SPELLS)) {
            const el = document.createElement('div');
            el.className = 'spell-entry';
            el.dataset.spell = spellId;
            const runeStr = Object.entries(spell.runes).map(([r, q]) => `${q}${CONFIG.ITEMS[r]?.icon || ''}`).join(' ');
            el.title = `${spell.name} (Lvl ${spell.level})\n${Object.entries(spell.runes).map(([r,q]) => `${q}x ${CONFIG.ITEMS[r]?.name || r}`).join(', ')}\nMax hit: ${spell.maxHit}`;
            el.innerHTML = `<span class="spell-icon-lg">${spell.icon || '🔮'}</span><span class="spell-name">${spell.name}</span><span class="spell-lvl">${runeStr}</span>`;
            el.addEventListener('mousedown', (e) => { if (e.button !== 0) return;
                this.game.player.selectedSpell = spellId;
                this.game.player.attackStyle = 'magic';
                this.game.addChatMessage(`Selected spell: ${spell.name}`, 'system');
                this._updateSpellbook();
            });
            container.appendChild(el);
        }
    }

    _buildSettingsPanel() {
        const container = document.getElementById('settings-panel');
        if (!container) return;

        // Load saved settings
        const saved = JSON.parse(localStorage.getItem('fpscape_settings') || '{}');
        const settings = {
            masterVolume: saved.masterVolume ?? 80,
            musicVolume: saved.musicVolume ?? 50,
            fov: saved.fov ?? 70,
            mouseSensitivity: saved.mouseSensitivity ?? 5,
        };

        const createSlider = (label, id, min, max, value, unit, onChange) => {
            const row = document.createElement('div');
            row.className = 'settings-row';
            const header = document.createElement('div');
            header.className = 'settings-row-header';
            const lbl = document.createElement('span');
            lbl.textContent = label;
            lbl.className = 'settings-label';
            const valSpan = document.createElement('span');
            valSpan.className = 'settings-value';
            valSpan.textContent = value + (unit || '');
            header.appendChild(lbl);
            header.appendChild(valSpan);
            const input = document.createElement('input');
            input.type = 'range';
            input.min = min;
            input.max = max;
            input.value = value;
            input.id = id;
            input.className = 'settings-slider';
            input.addEventListener('input', () => {
                valSpan.textContent = input.value + (unit || '');
                onChange(parseInt(input.value));
                this._saveSettings();
            });
            row.appendChild(header);
            row.appendChild(input);
            container.appendChild(row);
        };

        createSlider('🔊 Master Volume', 'setting-master-vol', 0, 100, settings.masterVolume, '%', (v) => {
            if (this.game.audio) this.game.audio.setMasterVolume(v / 100);
        });
        createSlider('🎵 Music Volume', 'setting-music-vol', 0, 100, settings.musicVolume, '%', (v) => {
            if (this.game.audio) this.game.audio.setMusicVolume(v / 100);
        });
        createSlider('👁️ Field of View', 'setting-fov', 50, 110, settings.fov, '°', (v) => {
            this.game.engine.setFOV(v);
        });
        createSlider('🖱️ Mouse Sensitivity', 'setting-sensitivity', 1, 10, settings.mouseSensitivity, '', (v) => {
            CONFIG.CAMERA.mouseSensitivity = 0.001 + (v - 1) * 0.0005;
        });

        // Apply saved settings on load
        if (this.game.audio) {
            this.game.audio.setMasterVolume(settings.masterVolume / 100);
            this.game.audio.setMusicVolume(settings.musicVolume / 100);
        }
        this.game.engine.setFOV(settings.fov);
        CONFIG.CAMERA.mouseSensitivity = 0.001 + (settings.mouseSensitivity - 1) * 0.0005;
    }

    _saveSettings() {
        const settings = {
            masterVolume: parseInt(document.getElementById('setting-master-vol')?.value || 80),
            musicVolume: parseInt(document.getElementById('setting-music-vol')?.value || 50),
            fov: parseInt(document.getElementById('setting-fov')?.value || 70),
            mouseSensitivity: parseInt(document.getElementById('setting-sensitivity')?.value || 5),
        };
        localStorage.setItem('fpscape_settings', JSON.stringify(settings));
    }

    _buildQuestPanel() {
        const container = document.getElementById('quest-list');
        if (!container) return;
        container.innerHTML = '';

        // Quest count header
        const countEl = document.createElement('div');
        countEl.className = 'quest-count';
        countEl.id = 'quest-count';
        countEl.textContent = 'Quests: 0/0';
        container.appendChild(countEl);

        // Build entries for each quest
        for (const [questId, quest] of Object.entries(CONFIG.QUESTS)) {
            const el = document.createElement('div');
            el.className = 'quest-entry not-started';
            el.dataset.quest = questId;

            const nameEl = document.createElement('div');
            nameEl.className = 'quest-name';
            nameEl.textContent = quest.name;

            const descEl = document.createElement('div');
            descEl.className = 'quest-desc';
            descEl.textContent = quest.description;

            const statusEl = document.createElement('div');
            statusEl.className = 'quest-status';
            statusEl.textContent = 'Not started';

            const rewardsEl = document.createElement('div');
            rewardsEl.className = 'quest-rewards';
            const rewardParts = [];
            if (quest.rewards.xp) {
                for (const [skill, amt] of Object.entries(quest.rewards.xp)) {
                    const info = CONFIG.SKILLS[skill];
                    rewardParts.push(`${info?.icon || ''} ${amt} XP`);
                }
            }
            if (quest.rewards.items) {
                for (const r of quest.rewards.items) {
                    const def = CONFIG.ITEMS[r.item];
                    rewardParts.push(`${def?.icon || ''} ${def?.name || r.item}${r.qty > 1 ? ' x' + r.qty : ''}`);
                }
            }
            rewardsEl.textContent = rewardParts.join(', ');

            el.appendChild(nameEl);
            el.appendChild(descEl);
            el.appendChild(statusEl);
            el.appendChild(rewardsEl);

            el.addEventListener('mousedown', (e) => { if (e.button !== 0) return;
                this.game.addChatMessage(`Quest: ${quest.name} - ${quest.description}`, 'system');
            });

            container.appendChild(el);
        }
    }

    _updateQuests() {
        const qs = this.game.questSystem;
        const container = document.getElementById('quest-list');
        if (!container || !qs) return;

        const totalQuests = Object.keys(CONFIG.QUESTS).length;
        let completedCount = 0;

        for (const [questId, questConfig] of Object.entries(CONFIG.QUESTS)) {
            const el = container.querySelector(`[data-quest="${questId}"]`);
            if (!el) continue;

            const status = qs.getQuestStatus(questId);
            el.className = 'quest-entry ' + (status === 'not_started' ? 'not-started' : status === 'in_progress' ? 'in-progress' : 'complete');

            const statusEl = el.querySelector('.quest-status');
            if (statusEl) {
                if (status === 'complete') {
                    statusEl.textContent = '\u2714 Complete';
                    completedCount++;
                } else if (status === 'in_progress') {
                    // Build progress text
                    const parts = [];
                    if (questConfig.requirements?.items) {
                        for (const req of questConfig.requirements.items) {
                            const have = this.game.inventorySystem.getItemCount(req.item);
                            const def = CONFIG.ITEMS[req.item];
                            parts.push(`${def?.name || req.item}: ${Math.min(have, req.qty)}/${req.qty}`);
                        }
                    }
                    if (questConfig.requirements?.kills) {
                        const kc = this.game.player.killCounts || {};
                        for (const [monster, qty] of Object.entries(questConfig.requirements.kills)) {
                            parts.push(`Kill ${monster}: ${Math.min(kc[monster] || 0, qty)}/${qty}`);
                        }
                    }
                    statusEl.textContent = parts.length > 0 ? parts.join(' | ') : 'In progress...';
                } else {
                    statusEl.textContent = 'Not started';
                }
            }
        }

        const countEl = document.getElementById('quest-count');
        if (countEl) countEl.textContent = `Quests: ${completedCount}/${totalQuests}`;
    }

    _onInvSlotHover(e) {
        const slot = e.target.closest('.inv-slot');
        if (!slot) return;
        const idx = parseInt(slot.dataset.index);
        const inv = this.game.inventorySystem;
        const item = inv.slots[idx];
        if (!item) { this._hideInvTooltip(); return; }
        const itemDef = CONFIG.ITEMS[item.itemId];
        if (!itemDef) { this._hideInvTooltip(); return; }

        const tt = this._invTooltip;
        if (!tt) return;
        tt.querySelector('.inv-tt-name').textContent = itemDef.name;
        tt.querySelector('.inv-tt-examine').textContent = itemDef.examine || 'An item.';

        // Value info
        const valEl = tt.querySelector('.inv-tt-value');
        if (item.itemId === 'coins') {
            valEl.textContent = `Stack: ${item.quantity.toLocaleString()}`;
        } else {
            const sellPrice = this.game.shopSystem.getSellPrice(item.itemId);
            valEl.textContent = `Value: ${sellPrice} gp`;
        }

        tt.classList.remove('hidden');
        const rect = slot.getBoundingClientRect();
        tt.style.left = Math.max(10, rect.left - tt.offsetWidth - 6) + 'px';
        tt.style.top = rect.top + 'px';
        // If tooltip overflows left, show it to the right instead
        if (rect.left - tt.offsetWidth - 6 < 10) {
            tt.style.left = (rect.right + 6) + 'px';
        }
    }

    _hideInvTooltip() {
        if (this._invTooltip) this._invTooltip.classList.add('hidden');
    }

    _onInventoryClick(e) {
        const slot = e.target.closest('.inv-slot');
        if (!slot) return;
        const idx = parseInt(slot.dataset.index);
        const inv = this.game.inventorySystem;
        const item = inv.slots[idx];
        if (!item) return;

        const itemDef = CONFIG.ITEMS[item.itemId];
        if (!itemDef) return;
        const player = this.game.player;

        // Drink potion (left-click)
        if (itemDef.potion) {
            if (itemDef.potionEffect === 'stamina') {
                player.runEnergy = Math.min(100, player.runEnergy + (itemDef.staminaRestore || 40));
                this.game.addChatMessage(`You drink the ${itemDef.name}. Run energy restored!`);
            } else if (itemDef.potionEffect === 'antipoison') {
                player.poisoned = false;
                player.poisonTicksLeft = 0;
                this.game.addChatMessage(`You drink the ${itemDef.name}. The poison is cured!`);
            } else {
                player.activeBuffs[itemDef.potionEffect] = { boost: itemDef.potionBoost, timer: itemDef.potionDuration };
                this.game.addChatMessage(`You drink the ${itemDef.name}. +${itemDef.potionBoost} ${itemDef.potionEffect}.`);
            }
            inv.removeItem(item.itemId, 1);
            this.game.audio.playEat();
            return;
        }

        // Eat food
        if (itemDef.heals) {
            if (player.eatCooldown > 0) {
                this.game.addChatMessage('You need to wait before eating again.', 'system');
                return;
            }
            if (player.eat(item.itemId)) {
                inv.removeItem(item.itemId, 1);
                this.game.addChatMessage(`You eat the ${itemDef.name}. It heals ${itemDef.heals}.`);
                this.game.audio.playEat();
                player.eatCooldown = 3; // 3 tick eat delay
            }
            return;
        }

        // Equip equipment
        if (itemDef.equipSlot) {
            const eqSlot = itemDef.equipSlot;
            const current = player.equipment[eqSlot];
            if (current) inv.addItem(current);
            player.equipment[eqSlot] = item.itemId;
            inv.removeItem(item.itemId, 1);
            this.game.addChatMessage(`You equip the ${itemDef.name}.`);
            // Auto-switch attack style if weapon has one
            if (itemDef.attackStyle) {
                player.attackStyle = itemDef.attackStyle;
            }
            return;
        }

        // Drink potion
        if (itemDef.potion) {
            const effect = itemDef.potionEffect;
            const boost = itemDef.potionBoost;
            const duration = itemDef.potionDuration;
            const player = this.game.player;
            player.activeBuffs[effect] = { boost, timer: duration };
            inv.removeItem(item.itemId, 1);
            this.game.addChatMessage(`You drink the ${itemDef.name}. +${boost} ${effect} for ${duration}s.`, 'level-up');
            return;
        }

        // Bury bones
        if (item.itemId === 'bones' || item.itemId === 'dragon_bones') {
            if (this.game.prayerSystem) {
                this.game.prayerSystem.buryBones(item.itemId);
                inv.removeItem(item.itemId, 1);
            }
            return;
        }
    }

    _onInventoryRightClick(e) {
        e.preventDefault();
        const slot = e.target.closest('.inv-slot');
        if (!slot) return;
        const idx = parseInt(slot.dataset.index);
        const inv = this.game.inventorySystem;
        const item = inv.slots[idx];
        if (!item) return;
        const itemDef = CONFIG.ITEMS[item.itemId];
        if (!itemDef) return;

        // Remove any existing inventory context menu
        document.querySelectorAll('.inv-context-menu').forEach(m => m.remove());

        const menu = document.createElement('div');
        menu.className = 'inv-context-menu';

        // Title
        const title = document.createElement('div');
        title.className = 'inv-context-title';
        title.textContent = itemDef.name;
        menu.appendChild(title);

        // Eat (if food)
        if (itemDef.heals) {
            const opt = document.createElement('div');
            opt.className = 'inv-context-option';
            opt.textContent = `Eat ${itemDef.name}`;
            opt.addEventListener('click', () => {
                if (this.game.player.eat(item.itemId)) {
                    inv.removeItem(item.itemId, 1);
                    this.game.addChatMessage(`You eat the ${itemDef.name}. It heals ${itemDef.heals}.`);
                    this.game.audio.playEat();
                }
                menu.remove();
            });
            menu.appendChild(opt);
        }

        // Drink potion (if potion)
        if (itemDef.potion) {
            const opt = document.createElement('div');
            opt.className = 'inv-context-option';
            opt.textContent = `Drink ${itemDef.name}`;
            opt.addEventListener('click', () => {
                const player = this.game.player;
                player.activeBuffs[itemDef.potionEffect] = { boost: itemDef.potionBoost, timer: itemDef.potionDuration };
                inv.removeItem(item.itemId, 1);
                this.game.addChatMessage(`You drink the ${itemDef.name}. +${itemDef.potionBoost} ${itemDef.potionEffect} for ${itemDef.potionDuration}s.`, 'level-up');
                menu.remove();
            });
            menu.appendChild(opt);
        }

        // Equip (if equipment)
        if (itemDef.equipSlot) {
            const opt = document.createElement('div');
            opt.className = 'inv-context-option';
            opt.textContent = `Wield ${itemDef.name}`;
            opt.addEventListener('click', () => {
                const eqSlot = itemDef.equipSlot;
                const player = this.game.player;
                const current = player.equipment[eqSlot];
                if (current) inv.addItem(current);
                player.equipment[eqSlot] = item.itemId;
                inv.removeItem(item.itemId, 1);
                this.game.addChatMessage(`You equip the ${itemDef.name}.`);
                if (itemDef.attackStyle) player.attackStyle = itemDef.attackStyle;
                menu.remove();
            });
            menu.appendChild(opt);
        }

        // Light logs (firemaking — requires tinderbox)
        if (itemDef.fmLevel !== undefined && this.game.inventorySystem.hasItem('tinderbox')) {
            const fmOpt = document.createElement('div');
            fmOpt.className = 'inv-context-option';
            fmOpt.textContent = `Light ${itemDef.name}`;
            fmOpt.addEventListener('click', () => {
                this.game.interactionSystem._handleFiremaking();
                menu.remove();
            });
            menu.appendChild(fmOpt);
        }

        // Fletch logs (fletching — requires knife)
        if (['logs', 'oak_logs', 'willow_logs'].includes(item.itemId) && this.game.inventorySystem.hasItem('knife')) {
            const flOpt = document.createElement('div');
            flOpt.className = 'inv-context-option';
            flOpt.textContent = `Fletch ${itemDef.name}`;
            flOpt.addEventListener('click', () => {
                this.game.interactionSystem._handleFletching(item.itemId);
                menu.remove();
            });
            menu.appendChild(flOpt);
        }

        // Sell to shop (show price)
        if (item.itemId !== 'coins') {
            const sellPrice = this.game.shopSystem.getSellPrice(item.itemId);
            if (sellPrice > 0) {
                const sellOpt = document.createElement('div');
                sellOpt.className = 'inv-context-option';
                sellOpt.textContent = `Sell (${sellPrice} gp)`;
                sellOpt.addEventListener('click', () => {
                    this.game.shopSystem.sell(item.itemId);
                    menu.remove();
                });
                menu.appendChild(sellOpt);
            }
        }

        // Drop
        const dropOpt = document.createElement('div');
        dropOpt.className = 'inv-context-option';
        dropOpt.textContent = 'Drop';
        dropOpt.addEventListener('click', () => { inv.dropItem(idx); menu.remove(); });
        menu.appendChild(dropOpt);

        // Examine
        const examOpt = document.createElement('div');
        examOpt.className = 'inv-context-option';
        examOpt.textContent = 'Examine';
        examOpt.addEventListener('click', () => {
            this.game.addChatMessage(`${itemDef.name}: ${itemDef.examine || 'An item.'}`, 'system');
            menu.remove();
        });
        menu.appendChild(examOpt);

        // Position menu
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        document.body.appendChild(menu);

        // Reposition if off-screen
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width - 4) + 'px';
        if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height - 4) + 'px';

        // Close on click outside
        const closeMenu = (ev) => {
            if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('mousedown', closeMenu); }
        };
        setTimeout(() => document.addEventListener('mousedown', closeMenu), 10);
    }

    _onEquipSlotClick(slot) {
        const player = this.game.player;
        const itemId = player.equipment[slot];
        if (!itemId) return;
        const inv = this.game.inventorySystem;
        if (inv.isFull()) {
            this.game.addChatMessage("Your inventory is full.", 'system');
            return;
        }
        player.equipment[slot] = null;
        inv.addItem(itemId);
        this.game.addChatMessage(`You unequip the ${CONFIG.ITEMS[itemId]?.name || itemId}.`);
    }

    _showSkillGuide(skillId) {
        const overlay = document.getElementById('skill-guide-overlay');
        if (!overlay) return;
        const guide = CONFIG.SKILL_GUIDES[skillId];
        const skillInfo = CONFIG.SKILLS[skillId];
        const skill = this.game.player.skills[skillId];
        if (!guide || !skillInfo) return;

        let html = `<h3>${skillInfo.icon} ${skillInfo.name} - Level ${skill.level}</h3>`;
        html += `<p>XP: ${Math.floor(skill.xp).toLocaleString()} | Next: ${this.game.skillSystem.getXPToNextLevel(skillId).toLocaleString()}</p>`;
        html += '<div class="guide-unlocks">';
        for (const entry of guide) {
            const unlocked = skill.level >= entry.level;
            html += `<div class="guide-entry ${unlocked ? 'unlocked' : 'locked'}">Lvl ${entry.level}: ${entry.unlock}</div>`;
        }
        html += '</div>';

        document.getElementById('skill-guide-content').innerHTML = html;
        overlay.classList.remove('hidden');
    }

    // ── Skill Tooltip ──
    _showSkillTooltip(event, skillId) {
        const tooltip = document.getElementById('skill-tooltip');
        if (!tooltip) return;
        const info = CONFIG.SKILLS[skillId];
        const skill = this.game.player.skills[skillId];
        if (!skill) return;
        const progress = this.game.skillSystem.getXPProgress(skillId);
        const toNext = this.game.skillSystem.getXPToNextLevel(skillId);

        document.getElementById('tooltip-title').textContent = `${info.icon} ${info.name} - Level ${skill.level}`;
        document.getElementById('tooltip-xp').textContent = `XP: ${Math.floor(skill.xp).toLocaleString()}`;
        document.getElementById('tooltip-bar-fill').style.width = (progress * 100) + '%';
        document.getElementById('tooltip-next').textContent = skill.level >= 99 ? 'Max level!' : `Next: ${toNext.toLocaleString()} XP`;

        tooltip.classList.remove('hidden');
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = Math.max(10, rect.left - 155) + 'px';
        tooltip.style.top = rect.top + 'px';
    }

    _hideSkillTooltip() {
        const tooltip = document.getElementById('skill-tooltip');
        if (tooltip) tooltip.classList.add('hidden');
    }

    // ── Main Update Loop ──
    update(dt) {
        const player = this.game.player;

        // OSRS Orbs
        const circumference = 106.81; // 2 * PI * 17

        // HP orb
        const hpPct = player.maxHp > 0 ? player.hp / player.maxHp : 0;
        if (this._orbHpFill) this._orbHpFill.style.strokeDashoffset = circumference * (1 - hpPct);
        if (this._orbHpText) this._orbHpText.textContent = player.hp;
        // Poison indicator — green orb when poisoned
        const orbHpEl = document.getElementById('orb-hp');
        if (orbHpEl) orbHpEl.classList.toggle('poisoned', !!player.poisoned);

        // Prayer orb
        const ps = this.game.prayerSystem;
        const prayerPct = ps && ps.maxPoints > 0 ? ps.points / ps.maxPoints : 0;
        if (this._orbPrayerFill) this._orbPrayerFill.style.strokeDashoffset = circumference * (1 - prayerPct);
        if (this._orbPrayerText) this._orbPrayerText.textContent = Math.floor(ps ? ps.points : 0);

        // Run orb
        const runPct = player.runEnergy / 100;
        if (this._orbRunFill) this._orbRunFill.style.strokeDashoffset = circumference * (1 - runPct);
        if (this._orbRunText) this._orbRunText.textContent = Math.round(player.runEnergy);
        // Low energy pulse + run/walk label
        if (this._orbRunEl) {
            this._orbRunEl.classList.toggle('low-energy', player.runEnergy < 20);
            this._orbRunEl.title = this.game.input._runToggled ? 'Running (click to walk)' : 'Walking (click to run)';
        }

        // Special attack orb
        const specPct = player.specialAttackEnergy / 100;
        if (this._orbSpecFill) this._orbSpecFill.style.strokeDashoffset = circumference * (1 - specPct);
        if (this._orbSpecText) this._orbSpecText.textContent = Math.round(player.specialAttackEnergy);
        const orbSpecEl = document.getElementById('orb-spec');
        if (orbSpecEl) orbSpecEl.classList.toggle('spec-active', player.specialAttackActive);

        // Skull indicator
        if (this._skullIndicator) {
            if (player.skulled) {
                this._skullIndicator.classList.remove('hidden');
                this._skullIndicator.textContent = `☠ ${Math.ceil(player.skullTimer)}s`;
            } else {
                this._skullIndicator.classList.add('hidden');
            }
        }

        // Combat level
        this._combatLevel.textContent = 'Combat: ' + player.getCombatLevel();

        // Coords — hidden, no longer displayed
        this._coordsDisplay.textContent = '';

        // Inventory
        this._updateInventory();

        // Skills
        this._updateSkills();

        // Equipment
        this._updateEquipment();

        // Combat panel (weapon name, style sync, equipment stats)
        this._updateCombatPanel();

        // Prayer panel
        this._updatePrayer();

        // Spellbook
        this._updateSpellbook();

        // Auto-retaliate button text sync
        const arBtn = document.getElementById('auto-retaliate-btn');
        if (arBtn) {
            arBtn.classList.toggle('active', player.autoRetaliate);
            arBtn.textContent = `Auto-Retaliate: ${player.autoRetaliate ? 'ON' : 'OFF'}`;
        }

        // Quest log
        this._updateQuests();

        // Wilderness warning
        this._checkWilderness(player);

        // Dungeon indicator
        const dungeonInd = document.getElementById('dungeon-indicator');
        if (dungeonInd) {
            if (player.currentDungeonFloor >= 0) {
                dungeonInd.classList.remove('hidden');
                dungeonInd.textContent = `Dungeon - Floor ${player.currentDungeonFloor + 1}`;
            } else {
                dungeonInd.classList.add('hidden');
            }
        }
    }

    _updateInventory() {
        const inv = this.game.inventorySystem;

        // Build a snapshot string to detect changes — only rebuild DOM when needed.
        // Rebuilding every frame destroys elements mid-click and breaks click events.
        const snapshot = inv.slots.map(s => s ? `${s.itemId}:${s.quantity}` : '').join(',');
        if (snapshot === this._lastInvSnapshot) return;
        this._lastInvSnapshot = snapshot;

        this._inventoryGrid.innerHTML = '';
        for (let i = 0; i < 28; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            slot.dataset.index = i;
            const item = inv.slots[i];
            if (item) {
                const itemDef = CONFIG.ITEMS[item.itemId];
                slot.innerHTML = `<span class="inv-icon">${itemDef?.icon || '\u25A0'}</span>${item.quantity > 1 ? `<span class="inv-qty">${item.quantity}</span>` : ''}`;
                slot.title = itemDef?.name || item.itemId;
            }
            this._inventoryGrid.appendChild(slot);
        }
    }

    _updateSkills() {
        const player = this.game.player;
        for (const [skillId, info] of Object.entries(CONFIG.SKILLS)) {
            const lvlEl = this._skillsGrid.querySelector(`.skill-lvl[data-skill="${skillId}"]`);
            const cellEl = this._skillsGrid.querySelector(`.skill-cell[data-skill="${skillId}"]`);
            if (lvlEl && player.skills[skillId]) {
                const lvl = player.skills[skillId].level;
                lvlEl.textContent = lvl;
                if (cellEl) cellEl.title = `${info.name}: Level ${lvl}`;
            }
        }
        const totalEl = document.getElementById('skills-total');
        if (totalEl) totalEl.textContent = `Total: ${player.getTotalLevel()}`;
    }

    _updateEquipment() {
        const player = this.game.player;
        const container = document.getElementById('equipment-slots');
        if (!container) return;
        for (const slot of CONFIG.EQUIPMENT_SLOTS) {
            const el = container.querySelector(`[data-slot="${slot}"] .equip-item`);
            if (!el) continue;
            const itemId = player.equipment[slot];
            if (itemId) {
                const def = CONFIG.ITEMS[itemId];
                el.textContent = def?.icon || '\u25A0';
                el.title = def?.name || itemId;
            } else {
                el.textContent = '-';
                el.title = slot;
            }
        }
    }

    _updateCombatPanel() {
        const player = this.game.player;

        // Weapon name
        const weaponEl = document.getElementById('weapon-name');
        if (weaponEl) {
            const wep = player.equipment.weapon;
            weaponEl.textContent = wep ? (CONFIG.ITEMS[wep]?.name || 'Unarmed') : 'Unarmed';
        }

        // Sync main style buttons
        document.querySelectorAll('#style-buttons .style-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.style === player.attackStyle);
        });

        // Sync sub-style buttons if attack style changed
        if (this._lastAttackStyle !== player.attackStyle) {
            this._lastAttackStyle = player.attackStyle;
            this._updateSubstyleButtons();
        }

        // Equipment stats
        const statsEl = document.getElementById('equipment-stats');
        if (statsEl) {
            const bonuses = [
                ['Atk', player.getEquipmentBonus('attackBonus')],
                ['Str', player.getEquipmentBonus('strengthBonus')],
                ['Def', player.getEquipmentBonus('defenceBonus')],
                ['Rng', player.getEquipmentBonus('rangedBonus') || 0],
                ['Mag', player.getEquipmentBonus('magicBonus') || 0],
            ];
            statsEl.innerHTML = bonuses.map(([label, val]) =>
                `<div class="equip-stat">${label}: <span class="stat-val ${val > 0 ? 'pos' : 'zero'}">+${val}</span></div>`
            ).join('');
        }
    }

    _updatePrayer() {
        if (!this.game.prayerSystem) return;
        const container = document.getElementById('prayer-list');
        if (!container) return;
        const pp = document.getElementById('prayer-points');
        if (pp) pp.textContent = `Prayer: ${Math.floor(this.game.prayerSystem.points)}/${this.game.prayerSystem.maxPoints}`;

        for (const el of container.querySelectorAll('.prayer-entry')) {
            const id = el.dataset.prayer;
            const prayer = CONFIG.PRAYERS[id];
            const active = this.game.prayerSystem.activePrayers.has(id);
            const canUse = this.game.player.skills.prayer.level >= prayer.level;
            el.classList.toggle('active', active);
            el.classList.toggle('disabled', !canUse);
        }
    }

    _updateSpellbook() {
        const container = document.getElementById('spell-list');
        if (!container) return;
        const player = this.game.player;
        for (const el of container.querySelectorAll('.spell-entry')) {
            const id = el.dataset.spell;
            const spell = CONFIG.SPELLS[id];
            const canCast = player.skills.magic.level >= spell.level;
            const selected = player.selectedSpell === id;
            el.classList.toggle('selected', selected);
            el.classList.toggle('disabled', !canCast);
        }
    }

    _checkWilderness(player) {
        const warning = document.getElementById('wilderness-warning');
        const vignette = document.getElementById('wilderness-vignette');
        if (!warning) return;
        if (player.position.z < -50) {
            warning.classList.remove('hidden');
            const level = Math.floor((-50 - player.position.z) / 5) + 1;
            warning.textContent = `\u2620 Wilderness Level: ${level} \u2620`;
            if (vignette) vignette.classList.add('active');
        } else {
            warning.classList.add('hidden');
            if (vignette) vignette.classList.remove('active');
        }
    }

    addChatMessage(text, type = '') {
        const msg = document.createElement('div');
        msg.className = 'chat-msg' + (type ? ' ' + type : '');

        // Timestamp
        const now = new Date();
        const ts = document.createElement('span');
        ts.className = 'chat-timestamp';
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        ts.textContent = `[${h}:${m}]`;
        msg.appendChild(ts);

        msg.appendChild(document.createTextNode(text));
        this._chatMessages.appendChild(msg);
        this._chatMessages.scrollTop = this._chatMessages.scrollHeight;

        while (this._chatMessages.children.length > 100) {
            this._chatMessages.removeChild(this._chatMessages.firstChild);
        }
    }
}
