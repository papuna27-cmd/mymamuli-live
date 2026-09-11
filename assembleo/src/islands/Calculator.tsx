/**
 * Delivery / moving calculator. One component, two configs.
 *
 * Mobile is stepped: service → addresses → result. Wide screens show the tabs
 * and the form together and put the result beside them.
 *
 * No price is calculated here. Inputs go to the Worker; we render the
 * breakdown it returns.
 */

import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { ApiError, errorMessage, formatCAD, requestQuote } from '../lib/api';
import { attachAutocomplete, loadPlaces, placesConfigured } from '../lib/places';
import type { PlaceRef, QuoteResponse, ServiceKind } from '../lib/types';

interface Props {
  services: ServiceKind[];
  initial?: ServiceKind;
  variant?: 'full' | 'compact';
  /** Rendered as the panel heading. */
  heading?: string;
  headingLevel?: 'h2' | 'h3';
}

type Status = 'idle' | 'loading' | 'done' | 'error';

const LABELS: Record<ServiceKind, { tab: string; origin: string; dest: string; blurb: string }> = {
  delivery: {
    tab: 'Delivery',
    origin: 'Pickup address (the store)',
    dest: 'Delivery address',
    blurb: 'Store pickup, loading, transport, unloading and carry-in to your entry floor.',
  },
  moving: {
    tab: 'Moving',
    origin: 'Moving from',
    dest: 'Moving to',
    blurb: 'Two crew and a van between two addresses, loaded and unloaded at the vehicle.',
  },
};

const CURBSIDE =
  'Curbside to curbside: the crew loads at the vehicle and unloads at the vehicle. Carrying items up or down floors is not included.';

const DELIVERY_INCLUDED = [
  'Collection from the store or warehouse',
  'Loading, wrapping and strapping',
  'Transport on your booked date',
  'Unloading and carry-in on the entry floor',
];

