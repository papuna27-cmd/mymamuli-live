/**
 * Page copy. Components read from here; text edits never touch markup.
 */

import { site } from './site';

export const home = {
  title: 'Furniture Assembly, Delivery & Moving | GTA | Assembleo',
  metaDescription:
    'Insured crews for flat-pack assembly, store-to-door delivery and curbside furniture moving across Mississauga and the GTA. Price a job in 30 seconds.',
  hero: {
    h1: 'Furniture built, delivered and moved.',
    support: `Insured crews across Mississauga and the GTA. Most weeks we can be there tomorrow.`,
    primary: { label: 'Get a quote', href: '/calculator' },
    secondary: { label: `Call ${site.phoneDisplay}`, href: `tel:${site.phone}` },
    /* Shown beside the headline on wide screens: a number beats a paragraph. */
    facts: [
      { k: 'Furniture assembly', v: 'Priced per item' },
      { k: 'Delivery', v: 'From $169.50 all in' },
      { k: 'Moving', v: 'From $146.90 all in' },
      { k: 'Quotes back', v: 'Within 2 hours' },
    ],
  },
  trust: [
    { label: `${site.facts.liabilityCover} liability insured`, verified: true },
    { label: 'WSIB covered crew', verified: true },
    { label: `${site.facts.rating} ★ from ${site.facts.reviewCount} reviews`, verified: false },
    { label: `Quotes back ${site.facts.responseTime}`, verified: false },
  ],
  services: {
    h2: 'What we do',
    intro: 'Four jobs. Two of them you can price yourself, right now, without talking to anyone.',
  },
  steps: {
    h2: 'How it works',
    items: [
      {
        title: 'Send the job',
        body: 'Product links, a photo of the boxes, or just two addresses. It takes about thirty seconds.',
      },
      {
        title: 'Get a price and a window',
        body: `A fixed price and a two-hour arrival window, back ${site.facts.responseTime} during working hours.`,
      },
      {
        title: 'We show up and finish it',
        body: 'Insured crew, our own tools, and the packaging leaves with us.',
      },
    ],
  },
  quote: {
    h2: 'Estimate a job',
    intro:
      'Delivery and moving are priced on the distance between two addresses, so you can get a real number before you speak to us.',
    fullLink: 'Open the full calculator',
  },
  brands: {
    h2: 'Boxes we open every week',
    intro: `We assemble ${site.brands.slice(0, -1).join(', ')} and ${site.brands.at(-1)} furniture, plus anything else that arrives flat with an Allen key taped inside.`,
  },
  reviews: {
    h2: 'What customers say',
  },
  closing: {
    h2: 'Book a job',
    intro:
      'Tell us what you have and where it is going. If we are not the right people for it, we will say so.',
  },
};

export const about = {
  title: 'About Assembleo | Insured Furniture Crews in Mississauga',
  metaDescription:
    'Who we are, where we work and what we carry. Assembleo has been assembling, delivering and moving furniture across the GTA since 2019.',
  h1: 'A van, a set of tools, and people who turn up',
  lede: `Assembleo started in ${site.founded} with one van and a phone number handed around Mississauga condo boards. We do the same work today, with more vans.`,
  sections: [
    {
      h2: 'What we actually do all day',
      body: [
        'Most of our week is flat-pack: wardrobes, beds, desks, media walls, patio sets in the spring and home gyms in January. The rest is moving one large thing from A to B, or collecting furniture from a store because it will not fit in a sedan.',
        'We are not a moving company and we do not pretend to be one. We do not pack your kitchen into boxes, we do not carry a piano, and we do not do household relocations. We do the awkward middle jobs that are too big for you and too small for a moving firm.',
      ],
    },
    {
      h2: 'The crew',
      body: [
        'Everyone who comes to your door is on our payroll and covered by WSIB — we do not subcontract residential work to whoever is free that day. Crew members are background checked before their first job and trained on the brands we see most, which means they have built your wardrobe before.',
        'The same two or three people cover most of a given area, so if you book us again you will often get someone who has already been to your building and knows where the loading dock is.',
      ],
    },
    {
      h2: 'Insurance and safety',
      body: [
        `We carry ${site.facts.liabilityCover} in commercial general liability and can send the certificate to you or your property manager before we arrive — most condo boards ask, and we would rather have it in your inbox than hold up the elevator booking.`,
        'Our crew is covered by WSIB, and we can provide a clearance certificate for commercial clients. We photograph any existing damage before an item goes in the van. That protects you as much as it protects us.',
      ],
    },
  ],
  facts: {
    h2: 'The short version',
    rows: [
      { k: 'Based in', v: `${site.address.city}, ${site.address.regionName}` },
      { k: 'Working since', v: String(site.founded) },
      { k: 'Jobs completed', v: site.facts.jobsCompleted },
      { k: 'Liability insurance', v: `${site.facts.liabilityCover} commercial general liability` },
      { k: 'Crew coverage', v: 'WSIB, clearance certificate on request' },
      { k: 'Typical quote turnaround', v: `${site.facts.responseTime} during working hours` },
    ],
  },
  areas: {
    h2: 'Where we work',
    intro:
      'Our vans are based in Mississauga. The further out a job is, the more the distance charge matters — the calculator shows you exactly how much.',
  },
};

