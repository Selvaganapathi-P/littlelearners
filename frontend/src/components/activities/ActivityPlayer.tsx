'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '@/types';
import { activitiesApi } from '@/lib/api';

/* ── Shared CSS ────────────────────────────────────────────────────────────── */
const AP_CSS = `
  @keyframes ap-pop{0%,100%{transform:scale(1)}40%{transform:scale(1.28)}75%{transform:scale(0.93)}}
  @keyframes ap-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-9px)}40%{transform:translateX(9px)}60%{transform:translateX(-7px)}80%{transform:translateX(7px)}}
  @keyframes ap-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
  @keyframes ap-glow{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}50%{box-shadow:0 0 0 8px rgba(16,185,129,0.25),0 0 20px rgba(16,185,129,0.3)}}
  @keyframes ap-confetti{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(90px) rotate(600deg);opacity:0}}
  @keyframes ap-bounce-in{0%{transform:scale(0.4) translateY(20px);opacity:0}60%{transform:scale(1.12) translateY(-4px)}80%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}
  @keyframes ap-letter-pop{0%{transform:scale(0) rotate(-20deg)}60%{transform:scale(1.2) rotate(5deg)}100%{transform:scale(1) rotate(0deg)}}
  @keyframes ap-star-fly{0%{transform:translate(0,0) scale(0);opacity:1}100%{transform:translate(var(--tx),var(--ty)) scale(1.5);opacity:0}}
  @keyframes ap-pulse-border{0%,100%{border-color:rgba(16,185,129,0.3)}50%{border-color:rgba(16,185,129,1)}}
  .ap-shake{animation:ap-shake 0.45s ease both}
  .ap-pop{animation:ap-pop 0.4s ease both}
  .ap-glow-match{animation:ap-glow 1.5s ease 0.1s}
`;

const CONFETTI_COLORS = ['#FF6B9D','#7C3AED','#F59E0B','#10B981','#3B82F6','#EC4899','#06B6D4'];

function MiniConfetti({ count=24 }: { count?: number }) {
  return (
    <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:20}}>
      {Array.from({length:count}).map((_,i)=>(<div key={i} style={{
        position:'absolute',
        top:'-8px',
        left:`${(i*100/count)%100}%`,
        width: 6+i%5, height: 6+i%4,
        borderRadius: i%3===0?'50%':i%3===1?'2px':'0',
        backgroundColor: CONFETTI_COLORS[i%CONFETTI_COLORS.length],
        animation:`ap-confetti ${1.2+(i%5)*0.2}s ease-in ${(i%8)*0.1}s both`,
      }}/>))}
    </div>
  );
}

const STAR_POSITIONS = [
  ['−50px','−55px'],['0','−65px'],['50px','−55px'],
  ['−65px','0'],['65px','0'],
  ['−50px','55px'],['0','65px'],['50px','55px'],
];

function StarPopBurst({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:10}}>
      {STAR_POSITIONS.map(([tx,ty],i)=>(
        <div key={i} style={{position:'absolute',fontSize:16,
          // @ts-ignore
          '--tx':tx,'--ty':ty,
          animation:`ap-star-fly 0.65s ease-out ${i*0.04}s both`}}>
          {['⭐','💫','✨','🌟'][i%4]}
        </div>
      ))}
    </div>
  );
}

