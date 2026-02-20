export class WeatherSystem {
    constructor(game) {
        this.game = game;
        this.currentWeather = 'clear'; // clear | rain | storm | snow
        this.weatherTimer = 0;
        this.nextChange = 120 + Math.random() * 120;
        this.rainEmitter = null;
        this.snowEmitter = null;
        this.rainVolume = 0;
        this._rainNode = null;
        this._rainGain = null;

        // Storm lightning
        this._lightningTimer = 0;
        this._lightningInterval = 5;
    }

    setRainEmitter(emitter) {
        this.rainEmitter = emitter;
    }

    setSnowEmitter(emitter) {
        this.snowEmitter = emitter;
    }

    update(dt) {
        this.weatherTimer += dt;

        if (this.weatherTimer >= this.nextChange) {
            this.weatherTimer = 0;
            this.nextChange = 60 + Math.random() * 120;
            this._pickWeather();
        }

        // Fade rain volume
        const wantsRain = this.currentWeather === 'rain' || this.currentWeather === 'storm';
        if (wantsRain) {
            this.rainVolume = Math.min(1, this.rainVolume + dt * 0.5);
        } else {
            this.rainVolume = Math.max(0, this.rainVolume - dt * 0.5);
        }
        this._updateRainSound();

        // Storm lightning
        if (this.currentWeather === 'storm') {
            this._lightningTimer += dt;
            if (this._lightningTimer >= this._lightningInterval) {
                this._lightningTimer = 0;
                this._lightningInterval = 3 + Math.random() * 5;
                this._flashLightning();
            }
        }
    }

    _pickWeather() {
        this._stopAll();
        const r = Math.random();
        if (r < 0.50) this._startClear();
        else if (r < 0.75) this._startRain();
        else if (r < 0.85) this._startStorm();
        else this._startSnow();
    }

    _startClear() {
        this.currentWeather = 'clear';
        this.game.addChatMessage('The skies clear up.', 'system');
    }

    _startRain() {
        this.currentWeather = 'rain';
        if (this.rainEmitter) this.rainEmitter.active = true;
        this.game.addChatMessage('It starts to rain.', 'system');
        this._startRainSound();
    }

    _startStorm() {
        this.currentWeather = 'storm';
        if (this.rainEmitter) this.rainEmitter.active = true;
        this._lightningTimer = 2 + Math.random() * 3;
        this.game.addChatMessage('A thunderstorm rolls in!', 'system');
        this._startRainSound();
    }

    _startSnow() {
        this.currentWeather = 'snow';
        if (this.snowEmitter) this.snowEmitter.active = true;
        this.game.addChatMessage('Snow begins to fall.', 'system');
    }

    _stopAll() {
        if (this.rainEmitter) this.rainEmitter.active = false;
        if (this.snowEmitter) this.snowEmitter.active = false;
    }

    _flashLightning() {
        // Flash the PointLight via particle system
        if (this.game.particleSystem) {
            this.game.particleSystem.flashLightning();
        }

        // Also flash the ambient light for full-scene illumination
        const engine = this.game.engine;
        if (engine && engine.ambientLight) {
            const amb = engine.ambientLight;
            const originalIntensity = amb.intensity;

            // Clear previous ambient flash timers
            for (const t of (this._ambientTimers || [])) clearTimeout(t);
            this._ambientTimers = [];

            // Flash ambient bright white
            amb.intensity = 1.8;
            this._ambientTimers.push(setTimeout(() => { amb.intensity = 0.5; }, 60));
            this._ambientTimers.push(setTimeout(() => { amb.intensity = 1.2; }, 140));
            this._ambientTimers.push(setTimeout(() => { amb.intensity = 0.7; }, 190));
            this._ambientTimers.push(setTimeout(() => { amb.intensity = originalIntensity; }, 400));
        }

        // Thunder sound after short delay (simulates distance)
        const thunderDelay = 500 + Math.random() * 1500;
        setTimeout(() => {
            this._playThunder();
        }, thunderDelay);
    }

    _playThunder() {
        const audio = this.game.audio;
        audio._init();
        const ctx = audio.ctx;

        // Longer rumble with a sharp crack followed by rolling echo
        const duration = 1.5 + Math.random() * 1.0;
        const bufSize = Math.floor(ctx.sampleRate * duration);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);

        for (let i = 0; i < bufSize; i++) {
            const t = i / bufSize;
            // Sharp initial crack (first 10%) then rolling rumble decay
            const envelope = t < 0.1
                ? Math.pow(1 - t / 0.1, 0.3)    // sharp crack
                : 0.4 * Math.pow(1 - (t - 0.1) / 0.9, 1.5); // rolling decay
            // Add subtle warble to the rumble
            const warble = 1 + 0.3 * Math.sin(t * 25);
            data[i] = (Math.random() * 2 - 1) * envelope * warble * 0.7;
        }

        const src = ctx.createBufferSource();
        src.buffer = buf;

        // Low-pass filter for deep rumble
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 350;
        filter.Q.value = 0.7;

        // Gain
        const gain = ctx.createGain();
        gain.gain.value = 0.18;

        src.connect(filter).connect(gain).connect(audio.dest);
        src.start();
    }

    _startRainSound() {
        const audio = this.game.audio;
        audio._init();
        const ctx = audio.ctx;

        if (this._rainNode) return;

        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }

        this._rainNode = ctx.createBufferSource();
        this._rainNode.buffer = buffer;
        this._rainNode.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;

        this._rainGain = ctx.createGain();
        this._rainGain.gain.value = 0;

        this._rainNode.connect(filter).connect(this._rainGain).connect(audio.dest);
        this._rainNode.start();
    }

    _updateRainSound() {
        if (this._rainGain) {
            const vol = this.currentWeather === 'storm' ? 0.12 : 0.08;
            this._rainGain.gain.value = this.rainVolume * vol;
        }

        if (this.rainVolume <= 0 && this._rainNode && this.currentWeather !== 'rain' && this.currentWeather !== 'storm') {
            try { this._rainNode.stop(); } catch (e) {}
            this._rainNode = null;
            this._rainGain = null;
        }
    }

    getWeatherFogModifier() {
        switch (this.currentWeather) {
            case 'storm': return 0.4;
            case 'rain': return 0.65;
            case 'snow': return 0.7;
            default: return 1.0;
        }
    }

    isRaining() {
        return this.currentWeather === 'rain' || this.currentWeather === 'storm';
    }

    isSnowing() {
        return this.currentWeather === 'snow';
    }
}
