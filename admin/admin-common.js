// ===== ADMIN COMMON FUNCTIONS =====
const API = '';

// SVG icon helper
const ICONS = {
  dashboard: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  products:  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>`,
  categories:`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  orders:    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  settings:  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  users:     `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  site:      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  logout:    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  user:      `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  plus:      `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  pill:      `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>`,
};

// Auth check
function getToken() { return localStorage.getItem('admin_token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('admin_user')); } catch { return null; } }

async function requireAuth() {
  const token = getToken();
  if (!token) { location.href = '/login.html'; return false; }
  try {
    const res = await fetch('/api/auth/verify', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!data.valid) { logout(); return false; }
    const user = getUser();
    document.querySelectorAll('.admin-user-name').forEach(el => el.textContent = user?.username || 'Admin');
    return true;
  } catch { logout(); return false; }
}

function logout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  location.href = '/login.html';
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

// ===== SIDEBAR RESPONSIVE TOGGLE =====
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // Inject overlay if not present
  if (!document.getElementById('sidebar-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.className = 'sidebar-overlay';
    overlay.addEventListener('click', closeSidebar);
    document.body.appendChild(overlay);
  }

  // Inject close button inside sidebar if not present
  if (!sidebar.querySelector('.sidebar-close')) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'sidebar-close';
    closeBtn.setAttribute('aria-label', 'Fermer le menu');
    closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    closeBtn.addEventListener('click', closeSidebar);
    sidebar.insertBefore(closeBtn, sidebar.firstChild);
  }

  // Wire hamburger toggle
  const toggleBtn = document.getElementById('sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
  }

  // Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeSidebar();
  });

  // Auto-set active nav item
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/admin';
  sidebar.querySelectorAll('.nav-item[data-href]').forEach(el => {
    const href = el.getAttribute('data-href').replace(/\/$/, '') || '/admin';
    el.classList.toggle('active', href === currentPath);
  });
}

function openSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('sidebar-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// Init sidebar immediately on DOM ready — no need to wait for auth
document.addEventListener('DOMContentLoaded', function() {
  initSidebar();
});

// Toast notifications
function showToast(msg, type = '') {
  let t = document.getElementById('admin-toast');
  if (!t) { t = document.createElement('div'); t.id = 'admin-toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

// Modal helpers
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Format price
function formatPrice(v) { return parseFloat(v || 0).toFixed(2) + ' €'; }

// Format date
function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Status badge
function statusBadge(status) {
  const map = {
    pending:    ['En attente',  'badge-yellow'],
    processing: ['En cours',    'badge-blue'],
    shipped:    ['Expédié',     'badge-blue'],
    delivered:  ['Livré',       'badge-green'],
    cancelled:  ['Annulé',      'badge-red']
  };
  const [label, cls] = map[status] || [status, 'badge-gray'];
  return `<span class="badge ${cls}">${label}</span>`;
}

// Confirm delete
function confirmDelete(msg) { return confirm(msg || 'Êtes-vous sûr de vouloir supprimer cet élément ?'); }

// Pagination renderer
function renderPagination(containerId, totalPages, currentPage, callback) {
  const el = document.getElementById(containerId);
  if (!el || totalPages <= 1) { if (el) el.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline'}" onclick="(${callback})(${i})">${i}</button>`;
  }
  el.innerHTML = html;
}

// Upload file helper
async function uploadFile(file, endpoint) {
  const form = new FormData();
  const fieldName = endpoint.includes('logo') ? 'logo' : endpoint.includes('favicon') ? 'favicon' : 'image';
  form.append(fieldName, file);
  const res = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: form });
  return res.json();
}

// Load site name from settings for sidebar
async function loadSidebarBranding() {
  try {
    const s = await fetch('/api/settings').then(r => r.json());
    document.querySelectorAll('.sidebar-site-name').forEach(el => el.textContent = s.site_name || 'MediShop');
    document.querySelectorAll('.sidebar-logo-img').forEach(el => {
      if (s.logo_url) { el.src = s.logo_url; el.style.display = 'block'; }
    });
  } catch {}
}

// Load unread messages count badge in sidebar
async function loadUnreadBadge() {
  try {
    const token = getToken();
    if (!token) return;
    const res = await fetch('/api/messages?limit=1', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const data = await res.json();
    const badge = document.getElementById('sidebar-unread-badge');
    if (badge) {
      if (data.unreadCount > 0) {
        badge.textContent = data.unreadCount;
        badge.style.display = 'inline';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch {}
}


// Auth check
function getToken() { return localStorage.getItem('admin_token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('admin_user')); } catch { return null; } }

async function requireAuth() {
  const token = getToken();
  if (!token) { location.href = '/login.html'; return false; }
  try {
    const res = await fetch('/api/auth/verify', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!data.valid) { logout(); return false; }
    const user = getUser();
    document.querySelectorAll('.admin-user-name').forEach(el => el.textContent = user?.username || 'Admin');
    return true;
  } catch { logout(); return false; }
}

function logout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  location.href = '/login.html';
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

// Toast notifications
function showToast(msg, type = '') {
  let t = document.getElementById('admin-toast');
  if (!t) { t = document.createElement('div'); t.id = 'admin-toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

// Modal helpers
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Format price
function formatPrice(v) { return parseFloat(v || 0).toFixed(2) + ' €'; }

// Format date
function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Status badge
function statusBadge(status) {
  const map = {
    pending: ['En attente', 'badge-yellow'],
    processing: ['En cours', 'badge-blue'],
    shipped: ['Expédié', 'badge-blue'],
    delivered: ['Livré', 'badge-green'],
    cancelled: ['Annulé', 'badge-red']
  };
  const [label, cls] = map[status] || [status, 'badge-gray'];
  return `<span class="badge ${cls}">${label}</span>`;
}

// Confirm delete
function confirmDelete(msg) { return confirm(msg || 'Êtes-vous sûr de vouloir supprimer cet élément ?'); }

// Pagination renderer
function renderPagination(containerId, totalPages, currentPage, callback) {
  const el = document.getElementById(containerId);
  if (!el || totalPages <= 1) { if (el) el.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline'}" onclick="(${callback})(${i})">${i}</button>`;
  }
  el.innerHTML = html;
}

// Sidebar active state
function setActiveSidebarItem(href) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-href') === href);
  });
}

// Upload file helper
async function uploadFile(file, endpoint) {
  const form = new FormData();
  const fieldName = endpoint.includes('logo') ? 'logo' : endpoint.includes('favicon') ? 'favicon' : 'image';
  form.append(fieldName, file);
  const res = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: form });
  return res.json();
}

// Load site name from settings for sidebar
async function loadSidebarBranding() {
  try {
    const s = await fetch('/api/settings').then(r => r.json());
    document.querySelectorAll('.sidebar-site-name').forEach(el => el.textContent = s.site_name || 'MediShop');
    document.querySelectorAll('.sidebar-logo-img').forEach(el => {
      if (s.logo_url) { el.src = s.logo_url; el.style.display = 'block'; }
    });
  } catch {}
}
