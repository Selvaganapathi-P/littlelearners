import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from 'remotion';
import { splitScript, calculateDuration, INTRO_FRAMES, OUTRO_FRAMES } from '../utils/splitScript';

export interface LessonVideoProps {
  title: string;
  grade: 'LKG' | 'UKG';
  videoFormat: string;
  scriptText: string;
  tags: string[];
  audioUrl?: string | null;
}

const GRADE_COLORS: Record<string, { primary: string; secondary: string }> = {
  LKG: { primary: '#FF6B9D', secondary: '#FFB347' },
  UKG: { primary: '#7C3AED', secondary: '#06B6D4' },
};

const FORMAT_THEMES: Record<string, { bg1: string; bg2: string; icon: string }> = {
  sing_along:       { bg1: '#FF6B9D', bg2: '#FF8E53', icon: '🎤' },
  phonics_song:     { bg1: '#3B82F6', bg2: '#06B6D4', icon: '🔤' },
  number_song:      { bg1: '#F59E0B', bg2: '#EF4444', icon: '🔢' },
  moral_story:      { bg1: '#7C3AED', bg2: '#A855F7', icon: '📖' },
  bedtime_story:    { bg1: '#0F172A', bg2: '#1E3A5F', icon: '🌙' },
  action_dance:     { bg1: '#EF4444', bg2: '#F97316', icon: '💃' },
  yoga_stretch:     { bg1: '#10B981', bg2: '#06B6D4', icon: '🧘' },
  good_habits:      { bg1: '#EAB308', bg2: '#22C55E', icon: '✨' },
  festival_special: { bg1: '#F59E0B', bg2: '#DC2626', icon: '🎉' },
  point_and_learn:  { bg1: '#06B6D4', bg2: '#3B82F6', icon: '👆' },
  emotion_song:     { bg1: '#EC4899', bg2: '#8B5CF6', icon: '😊' },
  original_song:    { bg1: '#FF6B9D', bg2: '#FB923C', icon: '🎵' },
  recap_song:       { bg1: '#8B5CF6', bg2: '#FF6B9D', icon: '🔁' },
  celebration_video:{ bg1: '#FBBF24', bg2: '#F59E0B', icon: '🏆' },
  themed_compilation:{ bg1: '#6B7280', bg2: '#374151', icon: '📋' },
};

