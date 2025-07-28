
import conversion from '../../src/lib/arloconversion';

// Your full (or as complete as possible) case statement string
const awsCaseStatement = `

when(
    ("AWS_SERVICE" = "Oracle Linux Server 8.6 with support by Tiov IT"), "Amazon Marketplace"),
when(
    ("AWS_SERVICE" = "Oracle Linux Server 8.7 with support by Tiov IT"), "Amazon Marketplace"),
;
`;


describe('custom.test.js', () => {
  it.only('convert word to CC', async () => {
    const output = conversion.convert(awsCaseStatement,'ccs','1001');
    console.log(JSON.stringify(output, null, 2));
  });
});