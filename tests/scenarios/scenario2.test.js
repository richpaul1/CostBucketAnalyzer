import * as utils from '../../src/lib/utils.js';
import { getFile, getFileAsJSON } from '../lib/test.helper.js';
import fs from 'fs/promises';
import path from 'path';
import { File } from 'buffer';

describe('processMappingFiles with /costcat/cat.json', () => {
  it('should process scenario2.json correctly', async () => {
    let json = await getFileAsJSON('../scenarios/scenario2.json');
    let results = utils.getConflicts(json);
    expect(results[0]).toEqual( '1. Cost Category B > BucketB-1 has duplicate rule : Instance Type IN t2.small')
    expect(results[1]).toEqual( '2. Cost Category B > BucketB-1 overlaps Cost Category B > BucketB-2 rule : Account IN 759984737373 AND Instance Type IN t3.small')
    expect(results[2]).toEqual( '3. Cost Category B > BucketB-1 overlaps Cost Category A > BucketA-1 rule : Account IN 043253718892 AND Instance Type IN t3.micro')
    expect(results[3]).toEqual( '4. Cost Category B > BucketB-1 overlaps Cost Category A > BucketA-1 rule : Instance Type IN t2.small')
    expect(results[4]).toEqual( '5. Cost Category B > BucketB-1 overlaps Cost Category A > BucketA-2 rule : Account IN 043253718892 AND Instance Type IN t3.small')
    expect(results[5]).toEqual( '6. Cost Category B > BucketB-1 overlaps Cost Category A > BucketA-2 rule : Instance Type IN t2.small')
    console.log('Generated rule combinations:',results);
  });
});