const SCENE_DURATIONS: Record<string, number> = {
  sing_along: 4,
  phonics_song: 5,
  number_song: 4,
  moral_story: 8,
  bedtime_story: 10,
  action_dance: 3,
  yoga_stretch: 8,
  good_habits: 6,
  festival_special: 5,
  point_and_learn: 5,
  emotion_song: 5,
  original_song: 4,
  recap_song: 4,
  celebration_video: 3,
  themed_compilation: 4,
};

export function splitScript(text: string, wordsPerSlide = 15): string[] {
  if (!text?.trim()) return ['Welcome to LittleLearners!'];
  const sentences = text.split(/(?<=[.!?।])\s+/).map(s => s.trim()).filter(Boolean);
  if (sentences.length === 0) return [text.trim()];

  const slides: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.split(/\s+/).length > wordsPerSlide && current) {
      slides.push(current.trim());
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) slides.push(current.trim());
  return slides.length > 0 ? slides : [text.trim()];
}

export const INTRO_FRAMES = 90;  // 3s at 30fps
export const OUTRO_FRAMES = 60;  // 2s at 30fps

export function calculateDuration(scriptText: string, videoFormat: string, fps = 30): number {
  const slides = splitScript(scriptText);
  const secondsPerSlide = SCENE_DURATIONS[videoFormat] ?? 5;
  return INTRO_FRAMES + slides.length * secondsPerSlide * fps + OUTRO_FRAMES;
}
