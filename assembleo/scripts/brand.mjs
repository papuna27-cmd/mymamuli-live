/**
 * Generates every icon from one path, so the mark can never drift between the
 * header, the browser tab and the phone home screen.
 *
 * Run with `npm run brand`. Writes public/favicon.svg, the two PNG icons and
 * the Apple touch icon. The same path lives in src/components/Logo.astro,
 * which is the only other place the mark is drawn.
 */
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const INK = '#17201B';
const BONE = '#F6F2E9';
const GREEN = '#1F4A36';

/** Hexagon with the A cut out of it, in a 34x34 box. */
const MARK =
  'M17 1.6 30.8 9.5v15.9L17 33.4 3.2 25.4V9.5zM17 9.4 24.2 25h-3.9l-1.1-2.6h-4.4L13.7 25H9.8zm0 6.6-1.6 3.7h3.2z';

/**
 * The full mark loses its hexagon at 16px — it reads as a circle and the
 * counter fills in. Browser tabs get the letter alone, which is the same
 * identity at the only size where the geometry cannot survive.
 */
const LETTER =
  'M32 11 50.5 53h-9.2l-2.9-6.8H25.6L22.7 53h-9.2zM32 26.4 27.9 36h8.2z';

/**
 * A tile rather than a bare mark: at 16px a shape floating on transparency
 * loses its silhouette against whatever the browser puts behind it.
 */
const tile = (bg, fg, radius) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Assembleo">
  <rect width="64" height="64"${radius ? ` rx="${radius}"` : ''} fill="${bg}"/>
  <g transform="translate(9.5 9.5) scale(1.32)">
    <path fill="${fg}" fill-rule="evenodd" d="${MARK}"/>
  </g>
</svg>`;

const letterTile = (bg, fg, radius) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Assembleo">
  <rect width="64" height="64"${radius ? ` rx="${radius}"` : ''} fill="${bg}"/>
  <path fill="${fg}" fill-rule="evenodd" d="${LETTER}"/>
</svg>`;

await writeFile('public/favicon.svg', letterTile(INK, BONE, 12) + '\n');

const png = (svg, size, out) =>
  sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toFile(out);

await png(letterTile(INK, BONE, 12), 192, 'public/icon-192.png');
await png(tile(INK, BONE, 12), 512, 'public/icon-512.png');
// Apple rounds the corners itself, so this one ships square and full bleed.
await png(tile(GREEN, BONE, 0), 180, 'public/apple-touch-icon.png');

console.log('brand: favicon.svg, icon-192, icon-512, apple-touch-icon');
