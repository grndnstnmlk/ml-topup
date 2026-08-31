const { firefox } = require('playwright');

(async () => {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log('--- DEEP INSPECTION ---');
  await page.goto('https://jagestore.shop', { waitUntil: 'networkidle' });

  // Get all inputs
  const inputs = await page.$$eval('input, select, textarea', els => els.map(e => ({
    tagName: e.tagName,
    id: e.id,
    name: e.name,
    type: e.type,
    placeholder: e.placeholder,
    className: e.className
  })));
  console.log('Inputs found on page:', JSON.stringify(inputs, null, 2));

  // Get all buttons
  const buttons = await page.$$eval('button', els => els.map(e => ({
    id: e.id,
    className: e.className,
    text: e.innerText.trim()
  })));
  console.log('Buttons found on page:', JSON.stringify(buttons, null, 2));

  // Check section titles
  const sections = await page.$$eval('h1, h2, h3, h4, .section-title, .step-title', els => els.map(e => e.innerText.trim()));
  console.log('Section Headings:', sections);

  // Check payment method elements
  const paymentSections = await page.$$eval('[class*="pay" i], [id*="pay" i], [class*="method" i]', els => els.map(e => ({
    id: e.id,
    className: e.className,
    text: e.innerText.slice(0, 100).replace(/\n/g, ' ')
  })));
  console.log('Payment elements:', JSON.stringify(paymentSections.slice(0, 10), null, 2));

  // Check products loaded
  const productsSample = await page.$$eval('.product-item, .nominal-item, .item-card, [class*="product"], [class*="card"]', els => els.slice(0, 5).map(e => e.innerText.replace(/\n/g, ' ')));
  console.log('Sample product cards:', productsSample);

  await browser.close();
})();