export const commercial = {
  title: 'Commercial Furniture Assembly | GTA | Assembleo',
  metaDescription:
    'Volume furniture assembly for GTA gyms, clinics, hotels, offices, warehouses and property managers. Out-of-hours scheduling, WSIB, $2M liability, net 30.',
  h1: 'Commercial assembly and installation',
  lede: 'Volume furniture work for sites that cannot close. One contact, a fixed project price, and a crew that schedules around your hours instead of yours around ours.',
  segments: [
    { name: 'Gyms and fitness studios', body: 'Racks, rigs, platforms, cardio floors and lockers. We install overnight so you open on time.' },
    { name: 'Clinics and dental offices', body: 'Reception, waiting rooms, treatment casework and records storage, done between patient days.' },
    { name: 'Hotels', body: 'Guest room sets floor by floor, lobby and lounge furniture, and back-of-house shelving.' },
    { name: 'Offices', body: 'Desking and benching systems, task and meeting chairs, storage walls. Evenings and weekends.' },
    { name: 'Warehouses', body: 'Racking, shelving, workbenches and mezzanine furniture, staged around your shifts.' },
    { name: 'Retail fit-outs', body: 'Fixtures, display units and stockroom shelving, sequenced against your opening date.' },
    { name: 'Property managers', body: 'Suite turnovers to a unit list, with a photo record per unit and one invoice.' },
    { name: 'Student housing', body: 'Twenty identical units, four items each, one August deadline. This is our busiest month.' },
  ],
  why: {
    h2: 'What you get that residential does not',
    rows: [
      { k: 'Scheduling', v: 'Evenings, overnight and weekends, so the floor stays open during business hours.' },
      { k: 'Pricing', v: 'A fixed project price on unit count and site conditions — not an hourly rate that grows.' },
      { k: 'Invoicing', v: 'Net 30 on an approved account, one invoice per project or per phase.' },
      { k: 'Compliance', v: `${site.facts.liabilityCover} commercial general liability and WSIB clearance, sent before the first visit.` },
      { k: 'Contact', v: 'One person who knows your job, from the quote through to the completion list.' },
      { k: 'Handover', v: 'A completion record with photos, per room or per unit.' },
    ],
  },
  quote: {
    h2: 'Request a quote',
    intro:
      'Tell us the site and roughly how many units. We will come back with a fixed price and the dates we can hold.',
  },
};

export const contact = {
  title: 'Contact & Booking | Assembleo | Mississauga & GTA',
  metaDescription:
    'Book furniture assembly, delivery or moving across the GTA. Call, email or send the job through the form and get a fixed price back within two hours.',
  h1: 'Book a job',
  lede: 'Send us the details and you will have a fixed price and a date back, usually within two hours during working hours.',
  formHeading: 'Tell us about the job',
  directHeading: 'Or reach us directly',
  hoursHeading: 'Hours',
  areaHeading: 'Where we work',
};

export const calculatorPage = {
  title: 'Delivery & Moving Price Calculator | Assembleo',
  metaDescription:
    'Estimate a GTA furniture delivery or curbside move in about thirty seconds. Base fee plus distance, HST shown separately. No contact details required.',
  h1: 'Price a delivery or a move',
  lede:
    'Enter two addresses and you get the full breakdown — base fee, distance charge, HST and total. No contact details needed to see a number.',
  note:
    'Assembly and commercial work are not priced on distance, so they are not in this calculator. Send those through the booking form and you will have a fixed price back within two hours.',
};

export const thankYou = {
  title: 'Request received | Assembleo',
  metaDescription: 'Your request has reached us. Here is what happens next.',
  h1: 'Got it. We have your request.',
  lede: `A real person reads every one of these. You will hear back ${site.facts.responseTime} during working hours, and first thing in the morning if you sent it overnight.`,
  next: [
    'We read the details and check the crew calendar for your area.',
    'You get a fixed price and a two-hour arrival window by email, or a call if you asked for one.',
    'You confirm, and the slot is yours. Nothing is charged before the job is done.',
  ],
  urgent: `If it is urgent, call ${site.phoneDisplay} — that is faster than waiting on the email.`,
};

export const notFound = {
  title: 'Page not found | Assembleo',
  metaDescription: 'That page does not exist. Here is where everything else lives.',
  h1: 'That page is not here',
  lede: 'The link is wrong or the page has moved. These are the ones people usually want.',
};

