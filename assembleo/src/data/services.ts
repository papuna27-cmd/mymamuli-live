/**
 * Service definitions. Everything the service pages and the homepage
 * service list render comes from here — editing copy never touches markup.
 */

export type ServiceSlug = 'assembly' | 'commercial' | 'delivery' | 'moving';
export type CalculatorMode = 'delivery' | 'moving';

export interface ItemGroup {
  group: string;
  examples: string[];
}

export interface Service {
  slug: ServiceSlug;
  href: string;
  /** Short name for lists and nav. */
  name: string;
  /** One line under the name in the service list. */
  short: string;
  /** Warning label shown beside the name where a hard limit applies. */
  limit?: string;
  /** Which calculator, if any, is embedded on the detail page. */
  calculator: CalculatorMode | null;

  title: string;
  metaDescription: string;
  h1: string;
  lede: string;

  /** Two-sentence definition of the job. Rendered as the scope block. */
  scopeTitle: string;
  scope: string[];

  included: string[];
  extra: string[];
  notIncluded: string[];
  itemGroups?: ItemGroup[];

  /** Shown near the CTA and used in the Service JSON-LD offer. */
  priceNote: string;
  offerDescription: string;
  cta: { label: string; href: string };
}

export const services: Service[] = [
  {
    slug: 'assembly',
    href: '/services/assembly',
    name: 'Furniture assembly',
    short: 'IKEA, Wayfair, Costco, Structube and every other flat-pack box',
    calculator: null,
    title: 'Furniture Assembly in Mississauga & the GTA | Assembleo',
    metaDescription:
      'Flat-pack furniture assembly across Mississauga and the GTA. IKEA, Costco, Wayfair, Walmart, Structube and Amazon. Insured crews, cardboard taken away.',
    h1: 'Furniture assembly across Mississauga and the GTA',
    lede: 'We unbox it, build it, level it and take the cardboard away. Most single items take under an hour, and we bring our own tools.',
    scopeTitle: 'What an assembly job is',
    scope: [
      'A crew member arrives with tools, builds what you have bought, checks every fixing, and leaves with the packaging.',
      'We assemble furniture you already own or have had delivered. If you also need it picked up from the store, book delivery and assembly together and it becomes one visit.',
    ],
    included: [
      'Unboxing and sorting of parts and hardware',
      'Assembly to the manufacturer instructions',
      'Levelling on uneven floors, and doors and drawers aligned',
      'Every fixing checked and tightened before we leave',
      'Cardboard, foam and plastic taken away and recycled',
      'The work area swept',
    ],
    extra: [
      'Wall anchoring and tip-over restraints (we recommend it for anything taller than it is wide)',
      'Taking away furniture you are replacing',
      'Fixing into concrete, brick or steel studs',
      'Starts before 8:00 am or after 8:00 pm',
    ],
    notIncluded: [
      'Electrical, plumbing or gas work of any kind',
      'Repairing furniture that arrived damaged or is missing parts — we will document it for your claim, but we cannot manufacture the part',
      'Custom carpentry or modifying the product',
    ],
    itemGroups: [
      { group: 'Bedroom', examples: ['Bed frames and storage beds', 'Wardrobes and PAX runs', 'Dressers and nightstands', 'Cribs and change tables'] },
      { group: 'Living and dining', examples: ['Sofas and sectionals', 'TV units and media walls', 'Dining tables and chairs', 'Bookcases and shelving'] },
      { group: 'Work', examples: ['Desks and standing desks', 'Office chairs', 'Filing cabinets', 'Shelving and storage systems'] },
      { group: 'Outdoor', examples: ['Patio sets and loungers', 'Gazebos and pergolas', 'BBQs and outdoor kitchens', 'Storage sheds'] },
      { group: 'Fitness', examples: ['Treadmills and bikes', 'Squat racks and benches', 'Multi-station home gyms', 'Rowing machines'] },
    ],
    priceNote:
      'Assembly is priced per item, or as a half or full day for larger jobs. Send us the product links or a photo of the boxes and you will have a fixed price back, usually within two hours.',
    offerDescription: 'Per-item and day-rate flat-pack furniture assembly, quoted before booking.',
    cta: { label: 'Get an assembly quote', href: '/contact?service=assembly' },
  },

  {
    slug: 'commercial',
    href: '/commercial',
    name: 'Commercial assembly',
    short: 'Gyms, clinics, hotels, offices, warehouses and property managers',
    calculator: null,
    title: 'Commercial Furniture Assembly & Fit-Out | Assembleo',
    metaDescription:
      'Volume furniture assembly and installation for GTA gyms, clinics, hotels, offices and property managers. Scheduled around your hours, invoiced on net terms.',
    h1: 'Commercial assembly and fit-out',
    lede: 'Volume work for sites that cannot close. We schedule around your hours, work to a unit count, and invoice on terms.',
    scopeTitle: 'How commercial work differs',
    scope: [
      'Commercial jobs are quoted on unit count and site conditions rather than per item, and they are scheduled in blocks — evenings, weekends or overnight if that is when the floor is free.',
      'You get one contact for the whole job, a certificate of insurance before we arrive, and an invoice afterwards rather than payment on the day.',
    ],
    included: [
      'A site walk or a drawing review before we quote',
      'Delivery co-ordination and receiving, if you need it',
      'Assembly and placement to your floor plan',
      'Packaging removed from site and recycled in bulk',
      'A completion list, with photos, per room or unit',
    ],
    extra: [
      'Out-of-hours and overnight scheduling',
      'Anchoring to concrete, block or steel',
      'Removal and disposal of the furniture being replaced',
      'Staged delivery across several dates',
    ],
    notIncluded: [
      'Trades work: electrical, plumbing, mechanical or sprinkler',
      'Anything requiring a building permit',
      'Millwork and custom fabrication',
    ],
    itemGroups: [
      { group: 'Fitness', examples: ['Racks, rigs and platforms', 'Cardio floors', 'Selectorised and plate-loaded machines', 'Lockers and benches'] },
      { group: 'Health', examples: ['Exam and dental chairs', 'Reception and waiting rooms', 'Treatment room casework', 'Records storage'] },
      { group: 'Hospitality', examples: ['Guest room sets', 'Lobby and lounge furniture', 'Restaurant seating', 'Back-of-house shelving'] },
      { group: 'Workplace and property', examples: ['Desking and benching systems', 'Task and meeting chairs', 'Warehouse racking', 'Student and rental unit turnovers'] },
    ],
    priceNote:
      'Commercial work is quoted on unit count, site access and schedule. Send a furniture list or a floor plan and we will come back with a fixed price and a date.',
    offerDescription: 'Volume commercial furniture assembly and installation, quoted per project with net invoicing.',
    cta: { label: 'Request a commercial quote', href: '/commercial#quote' },
  },

  {
    slug: 'delivery',
    href: '/services/delivery',
    name: 'Delivery',
    short: 'Store pickup, loading, transport and unloading in one run',
    calculator: 'delivery',
    title: 'Furniture Delivery from Store to Door | Mississauga & GTA',
    metaDescription:
      'New furniture delivery across the GTA. We collect from the store, load, transport and carry it to your entry-floor room. From $169.50 all in.',
    h1: 'New furniture delivery, store to door',
    lede: 'You buy it, we collect it. One crew handles pickup, loading, the drive, and carrying it into the room you point at on the entry floor.',
    scopeTitle: 'What a delivery job is — and what it is not',
    scope: [
      'A delivery is one pickup and one drop-off of furniture you have already bought and paid for. We collect it from the store or warehouse, load it, drive it, and carry it to the room of your choice on the entry floor of your home.',
      'It is not a moving job and it is not a courier run. We do not collect items you have not paid for, we do not handle returns to the store on the same visit, and assembly is a separate booking — say so up front and we will do both in one trip.',
    ],
    included: [
      'Collection from the store, warehouse or will-call counter',
      'Loading, blanket wrapping and strapping in the van',
      'Transport on your booked date',
      'Unloading and carry-in to your entry-floor room',
      'Boxes taken away if you want them gone',
    ],
    extra: [
      'Carrying above or below the entry floor',
      'Assembly once it is inside',
      'A second pickup store on the same run',
      'A waiting charge if the store is not ready within 30 minutes of our arrival',
    ],
    notIncluded: [
      'Buying the item on your behalf or paying the store',
      'Returns and exchanges back to the retailer',
      'Items that will not fit through your door — measure first, and ask us if you are unsure',
    ],
    priceNote:
      'Delivery is a $90 base fee plus $5 per kilometre, with a $150 minimum before tax — $169.50 once HST is on it. The minimum covers any job up to 12 km. Run the numbers below.',
    offerDescription:
      'Single-pickup furniture delivery. Base fee plus a per-kilometre distance charge, with a minimum that covers local jobs.',
    cta: { label: 'Estimate a delivery', href: '/calculator?service=delivery' },
  },

  {
    slug: 'moving',
    href: '/services/moving',
    name: 'Moving',
    short: 'Medium-size furniture moved between two addresses',
    limit: 'Curbside only',
    calculator: 'moving',
    title: 'Medium Furniture Moving, Curbside to Curbside | GTA',
    metaDescription:
      'Move medium-size furniture between two GTA addresses. Curbside to curbside — we load at the vehicle and unload at the vehicle. From $146.90 all in.',
    h1: 'Medium furniture moving, curbside to curbside',
    lede: 'A sofa to your new place, a dresser to your daughter, a desk across the city. Two people and a van, priced on distance.',
    scopeTitle: 'Curbside to curbside — read this before you book',
    scope: [
      'The crew loads at the vehicle and unloads at the vehicle. Carrying items up or down floors is not included in a moving job — not one flight, not a walk-up, not a basement.',
      'Have the item at ground level and reachable from where we can legally park, at both ends. If it needs to come down stairs or go up them, tell us before you book: it is a different job and a different price, and we would rather quote it properly than turn up and disappoint you.',
    ],
    included: [
      'Two crew and a van for the booked window',
      'Loading at the pickup vehicle point',
      'Blanket wrapping and strapping for the drive',
      'Transport between the two addresses',
      'Unloading at the destination vehicle point',
    ],
    extra: [
      'Carrying up or down floors, quoted separately once we know the flights and the item',
      'Disassembly and reassembly at the other end',
      'A third address on the same run',
      'Waiting time beyond 30 minutes at either end',
    ],
    notIncluded: [
      'Full household moves — we are a furniture van, not a moving company',
      'Pianos, safes, pool tables and anything over 300 lb',
      'Packing your belongings into boxes',
    ],
    priceNote:
      'Moving is a $70 base fee plus $5 per kilometre, with a $130 minimum before tax — $146.90 once HST is on it. The minimum covers any job up to 12 km. Run the numbers below.',
    offerDescription:
      'Curbside-to-curbside furniture moving between two addresses. Base fee plus a per-kilometre distance charge, with a minimum.',
    cta: { label: 'Estimate a move', href: '/calculator?service=moving' },
  },
];

export const CURBSIDE_NOTICE =
  'Curbside to curbside: the crew loads at the vehicle and unloads at the vehicle. Carrying items up or down floors is not included.';

export function getService(slug: ServiceSlug): Service {
  const found = services.find((s) => s.slug === slug);
  if (!found) throw new Error(`Unknown service: ${slug}`);
  return found;
}

/** The three routable /services/* pages, in nav order. */
export const detailServices = services.filter((s) => s.href.startsWith('/services/'));
