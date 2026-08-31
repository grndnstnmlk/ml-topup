const tbody = document.getElementById('orders-body');
const cardsContainer = document.getElementById('orders-cards');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const deliveryFilter = document.getElementById('delivery-filter');
const refreshBtn = document.getElementById('refresh-btn');
const countLabel = document.getElementById('admin-count');
const quickFilterPills = document.getElementById('quick-filter-pills');

// Stat Elements
const statRevenue = document.getElementById('stat-revenue');
const statPending = document.getElementById('stat-pending');
const statDelivered = document.getElementById('stat-delivered');
const statFailed = document.getElementById('stat-failed');

const statPendingCard = document.getElementById('stat-pending-card');
const statPaidCard = document.getElementById('stat-paid-card');
const statFailedCard = document.getElementById('stat-failed-card');

const bayarLabel = { 
  paid: 'Paid (Lunas)', 
  pending: 'Pending Bayar', 
  failed: 'Gagal' 
};

const deliveryLabel = {
  belum_diproses: 'Belum Diproses',
  diproses: 'Diproses',
  terkirim: 'Terkirim',
  gagal: 'Gagal',
};

// Toast notification helper
function showToast(message, type = 'info') {
  let container = document.getElementById('admin-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'admin-toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bg = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#0284c7';
  toast.style.cssText = `
    background: #0d1322;
    color: #fff;
    border: 1px solid ${bg};
    box-shadow: 0 4px 14px rgba(0,0,0,0.5), 0 0 10px ${bg}44;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    pointer-events: auto;
    animation: toastSlideIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 360px;
  `;
  toast.innerHTML = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function formatRupiah(n) {
  return 'Rp' + Number(n).toLocaleString('id-ID');
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function updateStats(orders) {
  let revenue = 0;
  let pendingCount = 0;
  let deliveredCount = 0;
  let failedCount = 0;

  orders.forEach((o) => {
    if (o.status === 'paid') {
      revenue += Number(o.price) || 0;
    }
    if (o.status === 'pending') {
      pendingCount++;
    }
    if (o.delivery_status === 'terkirim') {
      deliveredCount++;
    }
    if (o.delivery_status === 'gagal' || o.status === 'failed') {
      failedCount++;
    }
  });

  if (statRevenue) statRevenue.textContent = formatRupiah(revenue);
  if (statPending) statPending.textContent = pendingCount;
  if (statDelivered) statDelivered.textContent = deliveredCount;
  if (statFailed) statFailed.textContent = failedCount;
}

let isFetching = false;

// loadOrders dengan dukungan silent mode (tanpa kedip/tanpa reload layar)
async function loadOrders(silent = false) {
  if (isFetching) return;
  isFetching = true;

  if (!silent) {
    if (tbody && (!tbody.children.length || tbody.innerHTML.includes('admin-empty'))) {
      tbody.innerHTML = '<tr><td colspan="9" class="admin-empty">Memuat data pesanan…</td></tr>';
    }
    if (cardsContainer && (!cardsContainer.children.length || cardsContainer.innerHTML.includes('admin-empty'))) {
      cardsContainer.innerHTML = '<p class="admin-empty">Memuat data pesanan…</p>';
    }
  }

  const params = new URLSearchParams();
  if (searchInput && searchInput.value.trim()) params.set('q', searchInput.value.trim());
  if (statusFilter && statusFilter.value) params.set('status', statusFilter.value);
  if (deliveryFilter && deliveryFilter.value) params.set('delivery_status', deliveryFilter.value);

  try {
    const res = await fetch(`/api/admin/orders?${params.toString()}`);
    if (res.status === 401) {
      const msg = '<tr><td colspan="9" class="admin-empty">Login diperlukan. Muat ulang halaman untuk login.</td></tr>';
      tbody.innerHTML = msg;
      if (cardsContainer) cardsContainer.innerHTML = '<p class="admin-empty">Login diperlukan.</p>';
      return;
    }

    const orders = await res.json();
    if (countLabel) countLabel.textContent = `Menampilkan ${orders.length} pesanan`;
    updateStats(orders);

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="admin-empty">Tidak ada pesanan yang sesuai dengan filter.</td></tr>';
      if (cardsContainer) cardsContainer.innerHTML = '<p class="admin-empty">Tidak ada pesanan.</p>';
      return;
    }

    // Render Desktop Table & Mobile Cards seamlessly
    tbody.innerHTML = orders.map(renderRow).join('');
    if (cardsContainer) {
      cardsContainer.innerHTML = orders.map(renderMobileCard).join('');
    }

    // Bind event listeners
    bindOrderEvents();

  } catch (err) {
    if (!silent) {
      tbody.innerHTML = '<tr><td colspan="9" class="admin-empty">Gagal memuat data dari server.</td></tr>';
      if (cardsContainer) cardsContainer.innerHTML = '<p class="admin-empty">Gagal memuat data.</p>';
    }
  } finally {
    isFetching = false;
  }
}

function bindOrderEvents() {
  document.querySelectorAll('[data-retry]').forEach((btn) => {
    btn.onclick = () => retryOrder(btn.dataset.retry, btn);
  });
  document.querySelectorAll('[data-markpaid]').forEach((btn) => {
    btn.onclick = () => markPaid(btn.dataset.markpaid, btn);
  });
  document.querySelectorAll('[data-markdelivered]').forEach((btn) => {
    btn.onclick = () => markDelivered(btn.dataset.markdelivered, btn);
  });
  document.querySelectorAll('[data-copy-id]').forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.copyId;
      try {
        await navigator.clipboard.writeText(id);
        const orig = btn.innerHTML;
        btn.innerHTML = '✓ Tersalin!';
        setTimeout(() => (btn.innerHTML = orig), 1500);
      } catch {}
    };
  });
}

