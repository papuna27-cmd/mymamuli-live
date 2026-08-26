/**
 * /api/mod — მოდერაციის რიგი
 *
 *   GET  /api/mod?kind=lst|req                     → ასახილველი ჩანაწერები
 *   GET  /api/mod?approve=<id>&kind=lst|req&t=<t>   → ერთი კლიკით დადასტურება წერილიდან
 *   POST /api/mod  {kind,id,action,reason}
 *        action: ok | no | hold | delete
 *
 * ⚠️ ავტორიზაცია: `x-admin-key` header ან `mm_sid` სესიის cookie.
 *    ?key=… აღარ მუშაობს — query string რჩება ბრაუზერის ისტორიაში,
 *    Referer-ში, ლოგებში და გაზიარებულ ბმულში.
 *    გამონაკლისი — ?approve= ბმული: ის ცალკე ტოკენით არის დაცული
 *    (id+kind+ADMIN_KEY-დან წარმოებული), არა ADMIN_KEY-ით პირდაპირ.
 */
import { J, authed, denied, sha, safeEq, str, int } from './_util.js';
import { flushMailQueue } from './_mail.js';

/* ---------- ერთი კლიკით დადასტურება წერილიდან ----------
   ტოკენი დეტერმინირებულია id+kind+ADMIN_KEY-დან (არა შემთხვევითი,
   ვადა არ აქვს) — მისი გამოცნობა ADMIN_KEY-ის ცოდნის გარეშე
   პრაქტიკულად შეუძლებელია. მხოლოდ ამ კონკრეტულ ჩანაწერს ხსნის,
   ადმინის სრულ სესიას არ იძლევა. */
async function approveToken(env, kind, id) {
  if (!env.ADMIN_KEY) return '';
  return (await sha(`aprv:${kind}:${id}:${env.ADMIN_KEY}`)).slice(0, 24);
}

function htmlMsg(msg, status) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<body style="margin:0;padding:70px 24px;text-align:center;font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0E1A16;background:#F5F4F0">` +
    `<div style="max-width:420px;margin:0 auto">${msg}<br><br>` +
    `<a href="https://mymamuli.ge/mod.html" style="color:#0F6B4F;font-weight:600;text-decoration:none">← მოდერაციის პანელში გახსნა</a></div></body>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}

