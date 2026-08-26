/**
 * /api/verify — კოდის დადასტურება
 *   POST {email, code}
 *
 * იგივეა, რაც /api/submit?verify=1. ორივე მისამართი მუშაობს, რადგან
 * კოდში ორივე იყო ნახსენები და ერთი მათგანი არ არსებობდა.
 * ლოგიკა ერთია — submit.js-ში.
 */
import { onRequestPost as submit } from './submit.js';

export async function onRequestPost({ request, env }) {
  const u = new URL(request.url);
  u.searchParams.set('verify', '1');
  /* სხეულს ტექსტად ვკითხულობთ — ნაკადის გადაცემა ყველა გარემოში
     `duplex` პარამეტრს ითხოვს და ზედმეტ სირთულეს ქმნის. */
  const body = await request.text();
  return submit({
    request: new Request(u, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersOf(request) },
      body
    }),
    env
  });
}

/* IP მნიშვნელოვანია — ლიმიტები მასზე დგას */
const headersOf = r => {
  const h = {};
  for (const k of ['cf-connecting-ip', 'user-agent']) {
    const v = r.headers.get(k);
    if (v) h[k] = v;
  }
  return h;
};
