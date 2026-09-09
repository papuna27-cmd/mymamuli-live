
import { render, h } from 'preact';
import Estimator from './src/islands/Estimator';
import BookingForm from './src/islands/BookingForm';
import Reviews from './src/islands/Reviews';
import MobileNav from './src/islands/MobileNav';

const REG = { Estimator, BookingForm, Reviews, MobileNav };

function boot() {
  const props = JSON.parse(document.getElementById('preview-props').textContent);
  for (const el of document.querySelectorAll('astro-island')) {
    const url = el.getAttribute('component-url') || '';
    const name = Object.keys(REG).find((k) => url.includes('/' + k + '.'));
    if (!name) continue;
    // render(), not hydrate(): the SSR markup is replaced outright, which is
    // fine for a preview and avoids mismatch warnings.
    try { render(h(REG[name], props[name] || {}), el); } catch (e) { console.error(name, e); }
  }
}
if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
else boot();
