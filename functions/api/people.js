/**
 * /api/people — მაძიებლების ჩართულობა და ბლოკირება
 *
 *   GET  /api/people                    → სია, ჩართულობის მიხედვით დალაგებული
 *   GET  /api/people?tab=block          → მხოლოდ ბლოკის კანდიდატები
 *   POST /api/people {id, action}       → ok | block | unblock | ask | pause | resume
 *
 * ⚠️ ავტორიზაცია: x-admin-key header ან mm_sid სესია.
 *
 * ------------------------------------------------------------------
 * წესი: 10 შეთავაზება, 0 გახსნილი → ბლოკი.
 * AUTOBLOCK=1 → ავტომატურად. სხვა შემთხვევაში კანდიდატი ადმინკაში ჩნდება.
 * გადაწყვეტილებას ადამიანი იღებს. ორი მიზეზი:
 *
 *  1. დაბალი ჩართულობა ჩვენს ცუდ დამთხვევასაც შეიძლება ნიშნავდეს.
 *     ავტომატური ბლოკი ამ ხარვეზს სამუდამოდ დაგვიმალავდა.
 *  2. შეცდომით დაბლოკილი ადამიანი აღარ ბრუნდება — და არც გვეუბნება,
 *     რომ შევცდით. ე.ი. შეცდომას ვერასდროს გავიგებდით.
 *
 * თუ მაინც გინდა ავტომატიკა: env.AUTOBLOCK='1'.
 */
import { J, authed, denied, now, str } from './_util.js';
import { scoreReq, scoreUser, RULES } from './_engage.js';

