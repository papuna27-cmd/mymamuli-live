/**
 * Typed client for the Assembleo Worker API.
 *
 *   POST {API_BASE}/api/quote     → QuoteResponse
 *   POST {API_BASE}/api/booking   → BookingResponse
 *   GET  {API_BASE}/api/reviews   → ReviewsPayload
 *
 * PRICING RULE: this file never computes a price. It posts inputs and renders
 * whatever breakdown the Worker returns, so rates can change server-side
 * without a redeploy. The only module that produces numbers is ./mock, which
 * exists for local development, is loaded behind a build-time flag, and is
 * tree-shaken out of production bundles.
 */

import type {
  ApiErrorCode,
  BookingRequest,
  BookingResponse,
  QuoteRequest,
  QuoteResponse,
  ReviewsPayload,
} from './types';
import localReviews from '../data/reviews.json';
import { site } from '../data/site';

export const API_BASE: string =
  import.meta.env.PUBLIC_API_BASE ?? 'https://api.assembleo.ca';

/** Set PUBLIC_API_MOCK=true to run the whole frontend without the Worker. */
export const USE_MOCK: boolean = import.meta.env.PUBLIC_API_MOCK === 'true';

/** Set PUBLIC_REVIEWS_LIVE=true once the Worker's /api/reviews is deployed. */
const REVIEWS_LIVE: boolean = import.meta.env.PUBLIC_REVIEWS_LIVE === 'true';

const TIMEOUT_MS = 15000;

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly retryAfter?: number;

  constructor(code: ApiErrorCode, message: string, retryAfter?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

/**
 * User-facing recovery text. Every state tells the person what failed and what
 * to do about it — there is deliberately no generic "something went wrong".
 */
export function errorMessage(err: unknown): { title: string; body: string; showContact: boolean } {
  const code = err instanceof ApiError ? err.code : 'SERVER';
  switch (code) {
    case 'INVALID_ADDRESS':
      return {
        title: 'We could not read one of those addresses',
        body: 'Pick an address from the dropdown as you type, or switch to entering the distance in kilometres.',
        showContact: false,
      };
    case 'OUT_OF_SERVICE_AREA':
      return {
        title: 'That job is outside our service area',
        body: `We cover Mississauga, Toronto, Brampton, Oakville, Etobicoke, Vaughan and Hamilton. Send us the details anyway — we sometimes travel further for the right job.`,
        showContact: true,
      };
    case 'VALIDATION_FAILED':
      return {
        title: 'Something in the form did not check out',
        body: 'Have another look at the highlighted fields and try again.',
        showContact: false,
      };
    case 'RATE_LIMITED': {
      const wait = err instanceof ApiError && err.retryAfter ? err.retryAfter : 60;
      return {
        title: 'Too many estimates from this connection',
        body: `Give it ${wait} seconds and try again. If you need a price now, call ${site.phoneDisplay}.`,
        showContact: true,
      };
    }
    case 'TIMEOUT':
      return {
        title: 'That took too long',
        body: 'The connection dropped before we got a price back. Check your signal and try again — nothing was submitted.',
        showContact: false,
      };
    case 'NETWORK':
      return {
        title: 'We could not reach our pricing service',
        body: `You may be offline. Try again in a moment, or call ${site.phoneDisplay} and we will price it over the phone.`,
        showContact: true,
      };
    default:
      return {
        title: 'Our pricing service is having a problem',
        body: `This one is on us, not you. Try again shortly, or call ${site.phoneDisplay} for a price right now.`,
        showContact: true,
      };
  }
}

interface ErrorBody {
  error?: ApiErrorCode;
  message?: string;
  retryAfter?: number;
}

async function post<TIn, TOut>(path: string, body: TIn, signal?: AbortSignal): Promise<TOut> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), TIMEOUT_MS);
  const onAbort = () => controller.abort('caller');
  signal?.addEventListener('abort', onAbort, { once: true });

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (cause) {
    if (controller.signal.aborted && controller.signal.reason === 'timeout') {
      throw new ApiError('TIMEOUT', 'The request timed out.');
    }
    // A caller-triggered abort is not an error the user should see.
    if (controller.signal.aborted) throw cause;
    throw new ApiError('NETWORK', 'The pricing service could not be reached.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }

  if (res.ok) return (await res.json()) as TOut;

  let parsed: ErrorBody = {};
  try {
    parsed = (await res.json()) as ErrorBody;
  } catch {
    /* non-JSON error body; fall through to status-based mapping */
  }

  if (res.status === 429) {
    const header = Number(res.headers.get('Retry-After'));
    throw new ApiError('RATE_LIMITED', parsed.message ?? 'Rate limited.', parsed.retryAfter ?? (Number.isFinite(header) ? header : 60));
  }
  if (res.status >= 400 && res.status < 500 && parsed.error) {
    throw new ApiError(parsed.error, parsed.message ?? 'Request rejected.');
  }
  throw new ApiError('SERVER', parsed.message ?? `Upstream returned ${res.status}.`);
}

/** Ask the Worker to price a job. Never priced here. */
export async function requestQuote(input: QuoteRequest, signal?: AbortSignal): Promise<QuoteResponse> {
  if (USE_MOCK) {
    const { mockQuote } = await import('./mock');
    return mockQuote(input);
  }
  return post<QuoteRequest, QuoteResponse>('/api/quote', input, signal);
}

/** Submit a residential or commercial booking. */
export async function submitBooking(input: BookingRequest, signal?: AbortSignal): Promise<BookingResponse> {
  if (USE_MOCK) {
    const { mockBooking } = await import('./mock');
    return mockBooking(input);
  }
  return post<BookingRequest, BookingResponse>('/api/booking', input, signal);
}

/**
 * Reviews are resolved at build time so the carousel ships with content and
 * never shifts layout. Flip PUBLIC_REVIEWS_LIVE once the Worker endpoint is up;
 * that is the whole swap. Any failure falls back to the local file so a flaky
 * upstream can never break a build.
 */
export async function getReviews(): Promise<ReviewsPayload> {
  const fallback: ReviewsPayload = {
    rating: site.facts.rating,
    count: site.facts.reviewCount,
    profileUrl: site.social.google,
    reviews: localReviews,
    live: false,
  };

  if (!REVIEWS_LIVE) return fallback;

  try {
    const res = await fetch(`${API_BASE}/api/reviews`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as Partial<ReviewsPayload>;
    if (!Array.isArray(data.reviews) || data.reviews.length === 0) return fallback;
    return {
      rating: data.rating ?? fallback.rating,
      count: data.count ?? fallback.count,
      profileUrl: data.profileUrl ?? fallback.profileUrl,
      reviews: data.reviews,
      live: true,
    };
  } catch {
    return fallback;
  }
}

/** Presentation only — formatting, not pricing. */
export function formatCAD(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(amount);
}
