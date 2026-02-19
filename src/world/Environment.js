import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { ResourceNode } from '../entities/ResourceNode.js';
import { Monster } from '../entities/Monster.js';
import { InstancedScenery } from './InstancedScenery.js';

export class Environment {
    constructor(scene, assets, terrain) {
        this.scene = scene;
        this.assets = assets;
        this.terrain = terrain;
        this.instancedScenery = new InstancedScenery(scene);

        this.monsters = [];
        this.monsterById = new Map(); // ID → Monster for multiplayer sync
        this.resourceNodes = [];
        this.npcs = [];
        this.sheep = [];
        this.groundItems = [];
        this.agilityObstacles = [];
        this.interactables = [];

        this.campfirePosition = null;
        this.fishingSpots = [];
        this._fishingSpotTimers = []; // time until next relocation per spot
        this.furnaceMesh = null;
        this.anvilMesh = null;
        this.churchMesh = null;
        this.runeAltarMesh = null;

        // Torches for night-time lighting
        this.torches = [];
        // Gravestones
        this.gravestones = [];
        // Loot beams
        this.lootBeams = [];
        this.lavaPools = [];
        this.underwaterCave = null;  // { y, bounds }

        this._placeBuildings();
        this._placePaths();
        this._placeTrees();
        this._placeRocks();
        this._placeMonsters();
        this._placeNPCs();
        this._placeSheep();
        this._placeScenery();
        this._placeFishingSpots();
        this._placeCampfire();
        this._placeDungeonEntrance();
        this._placeAgilityObstacles();
        this._placeRuneAltar();
        this._placeWildernessBoundary();
        this._placeTorches();
        this._placeBiomes();
        this._placeUnderwaterCave();
    }

    _placeBuildings() {
        // Footprint sizes for terrain flattening (halfWidth, halfDepth)
        const footprints = {
            castle: [7, 6],
            tavern: [5, 4.5],
            church: [3.5, 4.5],
            house: [3, 3],
            shop: [3, 3],
            desert_house: [3, 3],
            desert_palace: [6, 5],
        };

        // Types that benefit from LOD (have enough geometry to simplify)
        const lodTypes = new Set(['castle', 'tavern', 'church', 'house', 'shop', 'desert_house', 'desert_palace']);

        for (const data of CONFIG.WORLD_OBJECTS.buildings) {
            // Use LOD for large buildings, plain mesh for small interactables (furnace, anvil)
            const useLOD = lodTypes.has(data.type);
            const building = useLOD
                ? this.assets.createBuildingLOD(data.type)
                : this.assets.createBuilding(data.type);

            // Flatten terrain under large buildings first
            const fp = footprints[data.type];
            if (fp) {
                const baseY = this.terrain.getHeightAt(data.x, data.z);
                this.terrain.flattenArea(data.x, data.z, fp[0], fp[1], baseY);
            }

            const y = this.terrain.getHeightAt(data.x, data.z);
            building.position.set(data.x, y, data.z);

            // Rotate castle so the door faces south (toward spawn)
            if (data.type === 'castle') building.rotation.y = Math.PI;

            this.scene.add(building);

            if (data.type === 'furnace') {
                this.furnaceMesh = building;
                building.userData = { type: 'furnace', interactable: true, name: 'Furnace' };
                building._entityRef = { type: 'furnace' };
                this.interactables.push(building);
            } else if (data.type === 'anvil') {
                this.anvilMesh = building;
                building.userData = { type: 'anvil', interactable: true, name: 'Anvil' };
                building._entityRef = { type: 'anvil' };
                this.interactables.push(building);
            } else if (data.type === 'church') {
                this.churchMesh = building;
                building.userData = { type: 'church', interactable: true, name: 'Church altar' };
                building._entityRef = { type: 'church' };
                this.interactables.push(building);
            } else {
                building.userData = {
                    type: 'building',
                    name: data.type.charAt(0).toUpperCase() + data.type.slice(1),
                    buildingType: data.type,
                };
            }
        }
    }

    _placePaths() {
        const pathDefs = [
            { w: 4,   l: 20, x: 0,   z: -5,  ry: 0 },                  // Main road
            { w: 2.5, l: 25, x: 10,  z: 12,  ry: Math.PI * 0.15 },     // Farm
            { w: 2.5, l: 18, x: -12, z: -5,  ry: Math.PI * 0.4 },      // Mine
            { w: 2,   l: 30, x: -30, z: -25, ry: Math.PI * 0.2 },      // Dungeon
            { w: 2,   l: 35, x: 35,  z: 30,  ry: Math.PI * 0.25 },     // Agility
        ];
        for (const p of pathDefs) {
            const tY = this.terrain.getHeightAt(p.x, p.z);
            const path = this.assets.createPath(p.w, p.l, this.terrain, { x: p.x, z: p.z, terrainY: tY }, p.ry);
            path.position.set(p.x, tY, p.z);
            path.rotation.y = p.ry;
            this.scene.add(path);
        }
    }

    _placeTrees() {
        for (const data of CONFIG.WORLD_OBJECTS.trees) {
            const treeLOD = this.assets.createTreeLOD(data.type);
            const y = this.terrain.getHeightAt(data.x, data.z);
            treeLOD.position.set(data.x, y, data.z);
            this.scene.add(treeLOD);

            const treeConfig = CONFIG.TREES[data.type];
            const node = new ResourceNode(treeLOD, {
                type: 'tree', subType: data.type, ...treeConfig,
            });

            this.resourceNodes.push(node);
            this.interactables.push(treeLOD);
            treeLOD._entityRef = node;
        }
    }

    _placeRocks() {
        for (const data of CONFIG.WORLD_OBJECTS.rocks) {
            const rockLOD = this.assets.createRockLOD(data.type);
            const y = this.terrain.getHeightAt(data.x, data.z);
            rockLOD.position.set(data.x, y, data.z);
            this.scene.add(rockLOD);

            const rockConfig = CONFIG.ROCKS[data.type];
            const node = new ResourceNode(rockLOD, {
                type: 'rock', subType: data.type, ...rockConfig,
            });

            this.resourceNodes.push(node);
            this.interactables.push(rockLOD);
            rockLOD._entityRef = node;
        }
    }

    _placeScenery() {
        // ── Instanced Flowers (45 flowers → 3 batches: stems, petals, centers) ──
        const flowerColors = [0xFF6699, 0xFFFF44, 0xFF44FF, 0x44BBFF, 0xFFAA33];
        const stemTransforms = [];
        const petalTransforms = [];
        const centerTransforms = [];

        for (let i = 0; i < 45; i++) {
            const x = (Math.random() - 0.5) * 120;
            const z = (Math.random() - 0.5) * 120;
            const y = this.terrain.getHeightAt(x, z);
            const petalColor = flowerColors[i % flowerColors.length];

            // Stem
            stemTransforms.push({ position: [x, y + 0.15, z] });

            // Petals — 4-5 per flower
            const petalCount = 4 + Math.floor(Math.random() * 2);
            for (let p = 0; p < petalCount; p++) {
                const angle = (p / petalCount) * Math.PI * 2;
                petalTransforms.push({
                    position: [x + Math.cos(angle) * 0.055, y + 0.32, z + Math.sin(angle) * 0.055],
                    scale: [1.2, 0.6, 1.2],
                    color: petalColor,
                });
            }

            // Center pistil
            centerTransforms.push({ position: [x, y + 0.33, z] });
        }

        const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 3);
        const stemMat = this.assets.getCachedMaterial(0x228B22, 0.8);
        this.instancedScenery.addBatch('flower_stems', stemGeo, stemMat, stemTransforms);

        const petalGeo = new THREE.SphereGeometry(0.045, 4, 3);
        const petalMat = new THREE.MeshStandardMaterial({ color: 0xFF6699, roughness: 0.8, vertexColors: false });
        this.instancedScenery.addBatch('flower_petals', petalGeo, petalMat, petalTransforms);

        const centerGeo = new THREE.SphereGeometry(0.025, 3, 2);
        const centerMat = this.assets.getCachedMaterial(0xFFFF00, 0.8);
        this.instancedScenery.addBatch('flower_centers', centerGeo, centerMat, centerTransforms);

