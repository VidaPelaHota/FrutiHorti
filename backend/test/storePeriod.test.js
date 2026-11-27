const test = require('node:test');
const assert = require('node:assert/strict');

const { isValidMonth, getCurrentStoreMonth, storeDayStartUtc, getStoreMonthRange } = require('../src/storePeriod');

test('isValidMonth accepts YYYY-MM and rejects anything else', () => {
  assert.equal(isValidMonth('2026-11'), true);
  for (const value of ['2026-13', '2026-00', '2026-1', '26-11', '2026-11-01', '']) {
    assert.equal(isValidMonth(value), false, value);
  }
});

test('a store day in Brasília starts at 03:00 UTC', () => {
  assert.equal(storeDayStartUtc('2026-11-01').toISOString(), '2026-11-01T03:00:00.000Z');
});

test('the monthly range covers the whole local month, including the last evening', () => {
  const range = getStoreMonthRange('2026-11');
  assert.equal(range.firstDay, '2026-11-01');
  assert.equal(range.lastDay, '2026-11-30');
  assert.equal(range.start.toISOString(), '2026-11-01T03:00:00.000Z');
  assert.equal(range.end.toISOString(), '2026-12-01T03:00:00.000Z');

  // 30/11 at 23:30 in Brasília is already 01/12 in UTC, but belongs to November.
  const lastEvening = new Date('2026-11-30T23:30:00-03:00');
  assert.ok(lastEvening >= range.start && lastEvening < range.end);
});

test('December rolls over to January of the next year', () => {
  const range = getStoreMonthRange('2026-12');
  assert.equal(range.lastDay, '2026-12-31');
  assert.equal(range.end.toISOString(), '2027-01-01T03:00:00.000Z');
});

test('February has the right last day in leap years', () => {
  assert.equal(getStoreMonthRange('2028-02').lastDay, '2028-02-29');
  assert.equal(getStoreMonthRange('2027-02').lastDay, '2027-02-28');
});

test('the current month uses the store time zone at 22h on the last day of the month', () => {
  assert.equal(getCurrentStoreMonth(new Date('2026-11-30T22:00:00-03:00')), '2026-11');
});
