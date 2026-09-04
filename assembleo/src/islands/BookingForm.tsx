/**
 * Booking form. Two variants that are genuinely different forms:
 *  - residential: what, where, when, tell us about it
 *  - commercial:  company, site type, unit count, target date
 *
 * Never a native submit that navigates. Validation is on blur with inline
 * messages under the field concerned; there are no alert dialogs anywhere.
 */

import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { errorMessage, formatCAD, submitBooking } from '../lib/api';
import type { BookingRequest, BookingService, BookingType, TimeWindow } from '../lib/types';

interface Props {
  variant?: BookingType;
  heading?: string;
  headingLevel?: 'h2' | 'h3';
  /** Preselects the service dropdown, e.g. from /contact?service=moving. */
  defaultService?: BookingService;
}

const SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY as string | undefined;

const SERVICES: Array<{ value: BookingService; label: string }> = [
  { value: 'assembly', label: 'Furniture assembly' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'moving', label: 'Moving (curbside to curbside)' },
  { value: 'other', label: 'Something else' },
];

const WINDOWS: Array<{ value: TimeWindow; label: string }> = [
  { value: 'morning', label: 'Morning (8am – 12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm – 5pm)' },
  { value: 'evening', label: 'Evening (5pm – 8pm)' },
  { value: 'flexible', label: 'Any time that suits you' },
];

const SITE_TYPES = [
  'Gym or fitness studio',
  'Clinic or dental office',
  'Hotel',
  'Office',
  'Warehouse',
  'Retail',
  'Property management or rentals',
  'Student housing',
  'Other',
];

interface StoredQuote {
  quoteId: string;
  service: string;
  distanceKm: number;
  total: number;
  origin: string;
  destination: string;
  date?: string;
  notes?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function BookingForm({
  variant = 'residential',
  heading = 'Tell us about the job',
  headingLevel = 'h2',
  defaultService,
}: Props) {
  const commercial = variant === 'commercial';
  const uid = useMemo(() => `bk-${variant}`, [variant]);

  const [service, setService] = useState<BookingService>(defaultService ?? (commercial ? 'assembly' : 'assembly'));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [siteType, setSiteType] = useState('');
  const [unitCount, setUnitCount] = useState('');
  const [address, setAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredWindow, setPreferredWindow] = useState<TimeWindow>('flexible');
  const [details, setDetails] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot

  const [quote, setQuote] = useState<StoredQuote | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<unknown>(null);

  const tsRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<string>('');
  const formRef = useRef<HTMLFormElement>(null);

  /* ---- pick up a quote carried over from the calculator ---------------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const svc = params.get('service') as BookingService | null;
    if (svc && SERVICES.some((s) => s.value === svc)) setService(svc);

    let stored: StoredQuote | null = null;
    try {
      const raw = sessionStorage.getItem('assembleo:quote');
      if (raw) stored = JSON.parse(raw) as StoredQuote;
    } catch {
      /* storage unavailable — fall back to the query string below */
    }

