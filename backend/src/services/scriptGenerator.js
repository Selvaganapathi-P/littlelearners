const FORMAT_DESCRIPTIONS = {
  sing_along:        'a fun song with simple, repeating phrases and a catchy rhythm',
  phonics_song:      'a phonics learning song that teaches letter sounds with examples',
  number_song:       'a counting song that teaches numbers with fun actions and repetition',
  moral_story:       'a short moral story with a clear, positive lesson at the end',
  bedtime_story:     'a calm, soothing bedtime story with gentle imagery',
  action_dance:      'an energetic action song with movement instructions (clap, jump, spin)',
  yoga_stretch:      'a gentle yoga routine with calm, clear instructions for each stretch',
  good_habits:       'a cheerful short video teaching one good daily habit',
  festival_special:  'a festive celebration video about the festival or topic',
  point_and_learn:   'a point-and-identify video where children name objects they see',
  emotion_song:      'a warm song exploring feelings and emotions with kind reassurance',
  original_song:     'an original branded song on the topic with a memorable chorus',
  recap_song:        'a quick recap song summarising what children have learned',
  celebration_video: 'a joyful congratulations video celebrating children\'s achievement',
  themed_compilation:'a short themed narration introducing the playlist collection',
};

async function generateScript({ title, grade, videoFormat, subject, tags }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const gradeLabel = grade === 'LKG'
    ? 'Lower Kindergarten (age 3.5–4.5 years)'
    : 'Upper Kindergarten (age 4.5–5.5 years)';

  const formatDesc = FORMAT_DESCRIPTIONS[videoFormat] || videoFormat;
  const tagLine = tags?.length ? `Topic tags: ${tags.join(', ')}` : '';

  const prompt = `You are a children's content writer for LittleLearners, a joyful Indian preschool EdTech platform.

Write a script for this video:
Title: "${title}"
Grade: ${gradeLabel}
Format: ${formatDesc}
${tagLine}

Requirements:
- Use very simple words a preschool child can understand
- Warm, encouraging, and joyful tone throughout
- 80–150 words total — enough for a 1–2 minute video
- Use repetition and rhyme where natural for the format
- India-friendly content (can reference Indian context, names, or settings)
- For songs/sing-along formats: write lyrics with a clear repeating chorus
- For stories: short 3-part structure (setup → event → lesson)
- Output ONLY the spoken script text — no stage directions, no speaker labels, no quotes, no formatting headers`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.85,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

module.exports = { generateScript };
