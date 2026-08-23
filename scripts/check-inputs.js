const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://jagestore.shop', { waitUntil: 'networkidle' });

  const inputsHtml = await page.$$eval('input', inputs => inputs.map(i => i.outerHTML));
  console.log('ALL INPUTS:');
  console.log(inputsHtml.join('\n'));

  await browser.close();
})();
