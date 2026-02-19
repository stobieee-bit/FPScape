import { CONFIG } from '../config.js';

export class MusicSystem {
    constructor(game) {
        this.game = game;
        this.currentZone = null;
        this._osc = null;
        this._gain = null;
        this._noteTimer = 0;
        this._noteIndex = 0;
        this._melodyTimer = 0;
        this._playing = false;

        // Simple pentatonic scales per mood
        this._scales = {
            peaceful:   [261, 293, 329, 392, 440, 523, 587, 659], // C major pentatonic
            cheerful:   [392, 440, 494, 587, 659, 784, 880, 988], // G major
            dark:       [293, 329, 349, 440, 466, 587, 659, 698], // D minor
            danger:     [220, 261, 293, 329, 440, 523, 587, 659], // A minor
            mysterious: [220, 247, 277, 330, 370, 440, 494, 554], // Phrygian-ish (desert)
            eerie:      [196, 220, 247, 277, 311, 370, 415, 440], // Minor w/ tritone (swamp)
            cold:       [277, 311, 349, 415, 466, 554, 622, 698], // Eb major (ice)
        };
    }

    start() {
        // Called on game start - music plays via update()
        this._playing = true;
    }

    update(dt) {
        if (!this._playing) return;
        const pos = this.game.player.position;
        let closestZone = null;
        let closestDist = Infinity;

        for (const [name, zone] of Object.entries(CONFIG.MUSIC_ZONES)) {
            const dx = pos.x - zone.x;
            const dz = pos.z - zone.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < zone.radius && dist < closestDist) {
                closestDist = dist;
                closestZone = name;
            }
        }

        if (closestZone !== this.currentZone) {
            this.currentZone = closestZone;
            this._noteIndex = 0;
        }

        if (!this.currentZone) {
            this._stopMusic();
            return;
        }

        this._melodyTimer += dt;
        const zone = CONFIG.MUSIC_ZONES[this.currentZone];
        const interval = 60 / zone.tempo; // seconds per beat

        if (this._melodyTimer >= interval) {
            this._melodyTimer -= interval;
            this._playNote(zone);
        }
    }

    _playNote(zone) {
        const audio = this.game.audio;
        audio._init();
        const ctx = audio.ctx;
        if (!ctx) return;

        const scale = this._scales[zone.mood] || this._scales.peaceful;
        const noteIdx = this._noteIndex % scale.length;

        // Generate a simple melody pattern
        const patterns = {
            peaceful:   [0, 2, 4, 2, 3, 5, 4, 2],
            cheerful:   [0, 1, 2, 4, 3, 2, 1, 3],
            dark:       [0, 3, 1, 4, 2, 0, 3, 1],
            danger:     [0, 4, 2, 5, 1, 3, 4, 0],
            mysterious: [0, 3, 1, 5, 2, 4, 1, 3],
            eerie:      [0, 2, 4, 1, 5, 3, 0, 4],
            cold:       [0, 1, 3, 2, 4, 6, 3, 5],
        };
        const pattern = patterns[zone.mood] || patterns.peaceful;
        const patIdx = this._noteIndex % pattern.length;
        const scaleIdx = pattern[patIdx] % scale.length;
        const freq = scale[scaleIdx];

        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const darkMoods = ['dark', 'danger', 'eerie', 'mysterious', 'cold'];
        osc.type = darkMoods.includes(zone.mood) ? 'triangle' : 'sine';
        osc.frequency.value = freq;

        const gain = ctx.createGain();
        const vol = 0.04;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain).connect(audio.musicDest);
        osc.start(t);
        osc.stop(t + 0.45);

        this._noteIndex++;
    }

    _stopMusic() {
        this._playing = false;
    }
}