        // ── Instanced Bushes ──
        const bushPositions = [
            {x:13, z:12}, {x:16, z:16}, {x:19, z:11}, {x:11, z:20},
            {x:-12, z:17}, {x:-9, z:19}, {x:-15, z:22},
            {x:2, z:-2}, {x:-2, z:-8}, {x:1, z:-12},
            {x:12, z:16}, {x:38, z:19}, {x:30, z:33},
            {x:14, z:-8}, {x:-11, z:-5}, {x:6, z:-18},
            {x:17, z:28}, {x:14, z:32}, {x:24, z:30},
            {x:-18, z:-3}, {x:-24, z:-8}, {x:-16, z:-10},
            {x:35, z:10}, {x:-25, z:18}, {x:8, z:15},
        ];
        const bushGeo = new THREE.IcosahedronGeometry(0.65, 1);
        this.assets._displaceVertices(bushGeo, 0.12);
        const bushMat = this.assets.getCachedMaterial(0x2D7B2A, 0.8);
        const bushTransforms = bushPositions.map(bp => ({
            position: [bp.x, this.terrain.getHeightAt(bp.x, bp.z) + 0.25, bp.z],
            rotation: [0, Math.random() * Math.PI * 2, 0],
            scale: [1, 0.5 + Math.random() * 0.2, 1],
        }));
        this.instancedScenery.addBatch('bushes', bushGeo, bushMat, bushTransforms);

        // ── Instanced Barrels ──
        const barrelPositions = [
            {x:8, z:-6}, {x:8.5, z:-5.5}, {x:-7, z:-2}, {x:-7.5, z:-1.5},
            {x:2, z:-16}, {x:-1, z:-14},
        ];
        const barrelGeo = new THREE.CylinderGeometry(0.28, 0.3, 0.7, 8);
        const barrelMat = this.assets.getCachedMaterial(0x8B6914, 0.9);
        const barrelTransforms = barrelPositions.map(bp => ({
            position: [bp.x, this.terrain.getHeightAt(bp.x, bp.z) + 0.35, bp.z],
            rotation: [0, Math.random() * Math.PI * 2, 0],
        }));
        this.instancedScenery.addBatch('barrels', barrelGeo, barrelMat, barrelTransforms);

        // ── Instanced Crates ──
        const cratePositions = [{x:11, z:-4}, {x:-6.5, z:-2.5}, {x:1, z:-17}];
        const crateGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const crateMat = this.assets.getCachedMaterial(0x6B4226, 0.9);
        const crateTransforms = cratePositions.map(cp => ({
            position: [cp.x, this.terrain.getHeightAt(cp.x, cp.z) + 0.3, cp.z],
            rotation: [0, Math.random() * Math.PI, 0],
        }));
        this.instancedScenery.addBatch('crates', crateGeo, crateMat, crateTransforms);

