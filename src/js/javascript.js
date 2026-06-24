
const WHATSAPP_NUMBER = '5583999999999';

const PRODUCTS =
    JSON.parse(
        localStorage.getItem("products")
    ) || [];

// ===== STATE =====
let cart = JSON.parse(localStorage.getItem('ts_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('ts_wishlist') || '[]');
let currentSlide = 0;
let heroTimer;
let reviewOffset = 0;
let activeFilter = 'all';
let searchQuery = '';

// ===== UTILS =====
function fmt(v) {
    return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function saveCart() { localStorage.setItem('ts_cart', JSON.stringify(cart)); }
function saveWishlist() { localStorage.setItem('ts_wishlist', JSON.stringify(wishlist)); }

// ===== TOAST =====
function toast(msg, type = 'success') {
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<i class="fas ${icons[type]}"></i><span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 300); }, 3200);
}

// ===== MODAL =====
function showModal(icon, title, body, actions) {
    document.getElementById('modal-icon').textContent = icon;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').textContent = body;
    document.getElementById('modal-actions').innerHTML = actions;
    document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
document.getElementById('modal-overlay').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

// ===== HERO CAROUSEL =====
function goSlide(n) {
    const slides = document.querySelectorAll('.hero-dot');
    currentSlide = (n + 3) % 3;
    document.getElementById('hero-slides').style.transform = `translateX(-${currentSlide * 100}%)`;
    slides.forEach((d, i) => {
        d.classList.toggle('active', i === currentSlide);
        d.setAttribute('aria-selected', i === currentSlide);
    });
}
function startHeroTimer() {
    clearInterval(heroTimer);
    heroTimer = setInterval(() => goSlide(currentSlide + 1), 5500);
}
document.getElementById('hero-prev').addEventListener('click', () => { goSlide(currentSlide - 1); startHeroTimer(); });
document.getElementById('hero-next').addEventListener('click', () => { goSlide(currentSlide + 1); startHeroTimer(); });
document.querySelectorAll('.hero-dot').forEach((d, i) => {
    d.addEventListener('click', () => { goSlide(i); startHeroTimer(); });
});
startHeroTimer();

// ===== DARK MODE =====
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
function setTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    themeIcon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('ts_theme', dark ? 'dark' : 'light');
}
const savedTheme = localStorage.getItem('ts_theme');
if (savedTheme === 'dark') setTheme(true);
themeToggle.addEventListener('click', () => {
    setTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
});

// ===== MOBILE NAV =====
const mobileBtn = document.getElementById('mobile-menu-btn');
const mobileNav = document.getElementById('mobile-nav');
mobileBtn.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    mobileBtn.setAttribute('aria-expanded', open);
});
mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        mobileBtn.setAttribute('aria-expanded', false);
    });
});

// ===== SCROLL EVENTS =====
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    const backTop = document.getElementById('back-top');
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    backTop.classList.toggle('visible', window.scrollY > 400);
});
document.getElementById('back-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== NAV ACTIVE HIGHLIGHT =====
const navSections = ['home', 'produtos', 'sobre', 'avaliacoes', 'faq', 'contato', 'localizacao'];
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
    let cur = navSections[0];
    navSections.forEach(id => {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) cur = id;
    });
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
}, { passive: true });

// ===== STATS COUNTER =====
function animateStats() {
    document.querySelectorAll('.stat-num[data-target]').forEach(el => {
        const target = +el.dataset.target;
        const suffix = el.closest('.stat-item').querySelector('.stat-label').textContent.includes('%') ? '%' : '+';
        let start = 0;
        const step = target / 60;
        const update = () => {
            start = Math.min(start + step, target);
            el.textContent = Math.floor(start).toLocaleString('pt-BR') + suffix;
            if (start < target) requestAnimationFrame(update);
        };
        update();
    });
}
const statsObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { animateStats(); statsObs.disconnect(); }
}, { threshold: .3 });
const statsEl = document.getElementById('stats');
if (statsEl) statsObs.observe(statsEl);

