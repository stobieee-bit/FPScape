import { CONFIG } from '../config.js';

export class SaveSystem {
    constructor(game) {
        this.game = game;
        this.SAVE_KEY = 'fpscape_save'; // default fallback
        this.autoSaveInterval = 60; // seconds
        this.autoSaveTimer = 0;
    }

    /** Set save key based on player name so each name gets its own save */
    setPlayerName(name) {
        const oldKey = 'fpscape_save';
        if (name) {
            this.SAVE_KEY = 'fpscape_save_' + name.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        } else {
            this.SAVE_KEY = oldKey;
        }

        // Migrate legacy save (from before per-name saves) to the new key
        if (this.SAVE_KEY !== oldKey) {
            const legacy = localStorage.getItem(oldKey);
            if (legacy && !localStorage.getItem(this.SAVE_KEY)) {
                localStorage.setItem(this.SAVE_KEY, legacy);
                localStorage.removeItem(oldKey);
            }
        }
    }

    update(dt) {
        this.autoSaveTimer += dt;
        if (this.autoSaveTimer >= this.autoSaveInterval) {
            this.autoSaveTimer = 0;
            this.save();
        }
    }

    save() {
        const player = this.game.player;
        const data = {
            version: 4,
            timestamp: Date.now(),
            player: {
                position: { x: player.position.x, y: player.position.y, z: player.position.z },
                skills: {},
                hp: player.hp,
                maxHp: player.maxHp,
                runEnergy: player.runEnergy,
                equipment: player.equipment || {},
                attackStyle: player.attackStyle,
                meleeStyle: player.meleeStyle,
                rangedStyle: player.rangedStyle,
                magicStyle: player.magicStyle,
                selectedSpell: player.selectedSpell,
                autoCast: player.autoCast,
                killCounts: player.killCounts || {},
                currentDungeonFloor: player.currentDungeonFloor,
            },
            inventory: this.game.inventorySystem.slots.map(s =>
                s ? { itemId: s.itemId, quantity: s.quantity } : null
            ),
            quests: this.game.questSystem ? { ...this.game.questSystem.quests } : {},
        };

        // Save skill data
        for (const [key, skill] of Object.entries(player.skills)) {
            data.player.skills[key] = { level: skill.level, xp: skill.xp };
        }

        // Save bank
        if (this.game.bankSystem) {
            data.bank = this.game.bankSystem.slots.map(s =>
                s ? { itemId: s.itemId, quantity: s.quantity } : null
            );
        }

        // Save prayer
        if (this.game.prayerSystem) {
            data.prayer = {
                points: this.game.prayerSystem.points,
                maxPoints: this.game.prayerSystem.maxPoints,
            };
        }

        // Save slayer
        if (this.game.slayerSystem) {
            data.slayer = {
                currentTask: this.game.slayerSystem.currentTask,
                tasksCompleted: this.game.slayerSystem.tasksCompleted,
            };
        }

        // Save achievements
        if (this.game.achievementSystem) {
            data.achievements = [...this.game.achievementSystem.completed];
        }

        // Save pets
        if (this.game.petSystem) {
            data.pets = {
                owned: [...this.game.petSystem.ownedPets],
                active: this.game.petSystem.activePet,
            };
        }

        // Save clue scroll progress
        if (this.game.clueScrollSystem) {
            data.clues = {
                activeClue: this.game.clueScrollSystem.activeClue,
                completedClues: this.game.clueScrollSystem.completedClues,
            };
        }

        // Save quest flags and world events
        if (this.game.questSystem) {
            data.questFlags = this.game.questSystem.questFlags || {};
            data.triggeredEvents = this.game.questSystem.triggeredEvents || [];
        }

        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
            // silent save — no chat spam
        } catch (e) {
            this.game.addChatMessage('Failed to save game!', 'damage');
        }
    }

    load() {
        try {
            const raw = localStorage.getItem(this.SAVE_KEY);
            if (!raw) return false;

            const data = JSON.parse(raw);
            if (!data) return false;

            // Migration: v3 → v4 (new biome monsters)
            if ((data.version || 0) < 4) {
                const kc = data.player?.killCounts || {};
                if (!kc.fire_elemental) kc.fire_elemental = 0;
                if (!kc.desert_guard) kc.desert_guard = 0;
                if (!kc.sea_serpent) kc.sea_serpent = 0;
                if (data.player) data.player.killCounts = kc;
                data.version = 4;
            }

            const player = this.game.player;

            // Restore position
            player.position.set(data.player.position.x, data.player.position.y, data.player.position.z);

            // Restore skills
            for (const [key, skill] of Object.entries(data.player.skills)) {
                if (player.skills[key]) {
                    player.skills[key].level = skill.level;
                    player.skills[key].xp = skill.xp;
                }
            }

            // Restore HP
            player.hp = data.player.hp;
            player.maxHp = data.player.maxHp;
            player.runEnergy = data.player.runEnergy || 100;

            // Restore equipment
            if (data.player.equipment) {
                player.equipment = data.player.equipment;
            }

            // Restore attack style + sub-styles
            if (data.player.attackStyle) player.attackStyle = data.player.attackStyle;
            if (data.player.meleeStyle) player.meleeStyle = data.player.meleeStyle;
            if (data.player.rangedStyle) player.rangedStyle = data.player.rangedStyle;
            if (data.player.magicStyle) player.magicStyle = data.player.magicStyle;
            if (data.player.selectedSpell) player.selectedSpell = data.player.selectedSpell;
            if (data.player.autoCast) player.autoCast = data.player.autoCast;

            // Restore kill counts
            if (data.player.killCounts) player.killCounts = data.player.killCounts;
            player.currentDungeonFloor = data.player.currentDungeonFloor ?? -1;

            // Restore inventory
            if (data.inventory) {
                for (let i = 0; i < 28; i++) {
                    const s = data.inventory[i];
                    if (s) {
                        this.game.inventorySystem.slots[i] = { itemId: s.itemId || s.id, quantity: s.quantity || s.qty || 1 };
                    } else {
                        this.game.inventorySystem.slots[i] = null;
                    }
                }
            }

            // Restore quests
            if (data.quests && this.game.questSystem) {
                this.game.questSystem.quests = data.quests;
            }

            // Restore bank
            if (data.bank && this.game.bankSystem) {
                for (let i = 0; i < data.bank.length && i < this.game.bankSystem.slots.length; i++) {
                    const s = data.bank[i];
                    this.game.bankSystem.slots[i] = s ? { itemId: s.itemId || s.id, quantity: s.quantity || s.qty || 1 } : null;
                }
            }

            // Restore prayer
            if (data.prayer && this.game.prayerSystem) {
                this.game.prayerSystem.points = data.prayer.points;
                this.game.prayerSystem.maxPoints = data.prayer.maxPoints;
            }

            // Restore slayer
            if (data.slayer && this.game.slayerSystem) {
                this.game.slayerSystem.currentTask = data.slayer.currentTask;
                this.game.slayerSystem.tasksCompleted = data.slayer.tasksCompleted || 0;
            }

            // Restore achievements
            if (data.achievements && this.game.achievementSystem) {
                this.game.achievementSystem.completed = new Set(data.achievements);
            }

            // Restore pets
            if (data.pets && this.game.petSystem) {
                this.game.petSystem.ownedPets = new Set(data.pets.owned || []);
                if (data.pets.active && this.game.petSystem.ownedPets.has(data.pets.active)) {
                    this.game.petSystem.summonPet(data.pets.active);
                }
            }

            // Restore clue scroll progress
            if (data.clues && this.game.clueScrollSystem) {
                this.game.clueScrollSystem.activeClue = data.clues.activeClue || null;
                this.game.clueScrollSystem.completedClues = data.clues.completedClues || { easy: 0, medium: 0, hard: 0 };
            }

            // Restore quest flags and world events
            if (this.game.questSystem) {
                if (data.questFlags) {
                    this.game.questSystem.questFlags = data.questFlags;
                }
                if (data.triggeredEvents) {
                    this.game.questSystem.triggeredEvents = data.triggeredEvents;
                    // Replay world events to restore spawned NPCs/portals
                    this.game.questSystem.replayWorldEvents();
                }
            }

            // Mark all UI dirty after loading
            if (this.game.ui) this.game.ui.markDirty('all');

            this.game.addChatMessage('Game loaded!', 'system');
            return true;
        } catch (e) {
            this.game.addChatMessage('Failed to load save.', 'damage');
            return false;
        }
    }

    hasSave() {
        return !!localStorage.getItem(this.SAVE_KEY);
    }

    deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);
        this.game.addChatMessage('Save deleted.', 'system');
    }
}