        // ── Instanced Hay Bales ──
        const hayPositions = [{x:18, z:33}, {x:23, z:37}, {x:21, z:40}, {x:16, z:36}];
        const hayGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.6, 8);
        const hayMat = this.assets.getCachedMaterial(0xCCBB55, 0.95);
        const hayTransforms = hayPositions.map(hp => ({
            position: [hp.x, this.terrain.getHeightAt(hp.x, hp.z) + 0.3, hp.z],
            rotation: [0, Math.random() * Math.PI, Math.PI / 2],
        }));
        this.instancedScenery.addBatch('hay_bales', hayGeo, hayMat, hayTransforms);

        // ── Well in town (not instanced — unique) ──
        const well = this.assets.createWell();
        const wellY = this.terrain.getHeightAt(5, -8);
        well.position.set(5, wellY, -8);
        this.scene.add(well);

        // ── Mine cart near rocks (not instanced — unique) ──
        const cart = this.assets.createMineCart();
        const cartY = this.terrain.getHeightAt(-22, -7);
        cart.position.set(-22, cartY, -7);
        cart.rotation.y = Math.PI * 0.4;
        this.scene.add(cart);

        // ── Instanced Fence Posts + Rails ──
        const fencePostData = [
            [0, 22], [2, 22], [4, 22], [6, 22], [8, 22], [10, 22], [12, 22],
            [12, 24], [12, 26], [12, 28], [12, 30], [12, 32],
        ];
        const fencePostGeo = new THREE.CylinderGeometry(0.06, 0.06, 1, 4);
        const fenceMat = this.assets.getCachedMaterial(0x8B6914, 0.95);
        const fencePostTransforms = fencePostData.map(([fx, fz]) => ({
            position: [fx, this.terrain.getHeightAt(fx, fz) + 0.5, fz],
        }));
        this.instancedScenery.addBatch('fence_posts', fencePostGeo, fenceMat, fencePostTransforms);

        const fenceRailGeo = new THREE.BoxGeometry(2.2, 0.08, 0.06);
        const fenceRailTransforms = fencePostData.map(([fx, fz]) => ({
            position: [fx + 1, this.terrain.getHeightAt(fx, fz) + 0.7, fz],
        }));
        this.instancedScenery.addBatch('fence_rails', fenceRailGeo, fenceMat, fenceRailTransforms);

        // ── Pond ──
        this.pondMesh = this._createPond(25, 20);

        // ── Signpost ──
        const signGroup = new THREE.Group();
        const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2, 4), fenceMat);
        signPost.position.y = 1;
        signGroup.add(signPost);
        const signBoard = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.5, 0.06),
            this.assets.getCachedMaterial(0xC4A86B, 0.8)
        );
        signBoard.position.set(0, 1.8, 0);
        signGroup.add(signBoard);
        const signY = this.terrain.getHeightAt(3, 2);
        signGroup.position.set(3, signY, 2);
        this.scene.add(signGroup);
    }

    _createWaterMaterial() {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseColor: { value: new THREE.Color(0x2277AA) },
                deepColor: { value: new THREE.Color(0x0D3D5C) },
                skyColor: { value: new THREE.Color(0x88BBDD) },
                foamColor: { value: new THREE.Color(0xCCEEFF) },
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vWorldPos;
                void main() {
                    vUv = uv;
                    vec4 wp = modelMatrix * vec4(position, 1.0);
                    vWorldPos = wp.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 baseColor;
                uniform vec3 deepColor;
                uniform vec3 skyColor;
                uniform vec3 foamColor;
                varying vec2 vUv;
                varying vec3 vWorldPos;
                void main() {
                    vec2 p = vUv * 8.0;

                    // Dual-layer ripples at different frequencies
                    float ripple1 = sin(p.x * 3.0 + time * 1.8) * sin(p.y * 2.5 - time * 1.2) * 0.5 + 0.5;
                    float ripple2 = sin(p.x * 5.0 - time * 2.5 + 1.7) * sin(p.y * 4.5 + time * 1.8) * 0.5 + 0.5;
                    float ripple = ripple1 * 0.6 + ripple2 * 0.4;

                    // Specular highlight (fake sun reflection)
                    float spec = pow(max(ripple1, 0.0), 8.0) * 0.3;

                    // Edge distance for Fresnel and foam
                    float edgeDist = length(vUv - 0.5) * 2.0;

                    // Fresnel-like edge brightening (more reflective at edges)
                    float fresnel = pow(edgeDist, 2.0) * 0.4;

                    // Base water color: blend deep and surface based on ripple
                    vec3 col = mix(baseColor, deepColor, ripple * 0.3);

                    // Add sky reflection via fresnel
                    col = mix(col, skyColor, fresnel);

                    // Add ripple highlights
                    col += vec3(ripple * 0.08, ripple * 0.12, ripple * 0.18);

                    // Specular
                    col += vec3(spec, spec * 0.95, spec * 0.85);

                    // Edge foam
                    float foamThreshold = 0.82 + sin(time * 1.5 + p.x * 2.0) * 0.04;
                    float foam = smoothstep(foamThreshold, foamThreshold + 0.08, edgeDist);
                    col = mix(col, foamColor, foam * 0.6);

                    // Alpha: solid center, fade at extreme edges
                    float alpha = smoothstep(1.0, 0.75, edgeDist) * 0.75;
                    alpha = max(alpha, foam * 0.5);

                    gl_FragColor = vec4(col, alpha);
                }
            `,
            transparent: true,
            side: THREE.FrontSide,
        });
    }

    _createLavaMaterial() {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseColor: { value: new THREE.Color(0xFF4400) },
                deepColor: { value: new THREE.Color(0x880000) },
                hotColor: { value: new THREE.Color(0xFFAA00) },
                crustColor: { value: new THREE.Color(0x331100) },
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vWorldPos;
                void main() {
                    vUv = uv;
                    vec4 wp = modelMatrix * vec4(position, 1.0);
                    vWorldPos = wp.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 baseColor;
                uniform vec3 deepColor;
                uniform vec3 hotColor;
                uniform vec3 crustColor;
                varying vec2 vUv;
                varying vec3 vWorldPos;
                void main() {
                    vec2 p = vUv * 6.0;
                    float t = time * 0.5;

                    // Slow lava flow ripples
                    float ripple1 = sin(p.x * 2.0 + t * 1.2) * sin(p.y * 1.8 - t * 0.8) * 0.5 + 0.5;
                    float ripple2 = sin(p.x * 3.5 - t * 1.5 + 1.3) * sin(p.y * 3.0 + t * 1.0) * 0.5 + 0.5;
                    float ripple = ripple1 * 0.6 + ripple2 * 0.4;

                    // Hot spots
                    float hotSpot = pow(max(ripple1, 0.0), 4.0) * 0.6;

                    // Edge distance
                    float edgeDist = length(vUv - 0.5) * 2.0;

                    // Base lava: blend crust and hot lava based on ripple
                    vec3 col = mix(crustColor, baseColor, ripple * 0.7);

                    // Hot lava veins
                    col = mix(col, hotColor, hotSpot);

                    // Bright center
                    float centerGlow = 1.0 - smoothstep(0.0, 0.8, edgeDist);
                    col += hotColor * centerGlow * 0.15;

                    // Specular highlights
                    float spec = pow(max(ripple, 0.0), 6.0) * 0.4;
                    col += vec3(spec, spec * 0.6, spec * 0.1);

                    // Cooled edges
                    float edgeCool = smoothstep(0.6, 1.0, edgeDist);
                    col = mix(col, crustColor, edgeCool * 0.5);

                    gl_FragColor = vec4(col, 1.0);
                }
            `,
            side: THREE.DoubleSide,
        });
    }

    _createPond(x, z) {
        // Flatten terrain under the lake
        this.terrain.flattenArea(x, z, 12, 12, this.terrain.getHeightAt(x, z) - 0.3);

        const pondGeo = new THREE.CircleGeometry(12, 48);
        pondGeo.rotateX(-Math.PI / 2);
        const pondMat = this._createWaterMaterial();

        const pond = new THREE.Mesh(pondGeo, pondMat);
        const pondY = this.terrain.getHeightAt(x, z);
        pond.position.set(x, pondY + 0.15, z);
        this.scene.add(pond);

        // Store pond center for audio proximity checks
        this.pondCenter = new THREE.Vector3(x, pondY, z);

        // River segment connecting pond toward fishing area
        this._createRiver(x - 5, z + 12, x - 8, z + 22, pondY);

        return pond;
    }

    _createRiver(startX, startZ, endX, endZ, waterY) {
        const dx = endX - startX;
        const dz = endZ - startZ;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);

        const riverGeo = new THREE.PlaneGeometry(3, length, 1, 8);
        riverGeo.rotateX(-Math.PI / 2);
        const riverMat = this._createWaterMaterial();
        // Will share time uniform via updateAnimations

        const river = new THREE.Mesh(riverGeo, riverMat);
        river.position.set(
            startX + dx * 0.5,
            waterY + 0.12,
            startZ + dz * 0.5
        );
        river.rotation.y = angle;
        this.scene.add(river);
        this._riverMesh = river;
    }

    _placeCampfire() {
        const fireX = 5, fireZ = 5;
        const fireY = this.terrain.getHeightAt(fireX, fireZ);
        this.campfirePosition = new THREE.Vector3(fireX, fireY, fireZ);

        const ringMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.95 });
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const stone = new THREE.Mesh(new THREE.SphereGeometry(0.15, 4, 3), ringMat);
            stone.position.set(fireX + Math.cos(angle) * 0.5, fireY + 0.1, fireZ + Math.sin(angle) * 0.5);
            stone.scale.y = 0.6;
            this.scene.add(stone);
        }

        const logMat = new THREE.MeshStandardMaterial({ color: 0x3A2010 });
        for (let i = 0; i < 3; i++) {
            const log = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 5), logMat);
            log.position.set(fireX, fireY + 0.15, fireZ);
            log.rotation.z = Math.PI / 2;
            log.rotation.y = (i / 3) * Math.PI;
            this.scene.add(log);
        }

        this.fireParticles = [];
        const flameMat = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.8 });
        const flameMatYellow = new THREE.MeshBasicMaterial({ color: 0xFFCC00, transparent: true, opacity: 0.7 });

        for (let i = 0; i < 6; i++) {
            const height = 0.3 + Math.random() * 0.4;
            const geo = new THREE.ConeGeometry(0.08 + Math.random() * 0.06, height, 4);
            const mat = i % 2 === 0 ? flameMat : flameMatYellow;
            const flame = new THREE.Mesh(geo, mat);
            flame.position.set(
                fireX + (Math.random() - 0.5) * 0.3,
                fireY + 0.2 + height / 2,
                fireZ + (Math.random() - 0.5) * 0.3
            );
            flame.userData._baseY = flame.position.y;
            flame.userData._baseX = flame.position.x;
            flame.userData._baseZ = flame.position.z;
            flame.userData._phase = Math.random() * Math.PI * 2;
            flame.userData._speed = 2 + Math.random() * 2;
            this.scene.add(flame);
            this.fireParticles.push(flame);
        }

        // Extra red-orange inner flames
        const innerFlameMat = new THREE.MeshBasicMaterial({ color: 0xFF3300, transparent: true, opacity: 0.6 });
        for (let i = 0; i < 2; i++) {
            const height = 0.2 + Math.random() * 0.3;
            const geo = new THREE.ConeGeometry(0.05 + Math.random() * 0.04, height, 4);
            const flame = new THREE.Mesh(geo, innerFlameMat);
            flame.position.set(
                fireX + (Math.random() - 0.5) * 0.15,
                fireY + 0.25 + height / 2,
                fireZ + (Math.random() - 0.5) * 0.15
            );
            flame.userData._baseY = flame.position.y;
            flame.userData._baseX = flame.position.x;
            flame.userData._baseZ = flame.position.z;
            flame.userData._phase = Math.random() * Math.PI * 2;
            flame.userData._speed = 3 + Math.random() * 2;
            this.scene.add(flame);
            this.fireParticles.push(flame);
        }

        // Campfire hitbox for cooking
        const campfireHitbox = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 1.5, 6),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        campfireHitbox.position.set(fireX, fireY + 0.75, fireZ);
        campfireHitbox.userData = { type: 'campfire', interactable: true, name: 'Campfire' };
        campfireHitbox._entityRef = { type: 'campfire' };
        this.scene.add(campfireHitbox);
        this.interactables.push(campfireHitbox);

        this.fireLight = new THREE.PointLight(0xFF6622, 1.5, 15);
        this.fireLight.position.set(fireX, fireY + 1.0, fireZ);
        this.scene.add(this.fireLight);
    }

    _placeFishingSpots() {
        const spotConfigs = CONFIG.WORLD_OBJECTS.fishingSpots || [{ type: 'shrimp', x: 25, z: 20 }];
        for (const spotData of spotConfigs) {
            const spotX = spotData.x, spotZ = spotData.z;
            const spotY = this.terrain.getHeightAt(spotX, spotZ) + 0.2;
            const group = new THREE.Group();

            const buoyColor = spotData.type === 'lobster' ? 0xFF6600 : spotData.type === 'trout' ? 0x3388FF : 0xFF3333;
            const buoy = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 4), new THREE.MeshStandardMaterial({ color: buoyColor }));
            buoy.position.y = 0.15;
            group.add(buoy);
            const strip = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.08, 6), new THREE.MeshStandardMaterial({ color: 0xFFFFFF }));
            strip.position.y = 0.15;
            group.add(strip);
            const rippleGeo = new THREE.RingGeometry(0.3, 0.5, 16);
            rippleGeo.rotateX(-Math.PI / 2);
            const ripple = new THREE.Mesh(rippleGeo, new THREE.MeshBasicMaterial({ color: 0x66BBDD, transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
            ripple.position.y = 0.05;
            group.add(ripple);
            group.position.set(spotX, spotY, spotZ);

            const fishName = CONFIG.FISHING[spotData.type]?.name || 'Fishing';
            group.userData = { type: 'fishing_spot', interactable: true, name: `${fishName} fishing spot`, fishType: spotData.type };
            group._entityRef = { type: 'fishing_spot', fishType: spotData.type };

            this.scene.add(group);
            this.interactables.push(group);
            this.fishingSpots.push({ mesh: group, baseY: spotY, fishType: spotData.type });
        }
        // Keep backward compat: first spot is "fishingSpot"
        if (this.fishingSpots.length > 0) {
            this.fishingSpot = this.fishingSpots[0].mesh;
            this.fishingSpotBaseY = this.fishingSpots[0].baseY;
        }
        // Stagger initial roaming timers so spots don't all move at once
        const baseInterval = CONFIG.WORLD_OBJECTS.fishingSpotMoveInterval || 90;
        for (let i = 0; i < this.fishingSpots.length; i++) {
            this._fishingSpotTimers.push(baseInterval * (0.5 + i * 0.35) + (Math.random() - 0.5) * 10);
        }
    }

    _relocateFishingSpot(index) {
        const spot = this.fishingSpots[index];
        if (!spot) return;
        const pool = CONFIG.WORLD_OBJECTS.fishingSpotPool;
        if (!pool || pool.length === 0) return;

        // Collect positions currently occupied by other spots
        const occupied = new Set();
        for (let i = 0; i < this.fishingSpots.length; i++) {
            if (i === index) continue;
            const s = this.fishingSpots[i];
            occupied.add(`${Math.round(s.mesh.position.x)},${Math.round(s.mesh.position.z)}`);
        }

        // Filter pool to available positions (not occupied and not current)
        const curKey = `${Math.round(spot.mesh.position.x)},${Math.round(spot.mesh.position.z)}`;
        const available = pool.filter(p => {
            const key = `${p.x},${p.z}`;
            return key !== curKey && !occupied.has(key);
        });
        if (available.length === 0) return;

        const chosen = available[Math.floor(Math.random() * available.length)];
        const newY = this.terrain.getHeightAt(chosen.x, chosen.z) + 0.2;

        spot.mesh.position.set(chosen.x, newY, chosen.z);
        spot.baseY = newY;

        // Update backward-compat reference
        if (index === 0) {
            this.fishingSpotBaseY = newY;
        }

        return { x: chosen.x, z: chosen.z };
    }

    _placeNPCs() {
        for (const [npcId, npcConfig] of Object.entries(CONFIG.NPCS)) {
            const mesh = this.assets.createNPC(npcId);
            const y = this.terrain.getHeightAt(npcConfig.x, npcConfig.z);
            mesh.position.set(npcConfig.x, y, npcConfig.z);
            const parts = mesh.userData._parts;
            mesh.userData = { type: 'npc', interactable: true, name: npcConfig.name, npcId, _parts: parts };
            mesh._entityRef = { type: 'npc', npcId: npcId };
            this.scene.add(mesh);
            this.interactables.push(mesh);
            const npc = { mesh, id: npcId, config: npcConfig };
            npc._breathPhase = Math.random() * Math.PI * 2;
            this.npcs.push(npc);
        }
    }

    _placeDungeonEntrance() {
        const dungeonX = -45, dungeonZ = -35;
        const dungeonY = this.terrain.getHeightAt(dungeonX, dungeonZ);

        const entrance = this.assets.createDungeonEntrance();
        entrance.position.set(dungeonX, dungeonY, dungeonZ);
        entrance.rotation.y = Math.PI * 0.25;
        entrance.userData = { type: 'ladder', interactable: true, name: 'Climb down' };
        entrance._entityRef = { type: 'ladder', targetFloor: 0, direction: 'down' };
        this.scene.add(entrance);
        this.interactables.push(entrance);


        // Dark ground around dungeon area
        const darkGround = new THREE.Mesh(
            new THREE.CircleGeometry(15, 16),
            new THREE.MeshStandardMaterial({ color: 0x222211, roughness: 0.95 })
        );
        darkGround.rotation.x = -Math.PI / 2;
        darkGround.position.set(-50, dungeonY + 0.02, -48);
        this.scene.add(darkGround);

        // Scattered bones
        const boneMat = new THREE.MeshStandardMaterial({ color: 0xE8E0D0, roughness: 0.7 });
        for (let i = 0; i < 8; i++) {
            const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.3, 4), boneMat);
            bone.position.set(-50 + (Math.random() - 0.5) * 20, dungeonY + 0.05, -48 + (Math.random() - 0.5) * 15);
            bone.rotation.z = Math.random() * Math.PI;
            bone.rotation.x = Math.random() * 0.3;
            this.scene.add(bone);
        }
    }

    _placeMonsters() {
        // Overworld monsters
        for (const data of CONFIG.WORLD_OBJECTS.monsters) {
            this._spawnMonster(data);
        }

        // Dungeon floors (underground)
        this._buildDungeon();

        // Wilderness monsters
        for (const data of CONFIG.WORLD_OBJECTS.wildernessMonsters) {
            this._spawnMonster(data);
        }
    }

    _spawnMonster(data) {
        const monsterMesh = this.assets.createMonster(data.type);
        const y = this.terrain.getHeightAt(data.x, data.z);
        monsterMesh.position.set(data.x, y, data.z);
        this.scene.add(monsterMesh);

        const monsterConfig = CONFIG.MONSTERS[data.type];
        const monster = new Monster(monsterMesh, monsterConfig, new THREE.Vector3(data.x, y, data.z));
        // Assign multiplayer sync ID if present
        if (data.id) {
            monster.id = data.id;
            this.monsterById.set(data.id, monster);
        }
        this.monsters.push(monster);
        this.interactables.push(monsterMesh);
        monsterMesh._entityRef = monster;
    }

    _spawnDungeonMonster(data, floorY) {
        const monsterMesh = this.assets.createMonster(data.type);
        monsterMesh.position.set(data.x, floorY, data.z);
        this.scene.add(monsterMesh);
        const monsterConfig = CONFIG.MONSTERS[data.type];
        const monster = new Monster(monsterMesh, monsterConfig, new THREE.Vector3(data.x, floorY, data.z));
        // Assign multiplayer sync ID if present
        if (data.id) {
            monster.id = data.id;
            this.monsterById.set(data.id, monster);
        }
        this.monsters.push(monster);
        this.interactables.push(monsterMesh);
        monsterMesh._entityRef = monster;
    }

    _buildDungeon() {
        this.dungeonFloors = [];
        const floorConfigs = CONFIG.WORLD_OBJECTS.dungeonFloors;
        const floorKeys = ['floor1', 'floor2', 'floor3'];
        const roomSizes = [
            { w: 30, d: 30, h: 5 },  // Floor 1: large
            { w: 22, d: 22, h: 4.5 },  // Floor 2: tighter
            { w: 26, d: 26, h: 6 },  // Floor 3: boss arena
        ];
        const centerX = -50, centerZ = -43;

        for (let i = 0; i < floorKeys.length; i++) {
            const fc = floorConfigs[floorKeys[i]];
            if (!fc) continue;
            const { w, d, h } = roomSizes[i];
            const floorY = fc.y;

            // Room structure
            const room = this.assets.createDungeonRoom(w, d, h);
            room.position.set(centerX, floorY, centerZ);
            this.scene.add(room);

            // Ambient light (dimmer each floor)
            const intensity = [0.3, 0.15, 0.1][i];
            const ambient = new THREE.PointLight(0xFFAA66, intensity, w);
            ambient.position.set(centerX, floorY + h - 1, centerZ);
            this.scene.add(ambient);

            // Torches on walls
            const torchPositions = [
                [centerX - w / 2 + 1, centerZ], [centerX + w / 2 - 1, centerZ],
                [centerX, centerZ - d / 2 + 1], [centerX, centerZ + d / 2 - 1],
            ];
            for (const [tx, tz] of torchPositions) {
                const torch = this.assets.createDungeonTorch();
                torch.position.set(tx, floorY, tz);
                this.scene.add(torch);
            }

            // Floor 3 pillars (boss arena)
            if (i === 2) {
                for (const [px, pz] of [[centerX - 6, centerZ - 6], [centerX + 6, centerZ - 6], [centerX - 6, centerZ + 6], [centerX + 6, centerZ + 6]]) {
                    const pillar = this.assets.createDungeonPillar();
                    pillar.position.set(px, floorY, pz);
                    this.scene.add(pillar);
                }
            }

            // Ladder positions
            const ladderUpPos = { x: centerX + w / 2 - 3, z: centerZ + d / 2 - 3 };
            const ladderDownPos = (i < 2) ? { x: centerX - w / 2 + 3, z: centerZ - d / 2 + 3 } : null;

            // Ladder up (all floors)
            const ladderUp = this.assets.createDungeonLadder();
            ladderUp.position.set(ladderUpPos.x, floorY, ladderUpPos.z);
            ladderUp.userData = { type: 'ladder', interactable: true, name: i === 0 ? 'Climb to surface' : `Climb to floor ${i}` };
            ladderUp._entityRef = { type: 'ladder', targetFloor: i - 1, direction: 'up' };
            this.scene.add(ladderUp);
            this.interactables.push(ladderUp);

            // Ladder down (floors 1 and 2 only)
            if (ladderDownPos) {
                const ladderDown = this.assets.createDungeonLadder();
                ladderDown.position.set(ladderDownPos.x, floorY, ladderDownPos.z);
                ladderDown.userData = { type: 'ladder', interactable: true, name: `Climb to floor ${i + 2}` };
                ladderDown._entityRef = { type: 'ladder', targetFloor: i + 1, direction: 'down' };
                this.scene.add(ladderDown);
                this.interactables.push(ladderDown);
            }

            // Spawn monsters for this floor
            for (const mdata of fc.monsters) {
                this._spawnDungeonMonster(mdata, floorY);
            }

            // Store floor metadata
            this.dungeonFloors.push({
                y: floorY,
                height: h,
                bounds: { minX: centerX - w / 2 + 1, maxX: centerX + w / 2 - 1, minZ: centerZ - d / 2 + 1, maxZ: centerZ + d / 2 - 1 },
                ladderUpPos,
                ladderDownPos,
            });
        }
    }

    // ── Sheep ──────────────────────────────────────────────────────────
    _placeSheep() {
        for (const data of CONFIG.WORLD_OBJECTS.sheep) {
            const sheepMesh = this.assets.createSheep();
            const y = this.terrain.getHeightAt(data.x, data.z);
            sheepMesh.position.set(data.x, y, data.z);
            sheepMesh.rotation.y = Math.random() * Math.PI * 2;
            // userData is already set by createSheep()
            sheepMesh._entityRef = { type: 'sheep' };
            this.scene.add(sheepMesh);
            this.interactables.push(sheepMesh);
            this.sheep.push(sheepMesh);
        }
    }

    // ── Agility Obstacles ──────────────────────────────────────────────
    _placeAgilityObstacles() {
        for (let i = 0; i < CONFIG.AGILITY_COURSE.obstacles.length; i++) {
            const obstacle = CONFIG.AGILITY_COURSE.obstacles[i];
            const obstacleMesh = this.assets.createAgilityObstacle(obstacle);
            const y = this.terrain.getHeightAt(obstacle.x, obstacle.z);
            obstacleMesh.position.set(obstacle.x, y, obstacle.z);
            obstacleMesh.userData = {
                type: 'agility',
                interactable: true,
                name: obstacle.name,
                obstacleIndex: i,
                obstacleData: obstacle,
            };
            obstacleMesh._entityRef = { type: 'agility', obstacleIndex: i, obstacle };
            this.scene.add(obstacleMesh);
            this.interactables.push(obstacleMesh);
            this.agilityObstacles.push(obstacleMesh);
        }
    }

    // ── Rune Altar ─────────────────────────────────────────────────────
    _placeRuneAltar() {
        const altarX = 40, altarZ = -30;
        const altarY = this.terrain.getHeightAt(altarX, altarZ);
        const altar = this.assets.createRuneAltar();
        altar.position.set(altarX, altarY, altarZ);
        altar.userData = { type: 'rune_altar', interactable: true, name: 'Rune altar' };
        altar._entityRef = { type: 'rune_altar' };
        this.runeAltarMesh = altar;
        this.scene.add(altar);
        this.interactables.push(altar);
    }

    // ── Wilderness Boundary ────────────────────────────────────────────
    _placeWildernessBoundary() {
        const boundaryZ = -50;
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x442222, roughness: 0.9 });
        const skullMat = new THREE.MeshStandardMaterial({
            color: 0xDDCCBB, roughness: 0.8, emissive: 0x331111, emissiveIntensity: 0.2,
        });

        // Place poles/skulls along the boundary
        for (let x = -140; x <= 140; x += 8) {
            const y = this.terrain.getHeightAt(x, boundaryZ);

            // Pole
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.1, 2.5, 5), poleMat
            );
            pole.position.set(x, y + 1.25, boundaryZ);
            pole.castShadow = true;
            this.scene.add(pole);

            // Skull on top of every other pole
            if (Math.abs(x) % 16 === 0) {
                const skull = new THREE.Mesh(
                    new THREE.SphereGeometry(0.18, 5, 4), skullMat
                );
                skull.position.set(x, y + 2.6, boundaryZ);
                skull.scale.set(1, 1.2, 0.9);
                this.scene.add(skull);

                // Eye sockets
                for (let side = -1; side <= 1; side += 2) {
                    const eye = new THREE.Mesh(
                        new THREE.SphereGeometry(0.04, 4, 3),
                        new THREE.MeshBasicMaterial({ color: 0xFF0000, emissive: 0xFF0000 })
                    );
                    eye.position.set(x + side * 0.06, y + 2.64, boundaryZ - 0.14);
                    this.scene.add(eye);
                }
            }

            // Crossbar rope between poles
            if (x < 80) {
                const rope = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.02, 0.02, 8, 3),
                    new THREE.MeshStandardMaterial({ color: 0x553322 })
                );
                rope.position.set(x + 4, y + 2.2, boundaryZ);
                rope.rotation.z = Math.PI / 2;
                this.scene.add(rope);
            }
        }

        // Warning ditch (dark strip along the boundary)
        const ditchGeo = new THREE.PlaneGeometry(280, 3);
        ditchGeo.rotateX(-Math.PI / 2);
        const ditchMat = new THREE.MeshStandardMaterial({
            color: 0x111100, roughness: 1.0, transparent: true, opacity: 0.8,
        });
        const ditch = new THREE.Mesh(ditchGeo, ditchMat);
        const ditchY = this.terrain.getHeightAt(0, boundaryZ);
        ditch.position.set(0, ditchY + 0.03, boundaryZ);
        this.scene.add(ditch);
    }

    // ── Biome Content ─────────────────────────────────────────────────
    _placeBiomes() {
        // Desert (x > 50)
        const desert = CONFIG.BIOMES?.desert;
        if (desert) {
            for (let i = 0; i < 6; i++) {
                const cx = 55 + Math.random() * 30;
                const cz = -5 + Math.random() * 30;
                const cactus = this.assets.createCactus();
                const cy = this.terrain.getHeightAt(cx, cz);
                cactus.position.set(cx, cy, cz);
                this.scene.add(cactus);
            }
            // Scorpions
            const scorpionSpots = [
                { x: 60, z: 5 }, { x: 65, z: 15 }, { x: 70, z: 10 },
            ];
            for (const sp of scorpionSpots) {
                this._spawnMonster({ type: 'scorpion', x: sp.x, z: sp.z });
            }
        }

        // Swamp (x < -30, z > 25)
        const swamp = CONFIG.BIOMES?.swamp;
        if (swamp) {
            for (let i = 0; i < 5; i++) {
                const tx = -35 - Math.random() * 20;
                const tz = 30 + Math.random() * 20;
                const deadTree = this.assets.createDeadTree();
                const ty = this.terrain.getHeightAt(tx, tz);
                deadTree.position.set(tx, ty, tz);
                this.scene.add(deadTree);
            }
            // Giant frogs
            const frogSpots = [
                { x: -40, z: 35 }, { x: -45, z: 40 }, { x: -38, z: 45 }, { x: -50, z: 38 },
            ];
            for (const sp of frogSpots) {
                this._spawnMonster({ type: 'giant_frog', x: sp.x, z: sp.z });
            }
        }

        // Ice (z < -75)
        const ice = CONFIG.BIOMES?.ice;
        if (ice) {
            for (let i = 0; i < 4; i++) {
                const rx = -15 + Math.random() * 40;
                const rz = -80 - Math.random() * 25;
                const iceRock = this.assets.createIceRock();
                const ry = this.terrain.getHeightAt(rx, rz);
                iceRock.position.set(rx, ry, rz);
                this.scene.add(iceRock);
            }
            // Ice wolves
            const wolfSpots = [
                { x: 0, z: -85 }, { x: 10, z: -90 }, { x: -10, z: -88 },
            ];
            for (const sp of wolfSpots) {
                this._spawnMonster({ type: 'ice_wolf', x: sp.x, z: sp.z });
            }
        }

        // Volcanic (x > 85)
        const volcanic = CONFIG.BIOMES?.volcanic;
        if (volcanic) {
            // Volcano landmark at (110, 0)
            const volcano = this.assets.createVolcano();
            const vy = this.terrain.getHeightAt(110, 0);
            volcano.position.set(110, vy, 0);
            this.scene.add(volcano);

            // 3 lava pools
            const lavaSpots = [{x:100, z:5}, {x:108, z:-10}, {x:115, z:12}];
            for (const ls of lavaSpots) {
                const lavaGeo = new THREE.CircleGeometry(3, 24);
                lavaGeo.rotateX(-Math.PI / 2);
                const lavaMat = this._createLavaMaterial();
                const lavaMesh = new THREE.Mesh(lavaGeo, lavaMat);
                const ly = this.terrain.getHeightAt(ls.x, ls.z);
                this.terrain.flattenArea(ls.x, ls.z, 4, 4, ly - 0.2);
                lavaMesh.position.set(ls.x, ly - 0.05, ls.z);
                this.scene.add(lavaMesh);
                this.lavaPools.push(lavaMesh);

                // Orange point light near lava
                const lavaLight = new THREE.PointLight(0xFF4400, 0.6, 12);
                lavaLight.position.set(ls.x, ly + 1, ls.z);
                this.scene.add(lavaLight);
            }

            // 5 volcanic rocks (dark decorations)
            for (let i = 0; i < 5; i++) {
                const rx = 90 + Math.random() * 30;
                const rz = -15 + Math.random() * 30;
                const vrock = this.assets.createVolcanicRock();
                vrock.position.set(rx, this.terrain.getHeightAt(rx, rz), rz);
                this.scene.add(vrock);
            }

            // Fire elemental spawns
            const fireSpots = [{x:100, z:10}, {x:108, z:-5}, {x:115, z:5}];
            for (const sp of fireSpots) {
                this._spawnMonster({ type: 'fire_elemental', x: sp.x, z: sp.z });
            }
        }

        // Desert City guards (x 68-82, z 5-20)
        if (desert) {
            const guardSpots = [{x:74, z:12}, {x:80, z:14}];
            for (const sp of guardSpots) {
                this._spawnMonster({ type: 'desert_guard', x: sp.x, z: sp.z });
            }
        }

        // Firefly spawn positions (near tree clusters)
        this.fireflyPositions = [
            { x: 15, y: this.terrain.getHeightAt(15, 10), z: 10 },
            { x: 18, y: this.terrain.getHeightAt(18, 12), z: 12 },
            { x: -10, y: this.terrain.getHeightAt(-10, 15), z: 15 },
            { x: -12, y: this.terrain.getHeightAt(-12, 18), z: 18 },
            { x: 30, y: this.terrain.getHeightAt(30, -5), z: -5 },
            { x: 32, y: this.terrain.getHeightAt(32, -3), z: -3 },
        ];
    }

    _placeUnderwaterCave() {
        const caveY = -15;
        const caveX = 0, caveZ = 0;
        const caveW = 30, caveD = 30, caveH = 6;

        // Room structure (reuse dungeon room pattern)
        const room = this.assets.createDungeonRoom(caveW, caveD, caveH);
        // Override material to cave blue-gray
        room.traverse(child => {
            if (child.isMesh) {
                child.material = this.assets.materials.caveFloor;
            }
        });
        room.position.set(caveX, caveY, caveZ);
        this.scene.add(room);

        // Ambient blue light
        const caveAmbient = new THREE.PointLight(0x2288AA, 0.4, caveW);
        caveAmbient.position.set(caveX, caveY + caveH - 1, caveZ);
        this.scene.add(caveAmbient);

        // Glowing mushrooms (10)
        for (let i = 0; i < 10; i++) {
            const mx = caveX - caveW / 2 + 2 + Math.random() * (caveW - 4);
            const mz = caveZ - caveD / 2 + 2 + Math.random() * (caveD - 4);
            const mush = this.assets.createGlowingMushroom();
            mush.position.set(mx, caveY, mz);
            this.scene.add(mush);
        }

        // Sea serpent spawns (3)
        const serpentSpots = [{x:-5, z:-5}, {x:5, z:5}, {x:0, z:-8}];
        for (const sp of serpentSpots) {
            this._spawnDungeonMonster({ type: 'sea_serpent', x: sp.x, z: sp.z }, caveY);
        }

        // Obsidian rock nodes inside cave (3)
        const rockSpots = [{x:-8, z:0}, {x:8, z:-3}, {x:0, z:8}];
        for (const ps of rockSpots) {
            const rockMesh = this.assets.createRock('obsidian');
            rockMesh.position.set(ps.x, caveY, ps.z);
            this.scene.add(rockMesh);
            const rockConfig = CONFIG.ROCKS.obsidian;
            const node = new ResourceNode(rockMesh, {
                type: 'rock', subType: 'obsidian', ...rockConfig,
            });
            this.resourceNodes.push(node);
            this.interactables.push(rockMesh);
            rockMesh._entityRef = node;
        }

        // Entry portal (on surface near pond ~18, 14)
        const portalIn = this.assets.createPortal(0x2288FF);
        const portalY = this.terrain.getHeightAt(18, 14);
        portalIn.position.set(18, portalY, 14);
        portalIn.userData = { type: 'portal', interactable: true, name: 'Underwater Portal',
            targetX: caveX, targetZ: caveZ, targetY: caveY + 1.6 };
        portalIn._entityRef = { type: 'portal', targetX: caveX, targetZ: caveZ, targetY: caveY + 1.6 };
        this.scene.add(portalIn);
        this.interactables.push(portalIn);

        // Return portal (inside cave, near east wall)
        const portalOut = this.assets.createPortal(0x22FF88);
        portalOut.position.set(caveX + caveW / 2 - 2, caveY + 0.1, caveZ);
        const surfaceY = this.terrain.getHeightAt(20, 14) + CONFIG.PLAYER.height;
        portalOut.userData = { type: 'portal', interactable: true, name: 'Surface Portal',
            targetX: 20, targetZ: 14, targetY: surfaceY };
        portalOut._entityRef = { type: 'portal', targetX: 20, targetZ: 14, targetY: surfaceY };
        this.scene.add(portalOut);
        this.interactables.push(portalOut);

        // Store cave data for main.js fog/bounds
        this.underwaterCave = {
            y: caveY,
            caveH: caveH,
            bounds: {
                minX: caveX - caveW / 2 + 1,
                maxX: caveX + caveW / 2 - 1,
                minZ: caveZ - caveD / 2 + 1,
                maxZ: caveZ + caveD / 2 - 1,
            },
        };
    }

    spawnGroundItem(itemId, qty, worldPos, serverId) {
        const itemDef = CONFIG.ITEMS[itemId];
        if (!itemDef) return;
        const colors = {
            logs: 0x8B6914, oak_logs: 0x6B4226, willow_logs: 0x4AA84C,
            copper_ore: 0xB87333, tin_ore: 0xC0C0C0, iron_ore: 0x8B4513,
            coal: 0x222222, bones: 0xEEDDCC, dragon_bones: 0xCCBBAA,
            raw_chicken: 0xFFCC88, raw_beef: 0xFF8866, raw_shrimp: 0xFF8866,
            cooked_chicken: 0xCC8844, cooked_beef: 0xBB7733, cooked_shrimp: 0xEE9955,
            feather: 0xFFFFFF, coins: 0xFFD700, cowhide: 0x8B6914, wool: 0xF5F5F5,
            goblin_mail: 0x44AA44, bronze_bar: 0xCC8844, iron_bar: 0xAAAAAA,
            bronze_sword: 0xCC8844, iron_sword: 0xAAAAAA, steel_sword: 0x888888,
            iron_chainbody: 0x888888, steel_platebody: 0x777777,
            bronze_shield: 0xCC8844, leather_boots: 0x8B6914,
            iron_helm: 0xAAAAAA, iron_legs: 0xAAAAAA,
            air_rune: 0xCCCCFF, mind_rune: 0xFF8800, water_rune: 0x4488FF,
            earth_rune: 0x886644, fire_rune: 0xFF4400, chaos_rune: 0xFF00FF,
            rune_essence: 0xDDDDEE, shortbow: 0x8B6914, staff_of_air: 0x6688CC,
            bronze_arrow: 0xCC8844, iron_arrow: 0xAAAAAA,
            burnt_food: 0x222222,
            raw_trout: 0xDD8855, cooked_trout: 0xBB7744,
            raw_lobster: 0xFF4400, cooked_lobster: 0xCC3300,
            herb: 0x22AA44, vial: 0x66BBFF,
            attack_potion: 0xFF4444, strength_potion: 0x44FF44, defence_potion: 0x4444FF,
            mithril_ore: 0x1A237E, adamantite_ore: 0x2E7D32, runite_ore: 0x00ACC1,
            mithril_bar: 0x1A237E, adamant_bar: 0x2E7D32, rune_bar: 0x00ACC1,
            steel_bar: 0x888888, steel_arrow: 0x888888, oak_shortbow: 0x6B4226,
            mithril_sword: 0x1A237E, mithril_platebody: 0x1A237E, mithril_dagger: 0x1A237E,
            adamant_sword: 0x2E7D32, adamant_platebody: 0x2E7D32,
            rune_sword: 0x00ACC1, rune_platebody: 0x00ACC1, rune_dagger: 0x00ACC1,
            knife: 0xCCCCCC, tinderbox: 0xCC6600,
            demons_bane: 0xFF4400, lantern: 0xFFAA00,
            clue_scroll_easy: 0xFFAA00, clue_scroll_medium: 0xFF6600, clue_scroll_hard: 0xFF0000,
            fancy_hat: 0xFF00FF, golden_boots: 0xFFD700, team_cape: 0x4444FF,
            pet_rock_golem: 0x888888, pet_beaver: 0x8B6914, pet_heron: 0xEEEEFF,
            pet_phoenix: 0xFF4400, pet_rocky: 0x666666, pet_kbd_jr: 0x222222,
            pet_demon_jr: 0xFF2200, pet_bloodhound: 0xAA6633,
            stamina_potion: 0xFFAA00, antipoison: 0x00AA44,
            obsidian_ore: 0x222222, palm_logs: 0x8B6914, pearl: 0xF0E8D0, raw_seaweed: 0x226644,
        };
        const color = colors[itemId] || 0xFFFFFF;
        const geo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
        const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            worldPos.x + (Math.random() - 0.5) * 1.5,
            worldPos.y + 0.3,
            worldPos.z + (Math.random() - 0.5) * 1.5
        );
        mesh.userData = { type: 'ground_item', interactable: true, name: `${itemDef.name}${qty > 1 ? ' x' + qty : ''}` };
        mesh._entityRef = { type: 'ground_item', itemId, qty, serverId: serverId || null };
        this.scene.add(mesh);
        this.interactables.push(mesh);
        this.groundItems.push({ mesh, itemId, qty, timer: 60, serverId: serverId || null });
    }

    removeGroundItem(mesh) {
        const idx = this.groundItems.findIndex(g => g.mesh === mesh);
        if (idx >= 0) this.groundItems.splice(idx, 1);
        const iIdx = this.interactables.indexOf(mesh);
        if (iIdx >= 0) this.interactables.splice(iIdx, 1);
        this.scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
    }

    /** Remove a server-tracked ground item by its server ID */
    removeGroundItemByServerId(serverId) {
        const idx = this.groundItems.findIndex(g => g.serverId === serverId);
        if (idx < 0) return;
        const gi = this.groundItems[idx];
        this.removeGroundItem(gi.mesh);
    }

    updateAnimations(dt, playerPos) {
        const time = performance.now() * 0.001;
        if (this.pondMesh && this.pondMesh.material.uniforms) {
            this.pondMesh.material.uniforms.time.value = time;
        }
        if (this._riverMesh && this._riverMesh.material.uniforms) {
            this._riverMesh.material.uniforms.time.value = time;
        }
        for (const lava of this.lavaPools) {
            if (lava.material.uniforms) {
                lava.material.uniforms.time.value = time;
            }
        }
        for (const flame of this.fireParticles) {
            const d = flame.userData;
            const t = time * d._speed + d._phase;
            flame.position.y = d._baseY + Math.sin(t) * 0.1;
            flame.position.x = d._baseX + Math.sin(t * 1.3) * 0.03;
            flame.position.z = d._baseZ + Math.cos(t * 0.9) * 0.03;
            flame.scale.y = 0.8 + Math.sin(t * 2) * 0.3;
            flame.scale.x = 0.8 + Math.sin(t * d._speed * 1.3 + d._phase * 0.7) * 0.3;
            flame.material.opacity = 0.5 + Math.sin(t * 1.5) * 0.3;
        }
        if (this.fireLight) {
            this.fireLight.intensity = 1.2 + Math.sin(time * 5) * 0.3 + Math.sin(time * 7.3) * 0.2;
        }
        for (const spot of this.fishingSpots) {
            spot.mesh.position.y = spot.baseY + Math.sin(time * 2) * 0.08;
        }
        // Roaming fishing spots — relocate periodically
        const moveInterval = CONFIG.WORLD_OBJECTS.fishingSpotMoveInterval || 90;
        for (let i = 0; i < this._fishingSpotTimers.length; i++) {
            this._fishingSpotTimers[i] -= dt;
            if (this._fishingSpotTimers[i] <= 0) {
                const result = this._relocateFishingSpot(i);
                this._fishingSpotTimers[i] = moveInterval + (Math.random() - 0.5) * 20;
                if (result && this._game) {
                    // Notify player if they were fishing this spot type
                    const spot = this.fishingSpots[i];
                    const player = this._game.player;
                    if (player && player.skillingTarget && player.skillingTarget.type === 'fishing_spot'
                        && player.skillingTarget.fishType === spot.fishType) {
                        this._game.uiManager?.addChatMessage('The fishing spot has moved!', '#3388FF');
                    }
                    // Play splash sound at new location
                    if (this._game.audioManager) {
                        this._game.audioManager.playSplash?.();
                    }
                }
            }
        }
        for (let i = this.groundItems.length - 1; i >= 0; i--) {
            const item = this.groundItems[i];
            item.mesh.rotation.y += dt * 2;
            item.mesh.position.y += Math.sin(time * 3 + i) * 0.001;
            item.timer -= dt;
            // Flash when about to despawn (last 15 seconds)
            if (item.timer < 15) {
                const flashRate = item.timer < 5 ? 8 : 3; // Fast flash under 5s
                const visible = Math.sin(time * flashRate) > 0;
                item.mesh.visible = visible;
            } else {
                item.mesh.visible = true;
            }
            if (item.timer <= 0) this.removeGroundItem(item.mesh);
        }

        // NPC animations (idle bob or waypoint wandering)
        for (let n = 0; n < this.npcs.length; n++) {
            const npc = this.npcs[n];
            if (!npc._baseY) npc._baseY = npc.mesh.position.y;
            if (!npc._phase) npc._phase = n * 1.7;

            const cfg = npc.config;
            if (cfg.wander && cfg.wanderWaypoints) {
                // Waypoint-based wandering
                if (npc._wpIndex === undefined) npc._wpIndex = 0;
                if (npc._wpPause === undefined) npc._wpPause = 0;
                if (!npc._walking) npc._walking = false;

                const target = cfg.wanderWaypoints[npc._wpIndex];
                const dx = target.x - npc.mesh.position.x;
                const dz = target.z - npc.mesh.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (npc._walking) {
                    if (dist < 0.5) {
                        npc._walking = false;
                        npc._wpPause = cfg.wanderPause || 8;
                    } else {
                        const spd = (cfg.wanderSpeed || 1.5) * dt;
                        npc.mesh.position.x += (dx / dist) * spd;
                        npc.mesh.position.z += (dz / dist) * spd;
                        npc.mesh.position.y = this.terrain.getHeightAt(npc.mesh.position.x, npc.mesh.position.z);
                        npc._baseY = npc.mesh.position.y;
                        npc.mesh.rotation.y = Math.atan2(dx, dz) + Math.PI;
                    }
                } else {
                    npc._wpPause -= dt;
                    if (npc._wpPause <= 0) {
                        npc._wpIndex = (npc._wpIndex + 1) % cfg.wanderWaypoints.length;
                        npc._walking = true;
                    }
                    // Idle bob while paused
                    npc.mesh.position.y = npc._baseY + Math.sin(time * 1.2 + npc._phase) * 0.04;
                    npc.mesh.rotation.y = Math.sin(time * 0.4 + npc._phase) * 0.26;
                }
            } else {
                // Static NPC: gentle float bob + slow idle turn
                npc.mesh.position.y = npc._baseY + Math.sin(time * 1.2 + npc._phase) * 0.04;
                npc.mesh.rotation.y = Math.sin(time * 0.4 + npc._phase) * 0.26;
            }

            // Idle animations: head turn, arm swing, breathing
            const parts = npc.mesh.userData._parts;
            if (parts) {
                // Head turn toward player when within 10m
                if (playerPos && parts.head) {
                    const hdx = playerPos.x - npc.mesh.position.x;
                    const hdz = playerPos.z - npc.mesh.position.z;
                    const hdist = Math.sqrt(hdx * hdx + hdz * hdz);
                    if (hdist < 10) {
                        const angleToPlayer = Math.atan2(hdx, hdz) - npc.mesh.rotation.y;
                        const clamped = Math.max(-0.5, Math.min(0.5, angleToPlayer));
                        parts.head.rotation.y += (clamped - parts.head.rotation.y) * dt * 3;
                    } else {
                        parts.head.rotation.y += (0 - parts.head.rotation.y) * dt * 3;
                    }
                }

                // Arm swing while walking
                if (npc._walking) {
                    if (parts.armL) parts.armL.rotation.x = Math.sin(time * 6) * 0.4;
                    if (parts.armR) parts.armR.rotation.x = -Math.sin(time * 6) * 0.4;
                } else {
                    if (parts.armL) parts.armL.rotation.x *= 0.9;
                    if (parts.armR) parts.armR.rotation.x *= 0.9;
                }

                // Breathing animation on torso
                if (parts.torso) {
                    const breathPhase = npc._breathPhase || 0;
                    parts.torso.scale.y = 1.0 + Math.sin(time * 2 + breathPhase) * 0.015;
                }
            }
        }

        // Loot beam animations
        for (let i = this.lootBeams.length - 1; i >= 0; i--) {
            const beam = this.lootBeams[i];
            beam.timer -= dt;
            beam.mesh.rotation.y += dt * 2;
            beam.mesh.material.opacity = 0.3 + Math.sin(time * 4) * 0.2;
            if (beam.timer <= 0) {
                this.scene.remove(beam.mesh);
                beam.mesh.geometry.dispose();
                beam.mesh.material.dispose();
                this.lootBeams.splice(i, 1);
            }
        }

        // Portal animations
        if (this._portals) {
            for (const portal of this._portals) {
                portal.rotation.x += dt * 1.2;
                portal.rotation.y += dt * 0.8;
                portal.material.opacity = 0.5 + Math.sin(time * 3) * 0.2;
            }
        }

        // Gravestone timers
        for (let i = this.gravestones.length - 1; i >= 0; i--) {
            const gs = this.gravestones[i];
            gs.timer -= dt;
            // Flash when about to expire (last 30s)
            if (gs.timer < 30) {
                gs.mesh.visible = Math.sin(time * 4) > 0;
            }
            if (gs.timer <= 0) {
                // Gravestone expired - drop items on ground
                for (const item of gs.items) {
                    this.spawnGroundItem(item.itemId, item.qty, gs.mesh.position);
                }
                const iIdx = this.interactables.indexOf(gs.mesh);
                if (iIdx >= 0) this.interactables.splice(iIdx, 1);
                this.scene.remove(gs.mesh);
                this.gravestones.splice(i, 1);
            }
        }
    }

    // ── Torch placement near buildings ──
    _placeTorches() {
        const torchPositions = [
            // Near castle
            { x: 3, z: -12 }, { x: -3, z: -12 },
            { x: 3, z: -18 }, { x: -3, z: -18 },
            // Near shop
            { x: 12, z: -5 }, { x: 8, z: -5 },
            // Near church
            { x: 17, z: -15 }, { x: 13, z: -15 },
            // Near house
            { x: -10, z: -3 }, { x: -6, z: -3 },
        ];

        for (const pos of torchPositions) {
            const y = this.terrain.getHeightAt(pos.x, pos.z);
            const group = new THREE.Group();

            // Torch post
            const postMat = new THREE.MeshStandardMaterial({ color: 0x5C3A1E, roughness: 0.9 });
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.5, 5), postMat);
            post.position.y = 0.75;
            group.add(post);

            // Torch head (flame holder)
            const headMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
            const head = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.15, 5), headMat);
            head.position.y = 1.55;
            group.add(head);

            // Flame (cone)
            const flameMat = new THREE.MeshBasicMaterial({ color: 0xFF8822, transparent: true, opacity: 0.8 });
            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 4), flameMat);
            flame.position.y = 1.72;
            group.add(flame);

            // Point light (warm, initially off - turned on at night)
            const light = new THREE.PointLight(0xFF8833, 0, 10);
            light.position.y = 1.7;
            group.add(light);

            group.position.set(pos.x, y, pos.z);
            this.scene.add(group);

            this.torches.push({ mesh: group, light, flame, baseY: y });
        }
    }

    updateTorchLighting(timeOfDay) {
        const isNight = timeOfDay < 0.25 || timeOfDay > 0.75;
        const time = performance.now() * 0.001;

        for (const torch of this.torches) {
            if (isNight) {
                // Flickering effect
                const flicker = 0.8 + Math.sin(time * 5 + torch.baseY) * 0.15 + Math.sin(time * 8.3) * 0.1;
                torch.light.intensity = 1.5 * flicker;
                torch.flame.material.opacity = 0.6 + Math.sin(time * 6) * 0.3;
                torch.flame.scale.y = 0.8 + Math.sin(time * 7) * 0.3;
                torch.flame.visible = true;
            } else {
                torch.light.intensity = 0;
                torch.flame.visible = false;
            }
        }
    }

    // ── Loot Beam ──
    spawnLootBeam(position) {
        const beamGeo = new THREE.CylinderGeometry(0.1, 0.1, 20, 6);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xFFD700,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(position.x, position.y + 10, position.z);
        this.scene.add(beam);
        this.lootBeams.push({ mesh: beam, timer: 10 }); // Show for 10 seconds
    }

    // ── Gravestone ──
    spawnGravestone(position, items) {
        const y = this.terrain.getHeightAt(position.x, position.z);
        const group = new THREE.Group();

        // Stone slab (cross shape)
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });

        // Vertical slab
        const slab = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.1), stoneMat);
        slab.position.y = 0.6;
        group.add(slab);

        // Cross arm
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.1), stoneMat);
        arm.position.y = 0.95;
        group.add(arm);

        // Skull on top
        const skullMat = new THREE.MeshStandardMaterial({ color: 0xDDCCBB, roughness: 0.7 });
        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.12, 5, 4), skullMat);
        skull.position.y = 1.3;
        skull.scale.set(1, 1.2, 0.9);
        group.add(skull);

        group.position.set(position.x, y, position.z);
        group.userData = {
            type: 'gravestone',
            interactable: true,
            name: 'Gravestone (click to reclaim items)',
        };
        group._entityRef = { type: 'gravestone', items: items };

        this.scene.add(group);
        this.interactables.push(group);
        this.gravestones.push({ mesh: group, items, timer: 120 }); // 2 minute timer
    }

    removeGravestone(mesh) {
        const idx = this.gravestones.findIndex(g => g.mesh === mesh);
        if (idx >= 0) this.gravestones.splice(idx, 1);
        const iIdx = this.interactables.indexOf(mesh);
        if (iIdx >= 0) this.interactables.splice(iIdx, 1);
        this.scene.remove(mesh);
    }

    spawnNewNPC(npcData) {
        // Dynamically add an NPC to the world
        const npcConfig = {
            id: npcData.id,
            name: npcData.name,
            x: npcData.x,
            z: npcData.z,
            dialogues: npcData.dialogues || { default: [{ text: `Hello, traveler!` }] },
        };

        // Add to CONFIG so quest system can find it
        if (!CONFIG.NPCS[npcData.id]) {
            CONFIG.NPCS[npcData.id] = npcConfig;
        }

        const mesh = this.assets.createNPC(npcData.colors || {});
        const y = this.terrain.getHeightAt(npcData.x, npcData.z);
        mesh.position.set(npcData.x, y, npcData.z);

        const parts = mesh.userData._parts;
        mesh.userData = { type: 'npc', interactable: true, name: npcData.name, npcId: npcData.id, _parts: parts };
        mesh._entityRef = { type: 'npc', npcId: npcData.id };
        this.scene.add(mesh);

        const npc = { mesh, config: npcConfig };
        npc._breathPhase = Math.random() * Math.PI * 2;
        this.npcs.push(npc);
        this.interactables.push(mesh);
    }

    spawnPortal(portalData) {
        const geo = new THREE.TorusGeometry(1.5, 0.3, 8, 16);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x9933FF,
            transparent: true,
            opacity: 0.7,
        });
        const portal = new THREE.Mesh(geo, mat);
        const y = this.terrain.getHeightAt(portalData.x, portalData.z);
        portal.position.set(portalData.x, y + 1.5, portalData.z);
        portal.userData = {
            type: 'portal',
            interactable: true,
            name: portalData.name || 'Mysterious Portal',
            targetX: portalData.targetX,
            targetZ: portalData.targetZ,
        };
        portal._entityRef = { type: 'portal' };
        this.scene.add(portal);
        this.interactables.push(portal);
        this._portals = this._portals || [];
        this._portals.push(portal);
    }
}
