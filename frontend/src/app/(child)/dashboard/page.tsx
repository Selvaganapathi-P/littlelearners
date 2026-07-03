'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import type { Grade, Lesson, Activity, ActivityType } from '@/types';
import { lessonsApi, activitiesApi, childrenApi } from '@/lib/api';
import type { Child } from '@/types';
import { ChildNav } from '@/components/ChildNav';
import { getGradeColor } from '@/lib/utils';
import { FlashcardDeck, QuizGame, MatchingGame, MemoryGame, SpellGame } from '@/components/activities/ActivityPlayer';

// ── Constants ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { type: 'story'     as ActivityType, label: 'Stories',    plural: 'stories',    emoji: '📖', color: '#FF6B9D', bg: '#FFF0F5', desc: 'Animated stories'   },
  { type: 'flashcard' as ActivityType, label: 'Flashcards', plural: 'flashcards', emoji: '🃏', color: '#7C3AED', bg: '#F5F0FF', desc: 'Flip & learn words'  },
  { type: 'quiz'      as ActivityType, label: 'Quizzes',    plural: 'quizzes',    emoji: '❓', color: '#F59E0B', bg: '#FFFBEB', desc: 'Answer questions'    },
  { type: 'matching'  as ActivityType, label: 'Match It',   plural: 'games',      emoji: '🎯', color: '#10B981', bg: '#F0FDF4', desc: 'Match words & pics'  },
  { type: 'memory'    as ActivityType, label: 'Memory',     plural: 'games',      emoji: '🧠', color: '#3B82F6', bg: '#EFF6FF', desc: 'Find the pairs'      },
  { type: 'spell'     as ActivityType, label: 'Spell It',   plural: 'words',      emoji: '✍️', color: '#EC4899', bg: '#FDF2F8', desc: 'Build the word'      },
];

type Feature = typeof FEATURES[0];
type View = 'home' | 'list' | 'play';

// ── Built-in sample activities (shown when DB has no lessons yet) ─────────────

