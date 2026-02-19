import { CONFIG } from '../config.js';

export class TradeSystem {
    constructor(game) {
        this.game = game;

        // Trade session state
        this.active = false;
        this.partnerId = null;
        this.partnerName = '';
        this.myOffer = [];     // [{ itemId, quantity }] up to 12 slots
        this.theirOffer = [];  // [{ itemId, quantity }] up to 12 slots
        this.myAccepted = false;
        this.theirAccepted = false;

        // Pending incoming request
        this.pendingRequest = null; // { fromId, fromName }

        // DOM refs
        this._overlay = document.getElementById('trade-overlay');
        this._myGrid = document.getElementById('trade-my-grid');
        this._theirGrid = document.getElementById('trade-their-grid');
        this._partnerNameEl = document.getElementById('trade-partner-name');
        this._myStatus = document.getElementById('trade-my-status');
        this._theirStatus = document.getElementById('trade-their-status');
        this._acceptBtn = document.getElementById('trade-accept-btn');
        this._declineBtn = document.getElementById('trade-decline-btn');
        this._requestPopup = document.getElementById('trade-request-popup');

        this._setupUI();
    }

    _setupUI() {
        if (this._acceptBtn) {
            this._acceptBtn.addEventListener('click', () => this.confirmTrade());
        }
        if (this._declineBtn) {
            this._declineBtn.addEventListener('click', () => this.declineTrade());
        }

        // Request popup buttons
        const acceptReq = document.getElementById('trade-req-accept');
        const declineReq = document.getElementById('trade-req-decline');
        if (acceptReq) acceptReq.addEventListener('click', () => this._acceptRequest());
        if (declineReq) declineReq.addEventListener('click', () => this._declineRequest());

        // Click on my inventory slots in the trade overlay to offer items
        if (this._myGrid) {
            this._myGrid.addEventListener('click', (e) => {
                const slot = e.target.closest('.trade-slot');
                if (!slot || !slot.dataset.index) return;
                this.removeOffer(parseInt(slot.dataset.index));
            });
        }
    }

    /** Request trade with another player */
    requestTrade(playerId) {
        if (this.active) {
            this.game.addChatMessage('You are already in a trade.', 'system');
            return;
        }
        const nm = this.game.networkManager;
        if (!nm || !nm.connected) {
            this.game.addChatMessage('Not connected to multiplayer.', 'system');
            return;
        }
        nm.sendTradeRequest(playerId);
        this.game.addChatMessage('Sending trade request...', 'system');
    }

    /** Called when a trade request comes in from another player */
    onTradeRequest(fromId, fromName) {
        if (this.active) return; // Already trading
        this.pendingRequest = { fromId, fromName };
        this._showRequestPopup(fromName);
    }

    _showRequestPopup(name) {
        if (!this._requestPopup) return;
        const nameEl = document.getElementById('trade-req-name');
        if (nameEl) nameEl.textContent = name;
        this._requestPopup.classList.remove('hidden');
    }

    _hideRequestPopup() {
        if (this._requestPopup) this._requestPopup.classList.add('hidden');
        this.pendingRequest = null;
    }

    _acceptRequest() {
        if (!this.pendingRequest) return;
        const nm = this.game.networkManager;
        if (nm && nm.connected) {
            nm.sendTradeAccept(this.pendingRequest.fromId);
        }
        this._hideRequestPopup();
    }

    _declineRequest() {
        if (!this.pendingRequest) return;
        const nm = this.game.networkManager;
        if (nm && nm.connected) {
            nm.sendTradeDecline(this.pendingRequest.fromId);
        }
        this._hideRequestPopup();
    }

    /** Called when trade session starts (both players accepted) */
    openTrade(partnerId, partnerName) {
        this.active = true;
        this.partnerId = partnerId;
        this.partnerName = partnerName;
        this.myOffer = [];
        this.theirOffer = [];
        this.myAccepted = false;
        this.theirAccepted = false;

        if (this._partnerNameEl) this._partnerNameEl.textContent = partnerName;
        this._renderGrids();
        this._updateStatus();

        if (this._overlay) this._overlay.classList.remove('hidden');
        this.game.input.cursorMode = true;
        document.exitPointerLock();
        this.game.addChatMessage(`Trading with ${partnerName}.`, 'system');
    }

    /** Offer an item from inventory */
    offerItem(slotIndex) {
        if (!this.active || this.myOffer.length >= 12) return;
        const inv = this.game.inventorySystem;
        const slot = inv.getSlot(slotIndex);
        if (!slot) return;

        // Move 1 quantity from inventory to offer
        const itemId = slot.itemId;
        const qty = 1;
        inv.removeItem(itemId, qty);

        // Check if already in offer (stack)
        const existing = this.myOffer.find(o => o.itemId === itemId);
        if (existing) {
            existing.quantity += qty;
        } else {
            this.myOffer.push({ itemId, quantity: qty });
        }

        this.myAccepted = false;
        this.theirAccepted = false;
        this._renderGrids();
        this._updateStatus();
        this._sendOfferUpdate();
    }

