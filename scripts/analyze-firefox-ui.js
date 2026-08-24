const fs = require('fs');
const path = require('path');

const ws = new WebSocket('ws://127.0.0.1:9222/session');

let id = 1;
function send(method, params = {}) {
  const currentId = id++;
  const msg = JSON.stringify({ id: currentId, method, params });
  ws.send(msg);
  return currentId;
}

let pending = {};
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const currentId = send(method, params);
    pending[currentId] = { resolve, reject };
  });
}

ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.id && pending[data.id]) {
    if (data.error || data.type === 'error') {
      pending[data.id].reject(new Error(JSON.stringify(data)));
    } else {
      pending[data.id].resolve(data);
    }
    delete pending[data.id];
  }
};

ws.onerror = (err) => {
  console.error('WS Error:', err);
};

ws.onopen = async () => {
  try {
    console.log('Connected to Firefox BiDi port 9222.');
    
    // Check status or create session
    let sessionId = null;
    try {
      const init = await call('session.new', { capabilities: {} });
      sessionId = init.result?.sessionId;
      console.log('New session created:', sessionId);
    } catch (err) {
      console.log('Session new failed/already active, attempting session.end then retry...');
      try {
        await call('session.end', {});
        const retryInit = await call('session.new', { capabilities: {} });
        sessionId = retryInit.result?.sessionId;
        console.log('Session recreated:', sessionId);
      } catch (e2) {
        console.log('Could not recreate session, trying direct calls...');
      }
    }

    const tree = await call('browsingContext.getTree', {});
    console.log('Tree structure:', JSON.stringify(tree.result, null, 2));

    const artifactDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\d153c2a4-83c8-4e41-87a1-761f9f419be1';
    if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

    // Collect all contexts
    const allContexts = [];
    function traverse(list) {
      for (const item of list) {
        allContexts.push(item);
        if (item.children && item.children.length) {
          traverse(item.children);
        }
      }
    }
    traverse(tree.result.contexts);

    console.log(`Found ${allContexts.length} browsing contexts in Firefox.`);

    for (let i = 0; i < allContexts.length; i++) {
      const ctx = allContexts[i];
      console.log(`\n--- Inspecting Context [${i}] (${ctx.context}): ${ctx.url} ---`);
      
      // Capture screenshot if top level or meaningful frame
      try {
        const ss = await call('browsingContext.captureScreenshot', { context: ctx.context });
        if (ss.result?.data) {
          const imgName = `firefox_context_${i}_${ctx.context.slice(0, 8)}.png`;
          const imgPath = path.join(artifactDir, imgName);
          fs.writeFileSync(imgPath, Buffer.from(ss.result.data, 'base64'));
          console.log(`📸 Screenshot saved: ${imgPath}`);
        }
      } catch (ssErr) {
        console.log(`Screenshot skipped for context ${ctx.context}: ${ssErr.message}`);
      }

      // Evaluate DOM inspection
      try {
        const evalRes = await call('script.evaluate', {
          expression: `(() => {
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, .title, [class*="heading"], [class*="header"]')).map(el => ({
              tag: el.tagName,
              class: el.className,
              text: el.innerText ? el.innerText.trim().slice(0, 100) : ''
            })).filter(h => h.text);

            const buttons = Array.from(document.querySelectorAll('button, a.btn, [role="button"], input[type="button"], input[type="submit"]')).map(b => ({
              tag: b.tagName,
              id: b.id,
              class: b.className,
              text: b.innerText ? b.innerText.trim() : (b.value || ''),
              disabled: b.disabled || b.getAttribute('aria-disabled') === 'true'
            })).filter(b => b.text || b.id || b.class);

            const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(i => ({
              tag: i.tagName,
              type: i.type,
              id: i.id,
              name: i.name,
              placeholder: i.placeholder,
              value: i.value ? i.value.slice(0, 50) : ''
            }));

            const textSnippets = document.body ? document.body.innerText.split('\\n').map(s => s.trim()).filter(s => s.length > 2).slice(0, 30) : [];

            return JSON.stringify({
              url: window.location.href,
              title: document.title,
              viewport: { width: window.innerWidth, height: window.innerHeight },
              hasCanvas: !!document.querySelector('canvas'),
              canvases: Array.from(document.querySelectorAll('canvas')).map(c => ({ width: c.width, height: c.height, id: c.id, class: c.className })),
              headings: headings.slice(0, 15),
              buttons: buttons.slice(0, 20),
              inputs: inputs.slice(0, 20),
              textSnippets: textSnippets,
              domStructureSummary: {
                totalElements: document.querySelectorAll('*').length,
                iframes: document.querySelectorAll('iframe').length,
                images: document.querySelectorAll('img').length
              }
            });
          })()`,
          target: { context: ctx.context },
          awaitPromise: true,
          resultOwnership: 'root'
        });

        if (evalRes.result?.value) {
          const parsed = JSON.parse(evalRes.result.value);
          console.log('DOM Details:', JSON.stringify(parsed, null, 2));
        } else if (evalRes.result) {
          console.log('Eval Result raw:', JSON.stringify(evalRes.result, null, 2));
        }
      } catch (evalErr) {
        console.log(`DOM eval failed on context ${ctx.context}:`, evalErr.message);
      }
    }

    // Clean up session
    try {
      await call('session.end', {});
    } catch (e) {}

    ws.close();
    process.exit(0);
  } catch (err) {
    console.error('Error during execution:', err);
    try { ws.close(); } catch (e) {}
    process.exit(1);
  }
};