export default function Calculator({
  services,
  initial,
  variant = 'full',
  heading = 'Estimate a job',
  headingLevel = 'h2',
}: Props) {
  const multi = services.length > 1;
  const [service, setService] = useState<ServiceKind>(initial ?? services[0]!);

  // Mobile stepper. 0 = pick service, 1 = addresses, 2 = result.
  const [step, setStep] = useState<0 | 1 | 2>(multi ? 0 : 1);
  const [wide, setWide] = useState(false);

  const [origin, setOrigin] = useState<PlaceRef>({ text: '' });
  const [destination, setDestination] = useState<PlaceRef>({ text: '' });
  const [manual, setManual] = useState(!placesConfigured());
  const [km, setKm] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showExtra, setShowExtra] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [err, setErr] = useState<unknown>(null);

  const originRef = useRef<HTMLInputElement>(null);
  const destRef = useRef<HTMLInputElement>(null);
  const bookRef = useRef<HTMLAnchorElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [ctaVisible, setCtaVisible] = useState(true);

  const uid = useMemo(() => `calc-${Math.random().toString(36).slice(2, 8)}`, []);

  /* ---- viewport ------------------------------------------------------- */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => {
      setWide(mq.matches);
      if (mq.matches) setStep((s) => (s === 0 ? 1 : s));
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  /* ---- places autocomplete, loaded on first focus --------------------- */
  const [placesReady, setPlacesReady] = useState(false);
  const wakePlaces = () => {
    if (manual || placesReady || !placesConfigured()) return;
    void loadPlaces().then((ok) => (ok ? setPlacesReady(true) : setManual(true)));
  };

  useEffect(() => {
    if (!placesReady || manual) return undefined;
    const teardowns: Array<() => void> = [];
    if (originRef.current) teardowns.push(attachAutocomplete(originRef.current, (p) => setOrigin(p)));
    if (destRef.current) teardowns.push(attachAutocomplete(destRef.current, (p) => setDestination(p)));
    return () => teardowns.forEach((t) => t());
  }, [placesReady, manual, step, service]);

  /**
   * With the on-screen keyboard open there is very little room under a field.
   * Pull the focused address input toward the top so the suggestion list has
   * somewhere to go.
   */
  const liftForKeyboard = (el: HTMLElement) => {
    if (wide) return;
    window.setTimeout(() => {
      const top = el.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top, behavior: 'smooth' });
    }, 250);
  };

  /* ---- sticky summary: only when the in-panel CTA is off screen -------- */
  useEffect(() => {
    if (!quote || wide) {
      setCtaVisible(true);
      return undefined;
    }
    const el = bookRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setCtaVisible(Boolean(e?.isIntersecting)), {
      rootMargin: '-8px 0px -96px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [quote, wide, step]);

  /* ---- the site action bar steps aside for the quote summary ----------- */
  useEffect(() => {
    const showBar = Boolean(quote) && !wide && !ctaVisible;
    document.body.classList.toggle('quote-open', showBar);
    return () => document.body.classList.remove('quote-open');
  }, [quote, wide, ctaVisible]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* ---- validation ------------------------------------------------------ */
  const kmNum = Number(km);
  const errors: Record<string, string> = {};
  if (manual) {
    if (!km.trim()) errors.km = 'Enter the distance in kilometres.';
    else if (!Number.isFinite(kmNum) || kmNum <= 0) errors.km = 'Enter a distance greater than zero.';
    else if (kmNum > 400) errors.km = 'That is further than we travel. Send us the job instead.';
  } else {
    if (!origin.text.trim()) errors.origin = 'We need somewhere to collect from.';
    if (!destination.text.trim()) errors.destination = 'We need somewhere to take it to.';
  }
  const valid = Object.keys(errors).length === 0;

  const showError = (k: string) => (touched[k] ? errors[k] : undefined);

  /* ---- submit ---------------------------------------------------------- */
  async function estimate(e?: Event) {
    e?.preventDefault();
    setTouched({ origin: true, destination: true, km: true });
    if (!valid) {
      const firstBad = Object.keys(errors)[0];
      document.getElementById(`${uid}-${firstBad}`)?.focus();
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setStatus('loading');
    setErr(null);
    if (!wide) setStep(2);

    try {
      const res = await requestQuote(
        {
          service,
          origin: manual ? { text: origin.text || 'Not given' } : origin,
          destination: manual ? { text: destination.text || 'Not given' } : destination,
          ...(manual ? { distanceKmOverride: kmNum } : {}),
          ...(date ? { date } : {}),
          ...(notes ? { notes } : {}),
        },
        ac.signal,
      );
      setQuote(res);
      setStatus('done');
      window.setTimeout(() => resultRef.current?.focus(), 60);
    } catch (e2) {
      if (ac.signal.aborted && !(e2 instanceof ApiError)) return;
      setErr(e2);
      setQuote(null);
      setStatus('error');
    }
  }

  function reset() {
    setQuote(null);
    setStatus('idle');
    setErr(null);
    setStep(multi && !wide ? 0 : 1);
  }

  /** Carries the quote into the booking form. */
  function bookingHref(): string {
    const params = new URLSearchParams({ service });
    if (quote) {
      params.set('quote', quote.quoteId);
      try {
        sessionStorage.setItem(
          'assembleo:quote',
          JSON.stringify({
            quoteId: quote.quoteId,
            service: quote.service,
            distanceKm: quote.distanceKm,
            total: quote.breakdown.total,
            origin: origin.text,
            destination: destination.text,
            date,
            notes,
          }),
        );
      } catch {
        // Private mode or storage disabled — the query params still carry enough.
        params.set('to', destination.text.slice(0, 120));
        params.set('total', String(quote.breakdown.total));
      }
    }
    return `/contact?${params.toString()}`;
  }

  /* ---- pieces ---------------------------------------------------------- */
  const Heading = headingLevel;
  const L = LABELS[service];

  const serviceTabs = (
    <div class="calc__tabs" role="tablist" aria-label="Service">
      {services.map((s) => (
        <button
          key={s}
          type="button"
          role="tab"
          id={`${uid}-tab-${s}`}
          aria-selected={service === s}
          aria-controls={`${uid}-panel`}
          tabIndex={service === s ? 0 : -1}
          class="calc__tab"
          onKeyDown={(e: KeyboardEvent) => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            e.preventDefault();
            const i = services.indexOf(service);
            const next = services[(i + (e.key === 'ArrowRight' ? 1 : services.length - 1)) % services.length]!;
            setService(next);
            document.getElementById(`${uid}-tab-${next}`)?.focus();
          }}
          onClick={() => {
            setService(s);
            setQuote(null);
            setStatus('idle');
          }}
        >
          {LABELS[s].tab}
        </button>
      ))}
    </div>
  );

  const addressFields = (
    <>
      {!manual && (
        <>
          <div class="field">
            <label class="field__label" for={`${uid}-origin`}>
              {L.origin}
              <span class="field__hint">Start typing and pick from the list.</span>
            </label>
            <input
              ref={originRef}
              id={`${uid}-origin`}
              class="input"
              type="text"
              autocomplete="address-line1"
              autocorrect="off"
              spellcheck={false}
              enterkeyhint="next"
              value={origin.text}
              aria-invalid={showError('origin') ? 'true' : undefined}
              aria-describedby={showError('origin') ? `${uid}-origin-err` : undefined}
              onFocus={(e) => {
                wakePlaces();
                liftForKeyboard(e.currentTarget as HTMLElement);
              }}
              onInput={(e) => setOrigin({ text: (e.currentTarget as HTMLInputElement).value })}
              onBlur={() => setTouched((t) => ({ ...t, origin: true }))}
            />
            {showError('origin') && (
              <p class="field__error" id={`${uid}-origin-err`}>{showError('origin')}</p>
            )}
          </div>

          <div class="field">
            <label class="field__label" for={`${uid}-destination`}>{L.dest}</label>
            <input
              ref={destRef}
              id={`${uid}-destination`}
              class="input"
              type="text"
              autocomplete="address-line1"
              autocorrect="off"
              spellcheck={false}
              enterkeyhint="go"
              value={destination.text}
              aria-invalid={showError('destination') ? 'true' : undefined}
              aria-describedby={showError('destination') ? `${uid}-destination-err` : undefined}
              onFocus={(e) => {
                wakePlaces();
                liftForKeyboard(e.currentTarget as HTMLElement);
              }}
              onInput={(e) => setDestination({ text: (e.currentTarget as HTMLInputElement).value })}
              onBlur={() => setTouched((t) => ({ ...t, destination: true }))}
            />
            {showError('destination') && (
              <p class="field__error" id={`${uid}-destination-err`}>{showError('destination')}</p>
            )}
          </div>
        </>
      )}

      {manual && (
        <div class="field">
          <label class="field__label" for={`${uid}-km`}>
            Distance between the two addresses
            <span class="field__hint">One way, in kilometres. Any map app will tell you.</span>
          </label>
          <div class="calc__km">
            <input
              id={`${uid}-km`}
              class="input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*[.,]?[0-9]*"
              enterkeyhint="go"
              value={km}
              aria-invalid={showError('km') ? 'true' : undefined}
              aria-describedby={showError('km') ? `${uid}-km-err` : undefined}
              onInput={(e) => setKm((e.currentTarget as HTMLInputElement).value.replace(',', '.'))}
              onBlur={() => setTouched((t) => ({ ...t, km: true }))}
            />
            <span class="calc__kmUnit" aria-hidden="true">km</span>
          </div>
          {showError('km') && <p class="field__error" id={`${uid}-km-err`}>{showError('km')}</p>}
        </div>
      )}

      {placesConfigured() && (
        <button
          type="button"
          class="calc__switch"
          onClick={() => {
            setManual((m) => !m);
            setTouched({});
          }}
        >
          {manual ? 'Use address search instead' : 'Enter the distance in kilometres instead'}
        </button>
      )}

      {variant === 'full' && (
        <div class="calc__extra">
          <button
            type="button"
            class="calc__disclosure"
            aria-expanded={showExtra}
            aria-controls={`${uid}-extra`}
            onClick={() => setShowExtra((v) => !v)}
          >
            <span>Add a date or describe the items</span>
            <span class="calc__disclosureMark" aria-hidden="true">{showExtra ? '−' : '+'}</span>
          </button>
          {showExtra && (
            <div id={`${uid}-extra`}>
              <div class="field">
                <label class="field__label" for={`${uid}-date`}>
                  Preferred date <span class="field__hint">Optional. It does not change the price.</span>
                </label>
                <input
                  id={`${uid}-date`}
                  class="input"
                  type="date"
                  value={date}
                  onInput={(e) => setDate((e.currentTarget as HTMLInputElement).value)}
                />
              </div>
              <div class="field">
                <label class="field__label" for={`${uid}-notes`}>
                  What are we moving? <span class="field__hint">Optional. Helps us send the right van.</span>
                </label>
                <textarea
                  id={`${uid}-notes`}
                  class="textarea"
                  rows={3}
                  value={notes}
                  placeholder="1 three-seat sofa, 2 boxes"
                  onInput={(e) => setNotes((e.currentTarget as HTMLTextAreaElement).value)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  const skeleton = (
    <div class="calc__skeleton" aria-hidden="true">
      <span style="width:70%"></span>
      <span style="width:88%"></span>
      <span style="width:60%"></span>
      <span class="calc__skeleton--total" style="width:52%"></span>
    </div>
  );

  const emptyState = (
    <div class="calc__empty">
      <p class="calc__emptyTitle">No estimate yet</p>
      <p class="small">
        {manual
          ? 'Put in the distance and we will price the job.'
          : 'Enter the two addresses and we will price the job. It takes about thirty seconds and we do not ask for your details.'}
      </p>
    </div>
  );

  const errorState = (() => {
    const m = errorMessage(err);
    return (
      <div class="calc__error" role="alert">
        <p class="calc__errorTitle">{m.title}</p>
        <p class="small">{m.body}</p>
        <div class="calc__errorActions">
          <button type="button" class="btn btn--ghost btn--compact" onClick={() => void estimate()}>
            Try again
          </button>
          {m.showContact && (
            <a class="btn btn--ghost btn--compact" href="/contact">Send us the job instead</a>
          )}
        </div>
      </div>
    );
  })();

  const result = quote && (
    <div class="calc__result" ref={resultRef} tabIndex={-1}>
      <p class="calc__resultKicker">
        {LABELS[quote.service].tab} · {quote.distanceKm} km one way
      </p>

      <dl class="calc__lines num">
        <div>
          <dt>Base service fee</dt>
          <dd>{formatCAD(quote.breakdown.baseFee)}</dd>
        </div>
        <div>
          <dt>
            Distance <span class="calc__mute">{quote.distanceKm} km × {formatCAD(quote.breakdown.distanceRate)}</span>
          </dt>
          <dd>{formatCAD(quote.breakdown.distanceCharge)}</dd>
        </div>
        <div class="calc__lines--sub">
          <dt>Subtotal{quote.breakdown.minimumApplied ? ' (minimum charge)' : ''}</dt>
          <dd>{formatCAD(quote.breakdown.subtotal)}</dd>
        </div>
        <div>
          <dt>HST {Math.round(quote.breakdown.taxRate * 100)}%</dt>
          <dd>{formatCAD(quote.breakdown.tax)}</dd>
        </div>
      </dl>

      <div class="calc__total num">
        <span>Estimated total</span>
        <strong>{formatCAD(quote.breakdown.total)}</strong>
      </div>

      {quote.breakdown.minimumApplied && (
        <p class="small calc__minNote">
          This job is under our minimum, so you are charged the minimum call-out rather than the
          distance rate. Anything further is priced per kilometre.
        </p>
      )}

      {quote.service === 'moving' ? (
        <div class="scope scope--inline calc__scope">
          <p class="scope__title">Curbside only</p>
          <p>{CURBSIDE}</p>
        </div>
      ) : (
        <div class="scope scope--inline calc__scope">
          <p class="scope__title">What this covers</p>
          <ul class="calc__includes">
            {DELIVERY_INCLUDED.map((i) => <li key={i}>{i}</li>)}
          </ul>
        </div>
      )}

      <a class="btn btn--signal btn--block btn--keep calc__book" href={bookingHref()} ref={bookRef}>
        Book this job
      </a>

      <p class="legal calc__disclaimer">{quote.disclaimer}</p>

      <button type="button" class="calc__switch" onClick={reset}>Start another estimate</button>
    </div>
  );

  /* ---- render ---------------------------------------------------------- */
  const stepped = !wide;
  const showChooser = stepped && multi && step === 0;
  const showForm = wide || step === 1;
  const showResultPane = wide || step === 2;

  return (
    <div class={`calc calc--${variant}`}>
      <div class="calc__panel panel">
        <div class="calc__head">
          <Heading class="calc__heading">{heading}</Heading>
          {stepped && multi && (
            <p class="calc__stepcount" aria-live="polite">Step {step + 1} of 3</p>
          )}
        </div>

        {showChooser && (
          <div class="calc__chooser">
            <p class="calc__chooserQ" id={`${uid}-q`}>What do you need?</p>
            <div role="group" aria-labelledby={`${uid}-q`} class="calc__chooserList">
              {services.map((s) => (
                <button
                  key={s}
                  type="button"
                  class="calc__choice"
                  onClick={() => {
                    setService(s);
                    setStep(1);
                  }}
                >
                  <span class="calc__choiceName">{LABELS[s].tab}</span>
                  <span class="calc__choiceBlurb">{LABELS[s].blurb}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!showChooser && (
          <div class="calc__body">
            <div class="calc__formSide" hidden={!showForm}>
              {multi && wide && serviceTabs}
              <form
                id={`${uid}-panel`}
                role={multi && wide ? 'tabpanel' : undefined}
                aria-labelledby={multi && wide ? `${uid}-tab-${service}` : undefined}
                onSubmit={estimate}
                novalidate
              >
                {stepped && multi && (
                  <button type="button" class="calc__back" onClick={() => setStep(0)}>
                    Change service
                  </button>
                )}
                {addressFields}
                <button
                  type="submit"
                  class="btn btn--signal btn--block btn--keep calc__submit"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Working out the price…' : 'Estimate this job'}
                </button>
                {variant === 'compact' && (
                  <a class="textlink calc__full" href={`/calculator?service=${service}`}>
                    Open the full calculator
                  </a>
                )}
              </form>
            </div>

            <div class="calc__resultSide" hidden={!showResultPane} aria-live="polite" aria-busy={status === 'loading'}>
              {stepped && status !== 'loading' && (
                <button type="button" class="calc__back" onClick={() => setStep(1)}>
                  Change the addresses
                </button>
              )}
              {status === 'loading' && skeleton}
              {status === 'error' && errorState}
              {status === 'done' && result}
              {status === 'idle' && wide && emptyState}
            </div>
          </div>
        )}
      </div>

      {/* Sticky summary, phone only, and only while the panel CTA is off screen. */}
      {quote && !wide && !ctaVisible && (
        <div class="calc__sticky">
          <div class="calc__stickyText num">
            <span>Estimated total</span>
            <strong>{formatCAD(quote.breakdown.total)}</strong>
          </div>
          <a class="btn btn--signal" href={bookingHref()}>Book</a>
        </div>
      )}
    </div>
  );
}