/* ── FlashcardDeck ─────────────────────────────────────────────────────────── */
export function FlashcardDeck({ activity, onDone }: { activity: Activity; onDone: () => void }) {
  const cards = activity.content.cards ?? [];
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);

  if (!cards.length) return <div className="text-center py-12 text-gray-400">No flashcards yet.</div>;

  if (done) return (
    <div className="relative text-center py-12 px-4">
      <style>{AP_CSS}</style>
      <MiniConfetti count={36}/>
      <motion.div animate={{scale:[1,1.15,1],rotate:[0,8,-8,0]}} transition={{duration:0.7,repeat:3}} className="text-7xl mb-4">🎉</motion.div>
      <h2 className="text-3xl font-black text-gray-800 mb-2">All done!</h2>
      <p className="text-gray-500 mb-2">You reviewed <strong>{cards.length}</strong> cards</p>
      <div className="flex justify-center gap-1 mb-6">
        {Array.from({length:Math.min(streak,10)}).map((_,i)=>(
          <motion.span key={i} initial={{scale:0,rotate:-45}} animate={{scale:1,rotate:0}} transition={{delay:0.3+i*0.08,type:'spring'}} className="text-2xl">⭐</motion.span>
        ))}
      </div>
      <div className="flex justify-center gap-3">
        <button onClick={()=>{setIdx(0);setFlipped(false);setDone(false);setStreak(0);}} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition active:scale-95">Again 🔄</button>
        <button onClick={onDone} className="px-8 py-3 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition active:scale-95" style={{background:'linear-gradient(135deg,#10B981,#059669)'}}>Done ✓</button>
      </div>
    </div>
  );

  const card = cards[idx];
  return (
    <div className="flex flex-col items-center gap-5 py-6 px-4">
      <style>{AP_CSS}</style>
      <div className="flex items-center justify-between w-full max-w-sm">
        <span className="text-sm text-gray-400 font-bold">{idx+1}/{cards.length}</span>
        <div className="flex-1 mx-3 bg-gray-100 h-2 rounded-full overflow-hidden">
          <motion.div className="h-2 rounded-full" style={{background:'linear-gradient(90deg,#7C3AED,#06B6D4)'}}
            animate={{width:`${((idx+1)/cards.length)*100}%`}} transition={{duration:0.4}}/>
        </div>
        {streak>0 && <span className="text-sm font-black text-orange-500">🔥{streak}</span>}
      </div>

      <div onClick={()=>setFlipped(f=>!f)} className="w-full max-w-sm cursor-pointer" style={{perspective:1000}}>
        <motion.div className="relative w-full" style={{transformStyle:'preserve-3d',height:240}}
          animate={{rotateY: flipped ? 180 : 0}} transition={{duration:0.5,type:'spring',stiffness:200,damping:20}}>
          {/* Front */}
          <div className="absolute inset-0 rounded-3xl bg-white shadow-xl flex flex-col items-center justify-center gap-3 border-2 border-gray-100" style={{backfaceVisibility:'hidden'}}>
            <motion.div animate={{y:[0,-6,0]}} transition={{duration:2,repeat:Infinity,ease:'easeInOut'}} className="text-6xl">{card.emoji||'⭐'}</motion.div>
            <p className="text-5xl font-black text-gray-800">{card.front}</p>
            <p className="text-xs text-gray-300 font-semibold">tap to flip</p>
          </div>
          {/* Back */}
          <div className="absolute inset-0 rounded-3xl shadow-xl flex flex-col items-center justify-center gap-3 p-6" style={{backfaceVisibility:'hidden',transform:'rotateY(180deg)',background:'linear-gradient(135deg,#7C3AED,#06B6D4)'}}>
            <p className="text-4xl font-black text-white text-center leading-tight">{card.back}</p>
            {card.example && <p className="text-sm text-white/80 text-center leading-relaxed">{card.example}</p>}
          </div>
        </motion.div>
      </div>

      <div className="flex gap-3">
        {idx < cards.length-1
          ? <motion.button whileTap={{scale:0.92}} whileHover={{scale:1.05}} onClick={()=>{setIdx(i=>i+1);setFlipped(false);if(flipped)setStreak(s=>s+1);}}
              className="px-8 py-3 text-white rounded-2xl font-bold shadow-md" style={{background:'linear-gradient(135deg,#7C3AED,#06B6D4)'}}>
              Next →
            </motion.button>
          : <motion.button whileTap={{scale:0.92}} whileHover={{scale:1.05}} onClick={()=>{if(flipped)setStreak(s=>s+1);setDone(true);}}
              className="px-8 py-3 text-white rounded-2xl font-bold shadow-md" style={{background:'linear-gradient(135deg,#10B981,#059669)'}}>
              Finish 🎉
            </motion.button>
        }
      </div>
    </div>
  );
}

