const { chromium } = require('playwright');
const express = require('express');
const path = require('path');

(async () => {
  const app = express();
  app.use(express.static(path.join(__dirname, '..', 'public')));
  
  // mock api
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

  const server = app.listen(3456, async () => {
    console.log('Local test server running on port 3456');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    await page.goto('http://localhost:3456', { waitUntil: 'networkidle' });

    const screenshotPath = 'C:/Users/USER/.gemini/antigravity-ide/brain/e9b5bf20-215b-4372-a77e-57d8d0e2cf5c/local_redesign_preview.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);

    // Mobile screenshot
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    const mobilePath = 'C:/Users/USER/.gemini/antigravity-ide/brain/e9b5bf20-215b-4372-a77e-57d8d0e2cf5c/local_mobile_redesign.png';
    await page.screenshot({ path: mobilePath, fullPage: true });
    console.log(`📱 Mobile screenshot saved: ${mobilePath}`);

    await browser.close();
    server.close();
  });
})();
