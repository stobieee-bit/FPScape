import { CONFIG } from '../config.js';

export class GameLoop {
    constructor() {
        this.fixedStep = 1 / 60;           // 60fps physics
        this.tickStep = CONFIG.COMBAT.tickDuration;  // 0.6s game tick
        this.accumulator = 0;
        this.tickAccumulator = 0;
        this.lastTime = 0;
        this.running = false;
        this.rafId = null;

        // Callbacks
        this.onFixedUpdate = null;   // (dt) => {} - 60fps physics/movement
        this.onGameTick = null;      // () => {} - 0.6s RS game tick
        this.onRender = null;        // (alpha) => {} - vsync render
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now() / 1000;
        this.rafId = requestAnimationFrame((t) => this._loop(t));
    }

    stop() {
        this.running = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    _loop(timestamp) {
        if (!this.running) return;
        this.rafId = requestAnimationFrame((t) => this._loop(t));

        const now = timestamp / 1000;
        let frameTime = now - this.lastTime;
        this.lastTime = now;

        // Clamp frame time to avoid spiral of death
        if (frameTime > 0.25) frameTime = 0.25;

        // Fixed-step physics updates (60fps)
        this.accumulator += frameTime;
        while (this.accumulator >= this.fixedStep) {
            if (this.onFixedUpdate) {
                this.onFixedUpdate(this.fixedStep);
            }
            this.accumulator -= this.fixedStep;
        }

        // Game tick updates (0.6s)
        this.tickAccumulator += frameTime;
        while (this.tickAccumulator >= this.tickStep) {
            if (this.onGameTick) {
                this.onGameTick();
            }
            this.tickAccumulator -= this.tickStep;
        }

        // Render
        const alpha = this.accumulator / this.fixedStep;
        if (this.onRender) {
            this.onRender(alpha);
        }
    }
}
