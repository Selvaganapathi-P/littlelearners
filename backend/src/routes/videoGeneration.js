const router = require('express').Router();
const Lesson = require('../models/Lesson');
const { protect, staffOrAbove } = require('../middleware/auth');

const FORMAT_TEMPLATES = {
  sing_along: { sceneDuration: 4, musicStyle: 'upbeat-playful', pacing: 'fast', textHighlight: true },
  phonics_song: { sceneDuration: 5, musicStyle: 'simple-repeat', pacing: 'medium', textHighlight: true },
  number_song: { sceneDuration: 4, musicStyle: 'counting-beat', pacing: 'medium', textHighlight: false },
  moral_story: { sceneDuration: 8, musicStyle: 'gentle-narrative', pacing: 'slow', textHighlight: false },
  bedtime_story: { sceneDuration: 10, musicStyle: 'soft-calm', pacing: 'very-slow', textHighlight: false },
  action_dance: { sceneDuration: 3, musicStyle: 'energetic', pacing: 'fast', textHighlight: false },
  yoga_stretch: { sceneDuration: 8, musicStyle: 'calm-ambient', pacing: 'very-slow', textHighlight: false },
  good_habits: { sceneDuration: 6, musicStyle: 'cheerful', pacing: 'medium', textHighlight: false },
  festival_special: { sceneDuration: 5, musicStyle: 'festive', pacing: 'medium', textHighlight: true },
  point_and_learn: { sceneDuration: 5, musicStyle: 'curious-playful', pacing: 'medium', textHighlight: true },
  emotion_song: { sceneDuration: 5, musicStyle: 'expressive', pacing: 'medium', textHighlight: false },
  original_song: { sceneDuration: 4, musicStyle: 'original-brand', pacing: 'medium', textHighlight: true },
  recap_song: { sceneDuration: 4, musicStyle: 'upbeat-summary', pacing: 'fast', textHighlight: true },
  celebration_video: { sceneDuration: 3, musicStyle: 'celebratory', pacing: 'fast', textHighlight: false },
  themed_compilation: { sceneDuration: 0, musicStyle: 'playlist', pacing: 'auto', textHighlight: false },
};

// Trigger video generation pipeline for a lesson
router.post('/generate/:lessonId', protect, staffOrAbove, async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    if (!lesson.scriptText) return res.status(400).json({ success: false, message: 'Script text required before generating video' });

    const template = FORMAT_TEMPLATES[lesson.videoFormat];
    await Lesson.findByIdAndUpdate(req.params.lessonId, { status: 'generating' });

    // Pipeline payload — consumed by Remotion render service
    const payload = {
      lessonId: lesson._id,
      title: lesson.title,
      grade: lesson.grade,
      videoFormat: lesson.videoFormat,
      scriptText: lesson.scriptText,
      template,
      tags: lesson.tags,
    };

    // In production: dispatch to Remotion Lambda / render queue
    // For now: return the payload so the render service can be called externally
    res.json({
      success: true,
      message: 'Video generation queued',
      payload,
      status: 'generating',
    });
  } catch (err) { next(err); }
});

// Webhook: Remotion/render service calls this when video is ready
router.post('/webhook/complete', async (req, res, next) => {
  try {
    const { lessonId, videoUrl, thumbnailUrl, durationSeconds } = req.body;
    if (!lessonId || !videoUrl) return res.status(400).json({ success: false, message: 'lessonId and videoUrl required' });

    const lesson = await Lesson.findByIdAndUpdate(
      lessonId,
      { videoUrl, thumbnailUrl, durationSeconds, status: 'ready' },
      { new: true }
    );
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    res.json({ success: true, data: lesson });
  } catch (err) { next(err); }
});

router.get('/formats/templates', (req, res) => {
  res.json({ success: true, data: FORMAT_TEMPLATES });
});

module.exports = router;
