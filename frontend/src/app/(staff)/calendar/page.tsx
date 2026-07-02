'use client';

import { useEffect, useState } from 'react';
import type { ContentCalendarSuggestion } from '@/types';
import { VIDEO_FORMAT_ICONS, VIDEO_FORMAT_LABELS } from '@/types';
import { calendarApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function CalendarPage() {
  const [suggestion, setSuggestion] = useState<ContentCalendarSuggestion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calendarApi.suggest({ region: 'IN' })
      .then((res: unknown) => setSuggestion((res as { data: ContentCalendarSuggestion }).data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl text-brand-pink">Content Calendar</h1>
        <a href="/studio" className="text-sm text-gray-500 hover:text-brand-pink transition-colors">← Staff Studio</a>
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

            {/* Weekly mix */}
            <div className="bg-white rounded-3xl p-6 card-shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-1">This Week&apos;s Suggested Mix</h2>
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
          </>
        )}
      </div>
    </div>
  );
}
