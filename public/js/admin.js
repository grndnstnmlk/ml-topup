const tbody = document.getElementById('orders-body');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const deliveryFilter = document.getElementById('delivery-filter');
const refreshBtn = document.getElementById('refresh-btn');
const countLabel = document.getElementById('admin-count');

const bayarLabel = { paid: 'Paid', pending: 'Pending', failed: 'Failed' };
const deliveryLabel = {
  belum_diproses: 'Belum Diproses',
  diproses: 'Diproses',
  terkirim: 'Terkirim',
  gagal: 'Gagal',
};

function formatRupiah(n) {
  return 'Rp' + Number(n).toLocaleString('id-ID');
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

async function loadOrders() {
  tbody.innerHTML = '<tr><td colspan="9" class="admin-empty">Memuat...</td></tr>';

  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set('q', searchInput.value.trim());
  if (statusFilter.value) params.set('status', statusFilter.value);
  if (deliveryFilter.value) params.set('delivery_status', deliveryFilter.value);

  try {
    const res = await fetch(`/api/admin/orders?${params.toString()}`);
    if (res.status === 401) {
      tbody.innerHTML = '<tr><td colspan="9" class="admin-empty">Login diperlukan. Muat ulang halaman.</td></tr>';
      return;
    }
    const orders = await res.json();
    countLabel.textContent = `${orders.length} order`;

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="admin-empty">Tidak ada order.</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(renderRow).join('');

    tbody.querySelectorAll('[data-retry]').forEach((btn) => {
      btn.addEventListener('click', () => retryOrder(btn.dataset.retry, btn));
    });
    tbody.querySelectorAll('[data-markpaid]').forEach((btn) => {
      btn.addEventListener('click', () => markPaid(btn.dataset.markpaid, btn));
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="9" class="admin-empty">Gagal memuat data.</td></tr>';
  }
}

function renderRow(o) {
  const canRetry = o.status === 'paid' && o.delivery_status !== 'terkirim' && o.digiflazz_sku;
  const canMarkPaid = o.status === 'pending';
  return `
    <tr>
      <td class="mono">${escapeHtml(o.order_id)}</td>
      <td>${escapeHtml(o.product_name)}</td>
      <td class="mono">${escapeHtml(o.game_user_id)} / ${escapeHtml(o.game_zone_id)}</td>
      <td class="mono">${formatRupiah(o.price)}</td>
      <td><span class="admin-pill admin-pill-${o.status}">${bayarLabel[o.status] || o.status}</span></td>
      <td>
        <span class="admin-pill admin-pill-${o.delivery_status}">${deliveryLabel[o.delivery_status] || o.delivery_status}</span>
        ${o.delivery_message ? `<div class="admin-msg">${escapeHtml(o.delivery_message)}</div>` : ''}
      </td>
      <td>${escapeHtml(o.contact) || '—'}</td>
      <td class="mono">${new Date(o.created_at).toLocaleString('id-ID')}</td>
      <td>
        ${canMarkPaid ? `<button type="button" class="admin-retry-btn" data-markpaid="${escapeHtml(o.order_id)}">Tandai Lunas</button>` : ''}
        ${canRetry ? `<button type="button" class="admin-retry-btn" data-retry="${escapeHtml(o.order_id)}">Retry</button>` : ''}
      </td>
    </tr>
  `;
}

async function markPaid(orderId, btn) {
  if (!confirm(`Tandai order ${orderId} sebagai lunas? Diamond akan langsung dikirim.`)) return;

  btn.disabled = true;
  btn.textContent = '...';
  try {
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/mark-paid`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Gagal menandai lunas.');
    }
  } catch (err) {
    alert('Gagal menandai lunas: ' + err.message);
  }
  loadOrders();
}

async function retryOrder(orderId, btn) {
  btn.disabled = true;
  btn.textContent = '...';
  try {
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/retry`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Retry gagal.');
    }
  } catch (err) {
    alert('Retry gagal: ' + err.message);
  }
  loadOrders();
}

refreshBtn.addEventListener('click', loadOrders);
searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadOrders(); });
statusFilter.addEventListener('change', loadOrders);
deliveryFilter.addEventListener('change', loadOrders);

loadOrders();
