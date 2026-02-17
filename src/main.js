import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Engine } from './core/Engine.js'; // v2-mousedown-fix
import { GameLoop } from './core/GameLoop.js';
import { InputManager } from './core/InputManager.js';
import { Player } from './entities/Player.js';
import { Terrain } from './world/Terrain.js';
import { Skybox } from './world/Skybox.js';
import { ProceduralAssets } from './world/ProceduralAssets.js';
import { Environment } from './world/Environment.js';
import { InteractionSystem } from './systems/InteractionSystem.js';
import { SkillSystem } from './systems/SkillSystem.js';
import { InventorySystem } from './systems/InventorySystem.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { QuestSystem } from './systems/QuestSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { WeatherSystem } from './systems/WeatherSystem.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { BankSystem } from './systems/BankSystem.js';
import { ShopSystem } from './systems/ShopSystem.js';
import { PrayerSystem } from './systems/PrayerSystem.js';
import { SlayerSystem } from './systems/SlayerSystem.js';
import { MusicSystem } from './systems/MusicSystem.js';
import { AchievementSystem } from './systems/AchievementSystem.js';
import { WorldMapSystem } from './systems/WorldMapSystem.js';
import { UIManager } from './ui/UIManager.js';
import { Minimap } from './ui/Minimap.js';
import { ContextMenu } from './ui/ContextMenu.js';
import { AudioManager } from './core/AudioManager.js';
import { NetworkManager } from './network/NetworkManager.js';
import { RemotePlayerManager } from './network/RemotePlayerManager.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.engine = new Engine(this.canvas);
        this.loop = new GameLoop();
        this.input = new InputManager(this.canvas);
        this.player = new Player();
        this.audio = new AudioManager();

        // World
        this.terrain = new Terrain(this.engine.scene);
        this.skybox = new Skybox(this.engine.scene);
        this.assets = new ProceduralAssets();
        this.environment = new Environment(this.engine.scene, this.assets, this.terrain);

        // Core systems
        this.skillSystem = new SkillSystem(this);
        this.inventorySystem = new InventorySystem(this);
        this.combatSystem = new CombatSystem(this);
        this.interactionSystem = new InteractionSystem(this);
        this.questSystem = new QuestSystem(this);
        this.particleSystem = new ParticleSystem(this.engine.scene);
        this.weatherSystem = new WeatherSystem(this);
        this.saveSystem = new SaveSystem(this);

        // New systems
        this.bankSystem = new BankSystem(this);
        this.shopSystem = new ShopSystem(this);
        this.prayerSystem = new PrayerSystem(this);
        this.slayerSystem = new SlayerSystem(this);
        this.musicSystem = new MusicSystem(this);
        this.achievementSystem = new AchievementSystem(this);
        this.worldMapSystem = new WorldMapSystem(this);

        // Multiplayer
        this.remotePlayerManager = new RemotePlayerManager(this);
        this.networkManager = new NetworkManager(this);

        // Create smoke emitter at campfire
        if (this.environment.campfirePosition) {
            const smokePos = this.environment.campfirePosition.clone();
            smokePos.y += 0.8;
            this.particleSystem.createSmokeEmitter(smokePos);
        }

        // Furnace chimney smoke
        if (this.environment.furnaceMesh) {
            const fPos = this.environment.furnaceMesh.position.clone();
            fPos.y += 4.0; // Top of chimney
            this.particleSystem.createSmokeEmitter(fPos);
        }

        // Create rain system
        this._rainEmitter = this.particleSystem.createRainSystem(this.player.position);
        this.weatherSystem.setRainEmitter(this._rainEmitter);

        // Hook into level-up for sparkle burst + banner
        const origLevelUp = this.skillSystem._onLevelUp.bind(this.skillSystem);
        this.skillSystem._onLevelUp = (skillName, oldLevel, newLevel) => {
            origLevelUp(skillName, oldLevel, newLevel);
            // Double particle burst for drama
            const pos = this.player.position.clone();
            pos.y -= 0.5;
            this.particleSystem.createLevelUpBurst(pos);
            setTimeout(() => {
                const pos2 = this.player.position.clone();
                pos2.y -= 0.5;
                this.particleSystem.createLevelUpBurst(pos2);
            }, 300);
            // Show level-up banner
            this._showLevelUpBanner(skillName, newLevel);
        };

        // UI
        this.uiManager = new UIManager(this);
        this.minimap = new Minimap(this);
        this.contextMenu = new ContextMenu(this);

        // Low HP vignette
        this._lowHpVignette = document.getElementById('low-hp-vignette');

        // State
        this.state = 'menu'; // menu | playing

        this._setupInputCallbacks();
        this._setupOverlayButtons();
        this._setupStartOverlay();
        this._setupLoop();

        // Save loading is deferred to after the player chooses their name
        // (see _setupStartOverlay → Play button handler)
    }

    _setupInputCallbacks() {
        // Tab switching
        this.input.onTabSwitch = (tabId) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
            if (btn) btn.classList.add('active');
            const panel = document.getElementById(tabId);
            if (panel) panel.classList.add('active');
        };

        // World map toggle
        this.input.onMapToggle = () => {
            this.worldMapSystem.toggle();
        };

        // Special attack toggle
        this.input.onSpecialAttack = () => {
            const p = this.player;
            p.specialAttackActive = !p.specialAttackActive;
            this.addChatMessage(p.specialAttackActive ? 'Special attack: READY' : 'Special attack: OFF', 'system');
        };

        // Chat commands
        this.input.onChatCommand = (text) => {
            if (text.startsWith('::')) {
                const cmd = text.slice(2).toLowerCase().trim();
                this._handleChatCommand(cmd);
            } else if (this.networkManager && this.networkManager.connected) {
                // Send through multiplayer — server echoes back
                this.networkManager.sendChat(text);
            } else {
                this.addChatMessage(text);
            }
        };
    }

    _handleChatCommand(cmd) {
        if (cmd === 'save') {
            this.saveSystem.save();
        } else if (cmd === 'deletesave') {
            this.saveSystem.deleteSave();
        } else if (cmd === 'totalLevel' || cmd === 'total') {
            this.addChatMessage(`Total level: ${this.player.getTotalLevel()}`, 'system');
        } else if (cmd === 'kc') {
            const counts = Object.entries(this.player.killCounts).filter(([, v]) => v > 0);
            if (counts.length === 0) {
                this.addChatMessage('No kills yet.', 'system');
            } else {
                this.addChatMessage('Kill counts: ' + counts.map(([k, v]) => `${k}: ${v}`).join(', '), 'system');
            }
        } else if (cmd === 'achievements') {
            const total = Object.keys(CONFIG.ACHIEVEMENTS).length;
            const done = this.achievementSystem.completed.size;
            this.addChatMessage(`Achievements: ${done}/${total}`, 'system');
        } else if (cmd === 'slayer') {
            const task = this.slayerSystem.currentTask;
            if (task) {
                this.addChatMessage(`Slayer task: Kill ${task.remaining} ${task.monster}`, 'system');
            } else {
                this.addChatMessage('No slayer task. Visit the Slayer Master.', 'system');
            }
        } else if (cmd === 'quests') {
            const total = Object.keys(CONFIG.QUESTS).length;
            const done = Object.values(this.questSystem.quests).filter(q => q.status === 'complete').length;
            const inProg = Object.values(this.questSystem.quests).filter(q => q.status === 'in_progress').length;
            this.addChatMessage(`Quests: ${done}/${total} complete, ${inProg} in progress`, 'system');
        } else if (cmd === 'buffs') {
            const buffs = Object.entries(this.player.activeBuffs);
            if (buffs.length === 0) {
                this.addChatMessage('No active buffs.', 'system');
            } else {
                this.addChatMessage('Active buffs: ' + buffs.map(([k, v]) => `${k} +${v.boost} (${Math.ceil(v.timer)}s)`).join(', '), 'system');
            }
        } else if (cmd === 'help') {
            this.addChatMessage('Commands: ::save, ::total, ::kc, ::quests, ::achievements, ::slayer, ::buffs, ::help', 'system');
        } else {
            this.addChatMessage(`Unknown command: ${cmd}`, 'system');
        }
    }

    _setupOverlayButtons() {
        // Close buttons for overlays
        const closeBtn = (id, overlayId) => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', () => {
                document.getElementById(overlayId)?.classList.add('hidden');
            });
        };

        closeBtn('bank-close', 'bank-overlay');
        closeBtn('shop-close', 'shop-overlay');
        closeBtn('worldmap-close', 'worldmap-overlay');
        closeBtn('skill-guide-close', 'skill-guide-overlay');

        // Bank deposit all
        const depositAll = document.getElementById('bank-deposit-all');
        if (depositAll) {
            depositAll.addEventListener('click', () => {
                this.bankSystem.depositAll();
            });
        }
    }

    _setupStartOverlay() {
        const overlay = document.getElementById('start-overlay');
        const startBtn = document.getElementById('start-btn');
        const nameInput = document.getElementById('player-name-input');
        const menuSection = document.getElementById('menu-section');
        const resumeText = document.getElementById('resume-text');

        // When overlay is showing and game is already playing, click anywhere to resume
        overlay.addEventListener('click', (e) => {
            if (this.state === 'playing') {
                this.input.cursorMode = false;
                this.input.requestLock();
                overlay.classList.add('hidden');
            }
        });

        // Pre-fill name from previous session
        const savedName = localStorage.getItem('fpscape-name');
        if (savedName) nameInput.value = savedName;

        // Prevent typing in the name field from propagating to game input
        nameInput.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') startBtn.click();
        });
        // Stop clicks on the input/button from bubbling to the overlay resume handler
        nameInput.addEventListener('click', (e) => e.stopPropagation());
        startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.state === 'menu') {
                // Get chosen name (strip non-alphanumeric, limit length)
                const raw = nameInput.value.trim().replace(/[^a-zA-Z0-9_ -]/g, '');
                this._chosenName = raw.length >= 1 ? raw.slice(0, 16) : '';
                // Remember name for next session
                if (this._chosenName) {
                    localStorage.setItem('fpscape-name', this._chosenName);
                }

                // Set save key to this player's name and load their save
                this.saveSystem.setPlayerName(this._chosenName);
                if (this.saveSystem.hasSave()) {
                    this.saveSystem.load();
                }

                this.state = 'playing';
                this.loop.start();
                this.addChatMessage('Welcome to FPScape!', 'system');
                this.addChatMessage('WASD to move, mouse to look. Left Alt for cursor mode.', 'system');
                this.addChatMessage('Shift to run. M for world map. Enter to chat.', 'system');
                this.addChatMessage('Keys 1-7 switch tabs. Right-click objects for options.', 'system');
                this.addChatMessage('F key toggles special attack. Right-click NPCs to pickpocket.', 'system');
                this.addChatMessage('Type ::help for chat commands.', 'system');
                // Start music & ambience
                this.musicSystem.start();
                this.audio.startAmbience();
                this.audio.startMusic();
                // Connect to multiplayer server
                this.networkManager.connect();
                // Start checking for updates
                this._startVersionCheck();

                // Switch overlay to resume mode for future appearances
                menuSection.classList.add('hidden');
                resumeText.classList.remove('hidden');
                overlay.classList.remove('menu-mode');
            }
            this.input.cursorMode = false;
            this.input.requestLock();
            overlay.classList.add('hidden');
        });

        // Show overlay when pointer lock is lost (but NOT in cursor mode)
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement) {
                // Pointer re-locked — close any open UI overlays
                document.getElementById('smithing-overlay')?.classList.add('hidden');
                document.getElementById('smelting-overlay')?.classList.add('hidden');
                document.getElementById('bank-overlay')?.classList.add('hidden');
                document.getElementById('shop-overlay')?.classList.add('hidden');
                this.input.cursorMode = false;
            } else if (this.state === 'playing') {
                // Defer the overlay check: right-click can cause the browser to
                // release pointer lock *before* our mousedown/context-menu handlers
                // set cursorMode. Wait a frame so the game loop can process the
                // pending right-click and open the context menu first.
                requestAnimationFrame(() => {
                    if (!this.input.cursorMode) {
                        overlay.classList.remove('hidden');
                    }
                });
            }
        });
    }

    _setupLoop() {
        this.loop.onFixedUpdate = (dt) => this._update(dt);
        this.loop.onGameTick = () => this._gameTick();
        this.loop.onRender = (alpha) => this._render(alpha);
    }

    _update(dt) {
        if (this.state !== 'playing') return;

        // Monster AI updates always run (smooth movement)
        for (const monster of this.environment.monsters) {
            if (monster.alive) {
                monster.updateMovement(dt);
            }
        }

        // Environment animations (fire, water, ground items)
        this.environment.updateAnimations(dt);

        // Multiplayer: interpolate remote players + send state
        this.remotePlayerManager.update(dt);
        this.networkManager.update(dt);

        // Day/night cycle
        this.engine.updateDayNight(dt, this.skybox);

        // Torch lighting based on time of day
        if (this.environment.torches.length > 0) {
            this.environment.updateTorchLighting(this.engine.timeOfDay || 0.5);
        }

        // Screen shake
        this.engine.updateShake(dt);

        // Particle system (smoke, sparkles, rain)
        this.particleSystem.update(dt);

        // Arrow projectiles in flight
        this.combatSystem.updateProjectiles(dt);

        // Weather system
        this.weatherSystem.update(dt);

        // Save system (auto-save timer)
        this.saveSystem.update(dt);

        // Music system (area-based tracks)
        this.musicSystem.update(dt);

        // Dynamic music area based on player position + state
        if (this.audio._musicRunning) {
            const pz = this.player.position.z;
            const px = this.player.position.x;
            if (this.player.inCombat) {
                this.audio.setMusicArea('combat');
            } else if (pz < -50) {
                this.audio.setMusicArea('wilderness');
            } else if (px < -40 && pz < -30) {
                this.audio.setMusicArea('dungeon');
            } else {
                this.audio.setMusicArea('peaceful');
            }
        }

        // Prayer drain
        this.prayerSystem.update(dt);

        // Skip player controls when pointer is unlocked (cursor mode or paused)
        if (!this.input.locked) return;

        // Player movement
        this.player.update(dt, this.input, this.engine.camera, (x, z) => {
            return this.terrain.getHeightAt(x, z);
        });

        // Footstep sounds
        const move = this.input.getMoveDirection();
        const isMoving = move.x !== 0 || move.z !== 0;
        this.audio.updateFootsteps(dt, isMoving, this.player.isRunning);

        // Sprint dust particles
        if (isMoving && this.player.isRunning) {
            if (!this._sprintParticleTimer) this._sprintParticleTimer = 0;
            this._sprintParticleTimer += dt;
            if (this._sprintParticleTimer > 0.15) {
                this._sprintParticleTimer = 0;
                this.particleSystem.createSprintDust(this.player.position);
            }
        }

        // Viewmodel bob + swing + combat sway
        this.engine.updateViewmodel(dt, isMoving, this.player.inCombat);

        // Sync viewmodel weapon with equipped item
        const curWeapon = this.player.equipment.weapon;
        if (curWeapon !== this._lastVmWeapon) {
            this._lastVmWeapon = curWeapon;
            this.engine.setViewmodelWeapon(curWeapon);
        }

        // Update sun shadow to follow player
        this.engine.updateSunTarget(this.player.position);

        // Interaction system (raycasting)
        this.interactionSystem.update();

        // Handle clicks
        if (this.input.consumeLeftClick()) {
            this.interactionSystem.onLeftClick();
        }

        const rightClick = this.input.consumeRightClick();
        if (rightClick) {
            this.interactionSystem.onRightClick(rightClick.x, rightClick.y);
        }

        // Low HP warning vignette + heartbeat sound
        const hpPct = this.player.hp / this.player.maxHp;
        if (hpPct <= 0.3 && hpPct > 0 && !this.player.dead) {
            this._lowHpVignette.classList.add('active');
        } else {
            this._lowHpVignette.classList.remove('active');
        }
        this.audio.updateHeartbeat(dt, hpPct, this.player.dead);
    }

    _gameTick() {
        if (this.state !== 'playing') return;
        if (this.player.dead) return;

        // Combat tick
        this.combatSystem.tick();

        // Skilling tick
        if (this.player.skilling && this.player.skillingTarget) {
            this.skillSystem.processSkillingTick();
        }

        // Monster AI tick
        for (const monster of this.environment.monsters) {
            monster.tick(this.player.position);
        }

        // Resource node respawn tick
        for (const node of this.environment.resourceNodes) {
            node.tick(CONFIG.COMBAT.tickDuration);
        }
    }

    _render(alpha) {
        // Update UI
        this.uiManager.update();
        this.minimap.update();
        this.combatSystem.updateMonsterBars();
        this.worldMapSystem.liveUpdate();

        // Render 3D scene
        this.engine.render();
    }

    addChatMessage(text, type = 'normal') {
        this.uiManager.addChatMessage(text, type);
    }

    _showLevelUpBanner(skillName, newLevel) {
        const banner = document.getElementById('levelup-banner');
        if (!banner) return;
        const info = CONFIG.SKILLS[skillName];
        document.getElementById('levelup-icon').textContent = info.icon;
        document.getElementById('levelup-text').textContent = `${info.name} Level Up!`;
        document.getElementById('levelup-detail').textContent = `You are now level ${newLevel}`;
        banner.classList.remove('hidden');
        // Force re-trigger animation
        banner.style.animation = 'none';
        banner.offsetHeight; // reflow
        banner.style.animation = '';
        setTimeout(() => banner.classList.add('hidden'), 3000);
    }

    // Distance between player and a world position
    distanceToPlayer(worldPos) {
        const dx = this.player.position.x - worldPos.x;
        const dz = this.player.position.z - worldPos.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    // ── Version check: poll for updates every 30s ──
    _startVersionCheck() {
        this._currentVersion = null;
        this._versionNotified = false;

        const check = async () => {
            try {
                const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
                const data = await res.json();
                if (this._currentVersion === null) {
                    // First check — just record the version
                    this._currentVersion = data.version;
                } else if (data.version !== this._currentVersion && !this._versionNotified) {
                    // Version changed! Notify the player
                    this._versionNotified = true;
                    this.addChatMessage('⚡ A new update is available! Click the banner above to refresh.', 'system');
                    this._showUpdateBanner();
                }
            } catch {}
        };

        // Check immediately, then every 30 seconds
        check();
        setInterval(check, 30000);
    }

    _showUpdateBanner() {
        let banner = document.getElementById('update-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'update-banner';
            banner.innerHTML = '🔄 New update available — <a href="#" onclick="location.reload();return false;">click to refresh</a>';
            document.getElementById('game-container').appendChild(banner);
        }
        banner.classList.remove('hidden');
    }
}

// Boot
try {
    const game = new Game();
} catch (e) {
    console.error('Game failed to start:', e);
    document.body.innerHTML = `<pre style="color:red;padding:20px;font-size:16px">Game Error:\n${e.message}\n\n${e.stack}</pre>`;
}