// ===== PRODUCTS =====
function renderProducts() {
    const grid = document.getElementById('products-grid');
    const q = searchQuery.toLowerCase().trim();
    let list = PRODUCTS.filter(p => {
        const catOk = activeFilter === 'all' || p.cat === activeFilter || (activeFilter === 'promocoes' && p.promo);
        const searchOk = !q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
        return catOk && searchOk;
    });
    if (!list.length) {
        grid.innerHTML = '<div class="no-results"><i class="fas fa-search"></i><p>Nenhum produto encontrado.<br>Tente outro termo ou categoria.</p></div>';
        return;
    }
    grid.innerHTML = list.map(p => {
        const inCart = cart.some(c => c.id === p.id);
        const inWish = wishlist.includes(p.id);
        const disc = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
        return `
    <article class="product-card" role="listitem" aria-label="${p.name}">
      <div class="product-img-wrap">
        <div class="product-badges">
          ${p.badge ? `<span class="badge ${p.badgeType}">${p.badge}</span>` : ''}
          ${disc > 0 ? `<span class="badge badge-warning">-${disc}%</span>` : ''}
        </div>
        ${p.image
                ? `<img src="${p.image}" alt="${p.name}" class="product-image" />`
                : `<div class="no-image">Sem imagem</div>`
            }
        <button class="product-wishlist ${inWish ? 'active' : ''}" onclick="toggleWish(${p.id})" aria-label="${inWish ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" title="Favoritos">
          <i class="fa${inWish ? 's' : 'r'} fa-heart"></i>
        </button>
      </div>
      <div class="product-info">
        <div class="product-cat">${p.cat === 'eletronicos' ? 'Eletrônicos' : p.cat === 'informatica' ? 'Informática' : p.cat === 'acessorios' ? 'Acessórios' : 'Promoção'}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-price-row">
          <div>
            ${p.oldPrice ? `<div class="product-price-old">${fmt(p.oldPrice)}</div>` : ''}
            <div class="product-price">${fmt(p.price)}</div>
          </div>
          <div class="product-stars" aria-label="${p.stars} estrelas">${'★'.repeat(p.stars)}${'☆'.repeat(5 - p.stars)}</div>
        </div>
        <button class="btn-add-cart ${inCart ? 'added' : ''}" onclick="addToCart(${p.id})" aria-label="Adicionar ${p.name} ao carrinho">
          <i class="fas ${inCart ? 'fa-check' : 'fa-cart-plus'}" aria-hidden="true"></i>
          ${inCart ? 'Adicionado!' : 'Adicionar ao Carrinho'}
        </button>
      </div>
    </article>`;
    }).join('');
}
renderProducts();

