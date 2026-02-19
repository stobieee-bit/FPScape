import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Skybox {
    constructor(scene) {
        // Create a gradient sky using a large sphere
        const skyGeo = new THREE.SphereGeometry(400, 32, 16);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x5588CC) },
                bottomColor: { value: new THREE.Color(0xC8DFF0) },
                offset: { value: 20 },
                exponent: { value: 0.4 },
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide,
            depthWrite: false,
        });

        this.mesh = new THREE.Mesh(skyGeo, skyMat);
        this.uniforms = skyMat.uniforms;
        scene.add(this.mesh);

        // --- Stars ---
        const starCount = 300;
        const starPositions = new Float32Array(starCount * 3);
        const starSizes = new Float32Array(starCount);
        for (let i = 0; i < starCount; i++) {
            // Random points on upper hemisphere of a sphere (radius 350)
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random()); // upper hemisphere only (0 to PI/2)
            const r = 350;
            starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            starPositions[i * 3 + 1] = r * Math.cos(phi) * 0.6 + r * 0.3; // bias upward
            starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
            starSizes[i] = 0.5 + Math.random() * 1.0;
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
        this.starField = new THREE.Points(starGeo, new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.8,
            transparent: true,
            opacity: 0,
            sizeAttenuation: true,
            depthWrite: false,
        }));
        scene.add(this.starField);

        // Twinkling phase offsets for stars
        this._starPhases = new Float32Array(starCount);
        for (let i = 0; i < starCount; i++) this._starPhases[i] = Math.random() * Math.PI * 2;

        // --- Moon ---
        const moonGeo = new THREE.SphereGeometry(8, 16, 12);
        const moonMat = new THREE.MeshBasicMaterial({
            color: 0xEEEEDD,
            transparent: true,
            opacity: 0,
            depthWrite: false,
        });
        this.moon = new THREE.Mesh(moonGeo, moonMat);
        scene.add(this.moon);

        // Moon glow ring
        const glowGeo = new THREE.SphereGeometry(10, 16, 12);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xCCCCBB,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.BackSide,
        });
        this.moonGlow = new THREE.Mesh(glowGeo, glowMat);
        this.moon.add(this.moonGlow);

        // --- Clouds ---
        const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const cloudCount = isMobile ? 6 : 10;
        this.clouds = [];
        for (let i = 0; i < cloudCount; i++) {
            const cw = 60 + Math.random() * 80;
            const ch = 15 + Math.random() * 15;
            const geo = new THREE.PlaneGeometry(cw, ch, 1, 1);
            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    opacity: { value: 0.6 },
                    offset: { value: Math.random() * 100 },
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform float opacity;
                    uniform float offset;
                    varying vec2 vUv;
                    void main() {
                        vec2 p = vUv * 4.0 + vec2(time * 0.04 + offset, 0.0);
                        float n = sin(p.x * 2.1) * sin(p.y * 3.7)
                                + sin(p.x * 4.3 + 1.1) * sin(p.y * 2.1 + 0.7) * 0.5;
                        float cloud = smoothstep(0.0, 0.8, n * 0.5 + 0.5);
                        float edgeFade = smoothstep(0.0, 0.15, vUv.x)
                                       * smoothstep(1.0, 0.85, vUv.x)
                                       * smoothstep(0.0, 0.2, vUv.y)
                                       * smoothstep(1.0, 0.8, vUv.y);
                        gl_FragColor = vec4(1.0, 1.0, 1.0, cloud * edgeFade * opacity);
                    }
                `,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
            });
            const mesh = new THREE.Mesh(geo, mat);
            const angle = (i / cloudCount) * Math.PI * 2 + Math.random() * 0.5;
            const radius = 180 + Math.random() * 60;
            const height = 60 + Math.random() * 60;
            mesh.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
            mesh.rotation.x = -Math.PI * 0.15;
            mesh.rotation.y = angle;
            mesh._drift = 0.003 + Math.random() * 0.005;
            mesh._angle = angle;
            mesh._radius = radius;
            scene.add(mesh);
            this.clouds.push(mesh);
        }
    }

    // t = 0..1 representing time of day (0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk)
    updateTime(t) {
        // Sky color phases
        if (t < 0.2) {
            // Night (0.0 - 0.2)
            this.uniforms.topColor.value.setHex(0x0A0A2E);
            this.uniforms.bottomColor.value.setHex(0x1A1A3E);
        } else if (t < 0.3) {
            // Dawn transition (0.2 - 0.3)
            const f = (t - 0.2) / 0.1;
            this.uniforms.topColor.value.lerpColors(
                new THREE.Color(0x0A0A2E), new THREE.Color(0x5588CC), f
            );
            this.uniforms.bottomColor.value.lerpColors(
                new THREE.Color(0x1A1A3E), new THREE.Color(0xFFAA66), f
            );
        } else if (t < 0.4) {
            // Morning (0.3 - 0.4) - sunrise fading to day
            const f = (t - 0.3) / 0.1;
            this.uniforms.topColor.value.lerpColors(
                new THREE.Color(0x5588CC), new THREE.Color(0x5588CC), f
            );
            this.uniforms.bottomColor.value.lerpColors(
                new THREE.Color(0xFFAA66), new THREE.Color(0xC8DFF0), f
            );
        } else if (t < 0.7) {
            // Day (0.4 - 0.7)
            this.uniforms.topColor.value.setHex(0x5588CC);
            this.uniforms.bottomColor.value.setHex(0xC8DFF0);
        } else if (t < 0.8) {
            // Dusk transition (0.7 - 0.8)
            const f = (t - 0.7) / 0.1;
            this.uniforms.topColor.value.lerpColors(
                new THREE.Color(0x5588CC), new THREE.Color(0x332244), f
            );
            this.uniforms.bottomColor.value.lerpColors(
                new THREE.Color(0xC8DFF0), new THREE.Color(0xFF6633), f
            );
        } else if (t < 0.9) {
            // Evening (0.8 - 0.9)
            const f = (t - 0.8) / 0.1;
            this.uniforms.topColor.value.lerpColors(
                new THREE.Color(0x332244), new THREE.Color(0x0A0A2E), f
            );
            this.uniforms.bottomColor.value.lerpColors(
                new THREE.Color(0xFF6633), new THREE.Color(0x1A1A3E), f
            );
        } else {
            // Night (0.9 - 1.0)
            this.uniforms.topColor.value.setHex(0x0A0A2E);
            this.uniforms.bottomColor.value.setHex(0x1A1A3E);
        }

        // --- Stars + Moon visibility ---
        // nightFactor: 1.0 at full night, fading during dawn/dusk
        let nightFactor = 0;
        if (t < 0.15 || t > 0.92) {
            nightFactor = 1.0;
        } else if (t < 0.25) {
            // Dawn fade out (0.15 → 0.25)
            nightFactor = 1.0 - (t - 0.15) / 0.10;
        } else if (t > 0.82) {
            // Dusk fade in (0.82 → 0.92)
            nightFactor = (t - 0.82) / 0.10;
        }
        nightFactor = Math.max(0, Math.min(1, nightFactor));

        // Stars
        this.starField.material.opacity = nightFactor * 0.85;
        this.starField.visible = nightFactor > 0.01;

        // Star twinkling via size attribute
        if (nightFactor > 0.01) {
            const sizes = this.starField.geometry.attributes.size;
            const now = performance.now() * 0.001;
            for (let i = 0; i < sizes.count; i++) {
                sizes.array[i] = (0.5 + Math.sin(now * 1.5 + this._starPhases[i]) * 0.3)
                    + Math.random() * 0.1;
            }
            sizes.needsUpdate = true;
        }

        // Moon — positioned opposite the sun
        // Sun angle: (t - 0.25) * PI * 2, so moon is +PI from that
        const sunAngle = (t - 0.25) * Math.PI * 2;
        const moonAngle = sunAngle + Math.PI;
        this.moon.position.set(
            Math.cos(moonAngle) * 200,
            Math.sin(moonAngle) * 180,
            30
        );
        this.moon.material.opacity = nightFactor * 0.95;
        this.moonGlow.material.opacity = nightFactor * 0.15;
        this.moon.visible = nightFactor > 0.01;

        // Clouds: drift and day/night opacity
        const dayFactor = 1.0 - nightFactor;
        const now = performance.now() * 0.001;
        for (const cloud of this.clouds) {
            cloud._angle += cloud._drift * 0.016;
            cloud.position.x = Math.cos(cloud._angle) * cloud._radius;
            cloud.position.z = Math.sin(cloud._angle) * cloud._radius;
            cloud.material.uniforms.time.value = now;
            cloud.material.uniforms.opacity.value = dayFactor * 0.6;
            cloud.visible = dayFactor > 0.05;
        }
    }
}
