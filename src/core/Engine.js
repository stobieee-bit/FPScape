import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Engine {
    constructor(canvas) {
        this.canvas = canvas;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.VISUAL.skyColor);
        this.scene.fog = new THREE.Fog(
            CONFIG.VISUAL.fogColor,
            CONFIG.VISUAL.fogNear,
            CONFIG.VISUAL.fogFar
        );

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.CAMERA.fov,
            window.innerWidth / window.innerHeight,
            CONFIG.CAMERA.near,
            CONFIG.CAMERA.far
        );

        // Lighting
        this._setupLighting();

        // Viewmodel scene (first-person weapon overlay)
        this.vmScene = new THREE.Scene();
        this.vmCamera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 10);
        this.vmScene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const vmSun = new THREE.DirectionalLight(0xfff5e0, 0.9);
        vmSun.position.set(1, 2, 1);
        this.vmScene.add(vmSun);
        this._vmGroup = new THREE.Group();
        this.vmScene.add(this._vmGroup);
        this._buildViewmodel();

        // Swing animation state
        this._swingTime = 0;
        this._swingActive = false;
        this._swingDuration = 0.25;

        // Screen shake
        this._shakeAmount = 0;
        this._shakeDecay = 8; // how fast shake fades

        // Day/night cycle (1 full cycle = 5 min real time)
        this.dayDuration = 300; // seconds for a full day
        this.timeOfDay = 0.45; // start at mid-morning

        // Resize handler
        window.addEventListener('resize', () => this._onResize());
    }

    _setupLighting() {
        const v = CONFIG.VISUAL;

        // Directional light (sun)
        this.sunLight = new THREE.DirectionalLight(v.sunColor, v.sunIntensity);
        this.sunLight.position.set(v.sunPosition.x, v.sunPosition.y, v.sunPosition.z);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 1;
        this.sunLight.shadow.camera.far = 200;
        this.sunLight.shadow.camera.left = -60;
        this.sunLight.shadow.camera.right = 60;
        this.sunLight.shadow.camera.top = 60;
        this.sunLight.shadow.camera.bottom = -60;
        this.sunLight.shadow.bias = -0.001;
        this.scene.add(this.sunLight);

        // Ambient light
        this.ambientLight = new THREE.AmbientLight(v.ambientColor, v.ambientIntensity);
        this.scene.add(this.ambientLight);

        // Hemisphere light
        this.hemiLight = new THREE.HemisphereLight(
            v.hemiSkyColor, v.hemiGroundColor, v.hemiIntensity
        );
        this.scene.add(this.hemiLight);
    }

    _onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.vmCamera.aspect = w / h;
        this.vmCamera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    triggerShake(intensity) {
        this._shakeAmount = Math.max(this._shakeAmount, intensity);
    }

    setFOV(fov) {
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
    }

    updateShake(dt) {
        if (this._shakeAmount > 0.001) {
            this._shakeAmount *= Math.max(0, 1 - this._shakeDecay * dt);
            const sx = (Math.random() - 0.5) * 2 * this._shakeAmount;
            const sy = (Math.random() - 0.5) * 2 * this._shakeAmount;
            this.camera.rotation.x += sx * 0.02;
            this.camera.rotation.y += sy * 0.02;
        } else {
            this._shakeAmount = 0;
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
        // Render viewmodel on top (no depth clear so it overlays)
        this.renderer.autoClear = false;
        this.renderer.clearDepth();
        this.renderer.render(this.vmScene, this.vmCamera);
        this.renderer.autoClear = true;
    }

    _buildViewmodel() {
        // Clear old
        while (this._vmGroup.children.length) {
            const c = this._vmGroup.children[0];
            this._vmGroup.remove(c);
        }

        const skinMat = new THREE.MeshStandardMaterial({ color: 0xD4A574, roughness: 0.8 });
        const skinDark = new THREE.MeshStandardMaterial({ color: 0xC49464, roughness: 0.85 });

        // ── Forearm (tapered, angled into view) ──
        const forearm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.030, 0.042, 0.38, 8),
            skinMat
        );
        forearm.rotation.x = -Math.PI * 0.06;
        forearm.rotation.z = Math.PI * 0.10;
        forearm.position.set(0.25, -0.30, -0.32);
        this._vmGroup.add(forearm);

        // ── Wrist (transition to hand) ──
        const wrist = new THREE.Mesh(
            new THREE.CylinderGeometry(0.028, 0.030, 0.05, 8),
            skinMat
        );
        wrist.rotation.x = -Math.PI * 0.18;
        wrist.rotation.z = Math.PI * 0.06;
        wrist.position.set(0.22, -0.14, -0.48);
        this._vmGroup.add(wrist);

        // ── Hand group (palm + curled fingers forming a grip) ──
        this._vmHand = new THREE.Group();
        this._vmHand.position.set(0.20, -0.08, -0.55);
        this._vmHand.rotation.set(-Math.PI * 0.25, 0, Math.PI * 0.03);

        // Palm (smaller, flatter)
        const palm = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.028, 0.065),
            skinMat
        );
        this._vmHand.add(palm);

        // Back of hand (slight bulge)
        const handBack = new THREE.Mesh(
            new THREE.SphereGeometry(0.030, 6, 4),
            skinMat
        );
        handBack.scale.set(1, 0.5, 0.9);
        handBack.position.set(0, 0.012, 0.015);
        this._vmHand.add(handBack);

        // Thumb (wraps around from the side)
        const thumb = new THREE.Mesh(
            new THREE.CylinderGeometry(0.009, 0.008, 0.045, 5),
            skinDark
        );
        thumb.position.set(-0.038, -0.005, -0.005);
        thumb.rotation.set(-Math.PI * 0.2, 0, Math.PI * 0.4);
        this._vmHand.add(thumb);
        // Thumb tip
        const thumbTip = new THREE.Mesh(new THREE.SphereGeometry(0.009, 4, 3), skinDark);
        thumbTip.position.set(-0.045, -0.015, -0.020);
        this._vmHand.add(thumbTip);

        // ── Fingers (curled under to form grip) ──
        const fingerSpread = [
            { x: -0.018, curl: 0.55 },
            { x: -0.006, curl: 0.60 },
            { x:  0.006, curl: 0.60 },
            { x:  0.018, curl: 0.55 },
        ];
        for (const f of fingerSpread) {
            // Proximal segment (attached to palm)
            const seg1 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.008, 0.007, 0.030, 4),
                skinDark
            );
            seg1.position.set(f.x, -0.010, -0.040);
            seg1.rotation.x = f.curl;
            this._vmHand.add(seg1);

            // Distal segment (curled further under)
            const seg2 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.007, 0.006, 0.025, 4),
                skinDark
            );
            seg2.position.set(f.x, -0.025, -0.050);
            seg2.rotation.x = f.curl + 0.4;
            this._vmHand.add(seg2);
        }

        this._vmGroup.add(this._vmHand);

        // Default weapon — fist (no weapon mesh)
        this._vmWeapon = null;
    }

    /** Update the viewmodel weapon mesh based on equipped item */
    setViewmodelWeapon(itemId) {
        // Remove old weapon
        if (this._vmWeapon) {
            this._vmGroup.remove(this._vmWeapon);
            this._vmWeapon = null;
        }

        if (!itemId) return; // unarmed = just fist

        const item = CONFIG.ITEMS[itemId];
        if (!item) return;

        const g = new THREE.Group();
        const metalColor = itemId.startsWith('steel') ? 0xB8B8C0 :
                           itemId.startsWith('iron') ? 0x7A7A80 : 0xCD7F32;
        const metalDark = itemId.startsWith('steel') ? 0x909098 :
                          itemId.startsWith('iron') ? 0x5A5A60 : 0xA06025;
        const metalMat = new THREE.MeshStandardMaterial({ color: metalColor, metalness: 0.75, roughness: 0.25 });
        const metalDarkMat = new THREE.MeshStandardMaterial({ color: metalDark, metalness: 0.6, roughness: 0.35 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x5C3A1E, roughness: 0.9 });
        const leatherMat = new THREE.MeshStandardMaterial({ color: 0x4A3520, roughness: 0.95 });

        if (itemId.includes('sword')) {
            // ── Blade with taper ──
            const bladeShape = new THREE.Shape();
            bladeShape.moveTo(-0.018, 0);
            bladeShape.lineTo(-0.016, 0.42);
            bladeShape.lineTo(0, 0.50);
            bladeShape.lineTo(0.016, 0.42);
            bladeShape.lineTo(0.018, 0);
            bladeShape.lineTo(-0.018, 0);
            const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.002, bevelSegments: 1 });
            const blade = new THREE.Mesh(bladeGeo, metalMat);
            blade.position.set(0, 0.06, -0.006);
            g.add(blade);

            // Fuller (groove down center of blade)
            const fuller = new THREE.Mesh(
                new THREE.BoxGeometry(0.006, 0.30, 0.018),
                metalDarkMat
            );
            fuller.position.set(0, 0.22, 0);
            g.add(fuller);

            // Crossguard (curved, wider)
            const guard = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.018, 0.025),
                metalDarkMat
            );
            guard.position.y = 0.06;
            g.add(guard);
            // Guard tips (small spheres)
            const guardTipL = new THREE.Mesh(new THREE.SphereGeometry(0.012, 5, 3), metalDarkMat);
            guardTipL.position.set(-0.06, 0.06, 0);
            g.add(guardTipL);
            const guardTipR = new THREE.Mesh(new THREE.SphereGeometry(0.012, 5, 3), metalDarkMat);
            guardTipR.position.set(0.06, 0.06, 0);
            g.add(guardTipR);

            // Grip (wrapped leather)
            const grip = new THREE.Mesh(
                new THREE.CylinderGeometry(0.018, 0.016, 0.11, 8),
                leatherMat
            );
            g.add(grip);
            // Leather wrap lines
            for (let i = 0; i < 4; i++) {
                const wrap = new THREE.Mesh(
                    new THREE.TorusGeometry(0.018, 0.003, 4, 8),
                    woodMat
                );
                wrap.position.y = -0.04 + i * 0.025;
                wrap.rotation.x = Math.PI / 2;
                g.add(wrap);
            }

            // Pommel
            const pommel = new THREE.Mesh(
                new THREE.SphereGeometry(0.02, 6, 4),
                metalDarkMat
            );
            pommel.position.y = -0.065;
            g.add(pommel);

        } else if (itemId.includes('dagger')) {
            // ── Short tapered blade ──
            const dShape = new THREE.Shape();
            dShape.moveTo(-0.014, 0);
            dShape.lineTo(-0.010, 0.18);
            dShape.lineTo(0, 0.23);
            dShape.lineTo(0.010, 0.18);
            dShape.lineTo(0.014, 0);
            dShape.lineTo(-0.014, 0);
            const dGeo = new THREE.ExtrudeGeometry(dShape, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.001, bevelSegments: 1 });
            const dBlade = new THREE.Mesh(dGeo, metalMat);
            dBlade.position.set(0, 0.04, -0.004);
            g.add(dBlade);

            // Small crossguard
            const dGuard = new THREE.Mesh(
                new THREE.BoxGeometry(0.07, 0.012, 0.018),
                metalDarkMat
            );
            dGuard.position.y = 0.04;
            g.add(dGuard);

            // Grip
            const dGrip = new THREE.Mesh(
                new THREE.CylinderGeometry(0.014, 0.013, 0.08, 6),
                leatherMat
            );
            g.add(dGrip);

            // Pommel
            const dPom = new THREE.Mesh(new THREE.SphereGeometry(0.015, 5, 3), metalDarkMat);
            dPom.position.y = -0.045;
            g.add(dPom);

        } else if (itemId.includes('mace')) {
            // ── Shaft with grip ──
            const shaft = new THREE.Mesh(
                new THREE.CylinderGeometry(0.012, 0.014, 0.38, 6),
                woodMat
            );
            shaft.position.y = 0.10;
            g.add(shaft);

            // Leather grip section
            const mGrip = new THREE.Mesh(
                new THREE.CylinderGeometry(0.016, 0.016, 0.10, 6),
                leatherMat
            );
            mGrip.position.y = -0.02;
            g.add(mGrip);

            // Flanged head (sphere + protruding flanges)
            const mHead = new THREE.Mesh(
                new THREE.SphereGeometry(0.045, 8, 5),
                metalMat
            );
            mHead.position.y = 0.32;
            g.add(mHead);

            // Flanges (4 ridges around the head)
            for (let i = 0; i < 4; i++) {
                const flange = new THREE.Mesh(
                    new THREE.BoxGeometry(0.008, 0.07, 0.035),
                    metalDarkMat
                );
                flange.position.y = 0.32;
                flange.rotation.y = (i / 4) * Math.PI * 2;
                flange.position.x = Math.sin(flange.rotation.y) * 0.04;
                flange.position.z = Math.cos(flange.rotation.y) * 0.04;
                g.add(flange);
            }

            // Crown ring at top of head
            const crown = new THREE.Mesh(
                new THREE.TorusGeometry(0.045, 0.006, 4, 8),
                metalDarkMat
            );
            crown.position.y = 0.35;
            crown.rotation.x = Math.PI / 2;
            g.add(crown);

            // Pommel cap
            const mPom = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.02, 6), metalDarkMat);
            mPom.position.y = -0.08;
            g.add(mPom);

        } else if (itemId.includes('staff') || itemId.includes('wand')) {
            // ── Twisted wooden shaft ──
            const sShaft = new THREE.Mesh(
                new THREE.CylinderGeometry(0.012, 0.018, 0.60, 8),
                woodMat
            );
            sShaft.position.y = 0.15;
            g.add(sShaft);

            // Wood grain rings
            for (let i = 0; i < 5; i++) {
                const ring = new THREE.Mesh(
                    new THREE.TorusGeometry(0.014 + i * 0.0005, 0.003, 4, 8),
                    new THREE.MeshStandardMaterial({ color: 0x4A2E15, roughness: 0.95 })
                );
                ring.position.y = -0.05 + i * 0.12;
                ring.rotation.x = Math.PI / 2;
                g.add(ring);
            }

            // Orb cradle (3 prongs holding the orb)
            for (let i = 0; i < 3; i++) {
                const prong = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.005, 0.008, 0.08, 4),
                    woodMat
                );
                const angle = (i / 3) * Math.PI * 2;
                prong.position.set(
                    Math.sin(angle) * 0.015,
                    0.43,
                    Math.cos(angle) * 0.015
                );
                prong.rotation.z = Math.sin(angle) * 0.3;
                prong.rotation.x = Math.cos(angle) * 0.3;
                g.add(prong);
            }

            // Glowing orb
            const orb = new THREE.Mesh(
                new THREE.SphereGeometry(0.035, 10, 8),
                new THREE.MeshStandardMaterial({
                    color: 0x66AAFF, emissive: 0x3366CC,
                    emissiveIntensity: 0.6, roughness: 0.1, metalness: 0.1
                })
            );
            orb.position.y = 0.46;
            g.add(orb);

            // Orb glow (larger transparent sphere)
            const glow = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 6),
                new THREE.MeshBasicMaterial({ color: 0x4488FF, transparent: true, opacity: 0.15 })
            );
            glow.position.y = 0.46;
            g.add(glow);

        } else if (itemId.includes('bow')) {
            // ── Curved bow limbs ──
            const bowMat = new THREE.MeshStandardMaterial({ color: 0x8B5E3C, roughness: 0.8 });

            // Upper limb
            const upperLimb = new THREE.Mesh(
                new THREE.CylinderGeometry(0.008, 0.012, 0.28, 5),
                bowMat
            );
            upperLimb.position.set(0, 0.18, 0);
            upperLimb.rotation.z = 0.12;
            g.add(upperLimb);

            // Lower limb
            const lowerLimb = new THREE.Mesh(
                new THREE.CylinderGeometry(0.012, 0.008, 0.28, 5),
                bowMat
            );
            lowerLimb.position.set(0, -0.10, 0);
            lowerLimb.rotation.z = -0.12;
            g.add(lowerLimb);

            // Grip (center, wrapped)
            const bGrip = new THREE.Mesh(
                new THREE.CylinderGeometry(0.016, 0.016, 0.06, 6),
                leatherMat
            );
            bGrip.position.y = 0.04;
            g.add(bGrip);

            // Bow tips (nocks)
            const nockTop = new THREE.Mesh(new THREE.SphereGeometry(0.008, 4, 3), bowMat);
            nockTop.position.set(0.015, 0.32, 0);
            g.add(nockTop);
            const nockBot = new THREE.Mesh(new THREE.SphereGeometry(0.008, 4, 3), bowMat);
            nockBot.position.set(-0.015, -0.24, 0);
            g.add(nockBot);

            // Bowstring
            const stringGeo = new THREE.BufferGeometry();
            const stringVerts = new Float32Array([
                0.015, 0.32, 0,    // top nock
                -0.03, 0.04, 0.01, // pulled center
                -0.015, -0.24, 0   // bottom nock
            ]);
            stringGeo.setAttribute('position', new THREE.BufferAttribute(stringVerts, 3));
            const bowstring = new THREE.Line(stringGeo,
                new THREE.LineBasicMaterial({ color: 0xCCBB99, linewidth: 1 })
            );
            g.add(bowstring);

        } else {
            // ── Generic weapon — iron bar with grip ──
            const bar = new THREE.Mesh(
                new THREE.BoxGeometry(0.025, 0.38, 0.025),
                metalMat
            );
            bar.position.y = 0.2;
            g.add(bar);
            const gGrip = new THREE.Mesh(
                new THREE.CylinderGeometry(0.016, 0.016, 0.1, 6),
                leatherMat
            );
            gGrip.position.y = 0.01;
            g.add(gGrip);
        }

        g.position.set(0.20, -0.08, -0.55);
        g.rotation.x = -Math.PI * 0.18;
        g.rotation.z = Math.PI * 0.08;
        this._vmGroup.add(g);
        this._vmWeapon = g;
    }

    /** Trigger a swing animation */
    triggerSwing() {
        this._swingActive = true;
        this._swingTime = 0;
    }

    /** Update viewmodel animations (call every frame) */
    updateViewmodel(dt, isMoving, inCombat) {
        if (!this._vmGroup) return;

        // Bob when walking
        const bobSpeed = isMoving ? 8 : 0;
        const bobAmount = isMoving ? 0.012 : 0;
        this._bobPhase = (this._bobPhase || 0) + dt * bobSpeed;
        const bobY = Math.sin(this._bobPhase) * bobAmount;
        const bobX = Math.cos(this._bobPhase * 0.5) * bobAmount * 0.5;

        // Combat idle sway — weapon gently moves side to side when fighting
        this._combatSwayPhase = (this._combatSwayPhase || 0) + dt * (inCombat ? 2.5 : 0);
        const combatSwayX = inCombat ? Math.sin(this._combatSwayPhase) * 0.008 : 0;
        const combatSwayY = inCombat ? Math.cos(this._combatSwayPhase * 1.3) * 0.005 : 0;

        this._vmGroup.position.set(bobX + combatSwayX, bobY + combatSwayY, 0);

        // Swing animation
        if (this._swingActive) {
            this._swingTime += dt;
            const t = this._swingTime / this._swingDuration;
            if (t >= 1) {
                this._swingActive = false;
                this._vmGroup.rotation.set(0, 0, 0);
            } else {
                // Quick slash arc: rotate down-left then back
                const swing = Math.sin(t * Math.PI);
                this._vmGroup.rotation.x = -swing * 0.6;
                this._vmGroup.rotation.z = -swing * 0.3;
            }
        }
    }

    // Advance the day/night cycle
    updateDayNight(dt, skybox) {
        this.timeOfDay += dt / this.dayDuration;
        if (this.timeOfDay >= 1) this.timeOfDay -= 1;

        const t = this.timeOfDay;

        // Update skybox colors
        skybox.updateTime(t);

        // Sun position orbits overhead
        const sunAngle = (t - 0.25) * Math.PI * 2; // noon at t=0.5
        const sunY = Math.sin(sunAngle) * 80;
        const sunX = Math.cos(sunAngle) * 50;

        // Sun intensity based on elevation
        const daylight = Math.max(0, Math.sin(sunAngle));
        this.sunLight.intensity = 0.1 + daylight * 1.1;

        // Sun color: warm at low angles, white at noon
        if (daylight > 0.3) {
            this.sunLight.color.setHex(0xFFF5E0);
        } else if (daylight > 0) {
            this.sunLight.color.lerpColors(
                new THREE.Color(0xFF8844), new THREE.Color(0xFFF5E0), daylight / 0.3
            );
        } else {
            this.sunLight.color.setHex(0x222244);
        }

        // Ambient and hemisphere adjust
        const ambientBase = 0.1 + daylight * 0.3;
        this.ambientLight.intensity = ambientBase;
        this.hemiLight.intensity = 0.1 + daylight * 0.2;

        // Fog color matches sky mood (skip when in dungeon — managed by main.js)
        if (!this._inDungeon) {
            if (daylight > 0.2) {
                this.scene.fog.color.lerpColors(
                    new THREE.Color(0x334455), new THREE.Color(0xC8DFF0), daylight
                );
                this.scene.background.copy(this.scene.fog.color);
            } else {
                this.scene.fog.color.setHex(0x111122);
                this.scene.background.setHex(0x111122);
            }
        }

        // Store sun base offset for updateSunTarget
        this._sunBaseX = sunX;
        this._sunBaseY = Math.max(5, sunY); // keep above horizon for shadow
    }

    // Update sun shadow camera to follow player for nearby shadow detail
    updateSunTarget(playerPos) {
        const sx = this._sunBaseX !== undefined ? this._sunBaseX : CONFIG.VISUAL.sunPosition.x;
        const sy = this._sunBaseY !== undefined ? this._sunBaseY : CONFIG.VISUAL.sunPosition.y;

        this.sunLight.target.position.set(playerPos.x, 0, playerPos.z);
        this.sunLight.position.set(
            playerPos.x + sx,
            sy,
            playerPos.z + CONFIG.VISUAL.sunPosition.z
        );
        this.sunLight.target.updateMatrixWorld();
    }
}
