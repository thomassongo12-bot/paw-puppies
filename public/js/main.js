const API = '';

// ===== CART HELPERS =====
function getCart() { try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; } }
function saveCart(c) { localStorage.setItem('cart', JSON.stringify(c)); updateCartCount(); }
function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + i.quantity, 0);
  document.querySelectorAll('#cart-count').forEach(el => el.textContent = total);
}
function addToCart(product) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === product.id);
  if (idx > -1) cart[idx].quantity++;
  else cart.push({ ...product, quantity: 1 });
  saveCart(cart);
  showToast(`${product.name} added to cart`, 'success');
  openCartDrawer();
}

// ===== TOAST =====
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ===== SETTINGS =====
let siteSettings = {};
async function loadSettings() {
  try {
    const res = await fetch(`${API}/api/settings`);
    siteSettings = await res.json();
    applySettings(siteSettings);
  } catch (e) {}
}

function applySettings(s) {
  if (s.site_name) {
    document.querySelectorAll('.site-name, #site-name').forEach(el => el.textContent = s.site_name);
    document.querySelectorAll('#footer-site-name').forEach(el => el.textContent = s.site_name);
    document.title = `${s.site_name} - Dog Shop`;
    document.getElementById('page-title') && (document.getElementById('page-title').textContent = `${s.site_name} - Pharmacie en ligne`);
  }
  if (s.site_tagline) {
    document.querySelectorAll('#site-tagline').forEach(el => el.textContent = s.site_tagline);
  }
  if (s.site_description) {
    const el = document.getElementById('footer-description');
    if (el) el.textContent = s.site_description;
  }
  if (s.logo_url) {
    const lc = document.getElementById('logo-container');
    if (lc) lc.innerHTML = `<img src="${s.logo_url}" alt="${s.site_name}" style="height:48px;object-fit:contain">`;
  }
  if (s.favicon_url) {
    const fav = document.getElementById('favicon');
    if (fav) fav.href = s.favicon_url;
  }
  if (s.primary_color) {
    document.documentElement.style.setProperty('--primary', s.primary_color);
    document.documentElement.style.setProperty('--primary-dark', adjustColor(s.primary_color, -20));
    document.documentElement.style.setProperty('--primary-light', hexToRgba(s.primary_color, 0.1));
  }
  if (s.secondary_color) {
    document.documentElement.style.setProperty('--secondary', s.secondary_color);
    document.documentElement.style.setProperty('--secondary-dark', adjustColor(s.secondary_color, -20));
  }
  if (s.contact_phone) {
    document.querySelectorAll('#header-phone').forEach(el => el.textContent = s.contact_phone);
    document.querySelectorAll('#footer-phone').forEach(el => el.textContent = s.contact_phone);
  }
  if (s.contact_email) {
    document.querySelectorAll('#footer-email').forEach(el => el.textContent = s.contact_email);
  }
  if (s.contact_address) {
    document.querySelectorAll('#footer-address').forEach(el => el.textContent = s.contact_address);
  }
  if (s.working_hours) {
    document.querySelectorAll('#footer-hours').forEach(el => el.textContent = s.working_hours);
  }
  if (s.footer_text) {
    document.querySelectorAll('#footer-text').forEach(el => el.textContent = s.footer_text);
  }
  // Social links
  const socialEl = document.getElementById('social-links');
  if (socialEl) {
    let links = '';
    if (s.facebook_url) links += `<a href="${s.facebook_url}" target="_blank" aria-label="Facebook"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>`;
    if (s.instagram_url) links += `<a href="${s.instagram_url}" target="_blank" aria-label="Instagram"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>`;
    if (s.twitter_url) links += `<a href="${s.twitter_url}" target="_blank" aria-label="Twitter/X"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>`;
    if (s.whatsapp_number) links += `<a href="https://wa.me/${s.whatsapp_number}" target="_blank" aria-label="WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg></a>`;
    socialEl.innerHTML = links;
  }
}

