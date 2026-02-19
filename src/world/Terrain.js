import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Terrain {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this._heightData = null;
        this._create();
    }

    _simpleNoise(x, z) {
        // Multi-octave noise using sine combinations
        let val = 0;
        val += Math.sin(x * 0.05 + 1.3) * Math.cos(z * 0.07 + 0.8) * 1.0;
        val += Math.sin(x * 0.12 + 2.1) * Math.cos(z * 0.09 + 1.5) * 0.5;
        val += Math.sin(x * 0.03 + 0.5) * Math.cos(z * 0.04 + 2.3) * 1.5;
        val += Math.sin(x * 0.08 + z * 0.06) * 0.3;
        return val;
    }

    _create() {
        const { size, segments } = CONFIG.WORLD;
        const geo = new THREE.PlaneGeometry(size, size, segments, segments);
        geo.rotateX(-Math.PI / 2);

        const positions = geo.attributes.position.array;
        const colors = new Float32Array(positions.length);
        const vertCount = positions.length / 3;

        // Store height data for sampling
        this._heightData = new Float32Array(vertCount);

        for (let i = 0; i < vertCount; i++) {
            const x = positions[i * 3];
            const z = positions[i * 3 + 2];

            // Height
            const h = this._simpleNoise(x, z) * CONFIG.WORLD.heightAmplitude;
            positions[i * 3 + 1] = h;
            this._heightData[i] = h;

            // Vertex colors: green grass with brown patches
            const grassFactor = Math.max(0, Math.min(1,
                0.5 + this._simpleNoise(x * 2, z * 2) * 0.3
            ));

            // Base green
            let r = 0.25 + (1 - grassFactor) * 0.2;
            let g = 0.55 + grassFactor * 0.15;
            let b = 0.15 + (1 - grassFactor) * 0.1;

            // Slight variation
            const variation = Math.sin(x * 0.3 + z * 0.4) * 0.05;
            r += variation;
            g += variation;

            // Biome color tinting
            if (CONFIG.BIOMES) {
                // Desert (x > 50): blend toward sandy
                if (x > 45) {
                    const t = Math.min(1, (x - 45) / 15);
                    r = r + (0.76 - r) * t;
                    g = g + (0.70 - g) * t;
                    b = b + (0.50 - b) * t;
                }
                // Swamp (x < -30, z > 25): blend toward dark green
                if (x < -25 && z > 20) {
                    const tx = Math.min(1, (-25 - x) / 15);
                    const tz = Math.min(1, (z - 20) / 15);
                    const t = tx * tz;
                    r = r + (0.23 - r) * t;
                    g = g + (0.33 - g) * t;
                    b = b + (0.14 - b) * t;
                }
                // Ice (z < -75): blend toward white/icy
                if (z < -70) {
                    const t = Math.min(1, (-70 - z) / 15);
                    r = r + (0.91 - r) * t;
                    g = g + (0.91 - g) * t;
                    b = b + (0.94 - b) * t;
                }
            }

            colors[i * 3] = r;
            colors[i * 3 + 1] = g;
            colors[i * 3 + 2] = b;
        }

        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.9,
            metalness: 0.0,
        });

        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }

    flattenArea(cx, cz, halfW, halfD, targetY) {
        const { size, segments } = CONFIG.WORLD;
        const halfSize = size / 2;
        const positions = this.mesh.geometry.attributes.position.array;
        const stride = segments + 1;

        for (let iz = 0; iz <= segments; iz++) {
            for (let ix = 0; ix <= segments; ix++) {
                const idx = iz * stride + ix;
                const wx = positions[idx * 3];
                const wz = positions[idx * 3 + 2];

                if (wx >= cx - halfW && wx <= cx + halfW && wz >= cz - halfD && wz <= cz + halfD) {
                    positions[idx * 3 + 1] = targetY;
                    this._heightData[idx] = targetY;
                }
            }
        }

        this.mesh.geometry.attributes.position.needsUpdate = true;
        this.mesh.geometry.computeVertexNormals();
    }

    getHeightAt(x, z) {
        // Bilinear interpolation of terrain height
        const { size, segments } = CONFIG.WORLD;
        const halfSize = size / 2;

        // Convert world coords to grid coords
        const gx = ((x + halfSize) / size) * segments;
        const gz = ((z + halfSize) / size) * segments;

        const ix = Math.floor(gx);
        const iz = Math.floor(gz);
        const fx = gx - ix;
        const fz = gz - iz;

        // Clamp indices
        const ix0 = Math.max(0, Math.min(segments, ix));
        const iz0 = Math.max(0, Math.min(segments, iz));
        const ix1 = Math.min(segments, ix0 + 1);
        const iz1 = Math.min(segments, iz0 + 1);

        const stride = segments + 1;
        const h00 = this._heightData[iz0 * stride + ix0] || 0;
        const h10 = this._heightData[iz0 * stride + ix1] || 0;
        const h01 = this._heightData[iz1 * stride + ix0] || 0;
        const h11 = this._heightData[iz1 * stride + ix1] || 0;

        // Bilinear interpolation
        const h0 = h00 + (h10 - h00) * fx;
        const h1 = h01 + (h11 - h01) * fx;
        return h0 + (h1 - h0) * fz;
    }
}
