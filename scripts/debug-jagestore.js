const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🚀 Starting Playwright Debug on https://jagestore.shop ...');
  
  const browser = await chromium.launch({
    headless: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  const consoleLogs = [];
  const networkErrors = [];
  const successfulRequests = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleLogs.push({ type, text });
    console.log(`[Browser Console ${type.toUpperCase()}] ${text}`);
  });

  page.on('pageerror', err => {
    console.log(`[Page Error] ${err.message}`);
    consoleLogs.push({ type: 'pageerror', text: err.message });
  });

  page.on('response', resp => {
    const status = resp.status();
    const url = resp.url();
    if (status >= 400) {
      networkErrors.push({ url, status, statusText: resp.statusText() });
      console.log(`[Network Error ${status}] ${url}`);
    } else {
      successfulRequests.push({ url, status });
    }
  });

  page.on('requestfailed', req => {
    networkErrors.push({ url: req.url(), failure: req.failure() ? req.failure().errorText : 'Failed' });
    console.log(`[Request Failed] ${req.url()} - ${req.failure() ? req.failure().errorText : ''}`);
  });

  try {
    console.log('📡 Navigating to https://jagestore.shop ...');
    const startTime = Date.now();
    const response = await page.goto('https://jagestore.shop', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    const loadDuration = Date.now() - startTime;
    console.log(`⏱️ Page loaded in ${loadDuration}ms with HTTP Status: ${response ? response.status() : 'N/A'}`);

    const title = await page.title();
    console.log(`📄 Page Title: "${title}"`);

    // Let's inspect critical elements on the page
    const checks = {};

    // 1. Check User ID & Zone ID inputs
    const idInput = await page.$('input[placeholder*="ID" i], input[name*="user" i], input[id*="user" i], #userId');
    const zoneInput = await page.$('input[placeholder*="Zone" i], input[placeholder*="Server" i], input[name*="zone" i], #zoneId');
    checks.userIdInput = !!idInput;
    checks.zoneIdInput = !!zoneInput;

    // 2. Check Product / Diamond options
    const productCards = await page.$$('.product-card, .item-card, [data-product], .diamond-item, .nominal-card');
    checks.productCardsCount = productCards.length;

    // 3. Check Payment methods
    const paymentCards = await page.$$('.payment-card, .payment-item, [data-payment], .method-card, input[name="payment"]');
    checks.paymentMethodsCount = paymentCards.length;

    // 4. Check Submit button
    const submitBtn = await page.$('button[type="submit"], #btn-order, #btn-submit, .btn-primary, button:has-text("Beli"), button:has-text("Order"), button:has-text("Bayar")');
    checks.hasSubmitButton = !!submitBtn;

    console.log('🔍 Element Inspection Results:', JSON.stringify(checks, null, 2));

    // Capture screenshot
    const artifactDir = 'C:/Users/USER/.gemini/antigravity-ide/brain/e9b5bf20-215b-4372-a77e-57d8d0e2cf5c';
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
    const screenshotPath = path.join(artifactDir, 'jagestore_preview.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Full-page screenshot saved to: ${screenshotPath}`);

    // Mobile Viewport Test
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    const mobileScreenshotPath = path.join(artifactDir, 'jagestore_mobile_preview.png');
    await page.screenshot({ path: mobileScreenshotPath, fullPage: true });
    console.log(`📱 Mobile screenshot saved to: ${mobileScreenshotPath}`);

    console.log('\n--- SUMMARY ---');
    console.log(`Total Console Messages: ${consoleLogs.length}`);
    console.log(`Total Network Errors: ${networkErrors.length}`);
    if (networkErrors.length > 0) {
      console.log('Network Errors Detail:', JSON.stringify(networkErrors, null, 2));
    }
    console.log('DEBUG COMPLETED SUCCESSFULLY.');

  } catch (err) {
    console.error('❌ Debugging encountered an error:', err);
  } finally {
    await browser.close();
  }
})();
