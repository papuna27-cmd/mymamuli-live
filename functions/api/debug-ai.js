/**
 * /api/debug-ai — დროებითი დიაგნოსტიკური endpoint (წაიშლება საბოლოოდ).
 * ამოწმებს ინგლისურ→ქართული მიმართულებას (detectLang='en' → target='ka').
 */
import { J, authed } from './_util.js';
import { detectLang, translateListing } from './_translate.js';

export async function onRequestGet({ request, env }) {
  if (!await authed(request, env)) return J({ error: 'unauthorized' }, 401);
  const ttl = 'Beautiful 3-bedroom house for sale in Batumi, near the sea';
  const dsc = 'Newly renovated house with a large garden, 2 bathrooms, and parking for 2 cars. Quiet neighborhood, 5 minutes walk to the beach.';
  const name = 'John Smith';
  const lang = detectLang(ttl + ' ' + dsc);
  const tr = await translateListing(env, { ttl, dsc, name }, lang);
  return J({ detectedLang: lang, input: { ttl, dsc, name }, result: tr });
}