export const legal = {
  privacy: {
    title: 'Privacy Policy | Assembleo',
    metaDescription: 'What personal information Assembleo collects, why we collect it, how long we keep it, and how to ask for it back or have it deleted.',
    h1: 'Privacy policy',
    updated: '2026-01-15',
    lede: `${site.legalName} collects the minimum we need to quote and complete your job. This page says exactly what that is.`,
    sections: [
      {
        h2: 'What we collect',
        body: [
          'When you use the calculator we process the two addresses you enter to work out the driving distance. If you do not go on to book, we keep the quote for 7 days so you can come back to it, and then it is deleted.',
          'When you book we collect your name, phone number, email address, the service address, your preferred date and whatever you tell us about the job. For commercial work we also collect your company name and site type.',
          'Our web host records standard server logs, including IP address and browser type, for security and abuse prevention. We use Cloudflare Turnstile to tell humans from bots; it works without tracking cookies.',
        ],
      },
      {
        h2: 'Why we collect it',
        body: [
          'To quote your job, to arrange and complete the work, to invoice you, and to contact you about that specific job. That is the whole list.',
          'We do not sell personal information, and we do not share it with anyone except the service providers who help us run the business — our email host, our payment processor, and the mapping service that calculates distance between the two addresses you gave us.',
        ],
      },
      {
        h2: 'Analytics and consent',
        body: [
          'We use Google Analytics through Google Tag Manager to understand which pages lead to bookings. Analytics and advertising storage are denied by default and are only enabled if you consent.',
          'You can decline without losing any functionality — the calculator, the forms and the phone number all work the same either way.',
        ],
      },
      {
        h2: 'How long we keep it',
        body: [
          'Quotes that never became bookings: 7 days. Booking and job records, including invoices: 7 years, because Canadian tax rules require it. Server logs: 30 days.',
        ],
      },
      {
        h2: 'Your rights',
        body: [
          'Under PIPEDA you can ask what personal information we hold about you, ask us to correct it, and ask us to delete anything we are not legally required to keep. Email ' + site.email + ' and we will respond within 30 days.',
          'If you are not satisfied with our answer you can complain to the Office of the Privacy Commissioner of Canada.',
        ],
      },
      {
        h2: 'Contact',
        body: [
          `Privacy questions go to ${site.email}, or write to ${site.legalName}, ${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}.`,
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of Service | Assembleo',
    metaDescription: 'The terms Assembleo works under: quotes and estimates, what is included, access requirements, cancellations, liability and payment.',
    h1: 'Terms of service',
    updated: '2026-01-15',
    lede: `Plain-language terms for work carried out by ${site.legalName} Booking a job means you accept them.`,
    sections: [
      {
        h2: 'Quotes and estimates',
        body: [
          'Prices produced by the calculator on this site are estimates based on the driving distance between the two addresses you entered. They are not binding quotes. The final price is confirmed when you book, once we know the item, the access and the schedule.',
          'A confirmed booking price is fixed unless the job on the day differs from what you described — more items, a different address, or access that was not disclosed.',
        ],
      },
      {
        h2: 'What is included',
        body: [
          'What each service covers is set out on its page, and those pages form part of these terms.',
          'Moving jobs are curbside to curbside. The crew loads at the vehicle and unloads at the vehicle. Carrying items up or down floors is not included and must be quoted separately before the day.',
          'Deliveries include carrying the item to a room on the entry floor. Carrying above or below the entry floor is an extra charge and must be arranged in advance.',
        ],
      },
      {
        h2: 'Access and parking',
        body: [
          'You are responsible for legal parking within a reasonable carry of the item at both addresses, and for booking any service elevator or loading dock your building requires.',
          'If we cannot access the site, or we wait more than 30 minutes past the agreed window through no fault of ours, a waiting charge applies. If the job cannot proceed at all, the minimum call-out is charged.',
        ],
      },
      {
        h2: 'Fit and suitability',
        body: [
          'Measuring doorways, stairwells, elevators and the destination space is the customer’s responsibility. If an item does not fit, we will leave it somewhere safe on site and the job is still charged, because the work was performed.',
          'We assemble to the manufacturer’s instructions. We will not modify a product, and we cannot supply missing or damaged parts — we will document them so you can claim from the retailer.',
        ],
      },
      {
        h2: 'Cancellations and rescheduling',
        body: [
          'Reschedule or cancel by the end of the day before your booking at no charge. Cancellations on the day of the booking are charged the minimum call-out for that service, because the slot cannot be refilled.',
        ],
      },
      {
        h2: 'Liability',
        body: [
          `We carry ${site.facts.liabilityCover} in commercial general liability. Damage caused by us is our responsibility, and we photograph existing damage before an item is loaded.`,
          'We are not liable for damage arising from a product defect, from instructions or fixings supplied with the product, from wall or floor conditions we could not see, or from the customer directing us to proceed against our written advice.',
          'Our liability for any job is limited to the value of that job, except where Ontario law does not permit that limit.',
        ],
      },
      {
        h2: 'Payment',
        body: [
          'Residential jobs are payable on completion by card, e-transfer or cash. Commercial accounts are invoiced on net 30 once approved. Overdue commercial invoices accrue interest at 1.5% per month.',
        ],
      },
      {
        h2: 'Governing law',
        body: ['These terms are governed by the laws of the Province of Ontario and the federal laws of Canada that apply in it.'],
      },
    ],
  },
};
