/**
 * რუკის სწრაფი ფორმების მიღება — /api/requests და /api/offers
 * ==================================================================
 *
 * ⚠️ რას ასწორებს ეს ფაილი
 * ორივე endpoint ფრონტიდან იძახებოდა, მაგრამ სერვერზე არ არსებობდა.
 * გამოძახება `catch(e){}`-ში იყო გახვეული, ამიტომ 404 ჩუმად ინთქმებოდა
 * და მომხმარებელი „✓ მოთხოვნა გამოქვეყნდა"-ს ხედავდა — მაშინ, როცა
 * არსად არაფერი ინახებოდა. ეს 404-ზე უარესია: ცრუ დადასტურება
 * ნდობას ანგრევს და შეცდომა უხილავი რჩება.
 *
 * ახლა ჩანაწერი მართლა ინახება — `lead` ცხრილში, მოდერატორისთვის.
 */
import { J, randId, sha, now, normPhone, limited, str, int, geoOk } from './_util.js';

const MAX_TEL = 32;

export async function takeLead(request, env, kind, shape) {
  if (!env.DB) return J({ error: 'no-db' }, 500);

  let b = {};
  try { b = await request.json() } catch (_) { return J({ error: 'bad-json' }, 400) }

  const tel = normPhone(b.tel);
  if (tel.length < 9) return J({ error: 'bad-phone' }, 400);

  const ip = request.headers.get('cf-connecting-ip') || '0';
  /* ერთი ნომერი — დღეში 5; ერთი IP — საათში 10 */
  if (await limited(env, 'lead-ip:' + ip, 10, 3600e3)) return J({ error: 'too-many' }, 429);
  if (await limited(env, 'lead-tel:' + tel, 5, 86400e3)) return J({ error: 'too-many' }, 429);

  const data = shape(b);
  if (data.error) return J({ error: 'invalid', fields: data.error }, 400);

  const id = randId(kind === 'req' ? 'ld_r_' : 'ld_o_', 8);
  await env.DB.prepare(
    `INSERT INTO lead (id,kind,ref,tel,payload,ip_hash,created)
     VALUES (?1,?2,?3,?4,?5,?6,?7)`
  ).bind(
    id, kind, data.ref || null, str(b.tel, MAX_TEL),
    JSON.stringify(data.payload), await sha('ip:' + ip), now()
  ).run();

  /* ⚠️ „მიღებულია", არა „გამოქვეყნდა" — სხვაობა არსებითია. */
  return J({ ok: true, id, status: 'მიღებულია — გადამოწმების შემდეგ დაგიკავშირდებით' });
}

/* ---------- „ვეძებ" პანელი ---------- */
export const shapeReq = b => {
  const e = [];
  const bmax = int(b.bmax, 0, 1e9), amax = int(b.amax, 0, 1e9);
  if (!bmax) e.push('ბიუჯეტი');
  if (!amax) e.push('ფართობი');

  /* დახაზული არეალი — მხოლოდ საქართველოს შიგნით, გონივრული ზომით */
  let poly = null;
  if (Array.isArray(b.poly) && b.poly.length >= 3 && b.poly.length <= 500) {
    const p = b.poly.map(pt => Array.isArray(pt) ? [Number(pt[0]), Number(pt[1])] : null)
      .filter(pt => pt && geoOk(pt[1], pt[0]));
    if (p.length >= 3) poly = p;
  }

  return e.length ? { error: e } : {
    payload: {
      bmin: int(b.bmin, 0, 1e9) || 0, bmax,
      amin: int(b.amin, 0, 1e9) || 0, amax,
      kind: str(b.kind, 30), purpose: str(b.purpose, 30),
      name: str(b.name, 60), poly
    }
  };
};

/* ---------- „შეთავაზება" პანელი ---------- */
export const shapeOffer = b => {
  const e = [];
  const code = str(b.code, 40);
  const price = int(b.price, 0, 1e9);
  /* ფორმატს ვამოწმებთ; ნამდვილობას მოდერატორი /api/cad-ით შეამოწმებს */
  if (!/^\d{2}(\.\d{2,4}){2,7}$/.test(code)) e.push('საკადასტრო კოდი');
  if (!price) e.push('ფასი');

  return e.length ? { error: e } : {
    ref: str(b.req, 40) || null,
    payload: { code, price }
  };
};
