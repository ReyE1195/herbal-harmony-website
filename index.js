// ============================================
//   Herbal Harmony with Holistic Healing
//   Main JavaScript — index.js
// ============================================

// ============================================
//   PRODUCTS DATA
// ============================================
const products = [
    { name:'Pillar Candles', price:'$12.00', image: 'images/2lb_Beeswax_Candle.png', description:'Pure beeswax pillar candles handcrafted with love. Available in multiple sizes.', benefits:'Candle • Pure Beeswax', disclaimer:'Safety Warning: Keep away from children and pets. Never leave a burning candle unattended.', link:'checkout.html', sizes: [{label:'2"', price:'$12.00'},{label:'4"', price:'$15.00'},{label:'6"', price:'$17.00'}] },
    { name:'Skep Candles', price:'$8.00', image: 'images/Beeswax_Beehive_Skep-Candles.png', description:'10+ hour burn time crafted from pure beeswax.', benefits:'Candle • Pure Beeswax', disclaimer:'Safety Warning: Keep away from children and pets. Never leave a burning candle unattended.', link:'checkout.html' },
    { name:'Cold/Flu Foot Soak', price:'$15.00', image: 'images/Cold_Flu_Soak.png', description:'Eucalyptus & Camphor base for congestion relief.', benefits:'Soak • External Use Only', disclaimer:'External Use Only. Soak body/feet for ONLY  15 minutes - 30 minutes. Discontinue if irritation occurs.', link:'checkout.html' },
    { name:'De-Stress Foot Soak', price:'$15.00', image: 'images/Destress_Foot_Soak.png', description:'Ashwagandha root powder for anxiety and muscle tension.', benefits:'Soak • External Use Only', disclaimer:'External Use Only. Soak body/feet for ONLY  15 minutes - 30 minutes. Discontinue if irritation occurs.', link:'checkout.html' },
    { name:'Breathe Better Balm', price:'$10.00', image: 'images/Breathe_Better_Balm.png', description:'Menthol & Camphor crystals for chest congestion relief.', benefits:'Balm • External Use Only', disclaimer:'External Use Only. Discontinue if irritation occurs.', link:'checkout.html' },
    { name:'Little Lungs Balm', price:'$6.00', image: 'images/Little_Lungs_Balm.png', description:'Tea Tree, Eucalyptus & Rosemary — gentle for children and sensitive skin.', benefits:'Balm • Kids Friendly', disclaimer:'External Use Only. Discontinue if irritation occurs.', link:'checkout.html' },
    { name:'Boo Boo Balm', price:'$6.00', image: 'images/BooBoo_Balm.png', description:'Oregano & Blackseed Oil antimicrobial blend for cuts and scrapes.', benefits:'Balm • External Use Only', disclaimer:'External Use Only. Discontinue if irritation occurs.', link:'checkout.html' },
    { name:'Starter Wrap Set', price:'$20.00', image: 'images/Hello_Kitty_Beeswax_Wrap.png', description:'New Pine Rosin Formula for superior cling. Includes S, M & L.', benefits:'Wrap • Cold Wash Only', disclaimer:'Care Instructions: Use cold water with a damp cloth and gently wash. Hang to dry.', link:'checkout.html' },
    { name:'XL Beeswax Wrap', price:'$20.00', image: 'images/Green_Minecraft_Beeswax_Wraps.png', description:'Highest quality seal for large items.', benefits:'Wrap • Cold Wash Only', disclaimer:'Care Instructions: Use cold water with a damp cloth and gently wash. Hang to dry.', link:'checkout.html' },
    { name:'Lip Balm • Vanilla', price:'$3.00', image: 'images/Lip_Balm_Vanilla.png', description:'Moisturizing pure beeswax lip balm with a warm sweet Vanilla scent. Buy any 2 lip balms for $5.00!', benefits:'Lip Balm • Pure Beeswax', disclaimer:'External Use Only. For lip use only. Discontinue if irritation occurs. Keep away from children under 3.', link:'checkout.html' },
    { name:'Lip Balm • Eucalyptus & Mint', price:'$3.00', image: 'images/Lip_Balm_Eucalyptus_Mint.png', description:'Refreshing pure beeswax lip balm with cooling Eucalyptus & Mint. Buy any 2 lip balms for $5.00!', benefits:'Lip Balm • Pure Beeswax', disclaimer:'External Use Only. For lip use only. Discontinue if irritation occurs. Keep away from children under 3.', link:'checkout.html' },
    { name:'Lip Balm • Unscented', price:'$3.00', image: 'images/Lip_Balm_Unscented.png', description:'Pure beeswax lip balm with no added fragrance — perfect for sensitive lips. Buy any 2 lip balms for $5.00!', benefits:'Lip Balm • Pure Beeswax', disclaimer:'External Use Only. For lip use only. Discontinue if irritation occurs. Keep away from children under 3.', link:'checkout.html' },
    { name:'DIY Candle Kit', price:'$15.00', image: 'images/DIY_Candle_Kit.png', description:'Easy, non-toxic craft kit with honeycomb wax included.', benefits:'Candle • All Ages', disclaimer:'Safety Warning: Adult supervision required.', link:'checkout.html' }
];

