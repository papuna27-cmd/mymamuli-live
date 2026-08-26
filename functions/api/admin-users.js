/**
 * /api/admin-users — რეგისტრირებული მომხმარებლების მართვა (ადმინისთვის)
 *
 *   GET  /api/admin-users?q=<ძებნა>&limit=N
 *        → სია: სახელი, ელფოსტა, სრული ტელეფონი, სტატუსი, რეგისტრაცია,
 *          განცხადება/მოთხოვნის რაოდენობა.
 *   POST /api/admin-users {id, action, ...}
 *        action: block | unblock | comp_ok | edit | delete
 *
 * ⚠️ პაროლი აქ არსად ბრუნდება — ის PBKDF2-SHA256-ითაა ჰეშირებული,
 *    ცალმხრივად, აღდგენა ტექნიკურად შეუძლებელია (და არც უნდა იყოს).
 *    სრული ტელეფონი (phone_full) კი ჩანს — ეს განზრახაა, რომ ადმინმა
 *    დარეკოს გამოცხადებულ მომხმარებელს, თუ რამის დაზუსტება სჭირდება.
 */
import { J, authed, denied, str } from './_util.js';

export async function onRequestGet({ request, env }) {
  if (!await authed(request, env)) return denied();
  if (!env.DB) return J({ users: [], note: 'D1 არ არის მიბმული' });

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const limit = Math.min(200, +url.searchParams.get('limit') || 100);

  const where = q ? `WHERE u.email_norm LIKE ?2 OR lower(u.name) LIKE ?2 OR u.phone_full LIKE ?2` : '';
  const sql = `
    SELECT u.id, u.name, u.email, u.phone_full, u.who, u.comp, u.comp_ok,
           u.status, u.email_ok, u.created, u.last_login, u.blocked_at, u.block_why,
           (SELECT COUNT(*) FROM lst x WHERE x.user_id = u.id AND x.status <> 'closed') AS lst_n,
           (SELECT COUNT(*) FROM req x WHERE x.user_id = u.id AND x.status <> 'closed') AS req_n
      FROM users u
      ${where}
     ORDER BY u.created DESC
     LIMIT ?1`;

  const stmt = q
    ? env.DB.prepare(sql).bind(limit, '%' + q + '%')
    : env.DB.prepare(sql).bind(limit);

  const rows = await stmt.all();
  return J({ users: rows.results || [] });
}

export async function onRequestPost({ request, env }) {
  if (!await authed(request, env)) return denied();
  if (!env.DB) return J({ error: 'no-db' }, 500);

  let b = {};
  try { b = await request.json() } catch (_) {}
  const id = String(b.id || '').trim();
  const action = b.action;
  if (!id || !['block', 'unblock', 'comp_ok', 'edit', 'delete'].includes(action))
    return J({ error: 'bad-request' }, 400);

  const u = await env.DB.prepare(`SELECT id FROM users WHERE id=?1`).bind(id).first();
  if (!u) return J({ error: 'not-found' }, 404);

  if (action === 'block') {
    await env.DB.prepare(`UPDATE users SET status='blocked', blocked_at=?2, block_why=?3 WHERE id=?1`)
      .bind(id, Date.now(), str(b.reason, 200) || null).run();
    return J({ ok: true, status: 'blocked' });
  }

  if (action === 'unblock') {
    await env.DB.prepare(`UPDATE users SET status='active', blocked_at=NULL, block_why=NULL WHERE id=?1`)
      .bind(id).run();
    return J({ ok: true, status: 'active' });
  }

  if (action === 'comp_ok') {
    const v = b.value ? 1 : 0;
    await env.DB.prepare(`UPDATE users SET comp_ok=?2 WHERE id=?1`).bind(id, v).run();
    return J({ ok: true, comp_ok: v });
  }

  if (action === 'edit') {
    const name = str(b.name, 90);
    const phoneFull = str(b.phone_full, 32);
    await env.DB.prepare(`UPDATE users SET name=?2, phone_full=?3 WHERE id=?1`)
      .bind(id, name || null, phoneFull || null).run();
    return J({ ok: true });
  }

  if (action === 'delete') {
    /* ნამდვილი DELETE მხოლოდ მაშინ, თუ არცერთი განცხადება/მოთხოვნა არ
       აქვს დაკავშირებული — თორემ lst/req/mailq-ში „ობოლი" ჩანაწერები
       დარჩება. სხვა შემთხვევაში უსაფრთხო ალტერნატივა — დაბლოკვა. */
    const lst = await env.DB.prepare(`SELECT COUNT(*) AS n FROM lst WHERE user_id=?1`).bind(id).first();
    const req = await env.DB.prepare(`SELECT COUNT(*) AS n FROM req WHERE user_id=?1`).bind(id).first();
    if ((lst?.n || 0) > 0 || (req?.n || 0) > 0) {
      await env.DB.prepare(`UPDATE users SET status='blocked', blocked_at=?2, block_why='deleted-with-listings' WHERE id=?1`)
        .bind(id, Date.now()).run();
      return J({ ok: true, status: 'blocked', note: 'აქვს განცხადება/მოთხოვნა — სრულად ვერ წაიშლება, დაიბლოკა' });
    }
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM token WHERE user_id=?1`).bind(id),
      env.DB.prepare(`DELETE FROM users WHERE id=?1`).bind(id)
    ]);
    return J({ ok: true, deleted: true });
  }
}
