const { STORE_TIMEZONE, getStoreToday } = require('./productStatus');

const MONTH_REGEX = /^(\d{4})-(0[1-9]|1[0-2])$/;

function isValidMonth(value) {
  return MONTH_REGEX.test(String(value));
}

function getCurrentStoreMonth(referenceDate = new Date()) {
  return getStoreToday(referenceDate).slice(0, 7);
}

// Offset of the store's time zone at a given instant, in milliseconds (negative west of UTC).
function getTimeZoneOffsetMs(instant, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const value = Object.fromEntries(parts.map((part) => [part.type, Number(part.value)]));
  const localAsUtc = Date.UTC(value.year, value.month - 1, value.day, value.hour, value.minute, value.second);
  return localAsUtc - instant.getTime();
}

// The UTC instant at which a store-local day ('YYYY-MM-DD') starts.
function storeDayStartUtc(dateString, timeZone = STORE_TIMEZONE) {
  const [year, month, day] = dateString.split('-').map(Number);
  const naiveMidnight = Date.UTC(year, month - 1, day);
  return new Date(naiveMidnight - getTimeZoneOffsetMs(new Date(naiveMidnight), timeZone));
}

function nextMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return monthNumber === 12 ? `${year + 1}-01` : `${year}-${String(monthNumber + 1).padStart(2, '0')}`;
}

function lastDayOfMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return `${month}-${String(lastDay).padStart(2, '0')}`;
}

// A store month as UTC bounds [start, end) for TIMESTAMP filters, plus its first and last local days.
function getStoreMonthRange(month, timeZone = STORE_TIMEZONE) {
  return {
    month,
    firstDay: `${month}-01`,
    lastDay: lastDayOfMonth(month),
    start: storeDayStartUtc(`${month}-01`, timeZone),
    end: storeDayStartUtc(`${nextMonth(month)}-01`, timeZone),
  };
}

module.exports = { isValidMonth, getCurrentStoreMonth, storeDayStartUtc, getStoreMonthRange };