// DESKTOP ROW
function renderRow(o) {
  const canRetry = o.status === 'paid' && o.delivery_status !== 'terkirim' && o.digiflazz_sku;
  const canMarkPaid = o.status === 'pending';
  const canMarkDelivered = o.delivery_status !== 'terkirim';

  return `
    <tr>
      <td class="mono">
        <strong style="color:var(--cyan); cursor:pointer;" data-copy-id="${escapeHtml(o.order_id)}" title="Klik untuk salin">
          ${escapeHtml(o.order_id)}
        </strong>
      </td>
      <td><strong>${escapeHtml(o.product_name)}</strong></td>
      <td class="mono">${escapeHtml(o.game_user_id)} (${escapeHtml(o.game_zone_id || '-')})</td>
      <td class="mono" style="color:var(--cyan); font-weight:700;">${formatRupiah(o.price)}</td>
      <td><span class="admin-pill admin-pill-${o.status}">● ${bayarLabel[o.status] || o.status}</span></td>
      <td>
        <span class="admin-pill admin-pill-${o.delivery_status}">● ${deliveryLabel[o.delivery_status] || o.delivery_status}</span>
        ${o.delivery_sn ? `<div class="admin-sn-text">SN: ${escapeHtml(o.delivery_sn)}</div>` : ''}
        ${o.delivery_message ? `<div class="admin-msg">${escapeHtml(o.delivery_message)}</div>` : ''}
      </td>
      <td style="font-size:0.8rem;">${escapeHtml(o.contact) || '—'}</td>
      <td class="mono" style="font-size:0.75rem; color:var(--text-muted);">${new Date(o.created_at).toLocaleString('id-ID')}</td>
      <td>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${canMarkPaid ? `<button type="button" class="admin-btn-markpaid" data-markpaid="${escapeHtml(o.order_id)}" title="Tandai lunas & kirim otomatis">⚡ Lunas & Kirim</button>` : ''}
          ${canMarkDelivered ? `<button type="button" class="admin-btn-markdelivered" data-markdelivered="${escapeHtml(o.order_id)}" style="background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.4); color:#34d399; font-size:0.75rem; padding:4px 8px; border-radius:6px; cursor:pointer; font-weight:600;" title="Input SN & Tandai Terkirim Manual">✓ Input SN</button>` : ''}
          ${canRetry ? `<button type="button" class="admin-btn-retry" data-retry="${escapeHtml(o.order_id)}">🔄 Retry</button>` : ''}
          <a href="/status.html?order_id=${encodeURIComponent(o.order_id)}" target="_blank" class="admin-btn-view" title="Buka invoice publik">👁️</a>
        </div>
      </td>
    </tr>
  `;
}

