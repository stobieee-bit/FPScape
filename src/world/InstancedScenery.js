import * as THREE from 'three';

/**
 * InstancedScenery — batches identical geometry+material into InstancedMesh
 * objects for massive draw-call reduction.
 *
 * Usage:
 *   const scenery = new InstancedScenery(scene);
 *   scenery.addBatch('flowers_stem', geometry, material, [
 *       { position: [x,y,z], rotation: [rx,ry,rz], scale: [sx,sy,sz] },
 *       ...
 *   ]);
 *   // Later hide individual instances:
 *   scenery.setInstanceVisible('flowers_stem', 3, false);
 */
export class InstancedScenery {
    constructor(scene) {
        this.scene = scene;
        /** @type {Map<string, { mesh: THREE.InstancedMesh, count: number }>} */
        this._batches = new Map();
        this._dummy = new THREE.Object3D();
    }

    /**
     * Create an InstancedMesh batch and add it to the scene.
     * @param {string} name   Unique batch identifier
     * @param {THREE.BufferGeometry} geometry  Shared geometry
     * @param {THREE.Material} material  Shared material
     * @param {Array<{position?:number[], rotation?:number[], scale?:number[], color?:number}>} transforms
     * @returns {THREE.InstancedMesh}
     */
    addBatch(name, geometry, material, transforms) {
        const count = transforms.length;
        const mesh = new THREE.InstancedMesh(geometry, material, count);
        mesh.name = `instanced_${name}`;

        // Per-instance colour support
        let hasColors = false;
        for (const t of transforms) {
            if (t.color !== undefined) { hasColors = true; break; }
        }
        if (hasColors) {
            mesh.instanceColor = new THREE.InstancedBufferAttribute(
                new Float32Array(count * 3), 3
            );
        }

        const color = new THREE.Color();

        for (let i = 0; i < count; i++) {
            const t = transforms[i];
            this._dummy.position.set(
                t.position ? t.position[0] : 0,
                t.position ? t.position[1] : 0,
                t.position ? t.position[2] : 0
            );
            this._dummy.rotation.set(
                t.rotation ? t.rotation[0] : 0,
                t.rotation ? t.rotation[1] : 0,
                t.rotation ? t.rotation[2] : 0
            );
            if (t.scale) {
                if (typeof t.scale === 'number') {
                    this._dummy.scale.setScalar(t.scale);
                } else {
                    this._dummy.scale.set(t.scale[0], t.scale[1], t.scale[2]);
                }
            } else {
                this._dummy.scale.setScalar(1);
            }
            this._dummy.updateMatrix();
            mesh.setMatrixAt(i, this._dummy.matrix);

            if (hasColors && t.color !== undefined) {
                color.set(t.color);
                mesh.setColorAt(i, color);
            }
        }

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

        // Shadows
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        this.scene.add(mesh);
        this._batches.set(name, { mesh, count });
        return mesh;
    }

    /**
     * Hide or show an individual instance by scaling to zero / restoring.
     * Stores original matrix in a side-map so we can restore later.
     * @param {string} name   Batch name
     * @param {number} index  Instance index
     * @param {boolean} visible  true = show, false = hide
     */
    setInstanceVisible(name, index, visible) {
        const entry = this._batches.get(name);
        if (!entry) return;
        const mesh = entry.mesh;

        if (!mesh._origMatrices) mesh._origMatrices = new Map();

        const mat4 = new THREE.Matrix4();

        if (!visible) {
            // Store original
            mesh.getMatrixAt(index, mat4);
            mesh._origMatrices.set(index, mat4.clone());
            // Scale to zero
            mat4.makeScale(0, 0, 0);
            mesh.setMatrixAt(index, mat4);
            mesh.instanceMatrix.needsUpdate = true;
        } else {
            // Restore from saved
            const orig = mesh._origMatrices.get(index);
            if (orig) {
                mesh.setMatrixAt(index, orig);
                mesh.instanceMatrix.needsUpdate = true;
                mesh._origMatrices.delete(index);
            }
        }
    }

    /**
     * Get a batch mesh by name.
     * @param {string} name
     * @returns {THREE.InstancedMesh|undefined}
     */
    getBatch(name) {
        const entry = this._batches.get(name);
        return entry ? entry.mesh : undefined;
    }

    /**
     * Remove a batch from the scene and dispose its resources.
     * @param {string} name
     */
    removeBatch(name) {
        const entry = this._batches.get(name);
        if (!entry) return;
        this.scene.remove(entry.mesh);
        entry.mesh.dispose();
        this._batches.delete(name);
    }

    /** Total number of batches currently managed. */
    get batchCount() {
        return this._batches.size;
    }

    /** Total number of instances across all batches. */
    get totalInstances() {
        let n = 0;
        for (const entry of this._batches.values()) n += entry.count;
        return n;
    }
}
