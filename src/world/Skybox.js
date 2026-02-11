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
    }
}
