const { RekognitionClient, DetectLabelsCommand, DetectTextCommand } = require("@aws-sdk/client-rekognition");

const client = new RekognitionClient({
  region: process.env.AWS_REGION
});

const generateTags = async (fileName) => {
  try {
    const command = new DetectLabelsCommand({
      Image: {
        S3Object: {
          Bucket: process.env.AWS_BUCKET_NAME,
          Name: fileName
        }
      },
      MaxLabels: 10,
      MinConfidence: 70
    });

    const response = await client.send(command);

    return response.Labels.map(label => label.Name.toLowerCase());

  } catch (error) {
    console.error("Rekognition Error:", error.message);
    return [];
  }
};

const extractText = async (fileName) => {
  try {
    const command = new DetectTextCommand({
      Image: {
        S3Object: {
          Bucket: process.env.AWS_BUCKET_NAME,
          Name: fileName
        }
      }
    });

    const response = await client.send(command);

    return response.TextDetections
      .filter(text => text.Type === "LINE")
      .map(text => text.DetectedText.toLowerCase());

  } catch (error) {
    console.error("OCR ERROR:", error.message);
    return [];
  }
};

module.exports = { generateTags, extractText };

