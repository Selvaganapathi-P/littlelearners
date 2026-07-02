const path = require('path');
const fs = require('fs');

const REMOTION_ENTRY = path.join(__dirname, '../../../remotion/src/index.ts');
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');
const THUMBS_DIR = path.join(UPLOADS_DIR, 'thumbs');

// Ensure upload directories exist on first load
[UPLOADS_DIR, VIDEOS_DIR, THUMBS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Module-level singletons — bundle once, reuse browser across renders
let _bundleLocation = null;
let _browser = null;

async function getBundleLocation() {
  if (_bundleLocation) return _bundleLocation;
  const { bundle } = require('@remotion/bundler');
  console.log('[Remotion] Bundling compositions (first render — may take ~60s)…');
  _bundleLocation = await bundle({ entryPoint: REMOTION_ENTRY });
  console.log('[Remotion] Bundle ready');
  return _bundleLocation;
}

async function getBrowser() {
  if (_browser) return _browser;
  const { openBrowser } = require('@remotion/renderer');

  // Honour env var set by nixpacks (Railway) or fall back to letting Remotion find Chrome
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

  _browser = await openBrowser('chrome', {
    ...(executablePath ? { browserExecutable: executablePath } : {}),
    chromiumOptions: { disableWebSecurity: true },
  });
  return _browser;
}

function getBackendUrl() {
  return (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
}

// ── Cloudinary path (optional upgrade) ─────────────────────────────────────
async function uploadToCloudinary(videoPath, thumbPath, lessonId) {
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const [videoResult, thumbResult] = await Promise.all([
    cloudinary.uploader.upload(videoPath, {
      resource_type: 'video',
      folder: 'littlelearners/lessons',
      public_id: `lesson-${lessonId}`,
      overwrite: true,
    }),
    cloudinary.uploader.upload(thumbPath, {
      resource_type: 'image',
      folder: 'littlelearners/thumbs',
      public_id: `thumb-${lessonId}`,
      overwrite: true,
    }),
  ]);

  return {
    videoUrl: videoResult.secure_url,
    thumbnailUrl: thumbResult.secure_url,
  };
}

// ── Main render function ────────────────────────────────────────────────────
async function renderLessonVideo(lesson) {
  const { renderMedia, renderStill, getCompositions } = require('@remotion/renderer');
  const { generateAudio, cleanupAudio } = require('./ttsService');

  const scriptText = lesson.scriptText ||
    `Welcome to ${lesson.title}! This is a ${lesson.grade} LittleLearners video.`;

  // Generate TTS audio first (non-blocking — if ElevenLabs not configured, returns null)
  let audioResult = null;
  try {
    audioResult = await generateAudio(scriptText, lesson._id);
  } catch (err) {
    console.error('[TTS] Audio generation failed — rendering silent video:', err.message);
  }

  const inputProps = {
    title: lesson.title,
    grade: lesson.grade,
    videoFormat: lesson.videoFormat,
    scriptText,
    tags: lesson.tags || [],
    audioUrl: audioResult?.audioUrl ?? null,
  };

  // 1. Bundle (cached after first render)
  const serveUrl = await getBundleLocation();

  // 2. Resolve composition (calculates dynamic duration from scriptText)
  const puppeteerInstance = await getBrowser();
  const compositions = await getCompositions(serveUrl, { puppeteerInstance, inputProps });
  const comp = compositions.find(c => c.id === 'LessonVideo');
  if (!comp) throw new Error('LessonVideo composition not found in bundle');

  const videoPath = path.join(VIDEOS_DIR, `lesson-${lesson._id}.mp4`);
  const thumbPath = path.join(THUMBS_DIR, `thumb-${lesson._id}.jpg`);

  // 3. Render MP4
  console.log(`[Remotion] Rendering "${lesson.title}" — ${comp.durationInFrames} frames`);
  await renderMedia({
    composition: comp,
    serveUrl,
    codec: 'h264',
    outputLocation: videoPath,
    inputProps,
    puppeteerInstance,
    concurrency: 2,
    onProgress: ({ progress }) => {
      const pct = Math.round(progress * 100);
      if (pct % 25 === 0) console.log(`[Remotion] ${lesson._id} → ${pct}%`);
    },
  });

  // 4. Render thumbnail (JPEG) from the first content slide (frame 95)
  const thumbFrame = Math.min(95, comp.durationInFrames - 1);
  await renderStill({
    composition: comp,
    serveUrl,
    output: thumbPath,
    inputProps,
    puppeteerInstance,
    frame: thumbFrame,
    imageFormat: 'jpeg',
    jpegQuality: 85,
  });

  console.log(`[Remotion] Render complete for "${lesson.title}"`);

  // Audio was embedded into the MP4 — no longer needed on disk
  if (audioResult?.audioPath) cleanupAudio(lesson._id);

  const durationSeconds = Math.round(comp.durationInFrames / 30);

  // 5a. If Cloudinary is configured → upload and use CDN URLs
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    try {
      const { videoUrl, thumbnailUrl } = await uploadToCloudinary(videoPath, thumbPath, lesson._id);
      fs.unlinkSync(videoPath);
      fs.unlinkSync(thumbPath);
      console.log(`[Remotion] Uploaded to Cloudinary: ${videoUrl}`);
      return { videoUrl, thumbnailUrl, durationSeconds };
    } catch (err) {
      console.error('[Remotion] Cloudinary upload failed — falling back to local:', err.message);
    }
  }

  // 5b. Fallback → serve files locally via Express static
  const base = getBackendUrl();
  return {
    videoUrl: `${base}/uploads/videos/lesson-${lesson._id}.mp4`,
    thumbnailUrl: `${base}/uploads/thumbs/thumb-${lesson._id}.jpg`,
    durationSeconds,
  };
}

// ── Warm-up: pre-bundle + pre-open browser on server start ─────────────────
function warmUp() {
  setTimeout(async () => {
    try {
      await getBundleLocation();
      await getBrowser();
      console.log('[Remotion] Warm-up complete — ready to render');
    } catch (err) {
      console.error('[Remotion] Warm-up failed (non-fatal):', err.message);
    }
  }, 5000);
}

module.exports = { renderLessonVideo, warmUp };
