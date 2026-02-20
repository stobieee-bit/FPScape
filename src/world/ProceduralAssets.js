import * as THREE from 'three';

// Helper: position a mesh and return it (Object.assign can't set position in Three.js)
function at(obj, x, y, z) { obj.position.set(x, y, z); return obj; }

export class ProceduralAssets {
    constructor() {
        // ── Material cache: avoids creating duplicate MeshStandardMaterials ──
        this._matCache = new Map();

        // Pre-generate varied leaf materials (12 per type) to avoid per-tree allocation
        this._leafMaterials = {};
        for (const type of ['normal', 'oak', 'willow']) {
            this._leafMaterials[type] = [];
            const baseColors = {
                normal: { h: 0.36, s: 0.65, l: 0.35 },
                oak:    { h: 0.38, s: 0.70, l: 0.26 },
                willow: { h: 0.34, s: 0.55, l: 0.47 },
            };
            const base = baseColors[type];
            for (let i = 0; i < 12; i++) {
                const h = base.h + (Math.random() - 0.5) * 0.08;
                const s = Math.max(0.3, Math.min(0.9, base.s + (Math.random() - 0.5) * 0.2));
                const l = Math.max(0.18, Math.min(0.55, base.l + (Math.random() - 0.5) * 0.12));
                const color = new THREE.Color().setHSL(h, s, l);
                this._leafMaterials[type].push(new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
            }
        }

        // Add palm leaf materials
        this._leafMaterials['palm'] = [];
        for (let i = 0; i < 12; i++) {
            const h = 0.35 + (Math.random() - 0.5) * 0.06;
            const s = Math.max(0.3, Math.min(0.8, 0.6 + (Math.random() - 0.5) * 0.2));
            const l = Math.max(0.2, Math.min(0.5, 0.35 + (Math.random() - 0.5) * 0.1));
            const color = new THREE.Color().setHSL(h, s, l);
            this._leafMaterials['palm'].push(new THREE.MeshStandardMaterial({ color, roughness: 0.8, side: THREE.DoubleSide }));
        }

        this.materials = {
            trunk: new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.9 }),
            leaves: new THREE.MeshStandardMaterial({ color: 0x2D8C3C, roughness: 0.8 }),
            oakLeaves: new THREE.MeshStandardMaterial({ color: 0x1B6B2A, roughness: 0.8 }),
            willowLeaves: new THREE.MeshStandardMaterial({ color: 0x4AA84C, roughness: 0.8 }),
            stoneGray: new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.95 }),
            copperOre: new THREE.MeshStandardMaterial({ color: 0xB87333, roughness: 0.7, metalness: 0.3 }),
            tinOre: new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.7, metalness: 0.4 }),
            ironOre: new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7, metalness: 0.3 }),
            coalOre: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.1 }),
            mithrilOre: new THREE.MeshStandardMaterial({ color: 0x1A237E, roughness: 0.6, metalness: 0.5 }),
            adamantOre: new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.6, metalness: 0.5 }),
            runiteOre: new THREE.MeshStandardMaterial({ color: 0x00ACC1, roughness: 0.5, metalness: 0.6 }),
            chickenBody: new THREE.MeshStandardMaterial({ color: 0xF5F5DC, roughness: 0.8 }),
            chickenBeak: new THREE.MeshStandardMaterial({ color: 0xFF8C00, roughness: 0.7 }),
            chickenComb: new THREE.MeshStandardMaterial({ color: 0xFF2222, roughness: 0.7 }),
            goblinSkin: new THREE.MeshStandardMaterial({ color: 0x5B8C3C, roughness: 0.8 }),
            goblinCloth: new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.9 }),
            woodWall: new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.9 }),
            roof: new THREE.MeshStandardMaterial({ color: 0x994422, roughness: 0.9 }),
            castleStone: new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.95 }),
            door: new THREE.MeshStandardMaterial({ color: 0x5C3A1E, roughness: 0.9 }),
            stump: new THREE.MeshStandardMaterial({ color: 0x4A3018, roughness: 0.95 }),
            depletedRock: new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.95 }),
            npcSkin: new THREE.MeshStandardMaterial({ color: 0xDEB887, roughness: 0.8 }),
            npcShirt: new THREE.MeshStandardMaterial({ color: 0x4466AA, roughness: 0.8 }),
            npcPants: new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.8 }),
            npcHair: new THREE.MeshStandardMaterial({ color: 0x4A3018, roughness: 0.9 }),
            guideRobe: new THREE.MeshStandardMaterial({ color: 0xCC8833, roughness: 0.8 }),
            boneMat: new THREE.MeshStandardMaterial({ color: 0xE8E0D0, roughness: 0.7 }),
            skeletonMat: new THREE.MeshStandardMaterial({ color: 0xDDD8CC, roughness: 0.6 }),
            spiderMat: new THREE.MeshStandardMaterial({ color: 0x3A2A1A, roughness: 0.9 }),
            spiderEyeMat: new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.3 }),
            dungeonStone: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.95 }),
            cowBody: new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.8 }),
            cowSpots: new THREE.MeshStandardMaterial({ color: 0x3A2A1A, roughness: 0.8 }),
            ratBody: new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 }),
            wizardRobe: new THREE.MeshStandardMaterial({ color: 0x2A1A4A, roughness: 0.8 }),
            demonBody: new THREE.MeshStandardMaterial({ color: 0xAA2222, roughness: 0.7 }),
            dragonBody: new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.6, metalness: 0.3 }),
            dragonWing: new THREE.MeshStandardMaterial({ color: 0x2A1A1A, roughness: 0.7, side: THREE.DoubleSide }),
            sheepBody: new THREE.MeshStandardMaterial({ color: 0xF0F0F0, roughness: 0.95 }),
            metalDark: new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.7 }),
            churchWhite: new THREE.MeshStandardMaterial({ color: 0xEEEEDD, roughness: 0.9 }),
            furnaceBrick: new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.95 }),
            agilityLog: new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.9 }),
            agilityNet: new THREE.MeshStandardMaterial({ color: 0xCCBB88, roughness: 0.9 }),
            altarStone: new THREE.MeshStandardMaterial({ color: 0x7777AA, roughness: 0.7, metalness: 0.2 }),
            // Shared materials previously created inline in monster builders
            redEyes: new THREE.MeshStandardMaterial({ color: 0xFF0000 }),
            redGlowEyes: new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.3 }),
            demonHorn: new THREE.MeshStandardMaterial({ color: 0x333333 }),
            skeletonEyes: new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0x440000, emissiveIntensity: 0.5 }),
            skeletonSword: new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.6, roughness: 0.3 }),
            wizardOrb: new THREE.MeshStandardMaterial({ color: 0x8800FF, emissive: 0x4400AA, emissiveIntensity: 0.5 }),
            wizardRedEyes: new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.6 }),
            demonYellowEyes: new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFF8800, emissiveIntensity: 0.8 }),
            kbdRedEyes: new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 1.0 }),
            mossGiant: new THREE.MeshStandardMaterial({ color: 0x3B6B2A, roughness: 0.85 }),
            shadowWarrior: new THREE.MeshStandardMaterial({ color: 0x1A1A2E, roughness: 0.7, emissive: 0x110022, emissiveIntensity: 0.3 }),
            shadowEyes: new THREE.MeshStandardMaterial({ color: 0xAA00FF, emissive: 0x8800CC, emissiveIntensity: 1.0 }),
            shadowBlade: new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.8 }),
            demonLord: new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.6, emissive: 0x330000, emissiveIntensity: 0.4 }),
            demonLordEyes: new THREE.MeshStandardMaterial({ color: 0xFF4400, emissive: 0xFF2200, emissiveIntensity: 1.0 }),
            demonLordHorn: new THREE.MeshStandardMaterial({ color: 0x222222 }),
            demonLordWing: new THREE.MeshStandardMaterial({ color: 0x440000, side: THREE.DoubleSide }),
            pinkNose: new THREE.MeshStandardMaterial({ color: 0xFF8888 }),
            flameMat: new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.8 }),
            eyeBlack: new THREE.MeshStandardMaterial({ color: 0x222222 }),
            sandstone: new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.85 }),
            sandstoneRoof: new THREE.MeshStandardMaterial({ color: 0xBFA77A, roughness: 0.9 }),
            palmTrunk: new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 }),
            palmLeaf: new THREE.MeshStandardMaterial({ color: 0x3B7A35, roughness: 0.8, side: THREE.DoubleSide }),
            obsidianOre: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.5 }),
            volcanicRock: new THREE.MeshStandardMaterial({ color: 0x3A2A1A, roughness: 0.95 }),
            fireElementalBody: new THREE.MeshStandardMaterial({ color: 0xFF6600, emissive: 0xFF4400, emissiveIntensity: 0.9 }),
            fireElementalCore: new THREE.MeshStandardMaterial({ color: 0xFFAA00, emissive: 0xFF8800, emissiveIntensity: 0.8 }),
            desertGuardArmor: new THREE.MeshStandardMaterial({ color: 0xC2A060, roughness: 0.7, metalness: 0.3 }),
            seaSerpentBody: new THREE.MeshStandardMaterial({ color: 0x1A6B5A, roughness: 0.6 }),
            seaSerpentEye: new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.5 }),
            caveMushroom: new THREE.MeshStandardMaterial({ color: 0x00CCAA, emissive: 0x00AA88, emissiveIntensity: 0.8 }),
            caveFloor: new THREE.MeshStandardMaterial({ color: 0x2A3A4A, roughness: 0.95 }),
            portalBlue: new THREE.MeshStandardMaterial({ color: 0x2288FF, emissive: 0x1166CC, emissiveIntensity: 0.6, transparent: true, opacity: 0.7 }),
            scorpionBody: new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.7 }),
            giantFrogBody: new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.8 }),
            giantFrogEye: new THREE.MeshStandardMaterial({ color: 0xFFFF00 }),
            iceWolfBody: new THREE.MeshStandardMaterial({ color: 0xCCDDEE, roughness: 0.5, emissive: 0x223344, emissiveIntensity: 0.2 }),
            iceWolfEye: new THREE.MeshStandardMaterial({ color: 0x44AAFF, emissive: 0x2288FF, emissiveIntensity: 1.0 }),
            crabBody: new THREE.MeshStandardMaterial({ color: 0xCC4422, roughness: 0.8 }),
            crabLeg: new THREE.MeshStandardMaterial({ color: 0xAA3322, roughness: 0.7 }),
            crabClaw: new THREE.MeshStandardMaterial({ color: 0xDD5533, roughness: 0.6 }),
            crabStalk: new THREE.MeshStandardMaterial({ color: 0xBB4422 }),
        };
    }

    createTree(type = 'normal') {
        if (type === 'palm') return this._buildPalmTree();

        const group = new THREE.Group();

        // --- Per-tree random variation for visual distinction ---
        const scaleVar = 0.75 + Math.random() * 0.5; // 0.75–1.25
        const heightVar = 0.85 + Math.random() * 0.3; // 0.85–1.15
        const trunkThickVar = 0.8 + Math.random() * 0.4; // 0.8–1.2

        const trunkH = (type === 'willow' ? 4 : 3) * heightVar;
        const trunkTop = 0.15 * trunkThickVar;
        const trunkBot = 0.25 * trunkThickVar;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(trunkTop, trunkBot, trunkH, 6), this.materials.trunk);
        trunk.position.y = trunkH / 2; trunk.castShadow = true;
        // Slight random lean for natural variation
        trunk.rotation.z = (Math.random() - 0.5) * 0.15;
        trunk.rotation.x = (Math.random() - 0.5) * 0.1;
        group.add(trunk);

        // Per-tree leaf color variation — hue-shift the base color for uniqueness
        const leafMat = this._getVariedLeafMaterial(type);
        let radius = 1.6, canopyY = 3.5;
        if (type === 'oak') { radius = 2.2; canopyY = 4.0; }
        if (type === 'willow') { radius = 2.5; canopyY = 5.0; }
        radius *= scaleVar;
        canopyY *= heightVar;

        // Main canopy with vertex displacement for organic look
        const canopyGeo = new THREE.IcosahedronGeometry(radius, 1);
        this._displaceVertices(canopyGeo, type === 'willow' ? 0.35 : type === 'oak' ? 0.3 : 0.25);
        const canopy = new THREE.Mesh(canopyGeo, leafMat);
        canopy.position.y = canopyY; canopy.castShadow = true; group.add(canopy);

        // Secondary canopy blob offset to break the sphere silhouette
        const subRadius = radius * (0.5 + Math.random() * 0.2);
        const subGeo = new THREE.IcosahedronGeometry(subRadius, 1);
        this._displaceVertices(subGeo, 0.2);
        const subCanopy = new THREE.Mesh(subGeo, leafMat);
        const subAngle = Math.random() * Math.PI * 2;
        subCanopy.position.set(
            Math.cos(subAngle) * radius * 0.5,
            canopyY - 0.3 - Math.random() * 0.5,
            Math.sin(subAngle) * radius * 0.5
        );
        subCanopy.castShadow = true; group.add(subCanopy);

        // Third canopy blob for fuller, more distinct silhouette
        const sub2Radius = radius * (0.35 + Math.random() * 0.2);
        const sub2Geo = new THREE.IcosahedronGeometry(sub2Radius, 1);
        this._displaceVertices(sub2Geo, 0.18);
        const sub2Canopy = new THREE.Mesh(sub2Geo, leafMat);
        const sub2Angle = subAngle + Math.PI * (0.6 + Math.random() * 0.8);
        sub2Canopy.position.set(
            Math.cos(sub2Angle) * radius * 0.45,
            canopyY + 0.2 + Math.random() * 0.4,
            Math.sin(sub2Angle) * radius * 0.45
        );
        sub2Canopy.castShadow = true; group.add(sub2Canopy);

        // Root bumps at the base (vary count 2-4)
        const rootCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < rootCount; i++) {
            const angle = (i / rootCount) * Math.PI * 2 + Math.random() * 0.6;
            const rootLen = 0.4 + Math.random() * 0.3;
            const root = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.09 * trunkThickVar, rootLen, 4), this.materials.trunk
            );
            root.position.set(Math.cos(angle) * 0.22, 0.1, Math.sin(angle) * 0.22);
            root.rotation.z = Math.cos(angle) * 0.7;
            root.rotation.x = Math.sin(angle) * 0.7;
            group.add(root);
        }

        if (type === 'willow') {
            const strandCount = 6 + Math.floor(Math.random() * 5); // 6-10 strands
            for (let i = 0; i < strandCount; i++) {
                const a = (i / strandCount) * Math.PI * 2 + Math.random() * 0.3;
                const strandLen = 1.5 + Math.random() * 1.2;
                const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.008, strandLen, 3), leafMat);
                b.position.set(Math.cos(a) * radius * 0.72, canopyY - 0.5, Math.sin(a) * radius * 0.72);
                b.rotation.z = Math.cos(a) * 0.35; b.rotation.x = Math.sin(a) * 0.35; group.add(b);
            }
        }

        if (type === 'oak') {
            // Oak gets low branches for character
            for (let i = 0; i < 2; i++) {
                const brAngle = Math.random() * Math.PI * 2;
                const brLen = 0.8 + Math.random() * 0.6;
                const branch = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.04, 0.08, brLen, 4), this.materials.trunk
                );
                branch.position.set(
                    Math.cos(brAngle) * 0.15, trunkH * 0.6 + Math.random() * 0.5, Math.sin(brAngle) * 0.15
                );
                branch.rotation.z = Math.cos(brAngle) * 0.8;
                branch.rotation.x = Math.sin(brAngle) * 0.8;
                group.add(branch);
            }
        }

        const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * trunkThickVar, 0.3 * trunkThickVar, 0.5, 6), this.materials.stump);
        stump.position.y = 0.25; stump.visible = false; stump.name = 'stump'; group.add(stump);

        const names = { normal: 'Tree', oak: 'Oak tree', willow: 'Willow tree' };
        group.userData = { type: 'tree', subType: type, interactable: true, name: names[type] || 'Tree' };
        return group;
    }

    _buildPalmTree() {
        const group = new THREE.Group();
        const trunkH = 5 + Math.random() * 1.5;
        // Curved trunk — 5 segments with slight lean
        const segments = 5;
        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const segH = trunkH / segments;
            const topR = 0.12 - t * 0.03;
            const botR = 0.16 - t * 0.03;
            const seg = new THREE.Mesh(
                new THREE.CylinderGeometry(topR, botR, segH, 5),
                this.materials.palmTrunk
            );
            seg.position.y = t * trunkH + segH / 2;
            seg.rotation.z = Math.sin(t * 1.5) * 0.12;
            seg.castShadow = true;
            group.add(seg);
        }
        // Fronds from top
        const frondCount = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < frondCount; i++) {
            const angle = (i / frondCount) * Math.PI * 2 + Math.random() * 0.3;
            const frond = new THREE.Mesh(
                new THREE.PlaneGeometry(0.6, 2.8),
                this.materials.palmLeaf
            );
            frond.position.set(
                Math.cos(angle) * 0.6,
                trunkH,
                Math.sin(angle) * 0.6
            );
            frond.rotation.set(-0.7 - Math.random() * 0.3, angle, 0);
            frond.castShadow = true;
            group.add(frond);
        }
        // Small coconut cluster at top
        for (let i = 0; i < 2; i++) {
            const coconut = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 4, 3),
                this.materials.palmTrunk
            );
            const a = Math.random() * Math.PI * 2;
            coconut.position.set(Math.cos(a) * 0.15, trunkH - 0.2, Math.sin(a) * 0.15);
            group.add(coconut);
        }
        group.userData = { type: 'tree', subType: 'palm', interactable: true, name: 'Palm tree' };
        return group;
    }

    /** Returns a cached material instance for the given properties. Avoids duplicate allocations. */
    getCachedMaterial(color, roughness = 0.8, metalness = 0, extras = {}) {
        const key = `${color}_${roughness}_${metalness}_${extras.emissive || 0}_${extras.emissiveIntensity || 0}_${extras.side || 0}_${extras.wireframe || 0}_${extras.transparent || 0}_${extras.opacity || 1}`;
        if (this._matCache.has(key)) return this._matCache.get(key);
        const opts = { color, roughness, metalness };
        if (extras.emissive) { opts.emissive = extras.emissive; opts.emissiveIntensity = extras.emissiveIntensity || 1; }
        if (extras.side) opts.side = extras.side;
        if (extras.wireframe) opts.wireframe = true;
        if (extras.transparent) { opts.transparent = true; opts.opacity = extras.opacity ?? 0.8; }
        const mat = new THREE.MeshStandardMaterial(opts);
        this._matCache.set(key, mat);
        return mat;
    }

    /** Pick a pre-generated leaf material from the pool — avoids per-tree allocation */
    _getVariedLeafMaterial(type) {
        const pool = this._leafMaterials[type] || this._leafMaterials.normal;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    /** Randomly displace vertices for organic look */
    _displaceVertices(geo, amount) {
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * amount);
            pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * amount);
            pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * amount);
        }
        geo.computeVertexNormals();
    }

    createRock(type = 'copper') {
        const group = new THREE.Group();
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 0), this.materials.stoneGray);
        rock.position.y = 0.5; rock.castShadow = true; rock.scale.y = 0.7;
        rock.name = 'mainRock'; group.add(rock);

        const oreNames = { copper: 'copperOre', tin: 'tinOre', iron: 'ironOre', coal: 'coalOre', mithril: 'mithrilOre', adamant: 'adamantOre', runite: 'runiteOre', obsidian: 'obsidianOre' };
        const oreMat = this.materials[oreNames[type]] || this.materials[type + 'Ore'] || this.materials.copperOre;
        for (let i = 0; i < 4; i++) {
            const vein = new THREE.Mesh(new THREE.SphereGeometry(0.12, 4, 3), oreMat);
            const a = (i / 4) * Math.PI * 2 + Math.random() * 0.5;
            const r = 0.5 + Math.random() * 0.2;
            vein.position.set(Math.cos(a) * r, 0.3 + Math.random() * 0.4, Math.sin(a) * r);
            vein.name = 'vein'; group.add(vein);
        }

        // Secondary rocks clustered around the base
        for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 0.6 + Math.random() * 0.4;
            const subRock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.15, 0), this.materials.stoneGray
            );
            subRock.position.set(Math.cos(angle) * dist, 0.12, Math.sin(angle) * dist);
            subRock.scale.set(0.8 + Math.random() * 0.4, 0.4 + Math.random() * 0.3, 0.8 + Math.random() * 0.4);
            subRock.rotation.y = Math.random() * Math.PI;
            subRock.name = 'vein'; group.add(subRock); // named 'vein' so it hides with the main rock
        }

        // Ground rubble
        for (let i = 0; i < 4; i++) {
            const rubble = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.03, 0.08), this.materials.stoneGray
            );
            rubble.position.set((Math.random() - 0.5) * 1.4, 0.02, (Math.random() - 0.5) * 1.4);
            rubble.rotation.y = Math.random() * Math.PI;
            rubble.name = 'vein'; group.add(rubble);
        }

        const depleted = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 0), this.materials.depletedRock);
        depleted.position.y = 0.3; depleted.scale.y = 0.5; depleted.visible = false; depleted.name = 'depleted'; group.add(depleted);

        const names = { copper: 'Copper rock', tin: 'Tin rock', iron: 'Iron rock', coal: 'Coal rock', mithril: 'Mithril rock', adamant: 'Adamantite rock', runite: 'Runite rock', obsidian: 'Obsidian rock' };
        group.userData = { type: 'rock', subType: type, interactable: true, name: names[type] || 'Rock' };
        return group;
    }

    // ── LOD Creators ──────────────────────────────────────────────────

    /**
     * Creates a THREE.LOD for trees:
     *   LOD 0 (0-30u):  full tree (createTree)
     *   LOD 1 (30-80u): single trunk + single canopy blob
     *   LOD 2 (80+u):   flat billboard quad
     */
    createTreeLOD(type = 'normal') {
        if (type === 'palm') {
            const lod = new THREE.LOD();
            const full = this._buildPalmTree();
            lod.addLevel(full, 0);
            // LOD 1 — simple trunk + green blob
            const mid = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 5, 4), this.materials.palmTrunk);
            trunk.position.y = 2.5; trunk.castShadow = true; mid.add(trunk);
            const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.5, 4, 3), this.materials.palmLeaf);
            canopy.position.y = 5; canopy.scale.y = 0.5; mid.add(canopy);
            mid.userData = { ...full.userData };
            lod.addLevel(mid, 30);
            // LOD 2 — billboard
            const far = new THREE.Group();
            const billboard = new THREE.Mesh(
                new THREE.PlaneGeometry(3, 6),
                new THREE.MeshBasicMaterial({ color: 0x3B7A35, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
            );
            billboard.position.y = 3; far.add(billboard);
            far.userData = { ...full.userData };
            lod.addLevel(far, 80);
            lod.userData = { ...full.userData };
            return lod;
        }

        const lod = new THREE.LOD();

        // LOD 0 — full detail
        const full = this.createTree(type);
        lod.addLevel(full, 0);

        // LOD 1 — simplified: trunk + 1 canopy
        const mid = new THREE.Group();
        const trunkH = type === 'willow' ? 4 : 3;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.22, trunkH, 4),
            this.materials.trunk
        );
        trunk.position.y = trunkH / 2;
        trunk.castShadow = true;
        mid.add(trunk);

        const leafMat = this._getVariedLeafMaterial(type);
        const r = type === 'oak' ? 2.2 : type === 'willow' ? 2.5 : 1.6;
        const cy = type === 'oak' ? 4 : type === 'willow' ? 5 : 3.5;
        const canopy = new THREE.Mesh(
            new THREE.IcosahedronGeometry(r, 0), // detail 0 for fewer tris
            leafMat
        );
        canopy.position.y = cy;
        canopy.castShadow = true;
        mid.add(canopy);

        // Stump (hidden, needed for resource interaction)
        const stump = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.3, 0.5, 4),
            this.materials.stump
        );
        stump.position.y = 0.25;
        stump.visible = false;
        stump.name = 'stump';
        mid.add(stump);

        // Copy userData from full tree
        mid.userData = { ...full.userData };
        lod.addLevel(mid, 30);

        // LOD 2 — billboard quad
        const far = new THREE.Group();
        const billColor = type === 'oak' ? 0x1B6B2A : type === 'willow' ? 0x4AA84C : 0x2D8C3C;
        const billboard = new THREE.Mesh(
            new THREE.PlaneGeometry(r * 2.2, trunkH + r * 1.4),
            new THREE.MeshBasicMaterial({ color: billColor, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
        );
        billboard.position.y = (trunkH + r) / 2 + 0.5;
        far.add(billboard);

        // Hidden stump for resource node
        const stumpFar = stump.clone();
        far.add(stumpFar);
        far.userData = { ...full.userData };
        lod.addLevel(far, 80);

        // Propagate userData to LOD itself for entity system
        lod.userData = { ...full.userData };
        return lod;
    }

    /**
     * Creates a THREE.LOD for rocks:
     *   LOD 0 (0-30u):  full rock (createRock)
     *   LOD 1 (30+u):   single dodecahedron with ore tint
     */
    createRockLOD(type = 'copper') {
        const lod = new THREE.LOD();

        // LOD 0 — full detail
        const full = this.createRock(type);
        lod.addLevel(full, 0);

        // LOD 1 — single simplified rock
        const mid = new THREE.Group();
        const oreColors = {
            copper: 0x997755, tin: 0xAAAA99, iron: 0x887766, coal: 0x444444,
            mithril: 0x445577, adamant: 0x447744, runite: 0x559999,
            obsidian: 0x333333,
        };
        const blendColor = oreColors[type] || 0x888888;
        const simpleRock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.8, 0),
            this.getCachedMaterial(blendColor, 0.9)
        );
        simpleRock.position.y = 0.5;
        simpleRock.scale.y = 0.7;
        simpleRock.castShadow = true;
        mid.add(simpleRock);

        // Depleted state mesh (hidden)
        const depleted = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.6, 0),
            this.materials.depletedRock
        );
        depleted.position.y = 0.3;
        depleted.scale.y = 0.5;
        depleted.visible = false;
        depleted.name = 'depleted';
        mid.add(depleted);

        mid.userData = { ...full.userData };
        lod.addLevel(mid, 30);

        lod.userData = { ...full.userData };
        return lod;
    }

    /**
     * Creates a THREE.LOD for buildings:
     *   LOD 0 (0-40u):  full building (createBuilding)
     *   LOD 1 (40+u):   single tinted box
     */
    createBuildingLOD(type) {
        const lod = new THREE.LOD();

        // LOD 0 — full detail
        const full = this.createBuilding(type);
        lod.addLevel(full, 0);

        // LOD 1 — simple box
        const buildingDims = {
            house:   { w: 6, h: 4, d: 5, color: 0x8B6914 },
            shop:    { w: 6, h: 4, d: 5, color: 0x8B6914 },
            castle:  { w: 12, h: 10, d: 10, color: 0xAAAAAA },
            tavern:  { w: 8, h: 4, d: 7, color: 0x8B6914 },
            church:  { w: 5, h: 6, d: 7, color: 0xEEEEDD },
            furnace: { w: 2, h: 3, d: 2, color: 0x8B4513 },
            anvil:   { w: 1, h: 0.8, d: 0.6, color: 0x555555 },
            desert_house:  { w: 5, h: 3, d: 4, color: 0xD2B48C },
            desert_palace: { w: 10, h: 5, d: 8, color: 0xD2B48C },
        };
        const dims = buildingDims[type] || { w: 6, h: 4, d: 5, color: 0x8B6914 };

        const simple = new THREE.Mesh(
            new THREE.BoxGeometry(dims.w, dims.h, dims.d),
            this.getCachedMaterial(dims.color, 0.9)
        );
        simple.position.y = dims.h / 2;
        simple.castShadow = true;
        simple.receiveShadow = true;

        const simpleGroup = new THREE.Group();
        simpleGroup.add(simple);
        simpleGroup.userData = { ...full.userData };
        lod.addLevel(simpleGroup, 40);

        lod.userData = { ...full.userData };
        return lod;
    }

    createMonster(type = 'chicken') {
        const group = new THREE.Group();
        const b = { chicken: '_buildChicken', cow: '_buildCow', rat: '_buildRat', goblin: '_buildGoblin',
            skeleton: '_buildSkeleton', skeleton_weak: '_buildSkeleton', giant_spider: '_buildSpider', dark_wizard: '_buildDarkWizard',
            lesser_demon: '_buildDemon', kbd: '_buildKBD',
            moss_giant: '_buildMossGiant', shadow_warrior: '_buildShadowWarrior', demon_lord: '_buildDemonLord',
            scorpion: '_buildScorpion', giant_frog: '_buildGiantFrog', ice_wolf: '_buildIceWolf',
            giant_crab: '_buildGiantCrab',
            fire_elemental: '_buildFireElemental', desert_guard: '_buildDesertGuard', sea_serpent: '_buildSeaSerpent' };
        if (b[type]) this[b[type]](group);

        const names = { chicken: 'Chicken', cow: 'Cow', rat: 'Giant Rat', goblin: 'Goblin',
            skeleton: 'Skeleton', skeleton_weak: 'Skeleton', giant_spider: 'Giant Spider', dark_wizard: 'Dark Wizard',
            lesser_demon: 'Lesser Demon', kbd: 'King Black Dragon',
            moss_giant: 'Moss Giant', shadow_warrior: 'Shadow Warrior', demon_lord: 'Demon Lord',
            scorpion: 'Scorpion', giant_frog: 'Giant Frog', ice_wolf: 'Ice Wolf',
            giant_crab: 'Giant Crab',
            fire_elemental: 'Fire Elemental', desert_guard: 'Desert Guard', sea_serpent: 'Sea Serpent' };
        group.userData = { type: 'monster', subType: type, interactable: true, name: names[type] || type };
        return group;
    }

    _buildChicken(g) {
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 5), this.materials.chickenBody);
        body.position.y = 0.5; body.scale.set(1, 0.8, 1.2); body.castShadow = true; g.add(body);
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.18, 5, 4), this.materials.chickenBody), 0, 0.8, -0.3));
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 4), this.materials.chickenBeak);
        beak.position.set(0, 0.75, -0.5); beak.rotation.x = -Math.PI / 2; g.add(beak);
        const comb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.1), this.materials.chickenComb);
        comb.position.set(0, 0.95, -0.28); g.add(comb);
        for (let s = -1; s <= 1; s += 2) {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4), this.materials.chickenBeak);
            leg.position.set(s * 0.12, 0.15, 0); g.add(leg);
        }
    }

    _buildCow(g) {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 1.4), this.materials.cowBody);
        body.position.y = 1.0; body.castShadow = true; g.add(body);
        for (let i = 0; i < 3; i++) {
            const spot = new THREE.Mesh(new THREE.SphereGeometry(0.15, 4, 3), this.materials.cowSpots);
            spot.position.set((Math.random()-0.5)*0.5, 1+(Math.random()-0.5)*0.3, (Math.random()-0.5)*0.8);
            spot.scale.y = 0.3; g.add(spot);
        }
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), this.materials.cowBody);
        head.position.set(0, 1.2, -0.9); g.add(head);
        for (let s = -1; s <= 1; s += 2) {
            const horn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 4), this.materials.boneMat);
            horn.position.set(s * 0.15, 1.5, -0.9); g.add(horn);
        }
        for (let s = -1; s <= 1; s += 2) for (let f = -1; f <= 1; f += 2) {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.6, 5), this.materials.cowSpots);
            leg.position.set(s * 0.25, 0.3, f * 0.5); g.add(leg);
        }
    }

    _buildRat(g) {
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), this.materials.ratBody);
        body.position.set(0, 0.35, 0); body.scale.set(1, 0.7, 1.4); body.castShadow = true; g.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 5, 4), this.materials.ratBody);
        head.position.set(0, 0.35, -0.4); g.add(head);
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 3, 2), this.materials.pinkNose);
        nose.position.set(0, 0.32, -0.55); g.add(nose);
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.01, 0.5, 4), this.materials.ratBody);
        tail.position.set(0, 0.3, 0.5); tail.rotation.x = 0.5; g.add(tail);
        const em = this.materials.redEyes;
        for (let s = -1; s <= 1; s += 2) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 3, 2), em);
            eye.position.set(s * 0.08, 0.4, -0.48); g.add(eye);
        }
    }

    _buildGoblin(g) {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), this.materials.goblinCloth);
        body.position.y = 0.8; body.castShadow = true; g.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 5), this.materials.goblinSkin);
        head.position.y = 1.4; head.scale.set(1, 0.9, 0.9); g.add(head);
        const em = this.materials.redEyes;
        for (let s = -1; s <= 1; s += 2) {
            g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 3), em), s * 0.1, 1.45, -0.22));
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.5, 5), this.materials.goblinSkin);
            arm.position.set(s * 0.35, 0.75, 0); arm.rotation.z = s * 0.3; g.add(arm);
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.5, 5), this.materials.goblinSkin);
            leg.position.set(s * 0.12, 0.25, 0); g.add(leg);
        }
        const wpn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.01, 0.7, 4), this.materials.trunk);
        wpn.position.set(0.4, 0.9, -0.1); wpn.rotation.z = -0.5; g.add(wpn);
        // Small round shield on left arm
        const shield = new THREE.Mesh(new THREE.CircleGeometry(0.15, 6), this.materials.goblinCloth);
        shield.position.set(-0.42, 0.85, -0.1); shield.rotation.y = Math.PI * 0.4; g.add(shield);
        const shieldRim = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.16, 6), this.materials.trunk);
        shieldRim.position.set(-0.42, 0.85, -0.09); shieldRim.rotation.y = Math.PI * 0.4; g.add(shieldRim);
    }

    _buildSkeleton(g) {
        const m = this.materials.skeletonMat;
        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), m);
        skull.position.y = 1.8; skull.scale.set(1, 1.1, 0.9); g.add(skull);
        const em = this.materials.skeletonEyes;
        for (let s = -1; s <= 1; s += 2) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 3), em), s * 0.08, 1.83, -0.18));
        g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 4), m), 0, 1.2, 0));
        const ribs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.25), m);
        ribs.position.y = 1.1; ribs.castShadow = true; g.add(ribs);
        for (let s = -1; s <= 1; s += 2) {
            const ua = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4), m);
            ua.position.set(s * 0.35, 1.15, 0); ua.rotation.z = s * 0.3; g.add(ua);
            const la = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 4), m);
            la.position.set(s * 0.5, 0.85, 0); la.rotation.z = s * 0.5; g.add(la);
        }
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.2), m), 0, 0.7, 0));
        for (let s = -1; s <= 1; s += 2) {
            g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.4, 4), m), s * 0.12, 0.45, 0));
            g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 4), m), s * 0.12, 0.1, 0));
        }
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.02), this.materials.skeletonSword);
        blade.position.set(0.55, 1.0, -0.1); blade.rotation.z = -0.4; g.add(blade);
    }

    _buildSpider(g) {
        const m = this.materials.spiderMat;
        const ab = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 5), m);
        ab.position.set(0, 0.6, 0.3); ab.scale.set(1, 0.7, 1.3); ab.castShadow = true; g.add(ab);
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 5), m), 0, 0.55, -0.5));
        for (let i = 0; i < 4; i++) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 3, 2), this.materials.spiderEyeMat);
            eye.position.set((i%2===0?-1:1)*(0.06+Math.floor(i/2)*0.06), 0.6+Math.floor(i/2)*0.05, -0.82); g.add(eye);
        }
        for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 4; i++) {
            const a = (i-1.5)*0.35;
            const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.8, 4), m);
            seg.position.set(s*(0.3+Math.abs(a)*0.3), 0.5, -0.2+a*0.8); seg.rotation.z = s*(0.8+Math.abs(a)*0.2); seg.rotation.y = a; g.add(seg);
            const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.015, 0.6, 4), m);
            s2.position.set(s*(0.7+Math.abs(a)*0.4), 0.15, -0.2+a*1.0); s2.rotation.z = s*0.2; g.add(s2);
        }
    }

    _buildDarkWizard(g) {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 1.2, 6), this.materials.wizardRobe);
        body.position.y = 0.6; body.castShadow = true; g.add(body);
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 5), this.materials.npcSkin), 0, 1.5, 0));
        g.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 6), this.materials.wizardRobe), 0, 1.9, 0));
        const em = this.materials.wizardRedEyes;
        for (let s = -1; s <= 1; s += 2) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.03, 3, 2), em), s * 0.07, 1.52, -0.17));
        g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 5), this.materials.trunk), 0.4, 0.9, 0));
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), this.materials.wizardOrb), 0.4, 1.9, 0));
    }

    _buildDemon(g) {
        const m = this.materials.demonBody;
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.5), m);
        body.position.y = 1.4; body.castShadow = true; g.add(body);
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), m), 0, 2.3, 0));
        for (let s = -1; s <= 1; s += 2) {
            const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 4), this.materials.demonHorn);
            horn.position.set(s * 0.15, 2.6, 0); horn.rotation.z = s * -0.3; g.add(horn);
        }
        for (let s = -1; s <= 1; s += 2) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 3), this.materials.demonYellowEyes), s * 0.1, 2.35, -0.25));
        for (let s = -1; s <= 1; s += 2) {
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.8, 5), m);
            arm.position.set(s * 0.55, 1.4, 0); arm.rotation.z = s * 0.3; g.add(arm);
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.8, 5), m);
            leg.position.set(s * 0.2, 0.4, 0); g.add(leg);
        }
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 1.2, 4), m);
        tail.position.set(0, 1.0, 0.5); tail.rotation.x = -0.5; g.add(tail);
    }

    _buildKBD(g) {
        const m = this.materials.dragonBody;
        const body = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), m);
        body.position.y = 2.0; body.scale.set(1, 0.7, 1.5); body.castShadow = true; g.add(body);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.8), m);
        head.position.set(0, 2.5, -1.8); g.add(head);
        const snout = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 5), m);
        snout.position.set(0, 2.3, -2.3); snout.rotation.x = -Math.PI / 2; g.add(snout);
        for (let s = -1; s <= 1; s += 2) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 3), this.materials.kbdRedEyes), s * 0.15, 2.6, -2.0));
        for (let s = -1; s <= 1; s += 2) g.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 4), this.materials.boneMat), s * 0.25, 3.0, -1.7));
        for (let s = -1; s <= 1; s += 2) {
            const ws = new THREE.Shape(); ws.moveTo(0, 0); ws.lineTo(2, 1.5); ws.lineTo(1.5, 0.5); ws.lineTo(2.5, 0); ws.lineTo(0, -0.5);
            const wing = new THREE.Mesh(new THREE.ShapeGeometry(ws), this.materials.dragonWing);
            wing.position.set(s * 0.8, 2.5, 0); wing.rotation.y = s * -Math.PI / 2; wing.rotation.z = s * 0.2; wing.scale.x = s; g.add(wing);
        }
        for (let s = -1; s <= 1; s += 2) for (let f = -1; f <= 1; f += 2) {
            g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 1.2, 5), m), s * 0.6, 0.6, f * 0.8));
        }
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.04, 2.5, 5), m);
        tail.position.set(0, 1.5, 2.0); tail.rotation.x = -0.4; g.add(tail);
    }

    _buildMossGiant(g) {
        const m = this.materials.mossGiant;
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 0.7), m);
        body.position.y = 1.8; body.castShadow = true; g.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 5), m);
        head.position.y = 2.9; g.add(head);
        for (let s = -1; s <= 1; s += 2) {
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 1.0, 5), m);
            arm.position.set(s * 0.65, 1.6, 0); arm.rotation.z = s * 0.2; g.add(arm);
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 1.0, 5), m);
            leg.position.set(s * 0.25, 0.5, 0); g.add(leg);
        }
        // Club
        const club = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.2, 4), this.materials.trunk);
        club.position.set(0.7, 1.8, -0.2); club.rotation.z = -0.4; g.add(club);
    }

    _buildShadowWarrior(g) {
        const m = this.materials.shadowWarrior;
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.3), m);
        body.position.y = 1.3; body.castShadow = true; g.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 5), m);
        head.position.y = 2.1; g.add(head);
        for (let s = -1; s <= 1; s += 2) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 3), this.materials.shadowEyes), s * 0.09, 2.15, -0.2));
        for (let s = -1; s <= 1; s += 2) {
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.7, 5), m);
            arm.position.set(s * 0.4, 1.2, 0); arm.rotation.z = s * 0.2; g.add(arm);
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.7, 5), m);
            leg.position.set(s * 0.15, 0.45, 0); g.add(leg);
        }
        // Dark blade
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 0.02), this.materials.shadowBlade);
        blade.position.set(0.45, 1.5, -0.1); blade.rotation.z = -0.3; g.add(blade);
    }

    _buildDemonLord(g) {
        const m = this.materials.demonLord;
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 0.6), m);
        body.position.y = 1.8; body.castShadow = true; g.add(body);
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 5), m), 0, 2.8, 0));
        // Horns
        for (let s = -1; s <= 1; s += 2) {
            const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.6, 4), this.materials.demonLordHorn);
            horn.position.set(s * 0.2, 3.2, 0); horn.rotation.z = s * -0.3; g.add(horn);
        }
        // Glowing eyes
        for (let s = -1; s <= 1; s += 2) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 3), this.materials.demonLordEyes), s * 0.12, 2.85, -0.3));
        // Arms and legs
        for (let s = -1; s <= 1; s += 2) {
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 1.0, 5), m);
            arm.position.set(s * 0.65, 1.7, 0); arm.rotation.z = s * 0.3; g.add(arm);
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 1.0, 5), m);
            leg.position.set(s * 0.25, 0.5, 0); g.add(leg);
        }
        // Wings (smaller than KBD)
        for (let s = -1; s <= 1; s += 2) {
            const ws = new THREE.Shape(); ws.moveTo(0, 0); ws.lineTo(1.2, 0.8); ws.lineTo(0.8, 0.2); ws.lineTo(1.5, 0); ws.lineTo(0, -0.3);
            const wing = new THREE.Mesh(new THREE.ShapeGeometry(ws), this.materials.demonLordWing);
            wing.position.set(s * 0.5, 2.2, 0.2); wing.rotation.y = s * -Math.PI / 2; wing.scale.x = s; g.add(wing);
        }
        // Tail
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.03, 1.5, 4), m);
        tail.position.set(0, 1.2, 0.6); tail.rotation.x = -0.5; g.add(tail);
        // Fire aura
        g.add(at(new THREE.PointLight(0xFF4400, 1.2, 10), 0, 2.5, 0));
    }

    _buildScorpion(g) {
        const m = this.materials.scorpionBody;
        // Body
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 5, 4), m);
        body.position.y = 0.3; body.scale.set(1, 0.6, 1.2); g.add(body);
        // Tail (curved up)
        for (let i = 0; i < 4; i++) {
            const seg = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 3), m);
            seg.position.set(0, 0.5 + i * 0.25, -0.3 - i * 0.15); g.add(seg);
        }
        // Stinger
        const sting = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 4), this.materials.demonHorn);
        sting.position.set(0, 1.45, -0.75); sting.rotation.x = Math.PI; g.add(sting);
        // Pincers
        for (let s = -1; s <= 1; s += 2) {
            const pincer = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.3), m);
            pincer.position.set(s * 0.35, 0.3, -0.5); g.add(pincer);
        }
    }

    _buildGiantFrog(g) {
        const m = this.materials.giantFrogBody;
        // Body (round)
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), m);
        body.position.y = 0.5; body.scale.set(1, 0.8, 1.1); g.add(body);
        // Eyes (on top)
        const eyeMat = this.materials.giantFrogEye;
        for (let s = -1; s <= 1; s += 2) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 3), eyeMat);
            eye.position.set(s * 0.2, 0.95, -0.3); g.add(eye);
        }
        // Legs (back, larger)
        for (let s = -1; s <= 1; s += 2) {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.5, 4), m);
            leg.position.set(s * 0.4, 0.15, 0.2); leg.rotation.z = s * 0.4; g.add(leg);
        }
    }

    _buildIceWolf(g) {
        const m = this.materials.iceWolfBody;
        // Body (horizontal)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1.0), m);
        body.position.set(0, 0.6, 0); g.add(body);
        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.4), m);
        head.position.set(0, 0.75, -0.6); g.add(head);
        // Snout
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.2), m), 0, 0.65, -0.85));
        // Eyes (blue glow)
        const em = this.materials.iceWolfEye;
        for (let s = -1; s <= 1; s += 2) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.04, 3, 2), em), s * 0.1, 0.8, -0.75));
        // Legs
        for (let s = -1; s <= 1; s += 2) {
            for (let fz of [-0.3, 0.3]) {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.5, 4), m);
                leg.position.set(s * 0.2, 0.25, fz); g.add(leg);
            }
        }
        // Tail
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.5, 4), m);
        tail.position.set(0, 0.7, 0.6); tail.rotation.x = -0.7; g.add(tail);
    }

    _buildGiantCrab(g) {
        // Flattened sphere body
        const bodyMat = this.materials.crabBody;
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), bodyMat);
        body.scale.y = 0.5;
        body.position.y = 0.4;
        body.castShadow = true;
        g.add(body);

        // 6 legs (3 per side)
        const legMat = this.materials.crabLeg;
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 3; i++) {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.4, 4), legMat);
                const angle = (i - 1) * 0.5;
                leg.position.set(side * 0.4, 0.2, angle * 0.3);
                leg.rotation.z = side * 0.6;
                g.add(leg);
            }
        }

        // 2 claws
        const clawMat = this.materials.crabClaw;
        for (let side = -1; side <= 1; side += 2) {
            // Claw arm
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.35, 4), clawMat);
            arm.position.set(side * 0.35, 0.35, 0.35);
            arm.rotation.z = side * 0.3;
            g.add(arm);

            // Claw pincer (upper)
            const pincer1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.15), clawMat);
            pincer1.position.set(side * 0.4, 0.45, 0.5);
            g.add(pincer1);

            // Claw pincer (lower)
            const pincer2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.12), clawMat);
            pincer2.position.set(side * 0.4, 0.38, 0.48);
            g.add(pincer2);
        }

        // Eye stalks
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const stalkMat = this.materials.crabStalk;
        for (let side = -1; side <= 1; side += 2) {
            const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 4), stalkMat);
            stalk.position.set(side * 0.12, 0.55, 0.2);
            g.add(stalk);
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 3), eyeMat);
            eye.position.set(side * 0.12, 0.63, 0.2);
            g.add(eye);
        }
    }

    _buildFireElemental(g) {
        // Floating body
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), this.materials.fireElementalBody);
        body.position.y = 1.2; body.castShadow = true; g.add(body);
        // Inner core
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 5), this.materials.fireElementalCore);
        core.position.y = 1.2; g.add(core);
        // Flame cones
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const flame = new THREE.Mesh(
                new THREE.ConeGeometry(0.15, 0.5, 4),
                this.materials.flameMat
            );
            flame.position.set(Math.cos(angle) * 0.4, 1.0 + Math.random() * 0.4, Math.sin(angle) * 0.4);
            flame.rotation.z = Math.cos(angle) * 0.5;
            flame.rotation.x = Math.sin(angle) * 0.5;
            g.add(flame);
        }
        // Eyes
        for (let s = -1; s <= 1; s += 2) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 3), this.materials.redEyes);
            eye.position.set(s * 0.15, 1.35, -0.4); g.add(eye);
        }
    }

    _buildDesertGuard(g) {
        // Body/armor
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), this.materials.desertGuardArmor);
        body.position.y = 1.0; body.castShadow = true; g.add(body);
        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 5), this.materials.npcSkin);
        head.position.y = 1.7; g.add(head);
        // Helmet
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2), this.materials.desertGuardArmor);
        helmet.position.y = 1.75; g.add(helmet);
        // Legs
        for (let s = -1; s <= 1; s += 2) {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.6, 5), this.materials.npcPants);
            leg.position.set(s * 0.15, 0.3, 0); g.add(leg);
        }
        // Arms
        for (let s = -1; s <= 1; s += 2) {
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 5), this.materials.npcSkin);
            arm.position.set(s * 0.4, 1.0, 0); g.add(arm);
        }
        // Sword
        const sword = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 0.02), this.materials.metalDark);
        sword.position.set(0.45, 0.8, -0.05); g.add(sword);
    }

    _buildSeaSerpent(g) {
        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 7, 5), this.materials.seaSerpentBody);
        head.position.set(0, 0.8, -0.5); head.castShadow = true; g.add(head);
        // Body segment 1
        const seg1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 7, 5), this.materials.seaSerpentBody);
        seg1.position.set(0, 0.6, 0.3); seg1.scale.set(1, 0.8, 1.2); g.add(seg1);
        // Body segment 2 (tail)
        const seg2 = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 4), this.materials.seaSerpentBody);
        seg2.position.set(0, 0.5, 1.1); seg2.scale.set(0.8, 0.7, 1.3); g.add(seg2);
        // Tail fin
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 3), this.materials.seaSerpentBody);
        fin.position.set(0, 0.5, 1.7); fin.rotation.x = Math.PI / 2; g.add(fin);
        // Dorsal crest
        for (let i = 0; i < 3; i++) {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 3), this.materials.seaSerpentBody);
            spike.position.set(0, 1.0 - i * 0.1, -0.2 + i * 0.5);
            g.add(spike);
        }
        // Eyes
        for (let s = -1; s <= 1; s += 2) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 3), this.materials.seaSerpentEye);
            eye.position.set(s * 0.2, 0.95, -0.85); g.add(eye);
        }
    }

    // ── Pet Meshes ──
    createPet(petId) {
        const group = new THREE.Group();
        const petBuilders = {
            rock_golem: () => { this._buildRockGolemPet(group); },
            beaver: () => { this._buildBeaverPet(group); },
            heron: () => { this._buildHeronPet(group); },
            phoenix: () => { this._buildPhoenixPet(group); },
            rocky: () => { this._buildRockyPet(group); },
            kbd_jr: () => { this._buildKBD(group); group.scale.setScalar(0.3); },
            demon_jr: () => { this._buildDemonLord(group); group.scale.setScalar(0.3); },
            bloodhound: () => { this._buildBloodhoundPet(group); },
        };
        if (petBuilders[petId]) petBuilders[petId]();
        group.userData = { type: 'pet', petId };
        return group;
    }

    _buildRockGolemPet(g) {
        const m = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), m), 0, 0.3, 0));
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.15, 4, 3), m), 0, 0.55, 0));
        const em = new THREE.MeshStandardMaterial({ color: 0xFFAA00, emissive: 0xFF8800, emissiveIntensity: 0.8 });
        for (let s = -1; s <= 1; s += 2) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.03, 3, 2), em), s * 0.06, 0.58, -0.12));
    }

    _buildBeaverPet(g) {
        const m = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.85 });
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.35), m), 0, 0.2, 0));
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 3), m), 0, 0.35, -0.15));
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.25), new THREE.MeshStandardMaterial({ color: 0x5C4B1F })), 0, 0.1, 0.25));
    }

    _buildHeronPet(g) {
        const m = new THREE.MeshStandardMaterial({ color: 0xDDDDDD });
        g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), m), 0, 0.25, 0));
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 3), m), 0, 0.6, 0));
        g.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.15, 3), new THREE.MeshStandardMaterial({ color: 0xFFAA00 })), 0, 0.6, -0.1));
    }

    _buildPhoenixPet(g) {
        const m = new THREE.MeshStandardMaterial({ color: 0xFF4400, emissive: 0xFF2200, emissiveIntensity: 0.6 });
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.12, 5, 4), m), 0, 0.5, 0));
        g.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), m), 0, 0.7, 0));
    }

    _buildRockyPet(g) {
        const m = new THREE.MeshStandardMaterial({ color: 0x666666 });
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.3), m), 0, 0.2, 0));
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 3), m), 0, 0.4, -0.1));
        const mask = new THREE.MeshStandardMaterial({ color: 0x222222 });
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.05), mask), 0, 0.42, -0.15));
    }

    _buildBloodhoundPet(g) {
        const m = new THREE.MeshStandardMaterial({ color: 0xCC6633 });
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.4), m), 0, 0.25, 0));
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), m), 0, 0.35, -0.25));
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.1), new THREE.MeshStandardMaterial({ color: 0x333333 })), 0, 0.3, -0.35));
        for (let s = -1; s <= 1; s += 2) {
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.04), m), s * 0.06, 0.45, -0.22));
        }
    }

    // ── Biome Props ──
    createCactus() {
        const g = new THREE.Group();
        const m = new THREE.MeshStandardMaterial({ color: 0x2D8B2D, roughness: 0.8 });
        g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.5, 6), m), 0, 0.75, 0));
        g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.6, 5), m), 0.3, 0.9, 0));
        g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.5, 5), m), -0.25, 0.7, 0));
        return g;
    }

    createDeadTree() {
        const g = new THREE.Group();
        const m = new THREE.MeshStandardMaterial({ color: 0x3D2B1A, roughness: 0.95 });
        g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 2, 5), m), 0, 1, 0));
        g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.8, 4), m), 0.15, 1.8, 0));
        g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.6, 4), m), -0.2, 1.6, 0.1));
        return g;
    }

    createIceRock() {
        const g = new THREE.Group();
        const m = new THREE.MeshStandardMaterial({ color: 0xAABBDD, roughness: 0.3, transparent: true, opacity: 0.8 });
        g.add(at(new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), m), 0, 0.5, 0));
        g.add(at(new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), m), 0.4, 0.3, 0.2));
        return g;
    }

    createNPC(npcId) {
        const group = new THREE.Group();
        const mats = {
            hans: [this.materials.npcShirt, this.materials.npcPants, this.materials.npcHair],
            guide: [this.materials.guideRobe, this.materials.guideRobe, this.materials.npcHair],
            fred: [new THREE.MeshStandardMaterial({ color: 0x228B22 }), this.materials.npcPants, new THREE.MeshStandardMaterial({ color: 0xAA6633 })],
            general: [new THREE.MeshStandardMaterial({ color: 0x8844AA }), this.materials.npcPants, this.materials.npcHair],
            banker: [new THREE.MeshStandardMaterial({ color: 0x333333 }), new THREE.MeshStandardMaterial({ color: 0x333333 }), this.materials.npcHair],
            turael: [new THREE.MeshStandardMaterial({ color: 0xAA2222 }), this.materials.npcPants, new THREE.MeshStandardMaterial({ color: 0x888888 })],
            gen_graam: [this.materials.goblinCloth, this.materials.goblinCloth, this.materials.goblinSkin],
            oziach: [new THREE.MeshStandardMaterial({ color: 0x6666AA }), this.materials.npcPants, new THREE.MeshStandardMaterial({ color: 0xCCCCCC })],
            fishing_tutor: [new THREE.MeshStandardMaterial({ color: 0x2266AA }), this.materials.npcPants, new THREE.MeshStandardMaterial({ color: 0x888888 })],
            bartender: [new THREE.MeshStandardMaterial({ color: 0xAA4444 }), new THREE.MeshStandardMaterial({ color: 0x222222 }), this.materials.npcHair],
            merchant: [new THREE.MeshStandardMaterial({ color: 0xCC8833 }), new THREE.MeshStandardMaterial({ color: 0x6B4226 }), new THREE.MeshStandardMaterial({ color: 0x111111 })],
            dungeon_guide: [new THREE.MeshStandardMaterial({ color: 0x444444 }), new THREE.MeshStandardMaterial({ color: 0x333333 }), new THREE.MeshStandardMaterial({ color: 0x666666 })],
            swamp_witch: [new THREE.MeshStandardMaterial({ color: 0x2D4A2D }), new THREE.MeshStandardMaterial({ color: 0x1A3A1A }), new THREE.MeshStandardMaterial({ color: 0x555555 })],
            ice_hermit: [new THREE.MeshStandardMaterial({ color: 0xAABBCC }), new THREE.MeshStandardMaterial({ color: 0x8899AA }), new THREE.MeshStandardMaterial({ color: 0xCCCCCC })],
            desert_merchant: [new THREE.MeshStandardMaterial({ color: 0xC2A050 }), new THREE.MeshStandardMaterial({ color: 0x8B6914 }), new THREE.MeshStandardMaterial({ color: 0x222222 })],
            archaeologist: [new THREE.MeshStandardMaterial({ color: 0x886644 }), new THREE.MeshStandardMaterial({ color: 0x554422 }), new THREE.MeshStandardMaterial({ color: 0x6B4226 })],
        };
        const [shirt, pants, hair] = mats[npcId] || [this.materials.npcShirt, this.materials.npcPants, this.materials.npcHair];
        this._buildHumanoidNPC(group, shirt, pants, hair);
        // ── Per-NPC accessories for visual variety ──

        if (npcId === 'hans') {
            // Chef hat (white cylinder + poofy top)
            const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.08, 8), new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.7 }));
            hatBrim.position.set(0, 1.92, 0); group.add(hatBrim);
            const hatTop = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.6 }));
            hatTop.position.set(0, 2.06, 0); hatTop.scale.y = 1.3; group.add(hatTop);
            // White apron (flat box on front of torso)
            const apron = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.5, 0.02), new THREE.MeshStandardMaterial({ color: 0xF0F0F0, roughness: 0.8 }));
            apron.position.set(0, 0.95, -0.14); group.add(apron);
        }

        if (npcId === 'guide') {
            // Staff with glowing orb
            group.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2, 5), this.materials.trunk), 0.5, 1.0, 0));
            group.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), new THREE.MeshStandardMaterial({ color: 0x44AAFF, emissive: 0x2266BB, emissiveIntensity: 0.5 })), 0.5, 2.1, 0));
            // Cape hanging from shoulders
            const capeMat = new THREE.MeshStandardMaterial({ color: 0x2244AA, side: THREE.DoubleSide, roughness: 0.9 });
            const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.7), capeMat);
            cape.position.set(0, 1.05, 0.16); cape.rotation.x = 0.1; group.add(cape);
        }

        if (npcId === 'turael') {
            // Sword on hip
            const sword = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.7, 0.02), new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.6 }));
            sword.position.set(0.45, 0.9, 0); sword.rotation.z = -0.2; group.add(sword);
            // Shoulder pads (small spheres)
            const padMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.3 });
            group.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 4), padMat), -0.32, 1.42, 0));
            group.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 4), padMat), 0.32, 1.42, 0));
        }

        if (npcId === 'fishing_tutor') {
            // Fishing rod
            const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.01, 1.8, 4), this.materials.trunk);
            rod.position.set(0.45, 1.2, 0); rod.rotation.z = -0.4; group.add(rod);
            // Line dangling from rod tip
            const line = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.6, 3), new THREE.MeshBasicMaterial({ color: 0xCCCCCC }));
            line.position.set(0.9, 1.8, 0); group.add(line);
            // Bucket in other hand
            const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.12, 6, 1, true), new THREE.MeshStandardMaterial({ color: 0x886644, roughness: 0.9 }));
            bucket.position.set(-0.4, 0.55, 0); group.add(bucket);
        }

        if (npcId === 'fred') {
            // Straw hat (flat wide brim + low crown)
            const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.03, 8), new THREE.MeshStandardMaterial({ color: 0xD4B86A, roughness: 0.95 }));
            brim.position.set(0, 1.92, 0); group.add(brim);
            const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.12, 6), new THREE.MeshStandardMaterial({ color: 0xC8AA58, roughness: 0.95 }));
            crown.position.set(0, 2.01, 0); group.add(crown);
            // Pitchfork in hand
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 4), this.materials.trunk);
            handle.position.set(0.5, 1.1, 0); handle.rotation.z = -0.15; group.add(handle);
            // Pitchfork prongs (3 thin cylinders)
            const prongMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.4 });
            for (let pi = -1; pi <= 1; pi++) {
                const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.25, 3), prongMat);
                prong.position.set(0.42 + pi * 0.04, 1.98, 0); group.add(prong);
            }
        }

        if (npcId === 'banker') {
            // Formal vest overlay on torso
            const vest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.55, 0.27), new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.6 }));
            vest.position.set(0, 1.17, 0); group.add(vest);
            // Gold chain / necklace
            const chain = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 5, 8), new THREE.MeshStandardMaterial({ color: 0xFFCC00, metalness: 0.8, roughness: 0.2 }));
            chain.position.set(0, 1.38, -0.13); chain.rotation.x = Math.PI / 2; group.add(chain);
            // Slightly taller scale
            group.scale.y = 1.05;
        }

        if (npcId === 'general') {
            // Shopkeeper apron (brown)
            const apron = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.55, 0.02), new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.9 }));
            apron.position.set(0, 0.9, -0.14); group.add(apron);
            // Slightly wider build
            group.scale.x = 1.1;
        }

        if (npcId === 'merchant') {
            // Backpack
            const pack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.2), new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.9 }));
            pack.position.set(0, 1.1, 0.22); group.add(pack);
            // Straps
            for (let s = -1; s <= 1; s += 2) {
                const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 4), new THREE.MeshStandardMaterial({ color: 0x553322 }));
                strap.position.set(s * 0.1, 1.25, 0.1); strap.rotation.x = 0.3; group.add(strap);
            }
        }

        if (npcId === 'bartender') {
            // Bar towel over shoulder (thin box)
            const towel = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.02), new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.9 }));
            towel.position.set(-0.28, 1.35, 0.05); towel.rotation.z = 0.3; group.add(towel);
        }

        if (npcId === 'oziach') {
            // Old wizard hat
            const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.04, 8), new THREE.MeshStandardMaterial({ color: 0x5555AA, roughness: 0.8 }));
            hatBase.position.set(0, 1.93, 0); group.add(hatBase);
            const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.35, 6), new THREE.MeshStandardMaterial({ color: 0x4444AA, roughness: 0.7 }));
            hatCone.position.set(0, 2.14, 0); hatCone.rotation.z = 0.1; group.add(hatCone);
        }

        if (npcId === 'swamp_witch') {
            // Pointed witch hat
            const witchBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.03, 8), new THREE.MeshStandardMaterial({ color: 0x1A2A1A, roughness: 0.9 }));
            witchBrim.position.set(0, 1.93, 0); group.add(witchBrim);
            const witchCone = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 6), new THREE.MeshStandardMaterial({ color: 0x1A2A1A, roughness: 0.9 }));
            witchCone.position.set(0, 2.18, 0); group.add(witchCone);
            // Gnarled staff
            const wStaff = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.6, 5), new THREE.MeshStandardMaterial({ color: 0x3A2A1A, roughness: 0.95 }));
            wStaff.position.set(-0.45, 1.0, 0); wStaff.rotation.z = 0.12; group.add(wStaff);
        }

        if (npcId === 'desert_merchant') {
            // Head wrap / turban
            const turban = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 5), new THREE.MeshStandardMaterial({ color: 0xE8D8B0, roughness: 0.9 }));
            turban.position.set(0, 1.88, 0); turban.scale.y = 0.7; group.add(turban);
        }

        if (npcId === 'ice_hermit') {
            // Fur-trimmed hood (larger hair sphere)
            const hood = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.65), new THREE.MeshStandardMaterial({ color: 0x8899AA, roughness: 0.95 }));
            hood.position.set(0, 1.74, 0); group.add(hood);
            // Walking stick
            const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 1.4, 4), new THREE.MeshStandardMaterial({ color: 0x998877, roughness: 0.9 }));
            stick.position.set(0.45, 0.9, 0); stick.rotation.z = -0.1; group.add(stick);
        }

        if (npcId === 'archaeologist') {
            // Safari / explorer hat
            const expBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.03, 8), new THREE.MeshStandardMaterial({ color: 0x9B7B4A, roughness: 0.9 }));
            expBrim.position.set(0, 1.93, 0); group.add(expBrim);
            const expCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.1, 6), new THREE.MeshStandardMaterial({ color: 0x8B6B3A, roughness: 0.9 }));
            expCrown.position.set(0, 2.0, 0); group.add(expCrown);
            // Brush tool in hand
            const brush = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 4), new THREE.MeshStandardMaterial({ color: 0x886644 }));
            brush.position.set(-0.42, 0.7, -0.05); brush.rotation.z = -0.3; group.add(brush);
        }

        if (npcId === 'dungeon_guide') {
            // Lantern in hand (small glowing box)
            const lanternHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.15, 4), new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5 }));
            lanternHandle.position.set(-0.42, 0.8, -0.05); group.add(lanternHandle);
            const lanternBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), new THREE.MeshStandardMaterial({ color: 0xFFCC44, emissive: 0xFFAA22, emissiveIntensity: 0.6 }));
            lanternBody.position.set(-0.42, 0.7, -0.05); group.add(lanternBody);
        }
        return group;
    }

    _buildHumanoidNPC(g, shirtMat, pantsMat, hairMat) {
        const skin = this.materials.npcSkin;
        // Head
        const head = at(new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), skin), 0, 1.7, 0);
        head.userData.part = 'head';
        g.add(head);
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.23, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat), 0, 1.72, 0));
        // Neck
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.12, 5), skin);
        neck.position.y = 1.45; g.add(neck);
        // Eyes
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        for (let s = -1; s <= 1; s += 2) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 3), eyeMat);
            eye.position.set(s * 0.08, 1.72, -0.19); g.add(eye);
        }
        // Nose
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.05, 4), skin);
        nose.position.set(0, 1.66, -0.21); nose.rotation.x = -Math.PI / 2; g.add(nose);
        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.25), shirtMat);
        body.position.y = 1.15; body.castShadow = true; body.userData.part = 'torso'; g.add(body);
        let armL = null, armR = null;
        for (let s = -1; s <= 1; s += 2) {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.6, 5), pantsMat);
            leg.position.set(s * 0.12, 0.5, 0); g.add(leg);
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.5, 5), skin);
            arm.position.set(s * 0.35, 1.1, 0); arm.rotation.z = s * 0.15;
            arm.userData.part = s === -1 ? 'armL' : 'armR';
            if (s === -1) armL = arm; else armR = arm;
            g.add(arm);
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.18), this.materials.trunk), s * 0.12, 0.17, -0.02));
        }
        g.userData._parts = { head, armL, armR, torso: body };
    }

    // ── Multiplayer: create a remote player mesh ──
    createRemotePlayer(colorSeed) {
        const group = new THREE.Group();
        const palette = this._getPlayerPalette(colorSeed);
        const shirt = new THREE.MeshStandardMaterial({ color: palette.shirt, roughness: 0.8 });
        const pants = new THREE.MeshStandardMaterial({ color: palette.pants, roughness: 0.8 });
        const hair = new THREE.MeshStandardMaterial({ color: palette.hair, roughness: 0.9 });
        this._buildHumanoidNPC(group, shirt, pants, hair);
        return group;
    }

    _getPlayerPalette(seed) {
        const palettes = [
            { shirt: 0x4466AA, pants: 0x6B4226, hair: 0x4A3018 },
            { shirt: 0xAA2222, pants: 0x333333, hair: 0x222222 },
            { shirt: 0x228B22, pants: 0x8B6914, hair: 0xAA6633 },
            { shirt: 0x8844AA, pants: 0x6B4226, hair: 0xCCCCCC },
            { shirt: 0xCC8833, pants: 0x333333, hair: 0x4A3018 },
            { shirt: 0x2288CC, pants: 0x8B6914, hair: 0xFF6633 },
            { shirt: 0xCCCC22, pants: 0x6B4226, hair: 0x222222 },
            { shirt: 0xFFFFFF, pants: 0x6B4226, hair: 0x888888 },
        ];
        // Simple hash of seed string
        let hash = 0;
        const s = String(seed);
        for (let i = 0; i < s.length; i++) {
            hash = ((hash << 5) - hash) + s.charCodeAt(i);
            hash |= 0;
        }
        return palettes[Math.abs(hash) % palettes.length];
    }

    createSheep() {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), this.materials.sheepBody);
        body.position.y = 0.6; body.scale.set(1, 0.8, 1.3); body.castShadow = true; g.add(body);
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.18, 5, 4), this.materials.npcSkin), 0, 0.7, -0.55));
        for (let s = -1; s <= 1; s += 2) for (let f = -1; f <= 1; f += 2) {
            g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.4, 4), this.materials.npcSkin), s * 0.2, 0.2, f * 0.3));
        }
        g.userData = { type: 'sheep', interactable: true, name: 'Sheep' };
        return g;
    }

    createDungeonEntrance() {
        const g = new THREE.Group();
        const arch = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.5, 6, 12, Math.PI), this.materials.dungeonStone);
        arch.position.y = 2.5; arch.rotation.x = Math.PI / 2; arch.castShadow = true; g.add(arch);
        g.add(at(new THREE.Mesh(new THREE.CircleGeometry(2.5, 12, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x050505 })), 0, 1.5, -0.3));
        for (let s = -1; s <= 1; s += 2) {
            const p = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 4, 6), this.materials.dungeonStone);
            p.position.set(s * 2.8, 2, 0); p.castShadow = true; g.add(p);
            const fl = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 4), new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.8 }));
            fl.position.set(s * 2.8, 3.2, 0.5); g.add(fl);
        }
        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.3, 5, 4), this.materials.boneMat);
        skull.position.set(0, 4.2, 0); skull.scale.set(1, 1.2, 0.8); g.add(skull);
        return g;
    }

    createBuilding(type = 'house') {
        const g = new THREE.Group();
        const windowMat = new THREE.MeshStandardMaterial({ color: 0x1A2233, roughness: 0.5 });
        const foundationMat = this.materials.stoneGray;

        if (type === 'house' || type === 'shop') {
            const wallMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.9, side: THREE.DoubleSide });
            const floorMat = new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.95 });
            // Floor
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), floorMat);
            floor.rotation.x = -Math.PI / 2; floor.position.y = 0.05; floor.receiveShadow = true; g.add(floor);
            // Walls with doorway
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(6, 3, 0.2), wallMat), 0, 1.5, 2.5));   // back
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 5), wallMat), -3, 1.5, 0));     // left
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 5), wallMat), 3, 1.5, 0));      // right
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.8, 3, 0.2), wallMat), -2.1, 1.5, -2.5)); // front-L
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.8, 3, 0.2), wallMat), 2.1, 1.5, -2.5));  // front-R
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 0.2), wallMat), 0, 2.85, -2.5)); // lintel
            // Stone foundation strip
            const foundation = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.3, 5.3), foundationMat);
            foundation.position.y = 0.15; g.add(foundation);
            const rs = new THREE.Shape(); rs.moveTo(-3.5, 0); rs.lineTo(0, 2.5); rs.lineTo(3.5, 0); rs.lineTo(-3.5, 0);
            const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(rs, { depth: 5.5, bevelEnabled: false }), this.materials.roof);
            roof.position.set(0, 3, -2.75); roof.castShadow = true; g.add(roof);
            // Windows on front and back
            for (const side of [-1, 1]) {
                for (const face of [-1, 1]) {
                    const win = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.12), windowMat);
                    win.position.set(side * 1.8, 2.0, face * 2.55);
                    g.add(win);
                }
            }
            // Window frames (lighter trim)
            for (const side of [-1, 1]) {
                for (const face of [-1, 1]) {
                    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.08), this.materials.trunk);
                    frame.position.set(side * 1.8, 2.0, face * 2.56);
                    g.add(frame);
                }
            }
            // ── Interior furniture ──
            if (type === 'shop') {
                // Shop counter
                const barMat = new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 0.85 });
                g.add(at(new THREE.Mesh(new THREE.BoxGeometry(4, 0.9, 0.5), barMat), 0, 0.45, 1.5));
                g.add(at(new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.06, 0.6), barMat), 0, 0.93, 1.5));
                // Shelves on back wall
                const shelfMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.9 });
                for (const sx of [-1.8, 0, 1.8]) {
                    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.4, 2, 0.3), shelfMat), sx, 1, 2.3));
                }
                // Crate near door
                g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), shelfMat), -2.2, 0.3, -1.5));
                g.add(at(new THREE.PointLight(0xFFDD99, 0.5, 8), 0, 2.5, 0));
            } else {
                // House: bed, table, bookshelf
                const furnMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.9 });
                const bedMat = new THREE.MeshStandardMaterial({ color: 0x884422, roughness: 0.9 });
                const blanketMat = new THREE.MeshStandardMaterial({ color: 0xCC8844, roughness: 0.95 });
                // Bed frame + blanket
                g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 2), bedMat), -1.8, 0.2, 1.2));
                g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.8), blanketMat), -1.8, 0.42, 1.1));
                // Pillow
                g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.35), new THREE.MeshStandardMaterial({ color: 0xDDCCBB })), -1.8, 0.48, 2.0));
                // Table + chair
                g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.8), furnMat), 1.5, 0.62, 1));
                g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 4), furnMat), 1.5, 0.3, 1));
                g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), furnMat), 1.5, 0.25, 0.2));
                // Bookshelf
                g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 0.3), furnMat), -1.5, 1, 2.3));
                // Rug
                const rugMat = new THREE.MeshStandardMaterial({ color: 0xAA5533, roughness: 0.95 });
                const rug = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.5), rugMat);
                rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.06, 0); g.add(rug);
                g.add(at(new THREE.PointLight(0xFFDD88, 0.4, 6), 0, 2.5, 0));
            }
        } else if (type === 'castle') {
            const castleWallMat = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.85, side: THREE.DoubleSide });
            const castleFloorMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.95 });
            // Floor
            const cFloor = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), castleFloorMat);
            cFloor.rotation.x = -Math.PI / 2; cFloor.position.y = 0.05; cFloor.receiveShadow = true; g.add(cFloor);
            // Walls with doorway
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(12, 8, 0.3), castleWallMat), 0, 4, 5));    // back
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.3, 8, 10), castleWallMat), -6, 4, 0));   // left
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.3, 8, 10), castleWallMat), 6, 4, 0));    // right
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(4.5, 8, 0.3), castleWallMat), -3.75, 4, -5)); // front-L
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(4.5, 8, 0.3), castleWallMat), 3.75, 4, -5));  // front-R
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.3), castleWallMat), 0, 6, -5));       // above door
            // Corner towers
            for (const [cx, cz] of [[-6,-5],[6,-5],[-6,5],[6,5]]) {
                const t = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 10, 8), this.materials.castleStone);
                t.position.set(cx, 5, cz); t.castShadow = true; g.add(t);
                g.add(at(new THREE.Mesh(new THREE.ConeGeometry(2, 3, 8), this.materials.roof), cx, 11.5, cz));
            }
            // Door
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.5), this.materials.door), 0, 2, -5.25));
            // Battlements
            for (let i = -4; i <= 4; i += 2) {
                const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.8), this.materials.castleStone);
                m.position.set(i, 8.75, -5); g.add(m); const m2 = m.clone(); m2.position.z = 5; g.add(m2);
            }
            // Arrow slit windows on front face
            for (let wx = -3; wx <= 3; wx += 2) {
                const slit = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.15), windowMat);
                slit.position.set(wx, 5.5, -5.08); g.add(slit);
            }
            // Stone foundation
            const castleBase = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.5, 10.5), new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.95 }));
            castleBase.position.y = 0.25; g.add(castleBase);
            // ── Castle interior furniture ──
            const cFurnMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.9 });
            // Long table + benches
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(6, 0.08, 1.5), cFurnMat), 0, 0.8, 0));
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.15), cFurnMat), -2.5, 0.4, -0.6));
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.15), cFurnMat), 2.5, 0.4, -0.6));
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.15), cFurnMat), -2.5, 0.4, 0.6));
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.15), cFurnMat), 2.5, 0.4, 0.6));
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(5, 0.06, 0.3), cFurnMat), 0, 0.4, -1.2)); // bench front
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(5, 0.06, 0.3), cFurnMat), 0, 0.4, 1.2));  // bench back
            // Throne at back
            const throneMat = new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.8 });
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.8), throneMat), 0, 0.25, 3.8));
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.15), throneMat), 0, 1.3, 4.15)); // backrest
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.8), throneMat), -0.52, 0.65, 3.8)); // armrest L
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.8), throneMat), 0.52, 0.65, 3.8));  // armrest R
            // Weapon racks on side walls
            const rackMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6, metalness: 0.4 });
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 2), rackMat), -5.8, 2, -2));
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 2), rackMat), 5.8, 2, -2));
            // Fireplace on back wall
            const fireMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.95 });
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.5), fireMat), 0, 1, 4.75));
            g.add(at(new THREE.PointLight(0xFF6633, 0.4, 6), 0, 0.8, 4.2)); // fireplace glow
            // Banners on side walls
            const bannerMat = new THREE.MeshStandardMaterial({ color: 0xCC2222, roughness: 0.9, side: THREE.DoubleSide });
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.05, 2, 0.8), bannerMat), -5.85, 5, 2));
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.05, 2, 0.8), bannerMat), 5.85, 5, 2));
            // Chandelier light
            g.add(at(new THREE.PointLight(0xFFCC88, 0.7, 15), 0, 6, 0));
        } else if (type === 'furnace') {
            const base = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), this.materials.furnaceBrick);
            base.position.y = 1; base.castShadow = true; g.add(base);
            g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 6), this.materials.furnaceBrick), 0, 3, 0));
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), new THREE.MeshBasicMaterial({ color: 0xFF4400 })), 0, 0.8, -1.05));
            g.add(at(new THREE.PointLight(0xFF4400, 0.6, 6), 0, 1, -1.5));
            g.userData = { type: 'furnace', interactable: true, name: 'Furnace' };
            g._entityRef = { type: 'furnace' };
            return g;
        } else if (type === 'anvil') {
            const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.4), this.materials.metalDark);
            base.position.y = 0.6; base.castShadow = true; g.add(base);
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.5), this.materials.metalDark), 0, 0.95, 0));
            const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 4), this.materials.metalDark);
            horn.position.set(0, 0.95, -0.4); horn.rotation.x = -Math.PI / 2; g.add(horn);
            g.userData = { type: 'anvil', interactable: true, name: 'Anvil' };
            g._entityRef = { type: 'anvil' };
            return g;
        } else if (type === 'church') {
            const churchWallMat = new THREE.MeshStandardMaterial({ color: 0xEEEEDD, roughness: 0.9, side: THREE.DoubleSide });
            const churchFloorMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.95 });
            // Floor
            const chFloor = new THREE.Mesh(new THREE.PlaneGeometry(5, 7), churchFloorMat);
            chFloor.rotation.x = -Math.PI / 2; chFloor.position.y = 0.05; chFloor.receiveShadow = true; g.add(chFloor);
            // Walls with doorway
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(5, 4, 0.2), churchWallMat), 0, 2, 3.5));     // back
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 7), churchWallMat), -2.5, 2, 0));    // left
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 7), churchWallMat), 2.5, 2, 0));     // right
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.5, 4, 0.2), churchWallMat), -1.75, 2, -3.5)); // front-L
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.5, 4, 0.2), churchWallMat), 1.75, 2, -3.5));  // front-R
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 0.2), churchWallMat), 0, 3.85, -3.5));  // lintel
            // Stone foundation
            const churchBase = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.3, 7.3), foundationMat);
            churchBase.position.y = 0.15; g.add(churchBase);
            // Roof + steeple + cross (unchanged)
            const roof = new THREE.Mesh(new THREE.ConeGeometry(4, 3, 4), this.materials.roof);
            roof.position.y = 5.5; roof.rotation.y = Math.PI / 4; g.add(roof);
            const st = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 3, 4), this.materials.churchWhite);
            st.position.set(0, 5, -2); g.add(st);
            const crossG = new THREE.Group();
            const goldMat = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
            crossG.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.06), goldMat));
            const carm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.06), goldMat);
            carm.position.y = 0.15; crossG.add(carm);
            crossG.position.set(0, 6.8, -2); g.add(crossG);
            // Stained glass windows on side walls
            const glassMat = new THREE.MeshStandardMaterial({ color: 0x4466AA, emissive: 0x223355, emissiveIntensity: 0.2 });
            for (const side of [-1, 1]) {
                for (let wz = -2; wz <= 2; wz += 2) {
                    const win = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.5), glassMat);
                    win.position.set(side * 2.55, 2.3, wz);
                    g.add(win);
                }
            }
            // ── Church interior furniture ──
            // Altar at back
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(2, 1, 0.8), churchFloorMat), 0, 0.5, 2.8));
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.6), goldMat), 0, 1.03, 2.8)); // golden cloth
            // Pew rows
            const pewMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.9 });
            for (const pz of [-2.2, -1.2, -0.2, 0.8]) {
                g.add(at(new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.06, 0.3), pewMat), 0, 0.45, pz)); // seat
                g.add(at(new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, 0.06), pewMat), 0, 0.5, pz - 0.15)); // backrest
                g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 4), pewMat), -1.5, 0.22, pz));
                g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 4), pewMat), 1.5, 0.22, pz));
            }
            // Candle stands near altar
            const candleMat = new THREE.MeshStandardMaterial({ color: 0xCCBB88, roughness: 0.8 });
            for (const cx of [-1.5, 1.5]) {
                g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.2, 6), candleMat), cx, 0.6, 2.8));
                g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.15, 4), new THREE.MeshBasicMaterial({ color: 0xFFEE88 })), cx, 1.27, 2.8));
                g.add(at(new THREE.PointLight(0xFFCC44, 0.3, 5), cx, 1.4, 2.8));
            }
            // Main interior light
            g.add(at(new THREE.PointLight(0xFFEECC, 0.5, 10), 0, 3.5, 0));
            g.userData = { type: 'church', interactable: true, name: 'Church Altar' };
            g._entityRef = { type: 'church' };
            return g;
        } else if (type === 'tavern') {
            const wallMat = new THREE.MeshStandardMaterial({ color: 0x7A5C3A, roughness: 0.9, side: THREE.DoubleSide });
            const floorMat = new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.95 });
            const barMat = new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 0.85 });
            // Floor
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 7), floorMat);
            floor.rotation.x = -Math.PI / 2; floor.position.y = 0.05; floor.receiveShadow = true; g.add(floor);
            // Back wall
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(8, 3.5, 0.2), wallMat), 0, 1.75, 3.5));
            // Left wall
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 7), wallMat), -4, 1.75, 0));
            // Right wall
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 7), wallMat), 4, 1.75, 0));
            // Front wall — split for doorway (3 unit gap in center)
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 0.2), wallMat), -2.75, 1.75, -3.5));
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 0.2), wallMat), 2.75, 1.75, -3.5));
            // Lintel above door
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 0.2), wallMat), 0, 3.35, -3.5));
            // Foundation
            const tavernBase = new THREE.Mesh(new THREE.BoxGeometry(8.3, 0.3, 7.3), foundationMat);
            tavernBase.position.y = 0.15; g.add(tavernBase);
            // Roof
            const rs = new THREE.Shape(); rs.moveTo(-4.5, 0); rs.lineTo(0, 2.5); rs.lineTo(4.5, 0); rs.lineTo(-4.5, 0);
            const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(rs, { depth: 7.6, bevelEnabled: false }), this.materials.roof);
            roof.position.set(0, 3.5, -3.8); roof.castShadow = true; g.add(roof);
            // Bar counter (back area)
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(5, 1, 0.5), barMat), 0, 0.5, 2.0));
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.08, 0.7), barMat), 0, 1.04, 2.0));
            // Tables (2 round tables)
            const tableMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.9 });
            for (const [tx, tz] of [[-1.5, -1], [1.5, -1]]) {
                // Table top
                g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 8), tableMat), tx, 0.7, tz));
                // Table leg
                g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 4), tableMat), tx, 0.35, tz));
                // 2 stools per table
                for (const [sx, sz] of [[tx - 0.6, tz], [tx + 0.6, tz]]) {
                    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.45, 6), tableMat), sx, 0.22, sz));
                }
            }
            // Barrels behind bar
            const barrelMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.9 });
            for (const bx of [-1.5, 0, 1.5]) {
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.6, 8), barrelMat);
                barrel.position.set(bx, 0.3, 3.0); g.add(barrel);
            }
            // Warm interior light
            g.add(at(new THREE.PointLight(0xFFAA44, 0.8, 10), 0, 3, 0));
            // Hanging sign outside
            const signMat = new THREE.MeshStandardMaterial({ color: 0x6B4226 });
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 0.06), signMat), 0, 3.8, -3.8));
        } else if (type === 'desert_house') {
            const walls = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 4), this.materials.sandstone);
            walls.position.y = 1.5; walls.castShadow = true; walls.receiveShadow = true; g.add(walls);
            // Flat roof
            const roof = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.2, 4.4), this.materials.sandstoneRoof);
            roof.position.y = 3.1; g.add(roof);
            // Door
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), this.materials.door), 0, 1, -2.05));
            // Windows
            for (const side of [-1, 1]) {
                const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.12), windowMat);
                win.position.set(side * 1.5, 2.0, -2.05); g.add(win);
            }
            // Foundation
            const base = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.3, 4.3), foundationMat);
            base.position.y = 0.15; g.add(base);
        } else if (type === 'desert_palace') {
            const walls = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 8), this.materials.sandstone);
            walls.position.y = 2; walls.castShadow = true; walls.receiveShadow = true; g.add(walls);
            // Dome
            const dome = new THREE.Mesh(
                new THREE.SphereGeometry(3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
                this.materials.sandstoneRoof
            );
            dome.position.y = 4; g.add(dome);
            // Pillars at corners
            for (const [px, pz] of [[-5, -4], [5, -4], [-5, 4], [5, 4]]) {
                const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 4.5, 6), this.materials.sandstone);
                pillar.position.set(px, 2.25, pz); pillar.castShadow = true; g.add(pillar);
            }
            // Door
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.1), this.materials.door), 0, 1.5, -4.05));
            // Windows (arched effect with circles)
            for (const side of [-1, 1]) {
                for (const face of [-1, 1]) {
                    const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.12), windowMat);
                    win.position.set(side * 3, 2.5, face * 4.05); g.add(win);
                }
            }
            // Foundation
            const base = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.4, 8.5), foundationMat);
            base.position.y = 0.2; g.add(base);
            // Interior warm light
            g.add(at(new THREE.PointLight(0xFFAA44, 0.6, 12), 0, 3.5, 0));
        }
        const names = { castle: 'Lumbridge Castle', house: 'House', shop: 'General Store', tavern: 'Blue Moon Inn', desert_house: 'Desert House', desert_palace: 'Desert Palace' };
        g.userData = { type: 'building', subType: type, interactable: false, name: names[type] || 'Building' };
        return g;
    }

    createAgilityObstacle(obstacle) {
        const g = new THREE.Group();
        if (obstacle.type === 'balance') {
            const log = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, obstacle.length || 5, 6), this.materials.agilityLog);
            log.rotation.z = Math.PI / 2; log.position.y = 0.3; log.castShadow = true; g.add(log);
        } else if (obstacle.type === 'climb') {
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.1), this.materials.agilityLog), 0, 1.5, 0));
            g.add(at(new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.8), this.materials.agilityNet), 0, 1.5, 0.06));
        } else if (obstacle.type === 'jump') {
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 1.5), this.materials.agilityLog), 0, 0.1, 0));
            g.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 4), new THREE.MeshStandardMaterial({ color: 0x00FF88 })), 0, 0.8, 0));
        }
        g.userData = { type: 'agility', interactable: true, name: obstacle.name };
        return g;
    }

    createRuneAltar() {
        const g = new THREE.Group();
        g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2, 0.5, 8), this.materials.altarStone), 0, 0.25, 0));
        g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5, 6), this.materials.altarStone), 0, 1, 0));
        g.add(at(new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), new THREE.MeshStandardMaterial({ color: 0x6666FF, emissive: 0x3333AA, emissiveIntensity: 0.7, transparent: true, opacity: 0.8 })), 0, 2.0, 0));
        g.userData = { type: 'rune_altar', interactable: true, name: 'Rune Altar' };
        g._entityRef = { type: 'rune_altar' };
        return g;
    }

    createVolcano() {
        const g = new THREE.Group();
        // Main cone
        const cone = new THREE.Mesh(
            new THREE.ConeGeometry(8, 15, 12),
            this.materials.volcanicRock
        );
        cone.position.y = 7.5; cone.castShadow = true; g.add(cone);
        // Crater rim
        const crater = new THREE.Mesh(
            new THREE.TorusGeometry(3, 0.6, 6, 12),
            this.materials.volcanicRock
        );
        crater.position.y = 14.5; crater.rotation.x = Math.PI / 2; g.add(crater);
        // Lava glow inside crater
        const craterGlow = new THREE.Mesh(
            new THREE.CircleGeometry(2.5, 12),
            new THREE.MeshBasicMaterial({ color: 0xFF4400, transparent: true, opacity: 0.6 })
        );
        craterGlow.position.y = 14.2; craterGlow.rotation.x = -Math.PI / 2; g.add(craterGlow);
        g.userData = { type: 'scenery', name: 'Volcano' };
        return g;
    }

    createVolcanicRock() {
        const g = new THREE.Group();
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            const size = 0.4 + Math.random() * 0.6;
            const rock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(size, 0),
                this.materials.volcanicRock
            );
            rock.position.set(
                (Math.random() - 0.5) * 1.5,
                size * 0.4,
                (Math.random() - 0.5) * 1.5
            );
            rock.scale.y = 0.5 + Math.random() * 0.3;
            rock.rotation.y = Math.random() * Math.PI;
            rock.castShadow = true;
            g.add(rock);
        }
        return g;
    }

    createGlowingMushroom() {
        const g = new THREE.Group();
        // Stem
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.06, 0.4, 4),
            this.getCachedMaterial(0x888877, 0.9)
        );
        stem.position.y = 0.2; g.add(stem);
        // Cap (half sphere)
        const cap = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2),
            this.materials.caveMushroom
        );
        cap.position.y = 0.4; g.add(cap);
        return g;
    }

    createPortal(color = 0x2288FF) {
        const g = new THREE.Group();
        // Ring
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.5, 0.12, 8, 24),
            this.materials.stoneGray
        );
        ring.position.y = 1.5; g.add(ring);
        // Inner surface
        const portalMat = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.9,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
        });
        const inner = new THREE.Mesh(
            new THREE.CircleGeometry(1.3, 24),
            portalMat
        );
        inner.position.y = 1.5; g.add(inner);
        return g;
    }

    // ── Dungeon Geometry ──────────────────────────────────────────────

    createDungeonRoom(width, depth, height) {
        const g = new THREE.Group();
        const m = this.materials.dungeonStone;
        // Floor
        const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.3, depth), m);
        floor.position.y = -0.15; floor.receiveShadow = true; g.add(floor);
        // Ceiling
        const ceil = new THREE.Mesh(new THREE.BoxGeometry(width, 0.3, depth), m);
        ceil.position.y = height + 0.15; g.add(ceil);
        // Walls (4 sides with thickness)
        const wt = 0.5; // wall thickness
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(width + wt * 2, height, wt), m), 0, height / 2, -depth / 2 - wt / 2));
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(width + wt * 2, height, wt), m), 0, height / 2, depth / 2 + wt / 2));
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(wt, height, depth), m), -width / 2 - wt / 2, height / 2, 0));
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(wt, height, depth), m), width / 2 + wt / 2, height / 2, 0));
        return g;
    }

    createDungeonLadder() {
        const g = new THREE.Group();
        const woodMat = this.materials.trunk;
        // Two side rails
        for (let s = -1; s <= 1; s += 2) {
            const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3, 4), woodMat);
            rail.position.set(s * 0.25, 1.5, 0); g.add(rail);
        }
        // Rungs
        for (let i = 0; i < 6; i++) {
            const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4), woodMat);
            rung.position.set(0, 0.3 + i * 0.5, 0); rung.rotation.z = Math.PI / 2; g.add(rung);
        }
        return g;
    }

    createDungeonTorch() {
        const g = new THREE.Group();
        // Bracket
        const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4), this.materials.metalDark);
        bracket.position.y = 1.8; bracket.rotation.z = Math.PI / 2; g.add(bracket);
        // Flame
        const flameMat = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.8 });
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), flameMat);
        flame.position.set(0.2, 2.0, 0); g.add(flame);
        return g;
    }

    createDungeonPillar() {
        const g = new THREE.Group();
        const m = this.materials.dungeonStone;
        g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 5, 6), m), 0, 2.5, 0));
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 1.2), m), 0, 0.15, 0));
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.2, 1.0), m), 0, 4.9, 0));
        return g;
    }

    // ── Environmental Props ──────────────────────────────────────────

    createBush() {
        const geo = new THREE.IcosahedronGeometry(0.5 + Math.random() * 0.3, 1);
        this._displaceVertices(geo, 0.12);
        // Flatten slightly
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) * (0.5 + Math.random() * 0.2));
        geo.computeVertexNormals();
        const bush = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
            color: new THREE.Color(0x2D6B2A).lerp(new THREE.Color(0x3A8C3A), Math.random() * 0.4),
            roughness: 0.85,
        }));
        bush.castShadow = true;
        return bush;
    }

    createBarrel() {
        const g = new THREE.Group();
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.28, 0.3, 0.7, 8), this.materials.trunk
        );
        barrel.position.y = 0.35; barrel.castShadow = true; g.add(barrel);
        // Metal bands
        const bandMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.4 });
        for (const by of [0.15, 0.55]) {
            const band = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.015, 4, 8), bandMat);
            band.position.y = by; band.rotation.x = Math.PI / 2; g.add(band);
        }
        return g;
    }

    createCrate() {
        const g = new THREE.Group();
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.6, 0.6), this.materials.woodWall
        );
        box.position.y = 0.3; box.castShadow = true; g.add(box);
        // Cross plank on front
        const plankMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.9 });
        const plank1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.04), plankMat);
        plank1.position.set(0, 0.3, -0.32); plank1.rotation.z = Math.PI * 0.25; g.add(plank1);
        const plank2 = plank1.clone(); plank2.rotation.z = -Math.PI * 0.25; g.add(plank2);
        return g;
    }

    createHayBale() {
        const g = new THREE.Group();
        const hayMat = new THREE.MeshStandardMaterial({ color: 0xD4B85A, roughness: 0.95 });
        const bale = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.6, 8), hayMat);
        bale.position.y = 0.5; bale.rotation.z = Math.PI / 2;
        bale.castShadow = true; g.add(bale);
        // Straw wisps poking out
        const straw = new THREE.MeshStandardMaterial({ color: 0xC4A840, roughness: 1.0 });
        for (let i = 0; i < 5; i++) {
            const wisp = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.005, 0.2, 3), straw);
            wisp.position.set((Math.random()-0.5)*0.5, 0.5+(Math.random()-0.5)*0.3, (Math.random()-0.5)*0.5);
            wisp.rotation.set(Math.random()*0.5, 0, Math.random()*0.8-0.4); g.add(wisp);
        }
        return g;
    }

    createWell() {
        const g = new THREE.Group();
        const stone = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.95 });
        // Circular base wall
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.8, 8), stone);
        base.position.y = 0.4; base.castShadow = true; g.add(base);
        // Inner hole (dark)
        const hole = new THREE.Mesh(
            new THREE.CircleGeometry(0.55, 8),
            new THREE.MeshBasicMaterial({ color: 0x111122 })
        );
        hole.position.y = 0.81; hole.rotation.x = -Math.PI / 2; g.add(hole);
        // 2 posts
        for (const s of [-1, 1]) {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.4, 4), this.materials.trunk);
            post.position.set(s * 0.55, 1.5, 0); post.castShadow = true; g.add(post);
        }
        // Cross beam
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4), this.materials.trunk);
        beam.position.y = 2.2; beam.rotation.z = Math.PI / 2; g.add(beam);
        // Roof (small)
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.5, 4), this.materials.roof);
        roof.position.y = 2.55; roof.rotation.y = Math.PI / 4; g.add(roof);
        // Bucket
        const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.15, 5), this.materials.metalDark);
        bucket.position.set(0, 1.5, 0); g.add(bucket);
        // Rope
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.7, 3),
            new THREE.MeshStandardMaterial({ color: 0x8B7355 }));
        rope.position.set(0, 1.85, 0); g.add(rope);
        return g;
    }

    createMineCart() {
        const g = new THREE.Group();
        const woodMat = this.materials.trunk;
        const metalMat = this.materials.metalDark;
        // Cart body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.6), woodMat);
        body.position.y = 0.45; body.castShadow = true; g.add(body);
        // Rock fill
        const fill = new THREE.Mesh(new THREE.SphereGeometry(0.3, 5, 4), this.materials.stoneGray);
        fill.position.y = 0.7; fill.scale.set(1.2, 0.5, 0.9); g.add(fill);
        // 4 wheels
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8), metalMat);
            wheel.position.set(sx * 0.42, 0.15, sz * 0.25);
            wheel.rotation.z = Math.PI / 2; g.add(wheel);
        }
        // Rail track (2 bars)
        const railMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.4, roughness: 0.5 });
        for (const sz of [-0.25, 0.25]) {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.04, 0.06), railMat);
            rail.position.set(0, 0.03, sz); g.add(rail);
        }
        // Crossties
        for (let rx = -1; rx <= 1; rx += 0.5) {
            const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.7), woodMat);
            tie.position.set(rx, 0.015, 0); g.add(tie);
        }
        return g;
    }

    createPath(width, length, terrain, position, rotationY) {
        const widthSegs = Math.max(1, Math.round(width));
        const lengthSegs = Math.max(2, Math.round(length / 1.5));
        const geo = new THREE.PlaneGeometry(width, length, widthSegs, lengthSegs);
        geo.rotateX(-Math.PI / 2);

        // Sample terrain height at each vertex so path hugs the ground
        if (terrain && position) {
            const posAttr = geo.attributes.position;
            const cosR = Math.cos(rotationY || 0);
            const sinR = Math.sin(rotationY || 0);
            for (let i = 0; i < posAttr.count; i++) {
                const lx = posAttr.getX(i);
                const lz = posAttr.getZ(i);
                const wx = position.x + lx * cosR - lz * sinR;
                const wz = position.z + lx * sinR + lz * cosR;
                posAttr.setY(i, terrain.getHeightAt(wx, wz) + 0.08 - (position.terrainY || 0));
            }
            posAttr.needsUpdate = true;
            geo.computeVertexNormals();
        }

        const path = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xC4A86B, roughness: 0.95 }));
        path.receiveShadow = true;
        return path;
    }
}