export async function onRequestGet({ request, env }) {
  if (!await authed(request, env)) return denied();
  if (!env.DB) return J({ error: 'no-db' }, 500);

  const url = new URL(request.url);
  const tab = url.searchParams.get('tab') || 'all';
  const lim = Math.min(200, +url.searchParams.get('limit') || 80);

  /* მხოლოდ ისინი, ვისაც მოთხოვნა აქვს — გამყიდველს ეს არ ეხება */
  const rows = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.who, u.comp, u.status, u.created,
            u.last_seen, u.blocked_at, u.block_why, u.terms_v, u.terms_at
       FROM users u
      WHERE EXISTS (SELECT 1 FROM req r WHERE r.user_id = u.id)
      ORDER BY u.created DESC LIMIT ?1`
  ).bind(lim).all();

  const t = now();
  const out = [];

  for (const u of rows.results || []) {
    const rs = await env.DB.prepare(
      `SELECT id, status, created, sent_n, open_n, last_open, warned, warn_at
         FROM req WHERE user_id = ?1 ORDER BY created DESC`
    ).bind(u.id).all();

    const reqs = (rs.results || []).map(r => ({ ...r, score: scoreReq(r, t) }));
    const s = scoreUser(rs.results || [], t);

    out.push({
      id: u.id,
      email: u.email,
      name: u.name || '',
      who: u.who,
      comp: u.comp || null,
      status: u.status,
      created: u.created,
      lastSeen: u.last_seen || null,
      blockedAt: u.blocked_at || null,
      blockWhy: u.block_why || null,
      terms: u.terms_v ? { v: u.terms_v, at: u.terms_at } : null,
      ...s,
      reqs: reqs.map(r => ({
        id: r.id, status: r.status, created: r.created,
        offered: r.sent_n || 0, opened: r.open_n || 0,
        lastOpen: r.last_open || null, warned: r.warned || 0,
        tier: r.score.tier, why: r.score.why, action: r.score.action
      }))
    });
  }

  const filtered = tab === 'block' ? out.filter(x => x.verdict === 'block-candidate')
    : tab === 'watch' ? out.filter(x => x.verdict === 'watch' || x.verdict === 'block-candidate')
    : out;

  /* კანდიდატები ზემოთ — ადმინს სწორედ ისინი სჭირდება */
  const rank = { 'block-candidate': 0, watch: 1, ok: 2, new: 3 };
  filtered.sort((a, b) => (rank[a.verdict] - rank[b.verdict]) || (a.rate - b.rate));

  return J({
    rules: RULES,
    autoblock: env.AUTOBLOCK === '1',
    counts: {
      all: out.length,
      candidates: out.filter(x => x.verdict === 'block-candidate').length,
      watch: out.filter(x => x.verdict === 'watch').length,
      blocked: out.filter(x => x.status === 'blocked').length
    },
    people: filtered
  });
}

/* ---------- გადაწყვეტილება ---------- */
export async function onRequestPost({ request, env }) {
  if (!await authed(request, env)) return denied();
  if (!env.DB) return J({ error: 'no-db' }, 500);

  let b = {};
  try { b = await request.json() } catch (_) {}
  const id = str(b.id, 40);
  const action = str(b.action, 20);
  const why = str(b.why, 200);

  /* sweep — ყველას გადამოწმება ერთბაშად. id არ სჭირდება. */
  if (b.action === 'sweep') return sweep(env, b.dry === true);

  if (!id || !['block', 'unblock', 'ok', 'ask', 'pause', 'resume'].includes(action))
    return J({ error: 'bad-request' }, 400);

  const u = await env.DB.prepare(
    `SELECT id, email, status FROM users WHERE id=?1`
  ).bind(id).first();
  if (!u) return J({ error: 'not-found' }, 404);

  const t = now();
  const stmts = [];

  if (action === 'block') {
    stmts.push(
      env.DB.prepare(
        `UPDATE users SET status='blocked', blocked_at=?2, block_why=?3 WHERE id=?1`
      ).bind(id, t, why || 'გამოგზავნილ შეთავაზებებს არ ხსნიდა'),
      /* მისი აქტიური მოთხოვნები ჩერდება — თორემ ბლოკს აზრი არ აქვს */
      env.DB.prepare(
        `UPDATE req SET status='paused' WHERE user_id=?1 AND status IN ('active','pending')`
      ).bind(id),
      /* ⚠️ ადამიანს ვატყობინებთ და პასუხის საშუალებას ვაძლევთ.
         ჩუმად დაბლოკვა უსამართლოა და შეცდომასაც გვიმალავს. */
      env.DB.prepare(
        `INSERT INTO mailq (user_id,to_addr,kind,payload,created) VALUES (?1,?2,'blocked',?3,?4)`
      ).bind(id, u.email, JSON.stringify({ reason: why || '' }), t)
    );
  } else if (action === 'unblock') {
    stmts.push(
      env.DB.prepare(
        `UPDATE users SET status='active', blocked_at=NULL, block_why=NULL WHERE id=?1`
      ).bind(id)
    );
  } else if (action === 'ok') {
    /* „ეს ადამიანი წესრიგშია" — მრიცხველები ნულდება, აღარ შეგვაწუხებს */
    stmts.push(
      env.DB.prepare(`UPDATE req SET warned=0, warn_at=NULL WHERE user_id=?1`).bind(id)
    );
  } else if (action === 'ask') {
    /* კითხვა: „ეს შეთავაზებები შეესაბამებოდა?" — პასუხი ორივეს გვასწავლის */
    const rs = await env.DB.prepare(
      `SELECT id FROM req WHERE user_id=?1 AND status='active'`
    ).bind(id).all();
    for (const r of rs.results || []) {
      stmts.push(
        env.DB.prepare(`UPDATE req SET warned=1, warn_at=?2 WHERE id=?1`).bind(r.id, t),
        env.DB.prepare(
          `INSERT INTO mailq (user_id,to_addr,kind,payload,created) VALUES (?1,?2,'checkin',?3,?4)`
        ).bind(id, u.email, JSON.stringify({ reqId: r.id }), t)
      );
    }
  } else if (action === 'pause') {
    stmts.push(
      env.DB.prepare(
        `UPDATE req SET status='paused', warned=2 WHERE user_id=?1 AND status='active'`
      ).bind(id)
    );
  } else if (action === 'resume') {
    stmts.push(
      env.DB.prepare(
        `UPDATE req SET status='active', warned=0, warn_at=NULL
          WHERE user_id=?1 AND status='paused'`
      ).bind(id)
    );
  }

  stmts.push(
    env.DB.prepare(`INSERT INTO mod_log (kind,target,action,note,at) VALUES ('user',?1,?2,?3,?4)`)
      .bind(id, action, why || '', t)
  );

  await env.DB.batch(stmts);
  return J({ ok: true, id, action });
}


/* ══════════════════════════════════════════════════════════════════
 * sweep — ავტომატური გადამოწმება
 * ------------------------------------------------------------------
 *   POST /api/people {action:'sweep'}            → ბლოკავს
 *   POST /api/people {action:'sweep', dry:true}  → მხოლოდ აჩვენებს
 *
 * წესი: 10 შეთავაზება გაგზავნილი, არცერთი გახსნილი → ბლოკი.
 *
 * `dry:true` პირველად აუცილებლად გაუშვი — ნახავ, ვის დაბლოკავდა,
 * ისე რომ არაფერი შეიცვლება. თუ სია გონივრულია, მერე ნამდვილად გაუშვი.
 *
 * ავტომატურად ეშვება მხოლოდ თუ env.AUTOBLOCK='1'.
 * ხელით — ადმინკიდან ან ღამის Worker-იდან — ყოველთვის შეიძლება.
 * ══════════════════════════════════════════════════════════════════ */
export async function autoBlock(env) { return sweep(env, false) }

async function sweep(env, dry) {
  const t = now();
  const users = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.status
       FROM users u
      WHERE u.status = 'active'
        AND EXISTS (SELECT 1 FROM req r WHERE r.user_id = u.id)`
  ).all();

  const hit = [], stmts = [];

  for (const u of users.results || []) {
    const rs = await env.DB.prepare(
      `SELECT id, status, created, sent_n, open_n, warned, warn_at
         FROM req WHERE user_id = ?1`
    ).bind(u.id).all();

    const s = scoreUser(rs.results || [], t);
    if (!s.hard) continue;                       /* მხოლოდ მკაცრი წესი */

    hit.push({ id: u.id, email: u.email, name: u.name || '', why: s.why,
               offers: s.offers, opens: s.opens });

    if (dry) continue;

    stmts.push(
      env.DB.prepare(
        `UPDATE users SET status='blocked', blocked_at=?2, block_why=?3 WHERE id=?1`
      ).bind(u.id, t, s.why),
      env.DB.prepare(
        `UPDATE req SET status='paused' WHERE user_id=?1 AND status IN ('active','pending')`
      ).bind(u.id),
      /* ⚠️ შეტყობინება ავტომატურ ბლოკზეც იგზავნება.
         ჩუმად დაბლოკვა შეცდომას სამუდამოდ დაგვიმალავდა — ადამიანი
         უბრალოდ აღარ დაბრუნდებოდა და მიზეზსაც ვერ გავიგებდით. */
      env.DB.prepare(
        `INSERT INTO mailq (user_id,to_addr,kind,payload,created) VALUES (?1,?2,'blocked',?3,?4)`
      ).bind(u.id, u.email, JSON.stringify({ reason: s.why, auto: true }), t),
      env.DB.prepare(
        `INSERT INTO mod_log (kind,target,action,note,at) VALUES ('user',?1,'auto-block',?2,?3)`
      ).bind(u.id, s.why, t)
    );
  }

  if (stmts.length) await env.DB.batch(stmts);

  return J({
    ok: true, dry: !!dry,
    rule: `${RULES.BLOCK_OFFERS} შეთავაზება, 0 გახსნილი, მინიმუმ ${RULES.MIN_DAYS} დღე`,
    checked: (users.results || []).length,
    blocked: dry ? 0 : hit.length,
    would: dry ? hit.length : 0,
    people: hit
  });
}
