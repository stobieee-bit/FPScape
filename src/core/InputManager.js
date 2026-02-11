import { CONFIG } from '../config.js';

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;

        // Key state
        this.keys = {};

        // Mouse look
        this.yaw = 0;
        this.pitch = 0;
        this.locked = false;
        this._cursorMode = false; // Alt-toggle: pointer free but game still running
        this._runToggled = false; // Persistent run toggle (via orb click)

        // Callback for cursor mode changes
        this.onCursorModeChange = null;

        // Click events (consumed by game systems)
        this.leftClick = false;
        this.rightClick = false;
        this.rightClickPos = { x: 0, y: 0 };

        this._setupKeyboard();
        this._setupMouse();
        this._setupPointerLock();
    }

    // Getter/setter keeps canvas + HUD pointer-events in sync automatically
    get cursorMode() { return this._cursorMode; }
    set cursorMode(val) {
        this._cursorMode = val;
        const hud = document.getElementById('hud');
        if (val) {
            // Cursor mode ON: disable canvas so it doesn't steal clicks,
            // and make the full HUD overlay clickable so its children
            // (inventory, tabs, orbs, etc.) all receive pointer events.
            this.canvas.style.pointerEvents = 'none';
            if (hud) hud.style.pointerEvents = 'auto';
        } else {
            // Cursor mode OFF: restore defaults
            this.canvas.style.pointerEvents = '';
            if (hud) hud.style.pointerEvents = '';
        }
    }

    _setupKeyboard() {
        // Tab switch callback (set by main.js)
        this.onTabSwitch = null;
        // Map toggle callback
        this.onMapToggle = null;
        // Chat command callback
        this.onChatCommand = null;
        // Special attack callback
        this.onSpecialAttack = null;

        this._chatInputActive = false;
        this._chatInput = document.getElementById('chat-input');
        if (this._chatInput) {
            this._chatInput.addEventListener('keydown', (e) => {
                e.stopPropagation();
                if (e.code === 'Enter') {
                    const text = this._chatInput.value.trim();
                    if (text) this.onChatCommand?.(text);
                    this._chatInput.value = '';
                    this._chatInput.blur();
                    this._chatInputActive = false;
                }
                if (e.code === 'Escape') {
                    this._chatInput.value = '';
                    this._chatInput.blur();
                    this._chatInputActive = false;
                }
            });
            this._chatInput.addEventListener('focus', () => { this._chatInputActive = true; });
            this._chatInput.addEventListener('blur', () => { this._chatInputActive = false; });
        }

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            // Don't process game keys when chat is active
            if (this._chatInputActive) return;

            // Tab switching via F1-F5 or number keys 1-5
            if (e.code === 'F1' || e.code === 'Digit1') { e.preventDefault(); this.onTabSwitch?.('tab-inventory'); }
            if (e.code === 'F2' || e.code === 'Digit2') { e.preventDefault(); this.onTabSwitch?.('tab-skills'); }
            if (e.code === 'F3' || e.code === 'Digit3') { e.preventDefault(); this.onTabSwitch?.('tab-combat'); }
            if (e.code === 'F4' || e.code === 'Digit4') { e.preventDefault(); this.onTabSwitch?.('tab-prayer'); }
            if (e.code === 'F5' || e.code === 'Digit5') { e.preventDefault(); this.onTabSwitch?.('tab-magic'); }
            if (e.code === 'Digit6') { e.preventDefault(); this.onTabSwitch?.('tab-quests'); }
            if (e.code === 'Digit7') { e.preventDefault(); this.onTabSwitch?.('tab-settings'); }

            // M = toggle world map
            if (e.code === 'KeyM') { this.onMapToggle?.(); }

            // F = toggle special attack
            if (e.code === 'KeyF') { this.onSpecialAttack?.(); }

            // Enter = focus chat input
            if (e.code === 'Enter' && this._chatInput) {
                this._chatInput.focus();
            }

            // Alt toggles cursor mode
            if (e.code === 'AltLeft') {
                e.preventDefault();
                this.toggleCursorMode();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    _setupMouse() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.locked) this.leftClick = true;
            if (e.button === 2) {
                // Always capture right-clicks — browser may release pointer lock
                // before this handler fires, so we can't gate on this.locked.
                this.rightClick = true;
                this.rightClickPos.x = e.clientX;
                this.rightClickPos.y = e.clientY;
            }
        });

        // Prevent native right-click menu everywhere — this is a full-screen game,
        // we never want the browser context menu to appear.
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // In cursor mode: clicking anywhere that isn't a UI panel re-locks.
        // We check coordinates rather than event target because pointer lock
        // transitions can cause e.target to be the canvas even when clicking
        // over UI elements.
        document.addEventListener('mousedown', (e) => {
            if (!this.cursorMode) return;
            if (e.button !== 0) return;

            const x = e.clientX;
            const y = e.clientY;

            // Check if click is over any visible UI element by coordinate
            const uiSelectors = [
                '#right-panel', '#chat-box', '#stats-bar', '#minimap-container',
                '.overlay-panel:not(.hidden)', '#dialogue-overlay:not(.hidden)',
                '#context-menu:not(.hidden)', '.inv-context-menu',
                '#worldmap-overlay:not(.hidden)', '#skill-tooltip:not(.hidden)',
                '#skill-guide-overlay:not(.hidden)'
            ];

            for (const sel of uiSelectors) {
                const els = document.querySelectorAll(sel);
                for (const el of els) {
                    const rect = el.getBoundingClientRect();
                    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                        return; // Click is over a UI element, don't re-lock
                    }
                }
            }

            // Click is on empty game area → re-lock
            this.toggleCursorMode();
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.locked) return;
            const sens = CONFIG.CAMERA.mouseSensitivity;
            this.yaw -= e.movementX * sens;
            this.pitch -= e.movementY * sens;
            this.pitch = Math.max(CONFIG.CAMERA.pitchMin, Math.min(CONFIG.CAMERA.pitchMax, this.pitch));
        });
    }

    _setupPointerLock() {
        document.addEventListener('pointerlockchange', () => {
            this.locked = document.pointerLockElement === this.canvas;
        });
    }

    requestLock() {
        this.canvas.requestPointerLock();
    }

    releaseLock() {
        document.exitPointerLock();
    }

    toggleCursorMode() {
        if (this.cursorMode) {
            // Exit cursor mode - re-lock pointer
            this.cursorMode = false;
            this.canvas.requestPointerLock();
        } else {
            // Enter cursor mode - free the pointer
            this.cursorMode = true;
            document.exitPointerLock();
        }
        this.onCursorModeChange?.(this.cursorMode);
    }

    // Returns normalized move direction { x, z } based on WASD keys
    getMoveDirection() {
        // Don't move when typing in chat
        if (this._chatInputActive) return { x: 0, z: 0 };

        let x = 0;
        let z = 0;

        if (this.keys['KeyW'] || this.keys['ArrowUp']) z -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) z += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

        // Normalize
        const len = Math.sqrt(x * x + z * z);
        if (len > 0) {
            x /= len;
            z /= len;
        }

        return { x, z };
    }

    isRunning() {
        return this._runToggled || this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    }

    toggleRun() {
        this._runToggled = !this._runToggled;
    }

    // Consume click events (call once per frame after processing)
    consumeLeftClick() {
        const clicked = this.leftClick;
        this.leftClick = false;
        return clicked;
    }

    consumeRightClick() {
        const clicked = this.rightClick;
        this.rightClick = false;
        return clicked ? { x: this.rightClickPos.x, y: this.rightClickPos.y } : null;
    }
}
