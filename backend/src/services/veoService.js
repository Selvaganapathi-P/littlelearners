const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const VIDEOS_DIR = path.join(__dirname, '../../uploads/videos');

const FORMAT_PROMPTS = {
  phonics_song:      (l) => `Bright 2D cartoon animation for preschool children about the letter and sound in "${l.title}". Giant colorful bouncing letters, cheerful cartoon animals celebrating. Rainbow colors, no text overlays, joyful and educational.`,
  sing_along:        (l) => `Fun animated sing-along for kindergarten children about "${l.title}". Cute cartoon characters dancing and clapping with musical notes floating around them. Vibrant primary colors, cheerful atmosphere.`,
  number_song:       (l) => `Educational counting animation for preschool children about "${l.title}". Cartoon numbers with smiling faces, colorful objects appearing one by one in a magical world. Bright and engaging for ages 4-6.`,
  moral_story:       (l) => `Gentle animated story scene for kindergarten children teaching "${l.title}". Cute cartoon animal friends in a colorful meadow. Warm pastel colors, heartwarming and kind atmosphere.`,
  bedtime_story:     (l) => `Calm soothing bedtime animation for preschool children about "${l.title}". Sleepy cartoon animals under a soft starry night sky with a glowing moon. Gentle purples and blues, peaceful and dreamy.`,
  action_dance:      (l) => `Energetic action dance animation for preschool children themed around "${l.title}". Cartoon children jumping, clapping, and spinning with big smiles. Bright bold colors, playful and active.`,
  yoga_stretch:      (l) => `Calm yoga animation for preschool children demonstrating "${l.title}". A cute cartoon child peacefully stretching in a sunlit garden with butterflies. Soft greens and yellows, gentle and relaxing.`,
  good_habits:       (l) => `Educational animation for preschool children about the good habit "${l.title}". Cheerful cartoon child doing the habit correctly with a proud smile and stars appearing. Bright cheerful colors.`,
  festival_special:  (l) => `Colorful festive celebration animation for children about "${l.title}". Cartoon characters celebrating with decorations, lights, and confetti. Rich vibrant festive colors, joyful atmosphere.`,
  point_and_learn:   (l) => `Interactive point-and-learn animation for preschool children about "${l.title}". Cute labeled cartoon objects floating in a colorful world with sparkle effects. Clear, simple visuals.`,
  emotion_song:      (l) => `Expressive animated emotion song for preschool children about "${l.title}". Cute cartoon faces showing different feelings with bouncing music notes. Bright expressive colors, friendly and warm.`,
  original_song:     (l) => `Original brand animated song video for preschool children about "${l.title}". Cute mascot characters singing in a colorful magical world with stars and rainbows. Vibrant and memorable.`,
  recap_song:        (l) => `Cheerful animated recap video for preschool children reviewing "${l.title}". Cute cartoon characters celebrating what they learned together. Bright colors, celebratory upbeat finish.`,
  celebration_video: (l) => `Celebratory animated video for children about "${l.title}". Cartoon characters dancing with confetti, stars, and fireworks. Rainbow colors, huge smiles, festive and joyful.`,
};

function buildPrompt(lesson) {
  const builder = FORMAT_PROMPTS[lesson.videoFormat];
  const base = builder
    ? builder(lesson)
    : `Colorful educational 2D cartoon animation for preschool children (ages 4-6) about "${lesson.title}". Bright simple shapes, child-friendly style, no text overlays.`;

  const tags = lesson.tags?.length ? ` Theme tags: ${lesson.tags.join(', ')}.` : '';
  return `${base}${tags} Grade: ${lesson.grade}. Style: 2D colorful cartoon, child-safe, suitable for ages 4-6.`;
}

async function generateVideoWithVeo(lesson) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not set in environment variables');

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.VEO_MODEL || 'veo-2.0-generate-001';
  const prompt = buildPrompt(lesson);

  console.log(`[Veo] Starting generation for "${lesson.title}" — model: ${model}`);

  let operation = await ai.models.generateVideos({
    model,
    prompt,
    config: { aspectRatio: '16:9', durationSeconds: 8 },
  });

  // Poll until done — Veo typically takes 2-4 minutes
  let attempts = 0;
  const MAX_ATTEMPTS = 42; // 7 minutes max
  while (!operation.done) {
    await new Promise(r => setTimeout(r, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
    attempts++;
    if (attempts % 3 === 0) {
      console.log(`[Veo] Still generating "${lesson.title}"... (${attempts * 10}s elapsed)`);
    }
    if (attempts >= MAX_ATTEMPTS) {
      throw new Error(`[Veo] Generation timed out after ${MAX_ATTEMPTS * 10}s for "${lesson.title}"`);
    }
  }

  const videos = operation.response?.generatedVideos;
  if (!videos?.length) throw new Error('[Veo] No video returned in response');

  const videoFile = videos[0].video;
  const videoPath = path.join(VIDEOS_DIR, `lesson-${lesson._id}.mp4`);

  console.log(`[Veo] Downloading video for "${lesson.title}"...`);
  await ai.files.download({ file: videoFile, downloadPath: videoPath });
  console.log(`[Veo] Video saved: ${videoPath}`);

  return videoPath;
}

module.exports = { generateVideoWithVeo };
