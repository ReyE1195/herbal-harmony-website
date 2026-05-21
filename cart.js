// ============================================
//   Herbal Harmony with Holistic Healing
//   Shared Cart — cart.js
//   Works across all pages via sessionStorage
// ============================================

const HHCart = {

    // ── Get cart ──────────────────────────────
    get() {
        try {
            return JSON.parse(sessionStorage.getItem('hh_cart') || '[]');
        } catch(e) {
            return [];
        }
    },

    // ── Save cart ─────────────────────────────
    save(cart) {
        try {
            sessionStorage.setItem('hh_cart', JSON.stringify(cart));
        } catch(e) {}
        this.updateBadge();
    },

    // ── Add item ──────────────────────────────
    add(name, price, image) {
        const cart = this.get();
        const existing = cart.find(item => item.name === name);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ name, price, image, qty: 1 });
        }
        this.save(cart);
    },

    // ── Remove item ───────────────────────────
    remove(name) {
        const cart = this.get().filter(item => item.name !== name);
        this.save(cart);
    },

    // ── Clear cart ────────────────────────────
    clear() {
        try { sessionStorage.removeItem('hh_cart'); } catch(e) {}
        this.updateBadge();
    },

    // ── Total items ───────────────────────────
    totalItems() {
        return this.get().reduce((sum, item) => sum + item.qty, 0);
    },

    // ── Total price ───────────────────────────
    totalPrice() {
        return this.get().reduce((sum, item) => {
            return sum + parseFloat(item.price.replace('$', '')) * item.qty;
        }, 0);
    },

    // ── Update cart badge on cart icon ────────
    updateBadge() {
        const total = this.totalItems();
        let badge = document.getElementById('hh-cart-badge');
        const cartLink = document.querySelector('.cart-icon');
        if (!cartLink) return;
        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'hh-cart-badge';
            badge.style.cssText = [
                'position:absolute',
                'top:-7px',
                'right:-7px',
                'background:#39FFD8',
                'color:#000',
                'border-radius:50%',
                'min-width:18px',
                'height:18px',
                'font-size:0.62rem',
                'font-weight:700',
                'display:flex',
                'align-items:center',
                'justify-content:center',
                'font-family:Montserrat,sans-serif',
                'pointer-events:none',
                'padding:0 3px'
            ].join(';');
            cartLink.style.position = 'relative';
            cartLink.appendChild(badge);
        }
        if (total > 0) {
            badge.textContent = total;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    },

    // ── Show added feedback on a button ───────
    flashButton(btn, originalText) {
        if (!btn) return;
        btn.textContent = 'Added! 🌿';
        btn.style.background = '#106462';
        btn.style.color = '#fff';
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent = originalText || 'Add to Cart';
            btn.style.background = '';
            btn.style.color = '';
            btn.disabled = false;
        }, 1500);
    }
};

// Update badge on every page load
document.addEventListener('DOMContentLoaded', () => HHCart.updateBadge());