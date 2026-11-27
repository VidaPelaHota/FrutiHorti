const test = require('node:test');
const assert = require('node:assert/strict');

const { getWasteReport } = require('../src/handlers/reports');
const wasteReportService = require('../src/services/wasteReportService');
const { ValidationError } = require('../src/errors');
const { getQueryParams } = require('../src/httpUtils');

function fakeResponse() {
  return {
    status: null,
    body: null,
    writeHead(status) { this.status = status; },
    end(payload) { this.body = JSON.parse(payload); },
  };
}

test('GET /reports/waste rejects a malformed month with 400', async () => {
  await assert.rejects(getWasteReport({ url: '/reports/waste?month=2026-13' }, fakeResponse()), ValidationError);
});

test('GET /reports/waste passes the month to the service and returns the report', async (t) => {
  const service = t.mock.method(wasteReportService, 'getWasteReport', async (month) => ({ mes: month }));
  const res = fakeResponse();
  await getWasteReport({ url: '/reports/waste?month=2026-10' }, res);

  assert.deepEqual(service.mock.calls[0].arguments, ['2026-10']);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { report: { mes: '2026-10' } });
});

test('GET /reports/waste without month lets the service pick the current month', async (t) => {
  const service = t.mock.method(wasteReportService, 'getWasteReport', async () => ({}));
  await getWasteReport({ url: '/reports/waste' }, fakeResponse());
  assert.deepEqual(service.mock.calls[0].arguments, [undefined]);
});

test('getQueryParams reads the query string', () => {
  assert.deepEqual(getQueryParams({ url: '/reports/waste?month=2026-11&x=1' }), { month: '2026-11', x: '1' });
  assert.deepEqual(getQueryParams({ url: '/reports/waste' }), {});
});