// MOBILE CARD
function renderMobileCard(o) {
  const canRetry = o.status === 'paid' && o.delivery_status !== 'terkirim' && o.digiflazz_sku;
  const canMarkPaid = o.status === 'pending';
  const canMarkDelivered = o.delivery_status !== 'terkirim';

  return `
    <div class="admin-order-card">
      <div class="admin-card-header">
        <div class="admin-card-order-id" data-copy-id="${escapeHtml(o.order_id)}">
          <span>${escapeHtml(o.order_id)}</span>
          <span style="font-size:0.7rem; color:var(--cyan);">📋 Salin</span>
        </div>
        <span class="admin-pill admin-pill-${o.status}">● ${bayarLabel[o.status] || o.status}</span>
      </div>

      <div class="admin-card-product">
        <div>
          <div class="admin-card-title">${escapeHtml(o.product_name)}</div>
          <div class="admin-card-account">ID: <strong>${escapeHtml(o.game_user_id)}</strong> (${escapeHtml(o.game_zone_id || '-')})</div>
        </div>
        <div class="admin-card-price">${formatRupiah(o.price)}</div>
      </div>

      <div class="admin-card-meta">
        <div class="admin-card-row">
          <span>Status Kirim</span>
          <span class="admin-pill admin-pill-${o.delivery_status}">● ${deliveryLabel[o.delivery_status] || o.delivery_status}</span>
        </div>
        ${o.delivery_sn ? `
          <div class="admin-card-sn">
            <span>SN Resmi:</span> <strong>${escapeHtml(o.delivery_sn)}</strong>
          </div>
        ` : ''}
        ${o.delivery_message ? `
          <div class="admin-msg" style="margin-top:4px;">${escapeHtml(o.delivery_message)}</div>
        ` : ''}
        <div class="admin-card-row" style="margin-top:6px; font-size:0.75rem; color:var(--text-muted);">
          <span>Kontak: ${escapeHtml(o.contact) || '—'}</span>
          <span>${new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div class="admin-card-actions">
        ${canMarkPaid ? `
          <button type="button" class="admin-btn-markpaid full-width" data-markpaid="${escapeHtml(o.order_id)}">
            ⚡ Konfirmasi Lunas &amp; Kirim Otomatis
          </button>
        ` : ''}
        ${canMarkDelivered ? `
          <button type="button" class="admin-btn-markdelivered full-width" data-markdelivered="${escapeHtml(o.order_id)}" style="background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.4); color:#34d399; padding:8px; border-radius:8px; font-weight:700; cursor:pointer; margin-top:4px;">
            ✓ Input SN &amp; Tandai Terkirim Manual
          </button>
        ` : ''}
        ${canRetry ? `
          <button type="button" class="admin-btn-retry full-width" data-retry="${escapeHtml(o.order_id)}">
            🔄 Retry Pengiriman Digiflazz
          </button>
        ` : ''}
        <a href="/status.html?order_id=${encodeURIComponent(o.order_id)}" target="_blank" class="admin-btn-view-mobile">
          👁️ Buka Invoice Publik
        </a>
      </div>
    </div>
  `;
}

// Handler Tandai Lunas dengan live polling instan
async function markPaid(orderId, btn) {
  if (!confirm(`Konfirmasi pembayaran Order ${orderId} sebagai LUNAS?\n\nSistem akan otomatis mengeksekusi pengiriman diamond via Digiflazz secara instan.`)) return;

  btn.disabled = true;
  const origText = btn.innerHTML;
  btn.innerHTML = '⏳ Memproses Digiflazz…';

  try {
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/mark-paid`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      showToast('❌ ' + (data.error || 'Gagal menandai lunas.'), 'error');
    } else {
      showToast('⚡ Pembayaran dikonfirmasi! Sedang memproses pengiriman Digiflazz…', 'success');
      // Jalankan update instan tanpa refresh
      await loadOrders(true);
      
      // Auto-poll intensif setiap 2.5 detik selama 20 detik untuk menangkap SN Digiflazz secara live
      let pollCount = 0;
      const pollTimer = setInterval(async () => {
        pollCount++;
        await loadOrders(true);
        if (pollCount >= 8) clearInterval(pollTimer);
      }, 2500);
    }
  } catch (err) {
    showToast('❌ Gagal menandai lunas: ' + err.message, 'error');
  } finally {
    await loadOrders(true);
  }
}

async function markDelivered(orderId, btn) {
  const sn = prompt(`Masukkan Nomor Seri (SN) bukti pengiriman resmi untuk Order ${orderId}:\n\n(Kosongkan jika ingin generate kode otomatis)`);
  if (sn === null) return;

  btn.disabled = true;
  btn.innerHTML = '⏳ Menyimpan…';

  try {
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/mark-delivered`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sn: sn.trim() || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('❌ ' + (data.error || 'Gagal menandai terkirim.'), 'error');
    } else {
      showToast(`✓ Sukses! Order ${orderId} ditandai TERKIRIM (SN: ${data.sn})`, 'success');
    }
  } catch (err) {
    showToast('❌ Gagal: ' + err.message, 'error');
  } finally {
    await loadOrders(true);
  }
}

