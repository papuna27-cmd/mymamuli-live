/**
 * Turns real boundary data into the coverage map's geometry.
 *
 * Sources, both fetched once into .geo-cache/ (see fetch step below):
 *   - Municipal boundaries: OpenStreetMap via Nominatim (ODbL, attribution
 *     required and given in the map caption).
 *   - Lake Ontario shoreline: OpenStreetMap via Nominatim (ODbL). Natural
 *     Earth's 10m lake was tried first and is a kilometre or two off the
 *     municipal boundaries at this zoom, which shows as a grey band on land.
 *
 * Output is src/data/geo.ts — projected, clipped and simplified SVG path data
 * for a fixed viewBox. The build never touches the network; regenerate with
 * `npm run geo` if the frame or the city list changes.
 */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';

const CACHE = '.geo-cache';
const UA = 'assembleo-site-build/1.0 (one-time boundary fetch; assembleo@gmail.com)';

/** Municipalities we draw. The three Toronto districts are drawn inside it. */
const PLACES = [
  ['toronto', 'City of Toronto, Ontario, Canada', 'city'],
  ['mississauga', 'Mississauga, Ontario, Canada', 'city'],
  ['brampton', 'Brampton, Ontario, Canada', 'city'],
  ['caledon', 'Caledon, Peel Region, Ontario, Canada', 'city'],
  ['vaughan', 'Vaughan, York Region, Ontario, Canada', 'city'],
  ['markham', 'Markham, York Region, Ontario, Canada', 'city'],
  ['richmond-hill', 'Richmond Hill, York Region, Ontario, Canada', 'city'],
  ['newmarket', 'Newmarket, York Region, Ontario, Canada', 'city'],
  ['aurora', 'Aurora, York Region, Ontario, Canada', 'city'],
  ['oakville', 'Oakville, Halton Region, Ontario, Canada', 'city'],
  ['burlington', 'Burlington, Halton Region, Ontario, Canada', 'city'],
  ['milton', 'Milton, Halton Region, Ontario, Canada', 'city'],
  ['halton-hills', 'Halton Hills, Halton Region, Ontario, Canada', 'city'],
  ['pickering', 'Pickering, Durham Region, Ontario, Canada', 'city'],
  ['ajax', 'Ajax, Durham Region, Ontario, Canada', 'city'],
  ['whitby', 'Whitby, Durham Region, Ontario, Canada', 'city'],
  ['oshawa', 'Oshawa, Durham Region, Ontario, Canada', 'city'],
  ['hamilton', 'City of Hamilton, Ontario, Canada', 'city'],
  ['etobicoke', 'Etobicoke, Toronto, Ontario, Canada', 'district'],
  ['north-york', 'North York, Toronto, Ontario, Canada', 'district'],
  ['scarborough', 'Scarborough, Toronto, Ontario, Canada', 'district'],
];

const exists = (p) => access(p).then(() => true, () => false);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- fetch (cached) ----------------------------------------------- */

async function fetchAll() {
  await mkdir(join(CACHE, 'bounds'), { recursive: true });
  for (const [slug, q] of PLACES) {
    const file = join(CACHE, 'bounds', `${slug}.json`);
    if (await exists(file)) continue;
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.search = new URLSearchParams({
      q, format: 'jsonv2', polygon_geojson: '1', limit: '3', countrycodes: 'ca',
    }).toString();
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`${slug}: ${res.status}`);
    await writeFile(file, await res.text());
    console.log(`fetched ${slug}`);
    await sleep(1300); // Nominatim's usage policy is one request a second.
  }
  const lake = join(CACHE, 'lake-ontario.json');
  if (!(await exists(lake))) {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.search = new URLSearchParams({
      q: 'Lake Ontario', format: 'jsonv2', polygon_geojson: '1', limit: '3',
    }).toString();
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`lake: ${res.status}`);
    await writeFile(lake, await res.text());
    console.log('fetched lake');
  }
}

/* ---------- projection ---------------------------------------------------- */

const RAD = Math.PI / 180;
const R_KM = 6371;
// Web Mercator, both axes in radians so x and y share one scale factor.
const mercX = (lng) => lng * RAD;
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2));

/* ---------- geometry helpers --------------------------------------------- */

/** Douglas–Peucker, run in output pixels so the tolerance means what it says. */
function simplify(points, tol) {
  if (points.length < 3) return points;
  const sq = tol * tol;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = dx * dx + dy * dy;
    let far = -1;
    let best = sq;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      let t = len ? ((px - ax) * dx + (py - ay) * dy) / len : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = px - (ax + t * dx);
      const ey = py - (ay + t * dy);
      const d = ex * ex + ey * ey;
      if (d > best) { best = d; far = i; }
    }
    if (far > 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return points.filter((_, i) => keep[i]);
}

/** Sutherland–Hodgman against the frame, so off-canvas coastline is not shipped. */
function clipToRect(points, x0, y0, x1, y1) {
  const edges = [
    [(p) => p[0] >= x0, (a, b) => lerpX(a, b, x0)],
    [(p) => p[0] <= x1, (a, b) => lerpX(a, b, x1)],
    [(p) => p[1] >= y0, (a, b) => lerpY(a, b, y0)],
    [(p) => p[1] <= y1, (a, b) => lerpY(a, b, y1)],
  ];
  let out = points;
  for (const [inside, cut] of edges) {
    const next = [];
    for (let i = 0; i < out.length; i++) {
      const cur = out[i];
      const prev = out[(i + out.length - 1) % out.length];
      const curIn = inside(cur);
      const prevIn = inside(prev);
      if (curIn) {
        if (!prevIn) next.push(cut(prev, cur));
        next.push(cur);
      } else if (prevIn) {
        next.push(cut(prev, cur));
      }
    }
    out = next;
    if (!out.length) return out;
  }
  return out;
}
const lerpX = (a, b, x) => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])];
const lerpY = (a, b, y) => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y];

