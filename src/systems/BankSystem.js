import { CONFIG } from '../config.js';

export class BankSystem {
    constructor(game) {
        this.game = game;
        this.slots = new Array(100).fill(null); // { itemId, quantity }
        this.isOpen = false;
        this.withdrawQty = 1; // 1, 5, 10, or 'all'
        this._buildUI();
    }

    _buildUI() {
        this._overlay = document.getElementById('bank-overlay');
        this._grid = document.getElementById('bank-grid');

        // Quantity buttons
        document.querySelectorAll('.bank-qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.bank-qty-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.withdrawQty = btn.dataset.qty === 'all' ? 'all' : parseInt(btn.dataset.qty);
            });
        });
    }

    open() {
        this.isOpen = true;
        this._overlay.classList.remove('hidden');
        this._render();
        this.game.input.cursorMode = true;
        document.exitPointerLock();
    }

    close() {
        this.isOpen = false;
        this._overlay.classList.add('hidden');
    }

    _render() {
        this._grid.innerHTML = '';
        for (let i = 0; i < 100; i++) {
            const slot = document.createElement('div');
            slot.className = 'bank-slot';
            const data = this.slots[i];
            if (data) {
                const item = CONFIG.ITEMS[data.itemId];
                slot.innerHTML = item.icon + (data.quantity > 1 ? `<span class="bank-qty">${data.quantity}</span>` : '');
                slot.title = `${item.name}${data.quantity > 1 ? ' x' + data.quantity : ''} (click to withdraw)`;
                slot.addEventListener('click', () => this.withdraw(i));
            }
            this._grid.appendChild(slot);
        }

        // Show inventory below for depositing
        const invSection = document.getElementById('bank-inventory');
        invSection.innerHTML = '';
        for (let i = 0; i < 28; i++) {
            const slotData = this.game.inventorySystem.getSlot(i);
            const el = document.createElement('div');
            el.className = 'bank-inv-slot';
            if (slotData) {
                const item = CONFIG.ITEMS[slotData.itemId];
                el.innerHTML = item.icon + (slotData.quantity > 1 ? `<span class="bank-qty">${slotData.quantity}</span>` : '');
                el.title = `${item.name} (click to deposit)`;
                el.addEventListener('click', () => { this.deposit(i); this._render(); });
            }
            invSection.appendChild(el);
        }
    }

    deposit(invSlot) {
        const slotData = this.game.inventorySystem.getSlot(invSlot);
        if (!slotData) return;

        const itemId = slotData.itemId;
        const qty = slotData.quantity;

        // Find existing stack in bank
        const existing = this.slots.findIndex(s => s && s.itemId === itemId);
        if (existing >= 0) {
            this.slots[existing].quantity += qty;
        } else {
            const empty = this.slots.findIndex(s => s === null);
            if (empty < 0) { this.game.addChatMessage("Your bank is full!", 'system'); return; }
            this.slots[empty] = { itemId, quantity: qty };
        }

        this.game.inventorySystem.slots[invSlot] = null;
        this.game.addChatMessage(`Deposited ${CONFIG.ITEMS[itemId].name}.`);
    }

    depositAll() {
        for (let i = 0; i < 28; i++) {
            if (this.game.inventorySystem.getSlot(i)) this.deposit(i);
        }
        this._render();
    }

    withdraw(bankSlot) {
        const data = this.slots[bankSlot];
        if (!data) return;

        const requestedQty = this.withdrawQty === 'all' ? data.quantity : Math.min(this.withdrawQty, data.quantity);
        let withdrawn = 0;

        for (let i = 0; i < requestedQty; i++) {
            const added = this.game.inventorySystem.addItem(data.itemId, 1);
            if (added) {
                withdrawn++;
                data.quantity--;
                if (data.quantity <= 0) { this.slots[bankSlot] = null; break; }
            } else {
                break;
            }
        }

        if (withdrawn > 0) {
            this._render();
        } else {
            this.game.addChatMessage("Your inventory is full!", 'system');
        }
    }

    getUniqueCount() {
        return this.slots.filter(s => s !== null).length;
    }
}
