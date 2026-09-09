/**
 * Service-area cities. Adding a row creates a /service-areas/<slug> page,
 * a footer link, a row on the hub page, and an entry in the LocalBusiness
 * areaServed list — no new code.
 *
 * ⚠ Every city needs genuinely different copy. Twenty pages that differ only
 * by a place name are doorway pages, and Google demotes them. `note`,
 * `commonWork` and `areas` are what make each page worth indexing, so write
 * something true and specific about working there or leave the city out.
 *
 * Coverage is the Greater Toronto Area: the City of Toronto plus Peel, York,
 * Durham and Halton. Hamilton sits outside the GTA proper and is marked as
 * such, because we serve it but should not claim it as GTA.
 */

export interface City {
  slug: string;
  name: string;
  /** Regional municipality, used in copy and breadcrumbs. */
  region: string;
  /** False for places we serve that are not in the GTA. */
  inGta: boolean;
  /** Neighbourhoods people actually search for. */
  areas: string[];
  /** One or two true, specific sentences about working here. */
  note: string;
  /** The jobs that actually come in from this city. */
  commonWork: string;
  driveTime: string;
  lat: number;
  lng: number;
}

export const cities: City[] = [
  {
    slug: 'mississauga',
    name: 'Mississauga',
    region: 'Peel Region',
    inGta: true,
    areas: ['Port Credit', 'Streetsville', 'Erin Mills', 'Meadowvale', 'Cooksville', 'Clarkson', 'Square One', 'Lorne Park'],
    note: 'Our vans are based on Truscott Drive, so Mississauga gets the earliest slots and the shortest notice. If you catch us before noon we can often be there the same day.',
    commonWork: 'Condo furnishing around Square One and Port Credit, and full-house flat-pack in the newer Churchill Meadows and Meadowvale builds.',
    driveTime: 'same day, most days',
    lat: 43.589, lng: -79.6441,
  },
  {
    slug: 'toronto',
    name: 'Toronto',
    region: 'City of Toronto',
    inGta: true,
    areas: ['Downtown', 'Liberty Village', 'The Annex', 'Leslieville', 'Danforth', 'Junction', 'Queen West', 'Yorkville'],
    note: 'Downtown condo jobs live or die on the service elevator. Book yours before you book us, send the window, and we will build the visit around it — arriving without a lift booking wastes an hour of everyone’s day.',
    commonWork: 'Small-space condo work: wall beds, closet systems, compact desks and anything that has to come up in a lift rather than a stairwell.',
    driveTime: '30–50 minutes from the depot',
    lat: 43.6532, lng: -79.3832,
  },
  {
    slug: 'etobicoke',
    name: 'Etobicoke',
    region: 'City of Toronto',
    inGta: true,
    areas: ['The Queensway', 'Mimico', 'Islington–City Centre', 'Humber Bay Shores', 'Rexdale', 'Long Branch', 'Alderwood'],
    note: 'The Queensway IKEA is about ten minutes from our depot, which makes Etobicoke one of the cheapest areas for us to reach. Humber Bay towers need a loading dock booking; the older Alderwood and Long Branch houses do not.',
    commonWork: 'IKEA runs from The Queensway, and PAX wardrobe systems in the Humber Bay condo towers.',
    driveTime: '15–30 minutes from the depot',
    lat: 43.6205, lng: -79.5132,
  },
  {
    slug: 'north-york',
    name: 'North York',
    region: 'City of Toronto',
    inGta: true,
    areas: ['Willowdale', 'Yonge & Sheppard', 'Don Mills', 'Bayview Village', 'York Mills', 'Downsview', 'Lawrence Manor'],
    note: 'A lot of North York work is in mid-century houses with narrow stairwells and tight landings. Measure the turn at the top before you buy a wardrobe in one piece — we will tell you honestly if it will not go up.',
    commonWork: 'Basement and rental-suite fit-outs, plus condo furnishing along the Yonge and Sheppard corridor.',
    driveTime: '35–55 minutes from the depot',
    lat: 43.7615, lng: -79.4111,
  },
  {
    slug: 'scarborough',
    name: 'Scarborough',
    region: 'City of Toronto',
    inGta: true,
    areas: ['Agincourt', 'Malvern', 'Guildwood', 'Birch Cliff', 'Rouge', 'Woburn', 'Cliffside'],
    note: 'Scarborough is our longest regular run, so we batch it: if you can be flexible on the day, we will fit you alongside another job out there and you get a better slot.',
    commonWork: 'Family houses furnishing several rooms at once — bunk beds, wardrobes and dining sets in the same visit.',
    driveTime: '50–70 minutes from the depot',
    lat: 43.7764, lng: -79.2318,
  },
  {
    slug: 'brampton',
    name: 'Brampton',
    region: 'Peel Region',
    inGta: true,
    areas: ['Bramalea', 'Heart Lake', 'Springdale', 'Mount Pleasant', 'Castlemore', 'Sandalwood', 'Downtown Brampton'],
    note: 'Most Brampton jobs are new-build houses being furnished all at once rather than one item at a time. Book a half or full day instead of per item and it usually works out cheaper.',
    commonWork: 'Whole-house furnishing in Springdale and Mount Pleasant: beds, dressers, dining sets and basement gyms.',
    driveTime: '25–40 minutes from the depot',
    lat: 43.7315, lng: -79.7624,
  },
  {
    slug: 'caledon',
    name: 'Caledon',
    region: 'Peel Region',
    inGta: true,
    areas: ['Bolton', 'Caledon East', 'Inglewood', 'Palgrave', 'Alton', 'Mayfield West'],
    note: 'Caledon is rural and spread out — two addresses can be twenty minutes apart. Give us everything in one visit rather than booking twice, and tell us if the driveway is long or unpaved so we bring the right van.',
    commonWork: 'Large-property work: patio sets, sheds, gazebos and garage storage systems.',
    driveTime: '40–60 minutes from the depot',
    lat: 43.8668, lng: -79.8663,
  },
  {
    slug: 'vaughan',
    name: 'Vaughan',
    region: 'York Region',
    inGta: true,
    areas: ['Woodbridge', 'Maple', 'Thornhill', 'Concord', 'Kleinburg', 'Vellore Village'],
    note: 'Vaughan Mills and the Highway 7 furniture strip mean a lot of Vaughan customers buy locally and need it built the same week. The newer Vellore and Maple builds have wide stairs, which makes big wardrobes straightforward.',
    commonWork: 'Large bedroom sets and media walls in the newer subdivisions, and home gyms in finished basements.',
    driveTime: '40–55 minutes from the depot',
    lat: 43.8361, lng: -79.4983,
  },
  {
    slug: 'markham',
    name: 'Markham',
    region: 'York Region',
    inGta: true,
    areas: ['Unionville', 'Milliken', 'Cornell', 'Berczy Village', 'Markham Village', 'Cathedraltown'],
    note: 'Markham has a lot of home offices, and desks are the job we get called for most here. If you are buying a standing desk, check the ceiling height in a basement office before you order the tall frame.',
    commonWork: 'Home offices, standing desks and shelving, plus townhouse furnishing in Cornell and Berczy.',
    driveTime: '50–65 minutes from the depot',
    lat: 43.8561, lng: -79.337,
  },
  {
    slug: 'richmond-hill',
    name: 'Richmond Hill',
    region: 'York Region',
    inGta: true,
    areas: ['Oak Ridges', 'Bayview Hill', 'Mill Pond', 'Jefferson', 'Crosby', 'Observatory'],
    note: 'Richmond Hill jobs are often larger houses with more than one bedroom being done in the same visit. Send the whole list at once and we will price it as one visit rather than several call-outs.',
    commonWork: 'Multi-bedroom furnishing and walk-in closet systems in Jefferson and Bayview Hill.',
    driveTime: '50–65 minutes from the depot',
    lat: 43.8828, lng: -79.4403,
  },
  {
    slug: 'newmarket',
    name: 'Newmarket',
    region: 'York Region',
    inGta: true,
    areas: ['Armitage', 'Glenway', 'Stonehaven', 'Bristol–London', 'Huron Heights', 'Historic Downtown'],
    note: 'Newmarket is at the north edge of our range, so we schedule it in blocks rather than one-offs. A weekday morning is easiest to get; same-day is rare this far up.',
    commonWork: 'Family homes furnishing bedrooms and basements, and the occasional clinic fit-out along Davis Drive.',
    driveTime: '60–75 minutes from the depot',
    lat: 44.0592, lng: -79.4613,
  },
  {
    slug: 'aurora',
    name: 'Aurora',
    region: 'York Region',
    inGta: true,
    areas: ['Aurora Village', 'Bayview Northeast', 'Aurora Highlands', 'Rural Aurora', 'Hills of St Andrew'],
    note: 'Aurora and Newmarket sit next to each other, so if you are flexible we will pair your job with one nearby and you get a better window. Older Aurora Village houses have tight staircases worth measuring first.',
    commonWork: 'Bedroom sets, home offices and patio furniture in spring.',
    driveTime: '55–70 minutes from the depot',
    lat: 44.0065, lng: -79.4504,
  },
  {
    slug: 'oakville',
    name: 'Oakville',
    region: 'Halton Region',
    inGta: true,
    areas: ['Bronte', 'Glen Abbey', 'Old Oakville', 'River Oaks', 'Palermo', 'Joshua Creek', 'Uptown Core'],
    note: 'Oakville is a short run west for us, so travel rarely affects the price. The Winston Churchill and QEW retail strip is on our way, which makes buy-today, built-tomorrow realistic here.',
    commonWork: 'Bedroom and dining furniture in Joshua Creek and River Oaks, and patio sets through the spring.',
    driveTime: '20–35 minutes from the depot',
    lat: 43.4675, lng: -79.6877,
  },
  {
    slug: 'burlington',
    name: 'Burlington',
    region: 'Halton Region',
    inGta: true,
    areas: ['Aldershot', 'Alton Village', 'Millcroft', 'Downtown Burlington', 'Orchard', 'Tyandaga'],
    note: 'Burlington is the far west of our regular area but an easy QEW run. We usually pair it with an Oakville job the same day, so ask about a morning or afternoon block rather than a fixed hour.',
    commonWork: 'Downsizing work — condo furniture for people leaving larger houses, plus home offices in Alton Village.',
    driveTime: '30–45 minutes from the depot',
    lat: 43.3255, lng: -79.799,
  },
  {
    slug: 'milton',
    name: 'Milton',
    region: 'Halton Region',
    inGta: true,
    areas: ['Hawthorne Village', 'Willmott', 'Beaty', 'Scott', 'Old Milton', 'Ford'],
    note: 'Milton is mostly new construction, which means whole houses arriving at once. Several deliveries usually land across the same week, so tell us the dates and we will do it in one visit instead of three.',
    commonWork: 'New-build furnishing: beds, dressers, dining sets and garage shelving in Hawthorne Village and Ford.',
    driveTime: '25–40 minutes from the depot',
    lat: 43.5183, lng: -79.8774,
  },
  {
    slug: 'halton-hills',
    name: 'Halton Hills',
    region: 'Halton Region',
    inGta: true,
    areas: ['Georgetown', 'Acton', 'Glen Williams', 'Limehouse', 'Norval'],
    note: 'Georgetown and Acton are far enough apart that we treat them as separate runs. Older Georgetown houses often have narrow doorways — worth measuring before you buy a sofa in one piece.',
    commonWork: 'Older-home furnishing where access is tight, and outdoor storage and sheds on larger lots.',
    driveTime: '35–50 minutes from the depot',
    lat: 43.63, lng: -79.95,
  },
  {
    slug: 'pickering',
    name: 'Pickering',
    region: 'Durham Region',
    inGta: true,
    areas: ['Amberlea', 'Bay Ridges', 'Rougemount', 'Brock Ridge', 'Duffin Heights', 'Liverpool'],
    note: 'Pickering is the closest Durham city to us, so it is the easiest one to book at short notice. Anything further east is better arranged a few days ahead.',
    commonWork: 'Family-home bedrooms and basements, and condo furnishing near the Pickering GO station.',
    driveTime: '55–70 minutes from the depot',
    lat: 43.8384, lng: -79.0868,
  },
  {
    slug: 'ajax',
    name: 'Ajax',
    region: 'Durham Region',
    inGta: true,
    areas: ['Southwood', 'Nottingham', 'Duffins Bay', 'Central Ajax', 'Riverside'],
    note: 'Ajax, Whitby and Oshawa are close together, so we run Durham as one trip. If you can take a wider window, you will usually get an earlier date.',
    commonWork: 'Townhouse furnishing and home gyms, plus student and rental turnovers in late summer.',
    driveTime: '60–75 minutes from the depot',
    lat: 43.8509, lng: -79.0204,
  },
  {
    slug: 'whitby',
    name: 'Whitby',
    region: 'Durham Region',
    inGta: true,
    areas: ['Brooklin', 'Downtown Whitby', 'Pringle Creek', 'Williamsburg', 'Rolling Acres', 'Port Whitby'],
    note: 'Brooklin sits well north of the rest of Whitby and adds real driving time, so mention it when you book. Everything south of Taunton is a straightforward 401 run for us.',
    commonWork: 'New-build furnishing in Brooklin and Williamsburg, and basement offices and gyms.',
    driveTime: '65–80 minutes from the depot',
    lat: 43.8975, lng: -78.9429,
  },
  {
    slug: 'oshawa',
    name: 'Oshawa',
    region: 'Durham Region',
    inGta: true,
    areas: ['Downtown Oshawa', 'Taunton', 'Windfields', 'Lakeview', 'Eastdale', 'Samac'],
    note: 'Oshawa is the eastern edge of our area. We serve it, but the travel is real — book a day or two ahead and give us a wider window rather than a fixed hour.',
    commonWork: 'Student housing near Ontario Tech and Durham College, and family homes in Windfields and Taunton.',
    driveTime: '70–85 minutes from the depot',
    lat: 43.8971, lng: -78.8658,
  },
  {
    slug: 'hamilton',
    name: 'Hamilton',
    region: 'City of Hamilton',
    inGta: false,
    areas: ['Dundas', 'Ancaster', 'Stoney Creek', 'Westdale', 'Downtown Hamilton', 'Waterdown'],
    note: 'Hamilton is outside the GTA proper and it is the furthest we go west, so the travel is worth planning around. Older houses on the escarpment often have steep, narrow stairs — send a photo and we will tell you what will fit.',
    commonWork: 'Student rentals around McMaster and Westdale, and older-home furnishing in Dundas and Ancaster.',
    driveTime: '45–60 minutes from the depot',
    lat: 43.2557, lng: -79.8711,
  },
];

export const cityNames = cities.map((c) => c.name);
export const gtaCities = cities.filter((c) => c.inGta);

export function getCity(slug: string): City | undefined {
  return cities.find((c) => c.slug === slug);
}

/** Nearest other cities, for internal links that are actually useful. */
export function nearbyCities(city: City, count = 4): City[] {
  return cities
    .filter((c) => c.slug !== city.slug)
    .map((c) => ({ c, d: (c.lat - city.lat) ** 2 + ((c.lng - city.lng) * 0.72) ** 2 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map((x) => x.c);
}
