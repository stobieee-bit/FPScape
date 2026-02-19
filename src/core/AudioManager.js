// Simple procedural sound effects using Web Audio API
export class AudioManager {
    constructor() {
        this.ctx = null;
        this._initialized = false;
        this._footstepTimer = 0;
        this._masterVolume = 0.8;
        this._musicVolume = 0.5;
        this._masterGain = null;
        this._musicGain = null;
    }

    _init() {
        if (this._initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        // Master gain — all audio routes through here
        this._masterGain = this.ctx.createGain();
        this._masterGain.gain.value = this._masterVolume;
        this._masterGain.connect(this.ctx.destination);
        // Music gain — music routes through here, then master
        this._musicGain = this.ctx.createGain();
        this._musicGain.gain.value = this._musicVolume;
        this._musicGain.connect(this._masterGain);
        this._initialized = true;
    }

    /** Output node for SFX (routes through master gain) */
    get dest() { return this._masterGain || this.ctx.destination; }

    /** Output node for music (routes through music gain → master gain) */
    get musicDest() { return this._musicGain || this.ctx.destination; }

    // Chop sound: short burst of noise
    playChop() {
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        }
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

        noise.connect(filter).connect(gain).connect(this.dest);
        noise.start(t);
        noise.stop(t + 0.08);
    }

    // Mine sound: metallic ping
    playMine() {
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain).connect(this.dest);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    // Hit sound: thud
    playHit() {
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.12);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

