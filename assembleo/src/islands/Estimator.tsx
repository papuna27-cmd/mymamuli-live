/**
 * Residential assembly estimator.
 *
 * Pick items, get a price range. Commercial work is not priced here — it is
 * quoted individually, and the page says so next to the commercial CTA.
 *
 * Every number comes from src/data/pricing.ts, which is the single source of
 * truth for rates.
 */

import { useMemo, useState } from 'preact/hooks';
import { HST, MINIMUM, allItems, estimatorNote, priceGroups } from '../data/pricing';

const cad = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

const cad2 = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 }).format(n);

export default function Estimator() {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [openGroup, setOpenGroup] = useState<string>(priceGroups[0]!.group);

  const bump = (id: string, by: number) =>
    setQty((q) => {
      const next = Math.max(0, Math.min(30, (q[id] ?? 0) + by));
      const copy = { ...q };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });

  const result = useMemo(() => {
    let min = 0;
    let max = 0;
    let count = 0;
    const lines: Array<{ name: string; n: number; min: number; max: number }> = [];

    for (const [id, n] of Object.entries(qty)) {
      const item = allItems.find((i) => i.id === id);
      if (!item) continue;
      min += item.min * n;
      max += item.max * n;
      count += n;
      lines.push({ name: item.name, n, min: item.min * n, max: item.max * n });
    }

    const minimumApplied = count > 0 && min < MINIMUM;
    if (minimumApplied) min = MINIMUM;
    if (count > 0 && max < MINIMUM) max = MINIMUM;

    return {
      count,
      lines,
      minimumApplied,
      subMin: min,
      subMax: max,
      taxMin: min * HST,
      taxMax: max * HST,
      totMin: min * (1 + HST),
      totMax: max * (1 + HST),
    };
  }, [qty]);

  const hasItems = result.count > 0;

  function sendToForm() {
    const summary = result.lines.map((l) => `${l.n} × ${l.name}`).join('\n');
    const text =
      `${summary}\n\nEstimated ${cad(result.totMin)}–${cad(result.totMax)} including HST (from the website estimator).`;
    try {
      sessionStorage.setItem('assembleo:estimate', text);
    } catch {
      /* private mode — the event below still carries it */
    }
    window.dispatchEvent(new CustomEvent('assembleo:estimate', { detail: text }));
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div class="est">
      <div class="est__picker">
        {priceGroups.map((g) => {
          const open = openGroup === g.group;
          const inGroup = g.items.reduce((s, i) => s + (qty[i.id] ?? 0), 0);
          return (
            <section class="est__group" key={g.group}>
              <button
                type="button"
                class="est__groupBtn"
                aria-expanded={open}
                onClick={() => setOpenGroup(open ? '' : g.group)}
              >
                <span class="est__groupName">
                  {g.group}
                  {inGroup > 0 && <span class="est__count">{inGroup}</span>}
                </span>
                <span class="est__mark" aria-hidden="true">{open ? '−' : '+'}</span>
              </button>

              {open && (
                <ul class="est__items">
                  {g.items.map((item) => {
                    const n = qty[item.id] ?? 0;
                    return (
                      <li class="est__item" key={item.id}>
                        <span class="est__itemText">
                          <span class="est__itemName">{item.name}</span>
                          <span class="est__itemPrice num">
                            {cad(item.min)}–{cad(item.max)}
                            {item.note && <span class="est__itemNote"> · {item.note}</span>}
                          </span>
                        </span>
                        <span class="est__stepper">
                          <button
                            type="button"
                            onClick={() => bump(item.id, -1)}
                            disabled={n === 0}
                            aria-label={`Remove one ${item.name}`}
                          >−</button>
                          <span class="est__qty num" aria-live="polite" aria-label={`${n} ${item.name}`}>{n}</span>
                          <button
                            type="button"
                            onClick={() => bump(item.id, 1)}
                            aria-label={`Add one ${item.name}`}
                          >+</button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <div class="est__panel panel">
        {!hasItems && (
          <div class="est__empty">
            <p class="est__emptyTitle">Nothing picked yet</p>
            <p class="small">
              Add what you need built and the price appears here. No contact details required to see a
              number.
            </p>
          </div>
        )}

        {hasItems && (
          <div class="est__result">
            <p class="est__kicker">{result.count} {result.count === 1 ? 'item' : 'items'}</p>

            <ul class="est__lines num">
              {result.lines.map((l) => (
                <li key={l.name}>
                  <span>{l.n} × {l.name}</span>
                  <span>{cad(l.min)}–{cad(l.max)}</span>
                </li>
              ))}
            </ul>

            <dl class="est__totals num">
              <div>
                <dt>Subtotal{result.minimumApplied ? ' (minimum visit)' : ''}</dt>
                <dd>{cad2(result.subMin)}–{cad2(result.subMax)}</dd>
              </div>
              <div>
                <dt>HST 13%</dt>
                <dd>{cad2(result.taxMin)}–{cad2(result.taxMax)}</dd>
              </div>
            </dl>

            <div class="est__total num">
              <span>Estimated total</span>
              <strong>{cad(result.totMin)}–{cad(result.totMax)}</strong>
            </div>

            {result.minimumApplied && (
              <p class="small est__min">
                Small jobs come in at our {cad(MINIMUM)} minimum visit rather than the per-item rate.
              </p>
            )}

            <button type="button" class="btn btn--signal btn--block btn--keep est__send" onClick={sendToForm}>
              Send this list for a fixed price
            </button>
            <p class="legal est__note">{estimatorNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
