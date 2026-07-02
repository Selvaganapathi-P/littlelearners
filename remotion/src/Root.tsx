import React from 'react';
import { Composition } from 'remotion';
import { LessonVideo, LessonVideoProps } from './compositions/LessonVideo';
import { calculateDuration } from './utils/splitScript';

const DEFAULT_PROPS: LessonVideoProps = {
  title: 'The ABC Song',
  grade: 'LKG',
  videoFormat: 'sing_along',
  scriptText: 'A is for Apple, round and red! B is for Ball, rolling ahead! C is for Cat, soft and sweet! D is for Dog, with four quick feet! E is for Elephant, big and gray! F is for Fish, swimming all day!',
  tags: ['alphabets', 'phonics'],
  audioUrl: null,
};

export function RemotionRoot() {
  return (
    <Composition
      id="LessonVideo"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={LessonVideo as any}
      fps={30}
      width={1280}
      height={720}
      durationInFrames={calculateDuration(DEFAULT_PROPS.scriptText, DEFAULT_PROPS.videoFormat, 30)}
      defaultProps={DEFAULT_PROPS}
      calculateMetadata={async ({ props }) => {
        const p = props as unknown as LessonVideoProps;
        return {
          durationInFrames: calculateDuration(
            p.scriptText || DEFAULT_PROPS.scriptText,
            p.videoFormat || DEFAULT_PROPS.videoFormat,
            30
          ),
        };
      }}
    />
  );
}
