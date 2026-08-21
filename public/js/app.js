(function () {
  const productGrid = document.getElementById('product-grid');
  const sumItemName = document.getElementById('sum-item-name');
  const sumItemPrice = document.getElementById('sum-item-price');
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
  const categoryTabs = document.getElementById('category-tabs');
  const searchInput = document.getElementById('search-packages');
  const mobileCheckoutBar = document.getElementById('mobile-checkout-bar');
  const mobileItemName = document.getElementById('mobile-item-name');
  const mobileItemPrice = document.getElementById('mobile-item-price');
  const mobileCtaBtn = document.getElementById('mobile-cta-btn');
  const tickerText = document.getElementById('ticker-text');

  const GAME_CONFIG = {
    'mobile-legends': {
      label: 'Mobile Legends',
      needsZone: true,
      userLabel: 'User ID',
      hint: 'ID dan Server ada di halaman profil, tepat di bawah foto & nama akunmu di dalam game.',
    },
    'free-fire': {
      label: 'Free Fire',
      needsZone: false,
      userLabel: 'Player ID',
      hint: 'Player ID ada di halaman profil akun Free Fire kamu.',
    },
    'pubg-mobile': {
      label: 'PUBG Mobile',
      needsZone: false,
      userLabel: 'Character ID',
      hint: 'Character ID ada di halaman profil akun PUBG kamu.',
    },
  };

  let currentGame = 'mobile-legends';
  let selectedProductId = null;
  let products = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let idIsValid = true;

  const passIcon = `<img src="/assets/weekly-pass.png" alt="Weekly Pass" class="product-diamond product-diamond-pass">`;

  const DIAMOND_ICON_RANGES = [
    { min: 100, max: 410, src: '/assets/diamond-mid.png' },
    { min: 500, max: 999, src: '/assets/diamond-500-999.png' },
    { min: 1000, max: 30000, src: '/assets/diamond-1000-30000.png' },
  ];

  function diamondIconFor(p) {
    const range = DIAMOND_ICON_RANGES.find((r) => p.diamonds >= r.min && p.diamonds <= r.max);
    const src = range ? range.src : '/assets/diamond.png';
    return `<img src="${src}" alt="Diamonds" class="product-diamond">`;
  }

  const CATEGORY_META = {
    weekly_pass: { title: '🔥 Special Items', eyebrow: 'Weekly Diamond Pass' },
    first_topup: { title: '🎁 First Top Up (Double Diamonds)', eyebrow: 'Bonus 2x lipat — khusus top up pertama akun' },
    diamond: { title: '💎 Paket Diamond', eyebrow: 'Proses otomatis instan' },
  };

  function formatRupiah(n) {
    return 'Rp' + Number(n).toLocaleString('id-ID');
  }

  function discountPct(p) {
    if (!p.original_price || p.original_price <= p.price) return null;
    return Math.round((1 - p.price / p.original_price) * 100);
  }

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
    if (currentGame !== 'mobile-legends' && currentGame !== 'free-fire') {
      hideIdCheck();
      return;
    }

    const userId = userIdInput.value.trim();
    const zoneId = zoneIdInput.value.trim();

    if (!userId) {
      hideIdCheck();
      return;
    }
    if (currentGame === 'mobile-legends' && !zoneId) {
      hideIdCheck();
      return;
    }

    showIdCheck('checking', 'Mengecek data akun…');

    try {
      const res = await fetch('/api/check-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: currentGame,
          game_user_id: userId,
          game_zone_id: zoneId || undefined,
        }),
      });
      const data = await res.json();

      if (data.valid && data.username) {
        const text = data.country
          ? `✓ Nickname: ${data.username} (${data.country})`
          : `✓ Nickname: ${data.username}`;
        showIdCheck('found', text);
      } else if (data.unavailable) {
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
    checkIdTimer = setTimeout(checkPlayerId, 600);
  }

  userIdInput.addEventListener('input', scheduleCheckPlayerId);
  zoneIdInput.addEventListener('input', scheduleCheckPlayerId);
  userIdInput.addEventListener('blur', checkPlayerId);
  zoneIdInput.addEventListener('blur', checkPlayerId);

  function renderCard(p) {
    const isPass = p.diamonds === 0;
    const disc = discountPct(p);
    const bonusLabel = p.bonus > 0
      ? `${p.diamonds} (${p.diamonds - p.bonus}+${p.bonus}) Diamonds`
      : (isPass ? p.name : `${p.diamonds} Diamonds`);

    const isSelected = selectedProductId === p.id;

    return `
      <button type="button" class="product-card${isSelected ? ' is-selected' : ''}" data-id="${p.id}">
        ${p.is_popular ? '<span class="badge">POPULER</span>' : ''}
        ${disc ? `<span class="badge badge-discount">HEMAT ${disc}%</span>` : ''}
        ${isPass ? passIcon : diamondIconFor(p)}
        <div class="product-name">${bonusLabel}</div>
        ${disc ? `<div class="product-original-price">${formatRupiah(p.original_price)}</div>` : ''}
        <div class="product-price">${formatRupiah(p.price)}</div>
      </button>
    `;
  }

  function renderProducts() {
    if (!products.length) {
      productGrid.innerHTML = '<p class="loading-text">Tidak ada paket yang tersedia.</p>';
      return;
    }

    // Filter berdasarkan kategori dan pencarian
    let filtered = products.filter((p) => {
      // Filter Kategori
      if (currentFilter === 'weekly_pass' && p.category !== 'weekly_pass') return false;
      if (currentFilter === 'first_topup' && p.category !== 'first_topup') return false;
      if (currentFilter === 'popular' && !p.is_popular) return false;
      if (currentFilter === 'diamond' && (p.category === 'weekly_pass' || p.category === 'first_topup')) return false;

      // Filter Pencarian
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchDiamonds = String(p.diamonds).includes(query);
        if (!matchName && !matchDiamonds) return false;
      }

      return true;
    });

    if (!filtered.length) {
      productGrid.innerHTML = '<p class="loading-text">Tidak ada paket yang cocok dengan filter atau kata kunci.</p>';
      return;
    }

    // Kelompokkan hasil
    const groups = {};
    filtered.forEach((p) => {
      const cat = p.category || 'diamond';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });

    let html = '';

    ['weekly_pass', 'first_topup', 'diamond'].forEach((cat) => {
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
    updatePayButtonState();
    payLabel.textContent = `Pesan Sekarang · ${formatRupiah(product.price)}`;

    const displayName = product.diamonds > 0
      ? `${product.diamonds} Diamonds`
      : product.name;

    sumItemName.textContent = displayName;
    sumItemPrice.textContent = formatRupiah(product.price);

    // Update floating mobile bar
    if (mobileCheckoutBar) {
      mobileItemName.textContent = displayName;
      mobileItemPrice.textContent = formatRupiah(product.price);
      mobileCheckoutBar.classList.add('is-visible');
    }
  }

  async function loadProducts() {
    productGrid.innerHTML = '<p class="loading-text">Memuat paket produk…</p>';
    selectedProductId = null;
    payButton.disabled = true;
    sumItemName.textContent = '—';
    sumItemPrice.textContent = 'Rp0';
    payLabel.textContent = 'Pesan Sekarang';
    if (mobileCheckoutBar) mobileCheckoutBar.classList.remove('is-visible');

    try {
      const res = await fetch(`/api/products?game=${encodeURIComponent(currentGame)}`);
      products = await res.json();
      renderProducts();
    } catch (err) {
      productGrid.innerHTML = '<p class="loading-text">Gagal memuat paket. Silakan refresh halaman.</p>';
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
    } catch (err) {}

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

  // Filter Tabs Event
  if (categoryTabs) {
    categoryTabs.querySelectorAll('.category-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        categoryTabs.querySelectorAll('.category-tab').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentFilter = btn.dataset.cat;
        renderProducts();
      });
    });
  }

  // Search input filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderProducts();
    });
  }

  // Mobile CTA Button (Scrolls to step 4)
  if (mobileCtaBtn) {
    mobileCtaBtn.addEventListener('click', () => {
      document.querySelector('.sidebar-panel').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // FAQ Accordion
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      item.classList.toggle('is-open');
    });
  });

  // Rotating Live Transaction Ticker (Ringkas & pas di layar HP)
  const SAMPLE_ORDERS = [
    { id: '6028****', item: '278 💎' },
    { id: '1572****', item: 'Weekly Pass' },
    { id: '8491****', item: '568 💎' },
    { id: '2093****', item: '716 💎' },
    { id: '7412****', item: '1000 💎 (2x)' },
    { id: '3910****', item: '2010 💎' },
  ];
  let tickerIdx = 0;
  setInterval(() => {
    if (!tickerText) return;
    tickerIdx = (tickerIdx + 1) % SAMPLE_ORDERS.length;
    const cur = SAMPLE_ORDERS[tickerIdx];
    tickerText.innerHTML = `Akun <strong>${cur.id}</strong> beli <span class="hi-cyan">${cur.item}</span> · <span style="color:var(--success)">Sukses Terkirim</span>`;
  }, 4000);

  function showError(message) {
    errorText.textContent = message;
    errorText.hidden = false;
  }

  function clearError() {
    errorText.hidden = true;
  }

  // FORM SUBMIT
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const game_user_id = document.getElementById('game_user_id').value.trim();
    const game_zone_id = document.getElementById('game_zone_id').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const cfg = GAME_CONFIG[currentGame];

    if (!selectedProductId) return showError('Pilih paket diamond terlebih dahulu.');
    if (!game_user_id) return showError(`${cfg.userLabel} wajib diisi.`);
    if (cfg.needsZone && !game_zone_id) return showError('Zone / Server ID wajib diisi.');
    if (!idIsValid) return showError('ID akun tidak ditemukan. Periksa kembali User ID & Server ID.');
    if (!contact) return showError('Email / WhatsApp wajib diisi.');

    payButton.disabled = true;
    const originalLabel = payLabel.textContent;
    payLabel.textContent = 'Memproses Pesanan…';

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

      if (data.manual_qris) {
        window.location.href = `/status.html?order_id=${data.order_id}`;
        return;
      }

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
        window.location.href = data.redirect_url;
      }
    } catch (err) {
      showError('Terjadi kesalahan jaringan. Coba lagi.');
      payButton.disabled = false;
      payLabel.textContent = originalLabel;
    }
  });

  async function initMidtransConfig() {
    try {
      const res = await fetch('/api/config');
      const cfg = await res.json();
      if (cfg && cfg.midtrans_client_key && cfg.payment_method !== 'qris_manual') {
        const snapUrl = cfg.is_production
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js';

        let existingScript = document.getElementById('midtrans-script');
        if (existingScript) {
          existingScript.src = snapUrl;
          existingScript.setAttribute('data-client-key', cfg.midtrans_client_key);
        } else {
          const s = document.createElement('script');
          s.id = 'midtrans-script';
          s.type = 'text/javascript';
          s.src = snapUrl;
          s.setAttribute('data-client-key', cfg.midtrans_client_key);
          document.body.appendChild(s);
        }
      }
    } catch (err) {}
  }

  initMidtransConfig();
  initGameSwitcher();
})();