/* ---------- რიგის წამოღება ---------- */
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);

  /* ?approve=<id>&kind=lst|req&t=<token> — წერილიდან პირდაპირ, ადმინის
     სესიის/ბრაუზერის შესვლის გარეშე. */
  const apId = url.searchParams.get('approve');
  if (apId) {
    const kind = url.searchParams.get('kind') === 'req' ? 'req' : 'lst';
    const t = url.searchParams.get('t') || '';
    const want = await approveToken(env, kind, apId);
    if (!want || !safeEq(t, want)) return htmlMsg('ბმული არასწორია.', 403);
    if (!env.DB) return htmlMsg('ბაზა მიუწვდომელია.', 500);
    /* ⚠️ ადრე აქ catch არ იყო — თუ applyAction-ში batch() რამე მიზეზით
       ჩავარდებოდა (გარდამავალი D1 შეცდომა, ან ერთ-ერთი GET-ის ავტომატური
       "ბმულის სკანირება" ელფოსტის კლიენტისგან — Outlook Safe Links,
       Gmail-ის მსგავსები — ორივე ერთდროულად), მომხმარებელს
       Cloudflare-ის ზოგადი ცარიელი შეცდომის გვერდი უჩნდებოდა და
       ეგონა "არაფერი მოხდა", თუმცა სინამდვილეში ვერც გაერკვეოდა.
       ახლა ნებისმიერ გაუთვალისწინებელ შეცდომაზე გასაგები პასუხი
       უბრუნდება — და მეორედ იმავე ბმულზე დაჭერა უსაფრთხოა (idempotent). */
    let r;
    try { r = await applyAction(env, request, kind, apId, 'ok', ''); }
    catch (e) { return htmlMsg('დროებითი ხარვეზი — სცადე ბმულზე ხელახლა დაჭერა, ან დაადასტურე მოდერაციის პანელიდან.', 500); }
    if (r.error) return htmlMsg('ვერ მოხერხდა: ' + r.error, r.error === 'not-found' ? 404 : 400);
    return htmlMsg('✓ დადასტურდა — განცხადება უკვე ცოცხალია საიტზე.', 200);
  }

  if (!await authed(request, env)) return denied();
  if (!env.DB) return J({ lst: [], req: [], note: 'D1 არ არის მიბმული' });

  const lim = Math.min(100, +url.searchParams.get('limit') || 50);

  const lst = await env.DB.prepare(
    `SELECT l.*, u.email, u.name AS uname, u.who, u.comp, u.comp_ok, u.created AS ucreated,
            (SELECT COUNT(*) FROM lst x WHERE x.user_id = l.user_id) AS utotal,
            (SELECT COUNT(*) FROM lst x WHERE x.user_id = l.user_id AND x.status='rejected') AS urej
       FROM lst l JOIN users u ON u.id = l.user_id
      WHERE l.status = ?2
      ORDER BY l.created ASC LIMIT ?1`
  ).bind(lim,'pending').all();

  const req = await env.DB.prepare(
    `SELECT r.*, u.email, u.name AS uname, u.who, u.comp, u.comp_ok, u.created AS ucreated,
            (SELECT COUNT(*) FROM req x WHERE x.user_id = r.user_id) AS utotal,
            (SELECT COUNT(*) FROM req x WHERE x.user_id = r.user_id AND x.status='rejected') AS urej
       FROM req r JOIN users u ON u.id = r.user_id
      WHERE r.status = ?2
      ORDER BY r.created ASC LIMIT ?1`
  ).bind(lim,'pending').all();

  const shape = (r, kind) => ({
    id: r.id, kind,
    cat: r.cat, deal: r.deal, period: r.period,
    ttl: r.ttl, dsc: r.dsc || r.note,
    cad: r.cad, addr: r.addr, cad_ok: !!r.cad_ok,
    lat: r.lat, lng: r.lng, radius: r.radius,
    loc: r.loc, reg: r.reg,
    area: r.area, price: r.price,
    area_min: r.area_min, area_max: r.area_max,
    price_min: r.price_min, price_max: r.price_max,
    attrs: safe(r.attrs), photos: safe(r.photos) || [],
    tel: r.tel, contact_name: r.contact_name,
    src_req: r.src_req, created: r.created,
    user: {
      email: r.email, name: r.uname, who: r.who,
      comp: r.comp, comp_ok: !!r.comp_ok,
      created: r.ucreated ? new Date(r.ucreated).toISOString().slice(0, 10) : '',
      total: r.utotal || 0, rejected: r.urej || 0
    }
  });

  /* დადასტურებულები — მეორე განყოფილებისთვის */
  const lstOk = await env.DB.prepare(
    `SELECT l.*, u.email, u.name AS uname, u.who, u.comp, u.comp_ok, u.created AS ucreated,
            0 AS utotal, 0 AS urej
       FROM lst l JOIN users u ON u.id=l.user_id
      WHERE l.status IN ('active','hold') ORDER BY l.created DESC LIMIT ?1`
  ).bind(lim).all();
  const reqOk = await env.DB.prepare(
    `SELECT r.*, u.email, u.name AS uname, u.who, u.comp, u.comp_ok, u.created AS ucreated,
            0 AS utotal, 0 AS urej
       FROM req r JOIN users u ON u.id=r.user_id
      WHERE r.status IN ('active','hold') ORDER BY r.created DESC LIMIT ?1`
  ).bind(lim).all();

  /* ⚠️ 2026-08-25: George-ის მოთხოვნით — ზემოთ lst_ok/req_ok მასივები
     LIMIT ?1 (ნაგულისხმევად 50)-ითაა შემოსაზღვრული (გვერდის
     დატვირთვის დასაცავად, თუ ასობით აქტიური ჩანაწერია), მაგრამ
     mod.html-ის „დადასტურებული" ბეჯი აქამდე უბრალოდ ამ მასივების
     .length-ს ითვლიდა — ანუ LIMIT-ის გამო რეალურ საერთო რაოდენობას
     ვერასდროს აჩვენებდა 50-ზე მეტ შემთხვევაში, ყოველთვის 50-ზე
     ჩერდებოდა. აქ ცალკე, LIMIT-ის გარეშე COUNT(*) ვითვლით ორივესთვის,
     რომ ბეჯი ნამდვილ რიცხვს აჩვენებდეს, მაშინაც კი, როცა თვითონ
     ჩამონათვალი შემოსაზღვრულია. */
  const lstOkTotal = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM lst WHERE status IN ('active','hold')`
  ).first();
  const reqOkTotal = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM req WHERE status IN ('active','hold')`
  ).first();
  const lstPendTotal = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM lst WHERE status = 'pending'`
  ).first();
  const reqPendTotal = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM req WHERE status = 'pending'`
  ).first();

  return J({
    lst: (lst.results || []).map(r => shape(r, 'lst')),
    req: (req.results || []).map(r => shape(r, 'req')),
    lst_ok: (lstOk.results || []).map(r => shape(r, 'lst')),
    req_ok: (reqOk.results || []).map(r => shape(r, 'req')),
    lst_ok_total: lstOkTotal?.n || 0,
    req_ok_total: reqOkTotal?.n || 0,
    lst_pending_total: lstPendTotal?.n || 0,
    req_pending_total: reqPendTotal?.n || 0
  });
}

