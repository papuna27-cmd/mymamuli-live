/**
 * /api/ga-stats — რეალური Google Analytics 4 + Search Console მონაცემები
 * ==================================================================
 *
 *   GET /api/ga-stats?days=7|30|90
 *
 * ადმინკის ანალიტიკის პანელისთვის (admin.html) — 2026-08-27, George-ის
 * მოთხოვნით. აქამდე admin.html-ის მთელი ანალიტიკა (/api/stats,
 * /api/views, /api/track) მხოლოდ საკუთარ D1 ბაზაზე იყო აგებული —
 * ეს endpoint დამატებით რეალურ GA4/Search Console მონაცემს იძლევა
 * ზუსტად ორი, George-ის (g.papiashvili@hmg.ge) ანგარიშზე დამოწმებული
 * property-დან:
 *
 *   • GA4 property 551076700 (measurement ID G-N30XKZCDCT, MyMamuli.ge Web)
 *   • Search Console property sc-domain:mymamuli.ge
 *
 * ავტორიზაცია: იგივე authed() (x-admin-key ან ადმინის სესია), რასაც
 * /api/stats და /api/views იყენებს.
 *
 * ⚠️ თუ GOOGLE_SA_EMAIL/GOOGLE_SA_PRIVATE_KEY secrets ჯერ არ დგას
 *    (ან service account-ს GA4/GSC-ზე წვდომა არ აქვს), პასუხი მაინც
 *    200-ია, უბრალოდ `error` ველით — admin.html-ს შეუძლია ეს ცხადად
 *    აჩვენოს, გატეხილი გვერდის ნაცვლად.
 */
import { J, authed, denied } from './_util.js';
import { gaRunReport, gscQuery, lastAuthError } from './_google.js';

const GA_PROPERTY = '551076700';
const GSC_SITE = 'sc-domain:mymamuli.ge';
const KEY_EVENTS = ['qualify_lead', 'close_convert_lead', 'sign_up'];

const dstr = d => d.toISOString().slice(0, 10);

export async function onRequestGet({ request, env }) {
  if (!await authed(request, env)) return denied();

  const days = Math.min(90, Math.max(1, parseInt(new URL(request.url).searchParams.get('days') || '30', 10)));
  const today = new Date();
  const startDate = new Date(today.getTime() - (days - 1) * 86400000);
  const prevEnd = new Date(startDate.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 86400000);

  const range = { startDate: dstr(startDate), endDate: dstr(today) };
  const prevRange = { startDate: dstr(prevStart), endDate: dstr(prevEnd) };

  const out = {
    range: { days, from: range.startDate, to: range.endDate },
    ga: null, gaPrev: null, events: null, pages: null, sources: null, devices: null,
    gsc: null, gscQueries: null, error: null
  };

  if (!env.GOOGLE_SA_EMAIL || !env.GOOGLE_SA_PRIVATE_KEY) {
    out.error = 'no-credentials';
    return J(out);
  }

  try {
    const [overview, overviewPrev, events, pages, sources, devices, gscTotals, gscQ] = await Promise.all([
      gaRunReport(env, GA_PROPERTY, {
        dateRanges: [range],
        metrics: [
          { name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' },
          { name: 'averageSessionDuration' }, { name: 'bounceRate' }
        ]
      }),
      gaRunReport(env, GA_PROPERTY, {
        dateRanges: [prevRange],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }]
      }),
      gaRunReport(env, GA_PROPERTY, {
        dateRanges: [range],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: { fieldName: 'eventName', inListFilter: { values: KEY_EVENTS } }
        },
        limit: KEY_EVENTS.length
      }),
      gaRunReport(env, GA_PROPERTY, {
        dateRanges: [range],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10
      }),
      gaRunReport(env, GA_PROPERTY, {
        dateRanges: [range],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 8
      }),
      gaRunReport(env, GA_PROPERTY, {
        dateRanges: [range],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }]
      }),
      gscQuery(env, GSC_SITE, { startDate: range.startDate, endDate: range.endDate, dimensions: [] }),
      gscQuery(env, GSC_SITE, {
        startDate: range.startDate, endDate: range.endDate,
        dimensions: ['query'], rowLimit: 20
      })
    ]);

    /* ერთ-ერთი API-ც რომ ჩავარდეს (მაგ. წვდომა ჯერ არ გააქტიურდა
       Google-ის მხარეს — ხანდახან რამდენიმე წუთს სჭირდება), ეს არ
       უნდა ტოვებდეს მთელ პასუხს ცარიელს. null-ები admin.html-ში
       უბრალოდ „მონაცემი ჯერ არ არის"-ად აისახება. */
    out.ga = overview;
    out.gaPrev = overviewPrev;
    out.events = events;
    out.pages = pages;
    out.sources = sources;
    out.devices = devices;
    out.gsc = gscTotals;
    out.gscQueries = gscQ;

    if (!overview && !gscTotals) { out.error = 'auth-failed'; out.debug = lastAuthError(); }
  } catch (e) {
    out.error = 'fetch-failed';
    out.debug = String((e && e.message) || e).slice(0, 200);
  }

  return J(out, 200, { 'cache-control': 'private, max-age=120' });
}
