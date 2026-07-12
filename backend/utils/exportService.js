/**
 * backend/utils/exportService.js
 *
 * NOTE: This file is kept for reference/compatibility.
 * The canonical TypeScript version is at: lib/utils/csv.ts
 * Use that in all API routes instead of this file.
 */

// Utility to convert JSON array to CSV format for Financial Analyst Reports
const jsonToCsv = (data) => {
    if (!data || !data.length) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
        Object.values(row).map(value => `"${value}"`).join(',')
    ).join('\n');
    return `${headers}\n${rows}`;
};

module.exports = { jsonToCsv };