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
import type { Service } from '../data/services';

const BUSINESS_ID = `${site.url}/#business`;

export function abs(path: string): string {
  return new URL(path, site.url).href;
}

export function localBusiness() {
  return {
    '@context': 'https://schema.org',
    '@type': 'MovingCompany',
    '@id': BUSINESS_ID,
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    telephone: site.phone,
    email: site.email,
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
      postalCode: site.address.postalCode,
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

export function serviceSchema(service: Service) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${abs(service.href)}#service`,
    name: service.name,
    serviceType: service.name,
    description: service.metaDescription,
    url: abs(service.href),
    provider: { '@id': BUSINESS_ID },
    areaServed: cities.map((c) => ({ '@type': 'City', name: c.name })),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CAD',
      description: service.offerDescription,
      availability: 'https://schema.org/InStock',
      ...(service.calculator
        ? {
            priceSpecification: {
              '@type': 'PriceSpecification',
              priceCurrency: 'CAD',
              // Minimum charge before tax; the full model is on the page.
              minPrice: service.calculator === 'delivery' ? 150 : 130,
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
