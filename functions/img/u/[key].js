/**
 * GET /img/u/:key — ატვირთული ფოტოს გატანა (KV, PHOTOS_KV ბაინდინგი).
 * გრძელვადიანი ქეშით — ერთხელ ატვირთული ფოტო აღარ იცვლება (ახალი
 * ატვირთვა = ახალი, შემთხვევითი key).
 */
const CT = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export async function onRequestGet({ params, env }) {
  const key = params.key;
  if (!env.PHOTOS_KV || !key) return new Response('not found', { status: 404 });

  const buf = await env.PHOTOS_KV.get(key, 'arrayBuffer');
  if (!buf) return new Response('not found', { status: 404 });

  const ext = (String(key).split('.').pop() || '').toLowerCase();
  return new Response(buf, {
    headers: {
      'content-type': CT[ext] || 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable'
    }
  });
}
