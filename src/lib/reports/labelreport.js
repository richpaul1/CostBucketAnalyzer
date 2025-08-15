export function convert(jsonData) {
  const report = [];
  jsonData.resource.businessMappings.forEach(mapping => {
    const costCategory = mapping.name;
    mapping.costTargets.forEach(target => {
      const costTarget = target.name;
      target.rules.forEach(rule => {
        rule.viewConditions.forEach(condition => {
          if (condition.viewField.identifier === "LABEL") {
            report.push({
              CostCategory: costCategory,
              CostTarget: costTarget,
              fieldName: condition.viewField.fieldName,
              values: condition.values
            });
          }
        });
      });
    });
  });
  return report;
}

export function convertToCsv(data) {
  if (!data || data.length === 0) {
    return ''; // Return an empty string if no data
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];

      // Special handling for the 'values' array
      if (header === 'values' && Array.isArray(value)) {
        // Quote each individual value in the array and then join them with commas
        return `"${value.map(v => v.replace(/"/g, '""')).join('","')}"`;
      }

      // Basic CSV escaping for other string values that contain commas, newlines, or quotes
      if (typeof value === 'string') {
        // Escape double quotes by doubling them, then wrap the entire string in quotes
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
             return `"${value.replace(/"/g, '""')}"`;
        }
        return value; // No need to quote if no problematic characters
      }

      return value;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}
module.exports = {
  convert,convertToCsv
};
