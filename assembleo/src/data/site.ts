/**
 * Company facts and sitewide configuration.
 *
 * ⚠ Placeholders marked PLACEHOLDER must be replaced with the real values
 * before launch. They are deliberately in the reserved fictional 555-01xx
 * range so a half-configured site can never send a real person a call.
 */

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export const site = {
  name: 'Assembleo',
  legalName: 'Assembleo Inc.',
  tagline: 'Furniture assembly, delivery and moving across the GTA',
  url: 'https://assembleo.ca',
  locale: 'en-CA',
  founded: 2019,

  /** PLACEHOLDER — replace with the real business line. */
  phone: '+19055550142',
  phoneDisplay: '(905) 555-0142',
  email: 'hello@assembleo.ca',

  address: {
    /** PLACEHOLDER — replace with the registered address. */
    street: '2255 Dundas Street West, Unit 12',
    city: 'Mississauga',
    region: 'ON',
    regionName: 'Ontario',
    postalCode: 'L5K 1R6',
    country: 'CA',
  },

  geo: { lat: 43.5789, lng: -79.6583 },

  /** Used by LocalBusiness openingHoursSpecification and the contact page. */
  hours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '20:00', label: 'Monday to Friday', display: '8:00 am – 8:00 pm' },
    { days: ['Saturday'], opens: '09:00', closes: '18:00', label: 'Saturday', display: '9:00 am – 6:00 pm' },
    { days: ['Sunday'], opens: '10:00', closes: '17:00', label: 'Sunday', display: '10:00 am – 5:00 pm' },
  ],

  priceRange: '$$',

  social: {
    facebook: 'https://www.facebook.com/assembleo',
    google: 'https://maps.google.com/?cid=0000000000000000000',
  },

  /** Hard facts used in trust copy. Keep these true — no superlatives without one. */
  facts: {
    yearsActive: new Date().getFullYear() - 2019,
    jobsCompleted: '4,000+',
    rating: 4.9,
    reviewCount: 127,
    responseTime: 'within 2 hours',
    liabilityCover: '$2M',
  },

  brands: ['IKEA', 'Costco', 'Walmart', 'Wayfair', 'Structube', 'Amazon'],
} as const;

export const primaryNav: NavItem[] = [
  {
    label: 'Services',
    href: '/services/assembly',
    children: [
      { label: 'Furniture assembly', href: '/services/assembly' },
      { label: 'Delivery', href: '/services/delivery' },
      { label: 'Moving', href: '/services/moving' },
    ],
  },
  { label: 'Commercial', href: '/commercial' },
  { label: 'Calculator', href: '/calculator' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const footerNav = {
  services: [
    { label: 'Furniture assembly', href: '/services/assembly' },
    { label: 'Delivery', href: '/services/delivery' },
    { label: 'Moving', href: '/services/moving' },
    { label: 'Commercial', href: '/commercial' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Price calculator', href: '/calculator' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
};

/** Formats +19055550142 as a tel: href. */
export const telHref = `tel:${site.phone}`;
