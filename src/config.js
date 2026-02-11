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
        size: 200,
        segments: 100,
        noiseScale: 0.02,
        heightAmplitude: 2,
    },

    PLAYER: {
        walkSpeed: 4,
        runSpeed: 6,
        height: 1.8,
        eyeHeight: 1.6,
        interactionRange: 8,
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
        playerAttackSpeed: 4,  // ticks between attacks
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
    },

    TREES: {
        normal: { name: 'Tree', hp: 10, respawnTime: 15, requiredLevel: 1, xpPerHarvest: 25, yieldItem: 'logs', successChance: 0.6 },
        oak:    { name: 'Oak tree', hp: 15, respawnTime: 20, requiredLevel: 15, xpPerHarvest: 37, yieldItem: 'oak_logs', successChance: 0.4 },
        willow: { name: 'Willow tree', hp: 20, respawnTime: 25, requiredLevel: 30, xpPerHarvest: 67, yieldItem: 'willow_logs', successChance: 0.3 },
    },

    ROCKS: {
        copper: { name: 'Copper rock', hp: 6, respawnTime: 4, requiredLevel: 1, xpPerHarvest: 17, yieldItem: 'copper_ore', successChance: 0.6 },
        tin:    { name: 'Tin rock', hp: 6, respawnTime: 4, requiredLevel: 1, xpPerHarvest: 17, yieldItem: 'tin_ore', successChance: 0.6 },
        iron:   { name: 'Iron rock', hp: 10, respawnTime: 10, requiredLevel: 15, xpPerHarvest: 35, yieldItem: 'iron_ore', successChance: 0.35 },
        coal:   { name: 'Coal rock', hp: 12, respawnTime: 30, requiredLevel: 30, xpPerHarvest: 50, yieldItem: 'coal', successChance: 0.3 },
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
            ],
            respawnTime: 15,
            xpReward: { attack: 4, strength: 4, defence: 4, hitpoints: 1 },
        },
        cow: {
            name: 'Cow', hp: 8, combatLevel: 2,
            attackLevel: 1, strengthLevel: 1, defenceLevel: 1,
            attackSpeed: 5, aggroRange: 0, wanderRadius: 8, moveSpeed: 0.8,
            lootTable: [
                { item: 'raw_beef', qty: 1, chance: 1.0 },
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'cowhide', qty: 1, chance: 1.0 },
            ],
            respawnTime: 15,
            xpReward: { attack: 8, strength: 8, defence: 8, hitpoints: 3 },
        },
        rat: {
            name: 'Giant Rat', hp: 4, combatLevel: 1,
            attackLevel: 1, strengthLevel: 1, defenceLevel: 1,
            attackSpeed: 4, aggroRange: 3, wanderRadius: 5, moveSpeed: 1.5,
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 3, chance: 0.3 },
            ],
            respawnTime: 12,
            xpReward: { attack: 4, strength: 4, defence: 4, hitpoints: 1 },
        },
        goblin: {
            name: 'Goblin', hp: 5, combatLevel: 2,
            attackLevel: 1, strengthLevel: 1, defenceLevel: 1,
            attackSpeed: 4, aggroRange: 5, wanderRadius: 8, moveSpeed: 1.5,
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 5, chance: 0.5 },
                { item: 'goblin_mail', qty: 1, chance: 0.1 },
            ],
            respawnTime: 20,
            xpReward: { attack: 5, strength: 5, defence: 5, hitpoints: 2 },
        },
        skeleton: {
            name: 'Skeleton', hp: 12, combatLevel: 8,
            attackLevel: 6, strengthLevel: 5, defenceLevel: 5,
            attackSpeed: 4, aggroRange: 6, wanderRadius: 5, moveSpeed: 1.2,
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 15, chance: 0.6 },
                { item: 'iron_sword', qty: 1, chance: 0.15 },
            ],
            respawnTime: 30,
            xpReward: { attack: 12, strength: 12, defence: 12, hitpoints: 4 },
        },
        giant_spider: {
            name: 'Giant Spider', hp: 18, combatLevel: 12,
            attackLevel: 8, strengthLevel: 7, defenceLevel: 6,
            attackSpeed: 3, aggroRange: 8, wanderRadius: 6, moveSpeed: 2,
            poisonChance: 0.25, poisonDamage: 1, poisonTicks: 5,
            lootTable: [
                { item: 'coins', qty: 25, chance: 0.7 },
                { item: 'iron_chainbody', qty: 1, chance: 0.08 },
            ],
            respawnTime: 40,
            xpReward: { attack: 18, strength: 18, defence: 18, hitpoints: 6 },
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
            ],
            respawnTime: 35,
            xpReward: { attack: 15, strength: 15, defence: 15, hitpoints: 5 },
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
                { item: 'rune_essence', qty: 5, chance: 0.2 },
                { item: 'herb', qty: 2, chance: 0.35 },
            ],
            respawnTime: 50,
            xpReward: { attack: 30, strength: 30, defence: 30, hitpoints: 10 },
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
                { item: 'rune_essence', qty: 10, chance: 0.5 },
                { item: 'herb', qty: 3, chance: 0.5 },
            ],
            respawnTime: 120,
            xpReward: { attack: 80, strength: 80, defence: 80, hitpoints: 30 },
        },
        skeleton: {
            name: 'Skeleton', hp: 15, combatLevel: 12,
            attackLevel: 10, strengthLevel: 10, defenceLevel: 5,
            attackSpeed: 4, aggroRange: 6, wanderRadius: 3, moveSpeed: 1.5,
            lootTable: [
                { item: 'bones', qty: 1, chance: 1.0 },
                { item: 'coins', qty: 15, chance: 0.6 },
            ],
            respawnTime: 30,
            xpReward: { attack: 10, strength: 10, defence: 10, hitpoints: 4 },
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
        bronze_bar:     { name: 'Bronze bar',      stackable: false, icon: '🟫' },
        iron_bar:       { name: 'Iron bar',        stackable: false, icon: '⬜' },
        steel_bar:      { name: 'Steel bar',       stackable: false, icon: '🔲' },
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
        // Runes
        air_rune:       { name: 'Air rune',        stackable: true,  icon: '💨' },
        fire_rune:      { name: 'Fire rune',       stackable: true,  icon: '🔥' },
        water_rune:     { name: 'Water rune',      stackable: true,  icon: '💧' },
        earth_rune:     { name: 'Earth rune',      stackable: true,  icon: '🟤' },
        mind_rune:      { name: 'Mind rune',       stackable: true,  icon: '🧠' },
        chaos_rune:     { name: 'Chaos rune',      stackable: true,  icon: '🌀' },
        rune_essence:   { name: 'Rune essence',    stackable: false, icon: '💎' },
        // Ranged
        bronze_arrow:   { name: 'Bronze arrow',    stackable: true,  icon: '➡️', rangedStrength: 2 },
        iron_arrow:     { name: 'Iron arrow',      stackable: true,  icon: '➡️', rangedStrength: 4 },
        shortbow:       { name: 'Shortbow',        stackable: false, icon: '🏹', equipSlot: 'weapon', attackBonus: 0, strengthBonus: 0, defenceBonus: 0, rangedBonus: 6, attackStyle: 'ranged' },
        // Equipment — Bronze
        goblin_mail:    { name: 'Goblin mail',     stackable: false, icon: '🛡️', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 2 },
        bronze_dagger:  { name: 'Bronze dagger',   stackable: false, icon: '🔪', equipSlot: 'weapon', attackBonus: 2, strengthBonus: 1, defenceBonus: 0 },
        bronze_mace:    { name: 'Bronze mace',     stackable: false, icon: '🔨', equipSlot: 'weapon', attackBonus: 3, strengthBonus: 3, defenceBonus: 0 },
        bronze_sword:   { name: 'Bronze sword',    stackable: false, icon: '🗡️', equipSlot: 'weapon', attackBonus: 4, strengthBonus: 3, defenceBonus: 0 },
        bronze_helm:    { name: 'Bronze full helm', stackable: false, icon: '⛑️', equipSlot: 'head', attackBonus: 0, strengthBonus: 0, defenceBonus: 3 },
        bronze_shield:  { name: 'Bronze shield',   stackable: false, icon: '🛡️', equipSlot: 'shield', attackBonus: 0, strengthBonus: 0, defenceBonus: 4 },
        bronze_chainbody:{ name: 'Bronze chainbody', stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 4 },
        bronze_platebody:{ name: 'Bronze platebody', stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 7 },
        bronze_legs:    { name: 'Bronze platelegs', stackable: false, icon: '👖', equipSlot: 'legs', attackBonus: 0, strengthBonus: 0, defenceBonus: 4 },
        // Equipment — Iron
        iron_dagger:    { name: 'Iron dagger',     stackable: false, icon: '🔪', equipSlot: 'weapon', attackBonus: 5, strengthBonus: 3, defenceBonus: 0 },
        iron_mace:      { name: 'Iron mace',       stackable: false, icon: '🔨', equipSlot: 'weapon', attackBonus: 6, strengthBonus: 6, defenceBonus: 0 },
        iron_sword:     { name: 'Iron sword',      stackable: false, icon: '⚔️', equipSlot: 'weapon', attackBonus: 8, strengthBonus: 6, defenceBonus: 0 },
        iron_helm:      { name: 'Iron full helm',  stackable: false, icon: '⛑️', equipSlot: 'head', attackBonus: 0, strengthBonus: 0, defenceBonus: 5 },
        iron_shield:    { name: 'Iron shield',     stackable: false, icon: '🛡️', equipSlot: 'shield', attackBonus: 0, strengthBonus: 0, defenceBonus: 6 },
        iron_chainbody: { name: 'Iron chainbody',  stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 8 },
        iron_platebody: { name: 'Iron platebody',  stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 11 },
        iron_legs:      { name: 'Iron platelegs',  stackable: false, icon: '👖', equipSlot: 'legs', attackBonus: 0, strengthBonus: 0, defenceBonus: 6 },
        // Equipment — Steel
        steel_dagger:   { name: 'Steel dagger',    stackable: false, icon: '🔪', equipSlot: 'weapon', attackBonus: 8, strengthBonus: 5, defenceBonus: 0 },
        steel_mace:     { name: 'Steel mace',      stackable: false, icon: '🔨', equipSlot: 'weapon', attackBonus: 9, strengthBonus: 9, defenceBonus: 0 },
        steel_sword:    { name: 'Steel sword',     stackable: false, icon: '⚔️', equipSlot: 'weapon', attackBonus: 12, strengthBonus: 10, defenceBonus: 0 },
        steel_helm:     { name: 'Steel full helm',  stackable: false, icon: '⛑️', equipSlot: 'head', attackBonus: 0, strengthBonus: 0, defenceBonus: 7 },
        steel_shield:   { name: 'Steel shield',    stackable: false, icon: '🛡️', equipSlot: 'shield', attackBonus: 0, strengthBonus: 0, defenceBonus: 9 },
        steel_chainbody:{ name: 'Steel chainbody',  stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 11 },
        steel_platebody:{ name: 'Steel platebody',  stackable: false, icon: '🫁', equipSlot: 'body', attackBonus: 0, strengthBonus: 0, defenceBonus: 14 },
        steel_legs:     { name: 'Steel platelegs',  stackable: false, icon: '👖', equipSlot: 'legs', attackBonus: 0, strengthBonus: 0, defenceBonus: 9 },
        // Other equipment
        leather_boots:  { name: 'Leather boots',   stackable: false, icon: '👢', equipSlot: 'feet', attackBonus: 0, strengthBonus: 0, defenceBonus: 1 },
        // Staff
        staff_of_air:   { name: 'Staff of air',    stackable: false, icon: '🪄', equipSlot: 'weapon', attackBonus: 2, strengthBonus: 2, defenceBonus: 2, magicBonus: 10, attackStyle: 'magic', providesRune: 'air_rune' },
    },

    EQUIPMENT_SLOTS: ['weapon', 'shield', 'body', 'legs', 'feet', 'head'],

    FISHING: {
        shrimp:  { name: 'Shrimp',  requiredLevel: 1,  xpPerCatch: 10,  yieldItem: 'raw_shrimp',   successChance: 0.5 },
        trout:   { name: 'Trout',   requiredLevel: 20, xpPerCatch: 50,  yieldItem: 'raw_trout',    successChance: 0.35 },
        lobster: { name: 'Lobster', requiredLevel: 40, xpPerCatch: 90,  yieldItem: 'raw_lobster',  successChance: 0.25 },
    },

    SMITHING: {
        smelting: {
            bronze_bar: { ores: { copper_ore: 1, tin_ore: 1 }, level: 1, xp: 6 },
            iron_bar:   { ores: { iron_ore: 1 }, level: 15, xp: 12.5 },
            steel_bar:  { ores: { iron_ore: 1, coal: 2 }, level: 30, xp: 17.5 },
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
        guide:    { npcId: 'guide',   name: 'Lumbridge Guide', requiredLevel: 1,  xp: 8,   stunTicks: 5, successBase: 0.6, loot: [{ item: 'coins', qty: 3 }] },
        general:  { npcId: 'general', name: 'Shopkeeper',      requiredLevel: 10, xp: 16,  stunTicks: 5, successBase: 0.5, loot: [{ item: 'coins', qty: 10 }] },
        banker:   { npcId: 'banker',  name: 'Banker',          requiredLevel: 25, xp: 30,  stunTicks: 6, successBase: 0.4, loot: [{ item: 'coins', qty: 25 }] },
        fred:     { npcId: 'fred',    name: 'Fred the Farmer', requiredLevel: 15, xp: 20,  stunTicks: 5, successBase: 0.45, loot: [{ item: 'coins', qty: 12 }, { item: 'wool', qty: 1 }] },
    },

    HERBLORE: {
        attack_potion:   { name: 'Attack potion',   herb: 1, vial: 1, level: 3,  xp: 25 },
        strength_potion: { name: 'Strength potion',  herb: 2, vial: 1, level: 12, xp: 50 },
        defence_potion:  { name: 'Defence potion',   herb: 3, vial: 1, level: 20, xp: 75 },
        stamina_potion:  { name: 'Stamina potion',   herb: 2, vial: 1, level: 25, xp: 60 },
        antipoison:      { name: 'Antipoison',       herb: 1, vial: 1, level: 5,  xp: 20 },
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
        ],
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
    ],

    SKILL_GUIDES: {
        attack:      [{ level: 1, unlock: 'Bronze weapons' }, { level: 5, unlock: 'Iron weapons' }, { level: 20, unlock: 'Steel weapons' }],
        strength:    [{ level: 1, unlock: 'Max hit increases with level' }],
        defence:     [{ level: 1, unlock: 'Bronze armor' }, { level: 5, unlock: 'Iron armor' }, { level: 20, unlock: 'Steel armor' }],
        hitpoints:   [{ level: 10, unlock: 'Starting HP' }],
        ranged:      [{ level: 1, unlock: 'Shortbow + Bronze arrows' }, { level: 20, unlock: 'Iron arrows' }],
        magic:       [{ level: 1, unlock: 'Wind Strike' }, { level: 5, unlock: 'Water Strike' }, { level: 9, unlock: 'Earth Strike' }, { level: 13, unlock: 'Fire Strike' }, { level: 35, unlock: 'Fire Bolt' }],
        prayer:      [{ level: 1, unlock: 'Thick Skin (+5 Def)' }, { level: 4, unlock: 'Burst of Strength (+5 Str)' }, { level: 7, unlock: 'Clarity of Thought (+5 Atk)' }, { level: 43, unlock: 'Protect from Melee' }],
        woodcutting: [{ level: 1, unlock: 'Normal trees' }, { level: 15, unlock: 'Oak trees' }, { level: 30, unlock: 'Willow trees' }],
        mining:      [{ level: 1, unlock: 'Copper & Tin' }, { level: 15, unlock: 'Iron ore' }, { level: 30, unlock: 'Coal' }],
        fishing:     [{ level: 1, unlock: 'Shrimps' }, { level: 20, unlock: 'Trout' }, { level: 40, unlock: 'Lobster' }],
        cooking:     [{ level: 1, unlock: 'Shrimps, Chicken, Beef' }],
        firemaking:  [{ level: 1, unlock: 'Normal logs' }, { level: 15, unlock: 'Oak logs' }, { level: 30, unlock: 'Willow logs' }],
        smithing:    [{ level: 1, unlock: 'Bronze bars & items' }, { level: 15, unlock: 'Iron bars & items' }, { level: 30, unlock: 'Steel bars & items' }],
        runecrafting:[{ level: 1, unlock: 'Air runes' }, { level: 2, unlock: 'Mind runes' }, { level: 5, unlock: 'Water runes' }, { level: 9, unlock: 'Earth runes' }, { level: 14, unlock: 'Fire runes' }, { level: 35, unlock: 'Chaos runes' }],
        agility:     [{ level: 1, unlock: 'Lumbridge agility course' }],
        slayer:      [{ level: 1, unlock: 'Slayer tasks from Turael' }],
        thieving:    [{ level: 1, unlock: 'Pickpocket Lumbridge Guide' }, { level: 10, unlock: 'Pickpocket Shopkeeper' }, { level: 15, unlock: 'Pickpocket Fred' }, { level: 25, unlock: 'Pickpocket Banker' }],
        herblore:    [{ level: 3, unlock: 'Attack potion' }, { level: 12, unlock: 'Strength potion' }, { level: 20, unlock: 'Defence potion' }],
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
    },

    MUSIC_ZONES: {
        lumbridge: { x: 0, z: 0, radius: 40, tempo: 100, key: 'C', mood: 'peaceful' },
        wilderness: { x: 0, z: -70, radius: 30, tempo: 70, key: 'Dm', mood: 'dark' },
        dungeon: { x: -50, z: -48, radius: 20, tempo: 80, key: 'Am', mood: 'danger' },
        farm: { x: 20, z: 30, radius: 20, tempo: 120, key: 'G', mood: 'cheerful' },
    },

    VISUAL: {
        sunColor: 0xFFF5E0, sunIntensity: 1.2,
        sunPosition: { x: 50, y: 80, z: 30 },
        ambientColor: 0xB0C4DE, ambientIntensity: 0.4,
        hemiSkyColor: 0x87CEEB, hemiGroundColor: 0x8B7355, hemiIntensity: 0.3,
        fogColor: 0xC8DFF0, fogNear: 60, fogFar: 180,
        skyColor: 0x87CEEB,
    },

    WORLD_OBJECTS: {
        trees: [
            { type: 'normal', x: 15, z: 10 }, { type: 'normal', x: 18, z: 14 },
            { type: 'normal', x: 12, z: 18 }, { type: 'normal', x: 20, z: 8 },
            { type: 'normal', x: -10, z: 15 }, { type: 'normal', x: -14, z: 20 },
            { type: 'normal', x: -8, z: 22 },
            { type: 'oak', x: 30, z: -5 }, { type: 'oak', x: 34, z: -2 }, { type: 'oak', x: 28, z: -8 },
            { type: 'normal', x: -25, z: -15 }, { type: 'normal', x: -30, z: -10 },
            { type: 'normal', x: 40, z: 25 }, { type: 'normal', x: 45, z: 30 },
            { type: 'normal', x: -35, z: 30 },
            { type: 'willow', x: 22, z: 15 }, { type: 'willow', x: 27, z: 18 },
        ],
        rocks: [
            { type: 'copper', x: -20, z: -5 }, { type: 'copper', x: -22, z: -3 }, { type: 'copper', x: -19, z: -3 },
            { type: 'tin', x: -18, z: -8 }, { type: 'tin', x: -24, z: -6 }, { type: 'tin', x: -21, z: -9 },
            { type: 'iron', x: -30, z: -20 }, { type: 'iron', x: -28, z: -22 }, { type: 'iron', x: -32, z: -18 },
            { type: 'coal', x: -32, z: -24 }, { type: 'coal', x: -34, z: -22 }, { type: 'coal', x: -36, z: -20 }, { type: 'coal', x: -33, z: -26 },
        ],
        monsters: [
            { type: 'chicken', x: 5, z: 25 }, { type: 'chicken', x: 8, z: 28 },
            { type: 'chicken', x: 3, z: 30 }, { type: 'chicken', x: 10, z: 26 },
            { type: 'cow', x: 18, z: 35 }, { type: 'cow', x: 22, z: 38 },
            { type: 'cow', x: 16, z: 40 },
            { type: 'rat', x: -5, z: -25 }, { type: 'rat', x: -3, z: -28 },
            { type: 'goblin', x: -35, z: 5 }, { type: 'goblin', x: -38, z: 8 }, { type: 'goblin', x: -40, z: 3 },
        ],
        dungeonMonsters: [
            { type: 'skeleton', x: -48, z: -42 }, { type: 'skeleton', x: -52, z: -45 }, { type: 'skeleton', x: -45, z: -48 },
            { type: 'giant_spider', x: -55, z: -50 }, { type: 'giant_spider', x: -50, z: -55 },
            { type: 'lesser_demon', x: -58, z: -58 },
            { type: 'kbd', x: -62, z: -62 },
        ],
        wildernessMonsters: [
            { type: 'dark_wizard', x: -5, z: -65 }, { type: 'dark_wizard', x: 5, z: -68 },
            { type: 'dark_wizard', x: 0, z: -72 },
            { type: 'skeleton', x: -10, z: -75 }, { type: 'skeleton', x: 10, z: -75 },
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
        buildings: [
            { type: 'castle', x: 0, z: -15 },
            { type: 'house', x: -8, z: -3 },
            { type: 'furnace', x: -12, z: -12 },
            { type: 'anvil', x: -14, z: -10 },
            { type: 'church', x: 15, z: -15 },
            { type: 'shop', x: 10, z: -5 },
        ],
    },
};
