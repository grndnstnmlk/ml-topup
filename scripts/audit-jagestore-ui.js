const { firefox } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🚀 Starting Deep UI/UX Audit for https://jagestore.shop ...');
  
  const artifactDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\d153c2a4-83c8-4e41-87a1-761f9f419be1';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 850 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();

  try {
    await page.goto('https://jagestore.shop', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2000);

    // Desktop Full Page Screenshot
    const desktopPath = path.join(artifactDir, 'jagestore_desktop.png');
    await page.screenshot({ path: desktopPath, fullPage: true });
    console.log(`📸 Desktop screenshot saved: ${desktopPath}`);

    // Deep UI Analysis via DOM evaluation
    const uiData = await page.evaluate(() => {
      const getStyles = (el) => {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          fontFamily: cs.fontFamily,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          backgroundImage: cs.backgroundImage !== 'none' ? cs.backgroundImage.slice(0, 100) : 'none',
          borderRadius: cs.borderRadius,
          border: cs.border,
          boxShadow: cs.boxShadow !== 'none' ? cs.boxShadow : 'none',
          padding: cs.padding,
          margin: cs.margin,
          display: cs.display,
          gap: cs.gap
        };
      };

      // Header analysis
      const header = document.querySelector('header, nav, .navbar, .header');
      const logo = document.querySelector('header img, .navbar img, .logo');

      // Sections & Cards
      const sections = Array.from(document.querySelectorAll('section, .card, .container > div, .step-container, .box, [class*="section"]')).map(s => ({
        tag: s.tagName,
        className: s.className,
        id: s.id,
        heading: s.querySelector('h1, h2, h3, h4, .title, .step-title')?.innerText?.trim() || '',
        textSnippet: s.innerText?.trim().slice(0, 80).replace(/\n/g, ' ')
      })).filter(s => s.heading || s.textSnippet);

      // Color extraction from computed styles
      const colors = new Set();
      const bgColors = new Set();
      const fontFamilies = new Set();

      document.querySelectorAll('*').forEach(el => {
        const cs = window.getComputedStyle(el);
        if (cs.color && cs.color !== 'rgba(0, 0, 0, 0)') colors.add(cs.color);
        if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') bgColors.add(cs.backgroundColor);
        if (cs.fontFamily) fontFamilies.add(cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim());
      });

      // Product / Diamond items
      const productItems = Array.from(document.querySelectorAll('.product-item, .nominal-item, .item-card, [class*="nominal"], [class*="product"], [class*="item"]')).slice(0, 12).map(el => ({
        text: el.innerText.replace(/\n/g, ' | ').trim(),
        className: el.className,
        styles: getStyles(el)
      }));

      // Payment options
      const paymentItems = Array.from(document.querySelectorAll('[class*="pay" i], [class*="method" i], .payment-card')).slice(0, 10).map(el => ({
        text: el.innerText.replace(/\n/g, ' | ').trim(),
        className: el.className
      }));

      // Buttons
      const buttons = Array.from(document.querySelectorAll('button, .btn, a.button')).map(b => ({
        text: b.innerText.trim(),
        className: b.className,
        styles: getStyles(b)
      }));

      // Banner / Hero
      const banners = Array.from(document.querySelectorAll('img[src*="banner" i], .banner, .carousel, .hero')).map(b => ({
        tag: b.tagName,
        className: b.className,
        src: b.src || b.style.backgroundImage || ''
      }));

      return {
        title: document.title,
        bodyBg: window.getComputedStyle(document.body).backgroundColor,
        bodyColor: window.getComputedStyle(document.body).color,
        fontFamilies: Array.from(fontFamilies).slice(0, 8),
        uniqueColors: Array.from(colors).slice(0, 12),
        uniqueBgColors: Array.from(bgColors).slice(0, 12),
        header: {
          exists: !!header,
          className: header?.className || '',
          styles: getStyles(header)
        },
        sectionsCount: sections.length,
        sectionsSample: sections.slice(0, 8),
        productItemsSample: productItems.slice(0, 6),
        paymentItemsSample: paymentItems.slice(0, 6),
        buttonsSample: buttons.slice(0, 6),
        banners: banners
      };
    });

    console.log('UI Data Extracted:', JSON.stringify(uiData, null, 2));

    // Interaction Test - click first nominal if present
    const firstNominal = await page.$('.product-item, .nominal-item, [class*="nominal"], .item-card, button[class*="diamond"]');
    if (firstNominal) {
      await firstNominal.click();
      await page.waitForTimeout(500);
      console.log('Clicked first product/nominal item.');
    }

    // Capture Interaction Screenshot
    const interactionPath = path.join(artifactDir, 'jagestore_selected_state.png');
    await page.screenshot({ path: interactionPath });

    // Mobile Viewport (iPhone 14 Pro size: 393 x 852)
    await page.setViewportSize({ width: 393, height: 852 });
    await page.waitForTimeout(1000);
    const mobilePath = path.join(artifactDir, 'jagestore_mobile.png');
    await page.screenshot({ path: mobilePath, fullPage: true });
    console.log(`📱 Mobile screenshot saved: ${mobilePath}`);

    // Save detailed json analysis
    fs.writeFileSync(path.join(artifactDir, 'jagestore_ui_audit.json'), JSON.stringify(uiData, null, 2));

  } catch (err) {
    console.error('Error during UI analysis:', err);
  } finally {
    await browser.close();
  }
})();