const SAMPLE_ACTIVITIES: Record<string, Activity[]> = {
  story: [
    { _id: 's1', lesson: '', type: 'story', title: 'The Honest Woodcutter', grade: 'LKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { pages: [
      { text: 'Once upon a time, a poor woodcutter worked near a river every day.', emoji: '🌳', bg: '#FFF0F5' },
      { text: 'One day, his axe slipped and fell into the deep river! He sat and cried.', emoji: '😢', bg: '#F5F0FF' },
      { text: 'A kind fairy appeared from the water. She held up a golden axe. "Is this yours?" she asked.', emoji: '🧚', bg: '#FFFBEB' },
      { text: '"No," said the honest woodcutter. "That is not mine." She showed a silver axe. "No," he said again.', emoji: '🙅', bg: '#F0FDF4' },
      { text: 'Then the fairy showed his old iron axe. "Yes! That is mine!" he said happily.', emoji: '🪓', bg: '#EFF6FF' },
      { text: 'The fairy was so pleased with his honesty that she gave him all three axes! Honesty is always the best policy! 🌟', emoji: '🌟', bg: '#FDF2F8' },
    ] } },
    { _id: 's2', lesson: '', type: 'story', title: 'The Thirsty Crow', grade: 'LKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { pages: [
      { text: 'On a hot summer day, a crow was very thirsty. He flew here and there looking for water.', emoji: '🐦', bg: '#FFF9F0' },
      { text: 'At last, he found a pot! But there was only a little water at the bottom.', emoji: '🏺', bg: '#FFF0F5' },
      { text: 'The crow could not reach the water with his beak. He thought and thought.', emoji: '🤔', bg: '#F5F0FF' },
      { text: 'Then he saw some pebbles! He picked them up one by one and dropped them in the pot.', emoji: '🪨', bg: '#FFFBEB' },
      { text: 'The water rose higher and higher with each pebble. Soon he could reach it!', emoji: '💧', bg: '#F0FDF4' },
      { text: 'The clever crow drank the water and flew away happily. Where there is a will, there is a way! ✨', emoji: '🌈', bg: '#EFF6FF' },
    ] } },
    { _id: 's3', lesson: '', type: 'story', title: 'Twinkle Twinkle Little Star', grade: 'LKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { pages: [
      { text: 'Twinkle, twinkle, little star — how I wonder what you are!', emoji: '⭐', bg: '#F5F0FF' },
      { text: 'Up above the world so high, like a diamond in the sky.', emoji: '💎', bg: '#EFF6FF' },
      { text: 'When the blazing sun is gone, when he nothing shines upon...', emoji: '🌙', bg: '#FFF0F5' },
      { text: 'Then you show your little light, twinkling, twinkling through the night.', emoji: '✨', bg: '#FDF2F8' },
      { text: 'Twinkle, twinkle, little star — how I wonder what you are! 🌟', emoji: '🌟', bg: '#FFFBEB' },
    ] } },
    { _id: 's4', lesson: '', type: 'story', title: 'The Lion and the Mouse', grade: 'UKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { pages: [
      { text: 'A mighty lion was sleeping in the jungle when a tiny mouse ran over his face.', emoji: '🦁', bg: '#FFFBEB' },
      { text: 'The lion woke up roaring and caught the mouse in his paw!', emoji: '😤', bg: '#FFF0F5' },
      { text: '"Please let me go! One day I will help you," said the tiny mouse.', emoji: '🐭', bg: '#F0FDF4' },
      { text: 'The lion laughed but let the mouse go. Days later, hunters trapped the lion in a net.', emoji: '😱', bg: '#F5F0FF' },
      { text: 'The mouse heard the lion roar. She ran to the net and gnawed through the ropes!', emoji: '✂️', bg: '#EFF6FF' },
      { text: 'The lion was free! "Thank you, little friend," he said. Even the smallest friend can be a great help! 💛', emoji: '💛', bg: '#FDF2F8' },
    ] } },
    { _id: 's5', lesson: '', type: 'story', title: 'Rain Rain Go Away', grade: 'LKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { pages: [
      { text: 'Rain, rain, go away — come again another day!', emoji: '🌧️', bg: '#EFF6FF' },
      { text: 'Little children want to play — rain, rain, go away!', emoji: '⚽', bg: '#F0FDF4' },
      { text: 'Splish splash, puddles everywhere — children dancing without a care!', emoji: '💦', bg: '#FFF0F5' },
      { text: 'When the sun comes out to shine — everything will be just fine!', emoji: '☀️', bg: '#FFFBEB' },
      { text: 'Rainbow colours fill the sky — blue and green and pink and high! 🌈', emoji: '🌈', bg: '#FDF2F8' },
    ] } },
  ],
  flashcard: [
    { _id: 'f1', lesson: '', type: 'flashcard', title: 'Alphabet Phonics A-E', grade: 'LKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { cards: [
      { front: 'A', back: 'Apple', emoji: '🍎', example: 'A is for Apple — a a apple!' },
      { front: 'B', back: 'Ball', emoji: '⚽', example: 'B is for Ball — b b ball!' },
      { front: 'C', back: 'Cat', emoji: '🐱', example: 'C is for Cat — c c cat!' },
      { front: 'D', back: 'Dog', emoji: '🐶', example: 'D is for Dog — d d dog!' },
      { front: 'E', back: 'Elephant', emoji: '🐘', example: 'E is for Elephant — e e elephant!' },
    ] } },
    { _id: 'f2', lesson: '', type: 'flashcard', title: 'Animals & Sounds', grade: 'LKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { cards: [
      { front: 'Lion', back: 'Roar!', emoji: '🦁', example: 'The lion says ROAR!' },
      { front: 'Duck', back: 'Quack!', emoji: '🦆', example: 'The duck says QUACK!' },
      { front: 'Cow', back: 'Moo!', emoji: '🐄', example: 'The cow says MOO!' },
      { front: 'Dog', back: 'Woof!', emoji: '🐶', example: 'The dog says WOOF!' },
      { front: 'Cat', back: 'Meow!', emoji: '🐱', example: 'The cat says MEOW!' },
    ] } },
    { _id: 'f3', lesson: '', type: 'flashcard', title: 'Count 1 to 10', grade: 'LKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { cards: [
      { front: '1', back: 'One', emoji: '1️⃣', example: 'One little star ⭐' },
      { front: '2', back: 'Two', emoji: '2️⃣', example: 'Two little birds 🐦🐦' },
      { front: '3', back: 'Three', emoji: '3️⃣', example: 'Three little apples 🍎🍎🍎' },
      { front: '4', back: 'Four', emoji: '4️⃣', example: 'Four little fish 🐟🐟🐟🐟' },
      { front: '5', back: 'Five', emoji: '5️⃣', example: 'Five little fingers ✋' },
      { front: '6', back: 'Six', emoji: '6️⃣', example: 'Six little dots 🎲' },
      { front: '7', back: 'Seven', emoji: '7️⃣', example: 'Seven days in a week 📅' },
      { front: '8', back: 'Eight', emoji: '8️⃣', example: 'Eight spider legs 🕷️' },
      { front: '9', back: 'Nine', emoji: '9️⃣', example: 'Nine planets 🪐' },
      { front: '10', back: 'Ten', emoji: '🔟', example: 'Ten fingers and ten toes! 👐' },
    ] } },
  ],
  quiz: [
    { _id: 'q1', lesson: '', type: 'quiz', title: 'Animals Quiz', grade: 'LKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { questions: [
      { question: 'Which animal says "Roar"?', options: ['Cat', 'Lion', 'Duck', 'Fish'], correct: 1, emoji: '🦁', explanation: 'The lion says ROAR! It is the king of the jungle!' },
      { question: 'Which animal has a long trunk?', options: ['Giraffe', 'Horse', 'Elephant', 'Zebra'], correct: 2, emoji: '🐘', explanation: 'The elephant has a long trunk to drink water and pick things up!' },
      { question: 'What does a duck say?', options: ['Moo', 'Woof', 'Quack', 'Meow'], correct: 2, emoji: '🦆', explanation: 'The duck says QUACK QUACK!' },
      { question: 'Which animal can fly?', options: ['Fish', 'Dog', 'Parrot', 'Frog'], correct: 2, emoji: '🦜', explanation: 'The parrot can fly! Birds have wings to fly!' },
      { question: 'What colour is a banana?', options: ['Red', 'Yellow', 'Green', 'Blue'], correct: 1, emoji: '🍌', explanation: 'A ripe banana is YELLOW!' },
    ] } },
    { _id: 'q2', lesson: '', type: 'quiz', title: 'Numbers Quiz', grade: 'LKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { questions: [
      { question: 'How many fingers on one hand?', options: ['3', '4', '5', '6'], correct: 2, emoji: '✋', explanation: 'You have 5 fingers on each hand!' },
      { question: 'What number comes after 4?', options: ['3', '6', '2', '5'], correct: 3, emoji: '🔢', explanation: '1, 2, 3, 4... 5 comes after 4!' },
      { question: 'What number comes before 3?', options: ['4', '2', '5', '1'], correct: 1, emoji: '⬅️', explanation: '2 comes before 3!' },
      { question: 'How many wheels does a bicycle have?', options: ['1', '3', '2', '4'], correct: 2, emoji: '🚲', explanation: 'A bicycle has 2 wheels!' },
      { question: 'Count the stars: ⭐⭐⭐. How many?', options: ['1', '2', '4', '3'], correct: 3, emoji: '⭐', explanation: 'There are 3 stars!' },
    ] } },
    { _id: 'q3', lesson: '', type: 'quiz', title: 'Fruits & Colours', grade: 'UKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { questions: [
      { question: 'What fruit is red and round?', options: ['Banana', 'Mango', 'Apple', 'Grapes'], correct: 2, emoji: '🍎', explanation: 'Apple is red and round!' },
      { question: 'Which fruit is yellow and long?', options: ['Strawberry', 'Banana', 'Orange', 'Grape'], correct: 1, emoji: '🍌', explanation: 'Banana is yellow and long!' },
      { question: 'What colour is the sky?', options: ['Green', 'Red', 'Blue', 'Yellow'], correct: 2, emoji: '🌤️', explanation: 'The sky is blue!' },
      { question: 'What colour is grass?', options: ['Yellow', 'Blue', 'Red', 'Green'], correct: 3, emoji: '🌿', explanation: 'Grass is green!' },
      { question: 'Which animal lives in water?', options: ['Lion', 'Dog', 'Fish', 'Cow'], correct: 2, emoji: '🐟', explanation: 'Fish lives in water!' },
    ] } },
  ],
  matching: [
    { _id: 'm1', lesson: '', type: 'matching', title: 'Animals & Their Homes', grade: 'LKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { pairs: [
      { word: 'Lion',     emoji: '🦁' },
      { word: 'Fish',     emoji: '🐟' },
      { word: 'Bird',     emoji: '🐦' },
      { word: 'Dog',      emoji: '🐶' },
      { word: 'Rabbit',   emoji: '🐰' },
    ] } },
    { _id: 'm2', lesson: '', type: 'matching', title: 'Fruits & Colours', grade: 'LKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { pairs: [
      { word: 'Apple',    emoji: '🍎' },
      { word: 'Banana',   emoji: '🍌' },
      { word: 'Grapes',   emoji: '🍇' },
      { word: 'Mango',    emoji: '🥭' },
      { word: 'Orange',   emoji: '🍊' },
    ] } },
    { _id: 'm3', lesson: '', type: 'matching', title: 'Numbers & Objects', grade: 'UKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { pairs: [
      { word: 'One',      emoji: '1️⃣' },
      { word: 'Two',      emoji: '2️⃣' },
      { word: 'Three',    emoji: '3️⃣' },
      { word: 'Four',     emoji: '4️⃣' },
      { word: 'Five',     emoji: '5️⃣' },
    ] } },
  ],
  memory: [
    { _id: 'me1', lesson: '', type: 'memory', title: 'Animal Memory', grade: 'LKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { memoryCards: [
      { id: 'a0', emoji: '🦁', pairId: '0' }, { id: 'b0', emoji: '🦁', pairId: '0' },
      { id: 'a1', emoji: '🐘', pairId: '1' }, { id: 'b1', emoji: '🐘', pairId: '1' },
      { id: 'a2', emoji: '🦆', pairId: '2' }, { id: 'b2', emoji: '🦆', pairId: '2' },
      { id: 'a3', emoji: '🐬', pairId: '3' }, { id: 'b3', emoji: '🐬', pairId: '3' },
      { id: 'a4', emoji: '🦋', pairId: '4' }, { id: 'b4', emoji: '🦋', pairId: '4' },
      { id: 'a5', emoji: '🐢', pairId: '5' }, { id: 'b5', emoji: '🐢', pairId: '5' },
    ].sort(() => Math.random() - 0.5) } },
    { _id: 'me2', lesson: '', type: 'memory', title: 'Fruit Memory', grade: 'LKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { memoryCards: [
      { id: 'a0', emoji: '🍎', pairId: '0' }, { id: 'b0', emoji: '🍎', pairId: '0' },
      { id: 'a1', emoji: '🍌', pairId: '1' }, { id: 'b1', emoji: '🍌', pairId: '1' },
      { id: 'a2', emoji: '🍇', pairId: '2' }, { id: 'b2', emoji: '🍇', pairId: '2' },
      { id: 'a3', emoji: '🍊', pairId: '3' }, { id: 'b3', emoji: '🍊', pairId: '3' },
      { id: 'a4', emoji: '🥭', pairId: '4' }, { id: 'b4', emoji: '🥭', pairId: '4' },
      { id: 'a5', emoji: '🍓', pairId: '5' }, { id: 'b5', emoji: '🍓', pairId: '5' },
    ].sort(() => Math.random() - 0.5) } },
    { _id: 'me3', lesson: '', type: 'memory', title: 'Shape Memory', grade: 'UKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { memoryCards: [
      { id: 'a0', emoji: '🔴', pairId: '0' }, { id: 'b0', emoji: '🔴', pairId: '0' },
      { id: 'a1', emoji: '🔵', pairId: '1' }, { id: 'b1', emoji: '🔵', pairId: '1' },
      { id: 'a2', emoji: '🟡', pairId: '2' }, { id: 'b2', emoji: '🟡', pairId: '2' },
      { id: 'a3', emoji: '🟢', pairId: '3' }, { id: 'b3', emoji: '🟢', pairId: '3' },
      { id: 'a4', emoji: '🔶', pairId: '4' }, { id: 'b4', emoji: '🔶', pairId: '4' },
      { id: 'a5', emoji: '⬛', pairId: '5' }, { id: 'b5', emoji: '⬛', pairId: '5' },
    ].sort(() => Math.random() - 0.5) } },
  ],
  spell: [
    { _id: 'sp1', lesson: '', type: 'spell', title: 'Spell Animals', grade: 'LKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { spellWords: [
      { word: 'cat',  emoji: '🐱', hint: 'A furry pet that says Meow' },
      { word: 'dog',  emoji: '🐶', hint: 'A loyal pet that says Woof' },
      { word: 'hen',  emoji: '🐔', hint: 'A bird that lays eggs' },
      { word: 'cow',  emoji: '🐄', hint: 'Gives us milk' },
      { word: 'pig',  emoji: '🐷', hint: 'Says oink oink' },
    ] } },
    { _id: 'sp2', lesson: '', type: 'spell', title: 'Spell Fruits', grade: 'LKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { spellWords: [
      { word: 'mango',  emoji: '🥭', hint: 'King of fruits, yellow inside' },
      { word: 'grape',  emoji: '🍇', hint: 'Small round purple fruit' },
      { word: 'plum',   emoji: '🫐', hint: 'Small purple fruit' },
      { word: 'lime',   emoji: '🍋', hint: 'Small green sour fruit' },
      { word: 'pear',   emoji: '🍐', hint: 'Green pear-shaped fruit' },
    ] } },
    { _id: 'sp3', lesson: '', type: 'spell', title: 'Spell Colours', grade: 'UKG', difficulty: 'easy', xpReward: 10, coinsReward: 5, status: 'published', createdAt: '', content: { spellWords: [
      { word: 'red',    emoji: '🔴', hint: 'Colour of an apple' },
      { word: 'blue',   emoji: '🔵', hint: 'Colour of the sky' },
      { word: 'pink',   emoji: '🌸', hint: 'Colour of a flamingo' },
      { word: 'green',  emoji: '🟢', hint: 'Colour of grass' },
      { word: 'gold',   emoji: '🌟', hint: 'Shiny yellow colour' },
    ] } },
  ],
};

