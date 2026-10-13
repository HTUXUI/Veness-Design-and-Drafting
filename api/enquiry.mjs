// Enquiry endpoint: POST /api/enquiry  (Vercel-style Node function: export default (req, res))
// Validates on the server, then emails the enquiry to the business inbox through Resend.
// Success is only reported once Resend has accepted the message.
//
// Environment variables:
//   RESEND_API_KEY   required. API key from resend.com (keep it out of client code)
//   ENQUIRY_TO       optional. Default: chris@venessdesign.com.au
//   ENQUIRY_FROM     required in production. A sender on a domain verified in Resend,
//                    e.g. "Veness website <enquiries@venessdesign.com.au>"
//   RESEND_API_URL   optional. Override for testing only.

const TO = process.env.ENQUIRY_TO || 'chris@venessdesign.com.au';
const TYPES = ['New home', 'Renovation/extension', 'Interiors', 'Drafting/documentation', 'Not sure yet'];
const hits = new Map(); // best-effort per-instance rate limit: 5 enquiries / 10 minutes / IP

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clean = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '');

function validate(b) {
  const d = {
    name: clean(b.name, 120), email: clean(b.email, 200), phone: clean(b.phone, 40), suburb: clean(b.suburb, 120),
    type: clean(b.type, 60), message: clean(b.message, 5000), contact: clean(b.contact, 10),
  };
  const errors = {};
  if (!d.name) errors.name = 'Enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) errors.email = 'Enter a valid email address.';
  if (d.phone && !/^\+?[0-9 ()\-]{8,20}$/.test(d.phone)) errors.phone = 'Enter a valid phone number.';
  if (d.contact && !['Email', 'Phone'].includes(d.contact)) errors.contact = 'Choose Email or Phone.';
  if (d.contact === 'Phone' && !d.phone) errors.phone = 'Enter a phone number, or choose Email.';
  if (!d.suburb) errors.suburb = 'Enter the location of your project.';
  if (!TYPES.includes(d.type)) errors.type = 'Choose a project type.';
  if (!d.message) errors.message = 'Tell us about your ideas.';
  return { d, errors };
}

const send = (res, status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(body)); };

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 50_000) throw new Error('too large'); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { ok: false }); }

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 600_000);
  if (recent.length >= 5) return send(res, 429, { ok: false });

  let body;
  try { body = await readBody(req); } catch { return send(res, 400, { ok: false }); }
  if (body.company) return send(res, 200, { ok: true }); // honeypot: silently drop bots

  const { d, errors } = validate(body);
  if (Object.keys(errors).length) return send(res, 422, { ok: false, errors });

  const key = process.env.RESEND_API_KEY;
  const from = process.env.ENQUIRY_FROM;
  if (!key || !from) return send(res, 503, { ok: false }); // not configured: the form shows its failure message

  recent.push(now); hits.set(ip, recent);

  const rows = [['Name', d.name], ['Email', d.email], ['Phone', d.phone || 'Not given'], ['Project location', d.suburb], ['Project type', d.type], ['Preferred contact', d.contact || 'No preference']];
  const html = `<h2>New project enquiry</h2><table cellpadding="6">${rows.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v)}</td></tr>`).join('')}</table><h3>Ideas</h3><p style="white-space:pre-wrap">${esc(d.message)}</p><p style="color:#666">Sent from the Veness website enquiry form. Reply to this email to reach ${esc(d.name)}.</p>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nIdeas:\n${d.message}\n`;

  try {
    const r = await fetch(process.env.RESEND_API_URL || 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [TO], reply_to: d.email, subject: `New project enquiry: ${d.type}, ${d.suburb}`, html, text }),
    });
    if (!r.ok) { console.error('enquiry: mail provider returned', r.status); return send(res, 502, { ok: false }); }
    return send(res, 200, { ok: true });
  } catch {
    console.error('enquiry: mail provider unreachable');
    return send(res, 502, { ok: false });
  }
}
