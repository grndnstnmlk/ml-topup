// ============================================================================
// NOTIFICATION DISPATCHER (Email Resend API & Optional WhatsApp)
// ============================================================================

/**
 * Normalisasi format nomor HP Indonesia
 */
function normalizePhoneNumber(phone, format = '62') {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^0-9]/g, '');

  if (cleaned.startsWith('08')) {
    cleaned = '628' + cleaned.slice(2);
  } else if (cleaned.startsWith('8')) {
    cleaned = '628' + cleaned.slice(1);
  }

  if (format === '08' && cleaned.startsWith('628')) {
    return '08' + cleaned.slice(3);
  }
  return cleaned;
}

/**
 * Deteksi apakah input string adalah nomor telepon atau email.
 */
function isPhoneNumber(contact) {
  if (!contact) return false;
  const cleaned = String(contact).trim().replace(/[\s-]/g, '');
  return /^(08|\+628|628)[0-9]{8,13}$/.test(cleaned);
}

// --- TEMPLATE EMAIL RESMI JAGESTORE ---
function formatEmailHtml(title, bodyHtml) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #0c111e; color: #f8fafc; border-radius: 14px; overflow: hidden; border: 1px solid rgba(148, 163, 184, 0.18); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="background: linear-gradient(135deg, #121826 0%, #182236 100%); padding: 22px 28px; border-bottom: 1px solid rgba(2, 132, 199, 0.3);">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="font-size: 1.4rem; font-weight: 800; color: #ffffff; letter-spacing: 0.05em;">JAGE<span style="color: #38bdf8;">STORE</span></span>
            </td>
            <td align="right">
              <span style="font-size: 0.75rem; font-weight: 600; color: #10b981; background: rgba(16, 185, 129, 0.15); padding: 4px 10px; border-radius: 99px; border: 1px solid rgba(16, 185, 129, 0.3);">● SISTEM OTOMATIS 24 JAM</span>
            </td>
          </tr>
        </table>
      </div>
      <div style="padding: 28px; line-height: 1.6; font-size: 0.95rem; color: #cbd5e1;">
        <h2 style="color: #ffffff; font-size: 1.2rem; margin-top: 0; margin-bottom: 16px; font-weight: 700;">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="background: #090d16; padding: 18px 28px; font-size: 0.76rem; color: #64748b; text-align: center; border-top: 1px solid rgba(148, 163, 184, 0.1);">
        <p style="margin: 0 0 6px;">Butuh bantuan pesanan? Hubungi CS WhatsApp di <a href="https://wa.me/6281295713923" style="color: #38bdf8; text-decoration: none;">+62 812-9571-3923</a></p>
        <p style="margin: 0;">© 2026 JAGESTORE. Layanan Top Up Game Resmi &amp; Terpercaya.</p>
      </div>
    </div>
  `;
}

// --- EMAIL (Resend API — HTTP based) ---
async function sendEmail(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'JAGESTORE <onboarding@resend.dev>';

  if (!apiKey) {
    console.log(`[notify:email] RESEND_API_KEY belum diisi, simulasi kirim email ke ${to}: "${subject}"`);
    return { success: true, simulated: true };
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

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[notify:email] Resend menolak email:', JSON.stringify(data));
      return { success: false, data };
    }
    console.log(`[notify:email] Email terkirim ke ${to} (id: ${data.id})`);
    return { success: true, data };
  } catch (err) {
    console.error('[notify:email] Gagal kirim email:', err.message);
    return { success: false, error: err.message };
  }
}

// --- WHATSAPP GATEWAY (Opsional jika diaktifkan) ---
async function sendWhatsApp(to, message) {
  const provider = (process.env.WA_GATEWAY_PROVIDER || 'fonnte').toLowerCase();
  const token = process.env.WA_API_TOKEN;

  if (!token) {
    console.log(`[notify:wa] WA_API_TOKEN belum diisi (${provider}), simulasi kirim WA ke ${to}`);
    return { success: true, simulated: true };
  }

  try {
    let url = '';
    let headers = {};
    let body = {};

    if (provider === 'fonnte') {
      const targetPhone = normalizePhoneNumber(to, '08');
      url = process.env.WA_API_URL || 'https://api.fonnte.com/send';
      headers = { Authorization: token, 'Content-Type': 'application/json' };
      body = { target: targetPhone, message: message, countryCode: '62' };
    } else if (provider === 'wablas') {
      const targetPhone = normalizePhoneNumber(to, '62');
      url = process.env.WA_API_URL || 'https://kudus.wablas.com/api/send-message';
      headers = { Authorization: token, 'Content-Type': 'application/json' };
      body = { phone: targetPhone, message: message };
    } else {
      const targetPhone = normalizePhoneNumber(to, '62');
      url = process.env.WA_API_URL;
      if (!url) return { success: false, error: 'WA_API_URL not configured' };
      headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      body = { to: targetPhone, phone: targetPhone, message: message };
    }

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, data };

    console.log(`[notify:wa] Pesan WhatsApp terkirim ke ${to} via ${provider}`);
    return { success: true, data };
  } catch (err) {
    console.error('[notify:wa] Gagal kirim WhatsApp:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Smart Notification Dispatcher:
 * Mengutamakan Email sebagai channel resmi utama, dengan dukungan WhatsApp bila kontak adalah nomor HP.
 */
async function notifyCustomer(contact, { subject, message, html }) {
  if (!contact) return;

  const cleanContact = String(contact).trim();

  if (cleanContact.includes('@')) {
    const emailBody = html || `<p>${message.replace(/\n/g, '<br>')}</p>`;
    const fullHtml = formatEmailHtml(subject, emailBody);
    return await sendEmail(cleanContact, subject, fullHtml);
  } else if (isPhoneNumber(cleanContact)) {
    const waText = message || subject;
    return await sendWhatsApp(cleanContact, waText);
  } else {
    console.warn(`[notify] Format kontak "${contact}" tidak valid.`);
  }
}

module.exports = {
  sendEmail,
  sendWhatsApp,
  notifyCustomer,
  normalizePhoneNumber,
  isPhoneNumber,
  formatEmailHtml,
};
