import * as utils from '../../src/lib/utils.js';
import { getFile } from '../lib/test.helper.js';
import fs from 'fs/promises';
import path from 'path';
import { File } from 'buffer';

describe('processMappingFiles with /costcat/cat.json', () => {
  it('should process scenario1.json correctly', async () => {
    let file = await getFile('../scenarios/scenario1.json');
    const json = await utils.getCostCategoriesAsJSON([file]);

    let results = utils.getConflicts(json);
    expect(results[0]).toEqual( '1. Cost Category A > BucketA-1 overlaps Cost Category A > BucketA-2 rule : Instance Type IN t2.small')
    console.log('Processed mappings:', JSON.stringify(results, null, 2));
  });
});