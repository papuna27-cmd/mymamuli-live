/**
 * GET /api/reviews — Google Business Profile reviews, cached in KV.
 *
 * Google's Places API is billed per call and rate limited, so the result is
 * cached for 24 hours in KV and served from the edge cache for an hour. A
 * cold call costs one Place Details request per day, which sits inside
 * Google's free monthly credit.
 *
 * If anything is missing or fails, this returns 204 and the site keeps
 * rendering the reviews baked in at build time. The page must never break
 * because a third party did.
 */

interface Env {
  REVIEWS: KVNamespace;
  GOOGLE_MAPS_KEY?: string;
  GOOGLE_PLACE_ID?: string;
}

interface GoogleReview {
  author_name?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
  profile_photo_url?: string;
}

interface PlacesResponse {
  status?: string;
  result?: {
    rating?: number;
    user_ratings_total?: number;
    url?: string;
    reviews?: GoogleReview[];
  };
}

const CACHE_KEY = 'reviews:v1';
const KV_TTL = 86400; // 24 h, as specified
const EDGE_TTL = 3600; // 1 h at the edge

export const onRequestGet: PagesFunction<Env> = async ({ env, waitUntil }) => {
  const cached = await env.REVIEWS.get(CACHE_KEY);
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${EDGE_TTL}`,
        'X-Cache': 'HIT',
      },
    });
  }

  if (!env.GOOGLE_MAPS_KEY || !env.GOOGLE_PLACE_ID) {
    // Not configured yet — the site falls back to its build-time reviews.
    return new Response(null, { status: 204 });
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', env.GOOGLE_PLACE_ID);
    url.searchParams.set('fields', 'rating,user_ratings_total,reviews,url');
    url.searchParams.set('reviews_sort', 'newest');
    url.searchParams.set('language', 'en');
    url.searchParams.set('key', env.GOOGLE_MAPS_KEY);

    const res = await fetch(url.toString(), { cf: { cacheTtl: EDGE_TTL } });
    if (!res.ok) return new Response(null, { status: 204 });

    const data = (await res.json()) as PlacesResponse;
    if (data.status !== 'OK' || !data.result) return new Response(null, { status: 204 });

    const reviews = (data.result.reviews ?? [])
      .filter((r) => (r.rating ?? 0) >= 4 && (r.text ?? '').trim().length > 40)
      .slice(0, 8)
      .map((r) => ({
        author: r.author_name ?? 'Google user',
        rating: r.rating ?? 5,
        text: (r.text ?? '').slice(0, 600),
        relativeTime: r.relative_time_description ?? '',
        profilePhotoUrl: r.profile_photo_url ?? '',
      }));

    if (reviews.length === 0) return new Response(null, { status: 204 });

    const payload = JSON.stringify({
      rating: data.result.rating ?? 0,
      count: data.result.user_ratings_total ?? reviews.length,
      profileUrl: data.result.url ?? '',
      reviews,
    });

    waitUntil(env.REVIEWS.put(CACHE_KEY, payload, { expirationTtl: KV_TTL }));

    return new Response(payload, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${EDGE_TTL}`,
        'X-Cache': 'MISS',
      },
    });
  } catch {
    return new Response(null, { status: 204 });
  }
};
