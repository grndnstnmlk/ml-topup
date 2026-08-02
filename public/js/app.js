(function () {
  const productGrid = document.getElementById('product-grid');
  const form = document.getElementById('order-form');
  const payButton = document.getElementById('pay-button');
  const payLabel = document.getElementById('pay-button-label');
  const errorText = document.getElementById('form-error');

  let selectedProductId = null;
  let products = [];

  const diamondIcon = `
    <svg class="product-diamond" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 9L12 3L20 9L12 21L4 9Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M4 9H20M8.5 9L12 3L15.5 9M8.5 9L12 21M15.5 9L12 21" stroke="currentColor" stroke-width="1" opacity="0.5"/>
    </svg>
  `;

  function formatRupiah(n) {
    return 'Rp' + n.toLocaleString('id-ID');
  }

  function renderProducts() {
    if (!products.length) {
      productGrid.innerHTML = '<p class="loading-text">Paket tidak tersedia saat ini.</p>';
      return;
    }

    productGrid.innerHTML = products
      .map((p) => {
        const bonusLabel = p.bonus > 0 ? `+${p.bonus} bonus` : (p.diamonds === 0 ? 'Pass' : '&nbsp;');
        return `
        <button type="button" class="product-card" data-id="${p.id}" style="color: var(--text-primary)">
          ${p.is_popular ? '<span class="badge">POPULER</span>' : ''}
          ${diamondIcon}
          <div class="product-name">${p.diamonds > 0 ? p.diamonds : p.name}</div>
          <div class="product-bonus">${bonusLabel}</div>
          <div class="product-price">${formatRupiah(p.price)}</div>
        </button>
      `;
      })
      .join('');

    productGrid.querySelectorAll('.product-card').forEach((card) => {
      card.addEventListener('click', () => selectProduct(Number(card.dataset.id)));
    });
  }

  function selectProduct(id) {
    selectedProductId = id;
    productGrid.querySelectorAll('.product-card').forEach((card) => {
      card.classList.toggle('is-selected', Number(card.dataset.id) === id);
    });
    const product = products.find((p) => p.id === id);
    payButton.disabled = false;
    payLabel.textContent = `Bayar ${formatRupiah(product.price)}`;
  }

  async function loadProducts() {
    try {
      const res = await fetch('/api/products');
      products = await res.json();
      renderProducts();
    } catch (err) {
      productGrid.innerHTML = '<p class="loading-text">Gagal memuat paket. Refresh halaman.</p>';
    }
  }

  function showError(message) {
    errorText.textContent = message;
    errorText.hidden = false;
  }

  function clearError() {
    errorText.hidden = true;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const game_user_id = document.getElementById('game_user_id').value.trim();
    const game_zone_id = document.getElementById('game_zone_id').value.trim();
    const contact = document.getElementById('contact').value.trim();

    if (!selectedProductId) return showError('Pilih paket diamond terlebih dahulu.');
    if (!game_user_id || !game_zone_id) return showError('User ID dan Zone ID wajib diisi.');

    payButton.disabled = true;
    const originalLabel = payLabel.textContent;
    payLabel.textContent = 'Memproses…';

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProductId,
          game_user_id,
          game_zone_id,
          contact,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || 'Gagal membuat pesanan.');
        payButton.disabled = false;
        payLabel.textContent = originalLabel;
        return;
      }

      // Buka popup pembayaran Midtrans Snap
      if (window.snap) {
        window.snap.pay(data.snap_token, {
          onSuccess: () => (window.location.href = `/status.html?order_id=${data.order_id}`),
          onPending: () => (window.location.href = `/status.html?order_id=${data.order_id}`),
          onError: () => showError('Pembayaran gagal. Silakan coba lagi.'),
          onClose: () => {
            payButton.disabled = false;
            payLabel.textContent = originalLabel;
          },
        });
      } else {
        // Fallback jika script Snap gagal dimuat
        window.location.href = data.redirect_url;
      }
    } catch (err) {
      showError('Terjadi kesalahan jaringan. Coba lagi.');
      payButton.disabled = false;
      payLabel.textContent = originalLabel;
    }
  });

  loadProducts();
})();
