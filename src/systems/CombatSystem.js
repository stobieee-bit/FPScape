import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class CombatSystem {
    constructor(game) {
        this.game = game;
        this._hitsplatContainer = document.getElementById('hitsplats');
        this._monsterBarsContainer = document.getElementById('monster-bars');
        this._deathOverlay = document.getElementById('death-overlay');

        // KBD phase tracking
        this._kbdPhase = 1;
        this._kbdFireBreathTick = 0;
        this._kbdFireWarning = document.getElementById('kbd-fire-warning');

        // Arrow projectiles in flight
        this._projectiles = [];
    }

    tick() {
        const player = this.game.player;

        // Poison tick — damages player over time
        if (player.poisoned && player.poisonTicksLeft > 0) {
            player.poisonTicksLeft--;
            player.hp -= player.poisonDamage;
            this._showPlayerHitsplat(player.poisonDamage, false, 'poison');
            this.game.addChatMessage(`You take ${player.poisonDamage} poison damage.`, 'damage');
            if (player.hp <= 0) { player.hp = 0; this._onPlayerDeath(); }
            if (player.poisonTicksLeft <= 0) {
                player.poisoned = false;
                this.game.addChatMessage('The poison has worn off.', 'system');
            }
        }

        // Natural HP regen out of combat — 1 HP every ~10 seconds (17 ticks)
        if (!player.inCombat && !player.poisoned && player.hp > 0 && player.hp < player.maxHp) {
            if (!this._hpRegenTicks) this._hpRegenTicks = 0;
            this._hpRegenTicks++;
            if (this._hpRegenTicks >= 17) {
                this._hpRegenTicks = 0;
                player.hp = Math.min(player.maxHp, player.hp + 1);
            }
        } else {
            this._hpRegenTicks = 0;
        }

        // Eat delay cooldown
        if (player.eatCooldown > 0) player.eatCooldown--;

        // Special attack energy regen — 10% every 50 ticks (30s), always active
        if (player.specialAttackEnergy < 100) {
            if (!this._specRegenTicks) this._specRegenTicks = 0;
            this._specRegenTicks++;
            if (this._specRegenTicks >= 50) {
                this._specRegenTicks = 0;
                player.specialAttackEnergy = Math.min(100, player.specialAttackEnergy + 10);
            }
        } else {
            this._specRegenTicks = 0;
        }

        // Skull timer countdown
        if (player.skulled) {
            player.skullTimer -= CONFIG.COMBAT.tickDuration;
            if (player.skullTimer <= 0) {
                player.skulled = false;
                player.skullTimer = 0;
                this.game.addChatMessage('Your skull has faded.', 'system');
            }
        }

        // Stun timer
        if (player.stunned) {
            player.stunTimer -= CONFIG.COMBAT.tickDuration;
            if (player.stunTimer <= 0) {
                player.stunned = false;
                player.stunTimer = 0;
            }
        }

        // Potion buff timers
        for (const [buffName, buff] of Object.entries(player.activeBuffs)) {
            buff.timer -= CONFIG.COMBAT.tickDuration;
            if (buff.timer <= 0) {
                delete player.activeBuffs[buffName];
                this.game.addChatMessage(`Your ${buffName} potion has worn off.`, 'system');
            }
        }

        // Player attacking monster
        if (player.inCombat && player.combatTarget) {
            const monster = player.combatTarget;

            if (!monster.alive) {
                player.inCombat = false;
                player.combatTarget = null;
            } else {
                // Keep monster tracking the player's current position
                monster.combatTarget = this.game.engine.camera.position;

                // Check distance based on attack style
                const dist = this.game.distanceToPlayer(monster.position);
                const maxRange = this._getMaxRange(player);
                if (dist > maxRange + 1) {
                    this.game.addChatMessage("Your target is too far away.", 'system');
                    player.inCombat = false;
                    player.combatTarget = null;
                    monster.stopCombat();
                } else {
                    // KBD phase logic
                    const monsterType = monster.config?.type || monster.mesh?.userData?.subType;
                    if (monsterType === 'kbd' || monster.name === 'King Black Dragon') {
                        this._updateKBDPhase(monster, player);
                    }

                    // Player attack
                    player.attackTimer++;
                    if (player.attackTimer >= CONFIG.COMBAT.playerAttackSpeed) {
                        player.attackTimer = 0;
                        this._playerAttack(player, monster);
                        this.game.engine.triggerSwing();
                    }
                }
            }
        }

        // Monster attacks — process ALL monsters in combat (handles aggro + retaliation)
        const monsters = this.game.environment?.monsters || [];
        for (const monster of monsters) {
            if (!monster.inCombat || !monster.alive) continue;

            // Keep monster tracking the player
            monster.combatTarget = this.game.engine.camera.position;

            const monsterType = monster.config?.type || monster.mesh?.userData?.subType;
            monster.attackTimer++;
            const effectiveSpeed = (monsterType === 'kbd' || monster.name === 'King Black Dragon') && this._kbdPhase === 3
                ? (CONFIG.MONSTERS.kbd.phase3AttackSpeed || 2)
                : monster.attackSpeed;
            if (monster.attackTimer >= effectiveSpeed) {
                monster.attackTimer = 0;
                this._monsterAttack(monster, player);
            }
        }
    }

    _updateKBDPhase(monster, player) {
        const hpPct = monster.hp / monster.maxHp;
        const phases = CONFIG.MONSTERS.kbd.phases;
        let newPhase = 1;
        if (hpPct <= phases.phase3) newPhase = 3;
        else if (hpPct <= phases.phase2) newPhase = 2;

        if (newPhase !== this._kbdPhase) {
            this._kbdPhase = newPhase;
            if (newPhase === 2) {
                this.game.addChatMessage('The King Black Dragon breathes fire!', 'damage');
                this._kbdFireBreathTick = 0;
            } else if (newPhase === 3) {
                this.game.addChatMessage('The King Black Dragon enters a frenzy! It summons skeletal minions!', 'damage');
                // Spawn 2 skeleton minions near KBD
                this._spawnKBDMinions(monster);
            }
        }

        // Phase 2+: fire breath AOE every 3 ticks
        if (this._kbdPhase >= 2) {
            this._kbdFireBreathTick++;
            if (this._kbdFireBreathTick >= (CONFIG.MONSTERS.kbd.fireBreathInterval || 3)) {
                this._kbdFireBreathTick = 0;
                this._kbdFireBreath(player);
            }
        }
    }

    _kbdFireBreath(player) {
        // Show fire warning
        if (this._kbdFireWarning) {
            this._kbdFireWarning.classList.add('active');
            setTimeout(() => this._kbdFireWarning?.classList.remove('active'), 600);
        }

        // Protect from Magic halves fire breath damage
        let damage = Math.floor(Math.random() * 5) + 2;
        if (this.game.prayerSystem && this.game.prayerSystem.hasProtection('magic')) {
            damage = Math.max(1, Math.floor(damage * 0.4)); // 60% reduction
        }

        player.hp -= damage;
        this._showPlayerHitsplat(damage, false);
        this.game.addChatMessage(`The dragon's fire breath hits you for ${damage}!`, 'damage');
        this.game.engine.triggerShake(0.3);
        if (player.hp <= 0) {
            player.hp = 0;
            this._onPlayerDeath();
        }
    }

    _spawnKBDMinions(kbdMonster) {
        // Spawn 2 skeleton minions near the KBD
        for (let i = 0; i < 2; i++) {
            const offsetX = (Math.random() - 0.5) * 6;
            const offsetZ = (Math.random() - 0.5) * 6;
            const data = {
                type: 'skeleton',
                x: kbdMonster.position.x + offsetX,
                z: kbdMonster.position.z + offsetZ
            };
            this.game.environment._spawnMonster(data);
        }
    }

    /** Spawn a 3D arrow that flies from player toward the monster */
    _spawnArrowProjectile(from, to) {
        const scene = this.game.engine.scene;

        // Arrow shaft (thin brown cylinder)
        const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.4, 4),
            new THREE.MeshStandardMaterial({ color: 0x8B5E3C, roughness: 0.8 })
        );

        // Arrow head (small dark cone)
        const head = new THREE.Mesh(
            new THREE.ConeGeometry(0.03, 0.1, 4),
            new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.3 })
        );
        head.position.y = 0.25;

        // Fletching (small triangles at back)
        const fletch = new THREE.Mesh(
            new THREE.ConeGeometry(0.025, 0.08, 3),
            new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.5 })
        );
        fletch.position.y = -0.2;
        fletch.rotation.x = Math.PI;

        const arrow = new THREE.Group();
        arrow.add(shaft);
        arrow.add(head);
        arrow.add(fletch);

        // Start position: slightly in front of player at chest height
        const start = new THREE.Vector3(from.x, (from.y || 0) + 1.2, from.z);
        const end = new THREE.Vector3(to.x, (to.y || 0) + 0.8, to.z);

        arrow.position.copy(start);

        // Point arrow toward target
        const dir = new THREE.Vector3().subVectors(end, start).normalize();
        const axis = new THREE.Vector3(0, 1, 0);
        const angleY = Math.atan2(dir.x, dir.z);
        const angleX = -Math.asin(dir.y);
        arrow.rotation.set(0, angleY, 0);
        arrow.rotation.x = angleX;
        // Rotate so the cylinder's Y-axis points along travel direction
        arrow.rotateX(Math.PI / 2);

        scene.add(arrow);

        const speed = 25; // units per second
        const distance = start.distanceTo(end);
        const duration = distance / speed;

        this._projectiles.push({
            mesh: arrow,
            start: start.clone(),
            end: end.clone(),
            elapsed: 0,
            duration: Math.max(0.1, duration),
        });
    }

    /** Update all in-flight projectiles (call every frame) */
    updateProjectiles(dt) {
        for (let i = this._projectiles.length - 1; i >= 0; i--) {
            const p = this._projectiles[i];
            p.elapsed += dt;
            const t = Math.min(1, p.elapsed / p.duration);

            // Lerp position
            p.mesh.position.lerpVectors(p.start, p.end, t);

            // Slight arc — parabolic Y offset
            const arc = Math.sin(t * Math.PI) * 0.5;
            p.mesh.position.y += arc;

            if (t >= 1) {
                // Arrived — remove
                this.game.engine.scene.remove(p.mesh);
                this._projectiles.splice(i, 1);
            }
        }
    }

    _getMaxRange(player) {
        if (player.attackStyle === 'ranged') return CONFIG.COMBAT.rangedRange;
        if (player.attackStyle === 'magic') return CONFIG.COMBAT.magicRange;
        return CONFIG.COMBAT.meleeRange;
    }

    _playerAttack(player, monster) {
        const style = player.attackStyle;

        if (style === 'ranged') {
            this._playerRangedAttack(player, monster);
        } else if (style === 'magic') {
            this._playerMagicAttack(player, monster);
        } else {
            this._playerMeleeAttack(player, monster);
        }
    }

    _playerMeleeAttack(player, monster) {
        const atkBonus = player.getEquipmentBonus('attackBonus');
        const prayerAtk = this.game.prayerSystem ? this.game.prayerSystem.getPrayerBonus('attackBonus') : 0;

        // Potion buffs
        const atkBuff = player.activeBuffs.attack ? player.activeBuffs.attack.boost : 0;
        const strBuff = player.activeBuffs.strength ? player.activeBuffs.strength.boost : 0;

        // Special attack handling
        const weaponId = player.equipment.weapon;
        let specialType = null;
        if (player.specialAttackActive && weaponId) {
            if (weaponId.includes('dagger')) specialType = 'dagger';
            else if (weaponId.includes('sword')) specialType = 'sword';
            else if (weaponId.includes('mace')) specialType = 'mace';

            if (specialType) {
                const spec = CONFIG.SPECIAL_ATTACKS[specialType];
                if (spec && player.specialAttackEnergy >= spec.energyCost) {
                    player.specialAttackEnergy -= spec.energyCost;
                    this.game.addChatMessage(`Special attack: ${spec.name}!`, 'level-up');
                } else {
                    this.game.addChatMessage("Not enough special attack energy!", 'system');
                    specialType = null;
                }
            }
            player.specialAttackActive = false;
        }

        // Accuracy modifier for sword special
        const accuracyMod = specialType === 'sword' ? 1.5 : 1.0;

        const attackRoll = Math.random() * (player.skills.attack.level + atkBuff + 8 + atkBonus + prayerAtk) * accuracyMod;
        const defenceRoll = Math.random() * (monster.defenceLevel + 8);

        // Mace special: drain monster defence
        if (specialType === 'mace') {
            monster.defenceLevel = Math.max(0, monster.defenceLevel - 3);
            this.game.addChatMessage(`You drain the ${monster.name}'s defence!`, 'system');
        }

        if (attackRoll >= defenceRoll) {
            const strBonus = player.getEquipmentBonus('strengthBonus');
            const prayerStr = this.game.prayerSystem ? this.game.prayerSystem.getPrayerBonus('strengthBonus') : 0;
            const maxHit = Math.max(1, Math.floor(0.5 + (player.skills.strength.level + strBuff) * 0.15 + 1 + (strBonus + prayerStr) * 0.2));

            // Dagger special: double hit
            const hitCount = specialType === 'dagger' ? 2 : 1;
            let totalDamage = 0;

            for (let h = 0; h < hitCount; h++) {
                const damage = Math.floor(Math.random() * (maxHit + 1));
                totalDamage += damage;
                const killed = monster.takeDamage(damage);
                this._showHitsplat(monster.mesh, damage, false);
                this.game.audio.playHit();
                this.game.particleSystem.createHitBurst(monster.position, damage);

                if (damage > 0) {
                    this.game.addChatMessage(`You hit the ${monster.name} for ${damage} damage.`, 'damage');
                    monster.flinch();
                }

                // Camera kick on big hits (10+)
                if (damage >= 10) {
                    this.game.engine.triggerShake(0.15);
                }

                if (killed) { this._onMonsterKill(player, monster); break; }
            }

            // XP for melee — based on combat sub-style
            const meleeXP = Math.ceil(totalDamage * 4);
            const hpXP = Math.ceil(totalDamage * 1.33);
            switch (player.meleeStyle) {
                case 'accurate':
                    this.game.skillSystem.addXP('attack', meleeXP);
                    break;
                case 'aggressive':
                    this.game.skillSystem.addXP('strength', meleeXP);
                    break;
                case 'defensive':
                    this.game.skillSystem.addXP('defence', meleeXP);
                    break;
                case 'controlled':
                    this.game.skillSystem.addXP('attack', Math.ceil(meleeXP / 3));
                    this.game.skillSystem.addXP('strength', Math.ceil(meleeXP / 3));
                    this.game.skillSystem.addXP('defence', Math.ceil(meleeXP / 3));
                    break;
            }
            this.game.skillSystem.addXP('hitpoints', hpXP);

        } else {
            this._showHitsplat(monster.mesh, 0, true);
            this.game.audio.playMiss();
        }
    }

    _playerRangedAttack(player, monster) {
        // Check for arrows
        const arrowTypes = ['iron_arrow', 'bronze_arrow'];
        let arrowId = null;
        for (const at of arrowTypes) {
            if (this.game.inventorySystem.hasItem(at)) { arrowId = at; break; }
        }
        if (!arrowId) {
            this.game.addChatMessage("You don't have any arrows.", 'system');
            player.attackStyle = 'melee';
            return;
        }
        // Check for bow
        const weapon = player.equipment.weapon;
        const weaponDef = weapon ? CONFIG.ITEMS[weapon] : null;
        if (!weaponDef || weaponDef.attackStyle !== 'ranged') {
            this.game.addChatMessage("You need a bow equipped to use ranged.", 'system');
            player.attackStyle = 'melee';
            return;
        }

        // Consume arrow
        this.game.inventorySystem.removeItem(arrowId, 1);
        const arrowDef = CONFIG.ITEMS[arrowId];
        const rangedBonus = (weaponDef.rangedBonus || 0) + (arrowDef.rangedStrength || 0);

        // Spawn arrow projectile visual
        this._spawnArrowProjectile(player.position, monster.position);

        const attackRoll = Math.random() * (player.skills.ranged.level + 8 + rangedBonus);
        const defenceRoll = Math.random() * (monster.defenceLevel + 8);

        if (attackRoll >= defenceRoll) {
            const maxHit = Math.max(1, Math.floor(0.5 + player.skills.ranged.level * 0.18 + rangedBonus * 0.35));
            const damage = Math.floor(Math.random() * (maxHit + 1));

            const killed = monster.takeDamage(damage);
            this._showHitsplat(monster.mesh, damage, false);
            this.game.audio.playHit();
            this.game.particleSystem.createHitBurst(monster.position, damage);
            if (damage > 0) {
                this.game.addChatMessage(`Your arrow hits the ${monster.name} for ${damage} damage.`, 'damage');
                monster.flinch();
            }

            // Ranged XP — based on ranged sub-style
            if (player.rangedStyle === 'longrange') {
                this.game.skillSystem.addXP('ranged', Math.ceil(damage * 2));
                this.game.skillSystem.addXP('defence', Math.ceil(damage * 2));
            } else {
                this.game.skillSystem.addXP('ranged', Math.ceil(damage * 4));
            }
            this.game.skillSystem.addXP('hitpoints', Math.ceil(damage * 1.33));

            if (killed) this._onMonsterKill(player, monster);
        } else {
            this._showHitsplat(monster.mesh, 0, true);
            this.game.audio.playMiss();
        }
    }

    _playerMagicAttack(player, monster) {
        const spellId = player.selectedSpell;
        const spell = spellId ? CONFIG.SPELLS[spellId] : null;
        if (!spell) {
            this.game.addChatMessage("Select a spell first.", 'system');
            player.attackStyle = 'melee';
            return;
        }
        if (player.skills.magic.level < spell.level) {
            this.game.addChatMessage(`You need Magic level ${spell.level} for ${spell.name}.`, 'system');
            return;
        }
        // Check runes (account for staff providing runes)
        const weapon = player.equipment.weapon;
        const weaponDef = weapon ? CONFIG.ITEMS[weapon] : null;
        const providesRune = weaponDef?.providesRune;

        for (const [runeId, qty] of Object.entries(spell.runes)) {
            if (runeId === providesRune) continue; // Staff provides this rune
            if (!this.game.inventorySystem.hasItem(runeId, qty)) {
                const runeName = CONFIG.ITEMS[runeId]?.name || runeId;
                this.game.addChatMessage(`You need ${qty} ${runeName}(s) for ${spell.name}.`, 'system');
                return;
            }
        }
        // Consume runes
        for (const [runeId, qty] of Object.entries(spell.runes)) {
            if (runeId === providesRune) continue;
            this.game.inventorySystem.removeItem(runeId, qty);
        }
        this.game.audio.playCast();

        const magicBonus = player.getEquipmentBonus('magicBonus') || 0;
        const attackRoll = Math.random() * (player.skills.magic.level + 8 + magicBonus);
        const defenceRoll = Math.random() * (monster.defenceLevel + 8);

        if (attackRoll >= defenceRoll) {
            // Magic max hit scales: spell base + magic level bonus + magic equipment bonus
            const effectiveMaxHit = spell.maxHit + Math.floor(player.skills.magic.level * 0.15) + Math.floor(magicBonus * 0.2);
            const damage = Math.floor(Math.random() * (effectiveMaxHit + 1));
            const killed = monster.takeDamage(damage);
            this._showHitsplat(monster.mesh, damage, false);
            this.game.audio.playHit();
            this.game.particleSystem.createHitBurst(monster.position, damage);
            if (damage > 0) {
                this.game.addChatMessage(`Your ${spell.name} hits the ${monster.name} for ${damage}.`, 'damage');
                monster.flinch();
            }

            // Magic XP — based on magic sub-style
            this.game.skillSystem.addXP('magic', spell.xp);
            if (player.magicStyle === 'defensive') {
                this.game.skillSystem.addXP('defence', Math.ceil(damage * 1.33));
            }
            this.game.skillSystem.addXP('hitpoints', Math.ceil(damage * 1.33));

            if (killed) this._onMonsterKill(player, monster);
        } else {
            this._showHitsplat(monster.mesh, 0, true);
            this.game.audio.playMiss();
            this.game.skillSystem.addXP('magic', Math.ceil(spell.xp * 0.2)); // Splash XP
        }
    }

    _monsterAttack(monster, player) {
        const defBonus = player.getEquipmentBonus('defenceBonus');
        const prayerDef = this.game.prayerSystem ? this.game.prayerSystem.getPrayerBonus('defenceBonus') : 0;
        const defBuff = player.activeBuffs.defence ? player.activeBuffs.defence.boost : 0;

        // Protection prayers — check monster's attack type
        const monsterAttackType = monster.config?.attackType || 'melee';
        if (this.game.prayerSystem && this.game.prayerSystem.hasProtection(monsterAttackType)) {
            this._showPlayerHitsplat(0, true);
            return;
        }

        // Auto-retaliate: if player not in combat but has autoRetaliate on
        if (!player.inCombat && player.autoRetaliate && monster.alive && !player.dead) {
            player.inCombat = true;
            player.combatTarget = monster;
            player.attackTimer = 0;
            monster.startCombat(this.game.engine.camera.position);
            this.game.addChatMessage(`Auto-retaliate: You attack the ${monster.name}.`, 'system');
        }

        const attackRoll = Math.random() * (monster.attackLevel + 8);
        const defenceRoll = Math.random() * (player.skills.defence.level + defBuff + 8 + defBonus + prayerDef);

        if (attackRoll >= defenceRoll) {
            const maxHit = Math.max(1, Math.floor(0.5 + monster.strengthLevel * 0.15 + 1));
            const damage = Math.floor(Math.random() * (maxHit + 1));

            player.hp -= damage;
            this._showPlayerHitsplat(damage, false);
            if (damage > 0) this.game.addChatMessage(`The ${monster.name} hits you for ${damage} damage.`, 'damage');

            // Screen shake on big hits (5+ damage)
            if (damage >= 5) {
                this.game.engine.triggerShake(damage * 0.04);
            }

            // Hitpoints XP from taking damage
            this.game.skillSystem.addXP('hitpoints', Math.ceil(damage * 0.44));

            // Poison check
            const monsterType = monster.config?.type || monster.mesh?.userData?.subType;
            const mConfig = CONFIG.MONSTERS[monsterType];
            if (mConfig?.poisonChance && !player.poisoned && damage > 0) {
                if (Math.random() < mConfig.poisonChance) {
                    player.poisoned = true;
                    player.poisonDamage = mConfig.poisonDamage;
                    player.poisonTicksLeft = mConfig.poisonTicks;
                    this.game.addChatMessage('You have been poisoned!', 'damage');
                }
            }

            if (player.hp <= 0) {
                player.hp = 0;
                this._onPlayerDeath();
            }
        } else {
            this._showPlayerHitsplat(0, true);
        }
    }

    _onMonsterKill(player, monster) {
        player.inCombat = false;
        player.combatTarget = null;
        this.game.addChatMessage(`You defeated the ${monster.name}!`, 'level-up');

        // Award base combat XP from config
        const xpReward = monster.xpReward;
        if (xpReward.hitpoints) this.game.skillSystem.addXP('hitpoints', xpReward.hitpoints);

        // Track kill count
        const monsterType = monster.config?.type || monster.mesh?.userData?.subType;
        if (monsterType) {
            player.killCounts[monsterType] = (player.killCounts[monsterType] || 0) + 1;
        }

        // Slayer system
        if (this.game.slayerSystem && monsterType) {
            this.game.slayerSystem.onMonsterKill(monsterType);
        }

        // Achievement checks
        if (this.game.achievementSystem) {
            this.game.achievementSystem.unlock('first_kill');
            if (monsterType === 'kbd') this.game.achievementSystem.unlock('kill_boss');
        }

        // Skull player if killing in wilderness
        if (monster.position.z < -50) {
            if (!player.skulled) {
                player.skulled = true;
                player.skullTimer = 180; // 3 minutes
                this.game.addChatMessage('You have been skulled!', 'damage');
            } else {
                player.skullTimer = 180; // Reset timer
            }
        }

        // Reset KBD phase when KBD dies
        if (monsterType === 'kbd' || monster.name === 'King Black Dragon') {
            this._kbdPhase = 1;
            this._kbdFireBreathTick = 0;
        }

        // Death effects
        this.game.particleSystem.createDeathBurst(monster.position);
        this.game.audio.playMonsterDeath();

        // Generate loot now (before respawn recycles the monster), but delay spawning
        const deathPos = monster.position.clone();
        const loot = monster.generateLoot();
        const monsterName = monster.name;
        const monsterLootTable = monster.lootTable;

        setTimeout(() => {
            for (const drop of loot) {
                this.game.environment.spawnGroundItem(drop.item, drop.qty, deathPos);
                const itemDef = CONFIG.ITEMS[drop.item];
                const itemName = itemDef.name;
                this.game.addChatMessage(
                    `Loot: ${itemDef.icon || ''} ${itemName}${drop.qty > 1 ? ' x' + drop.qty : ''}`,
                    'loot'
                );

                // Loot beam on rare drops (chance <= 0.15)
                const lootEntry = monsterLootTable.find(e => e.item === drop.item);
                if (lootEntry && lootEntry.chance <= 0.15) {
                    this.game.environment.spawnLootBeam(deathPos);
                }
            }
        }, 800);
    }

    _onPlayerDeath() {
        const player = this.game.player;
        const deathPos = player.position.clone();

        // Collect all items for gravestone
        const inv = this.game.inventorySystem;
        const gravestoneItems = [];
        let droppedAny = false;

        // If skulled, drop everything (inventory + equipped)
        if (player.skulled) {
            for (let i = 0; i < 28; i++) {
                const slot = inv.slots[i];
                if (slot) {
                    this.game.environment.spawnGroundItem(slot.itemId, slot.quantity, deathPos);
                    inv.slots[i] = null;
                    droppedAny = true;
                }
            }
            // Drop equipped items too
            for (const slotName of CONFIG.EQUIPMENT_SLOTS) {
                const itemId = player.equipment[slotName];
                if (itemId) {
                    this.game.environment.spawnGroundItem(itemId, 1, deathPos);
                    player.equipment[slotName] = null;
                    droppedAny = true;
                }
            }
            player.skulled = false;
            player.skullTimer = 0;
        } else {
            // Not skulled: store in gravestone
            for (let i = 0; i < 28; i++) {
                const slot = inv.slots[i];
                if (slot) {
                    gravestoneItems.push({ itemId: slot.itemId, qty: slot.quantity });
                    inv.slots[i] = null;
                    droppedAny = true;
                }
            }
            // Spawn gravestone
            if (gravestoneItems.length > 0) {
                this.game.environment.spawnGravestone(deathPos, gravestoneItems);
            }
        }

        player.die();
        this.game.addChatMessage('Oh dear, you are dead!', 'damage');
        if (droppedAny && player.skulled) {
            this.game.addChatMessage('You were skulled! All items have been dropped!', 'damage');
        } else if (droppedAny) {
            this.game.addChatMessage('Your items are stored in a gravestone. You have 2 minutes to reclaim them!', 'damage');
        }
        this.game.audio.playDeath();
        this._deathOverlay.classList.add('active');

        // Countdown timer
        const cdEl = document.getElementById('death-countdown');
        let countdown = 3;
        if (cdEl) cdEl.textContent = `Respawning in ${countdown}...`;
        const cdInterval = setInterval(() => {
            countdown--;
            if (cdEl) {
                if (countdown > 0) cdEl.textContent = `Respawning in ${countdown}...`;
                else cdEl.textContent = '';
            }
        }, 1000);

        setTimeout(() => {
            clearInterval(cdInterval);
            if (cdEl) cdEl.textContent = '';
            this._deathOverlay.classList.remove('active');
            player.respawn();
            this.game.addChatMessage('You respawn at the starting point.', 'system');
            if (droppedAny) this.game.addChatMessage('Hurry back to your gravestone!', 'system');
        }, 3000);
    }

    updateMonsterBars() {
        this._monsterBarsContainer.innerHTML = '';
        const camera = this.game.engine.camera;
        for (const monster of this.game.environment.monsters) {
            if (!monster.alive || !monster.inCombat) continue;
            const pos = monster.mesh.position.clone();
            pos.y += monster.config.name === 'Chicken' ? 1.2 : (monster.config.name === 'King Black Dragon' ? 4 : 2.0);
            const screenPos = pos.clone().project(camera);
            if (screenPos.z > 1) continue;
            const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

            const nameTag = document.createElement('div');
            nameTag.className = 'monster-name-tag';
            nameTag.textContent = `${monster.name} (lvl ${monster.combatLevel})`;
            nameTag.style.left = x + 'px';
            nameTag.style.top = (y - 12) + 'px';
            this._monsterBarsContainer.appendChild(nameTag);

            const bar = document.createElement('div');
            bar.className = 'monster-hp-bar';
            bar.style.left = x + 'px';
            bar.style.top = y + 'px';
            const fill = document.createElement('div');
            const pct = Math.max(0, monster.hp / monster.maxHp * 100);
            fill.className = 'monster-hp-fill' + (pct < 30 ? ' low' : '');
            fill.style.width = pct + '%';
            bar.appendChild(fill);
            this._monsterBarsContainer.appendChild(bar);
        }
    }

    _showHitsplat(mesh, damage, isMiss) {
        const pos = mesh.position.clone(); pos.y += 2;
        const camera = this.game.engine.camera;
        const screenPos = pos.project(camera);
        if (screenPos.z > 1) return;
        const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        let y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

        // Stack offset for multiple simultaneous hitsplats on same monster
        if (!this._hitsplatOffsets) this._hitsplatOffsets = new Map();
        let offsetData = this._hitsplatOffsets.get(mesh);
        if (!offsetData) {
            offsetData = { count: 0 };
            this._hitsplatOffsets.set(mesh, offsetData);
        }
        y += offsetData.count * 22;
        offsetData.count++;
        clearTimeout(offsetData.timer);
        offsetData.timer = setTimeout(() => this._hitsplatOffsets.delete(mesh), 1600);

        this._createHitsplatElement(x, y, damage, isMiss);
    }

    _showPlayerHitsplat(damage, isMiss, type) {
        const x = window.innerWidth / 2 + (Math.random() - 0.5) * 40;
        let y = 80;

        // Stack offset for multiple hits on player
        if (!this._playerSplatCount) this._playerSplatCount = 0;
        y += this._playerSplatCount * 22;
        this._playerSplatCount++;
        clearTimeout(this._playerSplatResetTimer);
        this._playerSplatResetTimer = setTimeout(() => { this._playerSplatCount = 0; }, 1600);

        this._createHitsplatElement(x, y, damage, isMiss, type);
    }

    _createHitsplatElement(x, y, damage, isMiss, type) {
        const el = document.createElement('div');
        const cls = type === 'poison' ? 'poison' : (isMiss ? 'miss' : 'hit');
        el.className = `hitsplat ${cls}`;
        el.textContent = damage;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        this._hitsplatContainer.appendChild(el);
        setTimeout(() => el.remove(), 1500);
    }

    startCombat(monster) {
        if (!monster.alive) return;
        const player = this.game.player;
        player.stopActions();

        const dist = this.game.distanceToPlayer(monster.position);
        const maxRange = this._getMaxRange(player);
        if (dist > maxRange) {
            this.game.addChatMessage("You're too far away to attack that.", 'system');
            return;
        }

        player.inCombat = true;
        player.combatTarget = monster;
        player.attackTimer = 0;
        monster.startCombat(this.game.engine.camera.position);
        this.game.addChatMessage(`You attack the ${monster.name}.`);
    }
}