// Color helpers
function adjustColor(hex, amount) {
  try {
    let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  } catch { return hex; }
}
function hexToRgba(hex, alpha) {
  try {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch { return hex; }
}

// ===== CURRENCY =====
function formatPrice(amount) {
  const symbol = siteSettings.currency_symbol || '€';
  return `${parseFloat(amount).toFixed(2)} ${symbol}`;
}

// ===== PRODUCT IMAGE =====
function productImage(product) {
  if (product.images && product.images.length > 0) {
    return `<img src="${product.images[0]}" alt="${product.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;font-size:56px\\'>🐶</div>'">`;
  }
  return `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:56px">🐶</div>`;
}

// ===== PRODUCT CARD (homepage featured / sale) =====
function createProductCard(p) {
  const hasDiscount = p.sale_price && p.sale_price < p.price;
  const displayPrice = hasDiscount ? p.sale_price : p.price;
  const discountPct = hasDiscount ? Math.round((1 - p.sale_price / p.price) * 100) : 0;
  const inStock = p.stock > 0;
  const img = p.images && p.images[0] ? p.images[0] : '';
  const cat = (p.category_name || '').replace(/"/g, '\\"');
  const nameSafe = p.name.replace(/'/g, "\\'").replace(/"/g, '\\"');

  let badgeHtml = '';
  if (p.is_featured) badgeHtml = '<span class="badge-sale" style="background:var(--accent)">⭐ Featured</span>';
  else if (hasDiscount) badgeHtml = `<span class="badge-sale">-${discountPct}%</span>`;

  return `
  <div class="product-card" onclick="location.href='/product.html?id=${p.id}'">
    <div class="product-img">
      ${productImage(p)}
      ${badgeHtml}
      <div class="product-actions" onclick="event.stopPropagation()">
        <button class="product-action-btn" title="Enquire"
          onclick='addToCart({id:${p.id},name:"${nameSafe}",price:${displayPrice},image:"${img}",category:"${cat}"})'
          ${!inStock ? 'disabled' : ''}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </button>
        <button class="product-action-btn" title="View"
          onclick="location.href='/product.html?id=${p.id}'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="product-action-btn" title="Wishlist"
          onclick="addToWishlist(${p.id},'${p.name.replace(/'/g,"\\'")}')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
    </div>
    <div class="product-info">
      <div class="product-name">${p.name}</div>
      ${p.brand ? `<div style="font-size:11px;color:var(--text-light);margin-bottom:4px">${p.brand}${p.dosage ? ' · ' + p.dosage : ''}</div>` : ''}
      <div class="product-price">
        <span class="price-current">${formatPrice(displayPrice)}</span>
        ${hasDiscount ? `<span class="price-old">${formatPrice(p.price)}</span>` : ''}
      </div>
      <button class="add-to-cart" ${!inStock ? 'disabled' : ''}
        onclick="event.stopPropagation(); addToCart({id:${p.id},name:'${p.name.replace(/'/g,"\\'")}',price:${displayPrice},image:'${img}',category:'${(p.category_name||'').replace(/'/g,"\\'")}'})"
      >${inStock ? 'Enquire Now' : 'Unavailable'}</button>
    </div>
  </div>`;
}

// ===== LOAD CATEGORIES =====
async function loadCategories() {
  try {
    const res = await fetch(`${API}/api/categories`);
    const cats = await res.json();

    const grid = document.getElementById('categories-grid');
    if (grid) {
      // Dog emoji map by slug
      const emojiMap = {
        'dry-food':'🍖','wet-food':'🥩','treats':'🦴','toys':'🎾',
        'health':'💊','grooming':'✂️','collars-leashes':'🐕',
        'beds':'🛏️','travel':'🚗','clothing':'👕','bowls':'🥣','training':'🎯'
      };
      grid.innerHTML = cats.map(c => `
        <div class="cat-card" onclick="location.href='/shop.html?category=${c.slug}'">
          <div class="cat-icon" style="font-size:32px">${emojiMap[c.slug] || '🐾'}</div>
          <h3>${c.name}</h3>
          <span>${c.product_count || 0} listing(s)</span>
        </div>
      `).join('');
    }

    // Nav dropdown
    const navCats = document.getElementById('nav-categories');
    if (navCats) {
      navCats.innerHTML = cats.map(c => `<a href="/shop.html?category=${c.slug}">${c.name}</a>`).join('');
    }
  } catch (e) { console.error(e); }
}

// ===== LOAD FEATURED PRODUCTS =====
async function loadFeaturedProducts() {
  const grid = document.getElementById('featured-products');
  if (!grid) return;
  try {
    const res = await fetch(`${API}/api/products?featured=1&limit=8`);
    const data = await res.json();
    grid.innerHTML = data.products.length ? data.products.map(createProductCard).join('') : '<div class="empty-state"><div class="empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg></div><h3>No featured products</h3></div>';
  } catch (e) { grid.innerHTML = '<p style="color:red">Erreur de chargement</p>'; }
}

// ===== LOAD SALE PRODUCTS =====
async function loadSaleProducts() {
  const grid = document.getElementById('sale-products');
  if (!grid) return;
  try {
    const res = await fetch(`${API}/api/products?limit=4`);
    const data = await res.json();
    const sale = data.products.filter(p => p.sale_price);
    grid.innerHTML = sale.length ? sale.map(createProductCard).join('') : '';
    if (!sale.length) document.querySelector('.section:has(#sale-products)') && (document.querySelector('.section:has(#sale-products)').style.display = 'none');
  } catch {}
}

// ===== WISHLIST =====
function addToWishlist(id, name) {
  let wl = [];
  try { wl = JSON.parse(localStorage.getItem('wishlist') || '[]'); } catch {}
  if (!wl.includes(id)) {
    wl.push(id);
    localStorage.setItem('wishlist', JSON.stringify(wl));
    showToast(`${name} added to wishlist`);
  } else {
    showToast(`${name} is already in your wishlist`);
  }
}

// ===== NAV DROPDOWN (Our Services) =====
function toggleNavDropdown(e, triggerEl) {
  e.preventDefault();
  e.stopPropagation();
  const dropdown = triggerEl
    ? triggerEl.closest('.nav-dropdown')
    : e.currentTarget.closest('.nav-dropdown');
  const isOpen = dropdown.classList.contains('open');
  document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
  if (!isOpen) dropdown.classList.add('open');
}
// Close when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
});

