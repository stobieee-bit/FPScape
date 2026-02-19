import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.emitters = [];
        this._sprintParticles = [];
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

        // Spawn all particles at once
        const colors = [0xFFD700, 0xFFFF00, 0xFFA500, 0xFFFFFF];
        for (let i = 0; i < 24; i++) {
            const geo = new THREE.SphereGeometry(0.06, 3, 2);
            const mat = new THREE.MeshBasicMaterial({
                color: colors[i % colors.length],
                transparent: true,
                opacity: 1,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(position);

            // Random velocity in sphere
            const angle = Math.random() * Math.PI * 2;
            const upAngle = Math.random() * Math.PI - Math.PI * 0.3;
            const speed = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * Math.cos(upAngle) * speed;
            const vy = Math.sin(upAngle) * speed + 2;
            const vz = Math.sin(angle) * Math.cos(upAngle) * speed;

            this.scene.add(mesh);
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
        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(0.04, 3, 2);
            const mat = new THREE.MeshBasicMaterial({
                color: colors[i % colors.length],
                transparent: true,
                opacity: 1,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(position);
            mesh.position.y += 0.8 + Math.random() * 0.4;

            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 2;
            const vy = 1 + Math.random() * 2;

            this.scene.add(mesh);
            if (!this._hitParticles) this._hitParticles = [];
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
        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(0.06, 3, 2);
            const mat = new THREE.MeshBasicMaterial({
                color: colors[i % colors.length],
                transparent: true,
                opacity: 1,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(position);
            mesh.position.y += 0.5 + Math.random() * 0.5;

            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2.5;
            const vy = 2 + Math.random() * 3;

            this.scene.add(mesh);
            if (!this._hitParticles) this._hitParticles = [];
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
            const geo = new THREE.PlaneGeometry(0.15, 0.15);
            const mat = new THREE.MeshBasicMaterial({
                color: 0x9B8B6B,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide,
                depthWrite: false,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(
                position.x + (Math.random() - 0.5) * 0.5,
                position.y + 0.05,
                position.z + (Math.random() - 0.5) * 0.5
            );
            mesh.rotation.x = -Math.PI / 2;
            mesh.rotation.z = Math.random() * Math.PI;
            this.scene.add(mesh);
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

    // Lightning flash — briefly brighten the scene
    flashLightning() {
        const light = new THREE.PointLight(0xFFFFFF, 8, 200);
        light.position.set(
            (Math.random() - 0.5) * 80,
            50,
            (Math.random() - 0.5) * 80
        );
        this.scene.add(light);
        setTimeout(() => {
            light.intensity = 3;
        }, 50);
        setTimeout(() => {
            this.scene.remove(light);
            light.dispose();
        }, 150);
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
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this._sprintParticles.splice(j, 1);
                continue;
            }
            p.mesh.position.addScaledVector(p.velocity, dt);
            const t = 1 - p.life / p.maxLife;
            p.mesh.material.opacity = 0.5 * (1 - t);
            p.mesh.scale.setScalar(1 + t * 1.5);
        }

        // Update fireflies
        if (this._fireflies) {
            const now = Date.now() * 0.001;
            for (const ff of this._fireflies) {
                if (this._firefliesActive) {
                    // Pulse opacity
                    const pulse = Math.sin(now * 2 + ff.phase) * 0.5 + 0.5;
                    ff.mesh.material.opacity = pulse * 0.8;
                    // Wander
                    ff.wanderAngle += (Math.random() - 0.5) * 0.1;
                    ff.mesh.position.x += Math.cos(ff.wanderAngle) * ff.wanderSpeed * dt;
                    ff.mesh.position.z += Math.sin(ff.wanderAngle) * ff.wanderSpeed * dt;
                    ff.mesh.position.y = ff.origin.y + Math.sin(now * 1.5 + ff.phase) * 0.3;
                    // Clamp to origin radius
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

        // Update hit burst particles
        if (this._hitParticles) {
            for (let j = this._hitParticles.length - 1; j >= 0; j--) {
                const p = this._hitParticles[j];
                p.life -= dt;
                if (p.life <= 0) {
                    this.scene.remove(p.mesh);
                    p.mesh.geometry.dispose();
                    p.mesh.material.dispose();
                    this._hitParticles.splice(j, 1);
                    continue;
                }
                p.velocity.y -= 6 * dt;
                p.mesh.position.addScaledVector(p.velocity, dt);
                p.mesh.material.opacity = p.life / p.maxLife;
                p.mesh.scale.setScalar(0.5 + (1 - p.life / p.maxLife) * 0.5);
            }
        }
    }

    _updateSmoke(em, dt) {
        if (!em.active) return;

        // Spawn new smoke particles
        em.spawnTimer += dt;
        if (em.spawnTimer >= em.spawnRate) {
            em.spawnTimer -= em.spawnRate;

            const geo = new THREE.PlaneGeometry(0.3, 0.3);
            const mat = new THREE.MeshBasicMaterial({
                color: 0x888888,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide,
                depthWrite: false,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(em.position);
            mesh.position.x += (Math.random() - 0.5) * 0.3;
            mesh.position.z += (Math.random() - 0.5) * 0.3;
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

            this.scene.add(mesh);
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
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
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
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
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
}
