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

// --- WHATSAPP (Fonnte) ---
function normalizePhone(raw) {
  let phone = raw.replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) phone = '62' + phone.slice(1);
  if (!phone.startsWith('62')) phone = '62' + phone;
  return phone;
}

async function sendWhatsApp(rawPhone, message) {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    console.log('[notify] FONNTE_TOKEN belum diisi, lewati kirim WhatsApp.');
    return;
  }

  const target = normalizePhone(rawPhone);

  try {
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ target, message }),
    });
    const data = await res.json();
    if (data.status) {
      console.log(`[notify] WhatsApp terkirim ke ${target}`);
    } else {
      console.error('[notify] Fonnte menolak pesan:', JSON.stringify(data));
    }
  } catch (err) {
    console.error('[notify] Gagal kirim WhatsApp:', err.message);
  }
}

// --- Helper utama: kirim ke email ATAU WhatsApp tergantung format contact ---
async function notifyCustomer(contact, { subject, message, html }) {
  if (!contact) return;

  if (contact.includes('@')) {
    await sendEmail(contact, subject, html || `<p>${message}</p>`);
  } else {
    await sendWhatsApp(contact, message);
  }
}

module.exports = { sendEmail, sendWhatsApp, notifyCustomer };
