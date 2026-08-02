(function () {
  const productGrid = document.getElementById('product-grid');
  const form = document.getElementById('order-form');
  const payButton = document.getElementById('pay-button');
  const payLabel = document.getElementById('pay-button-label');
  const errorText = document.getElementById('form-error');

  let selectedProductId = null;
  let products = [];

  const diamondIcon = `<img src="/assets/diamond.png" alt="" class="product-diamond">`;
  const passIcon = `<img src="/assets/diamond.png" alt="" class="product-diamond product-diamond-pass">`;

  const CATEGORY_META = {
    diamond: { title: null },
    first_topup: { title: '🎁 First Top Up (Double Diamonds)', eyebrow: 'Bonus 2x — khusus top up pertama' },
    weekly_pass: { title: '🔥 Special Items', eyebrow: 'Weekly Diamond Pass' },
  };

  function formatRupiah(n) {
    return 'Rp' + n.toLocaleString('id-ID');
  }

  function discountPct(p) {
    if (!p.original_price || p.original_price <= p.price) return null;
    return Math.round((1 - p.price / p.original_price) * 100);
  }

  function renderCard(p) {
    const isPass = p.diamonds === 0;
    const disc = discountPct(p);
    const bonusLabel = p.bonus > 0
      ? `${p.diamonds} (${p.diamonds - p.bonus}+${p.bonus}) Diamonds`
      : (isPass ? p.name : `${p.diamonds} Diamonds`);

    return `
      <button type="button" class="product-card" data-id="${p.id}" style="color: var(--text-primary)">
        ${p.is_popular ? '<span class="badge">POPULER</span>' : ''}
        ${disc ? `<span class="badge badge-discount">DISC ${disc}%</span>` : ''}
        ${isPass ? passIcon : diamondIcon}
        <div class="product-name">${bonusLabel}</div>
        ${disc ? `<div class="product-original-price">${formatRupiah(p.original_price)}</div>` : ''}
        <div class="product-price">${formatRupiah(p.price)}</div>
      </button>
    `;
  }

  function renderProducts() {
    if (!products.length) {
      productGrid.innerHTML = '<p class="loading-text">Paket tidak tersedia saat ini.</p>';
      return;
    }

    const groups = {};
    products.forEach((p) => {
      const cat = p.category || 'diamond';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });

    let html = '';

    // Kategori diamond reguler tampil tanpa judul (grid utama)
    if (groups.diamond) {
      html += `<div class="product-subgrid">${groups.diamond.map(renderCard).join('')}</div>`;
    }

    ['first_topup', 'weekly_pass'].forEach((cat) => {
      if (!groups[cat] || !groups[cat].length) return;
      const meta = CATEGORY_META[cat];
      html += `
        <div class="product-category">
          <h3 class="product-category-title">${meta.title}</h3>
          ${meta.eyebrow ? `<p class="product-category-eyebrow">${meta.eyebrow}</p>` : ''}
          <div class="product-subgrid">${groups[cat].map(renderCard).join('')}</div>
        </div>
      `;
    });

    productGrid.innerHTML = html;

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
