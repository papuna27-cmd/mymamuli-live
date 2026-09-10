/**
 * One canonical hostname.
 *
 * Cloudflare Pages always publishes the project at <project>.pages.dev, and
 * that address cannot be turned off. Left alone it serves the same 33 pages as
 * the real domain, so Google sees two copies of the site, splits the ranking
 * signals between them, and may well show the pages.dev one in results — a
 * customer then lands on an address that does not look like a company.
 *
 * The canonical tags already point at the real domain, which is a hint. A 301
 * is not a hint: it moves the address for good and hands the accumulated
 * ranking to the target.
 *
 * Preview deployments (<hash>.assembleo-4ob.pages.dev) are deliberately left
 * alone — they are how a build gets checked before it is the live one, and
 * Google never sees them. Only the production hostname redirects.
 */

const CANONICAL_HOST = 'assembleo.ca';
const PRODUCTION_PAGES_HOST = 'assembleo-4ob.pages.dev';

export const onRequest: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);

  if (url.hostname === PRODUCTION_PAGES_HOST) {
    url.hostname = CANONICAL_HOST;
    // 301 rather than 302: the move is permanent, and only a permanent one
    // passes the ranking on.
    return Response.redirect(url.toString(), 301);
  }

  return ctx.next();
};
