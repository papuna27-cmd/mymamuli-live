/**
 * Estimator price table.
 *
 * ⚠ PLACEHOLDER RATES — these are plausible Ontario market rates so the
 * estimator can be designed and tested. Replace every `min`/`max` with the
 * real numbers before launch. This file is the single source of truth: no
 * price is written anywhere else in the codebase.
 *
 * Prices are per item, before HST, and expressed as a range because the
 * final figure depends on the model and the site.
 */

export interface PriceItem {
  id: string;
  name: string;
  note?: string;
  min: number;
  max: number;
}

export interface PriceGroup {
  group: string;
  items: PriceItem[];
}

export const HST = 0.13;

/** Minimum charge for a residential visit, before tax. */
export const MINIMUM = 90;

/**
 * Hourly alternative. The customer picks whichever suits them — per item when
 * they know exactly what they have, hourly when the job is vague or they want
 * us for a block of time. Both are offered; neither is imposed.
 */
export const HOURLY_RATE = 130;
export const HOURLY_MIN_HOURS = 1;
export const HOURLY_DEFAULT_HOURS = 2;

export const priceGroups: PriceGroup[] = [
  {
    group: 'Bedroom',
    items: [
      { id: 'bed-single', name: 'Bed frame, single or double', min: 80, max: 130 },
      { id: 'bed-queen', name: 'Bed frame, queen, king or storage', min: 120, max: 180 },
      { id: 'dresser', name: 'Dresser or chest of drawers', min: 90, max: 140 },
      { id: 'nightstand', name: 'Nightstand or small table', min: 40, max: 60 },
      { id: 'wardrobe-2', name: 'Wardrobe, 2 doors', min: 150, max: 220 },
      { id: 'wardrobe-3', name: 'Wardrobe or closet system, 3+ doors', note: 'PAX runs and sliding doors', min: 220, max: 350 },
      { id: 'crib', name: 'Crib or change table', min: 70, max: 120 },
    ],
  },
  {
    group: 'Living and dining',
    items: [
      { id: 'sofa', name: 'Sofa or sectional', min: 100, max: 180 },
      { id: 'media', name: 'TV unit or media wall', min: 80, max: 140 },
      { id: 'bookcase', name: 'Bookcase or shelving unit', min: 60, max: 90 },
      { id: 'dining', name: 'Dining table with chairs', min: 120, max: 200 },
      { id: 'chair', name: 'Chair or stool', min: 25, max: 40 },
    ],
  },
  {
    group: 'Work and storage',
    items: [
      { id: 'desk', name: 'Desk or standing desk', min: 70, max: 110 },
      { id: 'office-chair', name: 'Office chair', min: 40, max: 60 },
      { id: 'cabinet', name: 'Filing cabinet or storage unit', min: 50, max: 80 },
    ],
  },
  {
    group: 'Outdoor and fitness',
    items: [
      { id: 'patio', name: 'Patio set', min: 100, max: 180 },
      { id: 'bbq', name: 'BBQ or grill', min: 80, max: 130 },
      { id: 'gazebo', name: 'Gazebo or shed', min: 200, max: 400 },
      { id: 'treadmill', name: 'Treadmill or exercise bike', min: 120, max: 200 },
      { id: 'homegym', name: 'Home gym or multi-station', min: 250, max: 450 },
    ],
  },
];

export const allItems: PriceItem[] = priceGroups.flatMap((g) => g.items);

export const hourlyNote =
  'One assembler, tools included. Charged from arrival, rounded to the nearest half hour. Best when you are not sure how much there is, or you want us for a block of time.';

export const perItemNote =
  'Best when you know what you have. The price is fixed per item before we start, so it does not grow while we work.';

/**
 * Shown above the estimator, before any number appears, and again under the
 * total. The distinction matters commercially: the figure here is a guide, a
 * fixed price needs the actual furniture in front of us, and the hourly rate
 * is the option for anyone who does not want to wait for one.
 */
export const estimatorNotice = {
  title: 'This is an estimate, not a fixed price.',
  body: [
    `The number here is a guide based on the models we see most often. A fixed price is confirmed once we see the actual furniture — the model, how many boxes, and the access at your address. Send the list and you have that price back within two hours during working hours.`,
    `If you would rather not wait for a fixed price, book us by the hour instead: $${HOURLY_RATE} an hour plus HST, charged from arrival.`,
  ],
};

export const estimatorNote =
  `An estimate, not a fixed price. The exact figure is confirmed once we see the furniture itself. Prefer not to wait? Book by the hour at $${HOURLY_RATE} plus HST. Commercial work is quoted individually.`;
