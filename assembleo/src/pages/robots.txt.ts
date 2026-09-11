/**
 * robots.txt as a route rather than a static file, so the sitemap line points
 * at whatever PUBLIC_SITE_URL is set to. As a file in public/ it carried a
 * second copy of the domain that a domain change would have left behind.
 */
import type { APIRoute } from 'astro';
import { site } from '../data/site';

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap-index.xml\n`,
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
