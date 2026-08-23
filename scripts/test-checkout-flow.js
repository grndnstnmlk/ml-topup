const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log('🧪 Running Complete E2E Checkout Flow with exact selectors on https://jagestore.shop ...\n');

  page.on('console', msg => console.log(`[Browser Console ${msg.type()}]`, msg.text()));
  page.on('pageerror', err => console.log(`[Page Error]`, err.message));

  page.on('response', async resp => {
    if (resp.url().includes('/api/')) {
      try {
        const text = await resp.text();
        console.log(`[API ${resp.status()}] ${resp.request().method()} ${resp.url()}\n -> ${text.slice(0, 300)}`);
      } catch(e) {}
    }
  });

  await page.goto('https://jagestore.shop', { waitUntil: 'networkidle' });

  // 1. Fill Account Details
  console.log('1️⃣ Inputting User ID & Zone ID...');
  await page.fill('#game_user_id', '602810859');
  await page.fill('#game_zone_id', '8408');
  await page.locator('#game_zone_id').blur();
  
  // Wait to see if check-id API was triggered
  await page.waitForTimeout(2000);

  // Check username display if available
  const userCheckResult = await page.$('#user-nickname, #check-result, .id-result, .username');
  if (userCheckResult) {
    console.log('   Username text:', await userCheckResult.innerText());
  }

  // 2. Select Product
  console.log('\n2️⃣ Selecting Diamond Package...');
  const product = page.locator('.product-card').first();
  await product.click();
  const productText = await product.innerText();
  console.log('   Selected:', productText.replace(/\n/g, ' '));

  // 3. Select Payment
  console.log('\n3️⃣ Selecting Payment Method...');
  const payment = page.locator('.payment-channel-card').first();
  await payment.click();

  // 4. Fill Contact / Email
  console.log('\n4️⃣ Filling Contact Info...');
  await page.fill('#contact', 'testuser@gmail.com');

  // 5. Submit Order
  console.log('\n5️⃣ Clicking "Pesan Sekarang" button...');
  const payBtn = page.locator('#pay-button');
  await payBtn.click();

  await page.waitForTimeout(3000);

  // 6. Check for confirmation modal / redirection
  console.log('\n6️⃣ Checking Order Modal / Confirmation State...');
  const modal = page.locator('.modal, .modal-backdrop, .popup, #orderModal, .confirm-modal, .swal2-container');
  const count = await modal.count();
  console.log(`   Found ${count} modal elements`);
  if (count > 0) {
    console.log('   Modal Visible:', await modal.first().isVisible());
    console.log('   Modal Text:\n' + (await modal.first().innerText()));
  }

  // 7. Check current URL (in case of redirect)
  console.log('   Current Page URL:', page.url());

  // Capture final screenshot
  const artifactDir = 'C:/Users/USER/.gemini/antigravity-ide/brain/e9b5bf20-215b-4372-a77e-57d8d0e2cf5c';
  await page.screenshot({ path: `${artifactDir}/jagestore_after_order.png`, fullPage: true });
  console.log(`📸 Screenshot saved: ${artifactDir}/jagestore_after_order.png`);

  await browser.close();
  console.log('\n✅ Debug E2E test finished!');
})();
