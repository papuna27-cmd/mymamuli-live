/**
 * Service-area cities. Adding a row here creates a
 * /service-areas/<slug> landing page — no new code required.
 */

export interface City {
  slug: string;
  name: string;
  /** Used in copy: "across <inText>". */
  inText: string;
  region: string;
  /** Neighbourhoods and landmarks, for local relevance without keyword stuffing. */
  areas: string[];
  /** One true, specific sentence about working in this city. */
  note: string;
  driveTime: string;
  lat: number;
  lng: number;
}

export const cities: City[] = [
  {
    slug: 'mississauga',
    lat: 43.589,
    lng: -79.6441,
    name: 'Mississauga',
    inText: 'Mississauga',
    region: 'Peel Region',
    areas: ['Port Credit', 'Streetsville', 'Erin Mills', 'Meadowvale', 'Cooksville', 'Square One'],
    note: 'Our vans are based here, so Mississauga jobs usually get the earliest slots and land on the minimum call-out.',
    driveTime: 'same day, most days',
  },
  {
    slug: 'toronto',
    lat: 43.6532,
    lng: -79.3832,
    name: 'Toronto',
    inText: 'Toronto',
    region: 'City of Toronto',
    areas: ['Etobicoke', 'North York', 'Scarborough', 'Downtown', 'East York', 'Liberty Village'],
    note: 'Condo jobs need a booked service elevator and a loading dock window. Send us the times and we will build the visit around them.',
    driveTime: '30–50 minutes from the depot',
  },
  {
    slug: 'brampton',
    lat: 43.7315,
    lng: -79.7624,
    name: 'Brampton',
    inText: 'Brampton',
    region: 'Peel Region',
    areas: ['Bramalea', 'Heart Lake', 'Springdale', 'Mount Pleasant', 'Castlemore'],
    note: 'A lot of Brampton work is new-build furnishing — several rooms in one visit. Book a half day rather than item by item.',
    driveTime: '25–40 minutes from the depot',
  },
  {
    slug: 'oakville',
    lat: 43.4675,
    lng: -79.6877,
    name: 'Oakville',
    inText: 'Oakville',
    region: 'Halton Region',
    areas: ['Bronte', 'Glen Abbey', 'Old Oakville', 'Palermo', 'River Oaks'],
    note: 'Oakville and Burlington pickups from the Winston Churchill and QEW retail strips are a short run, so distance rarely moves the price much.',
    driveTime: '20–35 minutes from the depot',
  },
  {
    slug: 'etobicoke',
    lat: 43.6205,
    lng: -79.5132,
    name: 'Etobicoke',
    inText: 'Etobicoke',
    region: 'City of Toronto',
    areas: ['The Queensway', 'Mimico', 'Islington', 'Humber Bay', 'Rexdale'],
    note: 'The Queensway IKEA is ten minutes from us, which is why most Etobicoke delivery jobs come in at the minimum.',
    driveTime: '15–30 minutes from the depot',
  },
  {
    slug: 'vaughan',
    lat: 43.8361,
    lng: -79.4983,
    name: 'Vaughan',
    inText: 'Vaughan',
    region: 'York Region',
    areas: ['Woodbridge', 'Maple', 'Thornhill', 'Concord', 'Kleinburg'],
    note: 'Vaughan Mills and the Highway 7 furniture strip are common pickup points. We can collect from two stores on one run.',
    driveTime: '40–55 minutes from the depot',
  },
  {
    slug: 'hamilton',
    lat: 43.2557,
    lng: -79.8711,
    name: 'Hamilton',
    inText: 'Hamilton',
    region: 'Hamilton',
    areas: ['Dundas', 'Ancaster', 'Stoney Creek', 'Westdale', 'Downtown'],
    note: 'Hamilton is at the edge of our area. We serve it, but the distance charge is real — get an estimate before you commit.',
    driveTime: '45–60 minutes from the depot',
  },
];

export const cityNames = cities.map((c) => c.name);

export function getCity(slug: string): City | undefined {
  return cities.find((c) => c.slug === slug);
}