// Category tabs
document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.cat-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', false); });
        tab.classList.add('active'); tab.setAttribute('aria-selected', true);
        activeFilter = tab.dataset.cat;
        renderProducts();
    });
});
window.filterCat = function (cat) {
    activeFilter = cat;
    document.querySelectorAll('.cat-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === cat));
    renderProducts();
    document.getElementById('category-filter').value = cat;
    setTimeout(() => document.getElementById('produtos').scrollIntoView({ behavior: 'smooth' }), 100);
};

// Search
function handleSearch(q) { searchQuery = q; renderProducts(); }
document.getElementById('main-search').addEventListener('input', e => handleSearch(e.target.value));
document.getElementById('nav-search-input').addEventListener('input', e => { handleSearch(e.target.value); if (e.target.value) document.getElementById('produtos').scrollIntoView({ behavior: 'smooth' }); });
document.getElementById('category-filter').addEventListener('change', e => { activeFilter = e.target.value; renderProducts(); });

// ===== WISHLIST =====
window.toggleWish = function (id) {
    const idx = wishlist.indexOf(id);
    if (idx > -1) { wishlist.splice(idx, 1); toast('Removido dos favoritos', 'info'); }
    else { wishlist.push(id); toast('Adicionado aos favoritos ❤️', 'info'); }
    saveWishlist();
    renderProducts();
};

// ===== CART =====
function updateCartCount() {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    const el = document.getElementById('cart-count');
    el.textContent = total;
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 300);
}
function updateCartUI() {
    const container = document.getElementById('cart-items');
    if (!cart.length) {
        container.innerHTML = '<div class="cart-empty"><i class="fas fa-shopping-cart"></i><p>Seu carrinho está vazio.<br>Adicione produtos para continuar.</p></div>';
        document.getElementById('cart-subtotal').textContent = 'R$ 0,00';
        document.getElementById('cart-total').textContent = 'R$ 0,00';
        return;
    }
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    container.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-icon" aria-hidden="true">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${fmt(item.price)}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty(${item.id},-1)" aria-label="Diminuir quantidade de ${item.name}"><i class="fas fa-minus"></i></button>
          <span class="qty-num" aria-label="Quantidade: ${item.qty}">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id},1)" aria-label="Aumentar quantidade de ${item.name}"><i class="fas fa-plus"></i></button>
          <button class="cart-item-remove" onclick="removeFromCart(${item.id})" aria-label="Remover ${item.name} do carrinho"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
    </div>`).join('');
    document.getElementById('cart-subtotal').textContent = fmt(total);
    document.getElementById('cart-total').textContent = fmt(total);
}
window.addToCart = function (id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    const ex = cart.find(c => c.id === id);
    if (ex) { ex.qty++; toast(`+1 ${p.name} no carrinho`, 'success'); }
    else { cart.push({ id: p.id, name: p.name, price: p.price, emoji: p.emoji, qty: 1 }); toast(`${p.name} adicionado!`, 'success'); }
    saveCart(); updateCartCount(); updateCartUI(); renderProducts();
};
window.changeQty = function (id, delta) {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) { cart = cart.filter(c => c.id !== id); toast('Produto removido', 'info'); }
    saveCart(); updateCartCount(); updateCartUI(); renderProducts();
};
window.removeFromCart = function (id) {
    const p = cart.find(c => c.id === id);
    if (p) toast(`${p.name} removido`, 'info');
    cart = cart.filter(c => c.id !== id);
    saveCart(); updateCartCount(); updateCartUI(); renderProducts();
};

// Cart open/close
function openCart() {
    document.getElementById('cart-overlay').classList.add('open');
    document.getElementById('cart-sidebar').classList.add('open');
    document.body.style.overflow = 'hidden';
    updateCartUI();
}
function closeCart() {
    document.getElementById('cart-overlay').classList.remove('open');
    document.getElementById('cart-sidebar').classList.remove('open');
    document.body.style.overflow = '';
}
document.getElementById('cart-btn').addEventListener('click', openCart);
document.getElementById('close-cart').addEventListener('click', closeCart);
document.getElementById('cart-overlay').addEventListener('click', closeCart);

// Checkout via WhatsApp
document.getElementById('btn-checkout').addEventListener('click', () => {
    if (!cart.length) { toast('Adicione produtos ao carrinho primeiro!', 'error'); return; }
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    let msg = 'Olá! Gostaria de fazer o seguinte pedido:\n\n';
    cart.forEach(i => {
        msg += `• ${i.name}\n  Quantidade: ${i.qty} × ${fmt(i.price)} = ${fmt(i.price * i.qty)}\n\n`;
    });
    msg += `💰 *Total do pedido: ${fmt(total)}*\n\nAguardo retorno. Obrigado(a)!`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener');
    closeCart();
    toast('Pedido enviado para o WhatsApp! 🎉', 'success');
});

// Init cart
updateCartCount();
updateCartUI();

// ===== REVIEWS CAROUSEL =====
let revIdx = 0;
const revCards = document.querySelectorAll('.review-card');
const revW = window.innerWidth <= 860 ? 1 : 3;
function updateReviews(dir) {
    revIdx = Math.max(0, Math.min(revIdx + dir, revCards.length - revW));
    document.getElementById('reviews-track').style.transform = `translateX(calc(-${revIdx * (320 + 24)}px))`;
}
document.getElementById('rev-prev').addEventListener('click', () => updateReviews(-1));
document.getElementById('rev-next').addEventListener('click', () => updateReviews(1));

// ===== FAQ =====
document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(i => {
            i.classList.remove('open');
            i.querySelector('.faq-q').setAttribute('aria-expanded', false);
        });
        if (!isOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', true); }
    });
});

// ===== CONTACT FORM =====
document.getElementById('contact-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const nome = document.getElementById('c-nome').value.trim();
    const email = document.getElementById('c-email').value.trim();
    const msg = document.getElementById('c-msg').value.trim();
    if (!nome || !email || !msg) { toast('Preencha todos os campos obrigatórios!', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('E-mail inválido!', 'error'); return; }
    showModal('✅', 'Mensagem Enviada!', `Obrigado, ${nome}! Recebemos sua mensagem e entraremos em contato em breve pelo e-mail ${email}.`, `<button class="btn btn-primary" onclick="closeModal()">Fechar</button>`);
    this.reset();
});

// ===== LAZY LOAD =====
if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { rootMargin: '100px' });
    document.querySelectorAll('.product-card, .review-card, .mvv-card').forEach(el => obs.observe(el));
}

// ===== KEYBOARD NAV =====
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeCart(); closeModal(); }
});

console.log('%c🚀 TechStore', 'color:#FF6B35;font-size:20px;font-weight:bold');
console.log('%cSite desenvolvido com HTML5, CSS3 e JavaScript Vanilla.', 'color:#1A2B4A');