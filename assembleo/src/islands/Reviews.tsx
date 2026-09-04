/**
 * Reviews carousel. Data is resolved at build time (see lib/api getReviews),
 * so the cards are in the HTML and nothing shifts when this hydrates — the
 * island only adds the paging affordances.
 *
 * No AggregateRating structured data: these come from Google Business Profile
 * and marking up third-party ratings as your own breaks Google's policy.
 */

import { useEffect, useRef, useState } from 'preact/hooks';
import type { Review } from '../lib/types';

interface Props {
  reviews: Review[];
  rating: number;
  count: number;
  profileUrl: string;
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span class="stars" role="img" aria-label={`${rating} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"
          fill={i < full ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linejoin="round">
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2Z" />
        </svg>
      ))}
    </span>
  );
}

function initials(name: string): string {
  return name.split(/\s+/).map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase();
}

export default function Reviews({ reviews, rating, count, profileUrl }: Props) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const cards = Array.from(el.children) as HTMLElement[];
        const mid = el.scrollLeft + el.clientWidth / 2;
        let best = 0;
        let bestD = Infinity;
        cards.forEach((c, i) => {
          const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
          if (d < bestD) { bestD = d; best = i; }
        });
        setActive(best);
        setAtStart(el.scrollLeft < 8);
        setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
      });
    };

    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const goTo = (i: number) => {
    const el = trackRef.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (!el || !card) return;
    el.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
  };

  const step = (dir: -1 | 1) => goTo(Math.min(reviews.length - 1, Math.max(0, active + dir)));

  return (
    <div class="revs">
      <div class="revs__head">
        <p class="revs__score">
          <span class="revs__num num">{rating.toFixed(1)}</span>
          <Stars rating={rating} />
          <span class="small">from {count} Google reviews</span>
        </p>
        <div class="revs__nav">
          <button type="button" class="revs__arrow" onClick={() => step(-1)} disabled={atStart} aria-label="Previous review">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button type="button" class="revs__arrow" onClick={() => step(1)} disabled={atEnd} aria-label="Next review">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      <ul class="revs__track" ref={trackRef}>
        {reviews.map((r, i) => (
          <li class="revs__card" key={`${r.author}-${i}`}>
            <Stars rating={r.rating} />
            <blockquote class="revs__text"><p>{r.text}</p></blockquote>
            <div class="revs__who">
              {r.profilePhotoUrl ? (
                <img class="revs__avatar" src={r.profilePhotoUrl} alt="" width="36" height="36" loading="lazy" decoding="async" />
              ) : (
                <span class="revs__avatar revs__avatar--initials" aria-hidden="true">{initials(r.author)}</span>
              )}
              <span>
                <span class="revs__author">{r.author}</span>
                <span class="revs__when small">{r.relativeTime}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div class="revs__foot">
        <ul class="revs__dots" aria-hidden="true">
          {reviews.map((_, i) => (
            <li key={i} class={`revs__dot${i === active ? ' is-on' : ''}`} />
          ))}
        </ul>
        <a class="textlink" href={profileUrl} rel="noopener noreferrer nofollow" target="_blank">
          Read them on Google
        </a>
      </div>
    </div>
  );
}
