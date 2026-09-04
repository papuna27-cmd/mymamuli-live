/**
 * Phone navigation. Hydrated with client:media="(max-width: 767px)" so the
 * JS never downloads on desktop, where the header nav is plain markup.
 *
 * A real menu button, focus trapped while open, body scroll locked, closes on
 * Escape and on backdrop tap. Not a hover dropdown.
 */

import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { NavItem } from '../data/site';

interface Props {
  items: NavItem[];
  phone: string;
  phoneDisplay: string;
  path: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function MobileNav({ items, phone, phoneDisplay, path }: Props) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const scrollY = useRef(0);

  const close = useCallback(() => setOpen(false), []);

  // Body scroll lock that survives iOS Safari's rubber-banding.
  useEffect(() => {
    const body = document.body;
    if (open) {
      scrollY.current = window.scrollY;
      body.style.position = 'fixed';
      body.style.top = `-${scrollY.current}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.overflow = 'hidden';
      return () => {
        body.style.position = '';
        body.style.top = '';
        body.style.left = '';
        body.style.right = '';
        body.style.overflow = '';
        window.scrollTo(0, scrollY.current);
      };
    }
    return undefined;
  }, [open]);

  // Escape to close, Tab trapped inside the sheet.
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab') return;

      const sheet = sheetRef.current;
      if (!sheet) return;
      const nodes = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null,
      );
      if (nodes.length === 0) return;

      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !sheet.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    // Move focus into the sheet once it exists.
    const t = window.setTimeout(() => {
      sheetRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }, 20);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(t);
    };
  }, [open, close]);

  const flat = items.flatMap((item) => (item.children ? item.children : [item]));

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        class="navbtn"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
      >
        <span class="navbtn__bars" aria-hidden="true" data-open={open}>
          <span /><span /><span />
        </span>
        <span class="navbtn__text">{open ? 'Close' : 'Menu'}</span>
      </button>

      {open && (
        <div class="navsheet" role="dialog" aria-modal="true" aria-label="Site menu" id="mobile-nav">
          <button
            type="button"
            class="navsheet__backdrop"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={close}
          />
          <div class="navsheet__panel" ref={sheetRef}>
            <nav aria-label="Site">
              <ul class="navsheet__list">
                {flat.map((item) => {
                  const current = path === item.href;
                  return (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        class="navsheet__link"
                        aria-current={current ? 'page' : undefined}
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div class="navsheet__actions">
              <a class="btn btn--signal btn--block" href="/calculator">Get a quote</a>
              <a class="btn btn--ghost btn--block" href={`tel:${phone}`}>Call {phoneDisplay}</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
