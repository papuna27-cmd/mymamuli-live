/**
 * Google Places Autocomplete, loaded on demand and restricted to Canada.
 *
 * The script is only fetched when a user focuses an address field, so a
 * visitor who never touches the calculator never pays for it. If no key is
 * configured, or the script fails, callers fall back to the manual distance
 * input — the calculator must still work.
 *
 * Distance is never computed here. We collect place IDs and hand them to the
 * Worker, which resolves the driving distance server-side.
 */

const KEY = import.meta.env.PUBLIC_GOOGLE_MAPS_KEY as string | undefined;

let loader: Promise<boolean> | null = null;

export function placesConfigured(): boolean {
  return Boolean(KEY);
}

export function loadPlaces(): Promise<boolean> {
  if (!KEY) return Promise.resolve(false);
  if (loader) return loader;

  loader = new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    const w = window as unknown as { google?: { maps?: { places?: unknown } } };
    if (w.google?.maps?.places) return resolve(true);

    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&libraries=places&loading=async&region=CA&language=en-CA`;
    s.async = true;
    s.onload = () => resolve(Boolean(w.google?.maps?.places));
    s.onerror = () => resolve(false);
    document.head.appendChild(s);

    // Never leave the user waiting on a third party.
    setTimeout(() => resolve(Boolean(w.google?.maps?.places)), 6000);
  });

  return loader;
}

export interface PlacePick {
  text: string;
  placeId?: string;
}

/**
 * Attaches autocomplete to an input. Returns a teardown function.
 * `onPick` fires when the user selects a suggestion.
 */
export function attachAutocomplete(
  input: HTMLInputElement,
  onPick: (pick: PlacePick) => void,
): () => void {
  const g = (window as any).google;
  if (!g?.maps?.places?.Autocomplete) return () => {};

  const ac = new g.maps.places.Autocomplete(input, {
    componentRestrictions: { country: 'ca' },
    fields: ['place_id', 'formatted_address', 'name'],
    types: ['geocode', 'establishment'],
  });

  const listener = ac.addListener('place_changed', () => {
    const place = ac.getPlace();
    const text: string = place?.formatted_address || place?.name || input.value;
    onPick({ text, placeId: place?.place_id });
  });

  // Enter should pick the highlighted suggestion, not submit the form early.
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && document.querySelector('.pac-container:not([style*="display: none"])')) {
      e.preventDefault();
    }
  };
  input.addEventListener('keydown', onKeyDown);

  return () => {
    input.removeEventListener('keydown', onKeyDown);
    g.maps.event?.removeListener?.(listener);
    // Google leaves its dropdown in the body; take ours with us.
    document.querySelectorAll('.pac-container').forEach((n) => n.remove());
  };
}
