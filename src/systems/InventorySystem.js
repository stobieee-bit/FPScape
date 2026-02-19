import { CONFIG } from '../config.js';

export class InventorySystem {
    constructor(game) {
        this.game = game;
        this.slots = new Array(28).fill(null);
        // Each slot: { itemId: string, quantity: number } or null
    }

    addItem(itemId, quantity = 1) {
        const itemDef = CONFIG.ITEMS[itemId];
        if (!itemDef) return false;

        if (itemDef.stackable) {
            // Find existing stack
            const existing = this.slots.findIndex(s => s && s.itemId === itemId);
            if (existing >= 0) {
                this.slots[existing].quantity += quantity;
                if (this.game.ui) this.game.ui.markDirty('inventory');
                return true;
            }
        }

        // Find empty slot
        const empty = this.slots.findIndex(s => s === null);
        if (empty < 0) return false; // Inventory full

        this.slots[empty] = { itemId, quantity };
        if (this.game.ui) this.game.ui.markDirty('inventory');
        return true;
    }

    removeItem(itemId, quantity = 1) {
        let removed = false;
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (!slot || slot.itemId !== itemId) continue;

            if (slot.quantity <= quantity) {
                this.slots[i] = null;
                quantity -= slot.quantity;
                removed = true;
                if (quantity <= 0) break;
            } else {
                slot.quantity -= quantity;
                removed = true;
                break;
            }
        }
        if (removed && this.game.ui) this.game.ui.markDirty('inventory');
        return removed;
    }

    hasItem(itemId, quantity = 1) {
        let total = 0;
        for (const slot of this.slots) {
            if (slot && slot.itemId === itemId) {
                total += slot.quantity;
                if (total >= quantity) return true;
            }
        }
        return false;
    }

    getItemCount(itemId) {
        let total = 0;
        for (const slot of this.slots) {
            if (slot && slot.itemId === itemId) {
                total += slot.quantity;
            }
        }
        return total;
    }

    countItem(itemId) { return this.getItemCount(itemId); }

    /** Eat the best food item in inventory (mobile action bar helper) */
    eatBestFood() {
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (!slot) continue;
            const def = CONFIG.ITEMS[slot.itemId];
            if (def && def.healAmount) {
                const player = this.game.player;
                if (player.hp >= player.maxHp) {
                    this.game.addChatMessage('You are already at full health.', 'system');
                    return;
                }
                player.hp = Math.min(player.maxHp, player.hp + def.healAmount);
                this.removeItem(slot.itemId, 1);
                this.game.addChatMessage(`You eat the ${def.name}. It heals ${def.healAmount}.`, 'system');
                this.game.audio.playEat();
                return;
            }
        }
        this.game.addChatMessage('You have no food to eat.', 'system');
    }

    isFull() {
        return this.slots.every(s => s !== null);
    }

    dropItem(slotIndex) {
        if (slotIndex < 0 || slotIndex >= 28) return;
        const slot = this.slots[slotIndex];
        if (!slot) return;

        const itemDef = CONFIG.ITEMS[slot.itemId];
        this.game.addChatMessage(`You drop the ${itemDef.name}.`);

        // Create ground item at player position
        const playerPos = this.game.player.position;
        this.game.environment.spawnGroundItem(slot.itemId, slot.quantity, playerPos);

        this.slots[slotIndex] = null;
    }

    swapSlots(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= 28 || toIndex < 0 || toIndex >= 28) return;
        if (fromIndex === toIndex) return;
        const temp = this.slots[fromIndex];
        this.slots[fromIndex] = this.slots[toIndex];
        this.slots[toIndex] = temp;
    }

    getSlot(index) {
        return this.slots[index] || null;
    }
}
