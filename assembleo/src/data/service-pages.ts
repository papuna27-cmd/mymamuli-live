/**
 * The five service pages. Each gets its own route, hero photo, copy, scope,
 * item list and FAQ — they are separate pages because people search for them
 * separately ("gym equipment assembly", "dental office installation"), not
 * because a template made it cheap.
 *
 * Adding an entry creates /services/<slug> and its nav and footer links.
 */

export type ServiceKind = 'residential' | 'commercial';

export interface ItemGroup {
  group: string;
  examples: string[];
}

export interface Faq {
  q: string;
  a: string;
}

export interface ServicePage {
  slug: string;
  /** Short label for nav, cards and breadcrumbs. */
  name: string;
  kind: ServiceKind;
  /** Key into the photo imports in the page template. */
  image: string;
  imageAlt: string;
  /** 'soft' for an already-dark photo the full scrim would flatten to black. */
  heroScrim?: 'strong' | 'soft';
  /** Optional second photo for a page that covers two settings at once. */
  secondaryImage?: string;
  secondaryAlt?: string;
  secondaryCaption?: string;

  title: string;
  metaDescription: string;
  h1: string;
  lede: string;

  intro: string[];
  scopeTitle: string;
  scope: string[];

  included: string[];
  extra: string[];
  itemGroups: ItemGroup[];

  /** Residential pages price themselves; commercial ones are quoted. */
  pricing: 'estimator' | 'quote';
  ctaLabel: string;
  faqs: Faq[];
}

