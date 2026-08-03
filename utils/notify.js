// --- EMAIL (Resend API — HTTP based, tidak kena blokir port SMTP) ---
async function sendEmail(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'GREEND TOP UP <onboarding@resend.dev>';

  if (!apiKey) {
    console.log('[notify] RESEND_API_KEY belum diisi, lewati kirim email.');
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[notify] Resend menolak email:', JSON.stringify(data));
      return;
    }
    console.log(`[notify] Email terkirim ke ${to} (id: ${data.id})`);
  } catch (err) {
    console.error('[notify] Gagal kirim email:', err.message);
  }
}

// --- Helper utama: kirim notifikasi ke email pelanggan ---
async function notifyCustomer(contact, { subject, message, html }) {
  if (!contact) return;
  await sendEmail(contact, subject, html || `<p>${message}</p>`);
}

module.exports = { sendEmail, notifyCustomer };
