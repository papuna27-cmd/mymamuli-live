/**
 * POST /api/booking — the only write endpoint on the site.
 *
 * Runs as a Cloudflare Pages Function, so it is same-origin with the site:
 * no CORS, no second deploy, no extra DNS record. Everything it uses is on
 * Cloudflare's free tier.
 *
 * Layers, cheapest first, so junk is rejected before it costs anything:
 *   1. honeypot field      (free, catches naive bots)
 *   2. per-IP rate limit   (KV)
 *   3. Turnstile           (one call to Cloudflare)
 *   4. field validation
 *   5. write to D1, then notify by email
 */

interface Env {
  DB: D1Database;
  RATE: KVNamespace;
  TURNSTILE_SECRET?: string;
  RESEND_API_KEY?: string;
  NOTIFY_EMAIL?: string;
  FROM_EMAIL?: string;
}

interface BookingBody {
  type?: string;
  service?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  siteType?: string;
  unitCount?: string;
  address?: string;
  preferredDate?: string;
  preferredWindow?: string;
  details?: string;
  consent?: boolean;
  turnstileToken?: string;
  website?: string; // honeypot
}

const MAX_BODY = 16 * 1024;
const RATE_WINDOW = 3600; // both counters are per hour, per IP

/**
 * Two counters, because they guard different things.
 *
 * SUBMIT_LIMIT counts only bookings that were actually stored. A customer who
 * mistypes their email five times must not be locked out for an hour, so
 * rejected attempts never consume this budget.
 *
 * ATTEMPT_LIMIT counts every request that gets past the honeypot, to stop
 * someone hammering the endpoint. It is deliberately much looser.
 */
const SUBMIT_LIMIT = 5;
const ATTEMPT_LIMIT = 40;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Strip C0/C1 control characters so nothing odd reaches the database or email.
const CONTROL_RE = /[\u0000-\u001F\u007F-\u009F]/g;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const SERVICES = new Set(['assembly', 'delivery', 'moving', 'other']);
const TYPES = new Set(['residential', 'commercial']);
const WINDOWS = new Set(['morning', 'afternoon', 'evening', 'flexible']);

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extra,
    },
  });

const fail = (error: string, message: string, status = 400, extra: Record<string, string> = {}) =>
  json({ error, message }, status, extra);

/** Trim, cap length, and strip control characters before anything is stored. */
function clean(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.replace(CONTROL_RE, ' ').trim().slice(0, max);
}

function newId(): string {
  return 'b_' + crypto.randomUUID().replace(/-/g, '').slice(0, 24);
}

