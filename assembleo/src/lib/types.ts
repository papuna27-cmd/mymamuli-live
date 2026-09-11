/** Shared API types. These mirror the Worker contract exactly. */

export type ServiceKind = 'delivery' | 'moving';
export type BookingType = 'residential' | 'commercial';
export type BookingService = 'assembly' | 'delivery' | 'moving' | 'other';
export type TimeWindow = 'morning' | 'afternoon' | 'evening' | 'flexible';

export interface PlaceRef {
  /** Google Places place_id. Absent when autocomplete was unavailable. */
  placeId?: string;
  /** What the user typed or picked, always present. */
  text: string;
}

export interface QuoteRequest {
  service: ServiceKind;
  origin: PlaceRef;
  destination: PlaceRef;
  /** Only sent when autocomplete is unavailable and the user gave a distance. */
  distanceKmOverride?: number;
  date?: string;
  notes?: string;
  contact?: { name?: string; email?: string; phone?: string };
}

export interface QuoteBreakdown {
  baseFee: number;
  distanceRate: number;
  distanceCharge: number;
  subtotal: number;
  minimumApplied: boolean;
  taxRate: number;
  tax: number;
  total: number;
}

export interface QuoteResponse {
  quoteId: string;
  service: ServiceKind;
  distanceKm: number;
  currency: string;
  breakdown: QuoteBreakdown;
  disclaimer: string;
  expiresAt: string;
}

export interface BookingRequest {
  type: BookingType;
  service: BookingService;
  quoteId?: string;
  name: string;
  email: string;
  phone: string;
  /** Commercial only. */
  company?: string;
  /** Commercial only, mirrored into details server-side. */
  siteType?: string;
  unitCount?: string;
  address: string;
  preferredDate?: string;
  preferredWindow: TimeWindow;
  details?: string;
  consent: boolean;
  turnstileToken?: string;
  /** Honeypot. Must always be empty when a human submits. */
  website?: string;
}

export interface BookingResponse {
  bookingId: string;
  status: 'received';
}

export interface Review {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
  profilePhotoUrl: string;
}

export interface ReviewsPayload {
  rating: number;
  count: number;
  profileUrl: string;
  reviews: Review[];
  /** True when the data came from the live endpoint rather than the local file. */
  live: boolean;
}

export type ApiErrorCode =
  | 'INVALID_ADDRESS'
  | 'OUT_OF_SERVICE_AREA'
  | 'VALIDATION_FAILED'
  | 'RATE_LIMITED'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'SERVER';
