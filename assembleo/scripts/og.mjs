/**
 * Generates the default Open Graph image per section at build time.
 * Run with `npm run og`. Output: public/og/*.png (1200x630).
 *
 * The design follows the site: ink ground, one amber rule, Archivo display
 * type, and a factual subtitle. No stock photography, no gradient.
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

/** The domain shown on the card. One setting, same as everywhere else. */
const SITE_HOST = (process.env.PUBLIC_SITE_URL || 'https://assembleo.ca')
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');

const W = 1200;
const H = 630;
const INK = '#17201B';
const PAPER = '#F6F2E9';
const SIGNAL = '#1F4A36';
const SLATE = '#A8B3AC';
const LIFT = '#86C5A1';

const DISPLAY = 'Archivo SemiBold, Archivo, sans-serif';
const TEXT = 'IBM Plex Sans, sans-serif';
const MONO = 'IBM Plex Mono, monospace';

/** Same hexagon-and-A as src/components/Logo.astro and scripts/brand.mjs. */
const MARK =
  'M17 1.6 30.8 9.5v15.9L17 33.4 3.2 25.4V9.5zM17 9.4 24.2 25h-3.9l-1.1-2.6h-4.4L13.7 25H9.8zm0 6.6-1.6 3.7h3.2z';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function card({ eyebrow, lines, sub }) {
  // Long headlines step down a size so they never crowd the eyebrow above them.
  const size = lines.length >= 3 ? 62 : 74;
  const lineHeight = Math.round(size * 1.18);
  // The headline block is centred on the optical middle of the card.
  const startY = Math.round(360 - ((lines.length - 1) * lineHeight) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${INK}"/>
  <rect x="0" y="0" width="${W}" height="8" fill="${PAPER}" opacity="0.24"/>

  <g transform="translate(72, 92)">
    <g transform="translate(0 -31) scale(1.36)">
      <path fill="${PAPER}" fill-rule="evenodd" d="${MARK}"/>
    </g>
    <text x="66" y="4" font-family="${DISPLAY}" font-size="30" font-weight="800"
          letter-spacing="2.4" fill="${PAPER}">ASSEMBLEO</text>
  </g>

  <text x="72" y="200" font-family="${MONO}" font-size="22" font-weight="500"
        letter-spacing="2" fill="${LIFT}">${esc(eyebrow)}</text>

  ${lines
    .map(
      (l, i) =>
        `<text x="72" y="${startY + i * lineHeight}" font-family="${DISPLAY}" font-size="${size}"
           font-weight="800" letter-spacing="-1.6" fill="${PAPER}">${esc(l)}</text>`,
    )
    .join('\n  ')}

  <line x1="72" y1="${H - 132}" x2="${W - 72}" y2="${H - 132}" stroke="#2B4157" stroke-width="1"/>
  <text x="72" y="${H - 88}" font-family="${TEXT}" font-size="26" fill="${SLATE}">${esc(sub)}</text>
  <text x="72" y="${H - 46}" font-family="${MONO}" font-size="22" fill="${SLATE}">${SITE_HOST}</text>
</svg>`;
}

const CARDS = {
  default: {
    eyebrow: 'ONTARIO · HOMES & COMMERCIAL',
    lines: ['Furniture assembly,', 'done properly.'],
    sub: 'Insured crews · WSIB covered · Fixed prices back within two hours',
  },
};

mkdirSync('public/og', { recursive: true });

for (const [name, spec] of Object.entries(CARDS)) {
  const svg = Buffer.from(card(spec));
  await sharp(svg).png({ compressionLevel: 9, palette: true }).toFile(`public/og/${name}.png`);
  console.log(`public/og/${name}.png`);
}