        osc.connect(gain).connect(this.dest);
        osc.start(t);
        osc.stop(t + 0.12);
    }

    // Level up: ascending tones
    playLevelUp() {
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const gain = ctx.createGain();
            const start = t + i * 0.12;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);

            osc.connect(gain).connect(this.dest);
            osc.start(start);
            osc.stop(start + 0.2);
        });
    }

    // Death sound: descending tone
    playDeath() {
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.6);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 0.6);

        osc.connect(filter).connect(gain).connect(this.dest);
        osc.start(t);
        osc.stop(t + 0.6);
    }

    // Monster death thud: descending sine + noise crunch
    playMonsterDeath() {
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        // Low thud
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);

        // Noise burst (crunch)
        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.15), ctx.sampleRate);
        const nData = buffer.getChannelData(0);
        for (let i = 0; i < nData.length; i++) {
            nData[i] = (Math.random() * 2 - 1) * (1 - i / nData.length);
        }
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

        osc.connect(gain).connect(this.dest);
        noise.connect(filter).connect(gain);
        osc.start(t);
        noise.start(t);
        osc.stop(t + 0.25);
        noise.stop(t + 0.15);
    }

    // Miss sound: whoosh
    playMiss() {
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin(i / data.length * Math.PI);
        }
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        filter.Q.value = 2;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        noise.connect(filter).connect(gain).connect(this.dest);
        noise.start(t);
        noise.stop(t + 0.15);
    }

    // Footstep: soft thump with slight randomization
    playFootstep() {
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        const pitch = 60 + Math.random() * 30;
        osc.frequency.setValueAtTime(pitch, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.06);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

        osc.connect(gain).connect(this.dest);
        osc.start(t);
        osc.stop(t + 0.06);
    }

    // Call each frame with dt and whether the player is moving
    updateFootsteps(dt, isMoving, isRunning, surface) {
        if (!isMoving) {
            this._footstepTimer = 0;
            return;
        }

        const interval = isRunning ? 0.28 : 0.42;
        this._footstepTimer += dt;
        if (this._footstepTimer >= interval) {
            this._footstepTimer -= interval;
            if (surface) {
                this.playFootstepSurface(surface);
            } else {
                this.playFootstep();
            }
        }
    }

    // Eat sound: crunchy bite
    playEat() {
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const env = i < data.length * 0.3 ? i / (data.length * 0.3) : 1 - (i - data.length * 0.3) / (data.length * 0.7);
            data[i] = (Math.random() * 2 - 1) * env;
        }
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 1.5;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

        noise.connect(filter).connect(gain).connect(this.dest);
        noise.start(t);
        noise.stop(t + 0.12);
    }

    // Magic cast sound: sine sweep whoosh
    playCast() {
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.3);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        osc.connect(gain).connect(this.dest);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    // Item pickup sound: short high-pitched tick
    playPickup() {
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.04);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

        osc.connect(gain).connect(this.dest);
        osc.start(t);
        osc.stop(t + 0.04);
    }

    // Prayer activation chime: soft bell
    playPray() {
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 880; // A5

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 1320; // E6

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

        osc.connect(gain).connect(this.dest);
        osc2.connect(gain);
        osc.start(t);
        osc2.start(t);
        osc.stop(t + 0.25);
        osc2.stop(t + 0.25);
    }

    // ── Ambient sound system ─────────────────────────────────────────────

    /** Start continuous ambient wind + bird loop */
    startAmbience() {
        this._init();
        if (this._ambienceRunning) return;
        this._ambienceRunning = true;
        this._playWindLoop();
        this._scheduleBirdChirp();
    }

    _playWindLoop() {
        if (!this._ambienceRunning) return;
        const ctx = this.ctx;
        const duration = 4;
        const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        const gain = ctx.createGain();
        const t = ctx.currentTime;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.025, t + 1);
        gain.gain.setValueAtTime(0.025, t + duration - 1);
        gain.gain.linearRampToValueAtTime(0, t + duration);

        src.connect(filter).connect(gain).connect(this.dest);
        src.start(t);
        src.stop(t + duration);
        src.onended = () => this._playWindLoop();
    }

    _scheduleBirdChirp() {
        if (!this._ambienceRunning) return;
        const delay = 3000 + Math.random() * 8000;
        setTimeout(() => {
            if (!this._ambienceRunning) return;
            this._playBirdChirp();
            this._scheduleBirdChirp();
        }, delay);
    }

    _playBirdChirp() {
        const ctx = this.ctx;
        const t = ctx.currentTime;
        const freq = 2000 + Math.random() * 2000;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.linearRampToValueAtTime(freq * (0.8 + Math.random() * 0.5), t + 0.08);
        osc.frequency.linearRampToValueAtTime(freq * 1.1, t + 0.15);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.02, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain).connect(this.dest);
        osc.start(t);
        osc.stop(t + 0.2);

        // Sometimes a second chirp follows quickly
        if (Math.random() > 0.5) {
            const osc2 = ctx.createOscillator();
            osc2.type = 'sine';
            const f2 = freq * (0.9 + Math.random() * 0.3);
            osc2.frequency.setValueAtTime(f2, t + 0.12);
            osc2.frequency.linearRampToValueAtTime(f2 * 1.2, t + 0.25);
            const g2 = ctx.createGain();
            g2.gain.setValueAtTime(0, t + 0.12);
            g2.gain.linearRampToValueAtTime(0.025, t + 0.14);
            g2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc2.connect(g2).connect(this.dest);
            osc2.start(t + 0.12);
            osc2.stop(t + 0.3);
        }
    }

    // ── Procedural area-based music ─────────────────────────────────────

    /** Start background music (procedural generative chords) */
    startMusic() {
        this._init();
        if (this._musicRunning) return;
        this._musicRunning = true;
        this._musicArea = 'peaceful';
        this._playMusicChord();
    }

    setMusicArea(area) {
        this._musicArea = area; // 'peaceful', 'combat', 'wilderness', 'dungeon', 'volcanic', 'desert', 'underwater'
    }

    /** Set master volume (0-1). Affects all audio immediately. */
    setMasterVolume(vol) {
        this._masterVolume = Math.max(0, Math.min(1, vol));
        if (this._masterGain) {
            const t = this.ctx.currentTime;
            this._masterGain.gain.cancelScheduledValues(t);
            this._masterGain.gain.setValueAtTime(this._masterGain.gain.value, t);
            this._masterGain.gain.linearRampToValueAtTime(this._masterVolume, t + 0.03);
        }
    }

    /** Set music volume (0-1). Affects music immediately. */
    setMusicVolume(vol) {
        this._musicVolume = Math.max(0, Math.min(1, vol));
        if (this._musicGain) {
            const t = this.ctx.currentTime;
            this._musicGain.gain.cancelScheduledValues(t);
            this._musicGain.gain.setValueAtTime(this._musicGain.gain.value, t);
            this._musicGain.gain.linearRampToValueAtTime(this._musicVolume, t + 0.03);
        }
    }

    _playMusicChord() {
        if (!this._musicRunning) return;
        const ctx = this.ctx;
        const t = ctx.currentTime;
        const area = this._musicArea || 'peaceful';

        // Different chord progressions per area
        const chords = {
            peaceful: [[262, 330, 392], [220, 277, 330], [247, 311, 370], [262, 330, 392]],
            combat: [[196, 233, 294], [185, 220, 277], [196, 247, 294], [175, 220, 262]],
            wilderness: [[147, 175, 220], [165, 196, 247], [147, 185, 220], [131, 165, 196]],
            dungeon: [[131, 156, 196], [123, 147, 185], [131, 165, 196], [117, 147, 175]],
            volcanic: [[165, 196, 247], [147, 185, 220], [156, 196, 233], [139, 175, 208]],
            desert: [[220, 277, 330], [233, 294, 349], [208, 262, 330], [220, 277, 349]],
            underwater: [[196, 247, 294], [175, 220, 262], [185, 233, 277], [196, 247, 311]],
        };

        const progression = chords[area] || chords.peaceful;
        if (this._chordIndex === undefined) this._chordIndex = 0;
        const chord = progression[this._chordIndex % progression.length];
        this._chordIndex++;

        const dur = 3 + Math.random();
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.04, t);
        masterGain.connect(this.musicDest);

        for (const freq of chord) {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(1, t + 0.5);
            g.gain.setValueAtTime(1, t + dur - 0.8);
            g.gain.linearRampToValueAtTime(0, t + dur);
            osc.connect(g).connect(masterGain);
            osc.start(t);
            osc.stop(t + dur);
        }

        // Sometimes add a melody note on top
        if (Math.random() > 0.4) {
            const melodyFreq = chord[0] * 2 * (1 + Math.floor(Math.random() * 3) * 0.25);
            const mel = ctx.createOscillator();
            mel.type = 'sine';
            mel.frequency.value = melodyFreq;
            const mg = ctx.createGain();
            const melStart = t + 0.5 + Math.random() * 0.5;
            mg.gain.setValueAtTime(0, melStart);
            mg.gain.linearRampToValueAtTime(0.6, melStart + 0.1);
            mg.gain.exponentialRampToValueAtTime(0.01, melStart + 1.2);
            mel.connect(mg).connect(masterGain);
            mel.start(melStart);
            mel.stop(melStart + 1.3);
        }

        setTimeout(() => this._playMusicChord(), dur * 1000);
    }

    // Low HP heartbeat: deep thump-thump
    playHeartbeat() {
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        // First beat (louder)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(50, t);
        osc1.frequency.exponentialRampToValueAtTime(30, t + 0.12);
        const g1 = ctx.createGain();
        g1.gain.setValueAtTime(0.2, t);
        g1.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc1.connect(g1).connect(this.dest);
        osc1.start(t);
        osc1.stop(t + 0.12);

        // Second beat (slightly quieter, shortly after)
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(45, t + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(25, t + 0.25);
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.14, t + 0.15);
        g2.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        osc2.connect(g2).connect(this.dest);
        osc2.start(t + 0.15);
        osc2.stop(t + 0.25);
    }

    /** Call from update loop. Plays heartbeat at low HP */
    updateHeartbeat(dt, hpPct, isDead) {
        if (!this._heartbeatTimer) this._heartbeatTimer = 0;
        if (isDead || hpPct > 0.25 || hpPct <= 0) {
            this._heartbeatTimer = 0;
            return;
        }
        // Heartbeat interval scales with HP — lower HP = faster
        const interval = 0.6 + hpPct * 2; // range 0.6s - 1.1s
        this._heartbeatTimer += dt;
        if (this._heartbeatTimer >= interval) {
            this._heartbeatTimer -= interval;
            this.playHeartbeat();
        }
    }

    // Fishing splash sound
    playSplash() {
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const env = Math.sin(i / data.length * Math.PI);
            data[i] = (Math.random() * 2 - 1) * env;
        }
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1500;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        noise.connect(filter).connect(gain).connect(this.dest);
        noise.start(t);
        noise.stop(t + 0.2);
    }

    // ── Night & ambient sounds ───────────────────────────────────────────

    // Cricket chirp: two quick 4kHz sine chirps
    playCricket() {
        if (!this.ctx) return;
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        for (let i = 0; i < 2; i++) {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 4000;

            const gain = ctx.createGain();
            const start = t + i * 0.1; // 0.05s chirp + 0.05s gap
            gain.gain.setValueAtTime(0.03, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.05);

            osc.connect(gain).connect(this.dest);
            osc.start(start);
            osc.stop(start + 0.05);
        }
    }

    // Owl hoot: 300Hz→200Hz sine sweep
    playOwlHoot() {
        if (!this.ctx) return;
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.4);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.02, t);
        gain.gain.setValueAtTime(0.02, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain).connect(this.dest);
        osc.start(t);
        osc.stop(t + 0.4);
    }

    // Wind gust: bandpass-filtered noise at 800Hz, 1.5s with fade in/out
    playWindGust() {
        if (!this.ctx) return;
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;
        const duration = 1.5;

        const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.02, t + 0.3);
        gain.gain.setValueAtTime(0.02, t + duration - 0.4);
        gain.gain.linearRampToValueAtTime(0, t + duration);

        src.connect(filter).connect(gain).connect(this.dest);
        src.start(t);
        src.stop(t + duration);
    }

    // Looping water ambient: bandpass noise at 600Hz, very quiet
    startWaterAmbient() {
        if (!this.ctx) return;
        this._init();
        if (this._waterAmbientNode) return; // already playing
        const ctx = this.ctx;
        const duration = 4;

        const playLoop = () => {
            if (!this._waterAmbientNode) return;
            const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const src = ctx.createBufferSource();
            src.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 600;
            filter.Q.value = 0.8;

            const gain = ctx.createGain();
            gain.gain.value = 0.01;

            src.connect(filter).connect(gain).connect(this.dest);
            src.start();
            src.stop(ctx.currentTime + duration);
            src.onended = () => playLoop();
            this._waterAmbientSource = src;
        };

        this._waterAmbientNode = true; // flag to keep loop alive
        playLoop();
    }

    stopWaterAmbient() {
        this._waterAmbientNode = null;
        if (this._waterAmbientSource) {
            try { this._waterAmbientSource.stop(); } catch (e) {}
            this._waterAmbientSource = null;
        }
    }

    // Night ambience: random cricket chirps + owl hoots on intervals
    startNightAmbience() {
        if (!this.ctx) return;
        this._init();
        if (this._nightAmbienceActive) return;
        this._nightAmbienceActive = true;
        this._nightAmbienceIntervals = [];

        // Cricket chirps every 2-5s
        const cricketLoop = () => {
            if (!this._nightAmbienceActive) return;
            this.playCricket();
            const delay = 2000 + Math.random() * 3000;
            const id = setTimeout(cricketLoop, delay);
            this._nightAmbienceIntervals.push(id);
        };
        const cricketStart = setTimeout(cricketLoop, 2000 + Math.random() * 3000);
        this._nightAmbienceIntervals.push(cricketStart);

        // Owl hoots every 15-30s
        const owlLoop = () => {
            if (!this._nightAmbienceActive) return;
            this.playOwlHoot();
            const delay = 15000 + Math.random() * 15000;
            const id = setTimeout(owlLoop, delay);
            this._nightAmbienceIntervals.push(id);
        };
        const owlStart = setTimeout(owlLoop, 15000 + Math.random() * 15000);
        this._nightAmbienceIntervals.push(owlStart);
    }

    stopNightAmbience() {
        this._nightAmbienceActive = false;
        if (this._nightAmbienceIntervals) {
            for (const id of this._nightAmbienceIntervals) {
                clearTimeout(id);
            }
            this._nightAmbienceIntervals = [];
        }
    }

    // ── Dungeon ambience: cave drips at random intervals ──────────────

    playCaveDrip() {
        if (!this.ctx) return;
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        // Primary drip: high-pitched sine descend
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + Math.random() * 400, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.3);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        // Resonant echo tap
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 300 + Math.random() * 100;
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.015, t + 0.05);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        osc.connect(gain).connect(this.dest);
        osc2.connect(g2).connect(this.dest);
        osc.start(t); osc.stop(t + 0.35);
        osc2.start(t + 0.05); osc2.stop(t + 0.5);
    }

    startDungeonAmbience() {
        if (this._dungeonAmbienceActive) return;
        this._init();
        this._dungeonAmbienceActive = true;
        this._dungeonDripTimers = [];
        const dripLoop = () => {
            if (!this._dungeonAmbienceActive) return;
            this.playCaveDrip();
            const delay = 3000 + Math.random() * 7000;
            const id = setTimeout(dripLoop, delay);
            this._dungeonDripTimers.push(id);
        };
        const startId = setTimeout(dripLoop, 1500);
        this._dungeonDripTimers.push(startId);
    }

    stopDungeonAmbience() {
        this._dungeonAmbienceActive = false;
        if (this._dungeonDripTimers) {
            for (const id of this._dungeonDripTimers) clearTimeout(id);
            this._dungeonDripTimers = [];
        }
    }

    // ── Underwater ambience: low warbling tone through bandpass ──────

    startUnderwaterAmbience() {
        if (this._uwAmbienceActive) return;
        this._init();
        this._uwAmbienceActive = true;
        this._playUnderwaterLoop();
    }

    _playUnderwaterLoop() {
        if (!this._uwAmbienceActive || !this.ctx) return;
        const ctx = this.ctx;
        const t = ctx.currentTime;
        const duration = 3;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.linearRampToValueAtTime(100, t + duration * 0.5);
        osc.frequency.linearRampToValueAtTime(75, t + duration);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.015, t);
        gain.gain.setValueAtTime(0.015, t + duration - 0.5);
        gain.gain.linearRampToValueAtTime(0, t + duration);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 200;
        filter.Q.value = 1;

        osc.connect(filter).connect(gain).connect(this.dest);
        osc.start(t);
        osc.stop(t + duration);

        this._uwLoopTimer = setTimeout(() => this._playUnderwaterLoop(), duration * 900);
    }

    stopUnderwaterAmbience() {
        this._uwAmbienceActive = false;
        if (this._uwLoopTimer) {
            clearTimeout(this._uwLoopTimer);
            this._uwLoopTimer = null;
        }
    }

    // Surface-aware footstep sounds
    playFootstepSurface(surface) {
        this._init();
        const ctx = this.ctx;
        const t = ctx.currentTime;

        if (surface === 'stone') {
            // Sharp noise burst at 120Hz
            const noise = ctx.createBufferSource();
            const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
            }
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 120;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

            noise.connect(filter).connect(gain).connect(this.dest);
            noise.start(t);
            noise.stop(t + 0.04);
        } else if (surface === 'wood') {
            // Bandpass 300Hz noise, 0.06s
            const noise = ctx.createBufferSource();
            const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
            }
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 300;
            filter.Q.value = 1;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

            noise.connect(filter).connect(gain).connect(this.dest);
            noise.start(t);
            noise.stop(t + 0.06);
        } else if (surface === 'sand') {
            // Lowpass 200Hz noise, very quiet, 0.05s
            const noise = ctx.createBufferSource();
            const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
            }
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 200;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.04, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

            noise.connect(filter).connect(gain).connect(this.dest);
            noise.start(t);
            noise.stop(t + 0.05);
        } else {
            // Default 'grass': use existing footstep sound
            this.playFootstep();
        }
    }
}
