// N2: automatic discount for products close to expiration.
// Each tier covers lots that expire in up to `maxDays` days; the first matching tier applies.
// Expired lots never get a discount, because they cannot be sold (critical business rule).
// Tiers can be overridden with DISCOUNT_TIERS="1:50,2:30,3:20" (days:percent).
const DEFAULT_DISCOUNT_TIERS = [
  { maxDays: 1, percent: 50 },
  { maxDays: 2, percent: 30 },
  { maxDays: 3, percent: 20 },
];

function parseDiscountTiers(text) {
  if (!text) {
    return DEFAULT_DISCOUNT_TIERS;
  }

  const tiers = String(text)
    .split(',')
    .map((entry) => entry.split(':').map(Number))
    .map(([maxDays, percent]) => ({ maxDays, percent }));

  const isValid = tiers.every(
    ({ maxDays, percent }) => Number.isInteger(maxDays) && maxDays > 0 && Number.isFinite(percent) && percent > 0 && percent < 100
  );
  if (!isValid) {
    throw new Error(`DISCOUNT_TIERS inválido: "${text}". Use o formato dias:percentual, por exemplo 1:50,2:30,3:20`);
  }

  return [...tiers].sort((first, second) => first.maxDays - second.maxDays);
}

const DISCOUNT_TIERS = parseDiscountTiers(process.env.DISCOUNT_TIERS);

function getDiscountPercent(daysUntilExpiration, isLotExpired, tiers = DISCOUNT_TIERS) {
  if (isLotExpired || daysUntilExpiration === null || daysUntilExpiration === undefined) {
    return 0;
  }

  const tier = tiers.find(({ maxDays }) => daysUntilExpiration <= maxDays);
  return tier ? tier.percent : 0;
}

// Money is handled in cents so repeated sums never drift (0.1 + 0.2 problem).
function toCents(value) {
  return Math.round(Number(value) * 100);
}

function fromCents(cents) {
  return cents / 100;
}

function applyDiscount(price, percent) {
  const priceInCents = toCents(price);
  return fromCents(Math.round((priceInCents * (100 - percent)) / 100));
}

module.exports = {
  DEFAULT_DISCOUNT_TIERS,
  DISCOUNT_TIERS,
  parseDiscountTiers,
  getDiscountPercent,
  applyDiscount,
  toCents,
  fromCents,
};
