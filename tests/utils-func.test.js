/**
 * Test suite for business mapping utility functions
 */

import { 
    processMappingFiles, 
    findOverlappingRules, 
    compareRules, 
    normalizeConditions, 
    isSubset 
} from '../src/lib/utils.js';
const fs = require('fs').promises;
const path = require('path');
const { File } = require('buffer'); 

describe('processMappingFiles with /costcat/cat.json', () => {
  it('should process cat.json correctly', async () => {
    const filePath = path.resolve(__dirname, './costcat/cat.json');
    let file;
    try {
      const fileContent = await fs.readFile(filePath);
      // Create File object with Buffer content
      file = new File([fileContent], 'cat.json', { type: 'application/json' });
    } catch (e) {
      throw new Error(`Failed to read cat.json: ${e.message}`);
    }

    const result = await processMappingFiles([file]);

    let overlaps = findOverlappingRules(result, true);
    console.log('Processed mappings:', JSON.stringify(overlaps,null, 2));

   
  });

  it('should throw error for non-JSON file extension', async () => {
    const file = new File(['some text'], 'cat.txt', { type: 'text/plain' });
    await expect(processMappingFiles([file])).rejects.toThrow(
      'Invalid file format: cat.txt. Only JSON files are supported.'
    );
  });

  it('should throw error for invalid JSON', async () => {
    const file = new File(['not a json'], 'cat.json', { type: 'application/json' });
    await expect(processMappingFiles([file])).rejects.toThrow(
      'Invalid JSON in cat.json'
    );
  });
});