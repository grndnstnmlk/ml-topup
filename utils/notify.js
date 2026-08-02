const nodemailer = require('nodemailer');

// --- EMAIL (Gmail SMTP via Nodemailer) ---
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) return null;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  return transporter;
}

async function sendEmail(to, subject, html) {
  const t = getTransporter();
  if (!t) {
    console.log('[notify] GMAIL_USER/GMAIL_APP_PASSWORD belum diisi, lewati kirim email.');
    return;
  }

  try {
    await t.sendMail({
      from: `"GREEND TOP UP" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[notify] Email terkirim ke ${to}`);
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
