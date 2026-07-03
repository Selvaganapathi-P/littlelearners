const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');

[UPLOADS_DIR, VIDEOS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function getBackendUrl() {
  return (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
}

async function uploadToCloudinary(videoPath, lessonId) {
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const result = await cloudinary.uploader.upload(videoPath, {
    resource_type: 'video',
    folder: 'littlelearners/lessons',
    public_id: `lesson-${lessonId}`,
    overwrite: true,
  });

  // Cloudinary derives a JPEG thumbnail from frame 2s of the uploaded video
  const thumbnailUrl = result.secure_url
    .replace('/upload/', '/upload/so_2,w_1280,h_720,c_fill/')
    .replace(/\.mp4$/, '.jpg');

  return { videoUrl: result.secure_url, thumbnailUrl };
}

async function renderLessonVideo(lesson) {
  const { generateVideoWithVeo } = require('./veoService');

  const videoPath = await generateVideoWithVeo(lesson);
  const durationSeconds = 8;

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    try {
      const { videoUrl, thumbnailUrl } = await uploadToCloudinary(videoPath, lesson._id);
      fs.unlinkSync(videoPath);
      console.log(`[Video] Uploaded to Cloudinary: ${videoUrl}`);
      return { videoUrl, thumbnailUrl, durationSeconds };
    } catch (err) {
      console.error('[Video] Cloudinary upload failed — serving locally:', err.message);
    }
  }

  const base = getBackendUrl();
  return {
    videoUrl: `${base}/uploads/videos/lesson-${lesson._id}.mp4`,
    thumbnailUrl: `${base}/uploads/thumbs/thumb-${lesson._id}.jpg`,
    durationSeconds,
  };
}

function warmUp() {
  console.log('[Video] Google Veo service ready');
}

module.exports = { renderLessonVideo, warmUp };
