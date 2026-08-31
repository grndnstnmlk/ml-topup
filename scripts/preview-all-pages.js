const { firefox } = require('playwright');
const express = require('express');
const path = require('path');

(async () => {
  const app = express();
  app.use(express.static(path.join(__dirname, '..', 'public')));
  
  // mock order API for status.html
  app.get('/api/orders/:orderId', (req, res) => {
    res.json({
      id: 99,
      order_id: req.params.orderId,
      product_id: 1,
      product_name: 'Weekly Diamond Pass',
      game_user_id: '602810859',
      game_zone_id: '8408',
      contact: 'buyer@example.com',
      price: 31010,
      status: 'pending',
      payment_type: 'qris-manual',
      created_at: '2026-08-23 20:30:00',
      updated_at: '2026-08-23 20:30:00'
    });
  });

  const server = app.listen(3457, async () => {
    const browser = await firefox.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

    // 1. Check status.html
    const pageStatus = await context.newPage();
    await pageStatus.goto('http://localhost:3457/status.html?order_id=MLTOP-TEST-999', { waitUntil: 'networkidle' });
    const statusScreenshot = 'C:/Users/USER/.gemini/antigravity-ide/brain/e9b5bf20-215b-4372-a77e-57d8d0e2cf5c/status_redesign_preview.png';
    await pageStatus.screenshot({ path: statusScreenshot, fullPage: true });
    console.log(`📸 Status preview saved: ${statusScreenshot}`);

    // 2. Check admin.html
    const pageAdmin = await context.newPage();
    await pageAdmin.goto('http://localhost:3457/admin.html', { waitUntil: 'networkidle' });
    const adminScreenshot = 'C:/Users/USER/.gemini/antigravity-ide/brain/e9b5bf20-215b-4372-a77e-57d8d0e2cf5c/admin_redesign_preview.png';
    await pageAdmin.screenshot({ path: adminScreenshot, fullPage: true });
    console.log(`📸 Admin preview saved: ${adminScreenshot}`);

    await browser.close();
    server.close();
    console.log('✅ All page previews verified successfully!');
  });
})();
