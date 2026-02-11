import * as THREE from 'three';

// Helper: position a mesh and return it (Object.assign can't set position in Three.js)
function at(obj, x, y, z) { obj.position.set(x, y, z); return obj; }

export class ProceduralAssets {
    constructor() {
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
            agilityNet: new THREE.MeshStandardMaterial({ color: 0xCCBB88, roughness: 0.9, wireframe: true }),
            altarStone: new THREE.MeshStandardMaterial({ color: 0x7777AA, roughness: 0.7, metalness: 0.2 }),
        };
    }

    createTree(type = 'normal') {
        const group = new THREE.Group();
        const trunkH = type === 'willow' ? 4 : 3;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, trunkH, 6), this.materials.trunk);
        trunk.position.y = trunkH / 2; trunk.castShadow = true;
        // Slight random lean for natural variation
        trunk.rotation.z = (Math.random() - 0.5) * 0.1;
        trunk.rotation.x = (Math.random() - 0.5) * 0.06;
        group.add(trunk);

        let leafMat = this.materials.leaves, radius = 1.6, canopyY = 3.5;
        if (type === 'oak') { leafMat = this.materials.oakLeaves; radius = 2.2; canopyY = 4.0; }
        if (type === 'willow') { leafMat = this.materials.willowLeaves; radius = 2.5; canopyY = 5.0; }

        // Main canopy with vertex displacement for organic look
        const canopyGeo = new THREE.IcosahedronGeometry(radius, 1);
        this._displaceVertices(canopyGeo, type === 'willow' ? 0.3 : type === 'oak' ? 0.25 : 0.2);
        const canopy = new THREE.Mesh(canopyGeo, leafMat);
        canopy.position.y = canopyY; canopy.castShadow = true; group.add(canopy);

        // Secondary canopy blob offset to break the sphere silhouette
        const subRadius = radius * (0.55 + Math.random() * 0.15);
        const subGeo = new THREE.IcosahedronGeometry(subRadius, 1);
        this._displaceVertices(subGeo, 0.15);
        const subCanopy = new THREE.Mesh(subGeo, leafMat);
        subCanopy.position.set(
            (Math.random() - 0.5) * radius * 0.7,
            canopyY - 0.5 - Math.random() * 0.3,
            (Math.random() - 0.5) * radius * 0.7
        );
        subCanopy.castShadow = true; group.add(subCanopy);

        // Root bumps at the base
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 + Math.random() * 0.5;
            const root = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.09, 0.6, 4), this.materials.trunk
            );
            root.position.set(Math.cos(angle) * 0.2, 0.1, Math.sin(angle) * 0.2);
            root.rotation.z = Math.cos(angle) * 0.7;
            root.rotation.x = Math.sin(angle) * 0.7;
            group.add(root);
        }

        if (type === 'willow') {
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.01, 2, 3), this.materials.willowLeaves);
                b.position.set(Math.cos(a) * 1.8, 3.5, Math.sin(a) * 1.8);
                b.rotation.z = Math.cos(a) * 0.3; b.rotation.x = Math.sin(a) * 0.3; group.add(b);
            }
        }

        const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.5, 6), this.materials.stump);
        stump.position.y = 0.25; stump.visible = false; stump.name = 'stump'; group.add(stump);

        const names = { normal: 'Tree', oak: 'Oak tree', willow: 'Willow tree' };
        group.userData = { type: 'tree', subType: type, interactable: true, name: names[type] || 'Tree' };
        return group;
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

        const oreMat = this.materials[type + 'Ore'] || this.materials.copperOre;
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

        const names = { copper: 'Copper rock', tin: 'Tin rock', iron: 'Iron rock', coal: 'Coal rock' };
        group.userData = { type: 'rock', subType: type, interactable: true, name: names[type] || 'Rock' };
        return group;
    }

    createMonster(type = 'chicken') {
        const group = new THREE.Group();
        const b = { chicken: '_buildChicken', cow: '_buildCow', rat: '_buildRat', goblin: '_buildGoblin',
            skeleton: '_buildSkeleton', giant_spider: '_buildSpider', dark_wizard: '_buildDarkWizard',
            lesser_demon: '_buildDemon', kbd: '_buildKBD' };
        if (b[type]) this[b[type]](group);

        const names = { chicken: 'Chicken', cow: 'Cow', rat: 'Giant Rat', goblin: 'Goblin',
            skeleton: 'Skeleton', giant_spider: 'Giant Spider', dark_wizard: 'Dark Wizard',
            lesser_demon: 'Lesser Demon', kbd: 'King Black Dragon' };
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
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 3, 2), new THREE.MeshStandardMaterial({ color: 0xFF8888 }));
        nose.position.set(0, 0.32, -0.55); g.add(nose);
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.01, 0.5, 4), this.materials.ratBody);
        tail.position.set(0, 0.3, 0.5); tail.rotation.x = 0.5; g.add(tail);
        const em = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
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
        const em = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
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
        const em = new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0x440000, emissiveIntensity: 0.5 });
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
        const sm = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.6, roughness: 0.3 });
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.02), sm);
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
        const em = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.6 });
        for (let s = -1; s <= 1; s += 2) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.03, 3, 2), em), s * 0.07, 1.52, -0.17));
        g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 5), this.materials.trunk), 0.4, 0.9, 0));
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), new THREE.MeshStandardMaterial({ color: 0x8800FF, emissive: 0x4400AA, emissiveIntensity: 0.5 })), 0.4, 1.9, 0));
    }

    _buildDemon(g) {
        const m = this.materials.demonBody;
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.5), m);
        body.position.y = 1.4; body.castShadow = true; g.add(body);
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), m), 0, 2.3, 0));
        const hm = new THREE.MeshStandardMaterial({ color: 0x333333 });
        for (let s = -1; s <= 1; s += 2) {
            const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 4), hm);
            horn.position.set(s * 0.15, 2.6, 0); horn.rotation.z = s * -0.3; g.add(horn);
        }
        const em = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFF8800, emissiveIntensity: 0.8 });
        for (let s = -1; s <= 1; s += 2) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 3), em), s * 0.1, 2.35, -0.25));
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
        const em = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 1.0 });
        for (let s = -1; s <= 1; s += 2) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 3), em), s * 0.15, 2.6, -2.0));
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
        g.add(at(new THREE.PointLight(0xFF4400, 1, 8), 0, 2.3, -2.5));
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
        };
        const [shirt, pants, hair] = mats[npcId] || [this.materials.npcShirt, this.materials.npcPants, this.materials.npcHair];
        this._buildHumanoidNPC(group, shirt, pants, hair);
        if (npcId === 'guide') {
            group.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2, 5), this.materials.trunk), 0.5, 1.0, 0));
            group.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), new THREE.MeshStandardMaterial({ color: 0x44AAFF, emissive: 0x2266BB, emissiveIntensity: 0.5 })), 0.5, 2.1, 0));
        }
        if (npcId === 'turael') {
            const sword = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.7, 0.02), new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.6 }));
            sword.position.set(0.45, 0.9, 0); sword.rotation.z = -0.2; group.add(sword);
        }
        return group;
    }

    _buildHumanoidNPC(g, shirtMat, pantsMat, hairMat) {
        const skin = this.materials.npcSkin;
        // Head
        g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), skin), 0, 1.7, 0));
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
        for (let s = -1; s <= 1; s += 2) {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.6, 5), pantsMat);
            leg.position.set(s * 0.12, 0.5, 0); g.add(leg);
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.5, 5), skin);
            arm.position.set(s * 0.35, 1.1, 0); arm.rotation.z = s * 0.15; g.add(arm);
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.18), this.materials.trunk), s * 0.12, 0.17, -0.02));
        }
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
            const light = new THREE.PointLight(0xFF4400, 0.8, 8); light.position.set(s * 2.8, 3.5, 0.5); g.add(light);
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
            const walls = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 5), this.materials.woodWall);
            walls.position.y = 1.5; walls.castShadow = true; walls.receiveShadow = true; g.add(walls);
            // Stone foundation strip
            const foundation = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.3, 5.3), foundationMat);
            foundation.position.y = 0.15; g.add(foundation);
            const rs = new THREE.Shape(); rs.moveTo(-3.5, 0); rs.lineTo(0, 2.5); rs.lineTo(3.5, 0); rs.lineTo(-3.5, 0);
            const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(rs, { depth: 5.5, bevelEnabled: false }), this.materials.roof);
            roof.position.set(0, 3, -2.75); roof.castShadow = true; g.add(roof);
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.1), this.materials.door), 0, 1.1, -2.55));
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
        } else if (type === 'castle') {
            const keep = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 10), this.materials.castleStone);
            keep.position.y = 4; keep.castShadow = true; keep.receiveShadow = true; g.add(keep);
            for (const [cx, cz] of [[-6,-5],[6,-5],[-6,5],[6,5]]) {
                const t = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 10, 8), this.materials.castleStone);
                t.position.set(cx, 5, cz); t.castShadow = true; g.add(t);
                g.add(at(new THREE.Mesh(new THREE.ConeGeometry(2, 3, 8), this.materials.roof), cx, 11.5, cz));
            }
            g.add(at(new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.5), this.materials.door), 0, 2, -5.25));
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
            const walls = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 7), this.materials.churchWhite);
            walls.position.y = 2; walls.castShadow = true; g.add(walls);
            // Stone foundation
            const churchBase = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.3, 7.3), foundationMat);
            churchBase.position.y = 0.15; g.add(churchBase);
            const roof = new THREE.Mesh(new THREE.ConeGeometry(4, 3, 4), this.materials.roof);
            roof.position.y = 5.5; roof.rotation.y = Math.PI / 4; g.add(roof);
            const st = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 3, 4), this.materials.churchWhite);
            st.position.set(0, 5, -2); g.add(st);
            const crossG = new THREE.Group();
            crossG.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.06), new THREE.MeshStandardMaterial({ color: 0xFFD700 })));
            const carm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0xFFD700 }));
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
            g.userData = { type: 'church', interactable: true, name: 'Church Altar' };
            g._entityRef = { type: 'church' };
            return g;
        }
        const names = { castle: 'Lumbridge Castle', house: 'House', shop: 'General Store' };
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
        g.add(at(new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), new THREE.MeshStandardMaterial({ color: 0x6666FF, emissive: 0x3333AA, emissiveIntensity: 0.4, transparent: true, opacity: 0.8 })), 0, 2.0, 0));
        g.add(at(new THREE.PointLight(0x6666FF, 0.5, 5), 0, 2, 0));
        g.userData = { type: 'rune_altar', interactable: true, name: 'Rune Altar' };
        g._entityRef = { type: 'rune_altar' };
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
