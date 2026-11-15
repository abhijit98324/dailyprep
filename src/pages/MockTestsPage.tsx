import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, Lock, MinusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorBanner from '../components/common/ErrorBanner';
import PaywallModal from '../components/common/PaywallModal';
import type { Quiz } from '../types';

export default function MockTestsPage() {
  const { user, isPremium } = useAuth();
  const [mocks, setMocks] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);

  const examId = user?.primaryExam || user?.selectedExams?.[0] || 'ssc';

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ mocks: Quiz[] }>(`/api/mock-tests?examId=${encodeURIComponent(examId)}`);
      setMocks(res.mocks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mock tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [examId]);

  if (loading) return <LoadingSpinner label="Loading mock tests..." />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Full-Length Mock Tests</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Exam-pattern timed tests with question palette, sectional timing, and negative marking.
          </p>
        </div>
        {!isPremium && (
          <Link
            to="/pricing"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 min-h-[44px]"
          >
            Unlock Mocks (₹200/mo)
          </Link>
        )}
      </div>

      <div className="mb-4">
        <ErrorBanner message={error} onRetry={load} />
      </div>

      {!mocks.length ? (
        <EmptyState
          title="No Mock Tests Published Yet"
          description="The admin hasn't published a mock test for your selected exam yet. Switch exams from your dashboard or check back soon."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {mocks.map((m) => (
            <div
              key={m.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                  <span className="text-blue-700 dark:text-blue-400 uppercase">{m.examId}</span>
                  {!isPremium && (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Lock className="h-3.5 w-3.5" /> Premium
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{m.title}</h2>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> {m.questionIds?.length || 0} Questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {m.durationMinutes || 60} mins
                  </span>
                  <span className="flex items-center gap-1">
                    <MinusCircle className="h-3.5 w-3.5" /> -{m.negativeMarks ?? 0.25} Negative
                  </span>
                </div>
              </div>

              <div className="mt-5">
                {isPremium ? (
                  <Link
                    to={`/mock-test/${m.id}`}
                    className="block text-center py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 min-h-[44px] leading-6"
                  >
                    Start Mock Test
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPaywall(true)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold hover:bg-amber-600 hover:text-white transition-colors min-h-[44px]"
                  >
                    Unlock Mock Test
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="Full-Length Mock Tests Require Premium"
      />
    </div>
  );
}