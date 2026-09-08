/**
 * Content for the single-page site. Assembly is the whole business:
 * residential plus commercial (gyms, clinics, hotels, offices).
 */

/* ---------------------------------------------------------------- retailers */

/**
 * Stores whose furniture we assemble.
 *
 * ⚠ These are third-party trademarks. The claim made on the page is
 * "we assemble what you buy there" — NOT that these retailers endorse or
 * partner with us. Do not add their logo files or reword this as a
 * partnership unless a written vendor agreement is in place, in which case
 * the retailer's brand team supplies both the assets and the wording.
 */
export const retailers = [
  'Costco',
  'Walmart',
  'Canadian Tire',
  'Home Depot',
  'Staples',
  'IKEA',
  'Wayfair',
  'Amazon',
];

export const retailerNote =
  'We assemble furniture bought from these retailers. Names are shown for identification only.';

/* ----------------------------------------------------------------- segments */

export interface Segment {
  key: string;
  name: string;
  blurb: string;
  points: string[];
  image: string;
}

export const commercialSegments: Segment[] = [
  {
    key: 'gym',
    name: 'Gyms and fitness studios',
    blurb: 'Racks, rigs, platforms, cardio floors and lockers, installed overnight so you open on time.',
    points: ['Overnight and weekend installs', 'Anchoring to concrete or rubber floors', 'Equipment moved into position'],
    image: 'seg-gym',
  },
  {
    key: 'clinic',
    name: 'Clinics and dental offices',
    blurb: 'Reception desks, waiting rooms, treatment casework and records storage, between patient days.',
    points: ['Work scheduled around clinic hours', 'Quiet, clean, dust-controlled', 'Certificate of insurance on file'],
    image: 'seg-clinic',
  },
  {
    key: 'hotel',
    name: 'Hotels',
    blurb: 'Guest room sets floor by floor, lobby and lounge furniture, and back-of-house shelving.',
    points: ['Room-by-room scheduling', 'Packaging removed in bulk', 'Photo record per room'],
    image: 'seg-hotel',
  },
  {
    key: 'office',
    name: 'Offices and workplaces',
    blurb: 'Desking and benching systems, task chairs, meeting tables and storage walls.',
    points: ['Evenings and weekends', 'Installed to your floor plan', 'One invoice, net 30'],
    image: 'seg-office',
  },
];

export const alsoServe = [
  'Warehouses and racking',
  'Retail fit-outs',
  'Student housing',
  'Property managers',
  'Restaurants and cafés',
  'Schools and daycares',
];

/* -------------------------------------------------------------------- steps */

export const steps = [
  {
    title: 'Send us the list',
    body: 'Product links, a photo of the boxes, or a furniture schedule. Thirty seconds is enough to start.',
  },
  {
    title: 'Get a fixed price',
    body: 'A flat price and an arrival window back within two hours during working hours. No hourly surprises.',
  },
  {
    title: 'We build it and clear up',
    body: 'Insured crew, own tools, everything levelled and checked. The cardboard leaves with us.',
  },
];

/* --------------------------------------------------------------- what's in */

export const included = [
  'Unboxing and sorting of every part',
  'Assembly to the manufacturer instructions',
  'Levelling, and doors and drawers aligned',
  'Every fixing checked and tightened',
  'Packaging removed and recycled',
  'The work area swept',
];

export const extras = [
  'Wall anchoring and tip-over restraints',
  'Fixing into concrete, brick or steel studs',
  'Taking away the furniture you are replacing',
  'Starts before 8:00 am or after 8:00 pm',
];

/* ------------------------------------------------------------------- trust */

export const trustPoints = [
  { title: '$2M liability insured', body: 'Certificate sent to you or your property manager before we arrive.' },
  { title: 'WSIB covered crew', body: 'Everyone on your site is on our payroll, not a same-day subcontractor.' },
  { title: 'Background checked', body: 'Every assembler is checked before their first job and trained on the brands we see most.' },
  { title: '30-day workmanship warranty', body: 'If something we assembled works loose, we come back and fix it at no charge.' },
];
