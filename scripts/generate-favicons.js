const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const publicDir = path.join(__dirname, '..', 'public');
  const svgContent = fs.readFileSync(path.join(publicDir, 'assets', 'logo-icon.svg'), 'utf8');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: 512px; height: 512px; display: flex; align-items: center; justify-content: center; background: transparent; }
        svg { width: 512px; height: 512px; }
      </style>
    </head>
    <body>
      ${svgContent}
    </body>
    </html>
  `;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.setContent(html);

  // 1. Render 512x512 PNG
  const p512 = path.join(publicDir, 'favicon-512x512.png');
  await page.screenshot({ path: p512, omitBackground: true });

  // 2. Render 192x192 PNG
  await page.setViewportSize({ width: 192, height: 192 });
  await page.setContent(`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;}body{width:192px;height:192px;}svg{width:192px;height:192px;}</style></head><body>${svgContent}</body></html>`);
  const p192 = path.join(publicDir, 'favicon-192x192.png');
  await page.screenshot({ path: p192, omitBackground: true });

  // 3. Render 180x180 Apple Touch Icon
  await page.setViewportSize({ width: 180, height: 180 });
  await page.setContent(`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;}body{width:180px;height:180px;}svg{width:180px;height:180px;}</style></head><body>${svgContent}</body></html>`);
  const p180 = path.join(publicDir, 'apple-touch-icon.png');
  await page.screenshot({ path: p180, omitBackground: true });

  // 4. Render 96x96
  await page.setViewportSize({ width: 96, height: 96 });
  await page.setContent(`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;}body{width:96px;height:96px;}svg{width:96px;height:96px;}</style></head><body>${svgContent}</body></html>`);
  const p96 = path.join(publicDir, 'favicon-96x96.png');
  await page.screenshot({ path: p96, omitBackground: true });

  // 5. Render 48x48 (Google Favicon Official Multiple)
  await page.setViewportSize({ width: 48, height: 48 });
  await page.setContent(`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;}body{width:48px;height:48px;}svg{width:48px;height:48px;}</style></head><body>${svgContent}</body></html>`);
  const p48 = path.join(publicDir, 'favicon-48x48.png');
  await page.screenshot({ path: p48, omitBackground: true });

  // 6. Copy 48x48 as favicon.ico
  fs.copyFileSync(p48, path.join(publicDir, 'favicon.ico'));
  fs.copyFileSync(p48, path.join(publicDir, 'favicon.png'));

  console.log('✅ Generated favicon.ico, favicon-48x48.png, favicon-96x96.png, favicon-192x192.png, apple-touch-icon.png');
  await browser.close();
})();