export const servicePages: ServicePage[] = [
  /* ------------------------------------------------------------ homes --- */
  {
    slug: 'home-furniture',
    name: 'Home furniture',
    kind: 'residential',
    image: 'home',
    imageAlt: 'A finished bedroom with an assembled nightstand, armchair and bed',
    title: 'Home Furniture Assembly | Ontario | Assembleo',
    metaDescription:
      'Flat-pack furniture assembly for homes across the GTA. Beds, wardrobes, dressers, desks and patio sets. Fixed price per item, cardboard taken away.',
    h1: 'Home furniture assembly',
    lede: 'Beds, wardrobes, dressers, desks, sofas, patio sets and home gyms. Priced per item so you know the number before we knock on the door.',
    intro: [
      'Most of what we do is the box you have been walking around for a week. One assembler arrives with tools, unpacks it, builds it, levels it against your floor, checks every fixing, and leaves with the packaging.',
      'You do not need to unbox anything first, and you do not need to own a single tool. What helps is having the boxes in the room the furniture is going in, and enough clear floor to lay the parts out.',
    ],
    scopeTitle: 'What a home job includes',
    scope: [
      'A fixed price per item, agreed before we start. Not an hourly rate that grows while you watch, unless you would rather book by the hour — both are offered and you pick.',
      'If a part is missing or arrives damaged we stop, photograph it, and give you the part number for your claim. We come back and finish once it arrives, at half the return rate.',
    ],
    included: [
      'Unboxing and sorting every part and fixing',
      'Assembly to the manufacturer instructions',
      'Levelling on uneven floors, doors and drawers aligned',
      'Every fixing checked and tightened before we leave',
      'Packaging removed and recycled',
      'The work area swept',
    ],
    extra: [
      'Wall anchoring and tip-over restraints',
      'Fixing into concrete, brick or steel studs',
      'Taking away the furniture you are replacing',
      'Starts before 8:00 am or after 8:00 pm',
    ],
    itemGroups: [
      { group: 'Bedroom', examples: ['Bed frames and storage beds', 'Wardrobes and PAX runs', 'Dressers and nightstands', 'Cribs and change tables'] },
      { group: 'Living and dining', examples: ['Sofas and sectionals', 'TV units and media walls', 'Dining tables and chairs', 'Bookcases and shelving'] },
      { group: 'Work', examples: ['Desks and standing desks', 'Office chairs', 'Filing cabinets', 'Closet and storage systems'] },
      { group: 'Outdoor and fitness', examples: ['Patio sets and loungers', 'Gazebos and sheds', 'BBQs and grills', 'Treadmills and home gyms'] },
    ],
    pricing: 'estimator',
    ctaLabel: 'Price my furniture',
    faqs: [
      { q: 'How much does home furniture assembly cost?', a: 'It is priced per item — a nightstand is about $40, a dresser $90 to $140, a three-door wardrobe $220 to $350. The estimator gives you a real range in about thirty seconds. Small jobs come in at our $90 minimum visit before HST, and there is an hourly option at $130/hr if you prefer it.' },
      { q: 'Do I need to unbox everything first?', a: 'No. Unboxing is part of the job. Just have the boxes in the room the furniture is going in, and clear enough floor to lay the parts out.' },
      { q: 'Will you anchor furniture to the wall?', a: 'Yes, and we recommend it for anything taller than it is wide, especially with children in the house. It is a small extra because the fixing depends on your wall — drywall, plaster, concrete and steel studs all need something different.' },
      { q: 'What if a part is missing or damaged?', a: 'We stop, photograph it, and give you the part number and damage note you need for the retailer. You claim the part; we come back and finish once it arrives, and the return visit is half price.' },
      { q: 'How long does it take?', a: 'A bed frame or a dresser is about an hour. A wardrobe with sliding doors is two to four. A multi-station home gym is most of a day. We tell you the estimate when we quote, not when we arrive.' },
      { q: 'Do you assemble furniture bought second-hand?', a: 'Yes, as long as the hardware is there and the instructions exist somewhere — most manufacturers publish a PDF. If parts are missing we will say so before starting rather than halfway through.' },
    ],
  },

  /* ---------------------------------------------------------- offices --- */
  {
    slug: 'offices',
    name: 'Offices and workplaces',
    kind: 'commercial',
    image: 'office',
    imageAlt: 'An open-plan office fitted out with rows of assembled desks and task chairs',
    title: 'Office Furniture Assembly & Installation | Assembleo',
    metaDescription:
      'Office furniture assembly and installation across the GTA. Desking systems, task chairs, meeting tables and storage walls, installed evenings and weekends.',
    h1: 'Office and workplace installation',
    lede: 'Desking systems, benching, task chairs, meeting tables and storage walls — installed to your floor plan, outside working hours if that is when the floor is free.',
    intro: [
      'An office fit-out is a scheduling problem as much as an assembly one. People need their desks on Monday, and nobody can work around a floor full of cardboard on Friday. We install evenings, weekends and overnight so the transition happens between working days.',
      'We work to your floor plan and label as we go, so desks land where the drawing says and monitor arms end up on the right side. Packaging leaves in bulk rather than filling your bins for a fortnight.',
    ],
    scopeTitle: 'How office work is priced',
    scope: [
      'Quoted per project on workstation count and site conditions, not per item and not by the hour. Send a furniture schedule, a purchase order or a floor plan and you get a fixed price and the dates we can hold.',
      'One contact from quote through to handover, a certificate of insurance before the first visit, and a completion record with photos per area.',
    ],
    included: [
      'Drawing review or a site walk before quoting',
      'Receiving and checking deliveries against the packing list',
      'Assembly and placement to your floor plan',
      'Cable trays and monitor arms fitted where supplied',
      'Packaging removed from site in bulk and recycled',
      'A completion record with photos, per area',
    ],
    extra: [
      'Out-of-hours, overnight and weekend scheduling',
      'Dismantling and removing the furniture being replaced',
      'Anchoring storage walls to concrete or steel',
      'Staged installation across several dates',
    ],
    itemGroups: [
      { group: 'Workstations', examples: ['Bench desking runs', 'Height-adjustable desks', 'Screens and dividers', 'Cable management'] },
      { group: 'Seating', examples: ['Task chairs', 'Meeting and visitor chairs', 'Soft seating and booths', 'Stools'] },
      { group: 'Meeting and reception', examples: ['Boardroom tables', 'Reception desks', 'Lockers and coat storage', 'Acoustic pods'] },
      { group: 'Storage', examples: ['Pedestals and filing', 'Storage walls and cupboards', 'Shelving', 'Print and supply stations'] },
    ],
    pricing: 'quote',
    ctaLabel: 'Request an office quote',
    faqs: [
      { q: 'Can you install outside business hours?', a: 'Yes, and most of our office work happens that way. Evenings, weekends and overnight are all normal for us — tell us the window you need and we schedule into it.' },
      { q: 'How do you price an office fit-out?', a: 'On workstation count and site conditions, as a fixed project price. Send a furniture schedule, a purchase order or a floor plan. Hourly rates make an install feel open-ended, which is not what a facilities manager wants.' },
      { q: 'Do you provide a certificate of insurance?', a: 'Yes, before the first visit. $2M commercial general liability plus a WSIB clearance certificate. Building operators usually want both on file, and we send them to your name.' },
      { q: 'Can you receive the delivery for us?', a: 'Yes. We can co-ordinate with your supplier, receive the goods, check the count against the packing list, and stage them by area so the install runs in one pass.' },
      { q: 'What are your payment terms?', a: 'Net 30 on an approved account. The first project is usually a deposit with the balance on completion, then we set up terms.' },
      { q: 'Do you dismantle the old furniture?', a: 'Yes, as an extra line on the quote. We can dismantle, remove and dispose of it, or stage it for a charity collection if you have one arranged.' },
    ],
  },

  /* ------------------------------------------------------------- gyms --- */
  {
    slug: 'gyms',
    name: 'Gyms and fitness studios',
    kind: 'commercial',
    image: 'gym',
    imageAlt: 'A gym floor of assembled racks, benches and dumbbell stands',
    heroScrim: 'soft',
    title: 'Gym Equipment Assembly & Installation | GTA | Assembleo',
    metaDescription:
      'Gym and fitness equipment assembly across the GTA. Racks, rigs, platforms, machines and lockers, installed overnight so you open on time.',
    h1: 'Gym and fitness equipment installation',
    lede: 'Racks, rigs, platforms, cardio floors, selectorised machines and lockers. Installed overnight so your members find it finished, not half-built.',
    intro: [
      'Fitness equipment is heavy, awkward and unforgiving of a floor that is not flat. A rack that is out by a few millimetres binds; a machine assembled on rubber tile without shimming rocks under load. Getting this right is what the job is.',
      'Gyms cannot close for a week, so we work around your hours — usually overnight — and hand back a floor that is swept, level and ready to open on.',
    ],
    scopeTitle: 'How gym work is priced',
    scope: [
      'Quoted per project on the equipment list and the site, not per item. Send the order or the supplier schedule and you get a fixed price and a date.',
      'Anchoring to concrete, and shimming on rubber flooring, are part of the conversation before we quote — they change the method and the time, and we would rather price them than discover them.',
    ],
    included: [
      'Equipment list reviewed against the floor plan before quoting',
      'Unpacking, assembly and positioning',
      'Levelling and shimming on rubber or uneven floors',
      'Cable tensioning and travel checks on selectorised machines',
      'Packaging and pallets removed in bulk',
      'A completion record with photos',
    ],
    extra: [
      'Anchoring racks and rigs into concrete',
      'Overnight and pre-opening scheduling',
      'Moving existing equipment to make space',
      'Dismantling and removing old machines',
    ],
    itemGroups: [
      { group: 'Strength', examples: ['Power racks and rigs', 'Lifting platforms', 'Half racks and squat stands', 'Benches'] },
      { group: 'Machines', examples: ['Selectorised stacks', 'Plate-loaded machines', 'Functional trainers', 'Multi-station gyms'] },
      { group: 'Cardio', examples: ['Treadmills', 'Bikes and rowers', 'Ellipticals', 'Stair climbers'] },
      { group: 'Studio and change rooms', examples: ['Lockers', 'Storage racks and dumbbell trees', 'Mirrors and wall storage', 'Reception furniture'] },
    ],
    pricing: 'quote',
    ctaLabel: 'Request a gym quote',
    faqs: [
      { q: 'Can you install overnight so we do not close?', a: 'Yes. Most of our gym work is overnight or before opening. Give us the access window and the alarm arrangements and we plan around them.' },
      { q: 'Do you anchor racks and rigs?', a: 'Yes, into concrete, as an extra line on the quote. Tell us the floor build-up when you ask — a rig anchored through rubber tile into slab is a different job from one bolted straight to concrete.' },
      { q: 'Can you install on rubber flooring?', a: 'Yes. Rubber compresses unevenly, so racks and machines get shimmed and re-checked under load rather than just dropped on the tile and levelled once.' },
      { q: 'Do you handle the delivery as well?', a: 'We can receive and check it against the packing list, and stage the pallets so the install runs in one pass. Say so when you ask for the quote.' },
      { q: 'How do you price gym installs?', a: 'As a fixed project price from the equipment list and the site conditions, never per item. Send the supplier order or schedule and we come back with a price and a date.' },
      { q: 'Do you take the old equipment away?', a: 'Yes, dismantling and removal can go on the same quote, whether it is going to a second location, to resale or to scrap.' },
    ],
  },

  /* ---------------------------------------------------------- clinics --- */
  {
    slug: 'clinics',
    name: 'Clinics and dental offices',
    kind: 'commercial',
    image: 'clinic',
    imageAlt: 'A clinic treatment room with the bed, side cabinet and blind fitted',
    secondaryImage: 'dental',
    secondaryAlt: 'A dental operatory with the chair, delivery unit and cabinetry installed',
    secondaryCaption:
      'Dental operatories are the tightest rooms we work in. The chair, delivery unit, stools and cabinet runs all have to land before the equipment techs can commission anything.',
    title: 'Clinic & Dental Office Furniture Installation | Assembleo',
    metaDescription:
      'Furniture assembly for GTA clinics and dental offices. Reception, waiting rooms, casework and records storage, installed between patient days.',
    h1: 'Clinic and dental office installation',
    lede: 'Reception desks, waiting room seating, treatment room casework and records storage — installed between patient days, clean and quiet.',
    intro: [
      'A clinic cannot have a stranger with a drill in the corridor during appointments, and it cannot reopen on Monday with dust on the surfaces. Clinic work is scheduled around your patient days and finished clean.',
      'We assemble the furniture: reception, waiting areas, casework, storage and staff rooms. Anything that connects to services — dental chairs, suction, compressed air, plumbing — is trades work and we will tell you plainly that it is not ours.',
    ],
    scopeTitle: 'What we do and what we do not',
    scope: [
      'Quoted per project on the room list and site conditions, scheduled around clinic hours, with a certificate of insurance on file before the first visit.',
      'We do not do electrical, plumbing, mechanical or anything needing a building permit, and we do not commission dental or medical equipment. We will say so before you book rather than on the day.',
    ],
    included: [
      'Room-by-room review before quoting',
      'Reception, waiting and staff room furniture assembled and placed',
      'Treatment room casework and storage built',
      'Dust and debris controlled, surfaces wiped down',
      'Packaging removed from site',
      'A completion record with photos, per room',
    ],
    extra: [
      'Evening, weekend and between-clinic scheduling',
      'Anchoring tall storage to the wall',
      'Removing and disposing of the furniture being replaced',
      'Staged installation, room by room',
    ],
    itemGroups: [
      { group: 'Reception', examples: ['Reception desks and counters', 'Waiting room seating', 'Coat and umbrella storage', 'Display and literature racks'] },
      { group: 'Treatment rooms', examples: ['Cabinetry and casework', 'Instrument and supply storage', 'Stools and side tables', 'Wall-mounted shelving'] },
      { group: 'Records and admin', examples: ['Filing systems', 'Lockable cabinets', 'Admin desks', 'Shelving'] },
      { group: 'Staff areas', examples: ['Lockers', 'Break room tables and chairs', 'Kitchenette storage', 'Notice and whiteboards'] },
    ],
    pricing: 'quote',
    ctaLabel: 'Request a clinic quote',
    faqs: [
      { q: 'Can you work around our patient schedule?', a: 'Yes, and it is how most clinic work runs. Evenings, weekends or a closed day — give us the window and we schedule into it rather than asking you to move appointments.' },
      { q: 'Do you install dental chairs?', a: 'No. Anything connected to services — dental chairs, suction, compressed air, plumbing, electrical — is trades work that needs the right licence. We build the furniture, casework and storage around it, and we say so before you book.' },
      { q: 'How do you keep it clean?', a: 'Cutting and drilling is kept to a minimum and contained, packaging goes straight out to the van rather than sitting in a corridor, and surfaces are wiped down before we leave. A clinic has to be usable the next morning.' },
      { q: 'Do you provide insurance documents?', a: 'Yes — $2M commercial general liability and a WSIB clearance certificate, sent before the first visit. Medical buildings almost always ask.' },
      { q: 'Can you do it one room at a time?', a: 'Yes. Staged installation is normal for clinics that cannot lose the whole floor at once. We quote it as phases with a date for each.' },
      { q: 'What are your payment terms?', a: 'Net 30 on an approved account, invoiced per project or per phase.' },
    ],
  },

  /* ----------------------------------------------------------- hotels --- */
  {
    slug: 'hotels',
    name: 'Hotels',
    kind: 'commercial',
    image: 'hotel',
    imageAlt: 'A hotel guest room with two assembled beds, a couch and case goods',
    title: 'Hotel Furniture Installation | GTA | Assembleo',
    metaDescription:
      'Hotel furniture assembly and installation across the GTA. Guest room sets floor by floor, lobby and lounge furniture, and back-of-house shelving.',
    h1: 'Hotel furniture installation',
    lede: 'Guest room sets floor by floor, lobby and lounge furniture, and back-of-house shelving — sequenced so you keep selling the rooms you are not working on.',
    intro: [
      'A hotel refit is the same room forty times, and that is exactly what makes it go wrong: one small error repeated on every floor. We build the first room, walk it with you, agree the detail, and then repeat it — so what you approve is what you get in room 412.',
      'Rooms come back into service as they are finished rather than at the end, and we work to your floor release schedule so housekeeping and the front desk are never guessing.',
    ],
    scopeTitle: 'How hotel work runs',
    scope: [
      'Quoted per project on room count and specification. A prototype room is built and signed off first, then the rest follow it.',
      'Sequenced to your floor release plan, with packaging removed in bulk and a photo record per room number, so you can check what was done without walking every corridor.',
    ],
    included: [
      'A prototype room built and signed off before the rest',
      'Guest room case goods, beds and seating assembled and placed',
      'Lobby, lounge and corridor furniture',
      'Back-of-house and housekeeping shelving',
      'Packaging removed in bulk and recycled',
      'A photo record per room number',
    ],
    extra: [
      'Overnight and floor-by-floor scheduling',
      'Anchoring case goods and mirrors to the wall',
      'Removing and disposing of the furniture being replaced',
      'Receiving and storing deliveries ahead of the install',
    ],
    itemGroups: [
      { group: 'Guest rooms', examples: ['Beds and headboards', 'Case goods and wardrobes', 'Desks and luggage benches', 'Armchairs and side tables'] },
      { group: 'Lobby and lounge', examples: ['Reception and concierge desks', 'Lounge seating', 'Coffee and side tables', 'Screens and planters'] },
      { group: 'Food and beverage', examples: ['Restaurant seating', 'Banquettes', 'Dining tables', 'Bar stools'] },
      { group: 'Back of house', examples: ['Housekeeping shelving', 'Linen storage', 'Staff lockers', 'Trolleys and racks'] },
    ],
    pricing: 'quote',
    ctaLabel: 'Request a hotel quote',
    faqs: [
      { q: 'Can you work floor by floor so we stay open?', a: 'Yes, and it is the normal way we run a hotel job. We work to your floor release schedule and hand rooms back as they are finished rather than all at the end.' },
      { q: 'Do you build a prototype room first?', a: 'Yes. One room is built and walked with you so the detail is agreed before it is repeated forty times. It is the cheapest hour in the whole project.' },
      { q: 'How do we check what was done?', a: 'You get a photo record per room number, so you can verify without walking every corridor. Anything flagged gets put right before we invoice the phase.' },
      { q: 'Can you receive the furniture before the install?', a: 'Yes. We can co-ordinate with the supplier, receive and check the delivery, and stage it by floor so the install is not waiting on a truck.' },
      { q: 'Do you take away the old furniture?', a: 'Yes, dismantling and removal can go on the same quote — to resale, to a second property or to disposal.' },
      { q: 'How is it priced?', a: 'A fixed price per room type, multiplied by the room count, plus the public areas. That way the number is predictable and you can budget per floor.' },
    ],
  },
];

export function getServicePage(slug: string): ServicePage | undefined {
  return servicePages.find((s) => s.slug === slug);
}

export const residentialServices = servicePages.filter((s) => s.kind === 'residential');
export const commercialServices = servicePages.filter((s) => s.kind === 'commercial');