// ── Animated Story Reader ─────────────────────────────────────────────────────

function AnimatedStory({ activity, onDone }: { activity: Activity; onDone: () => void }) {
  const pages = activity.content.pages ?? [];
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  if (!pages.length) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
      <span className="text-6xl">📖</span>
      <p className="font-semibold">No story pages yet.</p>
    </div>
  );

  const page = pages[idx];
  const isLast = idx === pages.length - 1;
  const PAGE_BG = ['#FFF0F5', '#F5F0FF', '#FFFBEB', '#F0FDF4', '#EFF6FF', '#FDF2F8'];
  const bg = page.bg || PAGE_BG[idx % PAGE_BG.length];

  function goNext() { setDir(1); if (isLast) onDone(); else setIdx(i => i + 1); }
  function goPrev() { if (idx > 0) { setDir(-1); setIdx(i => i - 1); } }

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={idx}
          custom={dir}
          variants={{
            enter:  (d: number) => ({ x: `${d * 100}%`, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit:   (d: number) => ({ x: `${d * -100}%`, opacity: 0 }),
          }}
          initial="enter" animate="center" exit="exit"
          transition={{ type: 'tween', duration: 0.32 }}
          className="flex-1 flex flex-col items-center justify-center p-8 mx-4 mt-4 rounded-3xl shadow-lg"
          style={{ backgroundColor: bg, minHeight: 340 }}>

          <motion.div
            animate={{ y: [0, -18, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-8xl mb-8 select-none">
            {page.emoji || '📖'}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            className="text-2xl font-bold text-gray-800 text-center leading-relaxed max-w-sm">
            {page.text}
          </motion.p>

          <p className="mt-5 text-xs text-gray-400 font-semibold">
            Page {idx + 1} of {pages.length}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Dot nav */}
      <div className="flex justify-center gap-2 py-4">
        {pages.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => { setDir(i > idx ? 1 : -1); setIdx(i); }}
            animate={{ width: i === idx ? 28 : 8 }}
            transition={{ duration: 0.25 }}
            className="h-2 rounded-full"
            style={{ backgroundColor: i === idx ? '#FF6B9D' : '#e5e7eb' }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 justify-center pb-8 px-4">
        <button onClick={goPrev} disabled={idx === 0}
          className="w-14 h-14 rounded-full bg-white shadow-md text-2xl disabled:opacity-25 hover:shadow-lg transition-all active:scale-95">
          ◀
        </button>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={goNext}
          className="flex-1 max-w-xs h-14 rounded-2xl text-white font-bold text-lg shadow-md hover:shadow-lg transition-all"
          style={{ backgroundColor: '#FF6B9D' }}>
          {isLast ? '🎉 Finish!' : 'Next ▶'}
        </motion.button>
      </div>
    </div>
  );
}

// ── Activity card helper ──────────────────────────────────────────────────────

function activityPreview(act: Activity, feature: Feature): string {
  if (feature.type === 'story')     return `${act.content.pages?.length ?? 0} pages`;
  if (feature.type === 'flashcard') return `${act.content.cards?.length ?? 0} cards`;
  if (feature.type === 'quiz')      return `${act.content.questions?.length ?? 0} questions`;
  if (feature.type === 'matching')  return `${act.content.pairs?.length ?? 0} pairs`;
  if (feature.type === 'memory')    return `${(act.content.memoryCards?.length ?? 0) / 2} pairs`;
  if (feature.type === 'spell')     return `${act.content.spellWords?.length ?? 0} words`;
  return '';
}

function activityIcon(act: Activity, feature: Feature): string {
  if (feature.type === 'story')    return act.content.pages?.[0]?.emoji ?? feature.emoji;
  if (feature.type === 'matching') return act.content.pairs?.[0]?.emoji ?? feature.emoji;
  if (feature.type === 'spell')    return act.content.spellWords?.[0]?.emoji ?? feature.emoji;
  return feature.emoji;
}

// ── Main component ────────────────────────────────────────────────────────────

function DashboardContent() {
  const params = useSearchParams();
  const router = useRouter();
  const grade = (params.get('grade') || 'LKG') as Grade;
  const colors = getGradeColor(grade);

  const [childId, setChildId]     = useState<string | null>(null);
  const [childInfo, setChildInfo] = useState<{ name: string; avatar: string; streak: number; xp: number; coins: number; level: number } | null>(null);
  const [view, setView]           = useState<View>('home');
  const [feature, setFeature]     = useState<Feature | null>(null);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [xpToast, setXpToast]     = useState<{ xp: number; coins: number } | null>(null);

  // Load child info
  useEffect(() => {
    const childFromUrl = params.get('child');
    const id = childFromUrl ?? localStorage.getItem('ll_child');
    if (childFromUrl) localStorage.setItem('ll_child', childFromUrl);
    setChildId(id);
    if (!id) return;
    childrenApi.get(id)
      .then((res: unknown) => {
        const child = (res as { data: Child }).data;
        if (!params.get('grade') && child.grade) {
          router.replace(`/dashboard?grade=${child.grade}&child=${id}`);
          return;
        }
        setChildInfo({ name: child.name, avatar: child.avatar, streak: child.streaks.current, xp: child.xp ?? 0, coins: child.coins ?? 0, level: child.level ?? 1 });
      }).catch(() => {});
  }, [params, router]);

  // Open a feature: fetch all lessons → auto-generate activities → collect by type
  async function openFeature(f: Feature) {
    setFeature(f);
    setView('list');
    setAllActivities([]);
    setListLoading(true);
    try {
      // Fetch published lessons; fall back to any non-archived if none exist
      let res = await lessonsApi.list({ grade, status: 'published', limit: '20' }) as { data: Lesson[] };
      if (!res.data.length) {
        res = await lessonsApi.list({ grade, status: 'ready', limit: '20' }) as { data: Lesson[] };
      }
      if (!res.data.length) {
        res = await lessonsApi.list({ grade, limit: '20', status: 'all' }) as { data: Lesson[] };
      }
      const lessons = res.data;
      if (!lessons.length) {
        setAllActivities(SAMPLE_ACTIVITIES[f.type] ?? []);
        setListLoading(false);
        return;
      }

      // Fetch activities for each lesson (triggers auto-generation on first visit)
      const results = await Promise.allSettled(
        lessons.map(l => activitiesApi.forLesson(l._id) as Promise<{ data: Activity[] }>)
      );
      const collected: Activity[] = [];
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          const match = r.value.data.find(a => a.type === f.type);
          if (match) collected.push(match);
        }
      });
      // Fall back to built-in samples if DB returned nothing
      setAllActivities(collected.length ? collected : (SAMPLE_ACTIVITIES[f.type] ?? []));
    } catch {
      setAllActivities(SAMPLE_ACTIVITIES[f.type] ?? []);
    }
    setListLoading(false);
  }

  function openActivity(act: Activity) {
    setActiveActivity(act);
    setView('play');
  }

  function handleDone(xp: number, coins: number) {
    setXpToast({ xp, coins });
    if (childId && activeActivity?.lesson) {
      childrenApi.recordWatch(childId, activeActivity.lesson as string, 100).catch(() => {});
    }
    setTimeout(() => setXpToast(null), 3000);
  }

  function goBack() {
    if (view === 'play') { setView('list'); setActiveActivity(null); }
    else { setView('home'); setFeature(null); setAllActivities([]); }
  }

  // ── Play view ──────────────────────────────────────────────────────────────
  if (view === 'play' && activeActivity && feature) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {xpToast && (
          <motion.div
            initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-none">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="font-black text-sm">+{xpToast.xp} XP earned!</p>
              <p className="text-xs text-yellow-100">+{xpToast.coins} coins 🪙</p>
            </div>
          </motion.div>
        )}

        <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={goBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</button>
            <span className="text-2xl">{feature.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-800 text-sm truncate">{activeActivity.title}</p>
              <p className="text-xs font-semibold" style={{ color: feature.color }}>{feature.label}</p>
            </div>
            <span className="text-xs font-bold text-white px-2 py-1 rounded-full" style={{ backgroundColor: feature.color }}>
              +{activeActivity.xpReward} XP
            </span>
          </div>
        </div>

        <div className="max-w-lg mx-auto">
          {activeActivity.type === 'story'     ? <AnimatedStory activity={activeActivity} onDone={() => handleDone(activeActivity.xpReward, activeActivity.coinsReward)} />
          : activeActivity.type === 'flashcard' ? <FlashcardDeck activity={activeActivity} onDone={() => handleDone(activeActivity.xpReward, activeActivity.coinsReward)} />
          : activeActivity.type === 'quiz'      ? <QuizGame activity={activeActivity} childId={childId} colors={colors} onDone={s => handleDone(Math.round(activeActivity.xpReward * s / 100), Math.round(activeActivity.coinsReward * s / 100))} />
          : activeActivity.type === 'matching'  ? <MatchingGame activity={activeActivity} onDone={() => handleDone(activeActivity.xpReward, activeActivity.coinsReward)} />
          : activeActivity.type === 'memory'    ? <MemoryGame activity={activeActivity} onDone={() => handleDone(activeActivity.xpReward, activeActivity.coinsReward)} />
          : activeActivity.type === 'spell'     ? <SpellGame activity={activeActivity} onDone={() => handleDone(activeActivity.xpReward, activeActivity.coinsReward)} />
          : null}
        </div>
        <ChildNav grade={grade} childId={childId} />
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  if (view === 'list' && feature) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: colors.bg }}>
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={goBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</button>
            <span className="text-2xl">{feature.emoji}</span>
            <div>
              <p className="font-black text-gray-800">{feature.label}</p>
              <p className="text-xs text-gray-400">{grade} · {allActivities.length} {feature.plural}</p>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6">
          {listLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="text-6xl">
                {feature.emoji}
              </motion.div>
              <p className="text-gray-500 font-semibold">Building {feature.label}…</p>
              <p className="text-xs text-gray-400">Generating activities for all lessons</p>
            </div>
          ) : allActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <span className="text-6xl">📚</span>
              <p className="text-lg font-bold text-gray-700">No {feature.label} yet</p>
              <p className="text-sm text-gray-400 max-w-xs">Your teacher needs to publish some lessons first. Check back soon!</p>
              <button onClick={goBack} className="mt-4 px-6 py-3 rounded-2xl text-white font-bold" style={{ backgroundColor: feature.color }}>← Go Back</button>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 gap-4"
              initial="hidden" animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
              {allActivities.map((act, i) => (
                <motion.button
                  key={act._id}
                  variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => openActivity(act)}
                  className="text-left rounded-3xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-full -translate-y-4 translate-x-4 opacity-10" style={{ backgroundColor: feature.color }} />
                  <div className="text-5xl mb-3 text-center">{activityIcon(act, feature)}</div>
                  <p className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{(act.title ?? '').replace(/^[📖🃏❓🎯🧠✍️]\s*/, '').replace(/—.*$/, '').trim() || 'Activity'}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{activityPreview(act, feature)}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: feature.color }}>
                      +{act.xpReward}XP
                    </span>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
        <ChildNav grade={grade} childId={childId} />
      </div>
    );
  }

  // ── Home view ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: colors.bg }}>
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-display" style={{ color: colors.primary }}>LittleLearners</Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard?grade=${grade === 'LKG' ? 'UKG' : 'LKG'}${childId ? `&child=${childId}` : ''}`}
            className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-colors"
            style={{ borderColor: colors.primary, color: colors.primary }}>
            {grade === 'LKG' ? '🦋 UKG' : '🐣 LKG'}
          </Link>
          {childId ? (
            <Link href={`/profile/${childId}`} className="px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: colors.primary }}>
              👤 Me
            </Link>
          ) : (
            <Link href="/onboarding" className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-colors" style={{ borderColor: colors.primary, color: colors.primary }}>
              + Setup
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* Child stats */}
        {childInfo && (
          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm">
            <div className="relative flex-shrink-0">
              <span className="text-3xl">{childInfo.avatar}</span>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-black text-gray-900">{childInfo.level}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm truncate">{childInfo.name}</p>
              <p className="text-xs text-gray-400">Level {childInfo.level}</p>
            </div>
            <div className="flex items-center gap-3 text-center">
              <div><div className="text-sm font-bold" style={{ color: colors.primary }}>{childInfo.streak}🔥</div><div className="text-xs text-gray-400">streak</div></div>
              <div className="w-px h-5 bg-gray-100" />
              <div><div className="text-sm font-bold text-yellow-500">⭐{childInfo.xp}</div><div className="text-xs text-gray-400">XP</div></div>
              <div className="w-px h-5 bg-gray-100" />
              <div><div className="text-sm font-bold text-amber-500">🪙{childInfo.coins}</div><div className="text-xs text-gray-400">coins</div></div>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="text-center pt-2">
          <h1 className="text-3xl font-display" style={{ color: colors.primary }}>
            {grade === 'LKG' ? '🐣 LKG' : '🦋 UKG'} Learning
          </h1>
          <p className="text-sm text-gray-400 font-body mt-1">What do you want to learn today?</p>
        </div>

        {/* Feature tiles */}
        <motion.div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3"
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
          {FEATURES.map(f => (
            <motion.button
              key={f.type}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openFeature(f)}
              className="relative text-left rounded-3xl p-5 overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
              style={{ backgroundColor: f.bg }}>
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20" style={{ backgroundColor: f.color }} />
              <div className="text-5xl mb-3 relative">{f.emoji}</div>
              <p className="font-display text-xl leading-tight relative" style={{ color: f.color }}>{f.label}</p>
              <p className="text-xs text-gray-400 mt-1 font-body relative">{f.desc}</p>
            </motion.button>
          ))}
        </motion.div>
      </div>

      <ChildNav grade={grade} childId={childId} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-bounce">🌟</div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