const round = (n) => Math.round(n * 10) / 10;
const toPath = (rings) =>
  rings
    .filter((r) => r.length > 2)
    .map((r) => `M${r.map(([x, y]) => `${round(x)} ${round(y)}`).join('L')}Z`)
    .join('');

/** A polygon's signed area, used to drop slivers and to find the biggest ring. */
function area(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(a) / 2;
}

/* ---------- build --------------------------------------------------------- */

function pickGeometry(results) {
  const hit = results.find(
    (r) => r.osm_type === 'relation' && r.type === 'administrative' && r.geojson,
  );
  if (!hit) throw new Error('no administrative relation');
  const g = hit.geojson;
  return g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
}

async function build() {
  const raw = [];
  for (const [slug, , kind] of PLACES) {
    const results = JSON.parse(await readFile(join(CACHE, 'bounds', `${slug}.json`), 'utf8'));
    raw.push({ slug, kind, polygons: pickGeometry(results) });
  }

  // The frame is the extent of the municipalities we actually serve. Districts
  // sit inside Toronto, so including them would change nothing.
  let lo = [Infinity, Infinity];
  let hi = [-Infinity, -Infinity];
  for (const { kind, polygons } of raw) {
    if (kind !== 'city') continue;
    for (const poly of polygons) {
      for (const [lng, lat] of poly[0]) {
        const x = mercX(lng);
        const y = mercY(lat);
        if (x < lo[0]) lo[0] = x;
        if (x > hi[0]) hi[0] = x;
        if (y < lo[1]) lo[1] = y;
        if (y > hi[1]) hi[1] = y;
      }
    }
  }

  const PAD = 10;
  const W = 800;
  const scale = (W - PAD * 2) / (hi[0] - lo[0]);
  const H = Math.round((hi[1] - lo[1]) * scale + PAD * 2);
  const px = (lng) => PAD + (mercX(lng) - lo[0]) * scale;
  const py = (lat) => PAD + (hi[1] - mercY(lat)) * scale;

  const project = (ring) => ring.map(([lng, lat]) => [px(lng), py(lat)]);
  const TOL = 0.45;
  const MIN_AREA = 4; // square px — smaller than this is a rendering artefact

  const shapes = raw.map(({ slug, kind, polygons }) => {
    const rings = [];
    for (const poly of polygons) {
      // Outer ring only: municipal holes are rare here and cost more than they add.
      const pts = simplify(project(poly[0]), TOL);
      if (area(pts) >= MIN_AREA) rings.push(pts);
    }
    rings.sort((a, b) => area(b) - area(a));
    return { slug, kind, d: toPath(rings) };
  });

  // Lake Ontario, clipped to the frame. Fifty thousand points go in; what is
  // inside the frame and survives simplification is a couple of hundred.
  const lakeHit = JSON.parse(await readFile(join(CACHE, 'lake-ontario.json'), 'utf8')).find(
    (r) => r.class === 'natural' || r.type === 'lake',
  );
  const lakeGeom = lakeHit.geojson;
  const lakeRings = (lakeGeom.type === 'MultiPolygon' ? lakeGeom.coordinates : [lakeGeom.coordinates])
    .map((poly) => clipToRect(project(poly[0]), 0, 0, W, H))
    .filter((r) => r.length > 2)
    .map((r) => simplify(r, TOL));

  const ts = `/**
 * Generated by scripts/geo.mjs — do not edit by hand, run \`npm run geo\`.
 *
 * Municipal boundaries: OpenStreetMap contributors (ODbL).
 * Lake Ontario: Natural Earth (public domain).
 *
 * Coordinates are Web Mercator, already projected into the viewBox below, so
 * the component renders them straight and the build needs no geometry maths.
 */

export interface MapShape {
  slug: string;
  /** 'city' is a municipality we serve; 'district' is a part of Toronto. */
  kind: 'city' | 'district';
  d: string;
}

export const mapFrame = {
  width: ${W},
  height: ${H},
  /** Frame edges in Web Mercator radians, for projecting point markers. */
  westMercX: ${lo[0]},
  northMercY: ${hi[1]},
  scale: ${scale},
  pad: ${PAD},
} as const;

/** Projects a coordinate into the frame above. */
export function projectPoint(lng: number, lat: number): { x: number; y: number } {
  const mercY = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  return {
    x: mapFrame.pad + ((lng * Math.PI) / 180 - mapFrame.westMercX) * mapFrame.scale,
    y: mapFrame.pad + (mapFrame.northMercY - mercY) * mapFrame.scale,
  };
}

/** Kilometres per projected pixel at the frame's centre latitude. */
export const kmPerPx = ${(R_KM * Math.cos(Math.atan(Math.sinh((lo[1] + hi[1]) / 2)))) / scale};

export const lakePath = ${JSON.stringify(toPath(lakeRings))};

export const mapShapes: MapShape[] = ${JSON.stringify(shapes, null, 2)};
`;

  await writeFile('src/data/geo.ts', ts);
  const kb = (Buffer.byteLength(ts) / 1024).toFixed(0);
  console.log(`src/data/geo.ts — ${kb} KB, ${shapes.length} shapes, frame ${W}x${H}`);
}

await fetchAll();
await build();