// ============================================
//   INFINITE LOOP CAROUSEL — 2 cards at a time
// ============================================
const scrollTrack   = document.getElementById('scroll-track');
const btnLeft       = document.querySelector('.left-btn');
const btnRight      = document.querySelector('.right-btn');
const dotsContainer = document.getElementById('progress-dots');

const CARDS_PER_VIEW = 2;
const CARD_WIDTH     = 270;
const CARD_GAP       = 24;
const STEP           = (CARD_WIDTH + CARD_GAP) * CARDS_PER_VIEW;
const TOTAL_GROUPS   = Math.ceil(products.length / CARDS_PER_VIEW); // real groups

let currentIndex = 0; // tracks real group index (0 to TOTAL_GROUPS-1)
let isTransitioning = false;

// Build a single card element
function createCard(p, i) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${i * 0.08}s`;

    // Build size buttons if product has sizes
    const sizeHTML = p.sizes ? `
        <div class="size-btns" style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.6rem;">
            ${p.sizes.map((s, idx) => `
                <button class="size-btn${idx === 0 ? ' size-btn-active' : ''}"
                    data-price="${s.price}"
                    data-label="${s.label}"
                    onclick="event.preventDefault(); selectSize(this)"
                    style="padding:0.3rem 0.65rem;border-radius:999px;border:1.5px solid ${idx === 0 ? '#3D5A3D' : '#CDCFC0'};background:${idx === 0 ? '#3D5A3D' : 'transparent'};color:${idx === 0 ? '#D0EED0' : '#3B575A'};font-family:Montserrat,sans-serif;font-size:0.72rem;font-weight:600;cursor:pointer;transition:all 0.2s ease;">
                    ${s.label} — ${s.price}
                </button>`).join('')}
        </div>` : '';

    card.innerHTML = `
      <a href="${p.link}" style="text-decoration:none;display:block;">
        <div class="card-img-wrap" style="position:relative;overflow:hidden;border-radius:1rem 1rem 0 0;">
          <img src="${p.image}" alt="${p.name}" class="product-image">
          <div class="disclaimer-tooltip" style="position:absolute;top:0.6rem;right:0.6rem;z-index:10;">
            <span class="disclaimer-icon" style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.9);font-size:0.85rem;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);">⚠️</span>
            <div class="disclaimer-text" style="display:none;position:absolute;top:calc(100% + 0.4rem);right:0;background:#3D5A3D;color:#D0EED0;font-size:0.72rem;line-height:1.5;padding:0.6rem 0.85rem;border-radius:0.55rem;width:200px;box-shadow:0 4px 16px rgba(0,0,0,0.2);z-index:20;font-family:Montserrat,sans-serif;">${p.disclaimer}</div>
          </div>
        </div>
        <div class="card-body">
          <div class="benefits-row">
            <span>🌿</span>
            <span class="benefits-tag">${p.benefits}</span>
          </div>
          <h3 class="card-title">${p.name}</h3>
          <p class="card-description">${p.description}</p>
          ${sizeHTML}
          <div class="card-footer">
            <span class="card-price">${p.price}</span>
            <button class="add-to-cart-btn" data-name="${p.name}" onclick="event.preventDefault(); addToCart(this, '${p.name.replace(/'/g, "\\'")}', '${p.price}', '${p.image}')">
              Add to Cart
            </button>
          </div>
        </div>
      </a>`;
    return card;
}

function buildCards() {
    scrollTrack.innerHTML = '';

    // Clone last group at the front (for backward infinite wrap)
    const lastGroupStart = products.length - CARDS_PER_VIEW;
    for (let i = lastGroupStart; i < products.length; i++) {
        const clone = createCard(products[i], i);
        clone.setAttribute('data-clone', 'true');
        scrollTrack.appendChild(clone);
    }

    // Real cards
    products.forEach((p, i) => {
        scrollTrack.appendChild(createCard(p, i));
    });

    // Clone first group at the end (for forward infinite wrap)
    for (let i = 0; i < CARDS_PER_VIEW; i++) {
        const clone = createCard(products[i], i);
        clone.setAttribute('data-clone', 'true');
        scrollTrack.appendChild(clone);
    }

    // Start positioned at the first real group (after the leading clones)
    scrollTrack.style.transition = 'none';
    scrollTrack.scrollLeft = STEP; // skip the leading clone group
}

function buildDots() {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < TOTAL_GROUPS; i++) {
        const dot = document.createElement('button');
        dot.className = 'progress-dot';
        dot.id = `dot-${i}`;
        dot.addEventListener('click', () => goToGroup(i));
        dotsContainer.appendChild(dot);
    }
    updateDots();
}

function updateDots() {
    for (let i = 0; i < TOTAL_GROUPS; i++) {
        const d = document.getElementById(`dot-${i}`);
        if (!d) continue;
        d.style.width = i === currentIndex ? '28px' : '8px';
        d.style.backgroundColor = i === currentIndex ? '#106462' : '#CDCFC0';
    }
}

// Scroll to a real group index with smooth animation
function goToGroup(idx) {
    if (isTransitioning) return;
    currentIndex = ((idx % TOTAL_GROUPS) + TOTAL_GROUPS) % TOTAL_GROUPS;

    // Position: leading clone group occupies slot 0, real groups start at slot 1
    const targetSlot = currentIndex + 1; // +1 to account for leading clones
    isTransitioning = true;

    scrollTrack.style.transition = 'scroll-left 0.45s ease';
    scrollTrack.scrollTo({ left: targetSlot * STEP, behavior: 'smooth' });

    updateDots();
}

// After smooth scroll ends, silently jump if we landed on a clone
function handleScrollEnd() {
    if (!isTransitioning) return;
    isTransitioning = false;

    const totalSlots = TOTAL_GROUPS + 2; // real groups + 2 clone slots
    const scrolledSlot = Math.round(scrollTrack.scrollLeft / STEP);

    if (scrolledSlot === 0) {
        // Jumped to leading clone → wrap to last real group
        scrollTrack.style.transition = 'none';
        scrollTrack.scrollLeft = TOTAL_GROUPS * STEP;
        currentIndex = TOTAL_GROUPS - 1;
        updateDots();
    } else if (scrolledSlot === totalSlots - 1) {
        // Jumped to trailing clone → wrap to first real group
        scrollTrack.style.transition = 'none';
        scrollTrack.scrollLeft = STEP;
        currentIndex = 0;
        updateDots();
    }
}

// Listen for scroll end via scrolled event (with fallback timeout)
scrollTrack.addEventListener('scrolled', handleScrollEnd);

// Fallback for browsers without scrolled
let scrollTimer;
scrollTrack.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(handleScrollEnd, 150);
});

btnLeft.addEventListener('click', () => {
    goToGroup(currentIndex - 1);
});

btnRight.addEventListener('click', () => {
    goToGroup(currentIndex + 1);
});

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  btnLeft.click();
    if (e.key === 'ArrowRight') btnRight.click();
});

// Center the "More Products" button and link to products' page
const viewMoreBtn = document.querySelector('.view-more');
if (viewMoreBtn) {
    viewMoreBtn.style.display = 'block';
    viewMoreBtn.style.margin  = '0 auto';
    viewMoreBtn.addEventListener('click', () => {
        window.location.href = 'products.html';
    });
}

// ============================================
//   SIZE SELECTION — for products with sizes
// ============================================
function selectSize(btn) {
    // Update active button styles
    const siblings = btn.closest('.size-btns').querySelectorAll('.size-btn');
    siblings.forEach(b => {
        b.style.background = 'transparent';
        b.style.borderColor = '#CDCFC0';
        b.style.color = '#3B575A';
        b.classList.remove('size-btn-active');
    });
    btn.style.background = '#3D5A3D';
    btn.style.borderColor = '#3D5A3D';
    btn.style.color = '#D0EED0';
    btn.classList.add('size-btn-active');

    // Update displayed price
    const card = btn.closest('.card-body');
    const priceEl = card.querySelector('.card-price');
    const cartBtn = card.querySelector('.add-to-cart-btn');
    if (priceEl) priceEl.textContent = btn.dataset.price;

    // Update cart button with new price
    const name = cartBtn.dataset.name;
    const image = btn.closest('.product-card') ?
        btn.closest('.product-card').querySelector('.product-image').src : '';
    cartBtn.onclick = (e) => {
        e.preventDefault();
        addToCart(cartBtn, name + ' ' + btn.dataset.label, btn.dataset.price, image);
    };
}

// ============================================
//   ADD TO CART — uses shared HHCart (cart.js)
// ============================================
function addToCart(btn, name, price, image) {
    HHCart.add(name, price, image);
    HHCart.flashButton(btn, 'Add to Cart');
}

// ============================================
//   NAVBAR — active link highlight on scroll
// ============================================
const sections = document.querySelectorAll('section');
const navLinks  = document.querySelectorAll('.nav-link a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 90) current = s.getAttribute('id');
    });
    navLinks.forEach(l => {
        l.classList.remove('active');
        if (l.getAttribute('href') === `#${current}`) l.classList.add('active');
    });
});