async function retryOrder(orderId, btn) {
  if (!confirm(`Kirim ulang diamond untuk Order ${orderId} ke Digiflazz?`)) return;

  btn.disabled = true;
  btn.innerHTML = '⏳ Mengirim…';

  try {
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/retry`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      showToast('❌ ' + (data.error || 'Retry gagal.'), 'error');
    } else {
      showToast(`⚡ Sukses kirim ulang! Status: ${data.status}`, 'success');
      
      // Auto-poll untuk update status real-time
      let pollCount = 0;
      const pollTimer = setInterval(async () => {
        pollCount++;
        await loadOrders(true);
        if (pollCount >= 6) clearInterval(pollTimer);
      }, 2500);
    }
  } catch (err) {
    showToast('❌ Retry gagal: ' + err.message, 'error');
  } finally {
    await loadOrders(true);
  }
}

// Quick Filter Pill Buttons
if (quickFilterPills) {
  quickFilterPills.querySelectorAll('.admin-pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      quickFilterPills.querySelectorAll('.admin-pill-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const filter = btn.dataset.filter;
      if (filter === 'all') {
        statusFilter.value = '';
        deliveryFilter.value = '';
      } else if (filter === 'pending') {
        statusFilter.value = 'pending';
        deliveryFilter.value = '';
      } else if (filter === 'paid') {
        statusFilter.value = 'paid';
        deliveryFilter.value = '';
      } else if (filter === 'failed') {
        statusFilter.value = '';
        deliveryFilter.value = 'gagal';
      }
      loadOrders(true);
    });
  });
}

// Stat Card Click Filters
if (statPendingCard) {
  statPendingCard.addEventListener('click', () => {
    statusFilter.value = 'pending';
    deliveryFilter.value = '';
    loadOrders(true);
  });
}
if (statPaidCard) {
  statPaidCard.addEventListener('click', () => {
    statusFilter.value = 'paid';
    deliveryFilter.value = '';
    loadOrders(true);
  });
}
if (statFailedCard) {
  statFailedCard.addEventListener('click', () => {
    statusFilter.value = '';
    deliveryFilter.value = 'gagal';
    loadOrders(true);
  });
}

if (refreshBtn) refreshBtn.addEventListener('click', () => loadOrders(false));
if (searchInput) {
  searchInput.addEventListener('input', () => {
    clearTimeout(window.searchTimer);
    window.searchTimer = setTimeout(() => loadOrders(true), 400);
  });
}
if (statusFilter) statusFilter.addEventListener('change', () => loadOrders(true));
if (deliveryFilter) deliveryFilter.addEventListener('change', () => loadOrders(true));

// Load Server Outbound IP for Digiflazz Whitelist
async function loadServerIp() {
  const ipText = document.getElementById('server-ip-text');
  const ipBadge = document.getElementById('server-ip-badge');
  if (!ipText) return;

  try {
    const res = await fetch('/api/admin/my-ip');
    const data = await res.json();
    if (data && data.ip) {
      ipText.textContent = data.ip;
      if (ipBadge) {
        ipBadge.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(data.ip);
            ipText.textContent = '✓ Tersalin!';
            setTimeout(() => (ipText.textContent = data.ip), 1500);
          } catch {
            prompt('Salin IP server berikut untuk Whitelist Digiflazz:', data.ip);
          }
        });
      }
    } else {
      ipText.textContent = 'Gagal';
    }
  } catch {
    ipText.textContent = 'Offline';
  }
}

// Load pertama kali
loadServerIp();
loadOrders(false);

// AUTO-POLLING REAL-TIME (Tiap 4 detik background polling tanpa kedip)
setInterval(() => {
  // Hanya polling jika tab sedang aktif / dibuka admin
  if (!document.hidden) {
    loadOrders(true);
  }
}, 4000);
