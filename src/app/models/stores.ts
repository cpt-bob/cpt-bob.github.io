export const STORES = [
  'Costco',
  'Walmart',
  'Target',
  "Macey's",
  "Smith's",
  "Sam's Club",
  'Any',
  'Other',
] as const;

export type StoreName = (typeof STORES)[number];
