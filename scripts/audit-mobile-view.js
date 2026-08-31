const { firefox, devices } = require('playwright');
const express = require('express');
const path = require('path');

(async () => {
  console.log('📱 Auditing JAGESTORE Mobile View (390x844)...');

  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/config', (req, res) => res.json({ midtrans_client_key: 'test', is_production: false, payment_method: 'qris_manual' }));
  app.get('/api/products/games', (req, res) => res.json(['mobile-legends', 'free-fire', 'pubg-mobile']));
  app.get('/api/products', (req, res) => {
    res.json([
      { id: 1, name: 'Weekly Diamond Pass', price: 31010, original_price: 32500, category: 'weekly_pass', is_popular: 1, diamonds: 0, bonus: 0 },
      { id: 2, name: '100 (50+50) Diamonds', price: 16037, original_price: null, category: 'first_topup', is_popular: 0, diamonds: 100, bonus: 50 },
      { id: 3, name: '278 (251+27) Diamonds', price: 81918, original_price: null, category: 'diamond', is_popular: 1, diamonds: 278, bonus: 27 },
      { id: 4, name: '568 (503+65) Diamonds', price: 162295, original_price: null, category: 'diamond', is_popular: 1, diamonds: 568, bonus: 65 },
      { id: 5, name: '875 (750+125) Diamonds', price: 245000, original_price: null, category: 'diamond', is_popular: 0, diamonds: 875, bonus: 125 }
    ]);
  });
  app.post('/api/check-id', (req, res) => {
    res.json({ valid: true, username: 'ProGamer_ID', country: 'ID' });
  });

  const port = 3588;
  const server = app.listen(port, async () => {
    const browser = await firefox.launch({ headless: true });
    
    // Test on iPhone 14 profile
    const iPhone = devices['iPhone 14'];
    const context = await browser.newContext({
      ...iPhone,
    });
    const page = await context.newPage();

    await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });

    // Check overflow
    const overflowInfo = await page.evaluate(() => {
      const docWidth = document.documentElement.offsetWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const bodyWidth = document.body.scrollWidth;
      return {
        viewportWidth: window.innerWidth,
        docWidth,
        scrollWidth,
        bodyWidth,
        hasHorizontalOverflow: scrollWidth > window.innerWidth || bodyWidth > window.innerWidth
      };
    });

    console.log('Mobile Overflow Check:', overflowInfo);

    const artifactDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\ae2f2c81-f588-408b-bb01-13e45de295be';
    
    // Screenshot Hero on Mobile
    await page.screenshot({ path: `${artifactDir}\\mobile_initial.png` });

    // Select a product to show mobile floating bar
    const productCard = await page.$('.product-card');
    if (productCard) {
      await productCard.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${artifactDir}\\mobile_selected_bar.png` });
    }

    // Input User ID & Server ID to check player card on mobile
    await page.fill('#game_user_id', '602810859');
    await page.fill('#game_zone_id', '8408');
    await page.locator('#game_zone_id').blur();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${artifactDir}\\mobile_verified_state.png`, fullPage: true });

    await browser.close();
    server.close();
    console.log('✅ Mobile audit complete! Screenshots saved to brain.');
    process.exit(0);
  });
})();
