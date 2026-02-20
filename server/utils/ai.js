const OpenAI = require('openai');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { isAWSConfigured } = require('./s3');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

exports.generateTags = async (mediaKey) => {
    // If not using S3, we can't easily give OpenAI a URL to the image
    // So we use fallback tags
    if (!isAWSConfigured) {
        return getFallbackTags();
    }

    try {
        const s3 = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });

        // Generate a presigned URL for the S3 object so OpenAI can access it
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: mediaKey,
        });

        // URL expires in 60 seconds
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Generate 5 simple, single-word tags for this image. Return only the tags separated by commas, no other text." },
                        {
                            type: "image_url",
                            image_url: {
                                "url": signedUrl,
                            },
                        },
                    ],
                },
            ],
        });

        const content = response.choices[0].message.content;
        // Split by comma and clean up whitespace
        const tags = content.split(',').map(tag => tag.trim().toLowerCase());
        return tags;

    } catch (err) {
        console.error("OpenAI Error (Using fallback tags):", err);
        return getFallbackTags();
    }
};

const getFallbackTags = () => {
    const mockTags = ['nature', 'lifestyle', 'media', 'creative', 'modern', 'digital', 'abstract'];
    const randomTags = [];
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * mockTags.length);
        if (!randomTags.includes(mockTags[randomIndex])) {
            randomTags.push(mockTags[randomIndex]);
        }
    }
    return randomTags;
};

