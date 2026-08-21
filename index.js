// ============================================
//   Herbal Harmony with Holistic Healing
//   Main JavaScript — index.js
// ============================================

// ============================================
//   PRODUCTS DATA
// ============================================
const products = [
    { name:'Large Round Pillar', price:'$40.00', image: 'images/LargePillar.jpeg', description:'10+ hour burn time per oz, finely crafted from pure beeswax. 6" x 3".', benefits:'Candle \u2022 Pure Beeswax', disclaimer:'Safety Warning: Keep away from children and pets. Never leave a burning candle unattended.', link:'checkout.html' },
    { name:'Skep w/Bees Beehive Candles', price:'$6.00', image: 'images/SkepwBees.jpeg', description:'10+ hour burn time crafted from pure beeswax. 2" x 1.75".', benefits:'Candle \u2022 Pure Beeswax', disclaimer:'Safety Warning: Keep away from children and pets. Never leave a burning candle unattended.', link:'checkout.html' },
    { name:'DIY Candle Kit', price:'$15.00', image: 'images/ai-generated/DIY_Candle_Kit.png', description:'Easy, non-toxic craft kit with honeycomb wax, tea light molds, and wick included. 2 for $25.00!', benefits:'Candle \u2022 All Ages', disclaimer:'Safety Warning: Adult supervision required.', link:'checkout.html' },
    { name:'Breathe Better Balm', price:'$15.00', image: 'images/ai-generated/Breathe_Better_Balm.png', description:'Menthol & Camphor crystals for chest congestion relief. 2.5oz.', benefits:'Balm \u2022 External Use Only', disclaimer:'External Use Only. Discontinue if irritation occurs.', link:'checkout.html' },
    { name:'Cold/Flu Foot or Bath Soak', price:'$12.00', image: 'images/Cold-Flu-Foot-Soak.jpeg', description:'Eucalyptus & Camphor base for congestion relief. Soak feet/body for 15-30 minutes.', benefits:'Soak \u2022 External Use Only', disclaimer:'External Use Only. Soak body/feet for ONLY 15 minutes - 30 minutes. Discontinue if irritation occurs.', link:'checkout.html' },
    { name:'Lip Balm Vanilla', price:'$3.00', image: 'images/Lip-Balm-Vanilla.jpeg', description:'Moisturizing pure beeswax lip balm with a warm sweet Vanilla scent. Buy any 2 lip balms for $5.00!', benefits:'Lip Balm \u2022 Pure Beeswax', disclaimer:'External Use Only. For lip use only. Discontinue if irritation occurs. Keep away from children under 3.', link:'checkout.html' },
    { name:'Beeswax Starter Wrap Set (S, M, L)', price:'$20.00', image: 'images/ai-generated/Starter-Beeswax-Wraps.jpeg', description:'1 large, 1 medium, 1 small \u2014 hand-cut with decorative edging. Superior cling for bowls, sandwiches, and jars. Prints vary — each wrap is one of a kind!', benefits:'Wrap \u2022 Cold Wash Only', disclaimer:'Care Instructions: Use cold water with a damp cloth and gently wash. Hang to dry.', link:'checkout.html' }
];

// ============================================
//   INFINITE LOOP CAROUSEL — responsive (1 card on mobile, 2 on desktop)
// ============================================
const scrollTrack   = document.getElementById('scroll-track');
const btnLeft       = document.querySelector('.left-btn');
const btnRight      = document.querySelector('.right-btn');
const dotsContainer = document.getElementById('progress-dots');

// How many cards make up one "view". The CSS shows ONE card filling the screen
// at 640px and below, and TWO side-by-side above that. The carousel must step by
// the same amount, or it skips cards on mobile.
function cardsPerView() {
    return window.innerWidth <= 640 ? 1 : 2;
}

let CARDS_PER_VIEW = cardsPerView();
let TOTAL_GROUPS   = Math.ceil(products.length / CARDS_PER_VIEW);
let STEP           = 0;            // real pixel width of one view — measured from the page
let currentIndex   = 0;            // current real group (0 ... TOTAL_GROUPS - 1)
let isTransitioning = false;