    const qid = params.get('quote');
    if (stored && (!qid || stored.quoteId === qid)) {
      setQuote(stored);
      if (stored.destination) setAddress(stored.destination);
      if (stored.date) setPreferredDate(stored.date);
      if (stored.notes) setDetails(stored.notes);
    } else if (qid) {
      setQuote({
        quoteId: qid,
        service: svc ?? 'delivery',
        distanceKm: 0,
        total: Number(params.get('total') ?? 0),
        origin: '',
        destination: params.get('to') ?? '',
      });
      if (params.get('to')) setAddress(params.get('to')!);
    }
  }, []);

  /* ---- Turnstile ------------------------------------------------------- */
  useEffect(() => {
    if (!SITE_KEY || !tsRef.current) return undefined;
    let widgetId: string | undefined;

    const render = () => {
      const ts = (window as any).turnstile;
      if (!ts || !tsRef.current || widgetId !== undefined) return;
      widgetId = ts.render(tsRef.current, {
        sitekey: SITE_KEY,
        theme: 'light',
        action: variant,
        callback: (token: string) => (tokenRef.current = token),
        'expired-callback': () => (tokenRef.current = ''),
        'error-callback': () => (tokenRef.current = ''),
      });
    };

    if ((window as any).turnstile) {
      render();
    } else if (!document.querySelector('script[data-turnstile]')) {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.defer = true;
      s.dataset.turnstile = 'true';
      s.onload = render;
      document.head.appendChild(s);
    } else {
      const t = window.setInterval(() => {
        if ((window as any).turnstile) {
          window.clearInterval(t);
          render();
        }
      }, 120);
      return () => window.clearInterval(t);
    }

    return () => {
      const ts = (window as any).turnstile;
      if (ts && widgetId !== undefined) ts.remove?.(widgetId);
    };
  }, [variant]);

  /* ---- validation ------------------------------------------------------ */
  const errors: Record<string, string> = {};
  if (name.trim().length < 2) errors.name = 'Tell us who to ask for.';
  if (!EMAIL_RE.test(email.trim())) errors.email = 'We need a working email to send the quote to.';
  if (phone.replace(/\D/g, '').length < 10) errors.phone = 'A 10-digit phone number, so we can call about access.';
  if (address.trim().length < 5) errors.address = commercial ? 'Where is the site?' : 'Where is the job?';
  if (commercial && company.trim().length < 2) errors.company = 'Which company is this for?';
  if (commercial && !siteType) errors.siteType = 'Pick the closest match.';
  if (commercial && !unitCount.trim()) errors.unitCount = 'A rough number is fine.';
  if (!consent) errors.consent = 'We need your okay to reply to you.';

  const valid = Object.keys(errors).length === 0;
  const show = (k: string) => (touched[k] ? errors[k] : undefined);
  const mark = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));

  /* ---- submit ---------------------------------------------------------- */
  async function onSubmit(e: Event) {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, address: true, company: true, siteType: true, unitCount: true, consent: true });
    setErr(null);

    if (!valid) {
      const first = Object.keys(errors)[0];
      const el = document.getElementById(`${uid}-${first}`);
      el?.focus();
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    const payload: BookingRequest = {
      type: variant,
      service,
      ...(quote ? { quoteId: quote.quoteId } : {}),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      ...(commercial ? { company: company.trim(), siteType, unitCount: unitCount.trim() } : {}),
      address: address.trim(),
      preferredDate,
      preferredWindow: commercial ? 'flexible' : preferredWindow,
      details: details.trim(),
      consent,
      ...(tokenRef.current ? { turnstileToken: tokenRef.current } : {}),
      website,
    };

    setSubmitting(true);
    try {
      const res = await submitBooking(payload);

      // Conversion event fires before we navigate away.
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({
        event: 'generate_lead',
        lead_type: variant,
        lead_service: service,
        booking_id: res.bookingId,
        ...(quote ? { quote_id: quote.quoteId, value: quote.total, currency: 'CAD' } : {}),
      });

      try {
        sessionStorage.removeItem('assembleo:quote');
      } catch { /* ignore */ }

      window.location.assign('/thank-you');
    } catch (e2) {
      setErr(e2);
      setSubmitting(false);
      (window as any).turnstile?.reset?.();
      tokenRef.current = '';
      window.setTimeout(() => formRef.current?.querySelector<HTMLElement>('.form-status')?.focus(), 40);
    }
  }

  const Heading = headingLevel;
  const errMsg = err ? errorMessage(err) : null;

  const field = (
    id: string,
    label: string,
    input: preact.JSX.Element,
    hint?: string,
  ) => (
    <div class="field">
      <label class="field__label" for={`${uid}-${id}`}>
        {label}
        {hint && <span class="field__hint">{hint}</span>}
      </label>
      {input}
      {show(id) && <p class="field__error" id={`${uid}-${id}-err`}>{show(id)}</p>}
    </div>
  );

  const aria = (id: string) => ({
    id: `${uid}-${id}`,
    'aria-invalid': show(id) ? ('true' as const) : undefined,
    'aria-describedby': show(id) ? `${uid}-${id}-err` : undefined,
    onBlur: mark(id),
  });

  return (
    <form class="bform" onSubmit={onSubmit} ref={formRef} novalidate>
      <Heading class="bform__heading">{heading}</Heading>

      {quote && (
        <div class="bform__quote">
          <p class="bform__quoteTitle">Your estimate is attached</p>
          <p class="small">
            {quote.total > 0 && <>Estimated total <strong class="num">{formatCAD(quote.total)}</strong>{quote.distanceKm > 0 && <> over {quote.distanceKm} km</>}. </>}
            Reference <span class="num">{quote.quoteId}</span>. We will confirm it against the job before you pay anything.
          </p>
        </div>
      )}

      {commercial &&
        field(
          'company',
          'Company name',
          <input class="input" type="text" autocomplete="organization" value={company}
            onInput={(e) => setCompany((e.currentTarget as HTMLInputElement).value)} {...aria('company')} />,
        )}

      {commercial &&
        field(
          'siteType',
          'Site type',
          <select class="select" value={siteType}
            onChange={(e) => setSiteType((e.currentTarget as HTMLSelectElement).value)} {...aria('siteType')}>
            <option value="">Choose one</option>
            {SITE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>,
        )}

      {commercial &&
        field(
          'unitCount',
          'How many units or items?',
          <input class="input" type="text" inputMode="numeric" value={unitCount} placeholder="e.g. 18 suites, 4 items each"
            onInput={(e) => setUnitCount((e.currentTarget as HTMLInputElement).value)} {...aria('unitCount')} />,
          'A rough count is enough to price it.',
        )}

      {!commercial &&
        field(
          'service',
          'What do you need?',
          <select class="select" value={service}
            onChange={(e) => setService((e.currentTarget as HTMLSelectElement).value as BookingService)} {...aria('service')}>
            {SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>,
        )}

      {field(
        'name',
        commercial ? 'Your name' : 'Your name',
        <input class="input" type="text" autocomplete="name" value={name}
          onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)} {...aria('name')} />,
      )}

      {field(
        'phone',
        'Phone',
        <input class="input" type="tel" inputMode="tel" autocomplete="tel" value={phone} placeholder="(905) 555-0142"
          onInput={(e) => setPhone((e.currentTarget as HTMLInputElement).value)} {...aria('phone')} />,
        'We call about parking and access, not to sell you anything.',
      )}

      {field(
        'email',
        'Email',
        <input class="input" type="email" inputMode="email" autocomplete="email" autocapitalize="off" spellcheck={false} value={email}
          onInput={(e) => setEmail((e.currentTarget as HTMLInputElement).value)} {...aria('email')} />,
        'Where the quote goes.',
      )}

      {field(
        'address',
        commercial ? 'Site address' : 'Job address',
        <input class="input" type="text" autocomplete="street-address" value={address}
          onInput={(e) => setAddress((e.currentTarget as HTMLInputElement).value)} {...aria('address')} />,
        commercial ? undefined : 'Where the crew is going.',
      )}

      {field(
        'preferredDate',
        commercial ? 'Target date' : 'Preferred date',
        <input class="input" type="date" value={preferredDate}
          onInput={(e) => setPreferredDate((e.currentTarget as HTMLInputElement).value)} {...aria('preferredDate')} />,
        commercial ? 'When does it need to be finished by?' : 'Optional.',
      )}

      {!commercial &&
        field(
          'preferredWindow',
          'Preferred arrival window',
          <select class="select" value={preferredWindow}
            onChange={(e) => setPreferredWindow((e.currentTarget as HTMLSelectElement).value as TimeWindow)} {...aria('preferredWindow')}>
            {WINDOWS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>,
        )}

      {field(
        'details',
        commercial ? 'What is the job?' : 'Anything else we should know?',
        <textarea class="textarea" rows={4} value={details}
          placeholder={commercial
            ? 'Furniture list or PO number, access hours, loading dock, whether we can work evenings.'
            : 'Product links, how many boxes, stairs, elevator, parking.'}
          onInput={(e) => setDetails((e.currentTarget as HTMLTextAreaElement).value)} {...aria('details')} />,
        commercial ? 'A furniture list or PO gets you a firm price fastest.' : 'Product links or a photo of the boxes gets you a firm price fastest.',
      )}

      {/* Honeypot. Off-screen rather than display:none so bots still fill it. */}
      <div class="hp" aria-hidden="true">
        <label for={`${uid}-website`}>Leave this field empty</label>
        <input id={`${uid}-website`} name="website" type="text" tabIndex={-1} autocomplete="off" value={website}
          onInput={(e) => setWebsite((e.currentTarget as HTMLInputElement).value)} />
      </div>

      <div class="field">
        <label class="choice" for={`${uid}-consent`}>
          <input id={`${uid}-consent`} type="checkbox" checked={consent}
            aria-invalid={show('consent') ? 'true' : undefined}
            aria-describedby={show('consent') ? `${uid}-consent-err` : undefined}
            onChange={(e) => { setConsent((e.currentTarget as HTMLInputElement).checked); mark('consent')(); }} />
          <span>
            Contact me about this job. We do not add you to a mailing list, and we do not share your
            details. <a href="/privacy">Privacy policy</a>.
          </span>
        </label>
        {show('consent') && <p class="field__error" id={`${uid}-consent-err`}>{show('consent')}</p>}
      </div>

      {SITE_KEY && <div class="bform__turnstile" ref={tsRef} />}

      <button type="submit" class="btn btn--signal btn--block btn--keep bform__submit" disabled={submitting}>
        {submitting ? 'Sending your request…' : commercial ? 'Request a quote' : 'Send this to the crew'}
      </button>

      <p class="legal bform__note">
        Nothing is charged now. You get a fixed price back before anyone is booked in.
      </p>

      {errMsg && (
        <div class="form-status" role="alert" tabIndex={-1}>
          <strong>{errMsg.title}</strong>
          <span> {errMsg.body}</span>
        </div>
      )}
    </form>
  );
}
