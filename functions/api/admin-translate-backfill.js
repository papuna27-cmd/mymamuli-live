/**
 * /api/admin-translate-backfill — ერთჯერადი ბექფილი ძველი ჩანაწერებისთვის
 * ==================================================================
 *
 * 2026-09-01, George-ის ავტომატური თარგმანის ფუნქციისთვის — D1 მიგრაციამ
 * ყველა არსებულ lst/req ჩანაწერს დაუსვა tr_status='pending' (default).
 * ეს endpoint პატარ-პატარა ჯგუფებად (limit) უსვამს თარგმანს, სანამ
 * pending აღარ დარჩება. მხოლოდ admin-ისთვის (x-admin-key).
 *
 *   GET /api/admin-translate-backfill?kind=lst&limit=15
 *   GET /api/admin-translate-backfill?kind=req&limit=15
 *   header: x-admin-key: <ADMIN_KEY>
 *
 * პასუხი: { kind, processed, remaining, results:[{id, ok, reason?}] }
 *
 * ⚠️ დროებითი ხელსაწყოა — მას შემდეგ, რაც remaining=0 გახდება ორივე
 * kind-ზე, ეს ფაილი შეიძლება წაიშალოს (submit.js/me.js ახალ/რედაქტირებულ
 * ჩანაწერებს ისედაც თავად თარგმნის).
 */
import { J, adminOk } from './_util.js';
import { detectLang, translateListing, translateNote } from './_translate.js';

export async function onRequestGet({ request, env }) {
  if (!adminOk(request, env)) return J({ error: 'unauthorized' }, 401);
  if (!env.DB) return J({ error: 'no-db' }, 500);

  const qs = new URL(request.url).searchParams;
  const kind = qs.get('kind') === 'req' ? 'req' : 'lst';
  const limit = Math.max(1, Math.min(30, Number(qs.get('limit')) || 15));

  if (kind === 'lst') {
    const rows = (await env.DB.prepare(
      `SELECT id, ttl, dsc, contact_name FROM lst
        WHERE tr_status='pending' AND status IN ('active','pending')
        LIMIT ?1`
    ).bind(limit).all()).results || [];

    const results = [];
    for (const r of rows) {
      const origLang = detectLang((r.ttl || '') + ' ' + (r.dsc || ''));
      const tr = await translateListing(env, { ttl: r.ttl, dsc: r.dsc, name: r.contact_name }, origLang);
      if (tr.ok) {
        await env.DB.prepare(
          `UPDATE lst SET orig_lang=?1, ttl_tr=?2, dsc_tr=?3, contact_name_tr=?4, tr_status='done' WHERE id=?5`
        ).bind(origLang, tr.ttl_tr || null, tr.dsc_tr || null, tr.name_tr || null, r.id).run();
        results.push({ id: r.id, ok: true });
      } else {
        await env.DB.prepare(`UPDATE lst SET tr_status='failed' WHERE id=?1`).bind(r.id).run();
        results.push({ id: r.id, ok: false, reason: tr.reason });
      }
    }
    const remainingRow = await env.DB.prepare(
      `SELECT COUNT(*) n FROM lst WHERE tr_status='pending' AND status IN ('active','pending')`
    ).first();
    return J({ kind, processed: results.length, remaining: remainingRow.n, results });
  }

  /* kind === 'req' */
  const rows = (await env.DB.prepare(
    `SELECT id, note FROM req
      WHERE tr_status='pending' AND status IN ('active','pending','draft')
      LIMIT ?1`
  ).bind(limit).all()).results || [];

  const results = [];
  for (const r of rows) {
    if (!r.note) {
      await env.DB.prepare(`UPDATE req SET tr_status='skip' WHERE id=?1`).bind(r.id).run();
      results.push({ id: r.id, ok: true, skip: true });
      continue;
    }
    const origLang = detectLang(r.note);
    const tr = await translateNote(env, r.note, origLang);
    if (tr.ok) {
      await env.DB.prepare(
        `UPDATE req SET orig_lang=?1, note_tr=?2, tr_status='done' WHERE id=?3`
      ).bind(origLang, tr.note_tr || null, r.id).run();
      results.push({ id: r.id, ok: true });
    } else {
      await env.DB.prepare(`UPDATE req SET tr_status='failed' WHERE id=?1`).bind(r.id).run();
      results.push({ id: r.id, ok: false, reason: tr.reason });
    }
  }
  const remainingRow = await env.DB.prepare(
    `SELECT COUNT(*) n FROM req WHERE tr_status='pending' AND status IN ('active','pending','draft')`
  ).first();
  return J({ kind, processed: results.length, remaining: remainingRow.n, results });
}
