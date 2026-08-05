const db = require('../db');

const STALE_PENDING_DAYS = 3;

// Order yang masih 'pending' (belum dibayar / belum dikonfirmasi manual) lebih
// dari 3 hari dianggap ditinggal pembeli — dihapus biar dashboard admin nggak
// penuh sampah dan gampang dicari yang beneran perlu ditindaklanjuti.
function deleteStalePendingOrders() {
  const result = db
    .prepare(`DELETE FROM orders WHERE status = 'pending' AND created_at < datetime('now', ?)`)
    .run(`-${STALE_PENDING_DAYS} days`);

  if (result.changes > 0) {
    console.log(`[cleanup] Menghapus ${result.changes} order pending yang sudah lewat ${STALE_PENDING_DAYS} hari.`);
  }

  return result.changes;
}

module.exports = { deleteStalePendingOrders, STALE_PENDING_DAYS };
