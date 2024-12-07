const AWSXRay = require('aws-xray-sdk-core');
const XRayExpress = require('aws-xray-sdk-express');
const express = require('express');
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

// Wrap the Express app with X-Ray middleware
const app = express();
app.use(XRayExpress.openSegment('MyApp'));

app.get('/generate-automatic-traces', async (req, res) => {
  try {
    // Capture outgoing requests from S3 client
    const s3Client = AWSXRay.captureAWSv3Client(new S3Client({ region: 'us-west-2' }));
    const data = await s3Client.send(new ListBucketsCommand());

    const buckets = data.Buckets.map(bucket => ({
      name: bucket.Name,
      creation_date: bucket.CreationDate.toISOString()
    }));

    res.json(buckets);
  } catch (err) {
    res.status(500).send(`Unable to list buckets: ${err.message}`);
  }
});

app.get('/generate-manual-traces', async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment.addNewSubsegment('ManualSegment');

  try {
    const s3 = new S3Client({ region: 'us-west-2' });
    const data = await s3.send(new ListBucketsCommand());

    const buckets = data.Buckets.map(bucket => ({
      name: bucket.Name,
      creation_date: bucket.CreationDate.toISOString()
    }));

    segment.close();
    res.json(buckets);
  } catch (err) {
    segment.addError(err);
    segment.close();
    res.status(500).send(`Unable to list buckets: ${err.message}`);
  }

  subsegment.close();
});

// End the X-Ray segment for the request
app.use(XRayExpress.closeSegment());

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
