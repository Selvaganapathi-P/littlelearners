const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '../../uploads/audio');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

// Warm, clear narration voice — override with ELEVENLABS_VOICE_ID in .env
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel

async function generateAudio(scriptText, lessonId) {
  if (!process.env.ELEVENLABS_API_KEY) return null;

  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const audioPath = path.join(AUDIO_DIR, `lesson-${lessonId}.mp3`);

  console.log(`[TTS] Generating audio for lesson ${lessonId}…`);

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: scriptText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.15,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs API error ${res.status}: ${body}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(audioPath, buffer);
  console.log(`[TTS] Audio saved — ${buffer.length} bytes`);

  // Puppeteer on same machine → always use localhost for rendering
  const port = process.env.PORT || 5000;
  const audioUrl = `http://localhost:${port}/uploads/audio/lesson-${lessonId}.mp3`;

  return { audioUrl, audioPath };
}

function cleanupAudio(lessonId) {
  const audioPath = path.join(AUDIO_DIR, `lesson-${lessonId}.mp3`);
  if (fs.existsSync(audioPath)) {
    fs.unlinkSync(audioPath);
  }
}

module.exports = { generateAudio, cleanupAudio };
