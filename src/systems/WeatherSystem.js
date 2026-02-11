export class WeatherSystem {
    constructor(game) {
        this.game = game;
        this.currentWeather = 'clear'; // clear | rain
        this.weatherTimer = 0;
        this.nextChange = 120 + Math.random() * 120; // 2-4 min before first weather change
        this.rainEmitter = null;
        this.rainVolume = 0;
        this._rainNode = null;
        this._rainGain = null;
    }

    setRainEmitter(emitter) {
        this.rainEmitter = emitter;
    }

    update(dt) {
        this.weatherTimer += dt;

        if (this.weatherTimer >= this.nextChange) {
            this.weatherTimer = 0;
            this.nextChange = 60 + Math.random() * 120;

            if (this.currentWeather === 'clear') {
                this._startRain();
            } else {
                this._stopRain();
            }
        }

        // Fade rain volume
        if (this.currentWeather === 'rain') {
            this.rainVolume = Math.min(1, this.rainVolume + dt * 0.5);
        } else {
            this.rainVolume = Math.max(0, this.rainVolume - dt * 0.5);
        }
        this._updateRainSound();
    }

    _startRain() {
        this.currentWeather = 'rain';
        if (this.rainEmitter) this.rainEmitter.active = true;
        this.game.addChatMessage('It starts to rain.', 'system');
        this._startRainSound();
    }

    _stopRain() {
        this.currentWeather = 'clear';
        if (this.rainEmitter) this.rainEmitter.active = false;
        this.game.addChatMessage('The rain has stopped.', 'system');
        // Sound fades out via rainVolume
    }

    _startRainSound() {
        const audio = this.game.audio;
        audio._init();
        const ctx = audio.ctx;

        if (this._rainNode) return; // Already playing

        // Create continuous rain noise
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

        this._rainNode.connect(filter).connect(this._rainGain).connect(ctx.destination);
        this._rainNode.start();
    }

    _updateRainSound() {
        if (this._rainGain) {
            this._rainGain.gain.value = this.rainVolume * 0.08;
        }

        // Stop sound if fully faded
        if (this.rainVolume <= 0 && this._rainNode && this.currentWeather === 'clear') {
            try { this._rainNode.stop(); } catch (e) {}
            this._rainNode = null;
            this._rainGain = null;
        }
    }

    isRaining() {
        return this.currentWeather === 'rain';
    }
}
