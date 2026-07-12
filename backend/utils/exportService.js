const escapeCsvValue = (value) => {
    if (value === null || typeof value === 'undefined') {
        return '';
    }

    const normalizedValue = String(typeof value === 'string' ? value : JSON.stringify(value))
        .replace(/\r?\n/g, '\\n');

    return `"${normalizedValue.replace(/"/g, '""')}"`;
};

// Utility to convert JSON array to CSV format for Financial Analyst Reports
const jsonToCsv = (data) => {
    if (!Array.isArray(data) || !data.length) {
        return '';
    }

    const headers = [...new Set(data.flatMap(row => Object.keys(row || {})))];
    const rows = data.map(row =>
        headers.map(header => escapeCsvValue(row?.[header])).join(',')
    ).join('\n');

    return `${headers.join(',')}\n${rows}`;
};

module.exports = { jsonToCsv, escapeCsvValue };