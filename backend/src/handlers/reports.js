const wasteReportService = require('../services/wasteReportService');
const { sendJson, getQueryParams } = require('../httpUtils');
const { isValidMonth } = require('../storePeriod');
const { ValidationError } = require('../errors');

// GET /reports/waste?month=YYYY-MM (default: the current month in the store's time zone).
async function getWasteReport(req, res) {
  const { month } = getQueryParams(req);
  if (month !== undefined && !isValidMonth(month)) {
    throw new ValidationError('month deve estar no formato YYYY-MM');
  }

  const report = await wasteReportService.getWasteReport(month);
  sendJson(res, 200, { report });
}

module.exports = { getWasteReport };
