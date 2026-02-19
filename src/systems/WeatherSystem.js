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
        if (this.game.particleSystem) {
            this.game.particleSystem.flashLightning();
        }
        // Thunder sound after short delay
        setTimeout(() => {
            this._playThunder();
        }, 500 + Math.random() * 1500);
    }

    _playThunder() {
        const audio = this.game.audio;
        audio._init();
        const ctx = audio.ctx;
        // Short burst of low-freq noise for thunder
        const bufSize = Math.floor(ctx.sampleRate * 0.8);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            const t = i / bufSize;
            data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.6;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        const gain = ctx.createGain();
        gain.gain.value = 0.15;
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