/* ── QuizGame ───────────────────────────────────────────────────────────────── */
export function QuizGame({ activity, childId, colors, onDone }: { activity: Activity; childId: string|null; colors:{primary:string}; onDone:(score:number)=>void }) {
  const questions = activity.content.questions ?? [];
  const [qIdx, setQIdx]     = useState(0);
  const [chosen, setChosen] = useState<number|null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore]   = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake]   = useState<number|null>(null);
  const [starPop, setStarPop] = useState(false);
  const [confetti, setConfetti] = useState(false);

  if (!questions.length) return <div className="text-center py-12 text-gray-400">No questions yet.</div>;

  const q = questions[qIdx];

  async function handleSubmit(finalAnswers: number[]) {
    const correct = finalAnswers.filter((a,i)=>a===questions[i]?.correct).length;
    const calcScore = Math.round((correct/questions.length)*100);
    if (!childId) { setScore(calcScore); setShowResult(true); if(calcScore>=80)setConfetti(true); setTimeout(()=>setConfetti(false),3000); return; }
    setSubmitting(true);
    try {
      const res = await activitiesApi.submit(activity._id, childId, finalAnswers) as {data:{score:number}};
      setScore(res.data.score);
    } catch { setScore(calcScore); }
    setSubmitting(false);
    setShowResult(true);
    if(calcScore>=80){setConfetti(true);setTimeout(()=>setConfetti(false),3000);}
    onDone(calcScore);
  }

  function pick(optIdx: number) {
    if (chosen!==null) return;
    setChosen(optIdx);
    const isCorrect = optIdx === q.correct;
    if (!isCorrect) { setShake(optIdx); setTimeout(()=>setShake(null), 600); }
    else { setStarPop(true); setTimeout(()=>setStarPop(false), 800); }
    const newAnswers = [...answers, optIdx];
    setAnswers(newAnswers);
    setTimeout(()=>{
      if (qIdx < questions.length-1) { setQIdx(i=>i+1); setChosen(null); }
      else handleSubmit(newAnswers);
    }, isCorrect ? 900 : 1100);
  }

  if (showResult) {
    const correct = answers.filter((a,i)=>a===questions[i]?.correct).length;
    const emoji = score===100?'🌟':score>=80?'🎉':score>=60?'😊':'🤔';
    const msg   = score===100?'Perfect Score!':score>=80?'Excellent!':score>=60?'Well done!':'Keep trying!';
    return (
      <div className="relative flex flex-col items-center py-10 px-4 gap-4">
        <style>{AP_CSS}</style>
        {confetti && <MiniConfetti count={40}/>}
        <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:400}} className="text-8xl">{emoji}</motion.div>
        <motion.h2 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="text-3xl font-black text-gray-800">{msg}</motion.h2>
        <div className="flex justify-center gap-1">
          {Array.from({length:5}).map((_,i)=>(
            <motion.span key={i} initial={{scale:0,rotate:-45}} animate={{scale: i < Math.round(score/20) ? 1 : 0.4, rotate:0, opacity: i < Math.round(score/20) ? 1 : 0.3}} transition={{delay:0.4+i*0.1,type:'spring'}} className="text-3xl">⭐</motion.span>
          ))}
        </div>
        <p className="text-2xl font-black" style={{color:colors.primary}}>{correct}/{questions.length} correct</p>
        <div className="w-full max-w-xs bg-gray-100 rounded-full h-4 overflow-hidden">
          <motion.div className="h-4 rounded-full" style={{background:`linear-gradient(90deg,${colors.primary},#7C3AED)`}}
            initial={{width:0}} animate={{width:`${score}%`}} transition={{delay:0.5,duration:0.8}}/>
        </div>
        <div className="flex gap-3 mt-2">
          <button onClick={()=>{setQIdx(0);setChosen(null);setAnswers([]);setShowResult(false);setScore(0);}}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition active:scale-95">Try Again</button>
          <button onClick={()=>onDone(score)} className="px-8 py-3 text-white rounded-2xl font-bold shadow-lg transition active:scale-95" style={{background:`linear-gradient(135deg,${colors.primary},#7C3AED)`}}>Continue →</button>
        </div>
      </div>
    );
  }

  if (submitting) return <div className="text-center py-16 text-gray-400 text-lg font-semibold">Saving results…</div>;

  return (
    <div className="flex flex-col gap-5 py-6 px-4 max-w-lg mx-auto">
      <style>{AP_CSS}</style>
      {/* Progress */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-400">Q{qIdx+1}/{questions.length}</span>
        <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
          <motion.div className="h-3 rounded-full" style={{background:`linear-gradient(90deg,${colors.primary},#7C3AED)`}}
            animate={{width:`${((qIdx)/questions.length)*100}%`}} transition={{duration:0.4}}/>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={qIdx} initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-40}} transition={{duration:0.28}}>
          {q.emoji && (
            <div className="relative flex justify-center mb-3">
              <StarPopBurst active={starPop}/>
              <motion.div animate={{y:[0,-8,0]}} transition={{duration:2,repeat:Infinity,ease:'easeInOut'}} className="text-6xl">{q.emoji}</motion.div>
            </div>
          )}
          <p className="text-xl font-black text-gray-800 text-center mb-5 leading-snug">{q.question}</p>
          <div className="grid grid-cols-1 gap-3">
            {q.options.map((opt,i)=>{
              const isCorrect = i===q.correct;
              const isChosen  = i===chosen;
              const isShaking = i===shake;
              let bg = 'bg-white border-2 border-gray-100';
              let extra = '';
              if (chosen!==null && isCorrect) { bg='border-2 border-green-400'; extra='ap-glow-match'; }
              else if (isChosen && !isCorrect) bg='bg-red-50 border-2 border-red-400';
              return (
                <motion.button key={i} onClick={()=>pick(i)}
                  whileHover={chosen===null?{scale:1.02,boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}:{}}
                  whileTap={chosen===null?{scale:0.97}:{}}
                  className={`relative w-full text-left px-5 py-4 rounded-2xl font-bold text-gray-800 transition-all ${bg} ${isShaking?'ap-shake':''} ${extra} ${chosen===null?'hover:border-purple-300 hover:bg-purple-50':''}`}>
                  {chosen!==null && isCorrect && (
                    <motion.span initial={{scale:0}} animate={{scale:1}} className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">✅</motion.span>
                  )}
                  {isChosen && !isCorrect && (
                    <motion.span initial={{scale:0}} animate={{scale:1}} className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">❌</motion.span>
                  )}
                  <span className="inline-flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-black flex-shrink-0" style={{borderColor:colors.primary,color:colors.primary}}>{['A','B','C','D'][i]}</span>
                    {opt}
                  </span>
                </motion.button>
              );
            })}
          </div>
          {chosen!==null && q.explanation && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700 font-medium leading-relaxed">
              💡 {q.explanation}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── MatchingGame ───────────────────────────────────────────────────────────── */
export function MatchingGame({ activity, onDone }: { activity: Activity; onDone: () => void }) {
  const pairs = activity.content.pairs ?? [];
  const [selected, setSelected] = useState<string|null>(null);
  const [matched, setMatched]   = useState<Set<string>>(new Set());
  const [wrong, setWrong]       = useState<string|null>(null);
  const [celebrating, setCelebrating] = useState(false);

  const words  = pairs.map(p=>p.word);
  const emojis = pairs.map(p=>p.emoji);
  const [shuffledWords]  = useState(()=>[...words].sort(()=>Math.random()-0.5));
  const [shuffledEmojis] = useState(()=>[...emojis].sort(()=>Math.random()-0.5));

  function pick(val: string) {
    if (matched.has(val)) return;
    if (!selected) { setSelected(val); return; }
    const wordPick  = words.includes(selected)  ? selected : val;
    const emojiPick = emojis.includes(selected) ? selected : val;
    const pair = pairs.find(p=>p.word===wordPick && p.emoji===emojiPick);
    if (pair) {
      const nm = new Set([...matched, pair.word, pair.emoji]);
      setMatched(nm);
      setSelected(null);
      if (nm.size===pairs.length*2) { setTimeout(()=>{ setCelebrating(true); setTimeout(onDone,2000); }, 400); }
    } else {
      setWrong(val);
      setTimeout(()=>{ setSelected(null); setWrong(null); }, 750);
    }
  }

  return (
    <div className="py-6 px-4 relative">
      <style>{AP_CSS}</style>
      {celebrating && <MiniConfetti count={36}/>}
      <p className="text-center text-sm text-gray-400 font-bold mb-2">
        {matched.size/2}/{pairs.length} matched
      </p>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
        <motion.div className="h-2 rounded-full" style={{background:'linear-gradient(90deg,#10B981,#06B6D4)'}}
          animate={{width:`${(matched.size/2/pairs.length)*100}%`}} transition={{duration:0.4}}/>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <div className="flex flex-col gap-3">
          {shuffledWords.map(w=>{
            const isMatched = matched.has(w);
            const isSel     = selected===w;
            const isWrong   = wrong===w;
            return (
              <motion.button key={w} onClick={()=>pick(w)}
                whileHover={!isMatched?{scale:1.04}:{}}
                whileTap={!isMatched?{scale:0.95}:{}}
                animate={isMatched?{scale:[1,1.08,1]}:{}}
                className={`py-3 px-4 rounded-2xl font-bold text-sm transition-all ${isMatched?'text-green-600':'text-gray-700'} ${isWrong?'ap-shake':''}`}
                style={{
                  background: isMatched?'linear-gradient(135deg,#D1FAE5,#A7F3D0)':isSel?'linear-gradient(135deg,#7C3AED,#06B6D4)':'white',
                  border:`2px solid ${isMatched?'#34D399':isSel?'transparent':isWrong?'#FCA5A5':'#e5e7eb'}`,
                  color: isSel?'white':undefined,
                  boxShadow: isSel?'0 4px 16px rgba(124,58,237,0.3)':isMatched?'0 2px 8px rgba(16,185,129,0.2)':'none',
                }}>
                {isMatched && '✓ '}{w}
              </motion.button>
            );
          })}
        </div>
        <div className="flex flex-col gap-3">
          {shuffledEmojis.map(e=>{
            const isMatched = matched.has(e);
            const isSel     = selected===e;
            const isWrong   = wrong===e;
            return (
              <motion.button key={e} onClick={()=>pick(e)}
                whileHover={!isMatched?{scale:1.08}:{}}
                whileTap={!isMatched?{scale:0.92}:{}}
                animate={isMatched?{scale:[1,1.1,1]}:{}}
                className={`py-3 px-4 rounded-2xl text-3xl transition-all ${isWrong?'ap-shake':''}`}
                style={{
                  background: isMatched?'linear-gradient(135deg,#D1FAE5,#A7F3D0)':isSel?'linear-gradient(135deg,#F59E0B,#EF4444)':'white',
                  border:`2px solid ${isMatched?'#34D399':isSel?'transparent':isWrong?'#FCA5A5':'#e5e7eb'}`,
                  opacity: isMatched?0.6:1,
                  boxShadow: isSel?'0 4px 16px rgba(245,158,11,0.4)':'none',
                }}>
                {e}
              </motion.button>
            );
          })}
        </div>
      </div>

      {celebrating && (
        <motion.div initial={{opacity:0,scale:0.5}} animate={{opacity:1,scale:1}} transition={{type:'spring',stiffness:300}} className="text-center mt-8">
          <div className="text-6xl mb-2">🎯</div>
          <p className="text-2xl font-black text-gray-800">All matched! 🎉</p>
          <div className="flex justify-center gap-1 mt-2">
            {[0,1,2,3,4].map(i=><motion.span key={i} initial={{scale:0}} animate={{scale:1}} transition={{delay:0.1+i*0.08,type:'spring'}} className="text-2xl">⭐</motion.span>)}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ── MemoryGame ─────────────────────────────────────────────────────────────── */
export function MemoryGame({ activity, onDone }: { activity: Activity; onDone: () => void }) {
  const rawCards = activity.content.memoryCards ?? [];
  const pairs    = activity.content.pairs ?? [];
  const [cards]  = useState(()=>{
    const base = rawCards.length ? rawCards : [
      ...pairs.map((p,i)=>({id:`a${i}`,emoji:p.emoji,pairId:String(i)})),
      ...pairs.map((p,i)=>({id:`b${i}`,emoji:p.emoji,pairId:String(i)})),
    ].sort(()=>Math.random()-0.5);
    return base;
  });

  const [flipped,  setFlipped]  = useState<string[]>([]);
  const [matched,  setMatched]  = useState<Set<string>>(new Set());
  const [wrong,    setWrong]    = useState<Set<string>>(new Set());
  const [disabled, setDisabled] = useState(false);
  const [moves,    setMoves]    = useState(0);
  const [done,     setDone]     = useState(false);

  function flip(id: string) {
    if (disabled||flipped.includes(id)||matched.has(id)) return;
    const next = [...flipped,id];
    setFlipped(next);
    if (next.length===2) {
      setMoves(m=>m+1);
      setDisabled(true);
      const [a,b] = next.map(cid=>cards.find(c=>c.id===cid)!);
      if (a.pairId===b.pairId) {
        const nm = new Set([...matched,a.id,b.id]);
        setMatched(nm);
        setFlipped([]);
        setDisabled(false);
        if (nm.size===cards.length) setTimeout(()=>{ setDone(true); setTimeout(onDone,2000); },600);
      } else {
        setWrong(new Set([a.id,b.id]));
        setTimeout(()=>{ setFlipped([]); setDisabled(false); setWrong(new Set()); },1000);
      }
    }
  }

  const cols = cards.length<=8?4:4;

  if (done) return (
    <div className="relative flex flex-col items-center py-10 px-4 gap-4 text-center">
      <style>{AP_CSS}</style>
      <MiniConfetti count={32}/>
      <motion.div animate={{rotate:[0,10,-10,0],scale:[1,1.15,1]}} transition={{duration:0.6,repeat:3}} className="text-7xl">🧠</motion.div>
      <h2 className="text-3xl font-black text-gray-800">All Pairs Found!</h2>
      <p className="text-gray-500">Finished in <strong>{moves}</strong> moves</p>
      <div className="flex justify-center gap-1">
        {Array.from({length:5}).map((_,i)=>(
          <motion.span key={i} initial={{scale:0}} animate={{scale:1}} transition={{delay:0.4+i*0.1,type:'spring'}} className="text-2xl">⭐</motion.span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="py-4 px-3 max-w-md mx-auto">
      <style>{AP_CSS}</style>
      <div className="flex justify-between items-center mb-4 px-1">
        <span className="text-sm text-gray-400 font-bold">🔄 {moves} moves</span>
        <span className="text-sm font-bold" style={{color:'#10B981'}}>{matched.size/2}/{cards.length/2} pairs</span>
      </div>
      <div className="grid gap-2" style={{gridTemplateColumns:`repeat(${cols},1fr)`}}>
        {cards.map(card=>{
          const isFlipped  = flipped.includes(card.id) || matched.has(card.id);
          const isMatched  = matched.has(card.id);
          const isWrong    = wrong.has(card.id);
          return (
            <motion.button key={card.id} onClick={()=>flip(card.id)}
              whileTap={!isFlipped?{scale:0.9}:{}}
              animate={isMatched?{scale:[1,1.05,1]}:{}}
              transition={isMatched?{duration:0.3}:{}}
              className="aspect-square rounded-2xl text-3xl flex items-center justify-center font-bold transition-all duration-300 relative overflow-hidden"
              style={{
                background: isMatched?'linear-gradient(135deg,#D1FAE5,#A7F3D0)':isWrong?'linear-gradient(135deg,#FEE2E2,#FECACA)':isFlipped?'white':'linear-gradient(135deg,#7C3AED,#06B6D4)',
                border:`2px solid ${isMatched?'#34D399':isWrong?'#FCA5A5':isFlipped?'#e5e7eb':'transparent'}`,
                boxShadow: isMatched?'0 4px 16px rgba(16,185,129,0.3)':isWrong?'0 2px 8px rgba(239,68,68,0.3)':isFlipped?'0 2px 8px rgba(0,0,0,0.08)':'0 4px 12px rgba(124,58,237,0.3)',
              }}>
              {isFlipped ? (
                <motion.span initial={{scale:0,rotate:-20}} animate={{scale:1,rotate:0}} transition={{type:'spring',stiffness:400}} className="text-2xl">{card.emoji}</motion.span>
              ) : (
                <span className="text-white font-black text-xl">?</span>
              )}
              {isMatched && <div className="absolute inset-0 flex items-center justify-center"><span style={{position:'absolute',top:2,right:4,fontSize:12}}>✓</span></div>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ── SpellGame ──────────────────────────────────────────────────────────────── */
export function SpellGame({ activity, onDone }: { activity: Activity; onDone: () => void }) {
  const spellWords = activity.content.spellWords ?? [];
  const pairs      = activity.content.pairs ?? [];
  const words: { word: string; emoji: string; hint?: string }[] =
    spellWords.length ? spellWords : pairs.slice(0,5).map(p=>({word:p.word,emoji:p.emoji}));

  const [idx, setIdx]     = useState(0);
  const [letters, setLetters] = useState<string[]>([]);
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [wrong, setWrong]   = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore]   = useState(0);
  const [done, setDone]     = useState(false);
  const [newLetterIdx, setNewLetterIdx] = useState<number|null>(null);

  useEffect(()=>{
    if (!words[idx]) return;
    const w = words[idx].word.toUpperCase();
    setLetters([]);
    setShuffled([...w.split('')].sort(()=>Math.random()-0.5));
    setWrong(false);
    setCorrect(false);
  },[idx, words]);

  function addLetter(l:string, li:number) {
    const next = [...letters, l];
    setLetters(next);
    setNewLetterIdx(next.length-1);
    setTimeout(()=>setNewLetterIdx(null), 400);
    const remaining = [...shuffled];
    remaining.splice(li,1);
    setShuffled(remaining);
    const target = words[idx].word.toUpperCase();
    if (next.length===target.length) {
      if (next.join('')===target) {
        setCorrect(true);
        setScore(s=>s+1);
        setTimeout(()=>{
          if (idx<words.length-1) setIdx(i=>i+1);
          else setDone(true);
        }, 900);
      } else {
        setWrong(true);
        setTimeout(()=>{
          const w2 = words[idx].word.toUpperCase();
          setLetters([]);
          setShuffled([...w2.split('')].sort(()=>Math.random()-0.5));
          setWrong(false);
        }, 800);
      }
    }
  }

  function removeLetter(li:number) {
    if (correct||wrong) return;
    const l = letters[li];
    const next = [...letters]; next.splice(li,1);
    setLetters(next);
    setShuffled(s=>[...s,l]);
  }

  if (!words.length) return <div className="text-center py-12 text-gray-400">No words yet.</div>;

  if (done) return (
    <div className="relative text-center py-12 px-4">
      <style>{AP_CSS}</style>
      <MiniConfetti count={36}/>
      <motion.div animate={{rotate:[0,10,-10,0],scale:[1,1.15,1]}} transition={{duration:0.7,repeat:3}} className="text-7xl mb-4">✍️</motion.div>
      <h2 className="text-3xl font-black text-gray-800 mb-2">Spelling Master!</h2>
      <p className="text-gray-500 mb-4">{score}/{words.length} words correct</p>
      <div className="flex justify-center gap-1 mb-6">
        {Array.from({length:Math.min(score,10)}).map((_,i)=>(
          <motion.span key={i} initial={{scale:0}} animate={{scale:1}} transition={{delay:0.2+i*0.1,type:'spring'}} className="text-2xl">⭐</motion.span>
        ))}
      </div>
      <div className="flex justify-center gap-3">
        <button onClick={()=>{setIdx(0);setScore(0);setDone(false);}} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition active:scale-95">Again 🔄</button>
        <button onClick={onDone} className="px-8 py-3 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition active:scale-95" style={{background:'linear-gradient(135deg,#EC4899,#7C3AED)'}}>Done ✓</button>
      </div>
    </div>
  );

  const current = words[idx];
  const target  = current.word.toUpperCase();

  return (
    <div className="py-6 px-4 max-w-md mx-auto">
      <style>{AP_CSS}</style>
      <div className="flex justify-between text-xs text-gray-400 font-bold mb-4">
        <span>Word {idx+1} of {words.length}</span>
        <span className="text-green-600">{score} correct ✓</span>
      </div>

      {/* XP/progress bar */}
      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-6">
        <motion.div className="h-2 rounded-full" style={{background:'linear-gradient(90deg,#EC4899,#7C3AED)'}}
          animate={{width:`${(idx/words.length)*100}%`}} transition={{duration:0.4}}/>
      </div>

      {/* Emoji with floating animation */}
      <div className="relative text-center mb-6">
        <motion.div animate={{y:[0,-10,0]}} transition={{duration:2,repeat:Infinity,ease:'easeInOut'}} className="text-8xl mb-1">{current.emoji}</motion.div>
        {correct && (
          <motion.div initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}} className="absolute -top-2 left-1/2 -translate-x-1/2 text-green-600 font-black text-lg">✅ Correct!</motion.div>
        )}
        {current.hint && (
          <p className="text-xs text-gray-400 italic mt-1">{current.hint}</p>
        )}
      </div>

      {/* Letter slots */}
      <div className="flex justify-center gap-1.5 mb-6 flex-wrap">
        {target.split('').map((_,i)=>(
          <motion.button key={i} onClick={()=>i<letters.length&&removeLetter(i)}
            animate={i===newLetterIdx?{scale:[0.5,1.2,1]}:wrong&&letters[i]?{x:[-5,5,-5,5,0]}:{}}
            transition={{duration:0.35}}
            className={`w-11 h-11 rounded-xl border-2 font-black text-lg flex items-center justify-center transition-all shadow-sm ${
              letters[i]
                ? correct?'bg-green-50 border-green-400 text-green-700':wrong?'bg-red-50 border-red-400 text-red-600':'bg-purple-50 border-purple-400 text-purple-700'
                : 'bg-gray-50 border-gray-200 text-gray-300'
            }`}>
            {letters[i]||<span className="text-gray-200">_</span>}
          </motion.button>
        ))}
      </div>

      {/* Shuffled letters */}
      <div className="flex justify-center flex-wrap gap-2">
        {shuffled.map((l,i)=>(
          <motion.button key={`${l}-${i}`}
            whileHover={{scale:1.12,y:-3}}
            whileTap={{scale:0.88}}
            onClick={()=>addLetter(l,i)}
            className="w-12 h-12 rounded-xl bg-white border-2 border-purple-200 font-black text-xl text-purple-700 hover:bg-purple-50 hover:border-purple-500 transition-all shadow-md hover:shadow-lg active:shadow-sm">
            {l}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ── StoryReader (legacy for watch page) ─────────────────────────────────────── */
export function StoryReader({ activity }: { activity: Activity }) {
  const pages = activity.content.pages ?? [];
  const [page, setPage] = useState(0);
  if (!pages.length) return <div className="text-center py-12 text-gray-400">No story pages yet.</div>;
  const p = pages[page];
  const PAGE_BG = ['#FFF0F5','#F5F0FF','#FFFBEB','#F0FDF4','#EFF6FF','#FDF2F8'];
  return (
    <div className="flex flex-col items-center gap-5 py-6 px-4">
      <style>{AP_CSS}</style>
      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{opacity:0,x:50}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-50}} transition={{duration:0.3}}
          className="w-full max-w-lg rounded-3xl p-8 text-center shadow-xl" style={{backgroundColor: p.bg||PAGE_BG[page%PAGE_BG.length],minHeight:220}}>
          <motion.div animate={{y:[0,-12,0]}} transition={{duration:2,repeat:Infinity,ease:'easeInOut'}} className="text-7xl mb-4">{p.emoji||'📖'}</motion.div>
          <p className="text-xl font-bold text-gray-800 leading-relaxed">{p.text}</p>
        </motion.div>
      </AnimatePresence>
      <div className="flex items-center gap-4">
        <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} className="w-12 h-12 rounded-full bg-white shadow-md text-2xl disabled:opacity-30 hover:shadow-lg transition active:scale-90">◀</button>
        <span className="text-sm text-gray-500 font-bold min-w-[50px] text-center">{page+1}/{pages.length}</span>
        <button onClick={()=>setPage(p=>Math.min(pages.length-1,p+1))} disabled={page===pages.length-1} className="w-12 h-12 rounded-full bg-white shadow-md text-2xl disabled:opacity-30 hover:shadow-lg transition active:scale-90">▶</button>
      </div>
      <div className="flex gap-2">
        {pages.map((_,i)=><motion.div key={i} animate={{width:i===page?24:8,backgroundColor:i===page?'#FF6B9D':'#e5e7eb'}} className="h-2 rounded-full" transition={{duration:0.3}}/>)}
      </div>
    </div>
  );
}
