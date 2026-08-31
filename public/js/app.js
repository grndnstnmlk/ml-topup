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
  const sfxToggleBtn = document.getElementById('sfx-toggle');
  const savedAccountsWrap = document.getElementById('saved-accounts-wrap');
  const savedAccountsChips = document.getElementById('saved-accounts-chips');
  const contactInput = document.getElementById('contact');
  const timerHours = document.getElementById('timer-hours');
  const timerMins = document.getElementById('timer-mins');
  const timerSecs = document.getElementById('timer-secs');
  const flashSaleBar = document.getElementById('flash-sale-bar');
  const flashSaleStockCount = document.getElementById('flash-sale-stock-count');

  /* ==========================================================================
     1. PROCEDURAL SOUND SYNTHESIZER (Web Audio API)
     ========================================================================== */
  let audioCtx = null;
  let sfxEnabled = localStorage.getItem('jagestore_sfx') !== 'false';

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.08) {
    if (!sfxEnabled) return;
    try {
      initAudioContext();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  function playTapSound() {
    playTone(580, 'sine', 0.06, 0.04);
  }

  function playDiamondSelectSound() {
    if (!sfxEnabled) return;
    try {
      initAudioContext();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        gain.gain.setValueAtTime(0.05, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.15);
      });
    } catch (e) {}
  }

  function playVerifySuccessSound() {
    if (!sfxEnabled) return;
    try {
      initAudioContext();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.06, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.22);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.22);
      });
    } catch (e) {}
  }

  function updateSfxToggleUI() {
    if (!sfxToggleBtn) return;
    sfxToggleBtn.classList.toggle('is-muted', !sfxEnabled);
    sfxToggleBtn.innerHTML = sfxEnabled
      ? '<span class="sfx-icon">🔊</span><span class="sfx-text">SFX: ON</span>'
      : '<span class="sfx-icon">🔇</span><span class="sfx-text">SFX: OFF</span>';
  }

  if (sfxToggleBtn) {
    updateSfxToggleUI();
    sfxToggleBtn.addEventListener('click', () => {
      sfxEnabled = !sfxEnabled;
      localStorage.setItem('jagestore_sfx', sfxEnabled);
      updateSfxToggleUI();
      if (sfxEnabled) playDiamondSelectSound();
    });
  }

  /* ==========================================================================
     1.1 SAVED ACCOUNTS MANAGER (Local Storage)
     ========================================================================== */
  function getSavedAccounts() {
    try {
      return JSON.parse(localStorage.getItem('jagestore_saved_accounts') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveAccount(acc) {
    if (!acc || !acc.userId || !acc.game) return;
    let list = getSavedAccounts();
    list = list.filter((a) => !(a.game === acc.game && a.userId === acc.userId && (a.zoneId || '') === (acc.zoneId || '')));
    list.unshift(acc);
    if (list.length > 5) list = list.slice(0, 5);
    try {
      localStorage.setItem('jagestore_saved_accounts', JSON.stringify(list));
    } catch (e) {}
    renderSavedAccounts();
  }

  function deleteSavedAccount(index, e) {
    if (e) e.stopPropagation();
    let list = getSavedAccounts();
    list.splice(index, 1);
    try {
      localStorage.setItem('jagestore_saved_accounts', JSON.stringify(list));
    } catch (e) {}
    renderSavedAccounts();
  }

  function renderSavedAccounts() {
    if (!savedAccountsWrap || !savedAccountsChips) return;
    const list = getSavedAccounts().filter((a) => a.game === currentGame);
    if (!list.length) {
      savedAccountsWrap.hidden = true;
      savedAccountsChips.innerHTML = '';
      return;
    }
    savedAccountsWrap.hidden = false;
    savedAccountsChips.innerHTML = list.map((acc, i) => `
      <div class="saved-account-chip ${userIdInput.value === acc.userId ? 'is-active' : ''}" data-idx="${i}">
        <img src="${acc.heroImg || '/assets/heroes/gusion.png'}" class="saved-account-avatar" alt="Avatar">
        <div class="saved-account-meta">
          <span class="saved-account-nick">${acc.nickname || 'Player'}</span>
          <span class="saved-account-id">${acc.userId}${acc.zoneId ? ` (${acc.zoneId})` : ''}</span>
        </div>
        <button type="button" class="saved-account-del" title="Hapus akun" aria-label="Hapus akun">×</button>
      </div>
    `).join('');

    savedAccountsChips.querySelectorAll('.saved-account-chip').forEach((chip) => {
      const idx = Number(chip.dataset.idx);
      chip.addEventListener('click', () => {
        const acc = list[idx];
        if (!acc) return;
        playTapSound();
        userIdInput.value = acc.userId;
        if (zoneIdInput) zoneIdInput.value = acc.zoneId || '';
        renderSavedAccounts();
        checkPlayerId();
      });

      const delBtn = chip.querySelector('.saved-account-del');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          deleteSavedAccount(idx, e);
        });
      }
    });
  }

  /* ==========================================================================
     1.2 FLASH SALE COUNTDOWN & STOCK TIMER
     ========================================================================== */
  function updateFlashSaleTimer() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(23, 59, 59, 999);
    let diffMs = midnight - now;
    if (diffMs < 0) diffMs = 0;

    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diffMs / (1000 * 60)) % 60);
    const secs = Math.floor((diffMs / 1000) % 60);

    if (timerHours) timerHours.textContent = String(hours).padStart(2, '0');
    if (timerMins) timerMins.textContent = String(mins).padStart(2, '0');
    if (timerSecs) timerSecs.textContent = String(secs).padStart(2, '0');

    const pctSold = Math.min(95, Math.floor(65 + (now.getHours() * 1.3)));
    const remaining = Math.max(5, 100 - pctSold);
    if (flashSaleBar) flashSaleBar.style.width = `${pctSold}%`;
    if (flashSaleStockCount) flashSaleStockCount.textContent = `${remaining} / 100 Paket`;
  }

  setInterval(updateFlashSaleTimer, 1000);
  updateFlashSaleTimer();

  // Contact Memory Auto-fill
  if (contactInput) {
    const savedContact = localStorage.getItem('jagestore_contact');
    if (savedContact) contactInput.value = savedContact;
    contactInput.addEventListener('input', () => {
      localStorage.setItem('jagestore_contact', contactInput.value.trim());
    });
  }

  /* ==========================================================================
     2. MANA PARTICLES CANVAS BACKGROUND
     ========================================================================== */
  const canvas = document.getElementById('mana-particles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let width = 0;
    let height = 0;
    let animId = null;

    function resizeCanvas() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.min(Math.floor(width / 32), 40);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 2.2 + 0.8,
          speedY: -(Math.random() * 0.6 + 0.2),
          speedX: (Math.random() - 0.5) * 0.3,
          color: Math.random() > 0.4 ? 'rgba(56, 189, 248, ' : 'rgba(245, 158, 11, ',
          opacity: Math.random() * 0.6 + 0.2,
          pulseSpeed: Math.random() * 0.02 + 0.01,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function drawParticles() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.phase += p.pulseSpeed;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.phase));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${currentOpacity})`;
        ctx.shadowColor = p.color.includes('56') ? '#38bdf8' : '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.fill();
      });

      animId = requestAnimationFrame(drawParticles);
    }

    window.addEventListener('resize', () => {
      resizeCanvas();
      createParticles();
    });

    resizeCanvas();
    createParticles();
    drawParticles();
  }

  /* ==========================================================================
     3. MOBILE LEGENDS HERO SPOTLIGHT SYSTEM
     ========================================================================== */
  const MLBB_HEROES = [
    {
      id: 'gusion',
      name: 'Gusion',
      title: 'Holy Blade',
      role: '⚡ Assassin / Mage',
      quote: 'Magic lies in the mind!',
      img: '/assets/heroes/gusion.png',
      color: '#0284c7'
    },
    {
      id: 'fanny',
      name: 'Fanny',
      title: 'Blade Dancer',
      role: '⚡ Assassin',
      quote: 'Sir, what\'s your command?',
      img: '/assets/heroes/fanny.png',
      color: '#38bdf8'
    },
    {
      id: 'ling',
      name: 'Ling',
      title: 'Cyan Finch',
      role: '⚡ Assassin',
      quote: 'Only the sword understands me.',
      img: '/assets/heroes/ling.png',
      color: '#06b6d4'
    },
    {
      id: 'chou',
      name: 'Chou',
      title: 'Kung Fu Boy',
      role: '⚡ Fighter',
      quote: 'Wipe out all the injustice in the world!',
      img: '/assets/heroes/chou.png',
      color: '#f59e0b'
    },
    {
      id: 'granger',
      name: 'Granger',
      title: 'Death Chanter',
      role: '⚡ Marksman',
      quote: 'Experience the euphoria of music!',
      img: '/assets/heroes/granger.png',
      color: '#f43f5e'
    },
    {
      id: 'zhuxin',
      name: 'Zhuxin',
      title: 'Beacon of Spirits',
      role: '⚡ Mage',
      quote: 'Follow the glow of the spirit lantern.',
      img: '/assets/heroes/zhuxin.png',
      color: '#a855f7'
    },
    {
      id: 'layla',
      name: 'Layla',
      title: 'Malefic Gunner',
      role: '⚡ Marksman',
      quote: 'Time to shine!',
      img: '/assets/heroes/layla.png',
      color: '#ec4899'
    },
    {
      id: 'nolan',
      name: 'Nolan',
      title: 'Cosmic Wayfinder',
      role: '⚡ Assassin',
      quote: 'The stars align for this victory.',
      img: '/assets/heroes/nolan.png',
      color: '#818cf8'
    }
  ];

  let currentHeroIdx = 0;
  let heroAutoTimer = null;

  const heroAvatarImg = document.getElementById('hero-avatar-img');
  const heroCardName = document.getElementById('hero-card-name');
  const heroCardTitle = document.getElementById('hero-card-title');
  const heroRolePill = document.getElementById('hero-role-pill');
  const heroQuoteText = document.getElementById('hero-quote-text');
  const heroAuraGlow = document.getElementById('hero-aura-glow');
  const heroSelectorBar = document.getElementById('hero-selector-bar');

  function renderHeroSelectorChips() {
    if (!heroSelectorBar) return;
    heroSelectorBar.innerHTML = MLBB_HEROES.map((h, i) => `
      <button type="button" class="hero-chip ${i === currentHeroIdx ? 'is-active' : ''}" data-hero-idx="${i}" title="${h.name} (${h.title})">
        <img src="${h.img}" alt="${h.name}" class="hero-chip-img">
        <span>${h.name}</span>
      </button>
    `).join('');

    heroSelectorBar.querySelectorAll('.hero-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const idx = Number(chip.dataset.heroIdx);
        switchHero(idx);
        resetHeroTimer();
      });
    });
  }

  function switchHero(idx) {
    currentHeroIdx = idx;
    const hero = MLBB_HEROES[idx];
    if (!hero) return;

    playTone(650, 'triangle', 0.08, 0.03);

    // Update chips
    if (heroSelectorBar) {
      heroSelectorBar.querySelectorAll('.hero-chip').forEach((chip, i) => {
        chip.classList.toggle('is-active', i === idx);
      });
    }

    // Update spotlight
    if (heroAvatarImg) {
      heroAvatarImg.style.opacity = '0';
      heroAvatarImg.style.transform = 'scale(0.85) rotate(-5deg)';
      setTimeout(() => {
        heroAvatarImg.src = hero.img;
        heroAvatarImg.alt = hero.name;
        heroAvatarImg.style.opacity = '1';
        heroAvatarImg.style.transform = 'scale(1) rotate(0deg)';
      }, 150);
    }

    if (heroCardName) heroCardName.textContent = hero.name;
    if (heroCardTitle) heroCardTitle.textContent = hero.title;
    if (heroRolePill) heroRolePill.textContent = hero.role;
    if (heroQuoteText) {
      heroQuoteText.style.opacity = '0';
      setTimeout(() => {
        heroQuoteText.textContent = hero.quote;
        heroQuoteText.style.opacity = '1';
      }, 150);
    }
    if (heroAuraGlow) {
      heroAuraGlow.style.background = `radial-gradient(circle, ${hero.color} 0%, rgba(139, 92, 246, 0.15) 50%, transparent 75%)`;
    }
  }

  function resetHeroTimer() {
    clearInterval(heroAutoTimer);
    heroAutoTimer = setInterval(() => {
      const nextIdx = (currentHeroIdx + 1) % MLBB_HEROES.length;
      switchHero(nextIdx);
    }, 6000);
  }

  renderHeroSelectorChips();
  resetHeroTimer();

  // Pause hero timer on banner hover
  const promoBanner = document.getElementById('promo-banner');
  if (promoBanner) {
    promoBanner.addEventListener('mouseenter', () => clearInterval(heroAutoTimer));
    promoBanner.addEventListener('mouseleave', () => resetHeroTimer());
  }

  /* ==========================================================================
     4. GAME CONFIG & PRODUCTS
     ========================================================================== */
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
    // Tombol tetap interaktif agar dapat memberikan panduan langsung jika ada step yang terlewat
    if (payButton) payButton.disabled = false;
  }

  /* ==========================================================================
     5. ENHANCED ID VERIFICATION (Holographic Player Card)
     ========================================================================== */
  function showIdCheck(state, text, details = {}) {
    idCheckBox.hidden = false;
    idCheckBox.className = `id-check ${state}`;
    idIsValid = true;
    updatePayButtonState();

    if (state === 'found') {
      playVerifySuccessSound();
      const hero = MLBB_HEROES[currentHeroIdx] || MLBB_HEROES[0];
      const rankStars = Math.floor(Math.random() * 40) + 25;
      const nick = details.username || text.replace(/^✓\s*Nickname:\s*/i, '');

      // Auto-save account into local storage
      saveAccount({
        game: currentGame,
        userId: userIdInput.value.trim(),
        zoneId: zoneIdInput ? zoneIdInput.value.trim() : '',
        nickname: nick,
        heroImg: hero.img
      });

      idCheckBox.innerHTML = `
        <div class="mlbb-player-card">
          <div class="player-card-left">
            <div class="player-hero-avatar-box">
              <img src="${hero.img}" alt="${hero.name}" class="player-hero-avatar-img">
              <span class="player-hero-status-dot"></span>
            </div>
            <div class="player-meta-box">
              <span class="player-verified-badge">✓ Akun Terverifikasi</span>
              <span class="player-nickname-text">${nick}</span>
              <span class="player-id-text">ID: ${userIdInput.value} ${zoneIdInput.value ? `(${zoneIdInput.value})` : ''}</span>
            </div>
          </div>
          <div class="player-card-right">
            <div class="player-rank-crest">
              <span class="rank-star-icon">⭐</span>
              <span>Mythical Glory ${rankStars}★</span>
            </div>
            <span class="player-server-tag">Region: ${details.country || 'ID'} (Aktif)</span>
          </div>
        </div>
      `;
    } else if (state === 'not-found') {
      idCheckBox.innerHTML = `<span>⚠️ ${text}</span>`;
    } else {
      idCheckBox.textContent = text;
    }
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
      const data = await res.json().catch(() => null);

      if (data && data.valid && data.username) {
        showIdCheck('found', `✓ Nickname: ${data.username}`, data);
      } else if (data && data.unavailable) {
        hideIdCheck();
      } else {
        showIdCheck('not-found', 'Nickname tidak terdeteksi otomatis. Pastikan User ID & Server ID sudah benar.');
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

  /* ==========================================================================
     6. DIAMOND SPARKLE BURST & 3D TILT EFFECT
     ========================================================================== */
  function spawnSparkleBurst(e) {
    const x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : window.innerWidth / 2);
    const y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : window.innerHeight / 2);

    const icons = ['💎', '✨', '⚡', '💎'];
    for (let i = 0; i < 6; i++) {
      const el = document.createElement('span');
      el.className = 'diamond-sparkle';
      el.textContent = icons[Math.floor(Math.random() * icons.length)];
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      
      const dx = (Math.random() - 0.5) * 80;
      const dy = -(Math.random() * 50 + 20);
      const rot = (Math.random() - 0.5) * 45;
      
      el.style.setProperty('--dx', `${dx}px`);
      el.style.setProperty('--dy', `${dy}px`);
      el.style.setProperty('--rot', `${rot}deg`);

      document.body.appendChild(el);
      setTimeout(() => el.remove(), 800);
    }
  }

  function apply3DTilt(card) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -7;
      const rotateY = ((x - centerX) / centerX) * 7;

      card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  }

  /* ==========================================================================
     7. PRODUCT RENDERING & SELECTION
     ========================================================================== */
  function renderCard(p) {
    const isPass = p.diamonds === 0 || p.category === 'weekly_pass';
    const disc = discountPct(p);
    const bonusLabel = p.bonus > 0
      ? `${p.diamonds} (${p.diamonds - p.bonus}+${p.bonus}) Diamonds`
      : (isPass ? p.name : `${p.diamonds} Diamonds`);

    const isSelected = selectedProductId === p.id;
    const isEventSpecial = p.diamonds === 278;
    const isPopular = p.is_popular;
    const isGlow = isPopular || isPass || isEventSpecial;

    let badges = [];
    if (disc) {
      badges.push(`<span class="badge badge-discount">HEMAT ${disc}%</span>`);
    }
    if (isEventSpecial) {
      badges.push('<span class="badge badge-event">🎯 EVENT 250</span>');
    } else if (isPopular || isPass) {
      badges.push('<span class="badge badge-popular">🔥 FAVORIT</span>');
    }

    return `
      <button type="button" class="product-card${isSelected ? ' is-selected' : ''}${isGlow ? ' has-glow-border' : ''}" data-id="${p.id}">
        ${badges.join('')}
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

    let filtered = products.filter((p) => {
      if (currentFilter === 'weekly_pass' && p.category !== 'weekly_pass') return false;
      if (currentFilter === 'first_topup' && p.category !== 'first_topup') return false;
      if (currentFilter === 'popular' && !p.is_popular) return false;
      if (currentFilter === 'diamond' && (p.category === 'weekly_pass' || p.category === 'first_topup')) return false;

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
      apply3DTilt(card);
      card.addEventListener('click', (e) => {
        spawnSparkleBurst(e);
        selectProduct(Number(card.dataset.id));
      });
    });
  }

  function selectProduct(id) {
    selectedProductId = id;
    playDiamondSelectSound();

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
    renderSavedAccounts();
  }

  function setGame(game) {
    currentGame = game;
    playTapSound();
    gameSwitcher.querySelectorAll('.game-tab').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.game === game);
    });
    applyGameConfig(game);
    loadProducts();
  }

  async function initGameSwitcher() {
    try {
      const res = await fetch('/api/products/games');
      const games = await res.json();
      if (!games.length) return;

      gameSwitcher.innerHTML = games.map((g) => {
        const cfg = GAME_CONFIG[g] || { label: g };
        const isActive = g === currentGame;
        return `<button type="button" class="game-tab${isActive ? ' is-active' : ''}" data-game="${g}">${cfg.label}</button>`;
      }).join('');

      gameSwitcher.querySelectorAll('.game-tab').forEach((btn) => {
        btn.addEventListener('click', () => setGame(btn.dataset.game));
      });

      applyGameConfig(currentGame);
      loadProducts();
      renderSavedAccounts();
    } catch (err) {
      loadProducts();
    }
  }

  // Category Tabs Filter
  if (categoryTabs) {
    categoryTabs.querySelectorAll('.category-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        playTapSound();
        categoryTabs.querySelectorAll('.category-tab').forEach((t) => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        currentFilter = tab.dataset.cat;
        renderProducts();
      });
    });
  }

  // Search Input Filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderProducts();
    });
  }

  // Mobile Checkout CTA Scroll
  if (mobileCtaBtn) {
    mobileCtaBtn.addEventListener('click', () => {
      playTapSound();
      document.querySelector('.sidebar-panel').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // FAQ Accordion
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      playTapSound();
      const item = btn.parentElement;
      item.classList.toggle('is-open');
    });
  });

  // Rotating Live Transaction Ticker
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

  /* ==========================================================================
     8. HERO ASSISTANT MASCOT WIDGET
     ========================================================================== */
  const mascotWidget = document.getElementById('hero-mascot-widget');
  const mascotBubble = document.getElementById('mascot-bubble');
  const mascotText = document.getElementById('mascot-text');
  const mascotBtn = document.getElementById('mascot-btn');
  const mascotImg = document.getElementById('mascot-img');

  const MASCOT_TIPS = [
    'Top up otomatis masuk dalam 10 detik! ⚡',
    'Tips: Weekly Diamond Pass hemat hingga 60%! 🔥',
    'Paket 278 Diamonds paling laris hari ini! 💎',
    'Masukkan ID & Server dengan benar ya!',
    'Layanan online 24 jam nonstop! 🚀'
  ];
  let mascotTipIdx = 0;

  function rotateMascotTip() {
    if (!mascotText || !mascotBubble) return;
    mascotTipIdx = (mascotTipIdx + 1) % MASCOT_TIPS.length;
    mascotBubble.style.opacity = '0';
    mascotBubble.style.transform = 'scale(0.85) translateY(4px)';
    setTimeout(() => {
      mascotText.textContent = MASCOT_TIPS[mascotTipIdx];
      mascotBubble.style.opacity = '1';
      mascotBubble.style.transform = 'scale(1) translateY(0)';
    }, 200);
  }

  setInterval(rotateMascotTip, 8000);

  if (mascotBtn) {
    mascotBtn.addEventListener('click', (e) => {
      spawnSparkleBurst(e);
      playDiamondSelectSound();
      rotateMascotTip();
      // change mascot hero avatar playfully
      const nextHero = MLBB_HEROES[Math.floor(Math.random() * MLBB_HEROES.length)];
      if (mascotImg) mascotImg.src = nextHero.img;
    });
  }

  function playErrorSound() {
    if (!sfxEnabled) return;
    try {
      initAudioContext();
      if (!audioCtx) return;
      playTone(180, 'sawtooth', 0.25, 0.08);
    } catch (e) {}
  }

  function triggerShake(el) {
    if (!el) return;
    el.classList.remove('field-shake');
    void el.offsetWidth; // trigger reflow
    el.classList.add('field-shake');
    setTimeout(() => {
      el.classList.remove('field-shake');
    }, 650);
  }

  function showError(message, targetEl = null) {
    errorText.innerHTML = `<span>⚠️</span> <span>${message}</span>`;
    errorText.hidden = false;
    playErrorSound();

    if (targetEl) {
      triggerShake(targetEl);
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof targetEl.focus === 'function') {
        setTimeout(() => targetEl.focus(), 300);
      }
    }
  }

  function clearError() {
    errorText.hidden = true;
    errorText.textContent = '';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const game_user_id = document.getElementById('game_user_id').value.trim();
    const game_zone_id = document.getElementById('game_zone_id').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const cfg = GAME_CONFIG[currentGame];

    if (!selectedProductId) {
      return showError('Pilih paket diamond terlebih dahulu.', document.getElementById('product-grid') || document.querySelector('.steps-container'));
    }
    if (!game_user_id) {
      return showError(`${cfg.userLabel} wajib diisi.`, userIdInput);
    }
    if (cfg.needsZone && !game_zone_id) {
      return showError('Zone / Server ID wajib diisi.', zoneIdInput);
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contact || !emailPattern.test(contact)) {
      return showError('Alamat email wajib diisi dengan benar (contoh: nama@email.com).', document.getElementById('contact'));
    }

    localStorage.setItem('jagestore_contact', contact);

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
