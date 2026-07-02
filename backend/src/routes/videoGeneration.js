const router = require('express').Router();
const Lesson = require('../models/Lesson');
const { protect, staffOrAbove } = require('../middleware/auth');

const FORMAT_TEMPLATES = {
  sing_along:       { sceneDuration: 4,  musicStyle: 'upbeat-playful',   pacing: 'fast',      textHighlight: true  },
  phonics_song:     { sceneDuration: 5,  musicStyle: 'simple-repeat',    pacing: 'medium',    textHighlight: true  },
  number_song:      { sceneDuration: 4,  musicStyle: 'counting-beat',    pacing: 'medium',    textHighlight: false },
  moral_story:      { sceneDuration: 8,  musicStyle: 'gentle-narrative', pacing: 'slow',      textHighlight: false },
  bedtime_story:    { sceneDuration: 10, musicStyle: 'soft-calm',        pacing: 'very-slow', textHighlight: false },
  action_dance:     { sceneDuration: 3,  musicStyle: 'energetic',        pacing: 'fast',      textHighlight: false },
  yoga_stretch:     { sceneDuration: 8,  musicStyle: 'calm-ambient',     pacing: 'very-slow', textHighlight: false },
  good_habits:      { sceneDuration: 6,  musicStyle: 'cheerful',         pacing: 'medium',    textHighlight: false },
  festival_special: { sceneDuration: 5,  musicStyle: 'festive',          pacing: 'medium',    textHighlight: true  },
  point_and_learn:  { sceneDuration: 5,  musicStyle: 'curious-playful',  pacing: 'medium',    textHighlight: true  },
  emotion_song:     { sceneDuration: 5,  musicStyle: 'expressive',       pacing: 'medium',    textHighlight: false },
  original_song:    { sceneDuration: 4,  musicStyle: 'original-brand',   pacing: 'medium',    textHighlight: true  },
  recap_song:       { sceneDuration: 4,  musicStyle: 'upbeat-summary',   pacing: 'fast',      textHighlight: true  },
  celebration_video:{ sceneDuration: 3,  musicStyle: 'celebratory',      pacing: 'fast',      textHighlight: false },
  themed_compilation:{ sceneDuration: 0, musicStyle: 'playlist',         pacing: 'auto',      textHighlight: false },
};

// POST /video/generate/:lessonId — trigger Remotion render pipeline
router.post('/generate/:lessonId', protect, staffOrAbove, async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    if (!lesson.scriptText) return res.status(400).json({ success: false, message: 'Script text required before generating video' });
    if (lesson.status === 'generating') return res.status(409).json({ success: false, message: 'Already generating' });

    // Mark as generating immediately so the UI updates
    await Lesson.findByIdAndUpdate(lesson._id, { status: 'generating' });
    res.json({ success: true, message: 'Video generation started', status: 'generating' });

    // Run Remotion render in background (non-blocking — response already sent)
    setImmediate(async () => {
      try {
        const { renderLessonVideo } = require('../services/videoRenderer');
        const { videoUrl, thumbnailUrl, durationSeconds } = await renderLessonVideo(lesson);
        await Lesson.findByIdAndUpdate(lesson._id, {
          videoUrl, thumbnailUrl, durationSeconds, status: 'ready',
        });
        console.log(`[Video] Lesson ${lesson._id} ("${lesson.title}") is ready`);
      } catch (err) {
        console.error(`[Video] Render failed for lesson ${lesson._id}:`, err.message);
        // Revert to draft so staff can try again
        await Lesson.findByIdAndUpdate(lesson._id, { status: 'draft' }).catch(() => {});
      }
    });
  } catch (err) { next(err); }
});

// POST /video/webhook/complete — external render service callback
router.post('/webhook/complete', async (req, res, next) => {
  try {
    const { lessonId, videoUrl, thumbnailUrl, durationSeconds } = req.body;
    if (!lessonId || !videoUrl) {
      return res.status(400).json({ success: false, message: 'lessonId and videoUrl required' });
    }
    const lesson = await Lesson.findByIdAndUpdate(
      lessonId,
      { videoUrl, thumbnailUrl, durationSeconds, status: 'ready' },
      { new: true }
    );
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    res.json({ success: true, data: lesson });
  } catch (err) { next(err); }
});

// POST /video/simulate/:lessonId — dev shortcut: skip rendering, mark ready with placeholder
router.post('/simulate/:lessonId', protect, staffOrAbove, async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });

    const PLACEHOLDER_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    const PLACEHOLDER_THUMB = `https://placehold.co/1280x720/FF6B9D/ffffff?text=${encodeURIComponent(lesson.title)}`;
    const updated = await Lesson.findByIdAndUpdate(
      lesson._id,
      { videoUrl: PLACEHOLDER_VIDEO, thumbnailUrl: PLACEHOLDER_THUMB, durationSeconds: 60, status: 'ready' },
      { new: true }
    );
    res.json({ success: true, message: 'Simulation complete — lesson marked ready', data: updated });
  } catch (err) { next(err); }
});

router.get('/formats/templates', (req, res) => {
  res.json({ success: true, data: FORMAT_TEMPLATES });
});

module.exports = router;
