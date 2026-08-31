const db = require('../db');

const STALE_PENDING_DAYS = 3;

async function deleteStalePendingOrders() {
  try {
    const result = await db.run(
      `DELETE FROM orders WHERE status = 'pending' AND created_at < datetime('now', ?)` ,
      [`-${STALE_PENDING_DAYS} days`]
    );

    if (result.changes > 0) {
      console.log(`[cleanup] Menghapus ${result.changes} order pending yang sudah lewat ${STALE_PENDING_DAYS} hari.`);
    }

    return result.changes;
  } catch (err) {
    console.error('[cleanup] Gagal cleanup pending orders:', err.message);
    return 0;
  }
}

module.exports = { deleteStalePendingOrders, STALE_PENDING_DAYS };
