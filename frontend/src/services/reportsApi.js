import { apiGet } from './apiClient';

// N3: monthly waste report. `month` is 'YYYY-MM'; without it the API uses the current store month.
export function getWasteReport(month) {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return apiGet(`/reports/waste${query}`).then((data) => data.report);
}
