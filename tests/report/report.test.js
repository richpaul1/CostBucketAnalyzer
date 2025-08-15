
import reports from '../../src/lib/reports/labelreport';
import ccs from '../../costcat/tu.json'

describe('labelreport', () => {
  it.only('run report', async () => {
    const output = reports.convert(ccs);
    const csv = reports.convertToCsv(output);
    const fs = require('fs');
    fs.writeFileSync('labelreport.csv', csv);
  });
});