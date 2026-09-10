/**
 * JSON-LD builders.
 *
 * Note on reviews: we deliberately do NOT emit AggregateRating. Our ratings
 * come from Google Business Profile, and marking up third-party review data as
 * your own is against Google's structured data policy. If we ever collect
 * first-party reviews, that is the point to add it — and only for those.
 */

import { site } from '../data/site';
import { cities } from '../data/cities';
import type { Faq } from '../data/faqs';
import type { ServicePage } from '../data/service-pages';
import { MINIMUM, HOURLY_RATE } from '../data/pricing';

const BUSINESS_ID = `${site.url}/#business`;

export function abs(path: string): string {
  return new URL(path, site.url).href;
}

export function localBusiness() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': BUSINESS_ID,
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    telephone: site.phone,
    // Omitted while there is no public mailbox. Publishing an address here
    // that nobody reads is worse than publishing none: Google surfaces it.
    ...(site.emailPublic ? { email: site.email } : {}),
    priceRange: site.priceRange,
    description: site.tagline,
    image: abs('/og/default.png'),
    logo: abs('/icon-512.png'),
    foundingDate: String(site.founded),
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      // Omitted entirely rather than sent empty when we do not have it.
      ...(site.address.postalCode ? { postalCode: site.address.postalCode } : {}),
      addressCountry: site.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: site.geo.lat,
      longitude: site.geo.lng,
    },
    areaServed: cities.map((c) => ({
      '@type': 'City',
      name: c.name,
      containedInPlace: { '@type': 'AdministrativeArea', name: 'Ontario, Canada' },
    })),
    openingHoursSpecification: site.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    sameAs: [site.social.facebook, site.social.google],
  };
}

export function serviceSchema(service: ServicePage) {
  const url = abs(`/services/${service.slug}`);
  const priced = service.pricing === 'estimator';
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name: service.name,
    serviceType: service.name,
    description: service.metaDescription,
    url,
    provider: { '@id': BUSINESS_ID },
    areaServed: cities.map((c) => ({ '@type': 'City', name: c.name })),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CAD',
      description: priced
        ? `Priced per item or at $${HOURLY_RATE} an hour plus HST, with a $${MINIMUM} minimum call-out.`
        : 'Quoted per project once we have the furniture schedule, purchase order or floor plan.',
      availability: 'https://schema.org/InStock',
      // Only the self-serve pages have a published floor; commercial work is
      // quoted, and inventing a number for it would be a lie in the markup.
      ...(priced
        ? {
            priceSpecification: {
              '@type': 'PriceSpecification',
              priceCurrency: 'CAD',
              minPrice: MINIMUM,
              valueAddedTaxIncluded: false,
            },
          }
        : {}),
    },
  };
}

export function faqPage(items: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export interface Crumb {
  label: string;
  href: string;
}

export function breadcrumbs(trail: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: abs(c.href),
    })),
  };
}

export function webPage(title: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: abs(path),
    isPartOf: { '@id': `${site.url}/#website` },
    about: { '@id': BUSINESS_ID },
  };
}
