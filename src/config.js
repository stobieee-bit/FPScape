// Pre-computed RS XP table: XP required for each level (0-99)
const XP_TABLE = [0, 0];
for (let i = 1; i < 99; i++) {
    const prev = XP_TABLE[i];
    XP_TABLE.push(prev + Math.floor(i + 300 * Math.pow(2, i / 7)) / 4 | 0);
}

export const CONFIG = {
    NETWORK: {
        // Auto-detect: use wss:// on HTTPS (Render), ws:// on HTTP (local dev)
        // On Render the WS runs on the same port as HTTP, so no :3000 needed
        wsUrl: window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
            ? `ws://${window.location.hostname}:3000`
            : `wss://${window.location.host}`,
        sendRate: 15,    // state updates per second
        lerpFactor: 10,  // interpolation speed multiplier
    },

    WORLD: {
        size: 300,
        segments: 150,
        noiseScale: 0.02,
        heightAmplitude: 2,
    },

    PLAYER: {
        walkSpeed: 4,
        runSpeed: 6,
        height: 1.8,
        eyeHeight: 1.6,
        interactionRange: 4,
        gravity: -20,
        groundCheckDist: 0.3,
    },

    CAMERA: {
        fov: 70,
        near: 0.1,
        far: 500,
        mouseSensitivity: 0.002,
        pitchMin: -1.4,
        pitchMax: 1.4,
    },

    COMBAT: {
        tickDuration: 0.6,
        meleeRange: 3,
        rangedRange: 12,
        magicRange: 10,
        playerAttackSpeed: 3,  // ticks between attacks (1.8s)
    },

    XP_TABLE,

    SKILLS: {
        attack:      { name: 'Attack',      icon: '⚔️', color: '#FF4444' },
        strength:    { name: 'Strength',    icon: '💪', color: '#00CC00' },
        defence:     { name: 'Defence',     icon: '🛡️', color: '#6699FF' },
        hitpoints:   { name: 'Hitpoints',   icon: '❤️', color: '#FF4444' },
        ranged:      { name: 'Ranged',      icon: '🏹', color: '#00CC00' },
        magic:       { name: 'Magic',       icon: '🔮', color: '#CC88FF' },
        prayer:      { name: 'Prayer',      icon: '✨', color: '#33DDDD' },
        woodcutting: { name: 'Woodcutting', icon: '🪓', color: '#CC9900' },
        mining:      { name: 'Mining',      icon: '⛏️', color: '#CC9900' },
        fishing:     { name: 'Fishing',     icon: '🎣', color: '#3388FF' },
        cooking:     { name: 'Cooking',     icon: '🍳', color: '#CC9900' },
        firemaking:  { name: 'Firemaking',  icon: '🔥', color: '#FF8800' },
        smithing:    { name: 'Smithing',    icon: '🔨', color: '#AAAAAA' },
        runecrafting:{ name: 'Runecrafting', icon: '🌀', color: '#CC88FF' },
        agility:     { name: 'Agility',     icon: '🏃', color: '#00CC00' },
        slayer:      { name: 'Slayer',      icon: '💀', color: '#666666' },
        thieving:    { name: 'Thieving',    icon: '🤏', color: '#CC66CC' },
        herblore:    { name: 'Herblore',    icon: '🌿', color: '#00AA44' },
        fletching:   { name: 'Fletching',  icon: '🪶', color: '#00AA44' },
    },

    TREES: {
        normal: { name: 'Tree', hp: 10, respawnTime: 15, requiredLevel: 1, xpPerHarvest: 25, yieldItem: 'logs', successChance: 0.25 },
        oak:    { name: 'Oak tree', hp: 15, respawnTime: 20, requiredLevel: 15, xpPerHarvest: 37, yieldItem: 'oak_logs', successChance: 0.15 },
        willow: { name: 'Willow tree', hp: 20, respawnTime: 25, requiredLevel: 30, xpPerHarvest: 67, yieldItem: 'willow_logs', successChance: 0.10 },
        palm:   { name: 'Palm tree', hp: 15, respawnTime: 20, requiredLevel: 35, xpPerHarvest: 55, yieldItem: 'palm_logs', successChance: 0.12 },
    },

    ROCKS: {
        copper: { name: 'Copper rock', hp: 6, respawnTime: 4, requiredLevel: 1, xpPerHarvest: 17, yieldItem: 'copper_ore', successChance: 0.30 },
        tin:    { name: 'Tin rock', hp: 6, respawnTime: 4, requiredLevel: 1, xpPerHarvest: 17, yieldItem: 'tin_ore', successChance: 0.30 },
        iron:   { name: 'Iron rock', hp: 10, respawnTime: 10, requiredLevel: 15, xpPerHarvest: 35, yieldItem: 'iron_ore', successChance: 0.18 },
        coal:    { name: 'Coal rock', hp: 12, respawnTime: 30, requiredLevel: 30, xpPerHarvest: 50, yieldItem: 'coal', successChance: 0.14 },
        mithril: { name: 'Mithril rock', hp: 15, respawnTime: 60, requiredLevel: 55, xpPerHarvest: 80, yieldItem: 'mithril_ore', successChance: 0.10 },
        adamant: { name: 'Adamant rock', hp: 20, respawnTime: 120, requiredLevel: 70, xpPerHarvest: 95, yieldItem: 'adamantite_ore', successChance: 0.08 },
        runite:  { name: 'Runite rock', hp: 25, respawnTime: 300, requiredLevel: 85, xpPerHarvest: 125, yieldItem: 'runite_ore', successChance: 0.05 },
        obsidian: { name: 'Obsidian rock', hp: 18, respawnTime: 90, requiredLevel: 65, xpPerHarvest: 90, yieldItem: 'obsidian_ore', successChance: 0.08 },
    },

    MONSTERS: {
        chicken: {
            name: 'Chicken', hp: 3, combatLevel: 1,
            attackLevel: 1, strengthLevel: 1, defenceLevel: 1,
            attackSpeed: 4, aggroRange: 0, wanderRadius: 6, moveSpeed: 1,
            lootTable: [
                { item: 'raw_chicken', qty: 1, chance: 1.0 },
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'feather', qty: 5, chance: 0.8 },
                { item: 'clue_scroll_easy', qty: 1, chance: 0.04 },
            ],
            respawnTime: 15,
            xpReward: { attack: 8, strength: 8, defence: 8, hitpoints: 3 },
        },
        cow: {
            name: 'Cow', hp: 8, combatLevel: 2,
            attackLevel: 1, strengthLevel: 1, defenceLevel: 1,
            attackSpeed: 5, aggroRange: 0, wanderRadius: 8, moveSpeed: 0.8,
            lootTable: [
                { item: 'raw_beef', qty: 1, chance: 1.0 },
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'cowhide', qty: 1, chance: 1.0 },
                { item: 'clue_scroll_easy', qty: 1, chance: 0.03 },
            ],
            respawnTime: 15,
            xpReward: { attack: 16, strength: 16, defence: 16, hitpoints: 8 },
        },
        rat: {
            name: 'Giant Rat', hp: 4, combatLevel: 1,
            attackLevel: 1, strengthLevel: 1, defenceLevel: 1,
            attackSpeed: 4, aggroRange: 3, wanderRadius: 5, moveSpeed: 1.5,
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 3, chance: 0.3 },
                { item: 'clue_scroll_easy', qty: 1, chance: 0.05 },
            ],
            respawnTime: 12,
            xpReward: { attack: 8, strength: 8, defence: 8, hitpoints: 3 },
        },
        goblin: {
            name: 'Goblin', hp: 5, combatLevel: 2,
            attackLevel: 1, strengthLevel: 1, defenceLevel: 1,
            attackSpeed: 4, aggroRange: 5, wanderRadius: 8, moveSpeed: 1.5,
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 5, chance: 0.5 },
                { item: 'goblin_mail', qty: 1, chance: 0.1 },
                { item: 'clue_scroll_easy', qty: 1, chance: 0.04 },
            ],
            respawnTime: 20,
            xpReward: { attack: 12, strength: 12, defence: 12, hitpoints: 5 },
        },
        skeleton_weak: {
            name: 'Skeleton', hp: 12, combatLevel: 8,
            attackLevel: 6, strengthLevel: 5, defenceLevel: 5,
            attackSpeed: 4, aggroRange: 6, wanderRadius: 5, moveSpeed: 1.2,
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 15, chance: 0.6 },
                { item: 'iron_sword', qty: 1, chance: 0.15 },
                { item: 'clue_scroll_medium', qty: 1, chance: 0.03 },
            ],
            respawnTime: 30,
            xpReward: { attack: 20, strength: 20, defence: 20, hitpoints: 10 },
        },
        giant_spider: {
            name: 'Giant Spider', hp: 18, combatLevel: 12,
            attackLevel: 8, strengthLevel: 7, defenceLevel: 6,
            attackSpeed: 3, aggroRange: 8, wanderRadius: 6, moveSpeed: 2,
            poisonChance: 0.25, poisonDamage: 1, poisonTicks: 5,
            lootTable: [
                { item: 'coins', qty: 25, chance: 0.7 },
                { item: 'iron_chainbody', qty: 1, chance: 0.08 },
                { item: 'clue_scroll_medium', qty: 1, chance: 0.02 },
            ],
            respawnTime: 40,
            xpReward: { attack: 30, strength: 30, defence: 30, hitpoints: 15 },
        },
        dark_wizard: {
            name: 'Dark Wizard', hp: 15, combatLevel: 10,
            attackLevel: 7, strengthLevel: 6, defenceLevel: 4,
            attackSpeed: 4, aggroRange: 7, wanderRadius: 4, moveSpeed: 1,
            attackType: 'magic',
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'air_rune', qty: 6, chance: 0.8 },
                { item: 'fire_rune', qty: 4, chance: 0.6 },
                { item: 'coins', qty: 20, chance: 0.5 },
                { item: 'rune_essence', qty: 3, chance: 0.3 },
                { item: 'herb', qty: 1, chance: 0.25 },
                { item: 'clue_scroll_hard', qty: 1, chance: 0.02 },
            ],
            respawnTime: 35,
            xpReward: { attack: 25, strength: 25, defence: 25, hitpoints: 12 },
        },
        lesser_demon: {
            name: 'Lesser Demon', hp: 30, combatLevel: 22,
            attackLevel: 15, strengthLevel: 14, defenceLevel: 12,
            attackSpeed: 4, aggroRange: 6, wanderRadius: 5, moveSpeed: 1.5,
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 50, chance: 0.7 },
                { item: 'fire_rune', qty: 10, chance: 0.5 },
                { item: 'steel_sword', qty: 1, chance: 0.1 },
                { item: 'adamant_sword', qty: 1, chance: 0.08 },
                { item: 'rune_essence', qty: 5, chance: 0.2 },
                { item: 'herb', qty: 2, chance: 0.35 },
            ],
            respawnTime: 50,
            xpReward: { attack: 50, strength: 50, defence: 50, hitpoints: 25 },
        },
        kbd: {
            name: 'King Black Dragon', hp: 80, combatLevel: 50,
            attackLevel: 25, strengthLevel: 25, defenceLevel: 20,
            attackSpeed: 3, aggroRange: 10, wanderRadius: 3, moveSpeed: 1,
            attackType: 'magic',
            poisonChance: 0.4, poisonDamage: 2, poisonTicks: 8,
            phases: { phase2: 0.66, phase3: 0.33 },
            fireBreathInterval: 3,
            phase3AttackSpeed: 2,
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 200, chance: 1.0 },
                { item: 'dragon_bones', qty: 1, chance: 1.0 },
                { item: 'steel_sword', qty: 1, chance: 0.3 },
                { item: 'rune_sword', qty: 1, chance: 0.15 },
                { item: 'rune_platebody', qty: 1, chance: 0.05 },
                { item: 'rune_essence', qty: 10, chance: 0.5 },
                { item: 'herb', qty: 3, chance: 0.5 },
                { item: 'clue_scroll_hard', qty: 1, chance: 0.02 },
            ],
            respawnTime: 120,
            xpReward: { attack: 150, strength: 150, defence: 150, hitpoints: 80 },
        },
        skeleton: {
            name: 'Skeleton', hp: 15, combatLevel: 12,
            attackLevel: 10, strengthLevel: 10, defenceLevel: 5,
            attackSpeed: 4, aggroRange: 6, wanderRadius: 3, moveSpeed: 1.5,
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 15, chance: 0.6 },
                { item: 'mithril_dagger', qty: 1, chance: 0.05 },
                { item: 'clue_scroll_medium', qty: 1, chance: 0.03 },
            ],
            respawnTime: 30,
            xpReward: { attack: 20, strength: 20, defence: 20, hitpoints: 10 },
        },
        moss_giant: {
            name: 'Moss Giant', hp: 25, combatLevel: 18,
            attackLevel: 12, strengthLevel: 12, defenceLevel: 10,
            attackSpeed: 4, aggroRange: 6, wanderRadius: 4, moveSpeed: 1.2,
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 30, chance: 0.7 },
                { item: 'herb', qty: 2, chance: 0.4 },
                { item: 'mithril_sword', qty: 1, chance: 0.08 },
                { item: 'clue_scroll_medium', qty: 1, chance: 0.025 },
            ],
            respawnTime: 40,
            xpReward: { attack: 40, strength: 40, defence: 40, hitpoints: 20 },
        },
        shadow_warrior: {
            name: 'Shadow Warrior', hp: 35, combatLevel: 28,
            attackLevel: 18, strengthLevel: 17, defenceLevel: 15,
            attackSpeed: 3, aggroRange: 7, wanderRadius: 4, moveSpeed: 2,
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 45, chance: 0.8 },
                { item: 'adamant_sword', qty: 1, chance: 0.1 },
                { item: 'adamant_helm', qty: 1, chance: 0.06 },
                { item: 'clue_scroll_hard', qty: 1, chance: 0.015 },
            ],
            respawnTime: 50,
            xpReward: { attack: 60, strength: 60, defence: 60, hitpoints: 25 },
        },
        demon_lord: {
            name: 'Demon Lord', hp: 60, combatLevel: 40,
            attackLevel: 22, strengthLevel: 22, defenceLevel: 18,
            attackSpeed: 3, aggroRange: 10, wanderRadius: 3, moveSpeed: 1.5,
            attackType: 'magic',
            poisonChance: 0.3, poisonDamage: 2, poisonTicks: 6,
            phases: { phase2: 0.5 },
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 150, chance: 1.0 },
                { item: 'rune_sword', qty: 1, chance: 0.2 },
                { item: 'demons_bane', qty: 1, chance: 0.5 },
                { item: 'clue_scroll_hard', qty: 1, chance: 0.01 },
            ],
            respawnTime: 90,
            xpReward: { attack: 100, strength: 100, defence: 100, hitpoints: 50 },
        },
        // ── Biome monsters ──
        scorpion: {
            name: 'Scorpion', hp: 18, combatLevel: 14,
            attackLevel: 10, strengthLevel: 12, defenceLevel: 8,
            attackSpeed: 3, aggroRange: 5, wanderRadius: 5, moveSpeed: 1.8,
            poisonChance: 0.2, poisonDamage: 1, poisonTicks: 4,
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 20, chance: 0.6 },
                { item: 'desert_artifact_shard', qty: 1, chance: 0.15 },
                { item: 'clue_scroll_easy', qty: 1, chance: 0.04 },
            ],
            respawnTime: 25,
            xpReward: { attack: 25, strength: 25, defence: 25, hitpoints: 10 },
        },
        giant_frog: {
            name: 'Giant Frog', hp: 12, combatLevel: 10,
            attackLevel: 7, strengthLevel: 8, defenceLevel: 5,
            attackSpeed: 4, aggroRange: 4, wanderRadius: 6, moveSpeed: 1.5,
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 10, chance: 0.5 },
                { item: 'clue_scroll_easy', qty: 1, chance: 0.05 },
            ],
            respawnTime: 20,
            xpReward: { attack: 18, strength: 18, defence: 18, hitpoints: 8 },
        },
        ice_wolf: {
            name: 'Ice Wolf', hp: 28, combatLevel: 20,
            attackLevel: 15, strengthLevel: 14, defenceLevel: 12,
            attackSpeed: 3, aggroRange: 8, wanderRadius: 5, moveSpeed: 2.5,
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 35, chance: 0.7 },
                { item: 'iron_chainbody', qty: 1, chance: 0.1 },
                { item: 'clue_scroll_medium', qty: 1, chance: 0.03 },
            ],
            respawnTime: 35,
            xpReward: { attack: 35, strength: 35, defence: 35, hitpoints: 15 },
        },
        giant_crab: {
            name: 'Giant Crab', hp: 18, combatLevel: 12,
            attackLevel: 8, strengthLevel: 10, defenceLevel: 15,
            attackSpeed: 5, aggroRange: 0, wanderRadius: 3, moveSpeed: 1,
            lootTable: [
                { item: 'raw_lobster', qty: 1, chance: 0.6 },
                { item: 'coins', qty: 20, chance: 0.8 },
                { item: 'bones', qty: 1, chance: 1.0 },
            ],
            respawnTime: 30,
            xpReward: { attack: 25, strength: 25, defence: 25, hitpoints: 10 },
        },
        fire_elemental: {
            name: 'Fire Elemental', hp: 35, combatLevel: 28,
            attackLevel: 18, strengthLevel: 20, defenceLevel: 14,
            attackSpeed: 3, aggroRange: 6, wanderRadius: 4, moveSpeed: 1.5,
            attackType: 'magic',
            lootTable: [
                { item: 'fire_rune', qty: 15, chance: 0.8 },
                { item: 'obsidian_ore', qty: 1, chance: 0.4 },
                { item: 'coins', qty: 40, chance: 0.7 },
                { item: 'clue_scroll_medium', qty: 1, chance: 0.03 },
            ],
            respawnTime: 40,
            xpReward: { attack: 55, strength: 55, defence: 55, hitpoints: 25 },
        },
        desert_guard: {
            name: 'Desert Guard', hp: 25, combatLevel: 20,
            attackLevel: 14, strengthLevel: 13, defenceLevel: 12,
            attackSpeed: 4, aggroRange: 0, wanderRadius: 4, moveSpeed: 1.2,
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 30, chance: 0.7 },
                { item: 'steel_sword', qty: 1, chance: 0.1 },
                { item: 'palm_logs', qty: 1, chance: 0.15 },
            ],
            respawnTime: 35,
            xpReward: { attack: 35, strength: 35, defence: 35, hitpoints: 15 },
        },
        sea_serpent: {
            name: 'Sea Serpent', hp: 40, combatLevel: 30,
            attackLevel: 20, strengthLevel: 18, defenceLevel: 16,
            attackSpeed: 3, aggroRange: 7, wanderRadius: 3, moveSpeed: 1.5,
            attackType: 'magic',
            lootTable: [
                { item: 'water_rune', qty: 10, chance: 0.8 },
                { item: 'pearl', qty: 1, chance: 0.3 },
                { item: 'raw_lobster', qty: 2, chance: 0.5 },
                { item: 'coins', qty: 50, chance: 0.7 },
                { item: 'raw_seaweed', qty: 2, chance: 0.4 },
                { item: 'clue_scroll_hard', qty: 1, chance: 0.02 },
            ],
            respawnTime: 45,
            xpReward: { attack: 65, strength: 65, defence: 65, hitpoints: 30 },
        },
    },

    ITEMS: {
        // Resources
        logs:           { name: 'Logs',            stackable: false, icon: '🪵', fmLevel: 1, fmXP: 40 },
        oak_logs:       { name: 'Oak logs',        stackable: false, icon: '🪵', fmLevel: 15, fmXP: 60 },
        willow_logs:    { name: 'Willow logs',     stackable: false, icon: '🪵', fmLevel: 30, fmXP: 90 },
        copper_ore:     { name: 'Copper ore',      stackable: false, icon: '🪨' },
        tin_ore:        { name: 'Tin ore',         stackable: false, icon: '🪨' },
        iron_ore:       { name: 'Iron ore',        stackable: false, icon: '🪨' },
        coal:           { name: 'Coal',            stackable: false, icon: '⬛' },
        mithril_ore:    { name: 'Mithril ore',     stackable: false, icon: '🪨' },
        adamantite_ore: { name: 'Adamantite ore',  stackable: false, icon: '🪨' },
        runite_ore:     { name: 'Runite ore',      stackable: false, icon: '🪨' },
        bronze_bar:     { name: 'Bronze bar',      stackable: false, icon: '🟫' },
        iron_bar:       { name: 'Iron bar',        stackable: false, icon: '⬜' },
        steel_bar:      { name: 'Steel bar',       stackable: false, icon: '🔲' },
        mithril_bar:    { name: 'Mithril bar',     stackable: false, icon: '🔵' },
        adamant_bar:    { name: 'Adamant bar',     stackable: false, icon: '🟢' },
        rune_bar:       { name: 'Rune bar',        stackable: false, icon: '🔷' },
        // Bones
        bones:          { name: 'Bones',           stackable: false, icon: '🦴', prayerXP: 4.5 },
        dragon_bones:   { name: 'Dragon bones',    stackable: false, icon: '🦴', prayerXP: 72 },
        // Food
        raw_chicken:    { name: 'Raw chicken',     stackable: false, icon: '🍗', cookable: true, cookedItem: 'cooked_chicken', cookLevel: 1, cookXP: 30, burnChance: 0.4 },
        cooked_chicken: { name: 'Cooked chicken',  stackable: false, icon: '🍖', heals: 3 },
        raw_shrimp:     { name: 'Raw shrimps',     stackable: false, icon: '🦐', cookable: true, cookedItem: 'cooked_shrimp', cookLevel: 1, cookXP: 15, burnChance: 0.5 },
        cooked_shrimp:  { name: 'Cooked shrimps',  stackable: false, icon: '🍤', heals: 2 },
        raw_beef:       { name: 'Raw beef',        stackable: false, icon: '🥩', cookable: true, cookedItem: 'cooked_beef', cookLevel: 1, cookXP: 30, burnChance: 0.35 },
        cooked_beef:    { name: 'Cooked beef',     stackable: false, icon: '🍖', heals: 4 },
        raw_trout:      { name: 'Raw trout',        stackable: false, icon: '🐟', cookable: true, cookedItem: 'cooked_trout', cookLevel: 15, cookXP: 70, burnChance: 0.3 },
        cooked_trout:   { name: 'Cooked trout',     stackable: false, icon: '🐟', heals: 7 },
        raw_lobster:    { name: 'Raw lobster',       stackable: false, icon: '🦞', cookable: true, cookedItem: 'cooked_lobster', cookLevel: 40, cookXP: 120, burnChance: 0.25 },
        cooked_lobster: { name: 'Cooked lobster',    stackable: false, icon: '🦞', heals: 12 },
        burnt_food:     { name: 'Burnt food',      stackable: false, icon: '⬛' },
        // Herblore
        herb:           { name: 'Herb',              stackable: true,  icon: '🌿' },
        vial:           { name: 'Vial of water',     stackable: true,  icon: '🧪' },
        attack_potion:  { name: 'Attack potion',     stackable: false, icon: '⚗️', potion: true, potionEffect: 'attack', potionBoost: 3, potionDuration: 60 },
        strength_potion:{ name: 'Strength potion',   stackable: false, icon: '⚗️', potion: true, potionEffect: 'strength', potionBoost: 3, potionDuration: 60 },
        defence_potion: { name: 'Defence potion',    stackable: false, icon: '⚗️', potion: true, potionEffect: 'defence', potionBoost: 3, potionDuration: 60 },
        stamina_potion: { name: 'Stamina potion',   stackable: false, icon: '⚗️', potion: true, potionEffect: 'stamina', staminaRestore: 40, potionDuration: 120 },
        antipoison:     { name: 'Antipoison',       stackable: false, icon: '⚗️', potion: true, potionEffect: 'antipoison', antipoisonDuration: 90 },
        // Misc
        feather:        { name: 'Feather',         stackable: true,  icon: '🪶' },
        coins:          { name: 'Coins',           stackable: true,  icon: '🪙' },
        cowhide:        { name: 'Cowhide',         stackable: false, icon: '🟤' },
        wool:           { name: 'Wool',            stackable: false, icon: '🐑' },
        tinderbox:      { name: 'Tinderbox',       stackable: false, icon: '🔥' },
        // Runes
        air_rune:       { name: 'Air rune',        stackable: true,  icon: '💨' },
        fire_rune:      { name: 'Fire rune',       stackable: true,  icon: '🔥' },
        water_rune:     { name: 'Water rune',      stackable: true,  icon: '💧' },
        earth_rune:     { name: 'Earth rune',      stackable: true,  icon: '🟤' },
        mind_rune:      { name: 'Mind rune',       stackable: true,  icon: '🧠' },
        chaos_rune:     { name: 'Chaos rune',      stackable: true,  icon: '🌀' },
        rune_essence:   { name: 'Rune essence',    stackable: false, icon: '💎' },
        // Ranged
        bronze_arrow:   { name: 'Bronze arrow',    stackable: true,  icon: '➡️', rangedStrength: 2, arrowTier: 1 },
        iron_arrow:     { name: 'Iron arrow',      stackable: true,  icon: '➡️', rangedStrength: 4, arrowTier: 1 },
        steel_arrow:    { name: 'Steel arrow',     stackable: true,  icon: '➡️', rangedStrength: 6, arrowTier: 2 },
        shortbow:       { name: 'Shortbow',        stackable: false, icon: '🏹', equipSlot: 'weapon', attackBonus: 0, strengthBonus: 0, defenceBonus: 0, rangedBonus: 6, attackStyle: 'ranged', bowTier: 1, rangedReq: 1 },
        oak_shortbow:   { name: 'Oak shortbow',    stackable: false, icon: '🏹', equipSlot: 'weapon', attackBonus: 0, strengthBonus: 0, defenceBonus: 0, rangedBonus: 14, attackStyle: 'ranged', bowTier: 2, rangedReq: 20 },
        knife:          { name: 'Knife',           stackable: false, icon: '🔪' },
        demons_bane:    { name: "Demon's Bane",    stackable: false, icon: '🗡️', equipSlot: 'weapon', attackBonus: 35, strengthBonus: 30, defenceBonus: 5, attackReq: 40 },
        lantern:        { name: 'Lantern',         stackable: false, icon: '🏮' },
        // Clue scrolls
        clue_scroll_easy:   { name: 'Clue scroll (easy)',   stackable: false, icon: '📜', clue: 'easy' },
        clue_scroll_medium: { name: 'Clue scroll (medium)', stackable: false, icon: '📜', clue: 'medium' },
        clue_scroll_hard:   { name: 'Clue scroll (hard)',   stackable: false, icon: '📜', clue: 'hard' },
        // Cosmetics (clue rewards)
        fancy_hat:      { name: 'Fancy hat',       stackable: false, icon: '🎩', equipSlot: 'head', attackBonus: 0, strengthBonus: 0, defenceBonus: 0 },
        golden_boots:   { name: 'Golden boots',    stackable: false, icon: '👢', equipSlot: 'feet', attackBonus: 0, strengthBonus: 0, defenceBonus: 0 },
        team_cape:      { name: 'Team cape',       stackable: false, icon: '🧣', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 0 },
        // Pets (inventory items)
        pet_rock_golem: { name: 'Rock Golem',      stackable: false, icon: '🪨', pet: 'rock_golem' },
        pet_beaver:     { name: 'Beaver',           stackable: false, icon: '🦫', pet: 'beaver' },
        pet_heron:      { name: 'Heron',            stackable: false, icon: '🐦', pet: 'heron' },
        pet_phoenix:    { name: 'Phoenix',          stackable: false, icon: '🔥', pet: 'phoenix' },
        pet_rocky:      { name: 'Rocky',            stackable: false, icon: '🦝', pet: 'rocky' },
        pet_kbd_jr:     { name: 'KBD Jr.',          stackable: false, icon: '🐉', pet: 'kbd_jr' },
        pet_demon_jr:   { name: 'Demon Jr.',        stackable: false, icon: '👹', pet: 'demon_jr' },
        pet_bloodhound: { name: 'Bloodhound',      stackable: false, icon: '🐕', pet: 'bloodhound' },
        // Equipment — Bronze
        goblin_mail:    { name: 'Goblin mail',     stackable: false, icon: '🛡️', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 2 },
        bronze_dagger:  { name: 'Bronze dagger',   stackable: false, icon: '🔪', equipSlot: 'weapon', attackBonus: 2, strengthBonus: 1, defenceBonus: 0, attackReq: 1 },
        bronze_mace:    { name: 'Bronze mace',     stackable: false, icon: '🔨', equipSlot: 'weapon', attackBonus: 3, strengthBonus: 3, defenceBonus: 0, attackReq: 1 },
        bronze_sword:   { name: 'Bronze sword',    stackable: false, icon: '🗡️', equipSlot: 'weapon', attackBonus: 4, strengthBonus: 3, defenceBonus: 0, attackReq: 1 },
        bronze_helm:    { name: 'Bronze full helm', stackable: false, icon: '⛑️', equipSlot: 'head', attackBonus: 0, strengthBonus: 0, defenceBonus: 3, defenceReq: 1 },
        bronze_shield:  { name: 'Bronze shield',   stackable: false, icon: '🛡️', equipSlot: 'shield', attackBonus: 0, strengthBonus: 0, defenceBonus: 4, defenceReq: 1 },
        bronze_chainbody:{ name: 'Bronze chainbody', stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 4, defenceReq: 1 },
        bronze_platebody:{ name: 'Bronze platebody', stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 7, defenceReq: 1 },
        bronze_legs:    { name: 'Bronze platelegs', stackable: false, icon: '👖', equipSlot: 'legs', attackBonus: 0, strengthBonus: 0, defenceBonus: 4, defenceReq: 1 },
        // Equipment — Iron (level 10)
        iron_dagger:    { name: 'Iron dagger',     stackable: false, icon: '🔪', equipSlot: 'weapon', attackBonus: 5, strengthBonus: 3, defenceBonus: 0, attackReq: 10 },
        iron_mace:      { name: 'Iron mace',       stackable: false, icon: '🔨', equipSlot: 'weapon', attackBonus: 6, strengthBonus: 6, defenceBonus: 0, attackReq: 10 },
        iron_sword:     { name: 'Iron sword',      stackable: false, icon: '⚔️', equipSlot: 'weapon', attackBonus: 8, strengthBonus: 6, defenceBonus: 0, attackReq: 10 },
        iron_helm:      { name: 'Iron full helm',  stackable: false, icon: '⛑️', equipSlot: 'head', attackBonus: 0, strengthBonus: 0, defenceBonus: 5, defenceReq: 10 },
        iron_shield:    { name: 'Iron shield',     stackable: false, icon: '🛡️', equipSlot: 'shield', attackBonus: 0, strengthBonus: 0, defenceBonus: 6, defenceReq: 10 },
        iron_chainbody: { name: 'Iron chainbody',  stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 8, defenceReq: 10 },
        iron_platebody: { name: 'Iron platebody',  stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 11, defenceReq: 10 },
        iron_legs:      { name: 'Iron platelegs',  stackable: false, icon: '👖', equipSlot: 'legs', attackBonus: 0, strengthBonus: 0, defenceBonus: 6, defenceReq: 10 },
        // Equipment — Steel (level 20)
        steel_dagger:   { name: 'Steel dagger',    stackable: false, icon: '🔪', equipSlot: 'weapon', attackBonus: 8, strengthBonus: 5, defenceBonus: 0, attackReq: 20 },
        steel_mace:     { name: 'Steel mace',      stackable: false, icon: '🔨', equipSlot: 'weapon', attackBonus: 9, strengthBonus: 9, defenceBonus: 0, attackReq: 20 },
        steel_sword:    { name: 'Steel sword',     stackable: false, icon: '⚔️', equipSlot: 'weapon', attackBonus: 12, strengthBonus: 10, defenceBonus: 0, attackReq: 20 },
        steel_helm:     { name: 'Steel full helm',  stackable: false, icon: '⛑️', equipSlot: 'head', attackBonus: 0, strengthBonus: 0, defenceBonus: 7, defenceReq: 20 },
        steel_shield:   { name: 'Steel shield',    stackable: false, icon: '🛡️', equipSlot: 'shield', attackBonus: 0, strengthBonus: 0, defenceBonus: 9, defenceReq: 20 },
        steel_chainbody:{ name: 'Steel chainbody',  stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 11, defenceReq: 20 },
        steel_platebody:{ name: 'Steel platebody',  stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 14, defenceReq: 20 },
        steel_legs:     { name: 'Steel platelegs',  stackable: false, icon: '👖', equipSlot: 'legs', attackBonus: 0, strengthBonus: 0, defenceBonus: 9, defenceReq: 20 },
        // Equipment — Mithril (level 30)
        mithril_dagger:   { name: 'Mithril dagger',    stackable: false, icon: '🔪', equipSlot: 'weapon', attackBonus: 12, strengthBonus: 7,  defenceBonus: 0, attackReq: 30 },
        mithril_mace:     { name: 'Mithril mace',      stackable: false, icon: '🔨', equipSlot: 'weapon', attackBonus: 14, strengthBonus: 13, defenceBonus: 0, attackReq: 30 },
        mithril_sword:    { name: 'Mithril sword',     stackable: false, icon: '⚔️', equipSlot: 'weapon', attackBonus: 18, strengthBonus: 15, defenceBonus: 0, attackReq: 30 },
        mithril_helm:     { name: 'Mithril full helm',  stackable: false, icon: '⛑️', equipSlot: 'head', attackBonus: 0, strengthBonus: 0, defenceBonus: 11, defenceReq: 30 },
        mithril_shield:   { name: 'Mithril shield',    stackable: false, icon: '🛡️', equipSlot: 'shield', attackBonus: 0, strengthBonus: 0, defenceBonus: 13, defenceReq: 30 },
        mithril_chainbody:{ name: 'Mithril chainbody',  stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 16, defenceReq: 30 },
        mithril_platebody:{ name: 'Mithril platebody',  stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 21, defenceReq: 30 },
        mithril_legs:     { name: 'Mithril platelegs',  stackable: false, icon: '👖', equipSlot: 'legs', attackBonus: 0, strengthBonus: 0, defenceBonus: 13, defenceReq: 30 },
        // Equipment — Adamant (level 40)
        adamant_dagger:   { name: 'Adamant dagger',    stackable: false, icon: '🔪', equipSlot: 'weapon', attackBonus: 18, strengthBonus: 10, defenceBonus: 0, attackReq: 40 },
        adamant_mace:     { name: 'Adamant mace',      stackable: false, icon: '🔨', equipSlot: 'weapon', attackBonus: 21, strengthBonus: 19, defenceBonus: 0, attackReq: 40 },
        adamant_sword:    { name: 'Adamant sword',     stackable: false, icon: '⚔️', equipSlot: 'weapon', attackBonus: 27, strengthBonus: 22, defenceBonus: 0, attackReq: 40 },
        adamant_helm:     { name: 'Adamant full helm',  stackable: false, icon: '⛑️', equipSlot: 'head', attackBonus: 0, strengthBonus: 0, defenceBonus: 16, defenceReq: 40 },
        adamant_shield:   { name: 'Adamant shield',    stackable: false, icon: '🛡️', equipSlot: 'shield', attackBonus: 0, strengthBonus: 0, defenceBonus: 19, defenceReq: 40 },
        adamant_chainbody:{ name: 'Adamant chainbody',  stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 24, defenceReq: 40 },
        adamant_platebody:{ name: 'Adamant platebody',  stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 31, defenceReq: 40 },
        adamant_legs:     { name: 'Adamant platelegs',  stackable: false, icon: '👖', equipSlot: 'legs', attackBonus: 0, strengthBonus: 0, defenceBonus: 19, defenceReq: 40 },
        // Equipment — Rune (level 50)
        rune_dagger:      { name: 'Rune dagger',       stackable: false, icon: '🔪', equipSlot: 'weapon', attackBonus: 26, strengthBonus: 14, defenceBonus: 0, attackReq: 50 },
        rune_mace:        { name: 'Rune mace',         stackable: false, icon: '🔨', equipSlot: 'weapon', attackBonus: 31, strengthBonus: 28, defenceBonus: 0, attackReq: 50 },
        rune_sword:       { name: 'Rune sword',        stackable: false, icon: '⚔️', equipSlot: 'weapon', attackBonus: 40, strengthBonus: 33, defenceBonus: 0, attackReq: 50 },
        rune_helm:        { name: 'Rune full helm',     stackable: false, icon: '⛑️', equipSlot: 'head', attackBonus: 0, strengthBonus: 0, defenceBonus: 24, defenceReq: 50 },
        rune_shield:      { name: 'Rune shield',       stackable: false, icon: '🛡️', equipSlot: 'shield', attackBonus: 0, strengthBonus: 0, defenceBonus: 29, defenceReq: 50 },
        rune_chainbody:   { name: 'Rune chainbody',     stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 36, defenceReq: 50 },
        rune_platebody:   { name: 'Rune platebody',     stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 46, defenceReq: 50 },
        rune_legs:        { name: 'Rune platelegs',     stackable: false, icon: '👖', equipSlot: 'legs', attackBonus: 0, strengthBonus: 0, defenceBonus: 29, defenceReq: 50 },
        // Other equipment
        leather_boots:  { name: 'Leather boots',   stackable: false, icon: '👢', equipSlot: 'feet', attackBonus: 0, strengthBonus: 0, defenceBonus: 1 },
        // Staff
        staff_of_air:   { name: 'Staff of air',    stackable: false, icon: '🪄', equipSlot: 'weapon', attackBonus: 2, strengthBonus: 2, defenceBonus: 2, magicBonus: 10, attackStyle: 'magic', providesRune: 'air_rune', magicReq: 1 },
        // Quest items
        desert_artifact_shard: { name: 'Artifact Shard', stackable: true, icon: '🔶', examine: 'A piece of an ancient artifact.', value: 150 },
        ancient_artifact: { name: 'Ancient Artifact', stackable: false, icon: '🏺', examine: 'A reassembled ancient artifact, pulsing with energy.', value: 500 },
        cursed_artifact: { name: 'Cursed Artifact', stackable: false, icon: '🏺', examine: 'The artifact is tainted with dark energy.', value: 0 },
        purification_potion: { name: 'Purification Potion', stackable: false, icon: '⚗️', examine: 'A holy potion that can cleanse dark energy.', value: 200 },
        blessed_artifact: { name: 'Blessed Artifact', stackable: false, icon: '✨', examine: 'A purified artifact radiating holy light.', value: 1000 },
        dark_artifact: { name: 'Dark Artifact', stackable: false, icon: '🖤', examine: 'An artifact infused with dark power.', value: 1000 },
        moonflower: { name: 'Moonflower', stackable: false, icon: '🌸', examine: 'A rare flower that blooms only under moonlight.', value: 300 },
        witchs_amulet: { name: "Witch's Amulet", stackable: false, icon: '📿', examine: 'An enchanted amulet gifted by the swamp witch.', value: 500 },
        // Batch 6 — new biome items
        obsidian_ore:   { name: 'Obsidian ore',    stackable: false, icon: '🪨' },
        palm_logs:      { name: 'Palm logs',       stackable: false, icon: '🪵', fmLevel: 35, fmXP: 70 },
        pearl:          { name: 'Pearl',           stackable: true,  icon: '🔮' },
        raw_seaweed:    { name: 'Raw seaweed',     stackable: true,  icon: '🌿' },
    },

    EQUIPMENT_SLOTS: ['weapon', 'shield', 'body', 'legs', 'feet', 'head'],

    FISHING: {
        shrimp:  { name: 'Shrimp',  requiredLevel: 1,  xpPerCatch: 10,  yieldItem: 'raw_shrimp',   successChance: 0.25 },
        trout:   { name: 'Trout',   requiredLevel: 20, xpPerCatch: 50,  yieldItem: 'raw_trout',    successChance: 0.15 },
        lobster: { name: 'Lobster', requiredLevel: 40, xpPerCatch: 90,  yieldItem: 'raw_lobster',  successChance: 0.10 },
    },

    SMITHING: {
        smelting: {
            bronze_bar: { ores: { copper_ore: 1, tin_ore: 1 }, level: 1, xp: 6 },
            iron_bar:   { ores: { iron_ore: 1 }, level: 15, xp: 12.5 },
            steel_bar:   { ores: { iron_ore: 1, coal: 2 }, level: 30, xp: 17.5 },
            mithril_bar: { ores: { mithril_ore: 1, coal: 4 }, level: 50, xp: 30 },
            adamant_bar: { ores: { adamantite_ore: 1, coal: 6 }, level: 70, xp: 37.5 },
            rune_bar:    { ores: { runite_ore: 1, coal: 8 }, level: 85, xp: 50 },
        },
        anvil: {
            // Bronze tier (bars=1-5, levels 1-8)
            bronze_dagger:   { bar: 'bronze_bar', qty: 1, level: 1, xp: 12,  category: 'weapon' },
            bronze_mace:     { bar: 'bronze_bar', qty: 1, level: 2, xp: 12,  category: 'weapon' },
            bronze_sword:    { bar: 'bronze_bar', qty: 1, level: 4, xp: 12,  category: 'weapon' },
            bronze_helm:     { bar: 'bronze_bar', qty: 1, level: 5, xp: 12,  category: 'armour' },
            bronze_shield:   { bar: 'bronze_bar', qty: 2, level: 6, xp: 25,  category: 'armour' },
            bronze_chainbody:{ bar: 'bronze_bar', qty: 3, level: 6, xp: 37,  category: 'armour' },
            bronze_legs:     { bar: 'bronze_bar', qty: 3, level: 7, xp: 37,  category: 'armour' },
            bronze_platebody:{ bar: 'bronze_bar', qty: 5, level: 8, xp: 62,  category: 'armour' },
            // Iron tier (bars=1-5, levels 15-23)
            iron_dagger:     { bar: 'iron_bar', qty: 1, level: 15, xp: 25,  category: 'weapon' },
            iron_mace:       { bar: 'iron_bar', qty: 1, level: 16, xp: 25,  category: 'weapon' },
            iron_sword:      { bar: 'iron_bar', qty: 1, level: 19, xp: 25,  category: 'weapon' },
            iron_helm:       { bar: 'iron_bar', qty: 1, level: 18, xp: 25,  category: 'armour' },
            iron_shield:     { bar: 'iron_bar', qty: 2, level: 19, xp: 50,  category: 'armour' },
            iron_chainbody:  { bar: 'iron_bar', qty: 3, level: 21, xp: 75,  category: 'armour' },
            iron_legs:       { bar: 'iron_bar', qty: 3, level: 22, xp: 75,  category: 'armour' },
            iron_platebody:  { bar: 'iron_bar', qty: 5, level: 23, xp: 125, category: 'armour' },
            // Steel tier (bars=1-5, levels 30-38)
            steel_dagger:    { bar: 'steel_bar', qty: 1, level: 30, xp: 37,  category: 'weapon' },
            steel_mace:      { bar: 'steel_bar', qty: 1, level: 31, xp: 37,  category: 'weapon' },
            steel_sword:     { bar: 'steel_bar', qty: 1, level: 34, xp: 37,  category: 'weapon' },
            steel_helm:      { bar: 'steel_bar', qty: 1, level: 33, xp: 37,  category: 'armour' },
            steel_shield:    { bar: 'steel_bar', qty: 2, level: 34, xp: 75,  category: 'armour' },
            steel_chainbody: { bar: 'steel_bar', qty: 3, level: 36, xp: 112, category: 'armour' },
            steel_legs:      { bar: 'steel_bar', qty: 3, level: 37, xp: 112, category: 'armour' },
            steel_platebody: { bar: 'steel_bar', qty: 5, level: 38, xp: 187, category: 'armour' },
            // Mithril
            mithril_dagger:    { bar: 'mithril_bar', qty: 1, level: 50, xp: 50,  category: 'weapon' },
            mithril_mace:      { bar: 'mithril_bar', qty: 1, level: 51, xp: 50,  category: 'weapon' },
            mithril_sword:     { bar: 'mithril_bar', qty: 1, level: 54, xp: 50,  category: 'weapon' },
            mithril_helm:      { bar: 'mithril_bar', qty: 1, level: 53, xp: 50,  category: 'armour' },
            mithril_shield:    { bar: 'mithril_bar', qty: 2, level: 54, xp: 100, category: 'armour' },
            mithril_chainbody: { bar: 'mithril_bar', qty: 3, level: 56, xp: 150, category: 'armour' },
            mithril_legs:      { bar: 'mithril_bar', qty: 3, level: 57, xp: 150, category: 'armour' },
            mithril_platebody: { bar: 'mithril_bar', qty: 5, level: 58, xp: 250, category: 'armour' },
            // Adamant
            adamant_dagger:    { bar: 'adamant_bar', qty: 1, level: 70, xp: 62,  category: 'weapon' },
            adamant_mace:      { bar: 'adamant_bar', qty: 1, level: 71, xp: 62,  category: 'weapon' },
            adamant_sword:     { bar: 'adamant_bar', qty: 1, level: 74, xp: 62,  category: 'weapon' },
            adamant_helm:      { bar: 'adamant_bar', qty: 1, level: 73, xp: 62,  category: 'armour' },
            adamant_shield:    { bar: 'adamant_bar', qty: 2, level: 74, xp: 125, category: 'armour' },
            adamant_chainbody: { bar: 'adamant_bar', qty: 3, level: 76, xp: 187, category: 'armour' },
            adamant_legs:      { bar: 'adamant_bar', qty: 3, level: 77, xp: 187, category: 'armour' },
            adamant_platebody: { bar: 'adamant_bar', qty: 5, level: 78, xp: 312, category: 'armour' },
            // Rune
            rune_dagger:    { bar: 'rune_bar', qty: 1, level: 85, xp: 75,  category: 'weapon' },
            rune_mace:      { bar: 'rune_bar', qty: 1, level: 86, xp: 75,  category: 'weapon' },
            rune_sword:     { bar: 'rune_bar', qty: 1, level: 89, xp: 75,  category: 'weapon' },
            rune_helm:      { bar: 'rune_bar', qty: 1, level: 88, xp: 75,  category: 'armour' },
            rune_shield:    { bar: 'rune_bar', qty: 2, level: 89, xp: 150, category: 'armour' },
            rune_chainbody: { bar: 'rune_bar', qty: 3, level: 91, xp: 225, category: 'armour' },
            rune_legs:      { bar: 'rune_bar', qty: 3, level: 92, xp: 225, category: 'armour' },
            rune_platebody: { bar: 'rune_bar', qty: 5, level: 93, xp: 375, category: 'armour' },
        },
    },

    RUNECRAFTING: {
        air_rune:   { essence: 1, level: 1, xp: 5, multiplierLevel: 11 },
        mind_rune:  { essence: 1, level: 2, xp: 5.5, multiplierLevel: 14 },
        water_rune: { essence: 1, level: 5, xp: 6, multiplierLevel: 19 },
        earth_rune: { essence: 1, level: 9, xp: 6.5, multiplierLevel: 26 },
        fire_rune:  { essence: 1, level: 14, xp: 7, multiplierLevel: 35 },
        chaos_rune: { essence: 1, level: 35, xp: 8.5, multiplierLevel: 74 },
    },

    THIEVING: {
        guide:    { npcId: 'guide',   name: 'Lumbridge Guide', requiredLevel: 1,  xp: 8,   stunTicks: 5, successBase: 0.40, loot: [{ item: 'coins', qty: 3 }] },
        general:  { npcId: 'general', name: 'Shopkeeper',      requiredLevel: 10, xp: 16,  stunTicks: 5, successBase: 0.35, loot: [{ item: 'coins', qty: 10 }] },
        banker:   { npcId: 'banker',  name: 'Banker',          requiredLevel: 25, xp: 30,  stunTicks: 6, successBase: 0.25, loot: [{ item: 'coins', qty: 25 }] },
        fred:     { npcId: 'fred',    name: 'Fred the Farmer', requiredLevel: 15, xp: 20,  stunTicks: 5, successBase: 0.30, loot: [{ item: 'coins', qty: 12 }, { item: 'wool', qty: 1 }] },
    },

    HERBLORE: {
        attack_potion:   { name: 'Attack potion',   herb: 1, vial: 1, level: 3,  xp: 25 },
        strength_potion: { name: 'Strength potion',  herb: 2, vial: 1, level: 12, xp: 50 },
        defence_potion:  { name: 'Defence potion',   herb: 3, vial: 1, level: 20, xp: 75 },
        stamina_potion:  { name: 'Stamina potion',   herb: 2, vial: 1, level: 25, xp: 60 },
        antipoison:      { name: 'Antipoison',       herb: 1, vial: 1, level: 5,  xp: 20 },
    },

    FLETCHING: {
        bronze_arrow: { name: 'Bronze arrows',  logs: 'logs',        feathers: 15, qty: 15, level: 1,  xp: 5  },
        shortbow:     { name: 'Shortbow',       logs: 'logs',        feathers: 0,  qty: 1,  level: 5,  xp: 10 },
        iron_arrow:   { name: 'Iron arrows',    logs: 'oak_logs',    feathers: 15, qty: 15, level: 20, xp: 10 },
        oak_shortbow: { name: 'Oak shortbow',   logs: 'oak_logs',    feathers: 0,  qty: 1,  level: 25, xp: 25 },
        steel_arrow:  { name: 'Steel arrows',   logs: 'willow_logs', feathers: 15, qty: 15, level: 40, xp: 15 },
    },

    SPECIAL_ATTACKS: {
        dagger:  { name: 'Double Strike', energyCost: 25, description: 'Hit twice in one attack' },
        sword:   { name: 'Accuracy Boost', energyCost: 30, description: '+50% accuracy for this hit' },
        mace:    { name: 'Defence Drain', energyCost: 35, description: 'Drain enemy defence by 3' },
    },

    SPELLS: {
        wind_strike:  { name: 'Wind Strike',  level: 1,  runes: { air_rune: 1, mind_rune: 1 }, maxHit: 2, xp: 5.5, icon: '💨' },
        water_strike: { name: 'Water Strike', level: 5,  runes: { water_rune: 1, air_rune: 1, mind_rune: 1 }, maxHit: 4, xp: 7.5, icon: '💧' },
        earth_strike: { name: 'Earth Strike', level: 9,  runes: { earth_rune: 2, mind_rune: 1 }, maxHit: 6, xp: 9.5, icon: '🪨' },
        fire_strike:  { name: 'Fire Strike',  level: 13, runes: { fire_rune: 3, air_rune: 2, mind_rune: 1 }, maxHit: 8, xp: 11.5, icon: '🔥' },
        fire_bolt:    { name: 'Fire Bolt',    level: 35, runes: { fire_rune: 5, chaos_rune: 1 }, maxHit: 12, xp: 22.5, icon: '☄️' },
        crumble_undead:{ name: 'Crumble Undead', level: 39, runes: { earth_rune: 3, chaos_rune: 1 }, maxHit: 15, xp: 24.5, icon: '💀', bonusVs: 'undead' },
        water_bolt:   { name: 'Water Bolt',   level: 47, runes: { water_rune: 3, chaos_rune: 1 }, maxHit: 14, xp: 28.5, icon: '🌊' },
        earth_bolt:   { name: 'Earth Bolt',   level: 53, runes: { earth_rune: 4, chaos_rune: 1 }, maxHit: 16, xp: 31.5, icon: '⛰️' },
        fire_blast:   { name: 'Fire Blast',   level: 59, runes: { fire_rune: 5, air_rune: 4, chaos_rune: 2 }, maxHit: 20, xp: 40.5, icon: '🔥' },
        wind_wave:    { name: 'Wind Wave',    level: 62, runes: { air_rune: 7, chaos_rune: 2 }, maxHit: 22, xp: 44, icon: '🌪️' },
    },

    PRAYERS: {
        thick_skin:      { name: 'Thick Skin',      level: 1,  drainRate: 1,  bonus: { defenceBonus: 5 }, icon: '🛡️' },
        burst_of_str:    { name: 'Burst of Strength', level: 4, drainRate: 1,  bonus: { strengthBonus: 5 }, icon: '💪' },
        clarity_of_thought:{ name: 'Clarity of Thought', level: 7, drainRate: 1, bonus: { attackBonus: 5 }, icon: '💡' },
        protect_melee:   { name: 'Protect from Melee', level: 43, drainRate: 3, protection: 'melee', icon: '🙏' },
        protect_ranged:  { name: 'Protect from Ranged', level: 40, drainRate: 3, protection: 'ranged', icon: '🏹' },
        protect_magic:   { name: 'Protect from Magic',  level: 37, drainRate: 3, protection: 'magic',  icon: '🔮' },
    },

    AGILITY_COURSE: {
        obstacles: [
            { name: 'Log Balance',    type: 'balance', x: 55, z: 55, length: 6, xp: 7 },
            { name: 'Obstacle Net',   type: 'climb',   x: 58, z: 62, xp: 8 },
            { name: 'Tree Branch',    type: 'balance', x: 62, z: 67, length: 4, xp: 5 },
            { name: 'Balancing Rope', type: 'balance', x: 66, z: 62, length: 5, xp: 7 },
            { name: 'Jump Gap',       type: 'jump',    x: 66, z: 55, xp: 5 },
        ],
        requiredLevel: 1,
        completionXP: 15,
    },

    SLAYER_TASKS: [
        { monster: 'chicken', minQty: 5, maxQty: 10, minCombat: 0, xpPer: 3 },
        { monster: 'cow', minQty: 5, maxQty: 10, minCombat: 0, xpPer: 8 },
        { monster: 'rat', minQty: 5, maxQty: 15, minCombat: 0, xpPer: 4 },
        { monster: 'goblin', minQty: 5, maxQty: 15, minCombat: 0, xpPer: 5 },
        { monster: 'skeleton', minQty: 5, maxQty: 12, minCombat: 5, xpPer: 12 },
        { monster: 'dark_wizard', minQty: 4, maxQty: 8, minCombat: 8, xpPer: 15 },
        { monster: 'giant_spider', minQty: 3, maxQty: 8, minCombat: 10, xpPer: 18 },
        { monster: 'lesser_demon', minQty: 3, maxQty: 6, minCombat: 15, xpPer: 30 },
        { monster: 'moss_giant', minQty: 4, maxQty: 8, minCombat: 12, xpPer: 20 },
        { monster: 'shadow_warrior', minQty: 3, maxQty: 6, minCombat: 20, xpPer: 35 },
    ],

    SHOP: {
        name: "Lumbridge General Store",
        stock: [
            { item: 'bronze_sword', price: 20, qty: 5 },
            { item: 'bronze_shield', price: 25, qty: 3 },
            { item: 'leather_boots', price: 10, qty: 5 },
            { item: 'shortbow', price: 50, qty: 3 },
            { item: 'bronze_arrow', price: 2, qty: 100 },
            { item: 'iron_arrow', price: 5, qty: 50 },
            { item: 'air_rune', price: 4, qty: 100 },
            { item: 'mind_rune', price: 5, qty: 100 },
            { item: 'water_rune', price: 4, qty: 50 },
            { item: 'earth_rune', price: 4, qty: 50 },
            { item: 'fire_rune', price: 4, qty: 50 },
            { item: 'staff_of_air', price: 200, qty: 1 },
            { item: 'rune_essence', price: 3, qty: 50 },
            { item: 'vial', price: 5, qty: 50 },
            { item: 'tinderbox', price: 1, qty: 10 },
            { item: 'knife', price: 5, qty: 5 },
            { item: 'steel_arrow', price: 10, qty: 30 },
            { item: 'chaos_rune', price: 15, qty: 30 },
        ],
    },

    SHOPS: {
        tavern: {
            name: "Blue Moon Inn - Food & Drink",
            stock: [
                { item: 'cooked_chicken', price: 8, qty: 10 },
                { item: 'cooked_beef', price: 12, qty: 10 },
                { item: 'cooked_trout', price: 25, qty: 5 },
                { item: 'cooked_lobster', price: 50, qty: 3 },
                { item: 'stamina_potion', price: 30, qty: 5 },
            ],
        },
        merchant: {
            name: "Wandering Merchant's Wares",
            stock: [
                { item: 'herb', price: 12, qty: 20 },
                { item: 'vial', price: 8, qty: 30 },
                { item: 'rune_essence', price: 5, qty: 50 },
                { item: 'feather', price: 3, qty: 50 },
                { item: 'antipoison', price: 40, qty: 3 },
            ],
        },
        desert_shop: {
            name: "Desert Bazaar",
            stock: [
                { item: 'cooked_lobster', price: 40, qty: 10 },
                { item: 'stamina_potion', price: 25, qty: 5 },
                { item: 'steel_platebody', price: 200, qty: 2 },
                { item: 'antipoison', price: 30, qty: 5 },
            ],
        },
    },

    ACHIEVEMENTS: [
        { id: 'first_kill',     name: 'First Blood',        desc: 'Defeat your first monster', icon: '⚔️' },
        { id: 'level_10',       name: 'Getting Stronger',   desc: 'Reach level 10 in any combat skill', icon: '💪' },
        { id: 'first_quest',    name: 'Quest Beginner',     desc: 'Complete your first quest', icon: '📜' },
        { id: 'cook_food',      name: "What's Cooking?",    desc: 'Cook your first food', icon: '🍳' },
        { id: 'first_smith',    name: 'Blacksmith',         desc: 'Smith your first item', icon: '🔨' },
        { id: 'first_prayer',   name: 'Faithful',           desc: 'Bury your first bones', icon: '✨' },
        { id: 'first_fire',     name: 'Pyromaniac',         desc: 'Light your first fire', icon: '🔥' },
        { id: 'enter_wildy',    name: 'Daredevil',          desc: 'Enter the Wilderness', icon: '☠️' },
        { id: 'kill_boss',      name: 'Dragon Slayer',      desc: 'Defeat the King Black Dragon', icon: '🐉' },
        { id: 'agility_lap',    name: 'Nimble',             desc: 'Complete an agility course lap', icon: '🏃' },
        { id: 'bank_10',        name: 'Hoarder',            desc: 'Store 10 different items in the bank', icon: '🏦' },
        { id: 'total_100',      name: 'Well Rounded',       desc: 'Reach a total level of 100', icon: '⭐' },
        { id: 'craft_runes',    name: 'Rune Crafter',       desc: 'Craft your first runes', icon: '🌀' },
        { id: 'slayer_task',    name: 'Slayer Initiate',    desc: 'Complete a Slayer task', icon: '💀' },
        { id: 'all_quests',     name: 'Questmaster',        desc: 'Complete all available quests', icon: '🏆' },
        { id: 'pet_owner',      name: 'Pet Owner',          desc: 'Acquire your first pet', icon: '🐾' },
        { id: 'pet_collector',  name: 'Pet Collector',      desc: 'Acquire 3 different pets', icon: '🏠' },
        { id: 'treasure_hunter',name: 'Treasure Hunter',    desc: 'Complete your first clue scroll', icon: '🗺️' },
        { id: 'master_sleuth',  name: 'Master Sleuth',      desc: 'Complete 10 clue scrolls', icon: '🔎' },
        { id: 'biome_explorer', name: 'Biome Explorer',     desc: 'Visit the desert, swamp, and ice regions', icon: '🌍' },
    ],

    SKILL_GUIDES: {
        attack:      [{ level: 1, unlock: 'Bronze weapons' }, { level: 5, unlock: 'Iron weapons' }, { level: 20, unlock: 'Steel weapons' }, { level: 30, unlock: 'Mithril weapons' }, { level: 40, unlock: 'Adamant weapons' }, { level: 50, unlock: 'Rune weapons' }],
        strength:    [{ level: 1, unlock: 'Max hit increases with level' }],
        defence:     [{ level: 1, unlock: 'Bronze armor' }, { level: 5, unlock: 'Iron armor' }, { level: 20, unlock: 'Steel armor' }, { level: 30, unlock: 'Mithril armor' }, { level: 40, unlock: 'Adamant armor' }, { level: 50, unlock: 'Rune armor' }],
        hitpoints:   [{ level: 10, unlock: 'Starting HP' }],
        ranged:      [{ level: 1, unlock: 'Shortbow + Bronze arrows' }, { level: 20, unlock: 'Iron arrows' }, { level: 25, unlock: 'Oak shortbow' }, { level: 40, unlock: 'Steel arrows' }],
        magic:       [{ level: 1, unlock: 'Wind Strike' }, { level: 5, unlock: 'Water Strike' }, { level: 9, unlock: 'Earth Strike' }, { level: 13, unlock: 'Fire Strike' }, { level: 35, unlock: 'Fire Bolt' }, { level: 39, unlock: 'Crumble Undead' }, { level: 47, unlock: 'Water Bolt' }, { level: 53, unlock: 'Earth Bolt' }, { level: 59, unlock: 'Fire Blast' }, { level: 62, unlock: 'Wind Wave' }],
        prayer:      [{ level: 1, unlock: 'Thick Skin (+5 Def)' }, { level: 4, unlock: 'Burst of Strength (+5 Str)' }, { level: 7, unlock: 'Clarity of Thought (+5 Atk)' }, { level: 43, unlock: 'Protect from Melee' }],
        woodcutting: [{ level: 1, unlock: 'Normal trees' }, { level: 15, unlock: 'Oak trees' }, { level: 30, unlock: 'Willow trees' }],
        mining:      [{ level: 1, unlock: 'Copper & Tin' }, { level: 15, unlock: 'Iron ore' }, { level: 30, unlock: 'Coal' }, { level: 55, unlock: 'Mithril ore' }, { level: 70, unlock: 'Adamantite ore' }, { level: 85, unlock: 'Runite ore' }],
        fishing:     [{ level: 1, unlock: 'Shrimps' }, { level: 20, unlock: 'Trout' }, { level: 40, unlock: 'Lobster' }],
        cooking:     [{ level: 1, unlock: 'Shrimps, Chicken, Beef' }],
        firemaking:  [{ level: 1, unlock: 'Normal logs' }, { level: 15, unlock: 'Oak logs' }, { level: 30, unlock: 'Willow logs' }],
        smithing:    [{ level: 1, unlock: 'Bronze bars & items' }, { level: 15, unlock: 'Iron bars & items' }, { level: 30, unlock: 'Steel bars & items' }, { level: 50, unlock: 'Mithril bars & items' }, { level: 70, unlock: 'Adamant bars & items' }, { level: 85, unlock: 'Rune bars & items' }],
        runecrafting:[{ level: 1, unlock: 'Air runes' }, { level: 2, unlock: 'Mind runes' }, { level: 5, unlock: 'Water runes' }, { level: 9, unlock: 'Earth runes' }, { level: 14, unlock: 'Fire runes' }, { level: 35, unlock: 'Chaos runes' }],
        agility:     [{ level: 1, unlock: 'Lumbridge agility course' }],
        slayer:      [{ level: 1, unlock: 'Slayer tasks from Turael' }],
        thieving:    [{ level: 1, unlock: 'Pickpocket Lumbridge Guide' }, { level: 10, unlock: 'Pickpocket Shopkeeper' }, { level: 15, unlock: 'Pickpocket Fred' }, { level: 25, unlock: 'Pickpocket Banker' }],
        herblore:    [{ level: 3, unlock: 'Attack potion' }, { level: 12, unlock: 'Strength potion' }, { level: 20, unlock: 'Defence potion' }],
        fletching:   [{ level: 1, unlock: 'Bronze arrows' }, { level: 5, unlock: 'Shortbow' }, { level: 20, unlock: 'Iron arrows' }, { level: 25, unlock: 'Oak shortbow' }, { level: 40, unlock: 'Steel arrows' }],
    },

    NPCS: {
        hans: {
            name: 'Hans', x: -2, z: -10,
            quest: 'cooks_assistant',
            dialogues: {
                quest_offer: [
                    { text: "Hello adventurer! The cook in the castle is in a terrible flap." },
                    { text: "He needs someone to help him gather ingredients for a feast. Could you bring him 3 cooked chicken?",
                      options: [
                        { label: "I'll help!", action: 'accept_quest', next: 2 },
                        { label: "Not right now.", next: undefined },
                      ]
                    },
                    { text: "Wonderful! Bring 3 cooked chicken to me when you're ready." },
                ],
                quest_progress: [{ text: "Have you got those 3 cooked chicken yet? The cook is getting impatient!" }],
                quest_turnin: [
                    { text: "You have the chicken! Excellent work, adventurer!",
                      options: [{ label: "Here you go.", action: 'turnin_quest', next: 1 }]
                    },
                    { text: "The cook will be so pleased. Here's your reward!" },
                ],
                quest_complete: [{ text: "Thanks again for your help! The feast was delicious." }],
                default: [{ text: "Hello there! Welcome to Lumbridge." }],
            },
        },
        guide: {
            name: 'Lumbridge Guide', x: 4, z: 0,
            quest: null,
            dialogues: {
                default: [
                    { text: "Welcome to FPScape! I'm the Lumbridge Guide." },
                    { text: "To the east you'll find trees for Woodcutting. Mining rocks are to the west." },
                    { text: "Chickens are north-east if you want to train combat, and there's a fishing spot at the pond." },
                    { text: "The bank is in Lumbridge castle. Use the furnace and anvil nearby for Smithing!" },
                    { text: "Visit the Slayer Master for combat tasks. Try the agility course to the far east!" },
                ],
            },
        },
        fred: {
            name: 'Fred the Farmer', x: 20, z: 32,
            quest: 'sheep_shearer',
            dialogues: {
                quest_offer: [
                    { text: "Oh dear, I need someone to shear my sheep!" },
                    { text: "Could you bring me 5 balls of wool? I'll pay you well.",
                      options: [
                        { label: "Sure, I'll help!", action: 'accept_quest', next: 2 },
                        { label: "Maybe later.", next: undefined },
                      ]
                    },
                    { text: "The sheep are in the field. Just click them to shear! Then spin the wool... actually, just bring me the wool as-is." },
                ],
                quest_progress: [{ text: "Have you got my 5 wool yet?" }],
                quest_turnin: [
                    { text: "Wonderful, you've got the wool!",
                      options: [{ label: "Here you go!", action: 'turnin_quest', next: 1 }]
                    },
                    { text: "Thank you so much! Here's your payment." },
                ],
                quest_complete: [{ text: "Thanks again for the wool!" }],
                default: [{ text: "Hello! I'm Fred the Farmer." }],
            },
        },
        general: {
            name: 'Shopkeeper', x: 10, z: -5,
            quest: null, shop: true,
            dialogues: {
                default: [
                    { text: "Welcome to the Lumbridge General Store!",
                      options: [
                        { label: "I'd like to trade.", action: 'open_shop' },
                        { label: "No thanks.", next: undefined },
                      ]
                    },
                ],
            },
        },
        banker: {
            name: 'Banker', x: 2, z: -18,
            quest: null, bank: true,
            dialogues: {
                default: [
                    { text: "Welcome to the Bank of Lumbridge. How can I help you?",
                      options: [
                        { label: "I'd like to access my bank.", action: 'open_bank' },
                        { label: "No thanks.", next: undefined },
                      ]
                    },
                ],
            },
        },
        turael: {
            name: 'Turael', x: -15, z: 10,
            quest: null, slayerMaster: true,
            dialogues: {
                default: [
                    { text: "I am Turael, Slayer Master of Lumbridge.",
                      options: [
                        { label: "I need a Slayer task.", action: 'assign_slayer' },
                        { label: "What's my current task?", action: 'check_slayer' },
                        { label: "Goodbye.", next: undefined },
                      ]
                    },
                ],
            },
        },
        gen_graam: {
            name: 'General Graam', x: -36, z: 6,
            quest: 'goblin_diplomacy',
            dialogues: {
                quest_offer: [
                    { text: "The goblins around here are fighting over what color armor to wear!" },
                    { text: "If you bring me 3 goblin mails, I can dye them and settle this dispute.",
                      options: [
                        { label: "I'll gather the armor.", action: 'accept_quest', next: 2 },
                        { label: "Not interested.", next: undefined },
                      ]
                    },
                    { text: "Good luck! The goblins can be stingy with their mail." },
                ],
                quest_progress: [{ text: "I still need 3 goblin mails to resolve the dispute." }],
                quest_turnin: [
                    { text: "You've got the goblin mails! Let me settle this once and for all.",
                      options: [{ label: "Here they are.", action: 'turnin_quest', next: 1 }]
                    },
                    { text: "Peace is restored! The goblins will wear orange. Here's your reward." },
                ],
                quest_complete: [{ text: "The goblins are happy in their orange armor. Thanks!" }],
                default: [{ text: "The goblins are always causing trouble around here." }],
            },
        },
        oziach: {
            name: 'Oziach', x: -10, z: -20,
            quest: 'dragon_slayer',
            dialogues: {
                quest_offer: [
                    { text: "So you think you're a true adventurer, eh?" },
                    { text: "Deep in the dungeon lurks the King Black Dragon. Slay it, and you'll earn your place among legends.",
                      options: [
                        { label: "I'll slay the dragon!", action: 'accept_quest', next: 2 },
                        { label: "That sounds too dangerous.", next: undefined },
                      ]
                    },
                    { text: "You'll need good armor and plenty of food. The KBD is in the deepest part of the dungeon. Good luck!" },
                ],
                quest_progress: [{ text: "Have you slain the King Black Dragon yet? It lurks deep in the dungeon." }],
                quest_turnin: [
                    { text: "By Saradomin, you actually did it! You slew the King Black Dragon!",
                      options: [{ label: "It is done.", action: 'turnin_quest', next: 1 }]
                    },
                    { text: "You are a true hero! Take this reward - you've earned it." },
                ],
                quest_complete: [{ text: "The legendary dragon slayer! Your name will be remembered." }],
                default: [{ text: "I sell rune platebodies to worthy adventurers." }],
            },
        },
        fishing_tutor: {
            name: 'Fishing Tutor', x: 23, z: 18,
            quest: 'fishermans_woe',
            dialogues: {
                default: [
                    { text: "Ahoy! I'm the Fishing Tutor. Looking to catch some fish?" },
                    { text: "At level 1 you can net shrimps from the fishing spots in the pond." },
                    { text: "At level 20 you can catch trout — they heal more and give better XP!" },
                    { text: "At level 40 you can fish lobsters. Those are a real prize!",
                      options: [
                        { label: "Thanks for the tips!", next: undefined },
                      ]
                    },
                ],
                quest_offer: [
                    { text: "Those blasted giant crabs keep scaring away all the fish!" },
                    { text: "Could you kill 4 of them for me? They're near the fishing spots to the east.", options: [
                        { label: "I'll handle them!", action: 'accept_quest', next: 2 },
                        { label: "Maybe later." }
                    ]},
                    { text: "Thank you! Those crabs have huge claws, so be careful." }
                ],
                quest_progress: [{ text: "Have you killed those giant crabs yet? I need 4 of them gone." }],
                quest_turnin: [
                    { text: "You killed all 4 giant crabs? Wonderful!" },
                    { text: "The fishing spots should be much safer now. Here's your reward!", options: [
                        { label: "Thanks!", action: 'turnin_quest' }
                    ]}
                ],
                quest_complete: [{ text: "The fishing is so much better now that those crabs are gone!" }],
            },
        },
        bartender: {
            name: 'Bartender', x: 25, z: -3,
            quest: null, shop: 'tavern',
            dialogues: {
                default: [
                    { text: "Welcome to the Blue Moon Inn! What can I get for you?",
                      options: [
                        { label: "I'd like to see the menu.", action: 'open_shop' },
                        { label: "Just browsing, thanks.", next: undefined },
                      ]
                    },
                ],
            },
        },
        merchant: {
            name: 'Wandering Merchant', x: 5, z: -2,
            quest: null, shop: 'merchant',
            wander: true,
            wanderWaypoints: [
                { x: 5, z: -2 },
                { x: 10, z: -5 },
                { x: 0, z: -15 },
                { x: -8, z: -3 },
                { x: 5, z: 5 },
            ],
            wanderSpeed: 1.5,
            wanderPause: 8,
            dialogues: {
                default: [
                    { text: "Greetings, adventurer! I travel far and wide to bring you exotic wares.",
                      options: [
                        { label: "Show me your wares.", action: 'open_shop' },
                        { label: "Where do you travel from?", next: 1 },
                        { label: "Goodbye.", next: undefined },
                      ]
                    },
                    { text: "I've journeyed across many lands — from Varrock to Falador. These herbs are the finest you'll find this side of the Wilderness!" },
                ],
            },
        },
        dungeon_guide: {
            name: 'Dungeon Guide', x: -43, z: -33,
            questChain: ['into_the_depths', 'shadow_purge', 'the_demon_lord'],
            dialogues: {
                quest_offer_into_the_depths: [
                    { text: "Brave adventurer! The dungeon beneath us holds terrible creatures." },
                    { text: "I need someone to clear the skeletons on the first floor. Kill 3 of them and I'll reward you.",
                      options: [
                        { label: "I'll do it!", action: 'accept_quest', next: 2 },
                        { label: "Not right now.", next: undefined },
                      ]
                    },
                    { text: "Excellent! Climb down the ladder behind me. Be careful in there." },
                ],
                quest_progress_into_the_depths: [{ text: "Have you dealt with those skeletons yet? Kill 3 on the first floor." }],
                quest_turnin_into_the_depths: [
                    { text: "You've slain the skeletons! Well done, adventurer.",
                      options: [{ label: "Here's my report.", action: 'turnin_quest', next: 1 }]
                    },
                    { text: "Take this lantern — you'll need it deeper in the dungeon." },
                ],
                quest_offer_shadow_purge: [
                    { text: "The second floor is overrun with Shadow Warriors — deadly fast fighters." },
                    { text: "Can you venture down and slay 2 of them?",
                      options: [
                        { label: "I'm ready.", action: 'accept_quest', next: 2 },
                        { label: "I need to prepare first.", next: undefined },
                      ]
                    },
                    { text: "Good luck. They strike fast, so bring food." },
                ],
                quest_progress_shadow_purge: [{ text: "Still hunting those Shadow Warriors? You need to kill 2 on floor 2." }],
                quest_turnin_shadow_purge: [
                    { text: "The Shadow Warriors are dealt with! Impressive work.",
                      options: [{ label: "It was tough.", action: 'turnin_quest', next: 1 }]
                    },
                    { text: "Take this adamant sword as a reward. But there's something worse below..." },
                ],
                quest_offer_the_demon_lord: [
                    { text: "On the deepest floor lurks a Demon Lord — a creature of immense power." },
                    { text: "If you can defeat it, you would be a true hero. Will you face the Demon Lord?",
                      options: [
                        { label: "I'll slay the beast!", action: 'accept_quest', next: 2 },
                        { label: "I'm not ready for that.", next: undefined },
                      ]
                    },
                    { text: "May the gods protect you. The Demon Lord awaits on floor 3." },
                ],
                quest_progress_the_demon_lord: [{ text: "The Demon Lord still lives? Descend to floor 3 and finish it!" }],
                quest_turnin_the_demon_lord: [
                    { text: "You... you actually defeated the Demon Lord?! Incredible!",
                      options: [{ label: "It's done.", action: 'turnin_quest', next: 1 }]
                    },
                    { text: "You are a legend! Take the Demon's Bane — forged from the beast's own essence." },
                ],
                quest_complete: [{ text: "You've conquered the entire dungeon. The land is safer thanks to you, hero." }],
                default: [{ text: "Beware the dungeon below. Dark creatures lurk within." }],
            },
        },
        swamp_witch: {
            name: 'Swamp Witch', x: -45, z: 35,
            questChain: ['swamp_thing', 'witchs_bargain_p1', 'witchs_bargain_p2'],
            dialogues: {
                quest_offer_swamp_thing: [
                    { text: "Heh heh... the frogs have grown too bold. They've been eating my herbs!" },
                    { text: "Kill 5 of those giant frogs and I'll brew you something nice.",
                      options: [
                        { label: "I'll deal with them.", action: 'accept_quest', next: 2 },
                        { label: "No thanks, witch.", next: undefined },
                      ]
                    },
                    { text: "Good... their bones will fuel my cauldron. Heh heh heh..." },
                ],
                quest_progress_swamp_thing: [{ text: "Still haven't killed 5 frogs? They're all around the swamp." }],
                quest_turnin_swamp_thing: [
                    { text: "The frogs are dealt with? Wonderful!",
                      options: [{ label: "They're gone.", action: 'turnin_quest', next: 1 }]
                    },
                    { text: "Here, take this potion. Brewed it myself. Heh heh..." },
                ],
                quest_offer_witchs_bargain_p1: [
                    { text: "You've proven yourself useful, adventurer." },
                    { text: "I need rare herbs for a powerful ritual. Bring me 10 herbs.", options: [
                        { label: "I'll gather them.", action: 'accept_quest', next: 2 },
                        { label: "Not now." }
                    ]},
                    { text: "Good. Don't dawdle — the stars won't wait forever." }
                ],
                quest_progress_witchs_bargain_p1: [{ text: "I still need 10 herbs. Hurry!" }],
                quest_turnin_witchs_bargain_p1: [
                    { text: "Excellent herbs. The ritual is almost ready..." },
                    { text: "*The witch chants and a shimmering portal appears nearby*" },
                    { text: "A gateway to the Hidden Grove! Only there grows the Moonflower I need.", options: [
                        { label: "Amazing!", action: 'turnin_quest' }
                    ]}
                ],
                quest_offer_witchs_bargain_p2: [
                    { text: "Enter the portal I've opened and find a Moonflower in the Hidden Grove." },
                    { text: "Be warned — the grove is ancient and strange.", options: [
                        { label: "I'm ready.", action: 'accept_quest', next: 2 },
                        { label: "I need to prepare." }
                    ]},
                    { text: "The portal awaits. Don't be afraid." }
                ],
                quest_progress_witchs_bargain_p2: [{ text: "Find a Moonflower in the Hidden Grove beyond the portal." }],
                quest_turnin_witchs_bargain_p2: [
                    { text: "A Moonflower! Magnificent! Its petals shimmer with lunar magic." },
                    { text: "As promised, take this enchanted amulet. It carries my blessing.", options: [
                        { label: "Thank you, Witch!", action: 'turnin_quest' }
                    ]}
                ],
                quest_complete: [{ text: "The swamp is peaceful again. Well... as peaceful as a swamp gets." }],
                default: [{ text: "Watch your step around here. The swamp has a mind of its own." }],
            },
        },
        ice_hermit: {
            name: 'Ice Hermit', x: 10, z: -90,
            quest: 'frozen_heart',
            dialogues: {
                quest_offer: [
                    { text: "The wolves... they circle closer every night. I can barely sleep." },
                    { text: "If you could thin their numbers — kill 3 ice wolves — I'd be grateful.",
                      options: [
                        { label: "I'll protect you.", action: 'accept_quest', next: 2 },
                        { label: "Find shelter elsewhere.", next: undefined },
                      ]
                    },
                    { text: "Thank you... be careful, they're fast and their bite is cold as death." },
                ],
                quest_progress: [{ text: "The wolves still howl... please, kill 3 ice wolves." }],
                quest_turnin: [
                    { text: "The howling has stopped! You've saved me!",
                      options: [{ label: "Stay safe.", action: 'turnin_quest', next: 1 }]
                    },
                    { text: "Take this — I found it frozen in the ice. It may serve you well." },
                ],
                quest_complete: [{ text: "Peace at last. The ice is quiet again." }],
                default: [{ text: "It's cold here, but I've grown used to it. The ice has its own beauty." }],
            },
        },
        desert_merchant: {
            name: 'Desert Merchant', x: 60, z: 10,
            shop: 'desert_shop',
            dialogues: {
                default: [{ text: "Welcome to the desert bazaar! I have exotic wares from distant lands." }],
            },
        },
        ge_clerk: {
            name: 'GE Clerk', x: 8, z: -12,
            quest: null,
            dialogues: {
                default: [
                    { text: "Welcome to the Grand Exchange! I can help you buy and sell items at market prices.",
                      options: [
                        { label: "I'd like to trade.", action: 'open_ge' },
                        { label: "No thanks." },
                      ]
                    },
                ],
            },
        },
        archaeologist: {
            name: 'Archaeologist', x: 62, z: 5,
            colors: { skin: 0xC8A882, shirt: 0x886644, pants: 0x554422 },
            questChain: ['lost_artifact_p1', 'lost_artifact_p2', 'lost_artifact_p3'],
            dialogues: {
                default: [{ text: "I'm studying the ancient ruins in this desert. Come back when you're more experienced." }],
                quest_offer_lost_artifact_p1: [
                    { text: "Adventurer! I've been studying these desert ruins and believe there are artifact fragments buried here." },
                    { text: "Could you search the desert and bring me 3 artifact shards? They should be scattered around the ruins.", options: [
                        { label: "I'll find them!", action: 'accept_quest', next: 2 },
                        { label: "Not right now." }
                    ]},
                    { text: "Excellent! Search the desert area carefully. The shards glow faintly in the sand." }
                ],
                quest_progress_lost_artifact_p1: [{ text: "Keep searching the desert for those artifact shards. I need 3 of them." }],
                quest_turnin_lost_artifact_p1: [
                    { text: "You found all three shards! Let me reassemble them..." },
                    { text: "By the gods... it's forming into something... *the artifact pulses with dark energy*" },
                    { text: "This artifact is CURSED! We need to find someone who can purify it. Take this cursed artifact to the Swamp Witch — she knows dark magic.", options: [
                        { label: "I'll take it to her.", action: 'turnin_quest' }
                    ]}
                ],
                quest_offer_lost_artifact_p2: [
                    { text: "The Swamp Witch should be able to help with the cursed artifact. Bring her the artifact and 5 herbs." },
                ],
                quest_progress_lost_artifact_p2: [{ text: "Take the cursed artifact and 5 herbs to the Swamp Witch." }],
                quest_turnin_lost_artifact_p2: [
                    { text: "The witch has prepared the potion. Now you must make a choice..." },
                    { text: "You can purify the artifact with holy water at the church, or harness its dark power...", options: [
                        { label: "Purify it (Prayer + Magic XP)", action: 'set_flag:artifact_choice:purify', next: 2 },
                        { label: "Harness dark power (Attack + Strength XP)", action: 'set_flag:artifact_choice:dark', next: 2 }
                    ]},
                    { text: "An interesting choice. Return to me when you're ready to complete the ritual.", options: [
                        { label: "Let's do it.", action: 'turnin_quest' }
                    ]}
                ],
                quest_offer_lost_artifact_p3: [
                    { text: "It's time to complete the ritual with the artifact." },
                    { text: "Bring the artifact to me and I'll perform the final step.", options: [
                        { label: "Let's finish this.", action: 'accept_quest', next: 2 },
                        { label: "Not yet." }
                    ]},
                    { text: "The final step requires great care..." }
                ],
                quest_progress_lost_artifact_p3: [{ text: "Bring me the artifact to complete the ritual." }],
                quest_turnin_lost_artifact_p3: [
                    { text: "The ritual is complete! The artifact has been transformed." },
                    { text: "May it serve you well, adventurer.", options: [
                        { label: "Thank you!", action: 'turnin_quest' }
                    ]}
                ],
                quest_complete: [{ text: "The artifact's power is incredible. Thank you for your help!" }],
            },
        },
    },

    QUESTS: {
        cooks_assistant: {
            name: "Cook's Assistant",
            description: "Help the cook gather 3 cooked chicken for the castle feast.",
            requirements: { items: [{ item: 'cooked_chicken', qty: 3 }] },
            rewards: { xp: { cooking: 100 }, items: [{ item: 'coins', qty: 50 }, { item: 'bronze_sword', qty: 1 }] },
        },
        sheep_shearer: {
            name: "Sheep Shearer",
            description: "Bring Fred the Farmer 5 balls of wool.",
            requirements: { items: [{ item: 'wool', qty: 5 }] },
            rewards: { xp: { cooking: 50 }, items: [{ item: 'coins', qty: 100 }] },
        },
        goblin_diplomacy: {
            name: "Goblin Diplomacy",
            description: "Settle the goblin armor dispute by collecting 3 goblin mails.",
            requirements: { items: [{ item: 'goblin_mail', qty: 3 }] },
            rewards: { xp: { defence: 200 }, items: [{ item: 'coins', qty: 150 }, { item: 'iron_chainbody', qty: 1 }] },
        },
        dragon_slayer: {
            name: "Dragon Slayer",
            description: "Slay the King Black Dragon deep in the dungeon.",
            requirements: { kills: { kbd: 1 } },
            rewards: { xp: { attack: 500, strength: 500, defence: 500 }, items: [{ item: 'coins', qty: 500 }, { item: 'steel_platebody', qty: 1 }] },
        },
        into_the_depths: {
            name: "Into the Depths",
            description: "Kill 3 skeletons on the first floor of the dungeon.",
            requirements: { kills: { skeleton: 3 } },
            rewards: { xp: { attack: 100, strength: 100 }, items: [{ item: 'lantern', qty: 1 }, { item: 'coins', qty: 100 }] },
        },
        shadow_purge: {
            name: "Shadow Purge",
            description: "Kill 2 Shadow Warriors on the second dungeon floor.",
            prerequisite: 'into_the_depths',
            requirements: { kills: { shadow_warrior: 2 } },
            rewards: { xp: { slayer: 500 }, items: [{ item: 'adamant_sword', qty: 1 }] },
        },
        the_demon_lord: {
            name: "The Demon Lord",
            description: "Slay the Demon Lord on the deepest floor of the dungeon.",
            prerequisite: 'shadow_purge',
            requirements: { kills: { demon_lord: 1 } },
            rewards: { xp: { attack: 400, strength: 400, defence: 200 }, items: [{ item: 'demons_bane', qty: 1 }] },
        },
        swamp_thing: {
            name: "Swamp Thing",
            description: "Kill 5 giant frogs for the Swamp Witch.",
            requirements: { kills: { giant_frog: 5 } },
            rewards: { xp: { hitpoints: 200, herblore: 150 }, items: [{ item: 'antipoison', qty: 3 }, { item: 'coins', qty: 200 }] },
        },
        frozen_heart: {
            name: "Frozen Heart",
            description: "Kill 3 ice wolves for the Ice Hermit.",
            requirements: { kills: { ice_wolf: 3 } },
            rewards: { xp: { attack: 300, defence: 200 }, items: [{ item: 'mithril_platebody', qty: 1 }, { item: 'coins', qty: 300 }] },
        },
        fishermans_woe: {
            name: "Fisherman's Woe",
            description: 'Kill 4 giant crabs near the fishing area.',
            requirements: { kills: { giant_crab: 4 } },
            rewards: {
                xp: { fishing: 300, attack: 150 },
                items: [{ item: 'coins', qty: 200 }, { item: 'raw_lobster', qty: 5 }],
            },
        },
        lost_artifact_p1: {
            name: 'The Lost Artifact: Discovery',
            description: 'Find 3 artifact shards in the desert.',
            requirements: { items: [{ item: 'desert_artifact_shard', qty: 3 }] },
            rewards: {
                xp: { mining: 200 },
                items: [{ item: 'cursed_artifact', qty: 1 }],
            },
        },
        lost_artifact_p2: {
            name: 'The Lost Artifact: The Curse',
            description: 'Bring the cursed artifact and 5 herbs to be cleansed.',
            prerequisite: 'lost_artifact_p1',
            requirements: { items: [{ item: 'cursed_artifact', qty: 1 }, { item: 'herb', qty: 5 }] },
            rewards: {
                xp: { herblore: 300 },
                items: [{ item: 'purification_potion', qty: 1 }],
            },
        },
        lost_artifact_p3: {
            name: 'The Lost Artifact: Purification',
            description: 'Complete the artifact ritual.',
            prerequisite: 'lost_artifact_p2',
            requirements: { items: [{ item: 'purification_potion', qty: 1 }] },
            rewards: {
                xp: { prayer: 200 },
                conditional: {
                    flag: 'artifact_choice',
                    expectedValue: 'purify',
                    true: { xp: { prayer: 500, magic: 500 }, items: [{ item: 'blessed_artifact', qty: 1 }] },
                    false: { xp: { attack: 500, strength: 500 }, items: [{ item: 'dark_artifact', qty: 1 }] },
                },
            },
        },
        witchs_bargain_p1: {
            name: "The Witch's Bargain: Rare Herbs",
            description: 'Bring 10 herbs to the Swamp Witch.',
            prerequisite: 'swamp_thing',
            requirements: { items: [{ item: 'herb', qty: 10 }] },
            rewards: {
                xp: { herblore: 400 },
                items: [{ item: 'coins', qty: 300 }],
            },
        },
        witchs_bargain_p2: {
            name: "The Witch's Bargain: The Moonflower",
            description: 'Find a Moonflower in the Hidden Grove.',
            prerequisite: 'witchs_bargain_p1',
            requirements: { items: [{ item: 'moonflower', qty: 1 }] },
            rewards: {
                xp: { magic: 500, herblore: 300 },
                items: [{ item: 'witchs_amulet', qty: 1 }],
            },
        },
    },

    MUSIC_ZONES: {
        lumbridge: { x: 0, z: 0, radius: 40, tempo: 100, key: 'C', mood: 'peaceful' },
        wilderness: { x: 0, z: -70, radius: 30, tempo: 70, key: 'Dm', mood: 'dark' },
        dungeon: { x: -50, z: -48, radius: 20, tempo: 80, key: 'Am', mood: 'danger' },
        farm: { x: 20, z: 30, radius: 20, tempo: 120, key: 'G', mood: 'cheerful' },
        desert: { x: 65, z: 10, radius: 25, tempo: 90, key: 'Em', mood: 'mysterious' },
        swamp: { x: -45, z: 40, radius: 25, tempo: 60, key: 'Cm', mood: 'eerie' },
        ice: { x: 10, z: -90, radius: 25, tempo: 75, key: 'Fm', mood: 'cold' },
    },

    VISUAL: {
        sunColor: 0xFFF5E0, sunIntensity: 1.2,
        sunPosition: { x: 50, y: 80, z: 30 },
        ambientColor: 0xB0C4DE, ambientIntensity: 0.4,
        hemiSkyColor: 0x87CEEB, hemiGroundColor: 0x8B7355, hemiIntensity: 0.3,
        fogColor: 0xC8DFF0, fogNear: 60, fogFar: 250,
        skyColor: 0x87CEEB,
    },

    MOBILE: {
        pixelRatio: 1,
        shadowMapSize: 512,
        fogFar: 150,
        fogNear: 40,
        disableAntiAlias: true,
    },

    PETS: {
        rock_golem: { name: 'Rock Golem', icon: '🪨', source: 'mining', chance: 1/3000, color: 0x888888, item: 'pet_rock_golem' },
        beaver:     { name: 'Beaver',     icon: '🦫', source: 'woodcutting', chance: 1/3000, color: 0x8B6914, item: 'pet_beaver' },
        heron:      { name: 'Heron',      icon: '🐦', source: 'fishing', chance: 1/3000, color: 0xDDDDDD, item: 'pet_heron' },
        phoenix:    { name: 'Phoenix',    icon: '🔥', source: 'firemaking', chance: 1/2000, color: 0xFF4400, item: 'pet_phoenix' },
        rocky:      { name: 'Rocky',      icon: '🦝', source: 'thieving', chance: 1/2500, color: 0x666666, item: 'pet_rocky' },
        kbd_jr:     { name: 'KBD Jr.',    icon: '🐉', source: 'kbd', chance: 1/50, color: 0x222222, item: 'pet_kbd_jr' },
        demon_jr:   { name: 'Demon Jr.',  icon: '👹', source: 'demon_lord', chance: 1/50, color: 0x8B0000, item: 'pet_demon_jr' },
        bloodhound: { name: 'Bloodhound', icon: '🐕', source: 'clue_hard', chance: 1/50, color: 0xCC6633, item: 'pet_bloodhound' },
    },

    CLUE_SCROLLS: {
        easy: {
            stepsCount: [2, 3],
            steps: [
                { type: 'dig', x: 15, z: 10, hint: 'Dig near the cluster of trees east of Lumbridge.' },
                { type: 'dig', x: -20, z: -5, hint: 'Dig where copper meets tin in the mining area.' },
                { type: 'dig', x: 25, z: 20, hint: 'Dig by the shimmering fishing waters.' },
                { type: 'kill', monster: 'goblin', hint: 'Defeat a goblin to find the next clue.' },
                { type: 'kill', monster: 'chicken', hint: 'A chicken holds a secret. Defeat one!' },
                { type: 'search', x: 0, z: -15, hint: 'Search near the castle entrance.' },
                { type: 'search', x: 10, z: -5, hint: 'Search near the General Store.' },
            ],
            rewards: {
                coins: [50, 200],
                items: [
                    { item: 'iron_sword', chance: 0.3 },
                    { item: 'iron_platebody', chance: 0.2 },
                    { item: 'fancy_hat', chance: 0.02 },
                    { item: 'golden_boots', chance: 0.02 },
                ],
            },
        },
        medium: {
            stepsCount: [3, 4],
            steps: [
                { type: 'dig', x: -30, z: -20, hint: 'Dig in the iron mining area south-west.' },
                { type: 'dig', x: 30, z: -5, hint: 'Dig among the oak trees to the east.' },
                { type: 'dig', x: -45, z: -35, hint: 'Dig near the dungeon entrance.' },
                { type: 'kill', monster: 'skeleton', hint: 'Slay a skeleton for the next step.' },
                { type: 'kill', monster: 'giant_spider', hint: 'A giant spider guards the clue.' },
                { type: 'search', x: -12, z: -12, hint: 'Search near the furnace.' },
                { type: 'search', x: 15, z: -15, hint: 'Search by the church.' },
                { type: 'search', x: 25, z: -5, hint: 'Search inside the tavern.' },
            ],
            rewards: {
                coins: [200, 500],
                items: [
                    { item: 'steel_platebody', chance: 0.3 },
                    { item: 'mithril_sword', chance: 0.2 },
                    { item: 'fancy_hat', chance: 0.033 },
                    { item: 'golden_boots', chance: 0.033 },
                    { item: 'team_cape', chance: 0.033 },
                ],
            },
        },
        hard: {
            stepsCount: [3, 4],
            steps: [
                { type: 'dig', x: -5, z: -65, hint: 'Dig near the runite rock in the Wilderness.' },
                { type: 'dig', x: -50, z: -43, hint: 'Dig deep within the dungeon area.' },
                { type: 'dig', x: 60, z: 10, hint: 'Dig in the scorching desert sands.' },
                { type: 'kill', monster: 'lesser_demon', hint: 'Slay a lesser demon for the final piece.' },
                { type: 'kill', monster: 'shadow_warrior', hint: 'Defeat a shadow warrior lurking below.' },
                { type: 'search', x: -45, z: 35, hint: 'Search the murky swamp to the south-west.' },
                { type: 'search', x: 10, z: -90, hint: 'Search the frozen north.' },
            ],
            rewards: {
                coins: [500, 2000],
                items: [
                    { item: 'adamant_platebody', chance: 0.3 },
                    { item: 'rune_sword', chance: 0.15 },
                    { item: 'fancy_hat', chance: 0.05 },
                    { item: 'golden_boots', chance: 0.05 },
                    { item: 'team_cape', chance: 0.05 },
                ],
            },
        },
    },

    BIOMES: {
        desert: { minX: 50, maxX: 90, minZ: -10, maxZ: 30, groundColor: 0xC2B280, fogColor: 0xD4C8A0, fogFar: 120 },
        swamp:  { minX: -60, maxX: -30, minZ: 25, maxZ: 55, groundColor: 0x3B5323, fogColor: 0x556B2F, fogFar: 80 },
        ice:    { minX: -20, maxX: 30, minZ: -110, maxZ: -75, groundColor: 0xE8E8F0, fogColor: 0xC8D8E8, fogFar: 100 },
        volcanic: { minX: 85, maxX: 140, minZ: -30, maxZ: 30, groundColor: 0x3D1F0F, fogColor: 0x443322, fogFar: 100 },
        underwater: { minX: -15, maxX: 15, minZ: -15, maxZ: 15, y: -15, groundColor: 0x0D3D5C, fogColor: 0x0A3C64, fogFar: 25 },
    },

    GRAND_EXCHANGE: {
        basePrices: {
            // Resources
            logs: 5, oak_logs: 15, willow_logs: 30,
            copper_ore: 8, tin_ore: 8, iron_ore: 20, coal: 30,
            mithril_ore: 80, adamantite_ore: 200, runite_ore: 500,
            // Bars
            bronze_bar: 20, iron_bar: 45, steel_bar: 80,
            mithril_bar: 200, adamant_bar: 500, rune_bar: 1200,
            // Food
            raw_shrimp: 5, raw_trout: 25, raw_lobster: 60,
            cooked_shrimp: 10, cooked_trout: 40, cooked_lobster: 100,
            raw_chicken: 3, raw_beef: 5, cooked_chicken: 8, cooked_beef: 12,
            // Runes
            air_rune: 4, fire_rune: 5, water_rune: 5, earth_rune: 5,
            mind_rune: 6, chaos_rune: 20, rune_essence: 5,
            // Ammo
            bronze_arrow: 3, iron_arrow: 8, steel_arrow: 15,
            // Herbs & potions
            herb: 15, vial: 8,
            attack_potion: 40, strength_potion: 50, defence_potion: 50,
            stamina_potion: 35, antipoison: 25,
            // Misc
            feather: 4, bones: 3, dragon_bones: 40, cowhide: 8,
            // Equipment
            bronze_sword: 25, iron_sword: 80, steel_sword: 200,
            mithril_sword: 500, adamant_sword: 1200, rune_sword: 3000,
            bronze_platebody: 60, iron_platebody: 150, steel_platebody: 400,
            mithril_platebody: 1000, adamant_platebody: 2500, rune_platebody: 6000,
            shortbow: 60, oak_shortbow: 200, staff_of_air: 250,
            // Batch 6 items
            obsidian_ore: 150, palm_logs: 25, pearl: 300, raw_seaweed: 8,
        },
    },

    WORLD_OBJECTS: {
        trees: [
            // Normal trees — northwest cluster (spread out to avoid canopy clipping)
            { type: 'normal', x: 13, z: 8 }, { type: 'normal', x: 18, z: 5 },
            { type: 'normal', x: 10, z: 14 }, { type: 'normal', x: 16, z: 13 },
            // Normal trees — west cluster
            { type: 'normal', x: -10, z: 15 }, { type: 'normal', x: -15, z: 20 },
            { type: 'normal', x: -7, z: 23 }, { type: 'normal', x: -12, z: 27 },
            // Oak trees — southeast area (spaced for larger canopies)
            { type: 'oak', x: 30, z: -5 }, { type: 'oak', x: 36, z: -2 }, { type: 'oak', x: 27, z: -10 },
            { type: 'oak', x: 33, z: -10 },
            // Normal trees — scattered far areas
            { type: 'normal', x: -25, z: -14 }, { type: 'normal', x: -31, z: -9 },
            { type: 'normal', x: 42, z: 26 }, { type: 'normal', x: 47, z: 32 },
            { type: 'normal', x: -36, z: 31 }, { type: 'normal', x: -40, z: 25 },
            // Willow trees — near pond edge (NOT inside water; pond center 25,20 radius 12)
            { type: 'willow', x: 14, z: 14 }, { type: 'willow', x: 37, z: 26 },
            { type: 'willow', x: 20, z: 33 },
            // Additional scattered trees for a fuller world
            { type: 'normal', x: 5, z: -10 }, { type: 'normal', x: -5, z: -18 },
            { type: 'normal', x: 50, z: 10 }, { type: 'normal', x: -20, z: 35 },
            { type: 'oak', x: 40, z: -15 }, { type: 'normal', x: -45, z: 15 },
            // Palm trees — desert city area
            { type: 'palm', x: 72, z: 12 }, { type: 'palm', x: 78, z: 8 },
            { type: 'palm', x: 75, z: 18 }, { type: 'palm', x: 80, z: 15 },
            { type: 'palm', x: 68, z: 5 },
        ],
        rocks: [
            { type: 'copper', x: -20, z: -5 }, { type: 'copper', x: -22, z: -3 }, { type: 'copper', x: -19, z: -3 },
            { type: 'tin', x: -18, z: -8 }, { type: 'tin', x: -24, z: -6 }, { type: 'tin', x: -21, z: -9 },
            { type: 'iron', x: -30, z: -20 }, { type: 'iron', x: -28, z: -22 }, { type: 'iron', x: -32, z: -18 },
            { type: 'coal', x: -32, z: -24 }, { type: 'coal', x: -34, z: -22 }, { type: 'coal', x: -36, z: -20 }, { type: 'coal', x: -33, z: -26 },
            // Mithril rocks — further out
            { type: 'mithril', x: -40, z: -35 }, { type: 'mithril', x: -42, z: -38 }, { type: 'mithril', x: -38, z: -40 },
            // Adamant rocks — near dungeon
            { type: 'adamant', x: -50, z: -42 }, { type: 'adamant', x: -53, z: -45 },
            // Runite rock — wilderness (dangerous!)
            { type: 'runite', x: -5, z: -65 },
            // Obsidian rocks — volcanic biome
            { type: 'obsidian', x: 100, z: 5 }, { type: 'obsidian', x: 105, z: -5 }, { type: 'obsidian', x: 110, z: 10 },
        ],
        monsters: [
            { id: 'm0', type: 'chicken', x: 5, z: 25 }, { id: 'm1', type: 'chicken', x: 8, z: 28 },
            { id: 'm2', type: 'chicken', x: 3, z: 30 }, { type: 'chicken', x: 10, z: 26 },
            { id: 'm3', type: 'cow', x: 18, z: 35 }, { id: 'm4', type: 'cow', x: 22, z: 38 },
            { type: 'cow', x: 16, z: 40 },
            { id: 'm5', type: 'rat', x: -5, z: -25 }, { id: 'm6', type: 'rat', x: -3, z: -28 },
            { id: 'm7', type: 'goblin', x: -35, z: 5 }, { id: 'm8', type: 'goblin', x: -38, z: 8 }, { id: 'm9', type: 'goblin', x: -40, z: 3 },
            { type: 'giant_crab', x: 22, z: 17 }, { type: 'giant_crab', x: 27, z: 16 },
            { type: 'giant_crab', x: 24, z: 23 }, { type: 'giant_crab', x: 29, z: 21 },
        ],
        dungeonFloors: {
            floor1: { y: -20, monsters: [
                { type: 'skeleton_weak', x: -47, z: -38 }, { type: 'skeleton_weak', x: -53, z: -42 },
                { type: 'skeleton_weak', x: -43, z: -45 }, { id: 'm15', type: 'moss_giant', x: -55, z: -40 },
                { id: 'm16', type: 'moss_giant', x: -48, z: -48 },
            ]},
            floor2: { y: -45, monsters: [
                { type: 'giant_spider', x: -47, z: -38 }, { type: 'giant_spider', x: -53, z: -42 },
                { type: 'shadow_warrior', x: -48, z: -45 }, { type: 'shadow_warrior', x: -55, z: -48 },
                { id: 'm14', type: 'lesser_demon', x: -50, z: -50 },
            ]},
            floor3: { y: -70, monsters: [
                { type: 'demon_lord', x: -50, z: -45 },
                { id: 'm17', type: 'kbd', x: -50, z: -52 },
            ]},
        },
        wildernessMonsters: [
            { id: 'm12', type: 'dark_wizard', x: -5, z: -65 }, { id: 'm13', type: 'dark_wizard', x: 5, z: -68 },
            { type: 'dark_wizard', x: 0, z: -72 },
            { id: 'm10', type: 'skeleton', x: -10, z: -75 }, { id: 'm11', type: 'skeleton', x: 10, z: -75 },
        ],
        sheep: [
            { x: 22, z: 33 }, { x: 25, z: 35 }, { x: 20, z: 36 },
            { x: 24, z: 38 }, { x: 19, z: 34 },
        ],
        fishingSpots: [
            { type: 'shrimp', x: 25, z: 20 },
            { type: 'trout',  x: 30, z: 22 },
            { type: 'lobster', x: 20, z: 24 },
        ],
        // Pool of valid positions inside the pond for roaming fishing spots
        fishingSpotPool: [
            { x: 18, z: 16 }, { x: 20, z: 24 }, { x: 25, z: 14 },
            { x: 30, z: 22 }, { x: 32, z: 18 }, { x: 22, z: 28 },
            { x: 28, z: 26 }, { x: 16, z: 22 },
        ],
        fishingSpotMoveInterval: 90, // seconds between spot relocations
        buildings: [
            { type: 'castle', x: 0, z: -15 },
            { type: 'house', x: -8, z: -3 },
            { type: 'furnace', x: -12, z: -12 },
            { type: 'anvil', x: -14, z: -10 },
            { type: 'church', x: 15, z: -15 },
            { type: 'shop', x: 10, z: -5 },
            { type: 'tavern', x: 25, z: -5 },
            // Desert city buildings
            { type: 'desert_house', x: 73, z: 10 },
            { type: 'desert_house', x: 79, z: 16 },
            { type: 'desert_palace', x: 76, z: 14 },
        ],
    },

    WORLD_EVENTS: {
        fishermans_woe_complete: [
            { type: 'spawnNPC', data: { id: 'fisherman_apprentice', name: 'Fishing Apprentice', x: 25, z: 20, dialogues: { default: [{ text: "The fishing is so much better now that those crabs are gone! Thanks to you!" }] } } }
        ],
        lost_artifact_p3_complete: [
            { type: 'spawnNPC', data: { id: 'artifact_scholar', name: 'Artifact Scholar', x: 2, z: -12, dialogues: { default: [{ text: "I heard about your discovery in the desert. Fascinating work!" }] } } }
        ],
        witchs_bargain_p1_complete: [
            { type: 'spawnPortal', data: { x: -55, z: 42, name: 'Portal to Hidden Grove', targetX: -60, targetZ: 50 } }
        ],
    },
};
