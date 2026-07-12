// Utility to convert JSON array to CSV format for Financial Analyst Reports
const jsonToCsv = (data) => {
    if (!data || !data.length) return '';
    
    // Extract headers
    const headers = Object.keys(data[0]).join(',');
    
    // Map rows
    const rows = data.map(row => 
        Object.values(row).map(value => `"${value}"`).join(',')
    ).join('\n');
    
    return `${headers}\n${rows}`;
};

module.exports = { jsonToCsv };