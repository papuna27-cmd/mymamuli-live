/**
 * /api/upload — ფოტოს ატვირთვა (განცხადების ფორმიდან)
 * ==================================================================
 *
 *   POST /api/upload   body: სურათის raw bytes, Content-Type: image/jpeg|png|webp
 *   → { ok:true, url:'/img/u/<key>.jpg' }
 *
 * ⚠️ ავტორიზაცია განზრახ არ სჭირდება — მომხმარებელი ფოტოებს ირჩევს ჯერ
 * კიდევ მანამ, სანამ ანგარიში/ელფოსტის დადასტურება საერთოდ არსებობს
 * (ფორმის მე-2 ბიჯი, დადასტურება — მე-4-ის შემდეგ). ამიტომ ბოროტად
 * გამოყენების საწინააღმდეგოდ IP-ზე ვზღუდავთ, ტიპსა და ზომას ვამოწმებთ.
 *
 * შენახვა — Cloudflare KV-ში (`PHOTOS_KV` ბაინდინგი). R2 ჯერ არ არის
 * ჩართული ამ ანგარიშზე; KV საკმარისია, სურათი კლიენტმა უკვე შეკუმშა
 * ატვირთვამდე (ტიპურად 200-600 KB).
 */
import { J, randId, limited } from './_util.js';

const OK_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 3 * 1024 * 1024;   /* 3MB — კლიენტის შეკუმშვის შემდეგ ეს გადამეტება არ უნდა მოხდეს */

export async function onRequestPost({ request, env }) {
  if (!env.PHOTOS_KV) return J({ error: 'no-storage' }, 500);
  if (!env.DB) return J({ error: 'no-db' }, 500);

  const ct = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const ext = OK_TYPES[ct];
  if (!ext) return J({ error: 'bad-type' }, 400);

  const ip = request.headers.get('cf-connecting-ip') || '0';
  /* ერთი IP — საათში 60 ატვირთვა. 10 ფოტო/განცხადება, რამდენიმე
     განცხადებაზე საკმარისია; საეჭვო მოცულობას კი ზღუდავს. */
  if (await limited(env, 'upl:' + ip, 60, 3600e3)) return J({ error: 'too-many' }, 429);

  const buf = await request.arrayBuffer();
  if (!buf.byteLength) return J({ error: 'empty' }, 400);
  if (buf.byteLength > MAX_BYTES) return J({ error: 'too-large' }, 413);

  const key = randId('u_', 22) + '.' + ext;
  await env.PHOTOS_KV.put(key, buf);

  return J({ ok: true, url: '/img/u/' + key });
}
