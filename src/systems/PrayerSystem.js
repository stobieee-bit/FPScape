import { CONFIG } from '../config.js';

export class PrayerSystem {
    constructor(game) {
        this.game = game;
        this.points = 1;
        this.maxPoints = 1; // Updated with prayer level
        this.activePrayers = new Set();
        this.drainTimer = 0;
    }

    buryBones(itemId) {
        const item = CONFIG.ITEMS[itemId];
        if (!item || !item.prayerXP) return false;

        this.game.skillSystem.addXP('prayer', item.prayerXP);
        this.game.audio.playChop();
        if (this.game.achievementSystem) this.game.achievementSystem.unlock('first_prayer');

        // Update max prayer
        this.maxPoints = this.game.player.skills.prayer.level;
        return true;
    }

    togglePrayer(prayerId) {
        const config = CONFIG.PRAYERS[prayerId];
        if (!config) return;

        if (this.activePrayers.has(prayerId)) {
            this.activePrayers.delete(prayerId);
            this.game.addChatMessage(`Deactivated: ${config.name}`, 'system');
            return;
        }

        if (this.game.player.skills.prayer.level < config.level) {
            this.game.addChatMessage(`You need level ${config.level} Prayer.`, 'system');
            return;
        }

        if (this.points <= 0) {
            this.game.addChatMessage("You've run out of prayer points!", 'system');
            return;
        }

        this.activePrayers.add(prayerId);
        this.game.audio.playPray();
        this.game.addChatMessage(`Activated: ${config.name}`, 'system');
    }

    /** Quick prayer toggle — activate first available prayer or deactivate all (mobile action bar) */
    quickPray() {
        if (this.activePrayers.size > 0) {
            this.activePrayers.clear();
            this.game.addChatMessage('Prayers deactivated.', 'system');
            return;
        }
        if (this.points <= 0) {
            this.game.addChatMessage("You've run out of prayer points!", 'system');
            return;
        }
        // Activate the highest-level prayer the player can use
        const prayerLevel = this.game.player.skills.prayer.level;
        let best = null;
        for (const [id, cfg] of Object.entries(CONFIG.PRAYERS)) {
            if (prayerLevel >= cfg.level && (!best || cfg.level > CONFIG.PRAYERS[best].level)) {
                best = id;
            }
        }
        if (best) this.togglePrayer(best);
        else this.game.addChatMessage('No prayers available.', 'system');
    }

    update(dt) {
        if (this.activePrayers.size === 0) return;

        this.drainTimer += dt;
        if (this.drainTimer >= 1) { // Drain every second
            this.drainTimer = 0;
            let totalDrain = 0;
            for (const id of this.activePrayers) {
                const config = CONFIG.PRAYERS[id];
                if (config) totalDrain += config.drainRate;
            }
            this.points = Math.max(0, this.points - totalDrain * 0.6);
            if (this.points <= 0) {
                this.activePrayers.clear();
                this.game.addChatMessage("You've run out of prayer points!", 'system');
            }
        }
    }

    getPrayerBonus(stat) {
        let total = 0;
        for (const id of this.activePrayers) {
            const config = CONFIG.PRAYERS[id];
            if (config && config.bonus && config.bonus[stat]) {
                total += config.bonus[stat];
            }
        }
        return total;
    }

    hasProtection(type) {
        for (const id of this.activePrayers) {
            const config = CONFIG.PRAYERS[id];
            if (config && config.protection === type) return true;
        }
        return false;
    }

    restorePoints() {
        this.maxPoints = this.game.player.skills.prayer.level;
        this.points = this.maxPoints;
        this.game.addChatMessage('Your prayer has been restored.', 'system');
    }
}
