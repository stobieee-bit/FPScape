import { CONFIG } from '../config.js';

export class GrandExchangeSystem {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this._mode = 'buy';
        this._searchFilter = '';

        this._overlay = document.getElementById('ge-overlay');
        this._grid = document.getElementById('ge-grid');
        this._searchInput = document.getElementById('ge-search');

        // Mode toggle buttons
        const modeBtns = document.querySelectorAll('.ge-mode-btn');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this._mode = btn.dataset.mode;
                modeBtns.forEach(b => b.classList.toggle('active', b === btn));
                this._render();
            });
        });

        // Search input
        if (this._searchInput) {
            this._searchInput.addEventListener('input', () => {
                this._searchFilter = this._searchInput.value;
                this._render();
            });
            this._searchInput.addEventListener('keydown', e => e.stopPropagation());
        }

        // Close
        const closeBtn = document.getElementById('ge-close');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    }

    open() {
        this.isOpen = true;
        this._mode = 'buy';
        this._searchFilter = '';
        if (this._searchInput) this._searchInput.value = '';
        document.querySelectorAll('.ge-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'buy'));
        this._overlay.classList.remove('hidden');
        this._render();
        this.game.input.cursorMode = true;
        document.exitPointerLock();
    }

    close() {
        this.isOpen = false;
        this._overlay.classList.add('hidden');
    }

    getBuyPrice(itemId) {
        const base = CONFIG.GRAND_EXCHANGE.basePrices[itemId];
        if (base) return base;
        return Math.max(1, Math.floor((this.game.shopSystem.getSellPrice(itemId) || 1) * 2.5));
    }

    getSellPrice(itemId) {
        return Math.max(1, Math.floor(this.getBuyPrice(itemId) * 0.6));
    }

    _render() {
        this._grid.textContent = '';
        const filter = this._searchFilter.toLowerCase();

        const items = this._mode === 'buy'
            ? Object.keys(CONFIG.GRAND_EXCHANGE.basePrices)
            : this._getPlayerItems();

        for (const itemId of items) {
            const itemDef = CONFIG.ITEMS[itemId];
            if (!itemDef) continue;
            if (filter && !itemDef.name.toLowerCase().includes(filter)) continue;

            const price = this._mode === 'buy' ? this.getBuyPrice(itemId) : this.getSellPrice(itemId);

            const el = document.createElement('div');
            el.className = 'ge-item';

            const icon = document.createElement('span');
            icon.className = 'ge-icon';
            icon.textContent = itemDef.icon || '\u25A0';
            el.appendChild(icon);

            const name = document.createElement('span');
            name.className = 'ge-name';
            name.textContent = itemDef.name;
            el.appendChild(name);

            const priceSpan = document.createElement('span');
            priceSpan.className = 'ge-price';
            priceSpan.textContent = `${price} gp`;
            el.appendChild(priceSpan);

            if (this._mode === 'sell') {
                const count = this.game.inventorySystem.getItemCount(itemId);
                const qtySpan = document.createElement('span');
                qtySpan.className = 'ge-qty';
                qtySpan.textContent = `x${count}`;
                el.appendChild(qtySpan);
            }

            el.addEventListener('click', () => {
                if (this._mode === 'buy') this._buy(itemId, price);
                else this._sell(itemId, price);
            });
            this._grid.appendChild(el);
        }

        if (this._grid.children.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'ge-empty';
            empty.textContent = this._mode === 'sell' ? 'Nothing to sell.' : 'No items found.';
            this._grid.appendChild(empty);
        }
    }

    _getPlayerItems() {
        const items = new Set();
        for (const slot of this.game.inventorySystem.slots) {
            if (slot && slot.itemId !== 'coins') items.add(slot.itemId);
        }
        return [...items];
    }

    _buy(itemId, price) {
        const coins = this.game.inventorySystem.getItemCount('coins');
        if (coins < price) {
            this.game.addChatMessage("You don't have enough coins.", 'system');
            return;
        }
        const itemDef = CONFIG.ITEMS[itemId];
        if (this.game.inventorySystem.isFull() && !(itemDef?.stackable && this.game.inventorySystem.hasItem(itemId))) {
            this.game.addChatMessage("Your inventory is full!", 'system');
            return;
        }
        this.game.inventorySystem.removeItem('coins', price);
        this.game.inventorySystem.addItem(itemId, 1);
        this.game.addChatMessage(`Bought ${itemDef?.name || itemId} for ${price} gp.`);
        this.game.audio.playPickup();
        this._render();
    }

    _sell(itemId, price) {
        if (!this.game.inventorySystem.hasItem(itemId)) {
            this.game.addChatMessage("You don't have that item.", 'system');
            return;
        }
        this.game.inventorySystem.removeItem(itemId, 1);
        this.game.inventorySystem.addItem('coins', price);
        const itemDef = CONFIG.ITEMS[itemId];
        this.game.addChatMessage(`Sold ${itemDef?.name || itemId} for ${price} gp.`);
        this.game.audio.playPickup();
        this._render();
    }
}
