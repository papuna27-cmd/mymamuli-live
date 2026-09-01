/**
 * /api/debug-ai — დროებითი დიაგნოსტიკური endpoint (წაიშლება საბოლოოდ).
 * აჩვენებს env.AI.run()-ის ნედლ პასუხს, რომ დავადგინოთ რატომ ვერ
 * პარსავდა თარგმანის კოდი JSON-ს პასუხიდან.
 */
import { J, authed } from './_util.js';

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export async function onRequestGet({ request, env }) {
  if (!await authed(request, env)) return J({ error: 'unauthorized' }, 401);
  if (!env.AI) return J({ error: 'no-ai-binding' }, 500);

  try {
    const r = await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: 'Respond with ONLY a raw JSON object, no markdown fences, no commentary, in exactly this shape: {"title":"hello","desc":"world","name":""}' },
        { role: 'user', content: JSON.stringify({ title: 'სოფელი ქვიშხეთი', desc: 'კარგი ნაკვეთია', name: 'გიორგი' }) }
      ],
      max_tokens: 2048
    });
    return J({ ok: true, raw: r, type: typeof r, keys: r && typeof r === 'object' ? Object.keys(r) : null });
  } catch (e) {
    return J({ ok: false, error: String((e && e.stack) || e) }, 500);
  }
}
