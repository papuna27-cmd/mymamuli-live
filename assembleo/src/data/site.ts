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
  legalName: 'Assembleo',
  tagline: 'Furniture assembly for homes and commercial sites across Ontario',
  /**
   * Set PUBLIC_SITE_URL and every canonical, the sitemap, robots.txt, the
   * JSON-LD and the OG cards follow. It was written out in six files, so a
   * domain change meant six edits and five chances to miss one.
   */
  url: (import.meta.env.PUBLIC_SITE_URL ?? 'https://assembleo.ca').replace(/\/$/, ''),
  locale: 'en-CA',
  founded: 2022,

  phone: '+14377798843',
  phoneDisplay: '(437) 779-8843',
  /**
   * The PUBLIC address, and empty on purpose. assembleo@gmail.com was printed
   * here but the mailbox never existed (the name is taken), so every customer
   * email would have bounced. Until assembleo.ca is registered there is no
   * address worth printing, so the site offers the phone and the form.
   *
   * Nothing private goes in this file. `site` is imported by the booking
   * island, so everything in it ships in the client bundle and is readable by
   * anyone who opens the JS — putting the owner's inbox here published it just
   * as surely as printing it in the footer. The address that receives leads is
   * the NOTIFY_EMAIL secret on the Pages project, which never leaves the edge.
   *
   * When the domain lands: Cloudflare Email Routing gives info@assembleo.ca
   * free, forwarding to that same inbox. Set it here, flip `emailPublic`, and
   * the footer, contact block, privacy policy and JSON-LD all follow.
   */
  email: '',
  emailPublic: false,

  address: {
    street: '2333 Truscott Dr',
    city: 'Mississauga',
    region: 'ON',
    regionName: 'Ontario',
    /**
     * Confirmed by the owner. It reaches the JSON-LD, the privacy policy and
     * the terms; Google wants the full address before it will match the site
     * to a Business Profile, and a partial one it silently discounts.
     */
    postalCode: 'L5J 4B7',
    country: 'CA',
  },

  /** Approximate — Truscott Dr, Clarkson. Confirm before launch. */
  geo: { lat: 43.5195, lng: -79.6255 },

  /** Used by LocalBusiness openingHoursSpecification and the contact page. */
  hours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '20:00', label: 'Monday to Friday', display: '8:00 am – 8:00 pm' },
    { days: ['Saturday'], opens: '09:00', closes: '18:00', label: 'Saturday', display: '9:00 am – 6:00 pm' },
    { days: ['Sunday'], opens: '10:00', closes: '17:00', label: 'Sunday', display: '10:00 am – 5:00 pm' },
  ],

  priceRange: '$$',

  social: {
    facebook: 'https://www.facebook.com/assembleofurnitureassemblyserviceingta',
    /** TODO: replace with the real Google Business Profile link. */
    google: 'https://maps.google.com/?cid=0000000000000000000',
  },

  /** Hard facts used in trust copy. Keep these true — no superlatives without one. */
  facts: {
    yearsActive: new Date().getFullYear() - 2022,
    jobsCompleted: '4,000+',
    rating: 4.9,
    reviewCount: 127,
    responseTime: 'within 2 hours',
    liabilityCover: '$2M',
  },

  brands: ['IKEA', 'Costco', 'Walmart', 'Wayfair', 'Structube', 'Amazon'],
} as const;

export const primaryNav: NavItem[] = [
  { label: 'Home furniture', href: '/services/home-furniture' },
  { label: 'Commercial', href: '/commercial' },
  { label: 'Service areas', href: '/service-areas' },
  { label: 'Prices', href: '/services/home-furniture#estimate' },
  { label: 'Contact', href: '/#book' },
];

export const footerNav = {
  services: [
    { label: 'Home furniture', href: '/services/home-furniture' },
    { label: 'Offices and workplaces', href: '/services/offices' },
    { label: 'Gyms and fitness studios', href: '/services/gyms' },
    { label: 'Clinics and dental offices', href: '/services/clinics' },
    { label: 'Hotels', href: '/services/hotels' },
  ],
  company: [
    { label: 'Commercial work', href: '/commercial' },
    { label: 'Service areas', href: '/service-areas' },
    { label: 'Price estimator', href: '/services/home-furniture#estimate' },
    { label: 'Get a quote', href: '/#book' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
};

/** Formats +19055550142 as a tel: href. */
export const telHref = `tel:${site.phone}`;
