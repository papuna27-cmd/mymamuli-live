/**
 * /api/requests — რუკის სწრაფი „ვეძებ" პანელი
 *   POST {bmin,bmax,amin,amax,kind,purpose,poly,tel}
 *
 * სრული, ვერიფიცირებული მოთხოვნა form.html-იდან მოდის (/api/submit).
 * ეს პანელი მხოლოდ ტელეფონს კითხულობს, ამიტომ ჩანაწერი მოდერატორთან
 * მიდის და საიტზე ავტომატურად არ ჩნდება.
 */
import { takeLead, shapeReq } from './_lead.js';

export const onRequestPost = ({ request, env }) =>
  takeLead(request, env, 'req', shapeReq);
