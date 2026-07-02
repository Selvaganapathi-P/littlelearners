'use client';

import { useEffect, useState } from 'react';
import type { ContentCalendarSuggestion } from '@/types';
import { VIDEO_FORMAT_ICONS, VIDEO_FORMAT_LABELS } from '@/types';
import { calendarApi, compilationsApi } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';

export default function CalendarPage() {
  const [suggestion, setSuggestion] = useState<ContentCalendarSuggestion | null>(null);
  const [history, setHistory] = useState<ContentCalendarSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [openHistoryId, setOpenHistoryId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      calendarApi.suggest({ region: 'IN' }),
      calendarApi.list('IN'),
    ]).then(([suggestRes, listRes]) => {
      const current = (suggestRes as { data: ContentCalendarSuggestion }).data;
      const all = (listRes as { data: ContentCalendarSuggestion[] }).data ?? [];
      setSuggestion(current);
      // History = all weeks except the current one
      setHistory(all.filter(s => s._id !== current._id));
    }).finally(() => setLoading(false));
  }, []);

  async function handleAutoCompile() {
    setCompiling(true);
    try {
      const res = await compilationsApi.autoGenerate() as { created?: number };
      const count = res.created ?? 0;
      toast(count > 0 ? `${count} new compilation${count > 1 ? 's' : ''} created 🎬` : 'No new compilations — need 4+ lessons with the same tag', count > 0 ? 'success' : 'info');
    } catch {
      toast('Auto-compile failed', 'error');
    } finally {
      setCompiling(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl text-brand-pink">Content Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAutoCompile}
            disabled={compiling}
            className="px-4 py-2 bg-brand-purple text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {compiling ? '⏳ Running…' : '📋 Auto-Compile Tags'}
          </button>
          <a href="/studio" className="text-sm text-gray-500 hover:text-brand-pink transition-colors">← Staff Studio</a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-5xl animate-bounce">📅</div>
          </div>
        ) : !suggestion ? (
          <div className="text-center py-20 text-gray-400">No suggestions yet.</div>
        ) : (
          <>
            {/* Festival alert */}
            {suggestion.upcomingFestival && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">🎉</span>
                  <div>
                    <h2 className="text-xl font-bold text-orange-800">{suggestion.upcomingFestival.name} is coming up!</h2>
                    <p className="text-sm text-orange-600">{formatDate(suggestion.upcomingFestival.date)}</p>
                  </div>
                </div>
                <p className="text-sm text-orange-700 font-body">
                  Create a Festival Special video now so it&apos;s ready in time. Suggested: {suggestion.upcomingFestival.suggestedFormats.map(f => VIDEO_FORMAT_LABELS[f]).join(', ')}.
                </p>
              </div>
            )}

            {/* This week's mix */}
            <div className="bg-white rounded-3xl p-6 card-shadow">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-gray-800">This Week&apos;s Suggested Mix</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  suggestion.status === 'acknowledged' ? 'bg-green-50 text-green-600' :
                  suggestion.status === 'acted' ? 'bg-brand-pink/10 text-brand-pink' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {suggestion.status}
                </span>
              </div>
              <p className="text-sm text-gray-400 font-body mb-6">Week of {formatDate(suggestion.weekOf)}</p>
              <div className="space-y-4">
                {suggestion.suggestedMix.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="text-3xl w-10 text-center">{VIDEO_FORMAT_ICONS[item.videoFormat]}</div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{VIDEO_FORMAT_LABELS[item.videoFormat]}</p>
                      {item.rationale && <p className="text-xs text-gray-500 font-body">{item.rationale}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: item.count }).map((_, j) => (
                        <span key={j} className="w-3 h-3 rounded-full bg-brand-pink" />
                      ))}
                      <span className="ml-2 text-sm font-bold text-gray-600">×{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <a href="/studio"
                className="inline-block px-8 py-4 bg-brand-pink text-white rounded-2xl font-bold text-lg hover:bg-pink-600 transition-colors card-shadow-sm">
                Start Creating →
              </a>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-700 mb-4">Past Weeks</h2>
                <div className="space-y-2">
                  {history.map(week => (
                    <div key={week._id} className="bg-white rounded-3xl card-shadow overflow-hidden">
                      <button
                        onClick={() => setOpenHistoryId(openHistoryId === week._id ? null : week._id)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">📅</span>
                          <div className="text-left">
                            <p className="font-semibold text-gray-700 text-sm">Week of {formatDate(week.weekOf)}</p>
                            <p className="text-xs text-gray-400 font-body mt-0.5">
                              {week.suggestedMix.length} formats suggested
                              {week.upcomingFestival ? ` · 🎉 ${week.upcomingFestival.name}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            week.status === 'acknowledged' ? 'bg-green-50 text-green-600' :
                            week.status === 'acted' ? 'bg-brand-pink/10 text-brand-pink' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {week.status}
                          </span>
                          <span className="text-gray-400 text-sm">{openHistoryId === week._id ? '▲' : '▼'}</span>
                        </div>
                      </button>

                      {openHistoryId === week._id && (
                        <div className="px-5 pb-5 border-t border-gray-50">
                          <div className="pt-4 space-y-2">
                            {week.suggestedMix.map((item, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                                <span className="text-xl">{VIDEO_FORMAT_ICONS[item.videoFormat]}</span>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-gray-700">{VIDEO_FORMAT_LABELS[item.videoFormat]}</p>
                                  {item.rationale && <p className="text-xs text-gray-400 font-body">{item.rationale}</p>}
                                </div>
                                <span className="text-sm font-bold text-gray-500">×{item.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
