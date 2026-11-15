import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorBanner from '../components/common/ErrorBanner';
import type { Bookmark } from '../types';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ bookmarks: Bookmark[] }>('/api/bookmarks');
      setBookmarks(res.bookmarks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (bm: Bookmark) => {
    await apiFetch('/api/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify({ questionId: bm.questionId }),
    });
    setBookmarks((prev) => prev.filter((item) => item.id !== bm.id));
  };

  if (loading) return <LoadingSpinner label="Loading saved bookmarks..." />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Saved Bookmarks</h1>
      <div className="mb-4">
        <ErrorBanner message={error} onRetry={load} />
      </div>

      {!bookmarks.length ? (
        <EmptyState
          title="No Bookmarks Yet"
          description="Tap the bookmark button on any question during a quiz or mock test to save it here for revision."
        />
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bm) => {
            const q = bm.questionData;
            return (
              <div
                key={bm.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <strong className="text-blue-700 dark:text-blue-400 uppercase">{q.examId}</strong>
                    <span aria-hidden="true"> · </span>
                    {q.subject}
                    <span aria-hidden="true"> · </span>
                    {q.topic}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(bm)}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Remove bookmark"
                    aria-label="Remove bookmark"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-medium text-slate-900 dark:text-slate-100 mb-3 whitespace-pre-line">
                  {q.question}
                </p>
                <div className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold mb-2">
                  Answer: {q.correctOption}. {q[`option${q.correctOption}`]}
                </div>
                {q.explanation && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">{q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}