const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_DISCOUNT_TIERS,
  parseDiscountTiers,
  getDiscountPercent,
  applyDiscount,
} = require('../src/discountRules');

// N2 acceptance: 1 day → 50%, 2 days → 30%, 3 days → 20%, 4+ days → no discount.
for (const [days, expected] of [[1, 50], [2, 30], [3, 20], [4, 0], [30, 0]]) {
  test(`a lot expiring in ${days} day(s) gets ${expected}% off`, () => {
    assert.equal(getDiscountPercent(days, false), expected);
  });
}

test('an expired lot never gets a discount, because it cannot be sold', () => {
  assert.equal(getDiscountPercent(0, true), 0);
  assert.equal(getDiscountPercent(-2, true), 0);
});

test('a lot without an expiration date gets no discount', () => {
  assert.equal(getDiscountPercent(null, false), 0);
});

test('applyDiscount rounds to the cent', () => {
  assert.equal(applyDiscount(10, 30), 7);
  assert.equal(applyDiscount('6.50', 20), 5.2);
  assert.equal(applyDiscount(3.33, 50), 1.67);
  assert.equal(applyDiscount(8.9, 0), 8.9);
});

test('parseDiscountTiers uses the defaults when DISCOUNT_TIERS is not set', () => {
  assert.deepEqual(parseDiscountTiers(undefined), DEFAULT_DISCOUNT_TIERS);
});

test('parseDiscountTiers reads days:percent pairs and sorts them by days', () => {
  assert.deepEqual(parseDiscountTiers('5:10,1:40'), [{ maxDays: 1, percent: 40 }, { maxDays: 5, percent: 10 }]);
});

test('parseDiscountTiers rejects malformed tiers instead of selling with a wrong discount', () => {
  assert.throws(() => parseDiscountTiers('1:150'), /DISCOUNT_TIERS inválido/);
  assert.throws(() => parseDiscountTiers('abc'), /DISCOUNT_TIERS inválido/);
  assert.throws(() => parseDiscountTiers('0:10'), /DISCOUNT_TIERS inválido/);
});
