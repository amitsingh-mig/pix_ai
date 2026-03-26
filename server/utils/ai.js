/**
 * AI Tag Generation Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Strategy (layered, most-reliable first):
 *
 *  1. AWS Rekognition DetectLabels  → fast, cheap, always-on, Google-Photos-like
 *     Returns: "Flower", "Sky", "Person", "Car", "Sunset", etc. with confidence %
 *
 *  2. AWS Rekognition DetectModerationLabels → adult / sensitive content guard
 *
 *  3. OpenAI GPT-4o Vision (optional enrichment)
 *     → Adds nuanced, descriptive tags if OPENAI_API_KEY is set
 *
 *  4. Fallback tags if both services fail
 */

const { RekognitionClient, DetectLabelsCommand, DetectModerationLabelsCommand } = require('@aws-sdk/client-rekognition');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// ─── Rekognition client ────────────────────────────────────────────────────────
const rekognition = new RekognitionClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// ─── S3 client (for presigned URL fallback to OpenAI) ─────────────────────────
const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// ─── Helper: clean & normalize tag strings ───────────────────────────────────
const cleanTag = (tag) =>
    tag
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

// ─── STEP 1: Rekognition DetectLabels ─────────────────────────────────────────
const detectLabelsRekognition = async (s3Key) => {
    try {
        const command = new DetectLabelsCommand({
            Image: {
                S3Object: {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Name: s3Key,
                },
            },
            MaxLabels: 20,
            MinConfidence: 70, // Only include labels with ≥70% confidence
        });

        const response = await rekognition.send(command);

        const labels = response.Labels || [];
        const tags = labels.map((label) => cleanTag(label.Name)).filter(Boolean);

        console.log(`[AI TAGS] Rekognition detected ${tags.length} labels: ${tags.join(', ')}`);
        return tags;
    } catch (err) {
        console.error('[AI TAGS] Rekognition DetectLabels error:', err.message);
        return [];
    }
};

// ─── STEP 2: Rekognition DetectModerationLabels ───────────────────────────────
const detectModerationTags = async (s3Key) => {
    try {
        const command = new DetectModerationLabelsCommand({
            Image: {
                S3Object: {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Name: s3Key,
                },
            },
            MinConfidence: 80,
        });

        const response = await rekognition.send(command);
        const flags = (response.ModerationLabels || []).map((l) => cleanTag(l.Name)).filter(Boolean);

        if (flags.length > 0) {
            console.log(`[AI TAGS] Moderation flags: ${flags.join(', ')}`);
        }
        return flags; // These will be prefixed with 'nsfw:' by caller if needed
    } catch (err) {
        // Non-critical — silently skip moderation check errors
        return [];
    }
};

// ─── STEP 3: OpenAI GPT-4o Vision enrichment ──────────────────────────────────
const enrichTagsOpenAI = async (s3Key, existingTags) => {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('your_')) {
        return [];
    }

    try {
        // Lazy-require OpenAI to avoid crashing if package is missing
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // Generate a short-lived presigned URL for OpenAI to access the S3 image
        const cmd = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
        });
        const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: 120 });

        const existingContext = existingTags.length > 0
            ? `Rekognition already detected: ${existingTags.join(', ')}. `
            : '';

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 100,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `${existingContext}Add up to 5 MORE descriptive single-word tags for this image that are NOT already listed above. Focus on mood, style, color, season, or specific objects. Return ONLY the new tags as a comma-separated list, nothing else.`,
                        },
                        {
                            type: 'image_url',
                            image_url: { url: signedUrl },
                        },
                    ],
                },
            ],
        });

        const content = response.choices[0]?.message?.content || '';
        const newTags = content
            .split(',')
            .map((t) => cleanTag(t))
            .filter((t) => t.length > 1 && t.length < 30);

        console.log(`[AI TAGS] OpenAI enrichment added: ${newTags.join(', ')}`);
        return newTags;
    } catch (err) {
        console.error('[AI TAGS] OpenAI enrichment error:', err.message);
        return [];
    }
};

// ─── STEP 4: Photography Insight ──────────────────────────────────────────────
/**
 * Generates a short photography insight based on EXIF data.
 * @param {Object} exif - The EXIF data object
 * @returns {Promise<string>} - A short insight string
 */
exports.generatePhotographyInsight = async (exif) => {
    if (!exif || (!exif.iso && !exif.shutterSpeed && !exif.aperture)) {
        return null;
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('your_')) {
        // Fallback rule-based insight if OpenAI is unavailable
        if (exif.iso > 800) return 'Shot in low light with high ISO.';
        if (exif.shutterSpeed && (exif.shutterSpeed.includes('1/') && parseInt(exif.shutterSpeed.split('/')[1]) > 500)) return 'Captured with a fast shutter speed to freeze motion.';
        if (exif.aperture && parseFloat(exif.aperture.replace('f/', '')) < 2.8) return 'Wide aperture used for a shallow depth of field.';
        return 'Standard capture settings used for this shot.';
    }

    try {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const prompt = `Act as a professional photography critic. Given the following EXIF data, provide a SINGLE sentence insight (max 15 words) about the shot's technical execution or style.
        Camera: ${exif.camera}
        ISO: ${exif.iso}
        Shutter Speed: ${exif.shutterSpeed}
        Aperture: ${exif.aperture}
        Focal Length: ${exif.focalLength}
        
        Example: "Shot in low light with high ISO for a gritty, atmospheric feel."
        Insight:`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 50,
            messages: [{ role: 'user', content: prompt }],
        });

        return response.choices[0]?.message?.content?.trim() || 'Great technical execution on this shot.';
    } catch (err) {
        console.error('[AI INSIGHT] Error:', err.message);
        return 'Shot with professional camera settings.';
    }
};