    /** Remove an item from my offer back to inventory */
    removeOffer(offerIndex) {
        if (!this.active || offerIndex < 0 || offerIndex >= this.myOffer.length) return;
        const item = this.myOffer[offerIndex];

        // Return to inventory
        this.game.inventorySystem.addItem(item.itemId, item.quantity);
        this.myOffer.splice(offerIndex, 1);

        this.myAccepted = false;
        this.theirAccepted = false;
        this._renderGrids();
        this._updateStatus();
        this._sendOfferUpdate();
    }

    /** Partner updated their offer */
    onOfferUpdate(offer) {
        this.theirOffer = offer || [];
        this.myAccepted = false;
        this.theirAccepted = false;
        this._renderGrids();
        this._updateStatus();
    }

    /** Confirm / accept trade */
    confirmTrade() {
        if (!this.active) return;
        this.myAccepted = true;
        this._updateStatus();
        const nm = this.game.networkManager;
        if (nm && nm.connected) {
            nm.sendTradeConfirm();
        }
    }

    /** Partner accepted */
    onPartnerAccept() {
        this.theirAccepted = true;
        this._updateStatus();
    }

    /** Trade completed — items exchanged */
    onTradeComplete() {
        if (!this.active) return;
        // Add their offer items to our inventory
        for (const item of this.theirOffer) {
            this.game.inventorySystem.addItem(item.itemId, item.quantity);
        }
        this.game.addChatMessage('Trade complete!', 'level-up');
        this.game.audio.playPickup?.();
        this.close();
    }

    /** Trade cancelled (by partner leaving, declining, etc.) */
    onTradeCancelled(reason) {
        if (!this.active) return;
        // Return my offered items to inventory
        for (const item of this.myOffer) {
            this.game.inventorySystem.addItem(item.itemId, item.quantity);
        }
        this.game.addChatMessage(reason || 'Trade cancelled.', 'system');
        this.close();
    }

    /** Decline / close trade */
    declineTrade() {
        if (!this.active) return;
        const nm = this.game.networkManager;
        if (nm && nm.connected) {
            nm.sendTradeDecline(this.partnerId);
        }
        this.onTradeCancelled('You declined the trade.');
    }

    close() {
        this.active = false;
        this.partnerId = null;
        this.partnerName = '';
        this.myOffer = [];
        this.theirOffer = [];
        this.myAccepted = false;
        this.theirAccepted = false;
        if (this._overlay) this._overlay.classList.add('hidden');
    }

    _sendOfferUpdate() {
        const nm = this.game.networkManager;
        if (nm && nm.connected) {
            nm.sendOfferUpdate(this.myOffer);
        }
    }

    _renderGrids() {
        if (this._myGrid) this._renderGrid(this._myGrid, this.myOffer, true);
        if (this._theirGrid) this._renderGrid(this._theirGrid, this.theirOffer, false);
    }

    _renderGrid(container, items, isMine) {
        container.textContent = '';
        for (let i = 0; i < 12; i++) {
            const slot = document.createElement('div');
            slot.className = 'trade-slot';
            slot.dataset.index = i;
            if (items[i]) {
                const itemDef = CONFIG.ITEMS[items[i].itemId];
                if (itemDef) {
                    const icon = document.createElement('span');
                    icon.className = 'trade-item-icon';
                    icon.textContent = itemDef.icon || '?';
                    slot.appendChild(icon);

                    if (items[i].quantity > 1) {
                        const qty = document.createElement('span');
                        qty.className = 'trade-item-qty';
                        qty.textContent = items[i].quantity;
                        slot.appendChild(qty);
                    }

                    slot.title = `${itemDef.name}${items[i].quantity > 1 ? ' x' + items[i].quantity : ''}`;
                }
            }
            container.appendChild(slot);
        }
    }

    _updateStatus() {
        if (this._myStatus) {
            this._myStatus.textContent = this.myAccepted ? '✅ Accepted' : '⏳ Waiting...';
            this._myStatus.className = 'trade-status' + (this.myAccepted ? ' accepted' : '');
        }
        if (this._theirStatus) {
            this._theirStatus.textContent = this.theirAccepted ? '✅ Accepted' : '⏳ Waiting...';
            this._theirStatus.className = 'trade-status' + (this.theirAccepted ? ' accepted' : '');
        }
        if (this._acceptBtn) {
            this._acceptBtn.textContent = this.myAccepted ? 'Waiting...' : 'Accept';
            this._acceptBtn.disabled = this.myAccepted;
        }
    }
}
