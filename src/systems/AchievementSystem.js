import { CONFIG } from '../config.js';

export class AchievementSystem {
    constructor(game) {
        this.game = game;
        this.completed = new Set();
    }

    unlock(achievementId) {
        if (this.completed.has(achievementId)) return;

        const achievement = CONFIG.ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return;

        this.completed.add(achievementId);
        this.game.addChatMessage(`Achievement Unlocked: ${achievement.icon} ${achievement.name}!`, 'level-up');
        this.game.audio.playLevelUp();

        this._showPopup(achievement);
    }

    _showPopup(achievement) {
        const popup = document.getElementById('achievement-popup');
        if (!popup) return;
        popup.textContent = `${achievement.icon} ${achievement.name} - ${achievement.desc}`;
        popup.classList.remove('hidden');
        // Reset animation
        popup.style.animation = 'none';
        popup.offsetHeight; // trigger reflow
        popup.style.animation = '';
        setTimeout(() => popup.classList.add('hidden'), 3500);
    }

    check() {
        const game = this.game;
        const player = game.player;

        // Total level check
        if (player.getTotalLevel() >= 100) this.unlock('total_100');

        // Level 10 in any combat
        for (const key of ['attack', 'strength', 'defence', 'hitpoints']) {
            if (player.skills[key] && player.skills[key].level >= 10) this.unlock('level_10');
        }

        // Bank items
        if (game.bankSystem && game.bankSystem.getUniqueCount() >= 10) this.unlock('bank_10');

        // All quests
        if (game.questSystem) {
            const allComplete = Object.keys(CONFIG.QUESTS).every(
                q => game.questSystem.quests[q] === 'complete'
            );
            if (allComplete) this.unlock('all_quests');
        }
    }
}