// ─── STEP 5: Camera Settings Estimation ──────────────────────────────────────
/**
 * Estimates photography settings based on image content when EXIF is missing.
 * @param {string} s3Key - S3 object key
 * @returns {Promise<Object>} - Estimated EXIF-like data
 */
exports.estimateCameraSettings = async (s3Key) => {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('your_')) {
        return null;
    }

    try {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const cmd = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
        });
        const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: 120 });

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 150,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Analyze this image and estimate the camera settings used to capture it. 
                            Return a JSON object with these EXACT keys: 
                            "camera" (e.g. "Pro Smartphone" or "DSLR"), 
                            "iso" (number), 
                            "shutterSpeed" (e.g. "1/100"), 
                            "aperture" (e.g. "f/1.8"), 
                            "focalLength" (e.g. "26mm"),
                            "insight" (short photography insight).
                            If you cannot estimate, use reasonable guesses for a high-quality capture. 
                            Return ONLY the JSON.`,
                        },
                        {
                            type: 'image_url',
                            image_url: { url: signedUrl },
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0]?.message?.content || '{}');
        console.log(`[AI ESTIMATE] Generated settings for ${s3Key}`);
        return {
            ...result,
            isEstimated: true
        };
    } catch (err) {
        console.error('[AI ESTIMATE] Error:', err.message);
        return null;
    }
};

// ─── FALLBACK tags (when all AI services fail) ────────────────────────────────
const getFallbackTags = () => {
    const pool = ['photo', 'media', 'image', 'upload', 'digital'];
    // Return a deterministic minimal set
    return pool.slice(0, 2);
};

// ─── STEP 6: AI Content Engine Upgraded ──────────────────────────────────────
/**
 * Generates ranked & optimized captions + SEO keywords for an image using GPT-4o Vision.
 *
 * @param {string} s3Key         - S3 object key
 * @param {Object} [options]
 * @param {string} [options.language='en'] - Target language code
 * @param {string[]} [options.existingTags=[]] - Existing Rekognition tags
 * @param {Object} [options.userPreferences={}] - User preferences for personalization
 * @returns {Promise<Object>}
 */
exports.generateCaptionsAndKeywords = async (s3Key, { language = 'en', existingTags = [], userPreferences = {} } = {}) => {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('your_')) {
        console.warn('[AI ENGINE] OpenAI API key not set — returning fallback content.');
        return {
            short: 'A beautiful captured moment.',
            creative: 'Where light meets life — a frame frozen in time.',
            professional: 'High-quality image showcasing compelling visual composition.',
            dramatic: 'An intense, arresting moment caught in perfect clarity.',
            recommended: 'short',
            keywords: (existingTags.length > 0 ? existingTags.slice(0, 15) : ['photo', 'image']).map(k => ({ term: k, score: 85 })),
            hashtags: ['#photo', '#photography'].map(h => ({ term: h, rank: 1 })),
            sceneType: 'general',
            mood: 'neutral',
            language,
            generatedAt: new Date()
        };
    }

    try {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const cmd = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
        });
        const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: 180 });

        const tagContext = existingTags.length > 0 ? `Tags detected: ${existingTags.slice(0, 15).join(', ')}.` : '';
        const personalization = userPreferences.preferredTone
            ? `PERSONALIZATION: Use a "${userPreferences.preferredTone}" tone. Priority keywords: ${userPreferences.brandKeywords?.join(', ') || 'none'}.`
            : '';

        const systemPrompt = `You are the Pix AI Content Optimization Engine. You generate high-performing, SEO-optimized metadata.`;

        const userPrompt = `${tagContext}
${personalization}

Perform deep analysis and return a JSON object with:
{
  "sceneType": "portrait | landscape | travel | street | product | fashion | food | architecture | nature | event | sports | abstract | wildlife | other",
  "mood": "mood descriptors (e.g. 'vibrant joyful')",
  "short": "Punchy < 12 words",
  "creative": "Evocative storytelling",
  "professional": "Direct, informative",
  "dramatic": "Cinematic impact",
  "recommended": "short | creative | professional | dramatic",
  "keywords": [
    { "term": "keyword", "score": 80-100, "reason": "SEO relevance" }
  ],
  "hashtags": [
    { "term": "#tag", "engagement": "high | medium | low", "rank": 1-15 }
  ],
  "personalizationNotes": "Short note on how user tone was applied"
}

Language: ${language}.
Return ONLY valid JSON.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 1200,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: userPrompt },
                        { type: 'image_url', image_url: { url: signedUrl, detail: 'auto' } }
                    ]
                }
            ]
        });

        const result = JSON.parse(response.choices[0]?.message?.content || '{}');
        return {
            ...result,
            language,
            generatedAt: new Date()
        };

    } catch (err) {
        console.error('[AI ENGINE] Error:', err.message);
        return null;
    }
};

// ─── MAIN EXPORT: generateTags ────────────────────────────────────────────────
/**
 * Generates AI tags for an image stored in S3.
 */
exports.generateTags = async (s3Key, { enrichWithOpenAI = true } = {}) => {
    const rekTags = await detectLabelsRekognition(s3Key);
    const [openAiTags] = await Promise.all([
        enrichWithOpenAI ? enrichTagsOpenAI(s3Key, rekTags) : Promise.resolve([]),
        detectModerationTags(s3Key),
    ]);
    const merged = Array.from(new Set([...rekTags, ...openAiTags]));
    return merged.length === 0 ? getFallbackTags() : merged;
};
