'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import type { Grade, Lesson, Activity, ActivityType } from '@/types';
import { lessonsApi, activitiesApi, childrenApi } from '@/lib/api';
import type { Child } from '@/types';
import { ChildNav } from '@/components/ChildNav';
import { getGradeColor } from '@/lib/utils';
import { FlashcardDeck, QuizGame, MatchingGame, MemoryGame, SpellGame } from '@/components/activities/ActivityPlayer';

/* ── Global keyframe CSS ────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @keyframes ll-float{0%,100%{transform:translateY(0) rotate(0deg)}33%{transform:translateY(-22px) rotate(8deg)}66%{transform:translateY(-10px) rotate(-5deg)}}
  @keyframes ll-float2{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-18px) scale(1.08)}}
  @keyframes ll-glow{0%,100%{box-shadow:0 4px 20px var(--glow)}50%{box-shadow:0 8px 40px var(--glow),0 0 60px var(--glow2)}}
  @keyframes ll-rainbow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
  @keyframes ll-confetti{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(105vh) rotate(720deg);opacity:0}}
  @keyframes ll-pop{0%,100%{transform:scale(1)}40%{transform:scale(1.3)}75%{transform:scale(0.9)}}
  @keyframes ll-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-8px)}80%{transform:translateX(8px)}}
  @keyframes ll-sparkle{0%,100%{opacity:0;transform:scale(0) rotate(0deg)}50%{opacity:1;transform:scale(1) rotate(180deg)}}
  @keyframes ll-slide-up{from{transform:translateY(28px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes ll-pulse-ring{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.6);opacity:0}}
  @keyframes ll-star-rain{0%{transform:translateY(-40px) rotate(0deg) scale(1);opacity:1}100%{transform:translateY(80px) rotate(360deg) scale(0.3);opacity:0}}
  @keyframes ll-bounce-in{0%{transform:scale(0.3) translateY(30px);opacity:0}60%{transform:scale(1.1) translateY(-6px)}80%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}
  @keyframes ll-tile-shine{0%{left:-100%}100%{left:200%}}
  .ll-shake{animation:ll-shake 0.5s ease both}
  .ll-pop{animation:ll-pop 0.5s ease both}
  .ll-bounce-in{animation:ll-bounce-in 0.6s cubic-bezier(0.34,1.56,0.64,1) both}
`;

/* ── Constants ──────────────────────────────────────────────────────────────── */
const FEATURES = [
  { type: 'story'     as ActivityType, label: 'Stories',    plural: 'stories',    emoji: '📖', color: '#FF6B9D', grad: 'linear-gradient(135deg,#FFE0EE,#FFC4DC)', glow: 'rgba(255,107,157,0.45)', desc: 'Animated tales' },
  { type: 'flashcard' as ActivityType, label: 'Flashcards', plural: 'flashcards', emoji: '🃏', color: '#7C3AED', grad: 'linear-gradient(135deg,#EDE0FF,#D6C4FF)', glow: 'rgba(124,58,237,0.45)', desc: 'Flip & learn'   },
  { type: 'quiz'      as ActivityType, label: 'Quizzes',    plural: 'quizzes',    emoji: '❓', color: '#F59E0B', grad: 'linear-gradient(135deg,#FFF3CC,#FFE499)', glow: 'rgba(245,158,11,0.45)',  desc: 'Test yourself' },
  { type: 'matching'  as ActivityType, label: 'Match It',   plural: 'games',      emoji: '🎯', color: '#10B981', grad: 'linear-gradient(135deg,#CCFCE8,#A7F3D0)', glow: 'rgba(16,185,129,0.45)', desc: 'Find pairs'    },
  { type: 'memory'    as ActivityType, label: 'Memory',     plural: 'games',      emoji: '🧠', color: '#3B82F6', grad: 'linear-gradient(135deg,#DBEAFE,#BFDBFE)', glow: 'rgba(59,130,246,0.45)', desc: 'Remember all'  },
  { type: 'spell'     as ActivityType, label: 'Spell It',   plural: 'words',      emoji: '✍️', color: '#EC4899', grad: 'linear-gradient(135deg,#FCE7F3,#FBCFE8)', glow: 'rgba(236,72,153,0.45)',  desc: 'Build words'   },
];

type Feature = typeof FEATURES[0];
type View = 'home' | 'list' | 'play';

const BG_FLOATERS = [
  { e:'⭐',l:'6%',  t:'12%', dur:'7s', del:'0s',   op:0.18 },
  { e:'🌟',l:'82%', t:'18%', dur:'9s', del:'1.2s',  op:0.15 },
  { e:'💫',l:'48%', t:'6%',  dur:'6s', del:'0.5s',  op:0.20 },
  { e:'✨',l:'18%', t:'38%', dur:'8s', del:'2s',    op:0.16 },
  { e:'🎈',l:'72%', t:'52%', dur:'10s',del:'0.8s',  op:0.14 },
  { e:'🌈',l:'30%', t:'68%', dur:'7s', del:'1.5s',  op:0.18 },
  { e:'💛',l:'88%', t:'72%', dur:'8s', del:'0.3s',  op:0.15 },
  { e:'🎉',l:'5%',  t:'62%', dur:'9s', del:'1.8s',  op:0.16 },
  { e:'🌸',l:'58%', t:'82%', dur:'6s', del:'0.6s',  op:0.18 },
  { e:'🎀',l:'14%', t:'85%', dur:'7s', del:'2.2s',  op:0.14 },
  { e:'🦋',l:'40%', t:'45%', dur:'11s',del:'1s',    op:0.12 },
  { e:'🌺',l:'65%', t:'30%', dur:'8s', del:'3s',    op:0.15 },
];

const CONFETTI_COLORS = ['#FF6B9D','#7C3AED','#F59E0B','#10B981','#3B82F6','#EC4899','#06B6D4','#EF4444','#84CC16'];