async function verifyTurnstile(secret: string, token: string, ip: string): Promise<boolean> {
  try {
    const form = new FormData();
    form.append('secret', secret);
    form.append('response', token);
    if (ip) form.append('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

/**
 * Notification email. Optional on purpose: if no key is configured, or the
 * provider is down, the booking is still stored and the customer still gets a
 * success page. We never lose a lead because email failed.
 */
async function notify(env: Env, id: string, b: BookingBody): Promise<void> {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return;

  const line = (k: string, v?: string | null) => (v ? `${k}: ${v}\n` : '');
  const text =
    `New ${b.type} request (${id})\n\n` +
    line('Name', b.name) +
    line('Phone', b.phone) +
    line('Email', b.email) +
    line('Company', b.company) +
    line('Site type', b.siteType) +
    line('Units / items', b.unitCount) +
    line('Service', b.service) +
    line('Address', b.address) +
    line('Preferred date', b.preferredDate) +
    line('Window', b.preferredWindow) +
    `\nDetails:\n${b.details || '(none)'}\n`;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'Assembleo <noreply@assembleo.ca>',
        to: [env.NOTIFY_EMAIL],
        reply_to: b.email,
        subject: `New ${b.type} request — ${b.name || 'no name'}`,
        text,
      }),
    });
  } catch {
    // Swallowed on purpose: the lead is already safe in D1.
  }
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  const ip = request.headers.get('CF-Connecting-IP') ?? '';

  // --- body ---------------------------------------------------------------
  if (Number(request.headers.get('Content-Length') ?? '0') > MAX_BODY) {
    return fail('VALIDATION_FAILED', 'That request is too large.', 413);
  }

  let body: BookingBody;
  try {
    body = (await request.json()) as BookingBody;
  } catch {
    return fail('VALIDATION_FAILED', 'We could not read that request.');
  }

  // --- 1. honeypot --------------------------------------------------------
  // Answer 200 so a bot cannot tell it was caught, but store nothing.
  if (clean(body.website, 200)) {
    return json({ bookingId: newId(), status: 'received' });
  }

  // --- 2. rate limit ------------------------------------------------------
  const submitKey = `sub:${ip}`;
  const attemptKey = `att:${ip}`;

  if (ip) {
    const [submits, attempts] = await Promise.all([
      env.RATE.get(submitKey).then((v) => Number(v ?? '0')),
      env.RATE.get(attemptKey).then((v) => Number(v ?? '0')),
    ]);

    if (submits >= SUBMIT_LIMIT || attempts >= ATTEMPT_LIMIT) {
      return fail(
        'RATE_LIMITED',
        'That is a lot of requests from one connection. Give it an hour, or call us.',
        429,
        { 'Retry-After': String(RATE_WINDOW) },
      );
    }
    ctx.waitUntil(
      env.RATE.put(attemptKey, String(attempts + 1), { expirationTtl: RATE_WINDOW }),
    );
  }

  // --- 3. Turnstile -------------------------------------------------------
  if (env.TURNSTILE_SECRET) {
    const token = clean(body.turnstileToken, 4096);
    if (!token || !(await verifyTurnstile(env.TURNSTILE_SECRET, token, ip))) {
      return fail(
        'VALIDATION_FAILED',
        'The anti-spam check did not pass. Reload the page and try again.',
      );
    }
  }

  // --- 4. validation ------------------------------------------------------
  const type = TYPES.has(String(body.type)) ? String(body.type) : 'residential';
  const service = SERVICES.has(String(body.service)) ? String(body.service) : 'other';
  const preferredWindow = WINDOWS.has(String(body.preferredWindow))
    ? String(body.preferredWindow)
    : 'flexible';

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 40);
  const address = clean(body.address, 300);
  const company = clean(body.company, 160);
  const siteType = clean(body.siteType, 80);
  const unitCount = clean(body.unitCount, 80);
  const preferredDate = clean(body.preferredDate, 20);
  const details = clean(body.details, 4000);

  const bad: string[] = [];
  if (name.length < 2) bad.push('name');
  if (!EMAIL_RE.test(email)) bad.push('email');
  if (phone.replace(/\D/g, '').length < 10) bad.push('phone');
  if (address.length < 5) bad.push('address');
  if (body.consent !== true) bad.push('consent');
  if (type === 'commercial' && company.length < 2) bad.push('company');
  if (preferredDate && !DATE_RE.test(preferredDate)) bad.push('preferredDate');

  if (bad.length) return fail('VALIDATION_FAILED', `Please check: ${bad.join(', ')}.`);

  // --- 5. store -----------------------------------------------------------
  const id = newId();
  try {
    await env.DB.prepare(
      `INSERT INTO bookings
         (id, created_at, type, service, name, email, phone, company, site_type,
          unit_count, address, preferred_date, preferred_window, details,
          consent, ip_country, user_agent)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, 1, ?15, ?16)`,
    )
      .bind(
        id,
        new Date().toISOString(),
        type,
        service,
        name,
        email,
        phone,
        company || null,
        siteType || null,
        unitCount || null,
        address,
        preferredDate || null,
        preferredWindow,
        details || null,
        request.headers.get('CF-IPCountry') ?? null,
        clean(request.headers.get('User-Agent'), 300) || null,
      )
      .run();
  } catch (e) {
    // Never tell the customer "received" when nothing was stored.
    console.error('booking insert failed', e);
    return fail('SERVER', 'We could not save that request. Please call us instead.', 500);
  }

  // Only a stored booking counts against the submission budget.
  if (ip) {
    ctx.waitUntil(
      env.RATE.get(submitKey).then((v) =>
        env.RATE.put(submitKey, String(Number(v ?? '0') + 1), { expirationTtl: RATE_WINDOW }),
      ),
    );
  }

  ctx.waitUntil(
    notify(env, id, {
      ...body,
      type,
      service,
      name,
      email,
      phone,
      address,
      details,
      company,
      siteType,
      unitCount,
      preferredDate,
      preferredWindow,
    }),
  );

  return json({ bookingId: id, status: 'received' });
};

/** Anything that is not a POST. */
export const onRequest: PagesFunction<Env> = async ({ request, next }) => {
  if (request.method === 'POST') return next();
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { Allow: 'POST, OPTIONS' } });
  }
  return json({ error: 'VALIDATION_FAILED', message: 'Use POST.' }, 405, {
    Allow: 'POST, OPTIONS',
  });
};