function safe(t) { try { return JSON.parse(t) } catch (_) { return null } }

/* კატეგორიის კოდი → ქართული სახელი, წერილის შეჯამებისთვის (form.html-ის CATS-ის ასლი) */
const CATN = {
  flat: 'ბინა', house: 'სახლი / აგარაკი', cottage: 'კოტეჯი', office: 'საოფისე ფართი',
  comm: 'კომერციული ფართი', hotel: 'სასტუმრო', resto: 'რესტორანი / ბარი', base: 'სარდაფი',
  land: 'მიწა', invest: 'საინვესტიციო მიწა', garage: 'ავტოფარეხი'
};

/* რიგში ახალი წერილი რომ ჩავარდეს, აღარ ველოდებით cron-ს — პასუხის
   დაბრუნებამდე პირდაპირ ველოდებით (await), waitUntil-ის ნაცვლად —
   ეს უფრო საიმედო აღმოჩნდა, ვიდრე ფონური, გარანტირებული დროის
   გარეშე გაშვება (იხ. submit.js-ის იგივე შენიშვნა). */
async function kickMail(env) {
  await flushMailQueue(env).catch(() => {});
}

/* ---------- გადაწყვეტილება ----------
   ერთი საერთო ფუნქცია — POST-იც და წერილიდან ერთი-კლიკიანი
   დადასტურებაც (onRequestGet-ში, ?approve=) ამას იძახებს. */
