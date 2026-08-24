const assert = require('assert');
const { notifyCustomer } = require('../utils/notify');

(async () => {
  console.log('🧪 Testing Email Notification Dispatcher...');

  const res = await notifyCustomer('gamer@gmail.com', {
    subject: 'Tagihan Pesanan MLTOP-TEST — JAGESTORE',
    message: 'Halo, pesanan top up 278 Diamonds kamu sudah dibuat. Total: Rp81.918.',
    html: '<p>Halo,</p><p>Pesanan kamu untuk <b>278 Diamonds</b> (Order <b>MLTOP-TEST</b>) sudah dibuat.</p>'
  });

  assert.strictEqual(res.success, true);
  console.log('✓ Email dispatcher test passed successfully!');
})();
