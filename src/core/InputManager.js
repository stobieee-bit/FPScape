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

        // ── Touch / Mobile support ──────────────────────────────
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        this.inputMode = 'mouse'; // 'mouse' or 'touch'
        this._touchMoveX = 0;     // virtual joystick output -1..1
        this._touchMoveZ = 0;
        this._touchYawDelta = 0;  // camera look deltas from touch
        this._touchPitchDelta = 0;
        this._firstTouchListener = null;

        // Joystick tracking
        this._joystickTouchId = null;
        this._joystickBase = null;
        this._joystickThumb = null;
        this._joystickCenterX = 0;
        this._joystickCenterY = 0;
        this._joystickRadius = 0;

        // Camera-look touch tracking (right half of screen)
        this._lookTouchId = null;
        this._lookLastX = 0;
        this._lookLastY = 0;
        this._touchSensitivity = 0.004;

        // Tap detection for interact
        this._tapStartTime = 0;
        this._tapStartPos = { x: 0, y: 0 };
        this.tapScreenPos = null; // consumed by InteractionSystem

        // Switch to touch mode on first touch event
        if (this.isTouchDevice) {
            this._firstTouchListener = () => {
                this.inputMode = 'touch';
                // In touch mode we keep locked=true so Player.js processes input
                this.locked = true;
                // Show mobile UI elements
                document.body.classList.add('touch-mode');
                window.removeEventListener('touchstart', this._firstTouchListener);
                this._firstTouchListener = null;
                // Init joystick after DOM is in touch mode
                this._setupJoystick();
            };
            window.addEventListener('touchstart', this._firstTouchListener, { once: true });
        }

        this._setupKeyboard();
        this._setupMouse();
        this._setupPointerLock();
        this._setupTouch();
        this._suppressBrowserDefaults();
    }

    /** True if running in touch/mobile mode */
    get isMobile() {
        return this.inputMode === 'touch';
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
            // In touch mode we keep locked=true always (no pointer lock needed)
            if (this.inputMode === 'touch') {
                this.locked = true;
                return;
            }
            this.locked = document.pointerLockElement === this.canvas;
        });
    }

    requestLock() {
        // Skip pointer lock on touch devices
        if (this.inputMode === 'touch') {
            this.locked = true;
            return;
        }
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

    // Returns normalized move direction { x, z } based on WASD keys or virtual joystick
    getMoveDirection() {
        // Don't move when typing in chat
        if (this._chatInputActive) return { x: 0, z: 0 };

        // Touch mode: use virtual joystick values
        if (this.inputMode === 'touch' && (this._touchMoveX !== 0 || this._touchMoveZ !== 0)) {
            return { x: this._touchMoveX, z: this._touchMoveZ };
        }

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

    /**
     * Apply accumulated touch-camera deltas to yaw/pitch.
     * Called once per frame from the game loop so deltas aren't double-counted.
     */
    applyTouchLook() {
        if (this._touchYawDelta === 0 && this._touchPitchDelta === 0) return;
        this.yaw += this._touchYawDelta;
        this.pitch += this._touchPitchDelta;
        this.pitch = Math.max(CONFIG.CAMERA.pitchMin, Math.min(CONFIG.CAMERA.pitchMax, this.pitch));
        this._touchYawDelta = 0;
        this._touchPitchDelta = 0;
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

    /** Consume pending tap screen position (for mobile tap-to-interact) */
    consumeTapScreenPos() {
        const pos = this.tapScreenPos;
        this.tapScreenPos = null;
        return pos;
    }

    // ── Virtual Joystick ──────────────────────────────────────────────
    _setupJoystick() {
        this._joystickBase = document.getElementById('joystick-base');
        this._joystickThumb = document.getElementById('joystick-thumb');
        if (!this._joystickBase) return;
        const rect = this._joystickBase.getBoundingClientRect();
        this._joystickCenterX = rect.left + rect.width / 2;
        this._joystickCenterY = rect.top + rect.height / 2;
        this._joystickRadius = rect.width / 2;
    }

    _updateJoystickVisual(dx, dy) {
        if (!this._joystickThumb) return;
        const maxPx = this._joystickRadius - 25; // thumb radius offset
        this._joystickThumb.style.transform = `translate(calc(-50% + ${dx * maxPx}px), calc(-50% + ${dy * maxPx}px))`;
    }

    _resetJoystick() {
        this._joystickTouchId = null;
        this._touchMoveX = 0;
        this._touchMoveZ = 0;
        if (this._joystickThumb) {
            this._joystickThumb.style.transform = 'translate(-50%, -50%)';
        }
    }

    // ── Touch Event Handling (joystick + camera look + tap) ──────────
    _setupTouch() {
        const canvas = this.canvas;

        canvas.addEventListener('touchstart', (e) => {
            if (this.inputMode !== 'touch') return;
            // Refresh joystick bounds in case layout changed
            if (this._joystickBase && this._joystickTouchId === null) {
                const rect = this._joystickBase.getBoundingClientRect();
                this._joystickCenterX = rect.left + rect.width / 2;
                this._joystickCenterY = rect.top + rect.height / 2;
                this._joystickRadius = rect.width / 2;
            }
        }, { passive: true });

        // Use window-level touch events so we track touches that start on the joystick element too
        window.addEventListener('touchstart', (e) => {
            if (this.inputMode !== 'touch') return;
            for (const touch of e.changedTouches) {
                const tx = touch.clientX;
                const ty = touch.clientY;

                // Check if this touch is over a UI element (skip if so)
                const el = document.elementFromPoint(tx, ty);
                if (el && el.closest('#right-panel, #chat-box, #stats-bar, .overlay-panel, #dialogue-overlay, #context-menu, .inv-context-menu, #start-overlay:not(.hidden), #mobile-action-bar')) {
                    continue;
                }

                const screenMidX = window.innerWidth / 2;

                // Left half → joystick
                if (tx < screenMidX && this._joystickTouchId === null) {
                    this._joystickTouchId = touch.identifier;
                    // Recalculate center from touch start position for a "floating" feel
                    if (this._joystickBase) {
                        const rect = this._joystickBase.getBoundingClientRect();
                        this._joystickCenterX = rect.left + rect.width / 2;
                        this._joystickCenterY = rect.top + rect.height / 2;
                        this._joystickRadius = rect.width / 2;
                    }
                    e.preventDefault();
                }
                // Right half → camera look
                else if (tx >= screenMidX && this._lookTouchId === null) {
                    this._lookTouchId = touch.identifier;
                    this._lookLastX = tx;
                    this._lookLastY = ty;
                    this._tapStartTime = performance.now();
                    this._tapStartPos.x = tx;
                    this._tapStartPos.y = ty;
                    e.preventDefault();
                }
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (this.inputMode !== 'touch') return;
            for (const touch of e.changedTouches) {
                const tx = touch.clientX;
                const ty = touch.clientY;

                // Joystick touch
                if (touch.identifier === this._joystickTouchId) {
                    const dx = tx - this._joystickCenterX;
                    const dy = ty - this._joystickCenterY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const maxR = this._joystickRadius || 60;
                    const clamped = Math.min(dist, maxR);
                    const normX = dist > 0 ? (dx / dist) * (clamped / maxR) : 0;
                    const normY = dist > 0 ? (dy / dist) * (clamped / maxR) : 0;

                    // Map joystick: X axis → strafe (x), Y axis → forward/back (z)
                    this._touchMoveX = normX;
                    this._touchMoveZ = normY; // positive Y = down = move backward
                    this._updateJoystickVisual(normX, normY);
                    e.preventDefault();
                }
                // Camera look touch
                else if (touch.identifier === this._lookTouchId) {
                    const deltaX = tx - this._lookLastX;
                    const deltaY = ty - this._lookLastY;
                    this._touchYawDelta -= deltaX * this._touchSensitivity;
                    this._touchPitchDelta -= deltaY * this._touchSensitivity;
                    this._lookLastX = tx;
                    this._lookLastY = ty;
                    e.preventDefault();
                }
            }
        }, { passive: false });

        const endTouch = (e) => {
            if (this.inputMode !== 'touch') return;
            for (const touch of e.changedTouches) {
                if (touch.identifier === this._joystickTouchId) {
                    this._resetJoystick();
                }
                if (touch.identifier === this._lookTouchId) {
                    // Tap detection: short duration + small movement → left click
                    const elapsed = performance.now() - this._tapStartTime;
                    const dx = touch.clientX - this._tapStartPos.x;
                    const dy = touch.clientY - this._tapStartPos.y;
                    const moved = Math.sqrt(dx * dx + dy * dy);
                    if (elapsed < 250 && moved < 15) {
                        // Treat as a tap → trigger left click
                        this.leftClick = true;
                        this.tapScreenPos = { x: touch.clientX, y: touch.clientY };
                    }
                    this._lookTouchId = null;
                }
            }
        };

        window.addEventListener('touchend', endTouch, { passive: true });
        window.addEventListener('touchcancel', endTouch, { passive: true });

        // Also handle joystick base touches directly
        const joyEl = document.getElementById('touch-joystick');
        if (joyEl) {
            joyEl.addEventListener('touchstart', (e) => {
                if (this.inputMode !== 'touch') return;
                for (const touch of e.changedTouches) {
                    if (this._joystickTouchId === null) {
                        this._joystickTouchId = touch.identifier;
                        if (this._joystickBase) {
                            const rect = this._joystickBase.getBoundingClientRect();
                            this._joystickCenterX = rect.left + rect.width / 2;
                            this._joystickCenterY = rect.top + rect.height / 2;
                            this._joystickRadius = rect.width / 2;
                        }
                    }
                }
            }, { passive: true });
        }
    }

    _suppressBrowserDefaults() {
        // Block browser keyboard shortcuts that interfere with gameplay
        window.addEventListener('keydown', (e) => {
            // Ctrl/Cmd shortcuts: F (find), S (save), G (find next), H (history),
            // P (print), U (view source), + / - / 0 (zoom)
            if (e.ctrlKey || e.metaKey) {
                const blocked = ['KeyF', 'KeyS', 'KeyG', 'KeyH', 'KeyP', 'KeyU',
                                 'Equal', 'Minus', 'Digit0', 'NumpadAdd', 'NumpadSubtract'];
                if (blocked.includes(e.code)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
            }

            // Block F-keys that open browser UI (allow F12 for devtools in dev)
            if (['F1', 'F3', 'F5', 'F6', 'F7', 'F11'].includes(e.code)) {
                // F1-F5 already handled by game tab switching, but still prevent browser default
                e.preventDefault();
            }

            // Prevent Tab key from cycling focus to browser chrome / URL bar
            if (e.code === 'Tab') {
                // Allow tab only if chat input is focused (for potential autocomplete)
                if (!this._chatInputActive) {
                    e.preventDefault();
                }
            }

            // Block Escape from closing fullscreen (we handle it for pause menu)
            // Note: Escape is also used by pointer lock, so only prevent if not locked
            // Actually pointer lock auto-releases on Escape, so this is safe
        }, { capture: true });

        // Prevent Ctrl+Scroll zoom
        window.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
            }
        }, { passive: false });

        // Prevent drag-and-drop of images/text from game into address bar or other tabs
        document.addEventListener('dragstart', (e) => {
            // Allow our custom inventory drag (which uses mousedown/move, not native drag)
            // Block everything else
            if (!e.target.closest('#inventory-grid')) {
                e.preventDefault();
            }
        });

        // Prevent double-click from selecting text
        document.addEventListener('selectstart', (e) => {
            // Allow selection only in text inputs
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            e.preventDefault();
        });

        // Prevent middle-click auto-scroll
        document.addEventListener('mousedown', (e) => {
            if (e.button === 1) {
                e.preventDefault();
            }
        });
    }
}
