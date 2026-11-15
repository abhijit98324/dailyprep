import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { DEFAULT_EXAMS } from '../data/seedExams';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorBanner from '../components/common/ErrorBanner';
import type { Exam, LeaderboardEntry } from '../types';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>(DEFAULT_EXAMS);
  const [examId, setExamId] = useState(user?.primaryExam || 'ssc');
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ exams: Exam[] }>('/api/exams')
      .then((res) => {
        if (res.exams?.length) setExams(res.exams);
      })
      .catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ entries: LeaderboardEntry[] }>(
        `/api/leaderboard?examId=${encodeURIComponent(examId)}&period=${period}`
      );
      setRows(res.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [examId, period]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <Trophy className="h-6 w-6 text-amber-600" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leaderboard</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Select exam"
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm min-h-[44px]"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.shortName || ex.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            {(['daily', 'weekly'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors min-h-[36px] ${
                  period === p
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <ErrorBanner message={error} onRetry={load} />
      </div>

      {loading ? (
        <LoadingSpinner label="Loading rankings..." />
      ) : !rows.length ? (
        <EmptyState
          title="No Rankings Yet"
          description="Complete today's daily quiz or a mock test for this exam to claim the top rank."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
          {rows.map((r, idx) => (
            <div
              key={r.id}
              className={`flex items-center justify-between p-4 ${
                r.userId === user?.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-9 text-sm font-bold tabular-nums text-slate-500 dark:text-slate-400">
                  #{idx + 1}
                </span>
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  {r.displayName}
                  {r.userId === user?.id ? ' (You)' : ''}
                </span>
              </div>
              <span className="font-bold text-sm text-blue-700 dark:text-blue-400 tabular-nums">
                {r.score} pts
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}