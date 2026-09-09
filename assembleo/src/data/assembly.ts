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
export interface Retailer {
  /** Matches the filename in src/assets/logos/<slug>.(svg|png|webp). */
  slug: string;
  name: string;
  /** Where the official, permitted logo file comes from. */
  brandAssets: string;
}

/**
 * Stores whose furniture we assemble.
 *
 * ⚠ These are third-party registered trademarks. Drop the official logo files
 * into src/assets/logos/<slug>.svg and the wall renders them automatically;
 * until then it renders a styled wordmark, which needs no permission.
 *
 * Use each retailer's own brand/press page for the files — a logo grabbed off
 * a search engine is usually the wrong version and is not licensed.
 */
export const retailers: Retailer[] = [
  // IKEA leads: it is the single most-asked-for brand in this trade, and the
  // term people actually search is "IKEA assembly".
  { slug: 'ikea', name: 'IKEA', brandAssets: 'https://www.ikea.com/ca/en/newsroom/' },
  { slug: 'costco', name: 'Costco', brandAssets: 'https://www.costco.com/media-centre.html' },
  { slug: 'walmart', name: 'Walmart', brandAssets: 'https://corporate.walmart.com/news/media-library' },
  { slug: 'canadian-tire', name: 'Canadian Tire', brandAssets: 'https://corp.canadiantire.ca/English/media/default.aspx' },
  { slug: 'home-depot', name: 'Home Depot', brandAssets: 'https://corporate.homedepot.com/news-room/media-resources' },
  { slug: 'staples', name: 'Staples', brandAssets: 'https://www.staples.ca/pages/about-us' },
  { slug: 'the-brick', name: 'The Brick', brandAssets: 'https://www.thebrick.com/pages/about-us' },
  { slug: 'leons', name: "Leon's", brandAssets: 'https://www.leons.ca/pages/about-us' },
  { slug: 'jysk', name: 'JYSK', brandAssets: 'https://www.jysk.ca/customer-service/about-jysk' },
  { slug: 'wayfair', name: 'Wayfair', brandAssets: 'https://www.aboutwayfair.com/media-kit' },
  { slug: 'amazon', name: 'Amazon', brandAssets: 'https://press.aboutamazon.com/media-assets' },
  { slug: 'rona', name: 'RONA', brandAssets: 'https://www.rona.ca/en/about-us' },
];

/**
 * The claim made on the page. Saying "we assemble what you buy there" is a
 * statement of fact about our own service and needs no permission. Wording it
 * as a partnership or endorsement does, so do not change this without one.
 */
export const retailerNote =
  'Brand names and logos are the property of their respective owners and are shown to identify the furniture we assemble.';

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
