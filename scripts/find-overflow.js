const { firefox, devices } = require('playwright');
const express = require('express');
const path = require('path');

(async () => {
  const app = express();
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.get('/api/config', (req, res) => res.json({ payment_method: 'qris_manual' }));
  app.get('/api/products/games', (req, res) => res.json(['mobile-legends']));
  app.get('/api/products', (req, res) => res.json([]));

  const port = 3599;
  const server = app.listen(port, async () => {
    const browser = await firefox.launch({ headless: true });
    const iPhone = devices['iPhone 14'];
    const page = await browser.newPage({ ...iPhone });
    await page.goto(`http://localhost:${port}`);

    const overflowingElements = await page.evaluate(() => {
      const vw = window.innerWidth;
      const elements = Array.from(document.querySelectorAll('*'));
      const offenders = [];
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.right > vw + 1 || rect.width > vw + 1) {
          offenders.push({
            tag: el.tagName,
            id: el.id,
            className: el.className,
            right: rect.right,
            width: rect.width,
            vw
          });
        }
      }
      return offenders;
    });

    console.log('Overflowing elements count:', overflowingElements.length);
    console.log('Top offenders:', overflowingElements.slice(0, 10));

    await browser.close();
    server.close();
    process.exit(0);
  });
})();
