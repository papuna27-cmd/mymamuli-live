/**
 * Mock API, for developing the frontend before the Worker exists.
 *
 * Loaded only via dynamic import behind `USE_MOCK`, which Vite replaces at
 * build time — so with PUBLIC_API_MOCK unset this file is not in the bundle.
 *
 * The arithmetic here is a FIXTURE, not the pricing model. Production pricing
 * lives in the Worker so rates change without a redeploy. If you find yourself
 * editing these numbers to change what customers are charged, you are in the
 * wrong repository.
 */

import type { BookingRequest, BookingResponse, QuoteRequest, QuoteResponse } from './types';
import rates from '../data/mock-rates.json';

const LATENCY_MS = 650;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Deterministic pseudo-distance so the same pair of addresses always prices the same. */
function pseudoDistanceKm(a: string, b: string): number {
  const s = `${a}|${b}`.toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // 3–47 km, one decimal place.
  return Math.round(((Math.abs(h) % 4400) / 100 + 3) * 10) / 10;
}

function inServiceArea(text: string): boolean {
  const t = text.toLowerCase();
  return rates.serviceAreaKeywords.some((k) => t.includes(k));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function mockQuote(input: QuoteRequest): Promise<QuoteResponse> {
  await wait(LATENCY_MS);

  const { ApiError } = await import('./api');
  const originText = input.origin.text.trim();
  const destText = input.destination.text.trim();

  // Test hooks so every error state is reachable in development.
  if (/\btest-error\b/i.test(originText + destText)) {
    throw new ApiError('SERVER', 'Mock server error (triggered by "test-error").');
  }
  if (/\btest-limit\b/i.test(originText + destText)) {
    throw new ApiError('RATE_LIMITED', 'Mock rate limit (triggered by "test-limit").', 45);
  }
  if (!originText || !destText) {
    throw new ApiError('INVALID_ADDRESS', 'Both addresses are required.');
  }

  const hasOverride = typeof input.distanceKmOverride === 'number' && input.distanceKmOverride > 0;

  if (!hasOverride && !(inServiceArea(originText) && inServiceArea(destText))) {
    throw new ApiError('OUT_OF_SERVICE_AREA', 'One of those addresses is outside the covered area.');
  }

  const distanceKm = hasOverride
    ? Math.round(input.distanceKmOverride! * 10) / 10
    : pseudoDistanceKm(originText, destText);

  const cfg = rates.services[input.service];
  const distanceCharge = round(distanceKm * rates.distanceRate);
  const uncapped = round(cfg.baseFee + distanceCharge);
  const minimumApplied = uncapped < cfg.minimum;
  const subtotal = minimumApplied ? cfg.minimum : uncapped;
  const tax = round(subtotal * rates.taxRate);

  return {
    quoteId: `q_mock_${Math.abs(Math.round(distanceKm * 1000)).toString(36)}${input.service[0]}`,
    service: input.service,
    distanceKm,
    currency: rates.currency,
    breakdown: {
      baseFee: cfg.baseFee,
      distanceRate: rates.distanceRate,
      distanceCharge,
      subtotal,
      minimumApplied,
      taxRate: rates.taxRate,
      tax,
      total: round(subtotal + tax),
    },
    disclaimer: 'Estimate only. Final price confirmed at booking.',
    expiresAt: new Date(Date.now() + 7 * 864e5).toISOString(),
  };
}

export async function mockBooking(input: BookingRequest): Promise<BookingResponse> {
  await wait(LATENCY_MS);
  const { ApiError } = await import('./api');

  if (input.website) {
    // Honeypot filled: behave exactly as the Worker will.
    throw new ApiError('VALIDATION_FAILED', 'Rejected.');
  }
  if (/\btest-error\b/i.test(input.details ?? '')) {
    throw new ApiError('SERVER', 'Mock server error (triggered by "test-error" in the details field).');
  }

  return {
    bookingId: `b_mock_${Date.now().toString(36)}`,
    status: 'received',
  };
}
