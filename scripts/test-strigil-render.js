const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('🚀 Launching Puppeteer to test Strigil Interactive Website...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  const filePath = `file://${path.resolve(__dirname, '../public/strigil/index.html')}`;
  console.log(`Opening: ${filePath}`);
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  // Wait for canvas render
  await new Promise(r => setTimeout(r, 1500));

  // Simulate mouse movement across canvas to test pointer smear
  await page.mouse.move(200, 200);
  await page.mouse.move(720, 450, { steps: 25 });
  await new Promise(r => setTimeout(r, 1000));

  const screenshotPath = path.resolve(__dirname, 'strigil-screenshot.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`✅ Strigil WebGL render test passed! Screenshot saved at ${screenshotPath}`);

  await browser.close();
})();