// ============================================
//   NEWSLETTER SIGNUP
// ============================================
async function handleNewsletterSignup(e) {
    e.preventDefault();
    const input = document.querySelector('.newsletter-form input[type="email"]');
    const btn   = document.querySelector('.newsletter-submit');
    const email = input.value.trim();

    if (!email || !email.includes('@')) {
        input.style.borderColor = '#e05c5c';
        input.style.boxShadow   = '0 0 10px rgba(224,92,92,0.3)';
        input.placeholder       = 'Please enter a valid email';
        return;
    }

    input.style.borderColor = '';
    input.style.boxShadow   = '';
    btn.disabled    = true;
    btn.textContent = 'Subscribing...';

    try {
        const res  = await fetch('/.netlify/functions/subscribe', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email })
        });

        if (!res.ok) {
            input.style.borderColor = '#e05c5c';
            btn.textContent = 'Try again';
            btn.disabled    = false;
            return;
        }

        input.value       = '';
        input.placeholder = 'Your email address';
        btn.textContent      = "You're in! 🌿";
        btn.style.background = '#C8B97A';
        btn.style.color      = '#000';

        setTimeout(() => {
            btn.textContent      = 'Subscribe 🌿';
            btn.style.background = 'transparent';
            btn.style.color      = '#C8B97A';
            btn.disabled         = false;
        }, 3000);

    } catch(err) {
        btn.textContent = 'Try again';
        btn.disabled    = false;
    }
}

// ============================================
//   INITIALIZE
// ============================================
buildCards();
buildDots();

// ── Disclaimer tooltip hover ───────────────────────────────────
document.getElementById('scroll-track').addEventListener('mouseover', function(e) {
    const icon = e.target.closest('.disclaimer-icon');
    if (icon) {
        const tooltip = icon.nextElementSibling;
        if (tooltip) tooltip.style.display = 'block';
    }
});
document.getElementById('scroll-track').addEventListener('mouseout', function(e) {
    const icon = e.target.closest('.disclaimer-icon');
    if (icon) {
        const tooltip = icon.nextElementSibling;
        if (tooltip) tooltip.style.display = 'none';
    }
});