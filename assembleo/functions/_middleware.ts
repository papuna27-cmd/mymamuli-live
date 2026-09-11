/**
 * One canonical hostname.
 *
 * The site answers on three names and only one of them should exist as far as
 * a search engine is concerned:
 *
 *   assembleo.ca              the real one
 *   www.assembleo.ca          the habit half the world still types
 *   assembleo-4ob.pages.dev   Cloudflare's, and it cannot be turned off
 *
 * Left alone each serves the same 33 pages, so Google sees three copies of the
 * site and splits the ranking between them — and a customer who lands on the
 * pages.dev one sees an address that does not look like a company.
 *
 * The canonical tag is a hint. A 301 is not: it moves the address for good and
 * hands the accumulated ranking to the target, which is what we want here.
 *
 * Preview deployments (<hash>.assembleo-4ob.pages.dev) are deliberately left
 * alone — they are how a build gets checked before it becomes the live one,
 * and Google never sees them. Only the production hostname redirects.
 */

const CANONICAL_HOST = 'assembleo.ca';

const ALIASES = new Set([
  'www.assembleo.ca',
  'assembleo-4ob.pages.dev',
]);

export const onRequest: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);

  if (ALIASES.has(url.hostname)) {
    url.hostname = CANONICAL_HOST;
    return Response.redirect(url.toString(), 301);
  }

  return ctx.next();
};
