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

        // Arm (skin-colored cylinder)
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xD4A574, roughness: 0.8 });
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.45, 6), skinMat);
        arm.rotation.x = -Math.PI * 0.1;
        arm.rotation.z = Math.PI * 0.15;
        arm.position.set(0.22, -0.25, -0.35);
        this._vmGroup.add(arm);

        // Hand (sphere)
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), skinMat);
        hand.position.set(0.2, -0.08, -0.55);
        this._vmGroup.add(hand);

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
        const metalColor = itemId.startsWith('steel') ? 0xAAAAAA :
                           itemId.startsWith('iron') ? 0x888888 : 0xCD7F32;

        if (itemId.includes('sword')) {
            // Blade
            const blade = new THREE.Mesh(
                new THREE.BoxGeometry(0.03, 0.5, 0.06),
                new THREE.MeshStandardMaterial({ color: metalColor, metalness: 0.7, roughness: 0.3 })
            );
            blade.position.y = 0.25;
            g.add(blade);
            // Handle
            const handle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, 0.12, 6),
                new THREE.MeshStandardMaterial({ color: 0x5C3A1E, roughness: 0.9 })
            );
            g.add(handle);
            // Crossguard
            const guard = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.02, 0.02),
                new THREE.MeshStandardMaterial({ color: metalColor, metalness: 0.6, roughness: 0.4 })
            );
            guard.position.y = 0.06;
            g.add(guard);
        } else if (itemId.includes('dagger')) {
            const blade = new THREE.Mesh(
                new THREE.BoxGeometry(0.02, 0.25, 0.04),
                new THREE.MeshStandardMaterial({ color: metalColor, metalness: 0.7, roughness: 0.3 })
            );
            blade.position.y = 0.13;
            g.add(blade);
            const handle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.015, 0.1, 6),
                new THREE.MeshStandardMaterial({ color: 0x5C3A1E, roughness: 0.9 })
            );
            g.add(handle);
        } else if (itemId.includes('mace')) {
            const shaft = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6),
                new THREE.MeshStandardMaterial({ color: 0x5C3A1E, roughness: 0.9 })
            );
            shaft.position.y = 0.1;
            g.add(shaft);
            const head = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 6, 4),
                new THREE.MeshStandardMaterial({ color: metalColor, metalness: 0.6, roughness: 0.4 })
            );
            head.position.y = 0.32;
            g.add(head);
        } else if (itemId.includes('staff') || itemId.includes('wand')) {
            const shaft = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.02, 0.6, 6),
                new THREE.MeshStandardMaterial({ color: 0x5C3A1E, roughness: 0.9 })
            );
            shaft.position.y = 0.15;
            g.add(shaft);
            const orb = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 8, 6),
                new THREE.MeshStandardMaterial({ color: 0x4488FF, emissive: 0x2244AA, roughness: 0.2 })
            );
            orb.position.y = 0.46;
            g.add(orb);
        } else if (itemId.includes('bow')) {
            const shaft = new THREE.Mesh(
                new THREE.CylinderGeometry(0.01, 0.01, 0.5, 4),
                new THREE.MeshStandardMaterial({ color: 0x8B5E3C, roughness: 0.8 })
            );
            shaft.rotation.z = 0.15;
            shaft.position.y = 0.1;
            g.add(shaft);
        } else {
            // Generic weapon — simple bar
            const bar = new THREE.Mesh(
                new THREE.BoxGeometry(0.03, 0.4, 0.03),
                new THREE.MeshStandardMaterial({ color: metalColor, metalness: 0.5, roughness: 0.5 })
            );
            bar.position.y = 0.2;
            g.add(bar);
        }

        g.position.set(0.2, -0.1, -0.55);
        g.rotation.x = -Math.PI * 0.15;
        g.rotation.z = Math.PI * 0.1;
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

        // Fog color matches sky mood
        if (daylight > 0.2) {
            this.scene.fog.color.lerpColors(
                new THREE.Color(0x334455), new THREE.Color(0xC8DFF0), daylight
            );
            this.scene.background.copy(this.scene.fog.color);
        } else {
            this.scene.fog.color.setHex(0x111122);
            this.scene.background.setHex(0x111122);
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