async function applyAction(env, request, kind, id, action, reason) {
  const now = Date.now();
  const table = kind === 'lst' ? 'lst' : 'req';
  /* delete — ადმინის მიერ ნებისმიერი (მათ შორის უკვე აქტიური) ჩანაწერის
     წაშლა. ნამდვილი DELETE-ის მაგივრად status='closed' ინიშნება —
     ისევე, როგორც მომხმარებლის საკუთარი წაშლისას (me.js). ავტორს
     წერილი აქ განზრახ არ ეგზავნება — "უარყოფილია" წერილი მოსატყუებელი
     იქნებოდა უკვე ცოცხალი განცხადებისთვის. */
  const status = action === 'ok' ? 'active' : (action === 'hold' ? 'hold' : (action === 'delete' ? 'closed' : 'rejected'));

  const row = await env.DB.prepare(
    `SELECT r.id, r.user_id, r.status AS cur_status, u.email FROM ${table} r JOIN users u ON u.id=r.user_id WHERE r.id=?1`
  ).bind(id).first();
  if (!row) return { error: 'not-found' };

  /* ⚠️ იდემპოტენტურობის დაცვა — თუ ჩანაწერი უკვე სამიზნე სტატუსშია,
     აღარაფერი გავაკეთოთ. ამის გარეშე ერთი ქმედება (განსაკუთრებით
     ?approve= ბმული, რომელსაც ელფოსტის კლიენტების ავტომატური
     "ბმულის სკანირება" — Outlook Safe Links, Gmail-ის მსგავსები —
     რამდენჯერმე თავისით ხსნის) ერთსა და იმავე წუთში რამდენჯერმე
     მუშავდებოდა და ყოველ ჯერზე ახალ 'approved'/'rejected' წერილს
     რიგში აგდებდა — ეს ცხადად დადასტურდა D1-ში: ერთი დადასტურება
     7-ჯერ განმეორდა 2 წამში, რამაც დღიური Resend-ის quota ამოწურა
     და ამის შემდეგ ვერც ერთი ვერიფიკაციის კოდი ვერ გაიგზავნა. */
  if (row.cur_status === status) return { ok: true, id, status, already: true };

  const stmts = [
    env.DB.prepare(`UPDATE ${table} SET status=?1, reject=?2 WHERE id=?3`)
      .bind(status, action === 'no' ? (reason || '') : null, id),
    env.DB.prepare(`INSERT INTO mod_log (kind,target,action,note,at) VALUES (?1,?2,?3,?4,?5)`)
      .bind(kind, id, action, reason || '', now)
  ];
  if (action !== 'delete') {
    stmts.push(
      /* ავტორს წერილი — რიგში ჩადება, გაგზავნას ღამის Worker აკეთებს */
      env.DB.prepare(
        `INSERT INTO mailq (user_id,to_addr,kind,payload,created) VALUES (?1,?2,?3,?4,?5)`
      ).bind(row.user_id, row.email, action === 'ok' ? 'approved' : (action === 'hold' ? 'hold' : 'rejected'),
             JSON.stringify({
               id, kind,
               reason: reason || '',
               /* მტკიცებულება ავტორისთვის — პირდაპირი ბმული განცხადებაზე */
               link: action === 'ok' && kind === 'lst'
                 ? `https://mymamuli.ge/g/${id}/`
                 : (action === 'ok' ? `https://mymamuli.ge/?req=${id}` : null)
             }), now)
    );
  }

  /* დადასტურებულ განცხადებაზე დამთხვევები მაშინვე ითვლება */
  if (action === 'ok' && kind === 'lst') {
    const l = await env.DB.prepare(`SELECT * FROM lst WHERE id=?1`).bind(id).first();
    if (l) {
      const rs = await env.DB.prepare(
        `SELECT req.id, req.user_id, u.email, req.lat, req.lng, req.radius,
                req.price_min, req.price_max, req.area_min, req.area_max
           FROM req JOIN users u ON u.id = req.user_id
          WHERE req.status='active' AND req.cat=?1 AND req.deal=?2
            AND ?3 BETWEEN req.bs AND req.bn AND ?4 BETWEEN req.bw AND req.be`
      ).bind(l.cat, l.deal, l.lat, l.lng).all();

      let photo = null;
      try { photo = (JSON.parse(l.photos || '[]') || [])[0] } catch (_) {}

      for (const r of rs.results || []) {
        if (dist(l.lat, l.lng, r.lat, r.lng) > r.radius) continue;
        if (r.price_max && l.price > r.price_max * 1.1) continue;
        if (r.price_min && l.price < r.price_min * 0.9) continue;
        if (r.area_min && l.area < r.area_min) continue;
        if (r.area_max && l.area > r.area_max) continue;
        stmts.push(
          env.DB.prepare(
            `INSERT OR IGNORE INTO mt (req_id,lst_id,created) VALUES (?1,?2,?3)`
          ).bind(r.id, id, now),
          /* ჩართულობის მრიცხველი — რამდენი შევთავაზეთ ამ მაძიებელს.
             ამის გარეშე ვერ გავიგებთ, ხსნის თუ არა გამოგზავნილს. */
          env.DB.prepare(`UPDATE req SET sent_n = sent_n + 1 WHERE id = ?1`).bind(r.id),
          /* ← აქამდე დამთხვევა მხოლოდ ბაზაში ჩაიწერებოდა, წერილი არავის მისდიოდა.
             ყოველ ახალ დამთხვევაზე ცალკე digest წერილი დგება რიგში (1 ობიექტით);
             /api/mail-ს გამოძახებისას გაიგზავნება. */
          env.DB.prepare(
            `INSERT INTO mailq (user_id,to_addr,kind,payload,created) VALUES (?1,?2,'digest',?3,?4)`
          ).bind(r.user_id, r.email, JSON.stringify({
            reqId: r.id,
            summary: [
              CATN[l.cat] || l.cat,
              [l.loc, l.reg].filter(Boolean).join(', '),
              r.radius >= 1000 ? (r.radius / 1000).toFixed(1) + ' კმ' : r.radius + ' მ',
              r.price_max ? ('$' + r.price_max.toLocaleString() + '-მდე') : ''
            ].filter(Boolean).join(' · '),
            items: [{
              id, title: l.ttl, loc: [l.loc, l.reg].filter(Boolean).join(', '),
              price: l.price, area: l.area, photo,
              link: `https://mymamuli.ge/g/${id}/`
            }]
          }), now)
        );
      }
    }
  }

  await env.DB.batch(stmts);
  await kickMail(env);

  /* ახალი შეთავაზების შემდეგ ვამოწმებთ, ხომ არ მიაღწია ვინმემ ზღვარს.
     ავტომატურად ბლოკავს მხოლოდ AUTOBLOCK=1-ის შემთხვევაში;
     სხვა დროს კანდიდატი ადმინკაში ჩნდება. */
  if (action === 'ok' && kind === 'lst' && env.AUTOBLOCK === '1') {
    try {
      const { autoBlock } = await import('./people.js');
      await autoBlock(env);
    } catch (_) { /* ბლოკვის ხარვეზი მოდერაციას ვერ გააჩერებს */ }
  }

  return { ok: true, id, status };
}

