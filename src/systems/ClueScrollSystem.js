import { CONFIG } from '../config.js';

export class ClueScrollSystem {
    constructor(game) {
        this.game = game;
        this.activeClue = null;   // { tier, steps: [], currentStep: 0 }
        this.completedClues = { easy: 0, medium: 0, hard: 0 };
    }

    startClue(tier) {
        if (this.activeClue) {
            this.game.addChatMessage('You already have an active clue scroll!', 'system');
            return;
        }

        const config = CONFIG.CLUE_SCROLLS[tier];
        if (!config) return;

        // Pick random steps
        const [minSteps, maxSteps] = config.stepsCount;
        const numSteps = minSteps + Math.floor(Math.random() * (maxSteps - minSteps + 1));
        const pool = [...config.steps];
        const steps = [];
        for (let i = 0; i < numSteps && pool.length > 0; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            steps.push(pool.splice(idx, 1)[0]);
        }

        this.activeClue = { tier, steps, currentStep: 0 };

        const step = steps[0];
        this.game.addChatMessage(`You open the clue scroll: "${step.hint}"`, 'system');
        this._updateOverlay();
    }

    getCurrentHint() {
        if (!this.activeClue) return null;
        return this.activeClue.steps[this.activeClue.currentStep]?.hint || null;
    }

    getCurrentStep() {
        if (!this.activeClue) return null;
        return this.activeClue.steps[this.activeClue.currentStep] || null;
    }

    getDigTarget() {
        const step = this.getCurrentStep();
        if (!step || step.type !== 'dig') return null;
        return { x: step.x, z: step.z };
    }

    checkDigLocation(playerX, playerZ) {
        const step = this.getCurrentStep();
        if (!step || step.type !== 'dig') return false;

        const dist = Math.sqrt((playerX - step.x) ** 2 + (playerZ - step.z) ** 2);
        if (dist <= 5) {
            this.game.addChatMessage('You dig and find something!', 'system');
            this._advanceStep();
            return true;
        } else {
            this.game.addChatMessage('You dig but find nothing interesting here.', 'system');
            return false;
        }
    }

    checkKill(monsterType) {
        const step = this.getCurrentStep();
        if (!step || step.type !== 'kill') return;
        if (step.monster === monsterType) {
            this.game.addChatMessage('The monster drops a clue piece!', 'system');
            this._advanceStep();
        }
    }

    checkSearch(playerX, playerZ) {
        const step = this.getCurrentStep();
        if (!step || step.type !== 'search') return false;

        const dist = Math.sqrt((playerX - step.x) ** 2 + (playerZ - step.z) ** 2);
        if (dist <= 6) {
            this.game.addChatMessage('You search the area and find something!', 'system');
            this._advanceStep();
            return true;
        } else {
            this.game.addChatMessage('Nothing interesting here...', 'system');
            return false;
        }
    }

    _advanceStep() {
        this.activeClue.currentStep++;
        if (this.activeClue.currentStep >= this.activeClue.steps.length) {
            this._openCasket();
        } else {
            const step = this.getCurrentStep();
            this.game.addChatMessage(`Next clue: "${step.hint}"`, 'system');
            this._updateOverlay();
        }
    }

    _openCasket() {
        const tier = this.activeClue.tier;
        const rewards = CONFIG.CLUE_SCROLLS[tier].rewards;

        this.game.addChatMessage(`You open the ${tier} casket!`, 'level-up');
        this.game.audio.playLevelUp();

        // Coins
        const [minCoins, maxCoins] = rewards.coins;
        const coins = minCoins + Math.floor(Math.random() * (maxCoins - minCoins + 1));
        this.game.inventorySystem.addItem('coins', coins);
        this.game.addChatMessage(`Loot: ${coins} coins`, 'loot');

        // Item rolls
        for (const entry of rewards.items) {
            if (Math.random() < entry.chance) {
                this.game.inventorySystem.addItem(entry.item, 1);
                const itemDef = CONFIG.ITEMS[entry.item];
                this.game.addChatMessage(`Loot: ${itemDef?.icon || ''} ${itemDef?.name || entry.item}`, 'loot');
            }
        }

        // Pet roll for hard clues
        if (tier === 'hard' && this.game.petSystem) {
            this.game.petSystem.rollCluePet(tier);
        }

        // Track
        this.completedClues[tier]++;
        const totalClues = this.completedClues.easy + this.completedClues.medium + this.completedClues.hard;
        this.game.achievementSystem.unlock('treasure_hunter');
        if (totalClues >= 10) {
            this.game.achievementSystem.unlock('master_sleuth');
        }

        // Sparkle
        this.game.particleSystem.createLevelUpBurst(this.game.player.position);

        this.activeClue = null;
        this._updateOverlay();
    }

    cancelClue() {
        this.activeClue = null;
        this.game.addChatMessage('You discard the clue scroll.', 'system');
        this._updateOverlay();
    }

    _updateOverlay() {
        const el = document.getElementById('clue-overlay');
        if (!el) return;

        if (!this.activeClue) {
            el.classList.add('hidden');
            return;
        }

        el.classList.remove('hidden');
        const hint = this.getCurrentHint();
        const step = this.getCurrentStep();
        const stepNum = this.activeClue.currentStep + 1;
        const total = this.activeClue.steps.length;

        // Build content safely with DOM methods
        el.textContent = '';
        const stepDiv = document.createElement('div');
        stepDiv.className = 'clue-step';
        stepDiv.textContent = `Step ${stepNum}/${total}`;
        el.appendChild(stepDiv);

        const hintDiv = document.createElement('div');
        hintDiv.className = 'clue-hint';
        hintDiv.textContent = hint || '';
        el.appendChild(hintDiv);

        if (step && (step.type === 'dig' || step.type === 'search')) {
            const px = this.game.player.position.x;
            const pz = this.game.player.position.z;
            const angle = Math.atan2(step.x - px, step.z - pz);
            const arrows = ['\u2191', '\u2197', '\u2192', '\u2198', '\u2193', '\u2199', '\u2190', '\u2196'];
            const idx = Math.round(((angle + Math.PI) / (Math.PI * 2)) * 8) % 8;
            const dist = Math.sqrt((step.x - px) ** 2 + (step.z - pz) ** 2);
            const dirDiv = document.createElement('div');
            dirDiv.className = 'clue-dir';
            dirDiv.textContent = `${arrows[idx]} ${Math.round(dist)}m`;
            el.appendChild(dirDiv);
        }
    }
}