// Mark the dropdown toggle as active if current page is one of its children
(function() {
  const current = window.location.pathname;
  const servicePages = ['/about.html', '/contact.html', '/shipping.html'];
  if (servicePages.some(p => current === p || current.endsWith(p))) {
    document.querySelectorAll('.nav-dropdown-toggle').forEach(el => {
      el.classList.add('active-parent');
    });
    // Also open briefly to show which section is active
    document.querySelectorAll('.nav-dropdown').forEach(d => {
      // find the link that matches
      const match = d.querySelector(`.nav-dropdown-menu a[href="${current}"]`);
      if (match) match.style.fontWeight = '700';
    });
  }
})();

// ===== SEARCH =====
function doSearch() {
  const q = document.getElementById('search-input')?.value.trim();
  if (q) location.href = `/shop.html?search=${encodeURIComponent(q)}`;
}
document.getElementById('search-input')?.addEventListener('keypress', e => e.key === 'Enter' && doSearch());

// ===== INIT =====
updateCartCount();
loadSettings();
loadCategories();
loadFeaturedProducts();
loadSaleProducts();

// ===== HAMBURGER MENU (DRAWER LATÉRAL) =====
(function() {
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  if (!toggle || !links) return;

  // Sur mobile : sortir nav-links du .nav et l'attacher au body
  // pour qu'il reste visible même quand .nav est display:none
  function detachNavLinks() {
    if (window.innerWidth <= 768 && links.parentElement !== document.body) {
      document.body.appendChild(links);
    } else if (window.innerWidth > 768 && links.parentElement === document.body) {
      // Remettre nav-links dans son container d'origine au resize desktop
      const navContainer = document.querySelector('.nav .container');
      if (navContainer) navContainer.appendChild(links);
    }
  }
  detachNavLinks();
  window.addEventListener('resize', detachNavLinks);

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  document.body.appendChild(overlay);

  // Sur mobile : injecter un hamburger dans header-main
  function injectMobileToggle() {
    if (window.innerWidth > 768) return;
    if (document.getElementById('nav-toggle-mobile')) return;
    const container = document.querySelector('.header-main .container');
    if (!container) return;
    const btn = document.createElement('button');
    btn.id = 'nav-toggle-mobile';
    btn.className = 'nav-toggle-mobile';
    btn.setAttribute('aria-label', 'Menu');
    btn.innerHTML = '<span></span><span></span><span></span>';
    container.insertBefore(btn, container.firstChild);
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      links.classList.contains('open') ? closeDrawer() : openDrawer();
    });
  }

  function openDrawer() {
    const mobileBtn = document.getElementById('nav-toggle-mobile');
    if (mobileBtn) mobileBtn.classList.add('open');
    links.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    const mobileBtn = document.getElementById('nav-toggle-mobile');
    if (mobileBtn) mobileBtn.classList.remove('open');
    links.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', function(e) {
    e.stopPropagation();
    links.classList.contains('open') ? closeDrawer() : openDrawer();
  });

  const closeBtn = document.getElementById('drawer-close');
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  links.addEventListener('click', function(e) {
    e.stopPropagation();
  });

  overlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeDrawer();
  });

  injectMobileToggle();
  window.addEventListener('resize', injectMobileToggle);
})();

// ===== DROPDOWN TOGGLE (mobile) =====
function toggleDropdown(e) {
  if (window.innerWidth > 768) return;
  e.preventDefault();
  e.stopPropagation();
  const dropdown = document.getElementById('nav-dropdown');
  if (dropdown) dropdown.classList.toggle('open');
}

// ===== CART DRAWER — disabled (reservation flow used instead) =====
function openCartDrawer() {}
function closeCartDrawer() {}
function renderCartDrawer() {}
function drawerUpdateQty() {}
function drawerRemoveItem() {}
