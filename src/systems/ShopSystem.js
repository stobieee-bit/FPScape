import { CONFIG } from '../config.js';

export class ShopSystem {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this._buildUI();
    }

    _buildUI() {
        this._overlay = document.getElementById('shop-overlay');
        this._grid = document.getElementById('shop-grid');
        this._shopName = document.getElementById('shop-name');
    }

    open() {
        this.isOpen = true;
        this._shopName.textContent = CONFIG.SHOP.name;
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
        for (const stock of CONFIG.SHOP.stock) {
            const item = CONFIG.ITEMS[stock.item];
            const el = document.createElement('div');
            el.className = 'shop-item';
            el.innerHTML = `
                <span class="shop-icon">${item.icon}</span>
                <span class="shop-item-name">${item.name}</span>
                <span class="shop-price">${stock.price} gp</span>
            `;
            el.title = `Buy ${item.name} for ${stock.price} coins`;
            el.addEventListener('click', () => this.buy(stock.item, stock.price));
            this._grid.appendChild(el);
        }
    }

    buy(itemId, price) {
        const coins = this.game.inventorySystem.getItemCount('coins');
        if (coins < price) {
            this.game.addChatMessage("You don't have enough coins.", 'system');
            return;
        }
        if (this.game.inventorySystem.isFull()) {
            const itemDef = CONFIG.ITEMS[itemId];
            if (!itemDef.stackable || !this.game.inventorySystem.hasItem(itemId)) {
                this.game.addChatMessage("Your inventory is full!", 'system');
                return;
            }
        }
        this.game.inventorySystem.removeItem('coins', price);
        this.game.inventorySystem.addItem(itemId, 1);
        this.game.addChatMessage(`Bought ${CONFIG.ITEMS[itemId].name} for ${price} coins.`);
    }

    sell(itemId) {
        const item = CONFIG.ITEMS[itemId];
        if (!item) return;
        if (itemId === 'coins') { this.game.addChatMessage("You can't sell coins.", 'system'); return; }
        const price = this.getSellPrice(itemId);
        if (price < 1) { this.game.addChatMessage("That item has no value.", 'system'); return; }
        this.game.inventorySystem.removeItem(itemId, 1);
        this.game.inventorySystem.addItem('coins', price);
        this.game.addChatMessage(`Sold ${item.name} for ${price} coins.`);
        this.game.audio.playPickup();
    }

    getSellPrice(itemId) {
        // Shop stock items: 60% of buy price
        const stock = CONFIG.SHOP.stock.find(s => s.item === itemId);
        if (stock) return Math.max(1, Math.floor(stock.price * 0.6));

        // General sell values by item type
        const sellValues = {
            // Resources
            logs: 2, oak_logs: 5, willow_logs: 10,
            copper_ore: 3, tin_ore: 3, iron_ore: 8, coal: 12,
            raw_shrimp: 2, raw_trout: 10, raw_lobster: 20,
            cooked_shrimp: 4, cooked_trout: 15, cooked_lobster: 30,
            raw_chicken: 1, raw_beef: 2, cooked_chicken: 3, cooked_beef: 5,
            bones: 1, dragon_bones: 15, feather: 1, cowhide: 3, wool: 2,
            rune_essence: 2, herb: 5, burnt_food: 0,
            // Bars
            bronze_bar: 8, iron_bar: 18,
            // Equipment
            iron_sword: 30, steel_sword: 80, iron_chainbody: 50,
            steel_platebody: 150, iron_helm: 25, iron_legs: 40,
            // Potions
            attack_potion: 15, strength_potion: 15, defence_potion: 15,
            stamina_potion: 10, antipoison: 8,
            // Runes (not in shop)
            chaos_rune: 8,
            // Misc
            goblin_mail: 5,
        };
        return sellValues[itemId] || 1;
    }
}