// Build a single card element
function createCard(p, i) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${i * 0.08}s`;

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

// Measure the true on-screen width of one view straight from the rendered cards,
// instead of assuming fixed pixels. THIS is the mobile-skip fix: the step now always
// matches whatever the CSS is actually showing (phone, tablet, desktop, rotated).
function measureStep() {
    const cards = scrollTrack.querySelectorAll('.product-card');
    if (cards.length < 2) return 0;
    // Measure the REAL distance from one card to the next, straight from their
    // rendered positions. This already includes the gap, so there's no separate
    // gap value to parse and get wrong — the step is pixel-exact on every browser,
    // which is what stops the scattered card-skipping on iPhone Safari.
    return (cards[1].offsetLeft - cards[0].offsetLeft) * CARDS_PER_VIEW;
}

function buildCards() {
    // Recompute cards-per-view in case the screen size/orientation changed
    CARDS_PER_VIEW = cardsPerView();
    TOTAL_GROUPS   = Math.ceil(products.length / CARDS_PER_VIEW);

    scrollTrack.innerHTML = '';

    // Clone the last group at the front (for backward infinite wrap)
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

    // Clone the first group at the end (for forward infinite wrap)
    for (let i = 0; i < CARDS_PER_VIEW; i++) {
        const clone = createCard(products[i], i);
        clone.setAttribute('data-clone', 'true');
        scrollTrack.appendChild(clone);
    }

    // Measure AFTER the cards exist, then jump to the first real group
    STEP = measureStep();
    if (currentIndex > TOTAL_GROUPS - 1) currentIndex = 0;
    scrollTrack.style.scrollBehavior = 'auto';
    scrollTrack.scrollLeft = (currentIndex + 1) * STEP; // +1 skips the leading clone group
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

    const targetSlot = currentIndex + 1; // +1 to account for the leading clones
    isTransitioning = true;

    const cards = scrollTrack.querySelectorAll('.product-card');
    const targetCard = cards[targetSlot * CARDS_PER_VIEW];
    const targetLeft = targetCard
        ? targetCard.offsetLeft - cards[0].offsetLeft
        : targetSlot * STEP;

    scrollTrack.style.scrollBehavior = 'smooth';
    scrollTrack.scrollTo({ left: targetLeft, behavior: 'smooth' });

    updateDots();

    // Safety net: if 'scrollend' never fires — which can happen when the last
    // group is uneven (product count not divisible by CARDS_PER_VIEW) — force
    // isTransitioning back to false so the arrow buttons never lock up.
    clearTimeout(window.__hhScrollSafety);
    window.__hhScrollSafety = setTimeout(() => {
        if (isTransitioning) handleScrollEnd();
    }, 500);
}

// After the smooth scroll settles, silently jump if we landed on a clone group
function handleScrollEnd() {
    if (!isTransitioning) return;
    isTransitioning = false;

    const cards = scrollTrack.querySelectorAll('.product-card');

    // Measure real clone boundaries straight from the DOM instead of assuming
    // every group is the same pixel width — this is what breaks when the last
    // group has fewer cards than CARDS_PER_VIEW.
    const firstRealLeft    = cards[CARDS_PER_VIEW].offsetLeft - cards[0].offsetLeft;
    const trailingCloneIdx = CARDS_PER_VIEW + products.length;
    const trailingCloneLeft = cards[trailingCloneIdx]
        ? cards[trailingCloneIdx].offsetLeft - cards[0].offsetLeft
        : null;
    const lastRealLeft = cards[TOTAL_GROUPS * CARDS_PER_VIEW]
        ? cards[TOTAL_GROUPS * CARDS_PER_VIEW].offsetLeft - cards[0].offsetLeft
        : null;

    const tolerance = 5; // px, allows for subpixel rounding

    if (scrollTrack.scrollLeft <= tolerance) {
        // Landed on the leading clone → wrap to the last real group
        scrollTrack.style.scrollBehavior = 'auto';
        if (lastRealLeft !== null) scrollTrack.scrollLeft = lastRealLeft;
        currentIndex = TOTAL_GROUPS - 1;
        updateDots();
    } else if (trailingCloneLeft !== null && scrollTrack.scrollLeft >= trailingCloneLeft - tolerance) {
        // Landed on/at the trailing clone → wrap to the first real group
        scrollTrack.style.scrollBehavior = 'auto';
        scrollTrack.scrollLeft = firstRealLeft;
        currentIndex = 0;
        updateDots();
    }
}

// 'scrollend' fires once scrolling fully stops (modern browsers).
scrollTrack.addEventListener('scrollend', handleScrollEnd);
// Fallback for browsers without 'scrollend': watch 'scroll' and wait for a pause.
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

// Rebuild when the screen crosses the mobile/desktop breakpoint (e.g., phone rotation),
// and re-measure on any resize, so the step stays accurate.
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const newCPV = cardsPerView();
        if (newCPV !== CARDS_PER_VIEW) {
            buildCards();
            buildDots();
        } else {
            STEP = measureStep();
            scrollTrack.style.scrollBehavior = 'auto';
            scrollTrack.scrollLeft = (currentIndex + 1) * STEP;
        }
    }, 200);
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