function Confetti() {
  const pieces = Array.from({ length: 48 }).map((_, i) => ({
    x: `${(i * 2.1) % 100}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    dur: `${1.4 + (i % 7) * 0.25}s`,
    del: `${(i % 9) * 0.12}s`,
    shape: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0',
    w: 7 + (i % 5) * 2,
    h: 7 + (i % 4) * 3,
  }));
  return (
    <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:200,overflow:'hidden' }}>
      {pieces.map((p, i) => (
        <div key={i} style={{ position:'absolute', top:'-20px', left:p.x, width:p.w, height:p.h, borderRadius:p.shape, backgroundColor:p.color, animation:`ll-confetti ${p.dur} ease-in ${p.del} both` }} />
      ))}
    </div>
  );
}

const BURST_POS = [
  [-55,-55],[-55,0],[-55,55],[0,-65],[0,65],[55,-55],[55,0],[55,55],
  [-30,-70],[30,-70],[-70,-30],[70,-30],[-70,30],[70,30],[-30,70],[30,70],
];

function StarBurst({ trigger }: { trigger: number }) {
  if (!trigger) return null;
  return (
    <div style={{ position:'absolute', bottom:90, left:'50%', transform:'translate(-50%,0)', pointerEvents:'none', zIndex:10 }}>
      {BURST_POS.map(([x,y], i) => (
        <motion.span key={`${trigger}-${i}`}
          initial={{ x:0, y:0, scale:0, opacity:1 }}
          animate={{ x, y, scale: 1.4, opacity:0 }}
          transition={{ duration:0.65, delay:i*0.03, ease:'easeOut' }}
          style={{ position:'absolute', fontSize:i%2===0?'18px':'14px' }}>
          {['⭐','💫','✨','🌟','🎉','🎊','💥','⚡'][i%8]}
        </motion.span>
      ))}
    </div>
  );
}

/* ── Animated Story ─────────────────────────────────────────────────────────── */
function AnimatedStory({ activity, onDone }: { activity: Activity; onDone: () => void }) {
  const pages = activity.content.pages ?? [];
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [burst, setBurst] = useState(0);
  const [done, setDone] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  if (!pages.length) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
      <span className="text-6xl">📖</span><p className="font-semibold">No story pages yet.</p>
    </div>
  );

  const page = pages[idx];
  const isLast = idx === pages.length - 1;
  const PAGE_BG = ['#FFF0F5','#F5F0FF','#FFFBEB','#F0FDF4','#EFF6FF','#FDF2F8','#FFF9F0','#F0F9FF','#FFF7ED'];
  const bg = page.bg || PAGE_BG[idx % PAGE_BG.length];

  function goNext() {
    if (isLast) {
      setDone(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    } else {
      setBurst(b => b + 1);
      setDir(1);
      setIdx(i => i + 1);
    }
  }
  function goPrev() { if (idx > 0) { setDir(-1); setIdx(i => i - 1); } }

  if (done) return (
    <div className="relative flex flex-col items-center justify-center text-center px-6 py-12" style={{ minHeight: 'calc(100vh - 140px)' }}>
      {showConfetti && <Confetti />}
      <motion.div animate={{ scale:[1,1.2,1], rotate:[0,10,-10,0] }} transition={{ duration:0.8, repeat:3 }} className="text-8xl mb-6">🎉</motion.div>
      <motion.h2 initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        className="text-4xl font-black mb-3" style={{ background:'linear-gradient(135deg,#FF6B9D,#7C3AED)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
        Amazing! 🌟
      </motion.h2>
      <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }} className="text-gray-500 mb-8 text-lg">
        You finished the story!
      </motion.p>
      <div className="flex justify-center gap-2 mb-8">
        {[...Array(5)].map((_,i) => (
          <motion.span key={i} initial={{ scale:0, rotate:-45 }} animate={{ scale:1, rotate:0 }} transition={{ delay:0.6 + i*0.1, type:'spring', stiffness:400 }} className="text-3xl">⭐</motion.span>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={() => { setIdx(0); setDone(false); }} className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition">Read Again</button>
        <button onClick={onDone} className="px-8 py-3 rounded-2xl text-white font-bold shadow-lg hover:shadow-xl transition" style={{ background:'linear-gradient(135deg,#FF6B9D,#EC4899)' }}>Done ✓</button>
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-col" style={{ minHeight: 'calc(100vh - 130px)' }}>
      <StarBurst trigger={burst} />
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={idx} custom={dir}
          variants={{ enter:(d:number)=>({ x:`${d*100}%`, opacity:0 }), center:{ x:0, opacity:1 }, exit:(d:number)=>({ x:`${d*-100}%`, opacity:0 }) }}
          initial="enter" animate="center" exit="exit"
          transition={{ type:'tween', duration:0.35 }}
          className="flex-1 flex flex-col items-center justify-center p-8 mx-4 mt-4 rounded-3xl shadow-xl"
          style={{ backgroundColor:bg, minHeight:340, boxShadow:`0 8px 32px ${bg}88, 0 2px 8px rgba(0,0,0,0.08)` }}>

          {/* Page number pill */}
          <div className="absolute top-6 right-8 text-xs font-black px-3 py-1 rounded-full bg-white/60 backdrop-blur text-gray-500">
            {idx+1}/{pages.length}
          </div>

          <motion.div
            animate={{ y:[0,-20,0], scale:[1,1.06,1] }}
            transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}
            className="text-9xl mb-8 select-none drop-shadow-lg">
            {page.emoji || '📖'}
          </motion.div>

          <motion.p
            key={`text-${idx}`}
            initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.22, duration:0.45 }}
            className="text-2xl font-bold text-gray-800 text-center leading-relaxed max-w-sm">
            {page.text}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 py-4">
        {pages.map((_,i) => (
          <motion.button key={i} onClick={() => { setDir(i>idx?1:-1); setIdx(i); }}
            animate={{ width: i===idx ? 28 : 8, backgroundColor: i===idx ? '#FF6B9D' : '#e5e7eb' }}
            transition={{ duration:0.3 }}
            className="h-2 rounded-full" />
        ))}
      </div>

      {/* Nav */}
      <div className="flex items-center gap-3 justify-center pb-8 px-4">
        <button onClick={goPrev} disabled={idx===0}
          className="w-14 h-14 rounded-full bg-white shadow-md text-2xl disabled:opacity-25 hover:shadow-lg transition-all active:scale-90">◀</button>
        <motion.button whileTap={{ scale:0.93 }} whileHover={{ scale:1.04 }} onClick={goNext}
          className="flex-1 max-w-xs h-14 rounded-2xl text-white font-black text-lg shadow-lg hover:shadow-xl transition-all"
          style={{ background:'linear-gradient(135deg,#FF6B9D,#EC4899)' }}>
          {isLast ? '🎉 Finish Story!' : 'Next Page ▶'}
        </motion.button>
      </div>
    </div>
  );
}

/* ── Activity card helpers ───────────────────────────────────────────────────── */
function actPreview(act: Activity, f: Feature) {
  if (f.type==='story')     return `${act.content.pages?.length??0} pages`;
  if (f.type==='flashcard') return `${act.content.cards?.length??0} cards`;
  if (f.type==='quiz')      return `${act.content.questions?.length??0} questions`;
  if (f.type==='matching')  return `${act.content.pairs?.length??0} pairs`;
  if (f.type==='memory')    return `${(act.content.memoryCards?.length??0)/2} pairs`;
  if (f.type==='spell')     return `${act.content.spellWords?.length??0} words`;
  return '';
}
function actIcon(act: Activity, f: Feature) {
  if (f.type==='story')    return act.content.pages?.[0]?.emoji ?? f.emoji;
  if (f.type==='matching') return act.content.pairs?.[0]?.emoji ?? f.emoji;
  if (f.type==='spell')    return act.content.spellWords?.[0]?.emoji ?? f.emoji;
  return f.emoji;
}

/* ── Sample content ──────────────────────────────────────────────────────────── */
const SAMPLE: Record<string, Activity[]> = {
  story: [
    { _id:'s1', lesson:'', type:'story', title:'The Honest Woodcutter', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ pages:[
      { text:'Once upon a time, a kind woodcutter lived near a beautiful forest.', emoji:'🌳', bg:'#FFF0F5' },
      { text:'One day, while chopping wood near the river, his axe slipped and fell into the deep water!', emoji:'😱', bg:'#F5F0FF' },
      { text:'He sat on the riverbank and cried. A shining fairy appeared from the water!', emoji:'🧚', bg:'#FFFBEB' },
      { text:'"Is this golden axe yours?" she asked. "No," said the woodcutter honestly.', emoji:'✨', bg:'#F0FDF4' },
      { text:'She showed him a silver axe. "No, that is not mine either," he said again.', emoji:'🙅', bg:'#EFF6FF' },
      { text:'Then the fairy showed his old iron axe. "Yes! That is mine!" he cried happily.', emoji:'🪓', bg:'#FDF2F8' },
      { text:'The fairy gave him all three axes for his honesty. Honesty is always the best! 🌟', emoji:'🌟', bg:'#FFF9F0' },
    ]}},
    { _id:'s2', lesson:'', type:'story', title:'The Thirsty Crow', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ pages:[
      { text:'On a very hot summer day, a clever crow flew through the dry village.', emoji:'🐦', bg:'#FFFBEB' },
      { text:'He was very thirsty! He looked everywhere for water but could not find any.', emoji:'💧', bg:'#FFF0F5' },
      { text:'At last he found a tall pot! But the water was far at the bottom.', emoji:'🏺', bg:'#F5F0FF' },
      { text:'His beak was too short to reach it. He thought and thought hard.', emoji:'🤔', bg:'#F0FDF4' },
      { text:'Then he had a brilliant idea! He picked up small pebbles one by one.', emoji:'🪨', bg:'#EFF6FF' },
      { text:'He dropped pebble after pebble into the pot. The water rose higher!', emoji:'📈', bg:'#FFFBEB' },
      { text:'He drank the cool water and flew away happy. Never give up! 🎉', emoji:'🌈', bg:'#FDF2F8' },
    ]}},
    { _id:'s3', lesson:'', type:'story', title:'The Lion and the Mouse', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ pages:[
      { text:'A mighty lion was sleeping peacefully in the jungle on a warm afternoon.', emoji:'🦁', bg:'#FFFBEB' },
      { text:'A tiny mouse accidentally ran across the lion\'s nose! The lion woke up roaring!', emoji:'🐭', bg:'#FFF0F5' },
      { text:'"Please don\'t eat me!" cried the mouse. "I may help you someday!"', emoji:'🙏', bg:'#F5F0FF' },
      { text:'The lion laughed and let the mouse go free. Could a tiny mouse ever help a lion?', emoji:'😄', bg:'#F0FDF4' },
      { text:'One day, hunters caught the lion in a big net. He roared for help!', emoji:'😰', bg:'#EFF6FF' },
      { text:'The little mouse heard him and ran quickly. She chewed through the ropes!', emoji:'✂️', bg:'#FFFBEB' },
      { text:'The lion was free! Even the smallest friend can be a great helper. 💛', emoji:'💛', bg:'#FDF2F8' },
    ]}},
    { _id:'s4', lesson:'', type:'story', title:'The Tortoise and the Hare', grade:'UKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ pages:[
      { text:'A speedy hare always boasted: "I am the fastest animal in the whole forest!"', emoji:'🐰', bg:'#FFF0F5' },
      { text:'A slow tortoise challenged him to a race. Everyone laughed — even the hare!', emoji:'🐢', bg:'#F5F0FF' },
      { text:'The race began! The hare zoomed far ahead and decided to take a little nap.', emoji:'😴', bg:'#FFFBEB' },
      { text:'The tortoise kept walking — slowly, steadily, step by step without stopping.', emoji:'🚶', bg:'#F0FDF4' },
      { text:'The hare woke up and ran fast — but it was too late!', emoji:'😱', bg:'#EFF6FF' },
      { text:'The tortoise crossed the finish line first! Everyone cheered! 🎉', emoji:'🏆', bg:'#FDF2F8' },
      { text:'Slow and steady wins the race. Never give up no matter how slow you are! 🌟', emoji:'🌟', bg:'#FFFBEB' },
    ]}},
    { _id:'s5', lesson:'', type:'story', title:'Twinkle Twinkle Little Star', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ pages:[
      { text:'Twinkle, twinkle, little star — how I wonder what you are!', emoji:'⭐', bg:'#F5F0FF' },
      { text:'Up above the world so high, like a diamond in the sky.', emoji:'💎', bg:'#EFF6FF' },
      { text:'When the blazing sun has gone, when he nothing shines upon...', emoji:'🌙', bg:'#FFF0F5' },
      { text:'Then you show your little light — twinkling, twinkling through the night!', emoji:'✨', bg:'#FDF2F8' },
      { text:'In the dark blue sky you keep, watching all of us asleep.', emoji:'🌌', bg:'#EFF6FF' },
      { text:'Twinkle, twinkle, little star — how I wonder what you are! 🌟', emoji:'🌟', bg:'#FFFBEB' },
    ]}},
    { _id:'s6', lesson:'', type:'story', title:'Jack and Jill', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ pages:[
      { text:'Jack and Jill were the best of friends who lived near a big green hill.', emoji:'🌄', bg:'#F0FDF4' },
      { text:'One sunny morning they went up the hill to fetch a pail of water.', emoji:'🪣', bg:'#EFF6FF' },
      { text:'Jack tripped on a stone and tumbled all the way down — bump bump bump!', emoji:'😖', bg:'#FFF0F5' },
      { text:'Jill came tumbling after him! They both landed at the bottom.', emoji:'💨', bg:'#F5F0FF' },
      { text:'Mama cleaned their cuts and gave them cookies and milk.', emoji:'🍪', bg:'#FFFBEB' },
      { text:'They laughed about their adventure and went to play. Friends make every day better! 💛', emoji:'💛', bg:'#FDF2F8' },
    ]}},
    { _id:'s7', lesson:'', type:'story', title:'The Three Little Pigs', grade:'UKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ pages:[
      { text:'Three little pig brothers left home to build their own houses.', emoji:'🐷', bg:'#FFF0F5' },
      { text:'The first pig built a house of straw — quick and easy!', emoji:'🌾', bg:'#FFFBEB' },
      { text:'The second pig built a house of sticks — a bit stronger!', emoji:'🪵', bg:'#F5F0FF' },
      { text:'The third pig worked hard and built a strong house of bricks.', emoji:'🧱', bg:'#F0FDF4' },
      { text:'The big bad wolf huffed and puffed and blew down straw and sticks!', emoji:'💨', bg:'#EFF6FF' },
      { text:'But he could NOT blow down the brick house! All three pigs were safe inside.', emoji:'🏠', bg:'#FDF2F8' },
      { text:'The wolf ran away! Hard work and planning always pays off! 🌟', emoji:'🌟', bg:'#FFFBEB' },
    ]}},
    { _id:'s8', lesson:'', type:'story', title:'Good Morning Routine', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ pages:[
      { text:'The sun rises and birds start to sing. Good morning, world! Rise and shine!', emoji:'☀️', bg:'#FFFBEB' },
      { text:'First we wake up, stretch our arms, and say good morning to our family!', emoji:'🌅', bg:'#FFF0F5' },
      { text:'Brush your teeth — up and down, round and round for 2 whole minutes!', emoji:'🪥', bg:'#F5F0FF' },
      { text:'Wash your face with cool water. Splash! Splash! Now you are fresh!', emoji:'💦', bg:'#EFF6FF' },
      { text:'Eat a healthy breakfast — milk, fruits, and cereal for a strong body!', emoji:'🥛', bg:'#F0FDF4' },
      { text:'Pack your bag, wear your shoes, and off to school you go! Have a great day! 🎒', emoji:'🎒', bg:'#FDF2F8' },
    ]}},
    { _id:'s9', lesson:'', type:'story', title:'The Magic Garden', grade:'UKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ pages:[
      { text:'Little Mia found a tiny seed in her garden. She held it gently in her palm.', emoji:'🌱', bg:'#F0FDF4' },
      { text:'She dug a small hole in the soft soil and planted the seed with love.', emoji:'🌍', bg:'#FFFBEB' },
      { text:'Every day she watered it and talked to it kindly. "Grow, little seed, grow!"', emoji:'💧', bg:'#EFF6FF' },
      { text:'Days passed. A tiny green shoot poked out of the ground! Mia jumped with joy!', emoji:'🌿', bg:'#F5F0FF' },
      { text:'The shoot grew taller and sprouted beautiful red flowers!', emoji:'🌹', bg:'#FFF0F5' },
      { text:'Mia learned that with love, water, and patience, anything can grow! 🌺', emoji:'🌺', bg:'#FDF2F8' },
    ]}},
    { _id:'s10', lesson:'', type:'story', title:'Rain Rain Go Away', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ pages:[
      { text:'The dark clouds gathered and raindrops started to fall — pitter patter pitter patter!', emoji:'🌧️', bg:'#EFF6FF' },
      { text:'"Rain, rain, go away! Come again another day!" sang the children.', emoji:'🎵', bg:'#F5F0FF' },
      { text:'Little Maya put on her yellow raincoat and blue boots and stepped outside!', emoji:'🌂', bg:'#FFF0F5' },
      { text:'SPLASH! She jumped in every single puddle! What fun it was!', emoji:'💦', bg:'#FFFBEB' },
      { text:'Soon the rain stopped and a beautiful rainbow appeared in the sky!', emoji:'🌈', bg:'#F0FDF4' },
      { text:'Red, orange, yellow, green, blue, indigo, violet — seven colours of joy! 🌈', emoji:'🌟', bg:'#FDF2F8' },
    ]}},
  ],
  flashcard: [
    { _id:'f1', lesson:'', type:'flashcard', title:'A to E Phonics', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ cards:[
      { front:'A', back:'Apple', emoji:'🍎', example:'A is for Apple — a a apple!' },
      { front:'B', back:'Ball',  emoji:'⚽', example:'B is for Ball — b b ball!' },
      { front:'C', back:'Cat',   emoji:'🐱', example:'C is for Cat — c c cat!' },
      { front:'D', back:'Dog',   emoji:'🐶', example:'D is for Dog — d d dog!' },
      { front:'E', back:'Elephant', emoji:'🐘', example:'E is for Elephant — e e elephant!' },
    ]}},
    { _id:'f2', lesson:'', type:'flashcard', title:'F to J Phonics', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ cards:[
      { front:'F', back:'Fish',   emoji:'🐟', example:'F is for Fish — f f fish!' },
      { front:'G', back:'Goat',   emoji:'🐐', example:'G is for Goat — g g goat!' },
      { front:'H', back:'Hat',    emoji:'🎩', example:'H is for Hat — h h hat!' },
      { front:'I', back:'Igloo',  emoji:'🧊', example:'I is for Igloo — i i igloo!' },
      { front:'J', back:'Jar',    emoji:'🫙', example:'J is for Jar — j j jar!' },
    ]}},
    { _id:'f3', lesson:'', type:'flashcard', title:'Animals & Sounds', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ cards:[
      { front:'Lion',  back:'Roar!',  emoji:'🦁', example:'The lion says ROAR!' },
      { front:'Duck',  back:'Quack!', emoji:'🦆', example:'The duck says QUACK!' },
      { front:'Cow',   back:'Moo!',   emoji:'🐄', example:'The cow says MOO!' },
      { front:'Dog',   back:'Woof!',  emoji:'🐶', example:'The dog says WOOF!' },
      { front:'Cat',   back:'Meow!',  emoji:'🐱', example:'The cat says MEOW!' },
      { front:'Frog',  back:'Ribbit!',emoji:'🐸', example:'The frog says RIBBIT!' },
      { front:'Sheep', back:'Baa!',   emoji:'🐑', example:'The sheep says BAA!' },
    ]}},
    { _id:'f4', lesson:'', type:'flashcard', title:'Count 1 to 10', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ cards:[
      { front:'1', back:'One',   emoji:'1️⃣', example:'One little star ⭐' },
      { front:'2', back:'Two',   emoji:'2️⃣', example:'Two little birds 🐦🐦' },
      { front:'3', back:'Three', emoji:'3️⃣', example:'Three apples 🍎🍎🍎' },
      { front:'4', back:'Four',  emoji:'4️⃣', example:'Four butterflies 🦋🦋🦋🦋' },
      { front:'5', back:'Five',  emoji:'5️⃣', example:'Five fingers on one hand ✋' },
      { front:'6', back:'Six',   emoji:'6️⃣', example:'Six flower petals 🌸' },
      { front:'7', back:'Seven', emoji:'7️⃣', example:'Seven days in a week 📅' },
      { front:'8', back:'Eight', emoji:'8️⃣', example:'Eight spider legs 🕷️' },
      { front:'9', back:'Nine',  emoji:'9️⃣', example:'Nine planets 🪐' },
      { front:'10',back:'Ten',   emoji:'🔟', example:'Ten fingers and ten toes! 👐' },
    ]}},
    { _id:'f5', lesson:'', type:'flashcard', title:'Colours', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ cards:[
      { front:'Red',    back:'Like an apple!', emoji:'🔴', example:'Red is the colour of roses 🌹' },
      { front:'Blue',   back:'Like the sky!',  emoji:'🔵', example:'Blue is the colour of the ocean 🌊' },
      { front:'Yellow', back:'Like the sun!',  emoji:'🟡', example:'Yellow is the colour of bananas 🍌' },
      { front:'Green',  back:'Like grass!',    emoji:'🟢', example:'Green is the colour of trees 🌳' },
      { front:'Pink',   back:'Like flowers!',  emoji:'🌸', example:'Pink is the colour of flamingos 🦩' },
      { front:'Orange', back:'Like an orange!',emoji:'🟠', example:'Orange is the colour of carrots 🥕' },
    ]}},
    { _id:'f6', lesson:'', type:'flashcard', title:'Shapes', grade:'UKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ cards:[
      { front:'Circle',   back:'Round like the sun!', emoji:'⭕', example:'A ball is a circle ⚽' },
      { front:'Square',   back:'4 equal sides!',      emoji:'🔲', example:'A window is a square 🪟' },
      { front:'Triangle', back:'3 sides, 3 corners!', emoji:'🔺', example:'A pizza slice is a triangle 🍕' },
      { front:'Rectangle',back:'2 long + 2 short!',   emoji:'▬',  example:'A book is a rectangle 📚' },
      { front:'Star',     back:'5 shiny points!',     emoji:'⭐', example:'Stars in the sky twinkle ✨' },
      { front:'Heart',    back:'A symbol of love!',   emoji:'❤️', example:'Hearts mean love and care 💛' },
    ]}},
    { _id:'f7', lesson:'', type:'flashcard', title:'Vegetables', grade:'UKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ cards:[
      { front:'Carrot',  back:'Orange, crunchy!',  emoji:'🥕', example:'Rabbits love carrots 🐰' },
      { front:'Tomato',  back:'Red and juicy!',    emoji:'🍅', example:'Tomatoes go in salad 🥗' },
      { front:'Broccoli',back:'Like a tiny tree!', emoji:'🥦', example:'Broccoli makes you strong 💪' },
      { front:'Potato',  back:'Brown underground!',emoji:'🥔', example:'Chips are made from potatoes! 🍟' },
      { front:'Onion',   back:'Makes eyes water!', emoji:'🧅', example:'Onions have many layers 😢' },
      { front:'Corn',    back:'Yellow and sweet!', emoji:'🌽', example:'Popcorn comes from corn 🍿' },
    ]}},
  ],
  quiz: [
    { _id:'q1', lesson:'', type:'quiz', title:'Animals Quiz', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ questions:[
      { question:'Which animal says ROAR?', options:['Cat','Lion','Duck','Fish'], correct:1, emoji:'🦁', explanation:'The lion says ROAR! It is the king of the jungle!' },
      { question:'Which animal has a long trunk?', options:['Giraffe','Horse','Elephant','Zebra'], correct:2, emoji:'🐘', explanation:'Elephants use their trunk to drink water and pick things!' },
      { question:'What does a duck say?', options:['Moo','Woof','Quack','Meow'], correct:2, emoji:'🦆', explanation:'Ducks say QUACK QUACK!' },
      { question:'Which animal can fly?', options:['Fish','Dog','Parrot','Frog'], correct:2, emoji:'🦜', explanation:'Parrots have wings and can fly!' },
      { question:'Where does a fish live?', options:['Tree','Sand','Water','Sky'], correct:2, emoji:'🐟', explanation:'Fish live in water — rivers, lakes, and oceans!' },
    ]}},
    { _id:'q2', lesson:'', type:'quiz', title:'Numbers Quiz', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ questions:[
      { question:'How many fingers on ONE hand?', options:['3','4','5','6'], correct:2, emoji:'✋', explanation:'We have 5 fingers on each hand!' },
      { question:'What comes AFTER 4?', options:['3','6','2','5'], correct:3, emoji:'🔢', explanation:'4... then 5! Count with me: 1,2,3,4,5!' },
      { question:'What comes BEFORE 3?', options:['4','2','5','1'], correct:1, emoji:'⬅️', explanation:'2 comes before 3!' },
      { question:'How many wheels does a bicycle have?', options:['1','3','2','4'], correct:2, emoji:'🚲', explanation:'A bicycle has 2 wheels!' },
      { question:'Count: ⭐⭐⭐. How many stars?', options:['1','2','4','3'], correct:3, emoji:'⭐', explanation:'1, 2, 3 — there are 3 stars!' },
    ]}},
    { _id:'q3', lesson:'', type:'quiz', title:'Fruits & Colours', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ questions:[
      { question:'What colour is a ripe apple?', options:['Blue','Yellow','Red','Green'], correct:2, emoji:'🍎', explanation:'A ripe apple is RED!' },
      { question:'Which fruit is yellow and long?', options:['Strawberry','Banana','Orange','Grape'], correct:1, emoji:'🍌', explanation:'Banana is yellow and long!' },
      { question:'What colour is the sky?', options:['Green','Red','Blue','Yellow'], correct:2, emoji:'🌤️', explanation:'The sky is beautiful BLUE!' },
      { question:'What colour is grass?', options:['Yellow','Blue','Red','Green'], correct:3, emoji:'🌿', explanation:'Grass is GREEN!' },
      { question:'Which is the king of fruits?', options:['Apple','Mango','Grape','Orange'], correct:1, emoji:'🥭', explanation:'Mango is called the king of fruits!' },
    ]}},
    { _id:'q4', lesson:'', type:'quiz', title:'Body Parts', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ questions:[
      { question:'What do we use to see?', options:['Ears','Nose','Eyes','Mouth'], correct:2, emoji:'👁️', explanation:'We use our EYES to see!' },
      { question:'What do we use to hear?', options:['Eyes','Ears','Nose','Feet'], correct:1, emoji:'👂', explanation:'We use our EARS to hear sounds!' },
      { question:'What do we use to smell?', options:['Eyes','Ears','Nose','Hand'], correct:2, emoji:'👃', explanation:'We smell with our NOSE!' },
      { question:'How many legs does a human have?', options:['1','4','3','2'], correct:3, emoji:'🦵', explanation:'Humans have 2 legs!' },
      { question:'What do we use to taste food?', options:['Eyes','Tongue','Ears','Nose'], correct:1, emoji:'👅', explanation:'We taste food with our TONGUE!' },
    ]}},
    { _id:'q5', lesson:'', type:'quiz', title:'Rhymes Quiz', grade:'UKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ questions:[
      { question:'Twinkle twinkle little ___?', options:['Moon','Sun','Star','Cloud'], correct:2, emoji:'⭐', explanation:'Twinkle twinkle little STAR!' },
      { question:'Jack and Jill went up the ___?', options:['Hill','Tree','Mountain','River'], correct:0, emoji:'🌄', explanation:'Jack and Jill went up the HILL!' },
      { question:'"Baa baa black sheep, have you any ___?"', options:['Milk','Wool','Food','Water'], correct:1, emoji:'🐑', explanation:'Baa baa black sheep, have you any WOOL?' },
      { question:'Rain rain go ___?', options:['Up','Away','Down','Here'], correct:1, emoji:'🌧️', explanation:'Rain rain GO AWAY, come again another day!' },
      { question:'"Old MacDonald had a ___?"', options:['Car','Shop','Farm','Boat'], correct:2, emoji:'🚜', explanation:'Old MacDonald had a FARM — E I E I O!' },
    ]}},
    { _id:'q6', lesson:'', type:'quiz', title:'General Knowledge', grade:'UKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ questions:[
      { question:'How many colours in a rainbow?', options:['5','6','8','7'], correct:3, emoji:'🌈', explanation:'A rainbow has 7 colours — VIBGYOR!' },
      { question:'Which season has snow?', options:['Summer','Spring','Winter','Autumn'], correct:2, emoji:'❄️', explanation:'WINTER is the cold season with snow!' },
      { question:'Which planet do we live on?', options:['Mars','Venus','Earth','Jupiter'], correct:2, emoji:'🌍', explanation:'We live on planet EARTH!' },
      { question:'How many days in a week?', options:['5','6','8','7'], correct:3, emoji:'📅', explanation:'There are 7 days in a week!' },
      { question:'What do plants need to grow?', options:['Sand & fire','Water & sunlight','Ice & darkness','Wind & rocks'], correct:1, emoji:'🌱', explanation:'Plants need WATER and SUNLIGHT to grow!' },
    ]}},
  ],
  matching: [
    { _id:'m1', lesson:'', type:'matching', title:'Animals & Sounds', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ pairs:[
      { word:'Lion', emoji:'🦁' }, { word:'Duck', emoji:'🦆' }, { word:'Cow', emoji:'🐄' }, { word:'Dog', emoji:'🐶' }, { word:'Frog', emoji:'🐸' },
    ]}},
    { _id:'m2', lesson:'', type:'matching', title:'Fruits', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ pairs:[
      { word:'Apple', emoji:'🍎' }, { word:'Banana', emoji:'🍌' }, { word:'Grapes', emoji:'🍇' }, { word:'Mango', emoji:'🥭' }, { word:'Orange', emoji:'🍊' },
    ]}},
    { _id:'m3', lesson:'', type:'matching', title:'Numbers 1-5', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ pairs:[
      { word:'One', emoji:'1️⃣' }, { word:'Two', emoji:'2️⃣' }, { word:'Three', emoji:'3️⃣' }, { word:'Four', emoji:'4️⃣' }, { word:'Five', emoji:'5️⃣' },
    ]}},
    { _id:'m4', lesson:'', type:'matching', title:'Transport', grade:'UKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ pairs:[
      { word:'Car', emoji:'🚗' }, { word:'Airplane', emoji:'✈️' }, { word:'Boat', emoji:'⛵' }, { word:'Bus', emoji:'🚌' }, { word:'Bicycle', emoji:'🚲' },
    ]}},
    { _id:'m5', lesson:'', type:'matching', title:'Vegetables', grade:'UKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ pairs:[
      { word:'Carrot', emoji:'🥕' }, { word:'Tomato', emoji:'🍅' }, { word:'Corn', emoji:'🌽' }, { word:'Broccoli', emoji:'🥦' }, { word:'Onion', emoji:'🧅' },
    ]}},
  ],
  memory: [
    { _id:'me1', lesson:'', type:'memory', title:'Animal Memory', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ memoryCards:[
      {id:'a0',emoji:'🦁',pairId:'0'},{id:'b0',emoji:'🦁',pairId:'0'},
      {id:'a1',emoji:'🐘',pairId:'1'},{id:'b1',emoji:'🐘',pairId:'1'},
      {id:'a2',emoji:'🦆',pairId:'2'},{id:'b2',emoji:'🦆',pairId:'2'},
      {id:'a3',emoji:'🐬',pairId:'3'},{id:'b3',emoji:'🐬',pairId:'3'},
      {id:'a4',emoji:'🦋',pairId:'4'},{id:'b4',emoji:'🦋',pairId:'4'},
      {id:'a5',emoji:'🐢',pairId:'5'},{id:'b5',emoji:'🐢',pairId:'5'},
    ].sort(()=>Math.random()-0.5)}},
    { _id:'me2', lesson:'', type:'memory', title:'Fruit Memory', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ memoryCards:[
      {id:'a0',emoji:'🍎',pairId:'0'},{id:'b0',emoji:'🍎',pairId:'0'},
      {id:'a1',emoji:'🍌',pairId:'1'},{id:'b1',emoji:'🍌',pairId:'1'},
      {id:'a2',emoji:'🍇',pairId:'2'},{id:'b2',emoji:'🍇',pairId:'2'},
      {id:'a3',emoji:'🍊',pairId:'3'},{id:'b3',emoji:'🍊',pairId:'3'},
      {id:'a4',emoji:'🥭',pairId:'4'},{id:'b4',emoji:'🥭',pairId:'4'},
      {id:'a5',emoji:'🍓',pairId:'5'},{id:'b5',emoji:'🍓',pairId:'5'},
    ].sort(()=>Math.random()-0.5)}},
    { _id:'me3', lesson:'', type:'memory', title:'Colours Memory', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ memoryCards:[
      {id:'a0',emoji:'🔴',pairId:'0'},{id:'b0',emoji:'🔴',pairId:'0'},
      {id:'a1',emoji:'🔵',pairId:'1'},{id:'b1',emoji:'🔵',pairId:'1'},
      {id:'a2',emoji:'🟡',pairId:'2'},{id:'b2',emoji:'🟡',pairId:'2'},
      {id:'a3',emoji:'🟢',pairId:'3'},{id:'b3',emoji:'🟢',pairId:'3'},
      {id:'a4',emoji:'🟠',pairId:'4'},{id:'b4',emoji:'🟠',pairId:'4'},
      {id:'a5',emoji:'🟣',pairId:'5'},{id:'b5',emoji:'🟣',pairId:'5'},
    ].sort(()=>Math.random()-0.5)}},
    { _id:'me4', lesson:'', type:'memory', title:'Transport Memory', grade:'UKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ memoryCards:[
      {id:'a0',emoji:'🚗',pairId:'0'},{id:'b0',emoji:'🚗',pairId:'0'},
      {id:'a1',emoji:'✈️',pairId:'1'},{id:'b1',emoji:'✈️',pairId:'1'},
      {id:'a2',emoji:'⛵',pairId:'2'},{id:'b2',emoji:'⛵',pairId:'2'},
      {id:'a3',emoji:'🚌',pairId:'3'},{id:'b3',emoji:'🚌',pairId:'3'},
      {id:'a4',emoji:'🚂',pairId:'4'},{id:'b4',emoji:'🚂',pairId:'4'},
      {id:'a5',emoji:'🚀',pairId:'5'},{id:'b5',emoji:'🚀',pairId:'5'},
    ].sort(()=>Math.random()-0.5)}},
    { _id:'me5', lesson:'', type:'memory', title:'Space Memory', grade:'UKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ memoryCards:[
      {id:'a0',emoji:'⭐',pairId:'0'},{id:'b0',emoji:'⭐',pairId:'0'},
      {id:'a1',emoji:'🌙',pairId:'1'},{id:'b1',emoji:'🌙',pairId:'1'},
      {id:'a2',emoji:'🌍',pairId:'2'},{id:'b2',emoji:'🌍',pairId:'2'},
      {id:'a3',emoji:'🚀',pairId:'3'},{id:'b3',emoji:'🚀',pairId:'3'},
      {id:'a4',emoji:'🌈',pairId:'4'},{id:'b4',emoji:'🌈',pairId:'4'},
      {id:'a5',emoji:'🌟',pairId:'5'},{id:'b5',emoji:'🌟',pairId:'5'},
    ].sort(()=>Math.random()-0.5)}},
  ],
  spell: [
    { _id:'sp1', lesson:'', type:'spell', title:'Spell Animals', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ spellWords:[
      { word:'cat', emoji:'🐱', hint:'Furry pet that says Meow' },
      { word:'dog', emoji:'🐶', hint:'Loyal pet that says Woof' },
      { word:'hen', emoji:'🐔', hint:'Bird that lays eggs' },
      { word:'cow', emoji:'🐄', hint:'Gives us milk' },
      { word:'pig', emoji:'🐷', hint:'Says oink oink' },
    ]}},
    { _id:'sp2', lesson:'', type:'spell', title:'Spell Fruits', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ spellWords:[
      { word:'mango', emoji:'🥭', hint:'King of fruits, yellow inside' },
      { word:'grape', emoji:'🍇', hint:'Small round purple fruit' },
      { word:'plum',  emoji:'🫐', hint:'Small purple fruit' },
      { word:'lime',  emoji:'🍋', hint:'Small green sour fruit' },
      { word:'pear',  emoji:'🍐', hint:'Green pear-shaped fruit' },
    ]}},
    { _id:'sp3', lesson:'', type:'spell', title:'Spell Colours', grade:'LKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ spellWords:[
      { word:'red',  emoji:'🔴', hint:'Colour of an apple' },
      { word:'blue', emoji:'🔵', hint:'Colour of the sky' },
      { word:'pink', emoji:'🌸', hint:'Colour of a flamingo' },
      { word:'gold', emoji:'🌟', hint:'Shiny yellow colour' },
    ]}},
    { _id:'sp4', lesson:'', type:'spell', title:'Spell Body Parts', grade:'UKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ spellWords:[
      { word:'eye',  emoji:'👁️', hint:'We see with this' },
      { word:'ear',  emoji:'👂', hint:'We hear with this' },
      { word:'nose', emoji:'👃', hint:'We smell with this' },
      { word:'hand', emoji:'✋', hint:'We have two of these' },
      { word:'foot', emoji:'🦶', hint:'We walk on this' },
    ]}},
    { _id:'sp5', lesson:'', type:'spell', title:'Spell Vehicles', grade:'UKG', difficulty:'easy', xpReward:10, coinsReward:5, status:'published', createdAt:'', content:{ spellWords:[
      { word:'bus',  emoji:'🚌', hint:'Big yellow school vehicle' },
      { word:'car',  emoji:'🚗', hint:'Four wheels, needs petrol' },
      { word:'boat', emoji:'⛵', hint:'Travels on water' },
      { word:'bike', emoji:'🚲', hint:'Two wheels, you pedal' },
      { word:'van',  emoji:'🚐', hint:'Like a big car for families' },
    ]}},
  ],
};

/* ── Main Dashboard ─────────────────────────────────────────────────────────── */
function DashboardContent() {
  const params = useSearchParams();
  const router = useRouter();
  const grade = (params.get('grade') || 'LKG') as Grade;
  const colors = getGradeColor(grade);

  const [childId, setChildId]     = useState<string|null>(null);
  const [childInfo, setChildInfo] = useState<{name:string;avatar:string;streak:number;xp:number;coins:number;level:number}|null>(null);
  const [view, setView]           = useState<View>('home');
  const [feature, setFeature]     = useState<Feature|null>(null);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [activeActivity, setActiveActivity] = useState<Activity|null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [xpToast, setXpToast]     = useState<{xp:number;coins:number}|null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const childFromUrl = params.get('child');
    const id = childFromUrl ?? localStorage.getItem('ll_child');
    if (childFromUrl) localStorage.setItem('ll_child', childFromUrl);
    setChildId(id);
    if (!id) return;
    childrenApi.get(id)
      .then((res:unknown) => {
        const child = (res as {data:Child}).data;
        if (!params.get('grade') && child.grade) { router.replace(`/dashboard?grade=${child.grade}&child=${id}`); return; }
        setChildInfo({ name:child.name, avatar:child.avatar, streak:child.streaks.current, xp:child.xp??0, coins:child.coins??0, level:child.level??1 });
      }).catch(()=>{});
  }, [params, router]);

  async function openFeature(f: Feature) {
    setFeature(f); setView('list'); setAllActivities([]); setListLoading(true);
    try {
      let res = await lessonsApi.list({ grade, status:'published', limit:'20' }) as {data:Lesson[]};
      if (!res.data.length) res = await lessonsApi.list({ grade, status:'ready', limit:'20' }) as {data:Lesson[]};
      if (!res.data.length) res = await lessonsApi.list({ grade, limit:'20', status:'all' }) as {data:Lesson[]};
      const lessons = res.data;
      if (!lessons.length) { setAllActivities(SAMPLE[f.type]??[]); setListLoading(false); return; }
      const results = await Promise.allSettled(lessons.map(l => activitiesApi.forLesson(l._id) as Promise<{data:Activity[]}>));
      const collected: Activity[] = [];
      results.forEach(r => { if (r.status==='fulfilled') { const m=r.value.data.find(a=>a.type===f.type); if(m) collected.push(m); }});
      setAllActivities(collected.length ? collected : (SAMPLE[f.type]??[]));
    } catch { setAllActivities(SAMPLE[f.type]??[]); }
    setListLoading(false);
  }

  function openActivity(act: Activity) { setActiveActivity(act); setView('play'); }

  function handleDone(xp:number, coins:number) {
    setXpToast({xp,coins}); setShowConfetti(true);
    if (childId && activeActivity?.lesson) childrenApi.recordWatch(childId, activeActivity.lesson as string, 100).catch(()=>{});
    setTimeout(()=>{ setXpToast(null); setShowConfetti(false); }, 4000);
  }

  function goBack() {
    if (view==='play') { setView('list'); setActiveActivity(null); }
    else { setView('home'); setFeature(null); setAllActivities([]); }
  }

  /* ── Play view ── */
  if (view==='play' && activeActivity && feature) return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <style>{GLOBAL_CSS}</style>
      {showConfetti && <Confetti/>}
      <AnimatePresence>
        {xpToast && (
          <motion.div initial={{y:-70,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-70,opacity:0}}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl pointer-events-none"
            style={{ background:'linear-gradient(135deg,#F59E0B,#EF4444)' }}>
            <motion.span animate={{rotate:[0,20,-20,0]}} transition={{repeat:Infinity,duration:0.5}} className="text-2xl">⭐</motion.span>
            <div><p className="font-black text-white text-sm">+{xpToast.xp} XP earned!</p><p className="text-xs text-yellow-100">+{xpToast.coins} coins 🪙</p></div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={goBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition active:scale-90">←</button>
          <span className="text-2xl">{feature.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-800 text-sm truncate">{(activeActivity.title??'').replace(/^[📖🃏❓🎯🧠✍️]\s*/,'').replace(/—.*$/,'').trim()||'Activity'}</p>
            <p className="text-xs font-semibold" style={{color:feature.color}}>{feature.label}</p>
          </div>
          <span className="text-xs font-black text-white px-3 py-1 rounded-full shadow-sm" style={{background:feature.grad}}><span style={{color:feature.color}}>+{activeActivity.xpReward}XP</span></span>
        </div>
      </div>
      <div className="max-w-lg mx-auto">
        {activeActivity.type==='story'     ? <AnimatedStory activity={activeActivity} onDone={()=>handleDone(activeActivity.xpReward,activeActivity.coinsReward)}/>
        :activeActivity.type==='flashcard' ? <FlashcardDeck activity={activeActivity} onDone={()=>handleDone(activeActivity.xpReward,activeActivity.coinsReward)}/>
        :activeActivity.type==='quiz'      ? <QuizGame activity={activeActivity} childId={childId} colors={colors} onDone={s=>handleDone(Math.round(activeActivity.xpReward*s/100),Math.round(activeActivity.coinsReward*s/100))}/>
        :activeActivity.type==='matching'  ? <MatchingGame activity={activeActivity} onDone={()=>handleDone(activeActivity.xpReward,activeActivity.coinsReward)}/>
        :activeActivity.type==='memory'    ? <MemoryGame activity={activeActivity} onDone={()=>handleDone(activeActivity.xpReward,activeActivity.coinsReward)}/>
        :activeActivity.type==='spell'     ? <SpellGame activity={activeActivity} onDone={()=>handleDone(activeActivity.xpReward,activeActivity.coinsReward)}/>
        :null}
      </div>
      <ChildNav grade={grade} childId={childId}/>
    </div>
  );

  /* ── List view ── */
  if (view==='list' && feature) return (
    <div className="min-h-screen pb-24" style={{background:`linear-gradient(160deg, ${feature.grad.replace('linear-gradient(135deg,','').replace(')','')} )`.replace(',','15%, white 60%, ').replace(/ /g,'')||'#f9fafb'}}>
      <style>{GLOBAL_CSS}</style>
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={goBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition active:scale-90">←</button>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{background:feature.grad}}>{feature.emoji}</div>
          <div>
            <p className="font-black text-gray-800">{feature.label}</p>
            <p className="text-xs text-gray-400">{grade} · {allActivities.length} {feature.plural}</p>
          </div>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6">
        {listLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <motion.div animate={{rotate:360,scale:[1,1.1,1]}} transition={{rotate:{duration:2,repeat:Infinity,ease:'linear'},scale:{duration:1,repeat:Infinity}}} className="text-7xl">{feature.emoji}</motion.div>
            <p className="text-gray-600 font-bold text-lg">Building {feature.label}…</p>
            <div className="flex gap-1">
              {[0,1,2,3].map(i=>(
                <motion.div key={i} animate={{y:[0,-8,0]}} transition={{delay:i*0.15,duration:0.6,repeat:Infinity}} className="w-2 h-2 rounded-full" style={{backgroundColor:feature.color}}/>
              ))}
            </div>
          </div>
        ) : (
          <motion.div className="grid grid-cols-2 gap-4" initial="hidden" animate="show"
            variants={{hidden:{},show:{transition:{staggerChildren:0.06}}}}>
            {allActivities.map((act,i)=>(
              <motion.button key={act._id}
                variants={{hidden:{opacity:0,y:28,scale:0.9},show:{opacity:1,y:0,scale:1}}}
                whileHover={{scale:1.05,y:-4,boxShadow:`0 16px 40px ${feature.glow}`}}
                whileTap={{scale:0.94}}
                onClick={()=>openActivity(act)}
                className="text-left rounded-3xl p-4 bg-white shadow-sm overflow-hidden relative group"
                style={{border:`1.5px solid ${feature.color}20`}}>
                {/* Gradient top bar */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{background:feature.grad}}/>
                {/* Shine on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none overflow-hidden rounded-3xl">
                  <div style={{position:'absolute',top:0,left:'-100%',width:'60%',height:'100%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)',animation:'ll-tile-shine 0.7s ease both'}}/>
                </div>
                <div className="text-5xl mb-3 text-center relative z-10">{actIcon(act,feature)}</div>
                <p className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 relative z-10">
                  {(act.title??'').replace(/^[📖🃏❓🎯🧠✍️]\s*/,'').replace(/—.*$/,'').trim()||'Activity'}
                </p>
                <div className="mt-2 flex items-center justify-between relative z-10">
                  <span className="text-xs text-gray-400 font-medium">{actPreview(act,feature)}</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{backgroundColor:feature.color}}>+{act.xpReward}XP</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
      <ChildNav grade={grade} childId={childId}/>
    </div>
  );

  /* ── Home view ── */
  return (
    <div className="min-h-screen pb-24 relative overflow-hidden" style={{background:`linear-gradient(160deg,${colors.bg} 0%,white 50%,${colors.bg} 100%)`}}>
      <style>{GLOBAL_CSS}</style>

      {/* Floating background emojis */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
        {BG_FLOATERS.map((f,i)=>(
          <div key={i} style={{position:'absolute',left:f.l,top:f.t,fontSize:28,opacity:f.op,animation:`ll-float ${f.dur} ease-in-out ${f.del} infinite`,userSelect:'none'}}>{f.e}</div>
        ))}
      </div>

      <header className="relative z-10 sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <span className="text-xl font-display" style={{color:colors.primary}}>LittleLearners</span>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard?grade=${grade==='LKG'?'UKG':'LKG'}${childId?`&child=${childId}`:''}`}
            className="px-3 py-1.5 rounded-full text-xs font-black border-2 transition-all hover:scale-105"
            style={{borderColor:colors.primary,color:colors.primary}}>
            {grade==='LKG'?'🦋 UKG':'🐣 LKG'}
          </Link>
          {childId
            ? <Link href={`/profile/${childId}`} className="px-3 py-1.5 rounded-full text-xs font-black text-white hover:opacity-90 transition hover:scale-105 shadow-sm" style={{backgroundColor:colors.primary}}>👤 Me</Link>
            : <Link href="/onboarding" className="px-3 py-1.5 rounded-full text-xs font-black border-2 transition-all hover:scale-105" style={{borderColor:colors.primary,color:colors.primary}}>+ Setup</Link>
          }
        </div>
      </header>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* Child stats */}
        {childInfo && (
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{type:'spring',stiffness:300}}
            className="flex items-center gap-3 p-4 bg-white/90 backdrop-blur rounded-3xl shadow-lg border border-white">
            <div className="relative flex-shrink-0">
              <motion.span animate={{scale:[1,1.05,1]}} transition={{duration:2,repeat:Infinity}} className="text-4xl">{childInfo.avatar}</motion.span>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-gray-900 shadow" style={{background:'linear-gradient(135deg,#F59E0B,#EF4444)'}}>{childInfo.level}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-800 truncate">{childInfo.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div initial={{width:0}} animate={{width:`${(childInfo.xp%100)}%`}} transition={{delay:0.5,duration:1}} className="h-full rounded-full" style={{background:`linear-gradient(90deg,${colors.primary},#7C3AED)`}}/>
                </div>
                <span className="text-xs text-gray-400 font-semibold flex-shrink-0">{childInfo.xp}XP</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center"><div className="text-base font-black" style={{color:colors.primary}}>{childInfo.streak}🔥</div><div className="text-xs text-gray-400">days</div></div>
              <div className="w-px h-8 bg-gray-100"/>
              <div className="text-center"><div className="text-base font-black text-amber-500">🪙{childInfo.coins}</div><div className="text-xs text-gray-400">coins</div></div>
            </div>
          </motion.div>
        )}

        {/* Title */}
        <div className="text-center pt-2">
          <motion.h1 initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} transition={{type:'spring',stiffness:300}}
            className="text-4xl font-display pb-1"
            style={{background:'linear-gradient(135deg,#FF6B9D,#7C3AED,#06B6D4,#10B981)',backgroundSize:'300% 300%',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',animation:'ll-rainbow 4s ease infinite'}}>
            {grade==='LKG'?'🐣 LKG Learning':'🦋 UKG Learning'}
          </motion.h1>
          <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}} className="text-sm text-gray-400 font-body mt-1">
            What do you want to learn today?
          </motion.p>
        </div>

        {/* Feature tiles */}
        <motion.div className="grid grid-cols-2 gap-4 sm:grid-cols-3"
          initial="hidden" animate="show"
          variants={{hidden:{},show:{transition:{staggerChildren:0.08}}}}>
          {FEATURES.map(f=>(
            <motion.button key={f.type}
              variants={{hidden:{opacity:0,y:40,scale:0.8},show:{opacity:1,y:0,scale:1,transition:{type:'spring',stiffness:280,damping:18}}}}
              whileHover={{scale:1.07,y:-6}}
              whileTap={{scale:0.93}}
              onClick={()=>openFeature(f)}
              className="relative text-left rounded-3xl p-5 overflow-hidden group"
              style={{background:f.grad,border:`1.5px solid ${f.color}30`,boxShadow:`0 4px 20px ${f.glow}`,transition:'box-shadow 0.25s'}}>
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{boxShadow:`inset 0 0 0 2px ${f.color}60`}}/>
              {/* Shine sweep */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-3xl opacity-0 group-hover:opacity-100 pointer-events-none">
                <div style={{position:'absolute',top:'-50%',left:'-150%',width:'80%',height:'200%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)',animation:'ll-tile-shine 0.8s ease',transform:'skewX(-15deg)'}}/>
              </div>
              {/* Floating emoji bg */}
              <div className="absolute top-2 right-3 text-4xl opacity-20 group-hover:opacity-40 transition-opacity" style={{animation:`ll-float2 3s ease-in-out infinite`}}>{f.emoji}</div>
              <div className="relative">
                <div className="text-5xl mb-3">{f.emoji}</div>
                <p className="font-display text-xl leading-tight" style={{color:f.color}}>{f.label}</p>
                <p className="text-xs text-gray-500 mt-1 font-body">{f.desc}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
      <ChildNav grade={grade} childId={childId}/>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50"><motion.div animate={{scale:[1,1.2,1],rotate:[0,10,-10,0]}} transition={{duration:1,repeat:Infinity}} className="text-6xl">🌟</motion.div></div>}>
      <DashboardContent/>
    </Suspense>
  );
}
