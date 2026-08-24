const assert = require('assert');
const http = require('http');
const {
  normalizePhoneNumber,
  isPhoneNumber,
  sendWhatsApp,
  notifyCustomer,
} = require('../utils/notify');

(async () => {
  console.log('🧪 Testing WhatsApp Gateway Engine & Smart Dispatcher...\n');

  // 1. Phone number normalizer testing
  console.log('1️⃣ Testing Phone Number Normalization...');
  assert.strictEqual(normalizePhoneNumber('081295713923', '62'), '6281295713923');
  assert.strictEqual(normalizePhoneNumber('+6281295713923', '62'), '6281295713923');
  assert.strictEqual(normalizePhoneNumber('6281295713923', '08'), '081295713923');
  assert.strictEqual(normalizePhoneNumber('81295713923', '62'), '6281295713923');
  console.log('   ✓ normalizePhoneNumber passes all format conversions!');

  // 2. Phone detection testing
  console.log('\n2️⃣ Testing Contact Type Detection...');
  assert.strictEqual(isPhoneNumber('081295713923'), true);
  assert.strictEqual(isPhoneNumber('+6281295713923'), true);
  assert.strictEqual(isPhoneNumber('6281295713923'), true);
  assert.strictEqual(isPhoneNumber('0812-9571-3923'), true);
  assert.strictEqual(isPhoneNumber('user@example.com'), false);
  console.log('   ✓ isPhoneNumber accurately distinguishes phones vs emails!');

  // 3. Mock Fonnte Server Test
  console.log('\n3️⃣ Testing Fonnte Gateway Integration with Mock Server...');
  let receivedFonntePayload = null;
  let receivedFonnteAuth = null;

  const mockFonnteServer = http.createServer((req, res) => {
    receivedFonnteAuth = req.headers.authorization;
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      receivedFonntePayload = JSON.parse(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: true, id: 'fonnte-msg-12345' }));
    });
  });

  const fonntePort = 3691;
  await new Promise(resolve => mockFonnteServer.listen(fonntePort, resolve));

  process.env.WA_GATEWAY_PROVIDER = 'fonnte';
  process.env.WA_API_TOKEN = 'test-fonnte-token';
  process.env.WA_API_URL = `http://localhost:${fonntePort}`;

  const resFonnte = await notifyCustomer('081295713923', {
    subject: 'Tagihan Top Up',
    message: '*Halo Gamers!* Tagihan pesanan MLTOP-100 sebesar Rp31.010.',
  });

  assert.strictEqual(resFonnte.success, true);
  assert.strictEqual(receivedFonnteAuth, 'test-fonnte-token');
  assert.strictEqual(receivedFonntePayload.target, '081295713923');
  assert.ok(receivedFonntePayload.message.includes('Rp31.010'));
  console.log('   ✓ Fonnte integration successfully validated!');

  mockFonnteServer.close();

  // 4. Mock Wablas Server Test
  console.log('\n4️⃣ Testing Wablas Gateway Integration with Mock Server...');
  let receivedWablasPayload = null;
  let receivedWablasAuth = null;

  const mockWablasServer = http.createServer((req, res) => {
    receivedWablasAuth = req.headers.authorization;
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      receivedWablasPayload = JSON.parse(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: true, message: 'Message queued' }));
    });
  });

  const wablasPort = 3692;
  await new Promise(resolve => mockWablasServer.listen(wablasPort, resolve));

  process.env.WA_GATEWAY_PROVIDER = 'wablas';
  process.env.WA_API_TOKEN = 'test-wablas-token';
  process.env.WA_API_URL = `http://localhost:${wablasPort}`;

  const resWablas = await notifyCustomer('+6281295713923', {
    subject: 'Diamond Sukses',
    message: '*TOP UP BERHASIL!* Diamond sudah masuk.',
  });

  assert.strictEqual(resWablas.success, true);
  assert.strictEqual(receivedWablasAuth, 'test-wablas-token');
  assert.strictEqual(receivedWablasPayload.phone, '6281295713923');
  assert.ok(receivedWablasPayload.message.includes('TOP UP BERHASIL!'));
  console.log('   ✓ Wablas integration successfully validated!');

  mockWablasServer.close();

  console.log('\n🎉 All WhatsApp Gateway tests passed with 100% success!');
  process.exit(0);
})();
