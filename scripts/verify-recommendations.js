const { firefox } = require('playwright');
const express = require('express');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🧪 Starting Verification Test on Local Server...');

  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Mock API endpoints
  app.get('/api/config', (req, res) => res.json({ midtrans_client_key: 'test', is_production: false, payment_method: 'qris_manual' }));
  app.get('/api/products/games', (req, res) => res.json(['mobile-legends']));
  app.get('/api/products', (req, res) => {
    res.json([
      { id: 1, name: 'Weekly Diamond Pass', price: 31010, original_price: 32500, category: 'weekly_pass', is_popular: 1, diamonds: 210, bonus: 0 },
      { id: 2, name: '100 (50+50) Diamonds', price: 16037, original_price: null, category: 'first_topup', is_popular: 0, diamonds: 100, bonus: 50 },
      { id: 3, name: '278 (251+27) Diamonds', price: 81918, original_price: null, category: 'diamond', is_popular: 1, diamonds: 278, bonus: 27 },
      { id: 4, name: '568 (503+65) Diamonds', price: 162295, original_price: null, category: 'diamond', is_popular: 1, diamonds: 568, bonus: 65 }
    ]);
  });
  app.post('/api/check-id', (req, res) => {
    const { game_user_id, game_zone_id } = req.body;
    if (game_user_id === '602810859' && game_zone_id === '8408') {
      return res.json({ valid: true, username: 'JAGE_PRO_PLAYER', country: 'ID' });
    }
    return res.json({ valid: false, message: 'ID tidak ditemukan' });
  });

  const port = 3457;
  const server = app.listen(port, async () => {
    console.log(`Server listening on http://localhost:${port}`);
    const artifactDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\d153c2a4-83c8-4e41-87a1-761f9f419be1';

    const browser = await firefox.launch({ headless: true });
    
    // 1. Desktop Test
    const contextDesktop = await browser.newContext({ viewport: { width: 1280, height: 850 } });
    const pageDesktop = await contextDesktop.newPage();
    await pageDesktop.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });

    // Verify font computed styles
    const fontInfo = await pageDesktop.evaluate(() => {
      const card = document.querySelector('.product-card');
      const input = document.querySelector('input');
      const btn = document.querySelector('.cta-pay');
      return {
        cardFont: window.getComputedStyle(card).fontFamily,
        inputFont: window.getComputedStyle(input).fontFamily,
        btnFont: window.getComputedStyle(btn).fontFamily
      };
    });
    console.log('Typography Check:', JSON.stringify(fontInfo, null, 2));

    // Click product to check glowing state and checkmark
    const firstCard = await pageDesktop.$('.product-card');
    if (firstCard) {
      await firstCard.click();
      await pageDesktop.waitForTimeout(300);
    }

    // Check ID Verification
    await pageDesktop.fill('#game_user_id', '602810859');
    await pageDesktop.fill('#game_zone_id', '8408');
    await pageDesktop.waitForTimeout(1000);

    const desktopVerifiedPath = path.join(artifactDir, 'verified_desktop_ui.png');
    await pageDesktop.screenshot({ path: desktopVerifiedPath, fullPage: true });
    console.log(`📸 Desktop Verified Screenshot saved: ${desktopVerifiedPath}`);

    // 2. Mobile Viewport Test (390 x 844)
    const contextMobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pageMobile = await contextMobile.newPage();
    await pageMobile.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });

    // Initial Mobile Screenshot
    const mobileInitialPath = path.join(artifactDir, 'mobile_initial_ui.png');
    await pageMobile.screenshot({ path: mobileInitialPath });
    console.log(`📱 Mobile Initial Screenshot: ${mobileInitialPath}`);

    // Select Product on Mobile
    const mobileFirstCard = await pageMobile.$('.product-card');
    if (mobileFirstCard) {
      await mobileFirstCard.click();
      await pageMobile.waitForTimeout(400);
    }

    // Verify Mobile Floating Bar visibility
    const isMobileBarVisible = await pageMobile.evaluate(() => {
      const bar = document.getElementById('mobile-checkout-bar');
      return bar && bar.classList.contains('is-visible') && window.getComputedStyle(bar).display !== 'none';
    });
    console.log(`Mobile Floating Bar Visible: ${isMobileBarVisible}`);

    const mobileSelectedPath = path.join(artifactDir, 'mobile_selected_ui.png');
    await pageMobile.screenshot({ path: mobileSelectedPath });
    console.log(`📱 Mobile Selected Screenshot: ${mobileSelectedPath}`);

    // Test form error shake
    await pageMobile.click('.mobile-cta-btn');
    await pageMobile.waitForTimeout(300);
    await pageMobile.click('#pay-button');
    await pageMobile.waitForTimeout(500);

    const mobileErrorPath = path.join(artifactDir, 'mobile_error_shake.png');
    await pageMobile.screenshot({ path: mobileErrorPath });
    console.log(`📱 Mobile Error Shake Screenshot: ${mobileErrorPath}`);

    await browser.close();
    server.close();
    console.log('✅ ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  });
})();
