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
                return true;
            }
        }

        // Find empty slot
        const empty = this.slots.findIndex(s => s === null);
        if (empty < 0) return false; // Inventory full

        this.slots[empty] = { itemId, quantity };
        return true;
    }

    removeItem(itemId, quantity = 1) {
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (!slot || slot.itemId !== itemId) continue;

            if (slot.quantity <= quantity) {
                this.slots[i] = null;
                quantity -= slot.quantity;
                if (quantity <= 0) return true;
            } else {
                slot.quantity -= quantity;
                return true;
            }
        }
        return false;
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

    getSlot(index) {
        return this.slots[index] || null;
    }
}