// ── Intro card (3 seconds) ──────────────────────────────────────────────────
function Intro({ title, grade, videoFormat }: Pick<LessonVideoProps, 'title' | 'grade' | 'videoFormat'>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const theme = FORMAT_THEMES[videoFormat] ?? FORMAT_THEMES.sing_along;
  const gradeColor = GRADE_COLORS[grade] ?? GRADE_COLORS.LKG;

  const iconScale = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  const titleOpacity = interpolate(frame, [15, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [15, 40], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const badgeOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const brandOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${theme.bg1} 0%, ${theme.bg2} 100%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

      {/* Format icon */}
      <div style={{ fontSize: 140, lineHeight: 1, transform: `scale(${iconScale})`, marginBottom: 32 }}>
        {theme.icon}
      </div>

      {/* Title */}
      <div style={{
        opacity: titleOpacity,
        transform: `translateY(${titleY}px)`,
        textAlign: 'center',
        padding: '0 80px',
        maxWidth: 960,
      }}>
        <div style={{
          fontSize: 72, fontWeight: 800, color: 'white',
          fontFamily: 'Arial, sans-serif',
          textShadow: '0 4px 24px rgba(0,0,0,0.25)',
          lineHeight: 1.15,
        }}>
          {title}
        </div>
      </div>

      {/* Grade badge */}
      <div style={{
        opacity: badgeOpacity, marginTop: 28,
        background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)',
        borderRadius: 40, padding: '10px 32px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: gradeColor.primary }} />
        <span style={{ color: 'white', fontWeight: 700, fontSize: 28, fontFamily: 'Arial, sans-serif' }}>
          {grade}
        </span>
      </div>

      {/* Brand */}
      <div style={{
        position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
        opacity: brandOpacity, color: 'rgba(255,255,255,0.75)',
        fontSize: 26, fontFamily: 'Arial, sans-serif', fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>
        ⭐ LittleLearners
      </div>
    </AbsoluteFill>
  );
}

// ── Content slide ───────────────────────────────────────────────────────────
function ContentSlide({
  text, index, total, theme,
}: { text: string; index: number; total: number; theme: { bg1: string; bg2: string } }) {
  const frame = useCurrentFrame();

  const slideX = interpolate(frame, [0, 18], [80, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const opacity = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const progress = (index + 1) / total;

  return (
    <AbsoluteFill style={{
      backgroundColor: '#FFFBF5',
      backgroundImage: `radial-gradient(ellipse at top right, ${theme.bg1}18, transparent 60%), radial-gradient(ellipse at bottom left, ${theme.bg2}12, transparent 60%)`,
    }}>
      {/* Progress bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: '#F3F4F6' }}>
        <div style={{ height: '100%', background: `linear-gradient(90deg, ${theme.bg1}, ${theme.bg2})`, width: `${progress * 100}%`, borderRadius: '0 5px 5px 0' }} />
      </div>

      {/* Slide number dots */}
      <div style={{ position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
        {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
          <div key={i} style={{
            width: i === index ? 24 : 8, height: 8, borderRadius: 4,
            background: i === index ? theme.bg1 : '#E5E7EB',
            transition: 'width 0.3s',
          }} />
        ))}
      </div>

      {/* Text content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '80px 120px',
        opacity,
        transform: `translateX(${slideX}px)`,
      }}>
        <p style={{
          fontSize: 58,
          lineHeight: 1.55,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 700,
          color: '#1F2937',
          textAlign: 'center',
          margin: 0,
        }}>
          {text}
        </p>
      </div>

      {/* Slide counter */}
      <div style={{
        position: 'absolute', bottom: 32, right: 52,
        color: '#9CA3AF', fontSize: 22, fontFamily: 'Arial, sans-serif', fontWeight: 600,
      }}>
        {index + 1} / {total}
      </div>

      {/* Small brand watermark */}
      <div style={{
        position: 'absolute', bottom: 32, left: 52,
        color: '#D1D5DB', fontSize: 20, fontFamily: 'Arial, sans-serif',
      }}>
        LittleLearners
      </div>
    </AbsoluteFill>
  );
}

// ── Outro card (2 seconds) ──────────────────────────────────────────────────
function Outro({ grade }: Pick<LessonVideoProps, 'grade'>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const gradeColor = GRADE_COLORS[grade] ?? GRADE_COLORS.LKG;
  const bgOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const starScale = spring({ frame, fps, config: { damping: 10, stiffness: 180 } });
  const textOpacity = interpolate(frame, [20, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const textY = interpolate(frame, [20, 45], [24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${gradeColor.primary} 0%, ${gradeColor.secondary} 100%)`,
      opacity: bgOpacity,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ fontSize: 120, transform: `scale(${starScale})`, lineHeight: 1 }}>🌟</div>
      <div style={{ opacity: textOpacity, transform: `translateY(${textY}px)`, textAlign: 'center', marginTop: 32 }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: 'white', fontFamily: 'Arial, sans-serif', textShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          Great job!
        </div>
        <div style={{ fontSize: 34, color: 'rgba(255,255,255,0.85)', fontFamily: 'Arial, sans-serif', marginTop: 16, fontWeight: 600 }}>
          See you next time on LittleLearners ⭐
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Main composition ────────────────────────────────────────────────────────
export function LessonVideo({ title, grade, videoFormat, scriptText, tags, audioUrl }: LessonVideoProps) {
  const { fps } = useVideoConfig();

  const theme = FORMAT_THEMES[videoFormat] ?? FORMAT_THEMES.sing_along;
  const slides = splitScript(scriptText);
  const totalDuration = calculateDuration(scriptText, videoFormat, fps);
  const contentFrames = totalDuration - INTRO_FRAMES - OUTRO_FRAMES;
  const framesPerSlide = slides.length > 0
    ? Math.round(contentFrames / slides.length)
    : Math.round(5 * fps);

  return (
    <AbsoluteFill>
      {/* TTS narration audio — embedded into the rendered MP4 by Remotion */}
      {audioUrl && (
        <Audio src={audioUrl} startFrom={0} />
      )}

      {/* Intro */}
      <Sequence from={0} durationInFrames={INTRO_FRAMES}>
        <Intro title={title} grade={grade} videoFormat={videoFormat} />
      </Sequence>

      {/* Content slides */}
      {slides.map((text, i) => (
        <Sequence key={i} from={INTRO_FRAMES + i * framesPerSlide} durationInFrames={framesPerSlide}>
          <ContentSlide text={text} index={i} total={slides.length} theme={theme} />
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence from={INTRO_FRAMES + slides.length * framesPerSlide} durationInFrames={OUTRO_FRAMES}>
        <Outro grade={grade} />
      </Sequence>
    </AbsoluteFill>
  );
}