/* ---------- მოდერატორის კორექტირება ----------
   George-ის მოთხოვნით (2026-08-26): დადასტურებამდე მოდერატორს უნდა
   შეეძლოს ველების ხელით გასწორება (მაგ. სათაური/ფასი/აღწერა შეცდომით
   არასწორადაა შეყვანილი) — და მხოლოდ ამის შემდეგ დაადასტუროს. ეს
   status-ს არ ცვლის (ჩანაწერი 'pending'-ში რჩება), მხოლოდ თვითონ
   ველებს აახლებს. დასაშვები ველები — თეთრი სია, თვითნებური სვეტის
   სახელს კლიენტისგან არასდროს ვიღებთ. */
const EDITABLE = {
  lst: {
    ttl: v => str(v, 160),
    dsc: v => str(v, 3000),
    price: v => int(v, 0, 100000000),
    area: v => int(v, 0, 1000000),
    loc: v => str(v, 160),
    tel: v => str(v, 40)
  },
  req: {
    note: v => str(v, 1000),
    price_min: v => int(v, 0, 100000000),
    price_max: v => int(v, 0, 100000000),
    area_min: v => int(v, 0, 1000000),
    area_max: v => int(v, 0, 1000000)
  }
};

async function applyEdit(env, kind, id, fields) {
  const table = kind === 'lst' ? 'lst' : 'req';
  const allowed = EDITABLE[table];
  const row = await env.DB.prepare(`SELECT id FROM ${table} WHERE id=?1`).bind(id).first();
  if (!row) return { error: 'not-found' };

  const sets = [], vals = [];
  for (const k of Object.keys(fields || {})) {
    if (!allowed[k]) continue;
    const v = allowed[k](fields[k]);
    if (v === null) continue; /* რიცხვი ვერ დაპარსდა — ეს ველი უბრალოდ გამოტოვდება */
    sets.push(`${k}=?${sets.length + 1}`);
    vals.push(v);
  }
  if (!sets.length) return { error: 'no-fields' };
  vals.push(id);

  await env.DB.batch([
    env.DB.prepare(`UPDATE ${table} SET ${sets.join(',')} WHERE id=?${sets.length + 1}`).bind(...vals),
    env.DB.prepare(`INSERT INTO mod_log (kind,target,action,note,at) VALUES (?1,?2,'edit',?3,?4)`)
      .bind(kind, id, Object.keys(fields || {}).filter(k => allowed[k]).join(','), Date.now())
  ]);
  return { ok: true, id };
}

export async function onRequestPost({ request, env }) {
  if (!await authed(request, env)) return denied();
  let b = {};
  try { b = await request.json() } catch (_) {}
  if (!env.DB) return J({ error: 'no-db' }, 500);

  const { kind, id, action, reason, fields } = b;
  if (!['lst', 'req'].includes(kind) || !id) return J({ error: 'bad-request' }, 400);

  if (action === 'edit') {
    const r = await applyEdit(env, kind, id, fields);
    if (r.error) return J(r, r.error === 'not-found' ? 404 : 400);
    return J(r);
  }

  if (!['ok', 'no', 'hold', 'delete'].includes(action))
    return J({ error: 'bad-request' }, 400);

  const r = await applyAction(env, request, kind, id, action, reason);
  if (r.error) return J(r, r.error === 'not-found' ? 404 : 400);
  return J(r);
}

function dist(a, b, c, d) {
  const M = 111320;
  const x = (c - a) * M, y = (d - b) * M * Math.cos(a * Math.PI / 180);
  return Math.hypot(x, y);
}
