const router = require('express').Router();
const ContentCalendarSuggestion = require('../models/ContentCalendarSuggestion');
const { protect, staffOrAbove } = require('../middleware/auth');

const INDIAN_FESTIVALS = [
  { name: 'Diwali', month: 10, approxDay: 20 },
  { name: 'Dussehra', month: 10, approxDay: 2 },
  { name: 'Christmas', month: 12, day: 25 },
  { name: 'Pongal', month: 1, day: 14 },
  { name: 'Republic Day', month: 1, day: 26 },
  { name: 'Holi', month: 3, approxDay: 25 },
  { name: 'Independence Day', month: 8, day: 15 },
  { name: 'Ganesh Chaturthi', month: 9, approxDay: 7 },
  { name: 'Eid ul-Fitr', month: 4, approxDay: 10 },
  { name: 'Onam', month: 9, approxDay: 5 },
];

const DEFAULT_WEEKLY_MIX = [
  { videoFormat: 'sing_along', count: 2, rationale: 'Core engagement format — always include' },
  { videoFormat: 'moral_story', count: 1, rationale: 'Social-emotional learning anchor' },
  { videoFormat: 'phonics_song', count: 1, rationale: 'Literacy foundation' },
  { videoFormat: 'number_song', count: 1, rationale: 'Numeracy foundation' },
  { videoFormat: 'action_dance', count: 1, rationale: 'Movement & wellbeing' },
];

function getUpcomingFestival(region = 'IN', weeksAhead = 2) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + weeksAhead * 7 * 24 * 60 * 60 * 1000);
  for (const f of INDIAN_FESTIVALS) {
    const festDate = new Date(now.getFullYear(), f.month - 1, f.day || f.approxDay);
    if (festDate >= now && festDate <= cutoff) {
      return { name: f.name, date: festDate, suggestedFormats: ['festival_special', 'sing_along'] };
    }
  }
  return null;
}

router.get('/suggest', protect, staffOrAbove, async (req, res, next) => {
  try {
    const { region = 'IN', weekOf } = req.query;
    const targetWeek = weekOf ? new Date(weekOf) : new Date();
    targetWeek.setHours(0, 0, 0, 0);
    const day = targetWeek.getDay();
    targetWeek.setDate(targetWeek.getDate() - day + (day === 0 ? -6 : 1));

    let suggestion = await ContentCalendarSuggestion.findOne({ weekOf: targetWeek, region });
    if (!suggestion) {
      const upcomingFestival = getUpcomingFestival(region);
      const mix = [...DEFAULT_WEEKLY_MIX];
      if (upcomingFestival) {
        mix.push({ videoFormat: 'festival_special', count: 1, rationale: `${upcomingFestival.name} coming up in 2 weeks` });
      }
      suggestion = await ContentCalendarSuggestion.create({ weekOf: targetWeek, region, suggestedMix: mix, upcomingFestival });
    }
    res.json({ success: true, data: suggestion });
  } catch (err) { next(err); }
});

router.get('/', protect, staffOrAbove, async (req, res, next) => {
  try {
    const { region } = req.query;
    const filter = {};
    if (region) filter.region = region;
    const suggestions = await ContentCalendarSuggestion.find(filter).sort({ weekOf: -1 }).limit(12);
    res.json({ success: true, data: suggestions });
  } catch (err) { next(err); }
});

router.patch('/:id/acknowledge', protect, staffOrAbove, async (req, res, next) => {
  try {
    const s = await ContentCalendarSuggestion.findByIdAndUpdate(req.params.id, { status: 'acknowledged' }, { new: true });
    res.json({ success: true, data: s });
  } catch (err) { next(err); }
});

module.exports = router;
