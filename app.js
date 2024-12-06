const AWSXRay = require('aws-xray-sdk-core');
const XRayExpress = require('aws-xray-sdk-express');
const express = require('express');
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

// Capture outgoing requests from S3 client
const s3Client = AWSXRay.captureAWSv3Client(new S3Client({ region: 'us-west-2' }));

// Wrap the Express app with X-Ray middleware
const app = express();
app.use(XRayExpress.openSegment('MyApp'));

app.get('/aws-sdk-call', async (req, res) => {
  try {
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

// End the X-Ray segment for the request
app.use(XRayExpress.closeSegment());

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
