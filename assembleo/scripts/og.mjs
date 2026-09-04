/**
 * Generates the default Open Graph image per section at build time.
 * Run with `npm run og`. Output: public/og/*.png (1200x630).
 *
 * The design follows the site: ink ground, one amber rule, Archivo display
 * type, and a factual subtitle. No stock photography, no gradient.
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const W = 1200;
const H = 630;
const INK = '#12283C';
const PAPER = '#F4F6F8';
const SIGNAL = '#E08A00';
const SLATE = '#9DB0C4';

const DISPLAY = 'Archivo SemiBold, Archivo, sans-serif';
const TEXT = 'IBM Plex Sans, sans-serif';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function card({ eyebrow, lines, sub }) {
  // Long headlines step down a size so they never crowd the eyebrow above them.
  const size = lines.length >= 3 ? 62 : 74;
  const lineHeight = Math.round(size * 1.18);
  // The headline block is centred on the optical middle of the card.
  const startY = Math.round(360 - ((lines.length - 1) * lineHeight) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${INK}"/>
  <rect x="0" y="0" width="${W}" height="10" fill="${SIGNAL}"/>

  <g transform="translate(72, 92)">
    <rect x="0" y="-30" width="44" height="44" rx="7" fill="${SIGNAL}"/>
    <path d="M30 -21v22H14" fill="none" stroke="${INK}" stroke-width="7"/>
    <text x="62" y="4" font-family="${DISPLAY}" font-size="30" font-weight="800"
          letter-spacing="2.4" fill="${PAPER}">ASSEMBLEO</text>
  </g>

  <text x="72" y="200" font-family="${TEXT}" font-size="22" font-weight="600"
        letter-spacing="1.6" fill="${SIGNAL}">${esc(eyebrow)}</text>

  ${lines
    .map(
      (l, i) =>
        `<text x="72" y="${startY + i * lineHeight}" font-family="${DISPLAY}" font-size="${size}"
           font-weight="800" letter-spacing="-1.6" fill="${PAPER}">${esc(l)}</text>`,
    )
    .join('\n  ')}

  <line x1="72" y1="${H - 132}" x2="${W - 72}" y2="${H - 132}" stroke="#2B4157" stroke-width="1"/>
  <text x="72" y="${H - 88}" font-family="${TEXT}" font-size="26" fill="${SLATE}">${esc(sub)}</text>
  <text x="72" y="${H - 46}" font-family="${TEXT}" font-size="22" fill="${SLATE}">assembleo.ca</text>
</svg>`;
}

const CARDS = {
  default: {
    eyebrow: 'MISSISSAUGA & THE GTA',
    lines: ['Furniture built,', 'delivered and moved.'],
    sub: 'Insured crews · WSIB covered · Quotes back within two hours',
  },
  services: {
    eyebrow: 'ASSEMBLY · DELIVERY · MOVING',
    lines: ['We open the box', 'so you do not have to.'],
    sub: 'IKEA, Costco, Walmart, Wayfair, Structube and Amazon flat-pack',
  },
  commercial: {
    eyebrow: 'COMMERCIAL FIT-OUT',
    lines: ['Volume assembly', 'for sites that', 'cannot close.'],
    sub: 'Gyms · Clinics · Hotels · Offices · Property managers · Net 30',
  },
  calculator: {
    eyebrow: 'PRICE CALCULATOR',
    lines: ['Two addresses.', 'One honest number.'],
    sub: 'Base fee plus distance, HST shown separately. No details required.',
  },
};

mkdirSync('public/og', { recursive: true });

for (const [name, spec] of Object.entries(CARDS)) {
  const svg = Buffer.from(card(spec));
  await sharp(svg).png({ compressionLevel: 9, palette: true }).toFile(`public/og/${name}.png`);
  console.log(`public/og/${name}.png`);
}
