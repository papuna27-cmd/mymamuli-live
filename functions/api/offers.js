/**
 * /api/offers — რუკის „შეთავაზება" პანელი
 *   POST {req, code, price, tel}
 *
 * მესაკუთრე პასუხობს მაძიებლის მოთხოვნას. საკადასტრო კოდის ნამდვილობას
 * მოდერატორი /api/cad-ით ამოწმებს — აქ მხოლოდ ფორმატი მოწმდება.
 */
import { takeLead, shapeOffer } from './_lead.js';

export const onRequestPost = ({ request, env }) =>
  takeLead(request, env, 'offer', shapeOffer);
