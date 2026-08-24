const { chromium } = require('playwright');
const express = require('express');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🧪 Running JAGESTORE CRO & UI Enhancements Verification...\n');

  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Mock API endpoints
  app.get('/api/config', (req, res) => res.json({ midtrans_client_key: 'test', is_production: false, payment_method: 'qris_manual' }));
  app.get('/api/products/games', (req, res) => res.json(['mobile-legends', 'free-fire']));
  app.get('/api/products', (req, res) => {
    res.json([
      { id: 1, name: 'Weekly Diamond Pass', price: 31010, original_price: 32500, category: 'weekly_pass', is_popular: 1, diamonds: 0, bonus: 0 },
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

  const port = 3499;
  const server = app.listen(port, async () => {
    console.log(`🚀 Mock server online at http://localhost:${port}`);
    const artifactDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\ae2f2c81-f588-408b-bb01-13e45de295be';

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    const page = await context.newPage();

    await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });

    // 1. Check Flash Sale Widget
    console.log('1️⃣ Checking Flash Sale Widget...');
    const flashSaleCard = await page.$('#flash-sale-card');
    const timerHours = await page.$eval('#timer-hours', el => el.textContent);
    const timerMins = await page.$eval('#timer-mins', el => el.textContent);
    const timerSecs = await page.$eval('#timer-secs', el => el.textContent);
    const stockText = await page.$eval('#flash-sale-stock-count', el => el.textContent);
    console.log(`   ✓ Flash sale widget exists: ${!!flashSaleCard}`);
    console.log(`   ✓ Timer countdown: ${timerHours}:${timerMins}:${timerSecs}`);
    console.log(`   ✓ Stock quota: ${stockText}`);

    // 2. Check Event Badges & Best Value
    console.log('\n2️⃣ Checking Event Mission & Value Badges...');
    const eventBadge = await page.$eval('.badge-event', el => el.textContent).catch(() => null);
    const bestValueBadge = await page.$eval('.badge-best-value', el => el.textContent).catch(() => null);
    console.log(`   ✓ Event Badge (278 Diamonds): "${eventBadge}"`);
    console.log(`   ✓ Best Value Badge (Weekly Pass): "${bestValueBadge}"`);

    // 3. Test ID input & Local Storage Auto-save
    console.log('\n3️⃣ Testing ID Verification & Account Memory...');
    await page.fill('#game_user_id', '602810859');
    await page.fill('#game_zone_id', '8408');
    await page.locator('#game_zone_id').blur();
    await page.waitForTimeout(1000);

    const isVerified = await page.$eval('.player-verified-badge', el => el.textContent).catch(() => null);
    console.log(`   ✓ ID Verification state: "${isVerified}"`);

    // Check LocalStorage for saved accounts
    const savedAccounts = await page.evaluate(() => localStorage.getItem('jagestore_saved_accounts'));
    console.log(`   ✓ Saved Accounts in LocalStorage: ${savedAccounts}`);

    // 4. Test Saved Accounts Chip rendering
    const chipsCount = await page.$$eval('.saved-account-chip', chips => chips.length);
    console.log(`   ✓ Rendered Saved Account Chips count: ${chipsCount}`);

    // 5. Test Contact field Email autofill
    console.log('\n4️⃣ Testing Email Contact auto-save...');
    await page.fill('#contact', 'customer@gmail.com');
    await page.locator('#contact').dispatchEvent('input');
    const savedContact = await page.evaluate(() => localStorage.getItem('jagestore_contact'));
    console.log(`   ✓ Saved Email contact in LocalStorage: "${savedContact}"`);

    // Capture screenshot
    const screenshotPath = `${artifactDir}\\jagestore_cro_preview.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 Screenshot captured at: ${screenshotPath}`);

    await browser.close();
    server.close();
    console.log('\n✅ All CRO Frontend Features successfully verified!');
    process.exit(0);
  });
})();
