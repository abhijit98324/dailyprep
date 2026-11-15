import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Clock, Flag, Target, XCircle } from 'lucide-react';
import { apiFetch } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBanner from '../components/common/ErrorBanner';
import ReportErrorModal from '../components/common/ReportErrorModal';
import type { Attempt, Question } from '../types';

export default function ResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportQ, setReportQ] = useState<Question | null>(null);

  useEffect(() => {
    apiFetch<{ attempt: Attempt; questions: Question[] }>(`/api/attempts/${attemptId}`)
      .then((res) => {
        setAttempt(res.attempt);
        setQuestions(res.questions || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Result not found'))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return <LoadingSpinner label="Loading your report card..." />;
  if (error || !attempt) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <ErrorBanner message={error || 'Result not found'} />
      </div>
    );
  }

  const avgTime = attempt.totalQuestions
    ? Math.round((attempt.totalTime || 0) / attempt.totalQuestions)
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              {attempt.quizType === 'mock' ? 'Mock Test Report' : 'Daily Quiz Report'} · {attempt.date}
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {attempt.quizTitle}
            </h1>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 min-h-[44px]"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">Score</div>
            <div className="text-2xl font-bold mt-1 tabular-nums text-slate-900 dark:text-white">
              {attempt.score}{' '}
              <span className="text-sm font-normal text-slate-400">/ {attempt.maxScore}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Target className="h-3.5 w-3.5" /> Accuracy
            </div>
            <div className="text-2xl font-bold mt-1 tabular-nums text-slate-900 dark:text-white">
              {attempt.accuracy}%
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Avg Time / Q
            </div>
            <div className="text-2xl font-bold mt-1 tabular-nums text-slate-900 dark:text-white">
              {avgTime}s
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">Correct / Wrong</div>
            <div className="text-2xl font-bold mt-1 tabular-nums">
              <span className="text-emerald-600 dark:text-emerald-400">{attempt.correctCount}</span>{' '}
              <span className="text-slate-400">/</span>{' '}
              <span className="text-red-600 dark:text-red-400">{attempt.wrongCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section Breakdown */}
      {attempt.sectionBreakdown && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">
            Section-Wise Breakdown
          </h2>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {Object.entries(attempt.sectionBreakdown).map(([sec, stats]) => (
              <div key={sec} className="py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{sec}</span>
                <div className="flex gap-4 text-xs tabular-nums">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    Correct: {stats.correct}
                  </span>
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    Wrong: {stats.wrong}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">Total: {stats.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solutions Review */}
      <div className="space-y-4">
        <h2 className="font-bold text-lg text-slate-900 dark:text-white">Answer Key & Explanations</h2>
        {questions.map((q, idx) => {
          const chosen = attempt.answers?.[q.id];
          const isCorrect = chosen === q.correctOption;
          const timeSpent = attempt.timings?.[q.id] || 0;

          return (
            <div
              key={q.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span>
                  <strong className="text-blue-700 dark:text-blue-400">Q{idx + 1}</strong> · {q.subject} ·{' '}
                  <span className="tabular-nums">{timeSpent}s</span>
                </span>
                <button
                  type="button"
                  onClick={() => setReportQ(q)}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600 min-h-[36px] px-2"
                >
                  <Flag className="h-3.5 w-3.5" /> Report
                </button>
              </div>

              <p className="font-medium text-slate-900 dark:text-slate-100 mb-3 whitespace-pre-line">
                {q.question}
              </p>

              <div className="flex flex-wrap gap-3 text-xs font-semibold mb-3">
                <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Correct: {q.correctOption}. {q[`option${q.correctOption}`]}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">|</span>
                {chosen ? (
                  <span
                    className={`inline-flex items-center gap-1.5 ${
                      isCorrect
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {!isCorrect && <XCircle className="h-4 w-4" />}
                    Your Answer: {chosen}. {q[`option${chosen}`]}
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">Not Attempted</span>
                )}
              </div>

              {q.explanation && (
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl">
                  <strong>Explanation:</strong> {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <ReportErrorModal question={reportQ} onClose={() => setReportQ(null)} />
    </div>
  );
}