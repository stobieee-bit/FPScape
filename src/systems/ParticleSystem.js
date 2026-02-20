import * as THREE from 'three';

/** Reusable mesh pool to avoid constant new/dispose of particle meshes */
class MeshPool {
    constructor(scene) {
        this.scene = scene;
        this._pools = new Map(); // key → { idle: Mesh[], active: Set<Mesh> }
    }

    /**
     * Get a mesh from the pool (or create a new one).
     * @param {string} key - Pool identifier (e.g. 'smoke', 'spark', 'hit')
     * @param {THREE.BufferGeometry} geo - Shared geometry
     * @param {object} matOpts - Material options for MeshBasicMaterial
     * @returns {THREE.Mesh}
     */
    acquire(key, geo, matOpts) {
        if (!this._pools.has(key)) {
            this._pools.set(key, { idle: [], active: new Set() });
        }
        const pool = this._pools.get(key);
        let mesh;
        if (pool.idle.length > 0) {
            mesh = pool.idle.pop();
            // Reset material properties
            mesh.material.color.set(matOpts.color);
            mesh.material.opacity = matOpts.opacity ?? 1;
            mesh.visible = true;
            mesh.scale.setScalar(1);
        } else {
            mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
                color: matOpts.color,
                transparent: true,
                opacity: matOpts.opacity ?? 1,
                side: matOpts.side || THREE.FrontSide,
                depthWrite: matOpts.depthWrite ?? true,
            }));
            mesh._poolKey = key;
        }
        pool.active.add(mesh);
        this.scene.add(mesh);
        return mesh;
    }

    /** Return a mesh to the pool for reuse */
    release(mesh) {
        const key = mesh._poolKey;
        if (!key || !this._pools.has(key)) {
            // Not pooled — dispose normally
            this.scene.remove(mesh);
            mesh.geometry?.dispose();
            mesh.material?.dispose();
            return;
        }
        const pool = this._pools.get(key);
        pool.active.delete(mesh);
        mesh.visible = false;
        this.scene.remove(mesh);
        pool.idle.push(mesh);
    }
}

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.emitters = [];
        this._sprintParticles = [];
        this._pool = new MeshPool(scene);

        // ── Shared geometries (avoid per-particle allocation) ──
        this._smokeGeo = new THREE.PlaneGeometry(0.3, 0.3);
        this._sparkGeo = new THREE.SphereGeometry(0.06, 3, 2);
        this._hitGeo = new THREE.SphereGeometry(0.04, 3, 2);
        this._bloodGeo = new THREE.SphereGeometry(0.03, 3, 2);
        this._dustGeo = new THREE.PlaneGeometry(0.15, 0.15);
        this._slashGeo = new THREE.PlaneGeometry(0.3, 0.05);
        this._crackGeo = null; // varied, created per crack
    }

    // Create a smoke emitter (campfire)
    createSmokeEmitter(position) {
        const emitter = {
            type: 'smoke',
            position: position.clone(),
            particles: [],
            spawnTimer: 0,
            spawnRate: 0.15, // seconds between particles
            active: true,
        };
        this.emitters.push(emitter);
        return emitter;
    }

    // Create a one-shot level-up sparkle burst
    createLevelUpBurst(position) {
        const emitter = {
            type: 'sparkle',
            position: position.clone(),
            particles: [],
            spawnTimer: 0,
            spawned: false,
            active: true,
            lifetime: 2,
        };

        // Spawn all particles at once using pooled meshes + shared geometry
        const colors = [0xFFD700, 0xFFFF00, 0xFFA500, 0xFFFFFF];
        for (let i = 0; i < 24; i++) {
            const color = colors[i % colors.length];
            const mesh = this._pool.acquire('sparkle', this._sparkGeo, { color, opacity: 1 });
            mesh.position.copy(position);

            const angle = Math.random() * Math.PI * 2;
            const upAngle = Math.random() * Math.PI - Math.PI * 0.3;
            const speed = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * Math.cos(upAngle) * speed;
            const vy = Math.sin(upAngle) * speed + 2;
            const vz = Math.sin(angle) * Math.cos(upAngle) * speed;

            emitter.particles.push({
                mesh,
                velocity: new THREE.Vector3(vx, vy, vz),
                life: 1.5 + Math.random() * 0.5,
                maxLife: 1.5 + Math.random() * 0.5,
            });
        }

        emitter.spawned = true;
        this.emitters.push(emitter);
        return emitter;
    }

    // Create a combat hit burst (red/orange sparks at monster position)
    createHitBurst(position, damage) {
        const count = Math.min(6 + damage * 2, 16);
        const colors = damage > 0 ? [0xFF3300, 0xFF6600, 0xCC0000, 0xFFAA00] : [0x4488FF, 0x6699FF];
        if (!this._hitParticles) this._hitParticles = [];
        for (let i = 0; i < count; i++) {
            const color = colors[i % colors.length];
            const mesh = this._pool.acquire('hit', this._hitGeo, { color, opacity: 1 });
            mesh.position.copy(position);
            mesh.position.y += 0.8 + Math.random() * 0.4;

            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 2;
            const vy = 1 + Math.random() * 2;

            this._hitParticles.push({
                mesh,
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    vy,
                    Math.sin(angle) * speed
                ),
                life: 0.4 + Math.random() * 0.3,
                maxLife: 0.4 + Math.random() * 0.3,
            });
        }
    }

    // Create death burst (bigger soul-like particles when monster dies)
    createDeathBurst(position) {
        const count = 24;
        const colors = [0xFFFFFF, 0xCCCCCC, 0xFFEEAA, 0xAABBCC, 0xDDDDDD];
        if (!this._hitParticles) this._hitParticles = [];
        for (let i = 0; i < count; i++) {
            const color = colors[i % colors.length];
            const mesh = this._pool.acquire('sparkle', this._sparkGeo, { color, opacity: 1 });
            mesh.position.copy(position);
            mesh.position.y += 0.5 + Math.random() * 0.5;

            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2.5;
            const vy = 2 + Math.random() * 3;

            this._hitParticles.push({
                mesh,
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    vy,
                    Math.sin(angle) * speed
                ),
                life: 0.8 + Math.random() * 0.4,
                maxLife: 0.8 + Math.random() * 0.4,
            });
        }
    }

    // Create sprint dust at player feet
    createSprintDust(position) {
        const count = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            const mesh = this._pool.acquire('dust', this._dustGeo, {
                color: 0x9B8B6B, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false,
            });
            mesh.position.set(
                position.x + (Math.random() - 0.5) * 0.5,
                position.y + 0.05,
                position.z + (Math.random() - 0.5) * 0.5
            );
            mesh.rotation.x = -Math.PI / 2;
            mesh.rotation.z = Math.random() * Math.PI;
            this._sprintParticles.push({
                mesh,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.8,
                    0.3 + Math.random() * 0.5,
                    (Math.random() - 0.5) * 0.8
                ),
                life: 0.4 + Math.random() * 0.3,
                maxLife: 0.4 + Math.random() * 0.3,
            });
        }
    }

    // Create ember emitter (torch/fire)
    createEmberEmitter(position) {
        const emitter = {
            type: 'ember',
            position: position.clone(),
            particles: [],
            spawnTimer: 0,
            spawnRate: 0.3,
            active: true,
        };
        this.emitters.push(emitter);
        return emitter;
    }

    // Create bubble emitter (underwater cave)
    createBubbleEmitter(position) {
        const emitter = {
            type: 'bubble',
            position: position.clone(),
            particles: [],
            spawnTimer: 0,
            spawnRate: 0.3,
            active: true,
        };
        this.emitters.push(emitter);
        return emitter;
    }

    // Create torch smoke emitter (smaller campfire smoke)
    createTorchSmokeEmitter(position) {
        const emitter = {
            type: 'torch_smoke',
            position: position.clone(),
            particles: [],
            spawnTimer: 0,
            spawnRate: 0.4,
            active: true,
        };
        this.emitters.push(emitter);
        return emitter;
    }

    // Create dust mote system for dungeons
    createDustMoteSystem(bounds, floorY, height) {
        const count = 40;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];
        const phases = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
            positions[i * 3 + 1] = floorY + Math.random() * height;
            positions[i * 3 + 2] = bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ);
            velocities.push({
                x: (Math.random() - 0.5) * (0.1 + Math.random() * 0.2),
                z: (Math.random() - 0.5) * (0.1 + Math.random() * 0.2),
            });
            phases.push(Math.random() * Math.PI * 2);
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            color: 0xFFEEAA,
            size: 0.15,
            transparent: true,
            opacity: 0.3,
        });

        const points = new THREE.Points(geo, mat);
        points.visible = false;
        this.scene.add(points);

        const emitter = {
            type: 'dust_motes',
            points,
            velocities,
            phases,
            count,
            bounds,
            floorY,
            height,
            active: false,
        };

        this.emitters.push(emitter);
        return emitter;
    }

    // Create snow particle system (like rain but slower, white, wider)
    createSnowSystem(playerPos) {
        const count = 200;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];
        const drifts = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 80;
            positions[i * 3 + 1] = Math.random() * 30 + 5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
            velocities.push(-3 - Math.random() * 2);
            drifts.push((Math.random() - 0.5) * 2);
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.25,
            transparent: true,
            opacity: 0.8,
        });

        const points = new THREE.Points(geo, mat);
        points.visible = false;
        this.scene.add(points);

        const emitter = {
            type: 'snow',
            points,
            velocities,
            drifts,
            count,
            active: false,
            playerRef: playerPos,
        };

        this.emitters.push(emitter);
        return emitter;
    }

    // Create firefly system — small glowing dots near trees
    createFireflySystem(positions) {
        const fireflies = [];
        for (const pos of positions) {
            const colors = [0x88FF44, 0xAAFF00, 0xFFFF44];
            const geo = new THREE.SphereGeometry(0.08, 4, 3);
            const mat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                transparent: true,
                opacity: 0,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(
                pos.x + (Math.random() - 0.5) * 3,
                pos.y + 0.5 + Math.random() * 1.5,
                pos.z + (Math.random() - 0.5) * 3
            );
            this.scene.add(mesh);
            fireflies.push({
                mesh,
                origin: mesh.position.clone(),
                phase: Math.random() * Math.PI * 2,
                wanderAngle: Math.random() * Math.PI * 2,
                wanderSpeed: 0.3 + Math.random() * 0.3,
            });
        }

        this._fireflies = fireflies;
        this._firefliesActive = false;
    }

    setFirefliesActive(active) {
        this._firefliesActive = active;
    }

    // Lightning flash — double-flash pattern for realistic thunderstorm
    flashLightning() {
        if (!this._lightningLight) {
            this._lightningLight = new THREE.PointLight(0xCCCCFF, 0, 250);
            this._lightningLight.visible = false;
            this.scene.add(this._lightningLight);
        }
        const light = this._lightningLight;
        // Reposition each flash
        light.position.set(
            (Math.random() - 0.5) * 100,
            55,
            (Math.random() - 0.5) * 100
        );

        // Clear any in-progress flash sequence
        for (const t of (this._lightningTimers || [])) clearTimeout(t);
        this._lightningTimers = [];

        // Double-flash sequence:
        // 1) Bright flash (intensity 10) for 60ms
        // 2) Dim to 1 for 80ms (brief darkness)
        // 3) Second weaker flash (intensity 5) for 50ms
        // 4) Fade off over 200ms
        light.intensity = 10;
        light.visible = true;

        this._lightningTimers.push(setTimeout(() => {
            light.intensity = 1;
        }, 60));

        this._lightningTimers.push(setTimeout(() => {
            light.intensity = 5;
        }, 140));

        this._lightningTimers.push(setTimeout(() => {
            light.intensity = 2;
        }, 190));

        this._lightningTimers.push(setTimeout(() => {
            light.intensity = 0;
            light.visible = false;
        }, 350));
    }

    // Create slash trail VFX (melee combat)
    createSlashTrail(startPos, endPos, color = 0xFFFFFF) {
        if (!this._slashParticles) this._slashParticles = [];
        const count = 5;
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            const mesh = this._pool.acquire('slash', this._slashGeo, {
                color, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false,
            });
            mesh.position.lerpVectors(startPos, endPos, t);
            mesh.position.y += Math.sin(t * Math.PI) * 0.5;
            mesh.lookAt(endPos);
            mesh.rotation.z = t * Math.PI * 0.5;
            this._slashParticles.push({
                mesh,
                life: 0.3,
                maxLife: 0.3,
            });
        }
    }

    // Create impact crack on the ground (heavy melee hit)
    createImpactCrack(position) {
        if (!this._impactCracks) this._impactCracks = [];
        const count = 3 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI + Math.random() * 0.3;
            const length = 0.3 + Math.random() * 0.4;
            const geo = new THREE.PlaneGeometry(length, 0.03);
            const mat = new THREE.MeshBasicMaterial({
                color: 0x222222,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide,
                depthWrite: false,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(position.x, position.y + 0.02, position.z);
            mesh.rotation.x = -Math.PI / 2;
            mesh.rotation.z = angle;
            this.scene.add(mesh);
            this._impactCracks.push({
                mesh,
                life: 2.0,
                maxLife: 2.0,
            });
        }
    }

    // Create blood splatter particles (combat hit)
    createBloodSplatter(position, intensity = 5) {
        if (!this._bloodParticles) this._bloodParticles = [];
        const count = Math.min(Math.floor(4 + intensity * 1.5), 15);
        for (let i = 0; i < count; i++) {
            const color = i % 3 === 0 ? 0x8B0000 : 0xCC1111;
            const mesh = this._pool.acquire('blood', this._bloodGeo, { color, opacity: 0.9 });
            mesh.position.copy(position);
            mesh.position.y += 0.8 + Math.random() * 0.4;
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this._bloodParticles.push({
                mesh,
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    1.5 + Math.random() * 2,
                    Math.sin(angle) * speed
                ),
                life: 0.6 + Math.random() * 0.4,
                maxLife: 0.6 + Math.random() * 0.4,
            });
        }
    }

    // Create rain particle system
    createRainSystem(playerPos) {
        const count = 400;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 1] = Math.random() * 30 + 5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
            velocities.push(-12 - Math.random() * 6); // fall speed
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            color: 0x8899CC,
            size: 0.15,
            transparent: true,
            opacity: 0.6,
        });

        const points = new THREE.Points(geo, mat);
        points.visible = false;
        this.scene.add(points);

        const emitter = {
            type: 'rain',
            points,
            velocities,
            count,
            active: false,
            playerRef: playerPos,
        };

        this.emitters.push(emitter);
        return emitter;
    }

    update(dt) {
        for (let i = this.emitters.length - 1; i >= 0; i--) {
            const em = this.emitters[i];

            if (em.type === 'smoke') this._updateSmoke(em, dt);
            else if (em.type === 'sparkle') this._updateSparkle(em, dt);
            else if (em.type === 'rain') this._updateRain(em, dt);
            else if (em.type === 'snow') this._updateSnow(em, dt);
            else if (em.type === 'ember') this._updateEmber(em, dt);
            else if (em.type === 'torch_smoke') this._updateTorchSmoke(em, dt);
            else if (em.type === 'bubble') this._updateBubble(em, dt);
            else if (em.type === 'dust_motes') this._updateDustMotes(em, dt);

            // Remove dead emitters (except persistent ones)
            if (em.type === 'sparkle' && em.particles.length === 0 && em.spawned) {
                this.emitters.splice(i, 1);
            }
        }

        // Update sprint dust
        for (let j = this._sprintParticles.length - 1; j >= 0; j--) {
            const p = this._sprintParticles[j];
            p.life -= dt;
            if (p.life <= 0) {
                this._pool.release(p.mesh);
                this._sprintParticles.splice(j, 1);
                continue;
            }
            p.mesh.position.addScaledVector(p.velocity, dt);
            const t = 1 - p.life / p.maxLife;
            p.mesh.material.opacity = 0.5 * (1 - t);
            p.mesh.scale.setScalar(1 + t * 1.5);
        }

        // Update fireflies (every 2nd frame)
        if (this._fireflies) {
            this._fireflyFrame = (this._fireflyFrame || 0) + 1;
            if (this._fireflyFrame >= 2) {
                this._fireflyFrame = 0;
                const now = Date.now() * 0.001;
                const dt2 = dt * 2; // compensate for half update rate
                for (const ff of this._fireflies) {
                    if (this._firefliesActive) {
                        const pulse = Math.sin(now * 2 + ff.phase) * 0.5 + 0.5;
                        ff.mesh.material.opacity = pulse * 0.8;
                        ff.wanderAngle += (Math.random() - 0.5) * 0.1;
                        ff.mesh.position.x += Math.cos(ff.wanderAngle) * ff.wanderSpeed * dt2;
                        ff.mesh.position.z += Math.sin(ff.wanderAngle) * ff.wanderSpeed * dt2;
                        ff.mesh.position.y = ff.origin.y + Math.sin(now * 1.5 + ff.phase) * 0.3;
                        const dx = ff.mesh.position.x - ff.origin.x;
                        const dz = ff.mesh.position.z - ff.origin.z;
                        const dist = Math.sqrt(dx * dx + dz * dz);
                        if (dist > 3) {
                            ff.mesh.position.x = ff.origin.x + (dx / dist) * 3;
                            ff.mesh.position.z = ff.origin.z + (dz / dist) * 3;
                            ff.wanderAngle += Math.PI;
                        }
                    } else {
                        ff.mesh.material.opacity = 0;
                    }
                }
            }
        }

        // Update hit burst particles
        if (this._hitParticles) {
            for (let j = this._hitParticles.length - 1; j >= 0; j--) {
                const p = this._hitParticles[j];
                p.life -= dt;
                if (p.life <= 0) {
                    this._pool.release(p.mesh);
                    this._hitParticles.splice(j, 1);
                    continue;
                }
                p.velocity.y -= 6 * dt;
                p.mesh.position.addScaledVector(p.velocity, dt);
                p.mesh.material.opacity = p.life / p.maxLife;
                p.mesh.scale.setScalar(0.5 + (1 - p.life / p.maxLife) * 0.5);
            }
        }

        // Update slash trail particles
        if (this._slashParticles) {
            for (let j = this._slashParticles.length - 1; j >= 0; j--) {
                const p = this._slashParticles[j];
                p.life -= dt;
                if (p.life <= 0) {
                    this._pool.release(p.mesh);
                    this._slashParticles.splice(j, 1);
                    continue;
                }
                p.mesh.material.opacity = 0.8 * (p.life / p.maxLife);
                p.mesh.scale.x = 1 + (1 - p.life / p.maxLife) * 0.5;
            }
        }

        // Update impact cracks
        if (this._impactCracks) {
            for (let j = this._impactCracks.length - 1; j >= 0; j--) {
                const p = this._impactCracks[j];
                p.life -= dt;
                if (p.life <= 0) {
                    this._pool.release(p.mesh);
                    this._impactCracks.splice(j, 1);
                    continue;
                }
                p.mesh.material.opacity = 0.7 * (p.life / p.maxLife);
            }
        }

        // Update blood splatter
        if (this._bloodParticles) {
            for (let j = this._bloodParticles.length - 1; j >= 0; j--) {
                const p = this._bloodParticles[j];
                p.life -= dt;
                if (p.life <= 0) {
                    this._pool.release(p.mesh);
                    this._bloodParticles.splice(j, 1);
                    continue;
                }
                p.velocity.y -= 12 * dt; // High gravity
                p.mesh.position.addScaledVector(p.velocity, dt);
                p.mesh.material.opacity = 0.9 * (p.life / p.maxLife);
            }
        }
    }

    _updateSmoke(em, dt) {
        if (!em.active) return;

        // Spawn new smoke particles using pool
        em.spawnTimer += dt;
        if (em.spawnTimer >= em.spawnRate) {
            em.spawnTimer -= em.spawnRate;

            const mesh = this._pool.acquire('smoke', this._smokeGeo, {
                color: 0x888888, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false,
            });
            mesh.position.copy(em.position);
            mesh.position.x += (Math.random() - 0.5) * 0.3;
            mesh.position.z += (Math.random() - 0.5) * 0.3;
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

            em.particles.push({
                mesh,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.3,
                    0.8 + Math.random() * 0.5,
                    (Math.random() - 0.5) * 0.3
                ),
                life: 2 + Math.random(),
                maxLife: 2 + Math.random(),
            });
        }

        // Update existing particles
        for (let j = em.particles.length - 1; j >= 0; j--) {
            const p = em.particles[j];
            p.life -= dt;

            if (p.life <= 0) {
                this._pool.release(p.mesh);
                em.particles.splice(j, 1);
                continue;
            }

            const t = 1 - p.life / p.maxLife;
            p.mesh.position.addScaledVector(p.velocity, dt);
            p.mesh.material.opacity = 0.4 * (1 - t);
            p.mesh.scale.setScalar(1 + t * 2);
            p.mesh.rotation.z += dt * 0.5;
        }
    }

    _updateSparkle(em, dt) {
        for (let j = em.particles.length - 1; j >= 0; j--) {
            const p = em.particles[j];
            p.life -= dt;

            if (p.life <= 0) {
                this._pool.release(p.mesh);
                em.particles.splice(j, 1);
                continue;
            }

            // Apply gravity
            p.velocity.y -= 5 * dt;
            p.mesh.position.addScaledVector(p.velocity, dt);

            const t = 1 - p.life / p.maxLife;
            p.mesh.material.opacity = 1 - t;
            p.mesh.scale.setScalar(1 - t * 0.5);
        }
    }

    _updateRain(em, dt) {
        if (!em.active) {
            em.points.visible = false;
            return;
        }

        em.points.visible = true;
        const posAttr = em.points.geometry.getAttribute('position');
        const arr = posAttr.array;
        const px = em.playerRef.x;
        const pz = em.playerRef.z;

        for (let i = 0; i < em.count; i++) {
            arr[i * 3 + 1] += em.velocities[i] * dt;

            // Reset particle if below ground
            if (arr[i * 3 + 1] < 0) {
                arr[i * 3] = px + (Math.random() - 0.5) * 60;
                arr[i * 3 + 1] = 25 + Math.random() * 10;
                arr[i * 3 + 2] = pz + (Math.random() - 0.5) * 60;
            }
        }

        // Center rain around player
        posAttr.needsUpdate = true;
    }

    _updateSnow(em, dt) {
        if (!em.active) {
            em.points.visible = false;
            return;
        }

        em.points.visible = true;
        const posAttr = em.points.geometry.getAttribute('position');
        const arr = posAttr.array;
        const px = em.playerRef.x;
        const pz = em.playerRef.z;

        for (let i = 0; i < em.count; i++) {
            arr[i * 3 + 1] += em.velocities[i] * dt;
            arr[i * 3] += em.drifts[i] * dt;

            if (arr[i * 3 + 1] < 0) {
                arr[i * 3] = px + (Math.random() - 0.5) * 80;
                arr[i * 3 + 1] = 25 + Math.random() * 10;
                arr[i * 3 + 2] = pz + (Math.random() - 0.5) * 80;
            }
        }

        posAttr.needsUpdate = true;
    }

    _updateEmber(em, dt) {
        if (!em.active) return;

        // Spawn new ember particles using pool
        em.spawnTimer += dt;
        if (em.spawnTimer >= em.spawnRate) {
            em.spawnTimer -= em.spawnRate;

            const colors = [0xFF8800, 0xFFAA00, 0xFFCC33];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const mesh = this._pool.acquire('ember', this._hitGeo, { color, opacity: 1 });
            mesh.position.copy(em.position);
            mesh.position.x += (Math.random() - 0.5) * 0.2;
            mesh.position.z += (Math.random() - 0.5) * 0.2;

            em.particles.push({
                mesh,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.3,
                    1 + Math.random(),
                    (Math.random() - 0.5) * 0.3
                ),
                life: 1 + Math.random(),
                maxLife: 1 + Math.random(),
            });
        }

        // Update existing particles
        for (let j = em.particles.length - 1; j >= 0; j--) {
            const p = em.particles[j];
            p.life -= dt;

            if (p.life <= 0) {
                this._pool.release(p.mesh);
                em.particles.splice(j, 1);
                continue;
            }

            const t = 1 - p.life / p.maxLife;
            p.mesh.position.addScaledVector(p.velocity, dt);
            p.mesh.material.opacity = 1 - t * t;
            p.mesh.scale.setScalar(1 - t * 0.5);
        }
    }

    _updateTorchSmoke(em, dt) {
        if (!em.active) return;

        // Spawn new torch smoke particles using pool
        em.spawnTimer += dt;
        if (em.spawnTimer >= em.spawnRate) {
            em.spawnTimer -= em.spawnRate;

            const mesh = this._pool.acquire('torchsmoke', this._smokeGeo, {
                color: 0x888888, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false,
            });
            mesh.position.copy(em.position);
            mesh.position.x += (Math.random() - 0.5) * 0.1;
            mesh.position.z += (Math.random() - 0.5) * 0.1;
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            mesh.scale.setScalar(0.33); // Torch smoke uses 0.1x0.1, shared geo is 0.3x0.3

            em.particles.push({
                mesh,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.15,
                    0.5,
                    (Math.random() - 0.5) * 0.15
                ),
                life: 1.5,
                maxLife: 1.5,
            });
        }

        // Update existing particles
        for (let j = em.particles.length - 1; j >= 0; j--) {
            const p = em.particles[j];
            p.life -= dt;

            if (p.life <= 0) {
                this._pool.release(p.mesh);
                em.particles.splice(j, 1);
                continue;
            }

            const t = 1 - p.life / p.maxLife;
            p.mesh.position.addScaledVector(p.velocity, dt);
            p.mesh.material.opacity = 0.3 * (1 - t);
            p.mesh.scale.setScalar(0.33 + t * 1.0); // Start at 0.33 (0.1/0.3), grow to ~1.33
            p.mesh.rotation.z += dt * 0.5;
        }
    }

    _updateBubble(em, dt) {
        if (!em.active) return;

        // Spawn new bubble particles using pool
        em.spawnTimer += dt;
        if (em.spawnTimer >= em.spawnRate) {
            em.spawnTimer -= em.spawnRate;

            const mesh = this._pool.acquire('bubble', this._sparkGeo, {
                color: 0x88CCEE, opacity: 0.5,
            });
            mesh.position.copy(em.position);
            mesh.position.x += (Math.random() - 0.5) * 4;
            mesh.position.z += (Math.random() - 0.5) * 4;
            mesh.scale.setScalar(0.6 + Math.random() * 0.8);

            em.particles.push({
                mesh,
                velocity: new THREE.Vector3(0, 0.8 + Math.random() * 0.4, 0),
                driftPhase: Math.random() * Math.PI * 2,
                life: 3,
                maxLife: 3,
            });
        }

        // Update existing particles
        for (let j = em.particles.length - 1; j >= 0; j--) {
            const p = em.particles[j];
            p.life -= dt;

            if (p.life <= 0 || p.mesh.position.y > em.position.y + 5) {
                this._pool.release(p.mesh);
                em.particles.splice(j, 1);
                continue;
            }

            const t = 1 - p.life / p.maxLife;
            // Rise vertically with slight horizontal drift via sine wave
            p.mesh.position.y += p.velocity.y * dt;
            p.mesh.position.x += Math.sin(p.driftPhase + t * 6) * 0.3 * dt;
            p.mesh.position.z += Math.cos(p.driftPhase + t * 4) * 0.2 * dt;
            p.mesh.material.opacity = 0.5 * (1 - t * t);
        }
    }

    _updateDustMotes(em, dt) {
        if (!em.active) {
            em.points.visible = false;
            return;
        }

        em.points.visible = true;
        const posAttr = em.points.geometry.getAttribute('position');
        const arr = posAttr.array;
        const now = performance.now() * 0.001;
        const b = em.bounds;

        for (let i = 0; i < em.count; i++) {
            const vel = em.velocities[i];
            const phase = em.phases[i];

            // Slow horizontal drift
            arr[i * 3] += vel.x * dt;
            arr[i * 3 + 2] += vel.z * dt;

            // Sinusoidal vertical bob
            arr[i * 3 + 1] += Math.sin(now * 0.8 + phase) * 0.02 * dt;

            // Wrap at bounds
            if (arr[i * 3] < b.minX) arr[i * 3] = b.maxX;
            else if (arr[i * 3] > b.maxX) arr[i * 3] = b.minX;
            if (arr[i * 3 + 2] < b.minZ) arr[i * 3 + 2] = b.maxZ;
            else if (arr[i * 3 + 2] > b.maxZ) arr[i * 3 + 2] = b.minZ;

            // Clamp vertical
            if (arr[i * 3 + 1] < em.floorY) arr[i * 3 + 1] = em.floorY + em.height;
            else if (arr[i * 3 + 1] > em.floorY + em.height) arr[i * 3 + 1] = em.floorY;
        }

        // Opacity pulse
        em.points.material.opacity = 0.25 + Math.sin(now * 1.5) * 0.15;

        posAttr.needsUpdate = true;
    }
}
