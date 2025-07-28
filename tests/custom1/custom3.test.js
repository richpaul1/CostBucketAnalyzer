
import conversion from '../../src/lib/arloconversion';

// Your full (or as complete as possible) case statement string
const awsCaseStatement = `

when(
    ("AWS_SERVICE" = "Amazon CloudFront" AND contains("USAGE_TYPE","Requests-")), "CloudFront - HTTPS Requests"),
;
`;


describe('custom.test.js', () => {
  it.only('convert word to CC', async () => {
    const output = conversion.convert(awsCaseStatement,'ccs','1001');
    console.log(JSON.stringify(output, null, 2));
  });
});