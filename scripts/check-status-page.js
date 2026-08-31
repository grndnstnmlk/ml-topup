const { firefox } = require('playwright');

(async () => {
  const browser = await firefox.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🧪 Testing status.html page with an active order ...');
  await page.goto('https://jagestore.shop/status.html?order_id=MLTOP-1787489689021-AYPBNP', { waitUntil: 'networkidle' });

  const statusText = await page.innerText('body');
  console.log('Status Page Body Text:\n', statusText);

  const qrImage = await page.$('img[src*="qris" i], img[src*="qr" i], .qr-code, #qrcode');
  console.log('QR Code element present:', !!qrImage);

  await page.screenshot({ path: 'C:/Users/USER/.gemini/antigravity-ide/brain/e9b5bf20-215b-4372-a77e-57d8d0e2cf5c/jagestore_status_page.png', fullPage: true });

  await browser.close();
})();
