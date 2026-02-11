import { CONFIG } from '../config.js';

export class SlayerSystem {
    constructor(game) {
        this.game = game;
        this.currentTask = null; // { monster, remaining, xpPer }
        this.tasksCompleted = 0;
    }

    assignTask() {
        if (this.currentTask && this.currentTask.remaining > 0) {
            this.game.addChatMessage(`You already have a task: kill ${this.currentTask.remaining} ${CONFIG.MONSTERS[this.currentTask.monster].name}s.`, 'system');
            return;
        }

        const combatLevel = this.game.player.getCombatLevel();
        const eligible = CONFIG.SLAYER_TASKS.filter(t => combatLevel >= t.minCombat);
        if (eligible.length === 0) {
            this.game.addChatMessage("No tasks available for your level.", 'system');
            return;
        }

        const task = eligible[Math.floor(Math.random() * eligible.length)];
        const qty = task.minQty + Math.floor(Math.random() * (task.maxQty - task.minQty + 1));

        this.currentTask = {
            monster: task.monster,
            remaining: qty,
            xpPer: task.xpPer,
        };

        const monsterName = CONFIG.MONSTERS[task.monster].name;
        this.game.addChatMessage(`New Slayer task: Kill ${qty} ${monsterName}s.`, 'level-up');
    }

    checkTask() {
        if (!this.currentTask || this.currentTask.remaining <= 0) {
            this.game.addChatMessage("You don't have a Slayer task. Talk to Turael for one.", 'system');
            return;
        }
        const name = CONFIG.MONSTERS[this.currentTask.monster].name;
        this.game.addChatMessage(`Current task: Kill ${this.currentTask.remaining} more ${name}s.`, 'system');
    }

    onMonsterKill(monsterType) {
        if (!this.currentTask) return;
        if (this.currentTask.monster !== monsterType) return;

        this.currentTask.remaining--;
        this.game.skillSystem.addXP('slayer', this.currentTask.xpPer);

        if (this.currentTask.remaining <= 0) {
            this.tasksCompleted++;
            this.game.addChatMessage('Slayer task complete! Return to Turael for a new task.', 'level-up');
            this.game.audio.playLevelUp();
            this.currentTask = null;
        } else {
            this.game.addChatMessage(`Slayer task: ${this.currentTask.remaining} remaining.`);
        }
    }
}
