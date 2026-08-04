(function () {
  const productGrid = document.getElementById('product-grid');
  const orderSummary = document.getElementById('order-summary');
  const form = document.getElementById('order-form');
  const payButton = document.getElementById('pay-button');
  const payLabel = document.getElementById('pay-button-label');
  const errorText = document.getElementById('form-error');
  const userIdInput = document.getElementById('game_user_id');
  const zoneIdInput = document.getElementById('game_zone_id');
  const zoneField = document.getElementById('zone-field');
  const userIdLabel = document.getElementById('user-id-label');
  const accountHint = document.getElementById('account-hint');
  const idCheckBox = document.getElementById('id-check');
  const gameSwitcher = document.getElementById('game-switcher');

  // Tambah game baru di sini setelah produknya diisi SKU asli di db-seed.js
  // (lihat komentar di db-seed.js untuk caranya).
  const GAME_CONFIG = {
    'mobile-legends': {
      label: 'Mobile Legends',
      needsZone: true,
      userLabel: 'ID',
      hint: 'ID dan Server ada di halaman profil, di bawah nama akunmu di dalam game.',
    },
    'free-fire': {
      label: 'Free Fire',
      needsZone: false,
      userLabel: 'Player ID',
      hint: 'Player ID ada di halaman profil, di bawah nickname kamu.',
    },
    'pubg-mobile': {
      label: 'PUBG Mobile',
      needsZone: false,
      userLabel: 'Character ID',
      hint: 'Character ID ada di halaman profil akun kamu.',
    },
  };

  let currentGame = 'mobile-legends';
  let selectedProductId = null;
  let products = [];
  // false hanya kalau Velixs sudah cek dan bilang ID tidak ditemukan — dalam
  // kondisi ini "Pesan Sekarang" wajib dikunci. Default true (tidak mengunci)
  // untuk game yang belum didukung Velixs, atau kalau fitur cek lagi down.
  let idIsValid = true;

  const diamondIcon = `<img src="/assets/diamond.png" alt="" class="product-diamond">`;
  const passIcon = `<img src="/assets/diamond.png" alt="" class="product-diamond product-diamond-pass">`;

  const CATEGORY_META = {
    diamond: { title: null },
    first_topup: { title: '🎁 First Top Up (Double Diamonds)', eyebrow: 'Bonus 2x — khusus top up pertama' },
    weekly_pass: { title: '🔥 Special Items', eyebrow: 'Weekly Diamond Pass' },
  };

  function updatePayButtonState() {
    payButton.disabled = !selectedProductId || !idIsValid;
  }

  function showIdCheck(state, text) {
    idCheckBox.hidden = false;
    idCheckBox.className = `id-check ${state}`;
    idCheckBox.textContent = text;
    idIsValid = state !== 'not-found';
    updatePayButtonState();
  }

  function hideIdCheck() {
    idCheckBox.hidden = true;
    idCheckBox.textContent = '';
    idIsValid = true;
    updatePayButtonState();
  }

  let checkIdTimer = null;

  async function checkPlayerId() {
    // Cek nickname (Velixs) baru mendukung Mobile Legends untuk sekarang.
    if (currentGame !== 'mobile-legends') {
      hideIdCheck();
      return;
    }

    const userId = userIdInput.value.trim();
    const zoneId = zoneIdInput.value.trim();

    if (!userId || !zoneId) {
      hideIdCheck();
      return;
    }

    showIdCheck('checking', 'Mengecek nickname…');

    try {
      const res = await fetch('/api/check-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_user_id: userId, game_zone_id: zoneId }),
      });
      const data = await res.json();

      if (data.valid && data.username) {
        showIdCheck('found', `✓ Nickname: ${data.username}`);
      } else if (data.unavailable) {
        // Fitur cek nickname sedang tidak tersedia — jangan halangi user checkout.
        hideIdCheck();
      } else {
        showIdCheck('not-found', '✕ ID tidak ditemukan. Periksa kembali User ID & Zone ID.');
      }
    } catch (err) {
      hideIdCheck();
    }
  }

  function scheduleCheckPlayerId() {
    clearTimeout(checkIdTimer);
    checkIdTimer = setTimeout(checkPlayerId, 700);
  }

  userIdInput.addEventListener('input', scheduleCheckPlayerId);
  zoneIdInput.addEventListener('input', scheduleCheckPlayerId);
  userIdInput.addEventListener('blur', checkPlayerId);
  zoneIdInput.addEventListener('blur', checkPlayerId);

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

    // Katalog diamond reguler tampil terakhir, di bawah kategori khusus
    if (groups.diamond) {
      html += `
        <div class="product-category">
          <h3 class="product-category-title">💎 Pilihan Diamond</h3>
          <div class="product-subgrid">${groups.diamond.map(renderCard).join('')}</div>
        </div>
      `;
    }

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
    updatePayButtonState();
    payLabel.textContent = 'Pesan Sekarang';

    const displayName = product.diamonds > 0
      ? `${product.diamonds} Diamonds`
      : product.name;

    orderSummary.classList.add('has-item');
    orderSummary.innerHTML = `
      <div class="order-summary-item">
        <span class="order-summary-item-name">${displayName}</span>
        <span class="order-summary-item-price">${formatRupiah(product.price)}</span>
      </div>
    `;
  }

  async function loadProducts() {
    productGrid.innerHTML = '<p class="loading-text">Memuat paket…</p>';
    selectedProductId = null;
    payButton.disabled = true;
    orderSummary.classList.remove('has-item');
    orderSummary.innerHTML = '<p class="order-summary-empty">Belum ada item produk yang dipilih.</p>';

    try {
      const res = await fetch(`/api/products?game=${encodeURIComponent(currentGame)}`);
      products = await res.json();
      renderProducts();
    } catch (err) {
      productGrid.innerHTML = '<p class="loading-text">Gagal memuat paket. Refresh halaman.</p>';
    }
  }

  function applyGameConfig(game) {
    const cfg = GAME_CONFIG[game];
    userIdLabel.textContent = cfg.userLabel;
    accountHint.textContent = cfg.hint;
    zoneField.hidden = !cfg.needsZone;
    zoneIdInput.value = '';
    userIdInput.value = '';
    hideIdCheck();
  }

  function setGame(game) {
    currentGame = game;
    gameSwitcher.querySelectorAll('.game-tab').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.game === game);
    });
    applyGameConfig(game);
    loadProducts();
  }

  async function initGameSwitcher() {
    let games = ['mobile-legends'];
    try {
      const res = await fetch('/api/products/games');
      const available = await res.json();
      if (Array.isArray(available) && available.length) games = available;
    } catch (err) {
      // Kalau gagal ambil daftar game, tetap fallback ke Mobile Legends saja.
    }

    // Urutkan sesuai urutan definisi di GAME_CONFIG, abaikan game yang belum dikenal frontend.
    const ordered = Object.keys(GAME_CONFIG).filter((g) => games.includes(g));
    const finalGames = ordered.length ? ordered : ['mobile-legends'];

    gameSwitcher.innerHTML = finalGames
      .map(
        (g, i) => `<button type="button" class="game-tab${i === 0 ? ' is-active' : ''}" data-game="${g}">${GAME_CONFIG[g].label}</button>`
      )
      .join('');
    gameSwitcher.hidden = finalGames.length < 2;

    gameSwitcher.querySelectorAll('.game-tab').forEach((btn) => {
      btn.addEventListener('click', () => setGame(btn.dataset.game));
    });

    currentGame = finalGames[0];
    applyGameConfig(currentGame);
    loadProducts();
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

    const cfg = GAME_CONFIG[currentGame];

    if (!selectedProductId) return showError('Pilih paket diamond terlebih dahulu.');
    if (!game_user_id) return showError(`${cfg.userLabel} wajib diisi.`);
    if (cfg.needsZone && !game_zone_id) return showError('Zone ID wajib diisi.');
    if (!idIsValid) return showError('ID tidak ditemukan. Periksa kembali User ID & Zone ID.');
    if (!contact) return showError('Email wajib diisi.');

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
          game_zone_id: cfg.needsZone ? game_zone_id : undefined,
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

      // PAYMENT_METHOD=qris_manual di server -> tidak ada Snap token, langsung
      // arahkan ke halaman status yang akan menampilkan QRIS statis untuk dibayar.
      if (data.manual_qris) {
        window.location.href = `/status.html?order_id=${data.order_id}`;
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

  initGameSwitcher();
})();
