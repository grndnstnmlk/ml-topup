const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const artifactDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\d153c2a4-83c8-4e41-87a1-761f9f419be1';
  const logoIconSvg = fs.readFileSync(path.join(__dirname, '..', 'public', 'assets', 'logo-icon.svg'), 'utf8');
  const logoFullSvg = fs.readFileSync(path.join(__dirname, '..', 'public', 'assets', 'logo.svg'), 'utf8');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@700&family=Outfit:wght@900&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 0;
          padding: 40px;
          background: #060912;
          color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 36px;
        }
        .header {
          text-align: center;
        }
        .title {
          font-family: 'Outfit', sans-serif;
          font-size: 28px;
          font-weight: 900;
          color: #38bdf8;
          margin-bottom: 6px;
          letter-spacing: 2px;
        }
        .subtitle {
          color: #94a3b8;
          font-size: 14px;
        }
        .grid {
          display: flex;
          gap: 30px;
          align-items: center;
          justify-content: center;
          max-width: 1000px;
          width: 100%;
        }
        .card {
          background: #0c111e;
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 12px 36px rgba(0,0,0,0.6), 0 0 20px rgba(2, 132, 199, 0.15);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .icon-box {
          width: 200px;
          height: 200px;
        }
        .full-box {
          width: 600px;
          height: 145px;
        }
        .label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          color: #38bdf8;
          text-transform: uppercase;
          letter-spacing: 1px;
          background: rgba(2, 132, 199, 0.15);
          padding: 4px 10px;
          border-radius: 6px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">JAGESTORE BRAND IDENTITY SYSTEM</div>
        <div class="subtitle">Official Vector Esports & Diamond Top-Up Brand Mark</div>
      </div>
      <div class="grid">
        <div class="card">
          <span class="label">App Icon / Emblem</span>
          <div class="icon-box">${logoIconSvg}</div>
        </div>
        <div class="card">
          <span class="label">Full Horizontal Wordmark</span>
          <div class="full-box">${logoFullSvg}</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1100, height: 480 } });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const previewPath = path.join(artifactDir, 'jagestore_logo_presentation.png');
  await page.screenshot({ path: previewPath });
  console.log(`Logo preview saved to: ${previewPath}`);

  // Also save clean standalone icon png
  const iconCard = await page.$('.icon-box');
  if (iconCard) {
    const iconPngPath = path.join(artifactDir, 'logo_icon.png');
    await iconCard.screenshot({ path: iconPngPath });
  }

  await browser.close();
})();
