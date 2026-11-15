import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import QuestionCard from '../components/quiz/QuestionCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorBanner from '../components/common/ErrorBanner';
import PaywallModal from '../components/common/PaywallModal';
import ReportErrorModal from '../components/common/ReportErrorModal';
import type { Bookmark, OptionKey, Question, Quiz } from '../types';

export default function DailyQuizPage() {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalInQuiz, setTotalInQuiz] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({});
  const [reviewLater, setReviewLater] = useState<Record<string, boolean>>({});
  const [timings, setTimings] = useState<Record<string, number>>({});
  const [qSeconds, setQSeconds] = useState(0);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [reportQ, setReportQ] = useState<Question | null>(null);

  const examId = user?.primaryExam || user?.selectedExams?.[0] || 'ssc';

  const loadQuiz = async () => {
    setLoading(true);
    setError('');
    try {
      const [quizRes, bmRes] = await Promise.all([
        apiFetch<{
          quiz: Quiz | null;
          isFallback: boolean;
          questions: Question[];
          totalInQuiz: number;
        }>(`/api/daily-quiz?examId=${encodeURIComponent(examId)}`),
        apiFetch<{ bookmarks: Bookmark[] }>('/api/bookmarks'),
      ]);

      setQuiz(quizRes.quiz);
      setIsFallback(quizRes.isFallback);
      setQuestions(quizRes.questions || []);
      setTotalInQuiz(quizRes.totalInQuiz || 0);
      setBookmarks(new Set((bmRes.bookmarks || []).map((b) => b.questionId)));
      setCurrentIdx(0);
      setAnswers({});
      setTimings({});
      setQSeconds(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load daily quiz');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, [examId]);

  useEffect(() => {
    if (!questions.length) return;
    const timer = setInterval(() => setQSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [currentIdx, questions.length]);

  const recordTimeForCurrent = () => {
    const q = questions[currentIdx];
    if (!q) return timings;
    const next = { ...timings, [q.id]: (timings[q.id] || 0) + qSeconds };
    setTimings(next);
    setQSeconds(0);
    return next;
  };

  const currentQ = questions[currentIdx];

  const handleToggleBookmark = async (q: Question) => {
    const res = await apiFetch<{ bookmarked: boolean }>('/api/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify({ questionId: q.id }),
    });
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (res.bookmarked) next.add(q.id);
      else next.delete(q.id);
      return next;
    });
  };

  const handleNext = () => {
    recordTimeForCurrent();
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
    } else if (!isPremium && totalInQuiz > questions.length) {
      setShowPaywall(true);
    }
  };

  const handleFinish = async () => {
    if (!quiz) return;
    setSubmitting(true);
    const finalTimings = recordTimeForCurrent();
    try {
      const res = await apiFetch<{ attemptId: string }>('/api/attempts', {
        method: 'POST',
        body: JSON.stringify({
          quizId: quiz.id,
          answers,
          timings: finalTimings,
        }),
      });
      navigate(`/results/${res.attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Fetching today's daily quiz..." />;
  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <ErrorBanner message={error} onRetry={loadQuiz} />
      </div>
    );
  }
  if (!quiz || !questions.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <EmptyState
          title="No Daily Quiz Available Yet"
          description="The admin hasn't published a daily quiz for this exam yet. Check back soon or switch your active exam from the dashboard."
          action={
            <Link
              to="/dashboard"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold text-sm"
            >
              Back to Dashboard
            </Link>
          }
        />
      </div>
    );
  }

  const progressPct = Math.round(((currentIdx + 1) / questions.length) * 100);
  const hasLockedRemaining = !isPremium && totalInQuiz > questions.length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      {isFallback && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            No quiz is scheduled specifically for today — showing the most recent quiz ({quiz.scheduledDate}).
          </span>
        </div>
      )}

      {hasLockedRemaining && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-sm text-slate-800 dark:text-slate-200">
          <span>
            Free Plan: Showing {questions.length} of {totalInQuiz} questions in today's quiz.
          </span>
          <button
            type="button"
            onClick={() => setShowPaywall(true)}
            className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
          >
            Unlock All {totalInQuiz} Questions
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{quiz.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {quiz.scheduledDate} · +{quiz.positiveMarks} / -{quiz.negativeMarks} marks
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-mono tabular-nums text-slate-800 dark:text-slate-200">
          <Clock className="h-4 w-4 text-blue-700 dark:text-blue-400" />
          <span>{qSeconds}s</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-blue-700 dark:bg-blue-500 transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <QuestionCard
        question={currentQ}
        index={currentIdx}
        total={questions.length}
        selectedOption={answers[currentQ.id]}
        onSelect={(opt) => {
          if (!answers[currentQ.id]) {
            setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
          }
        }}
        showInstantFeedback={true}
        isBookmarked={bookmarks.has(currentQ.id)}
        onToggleBookmark={handleToggleBookmark}
        onReport={(q) => setReportQ(q)}
      />

      {/* Footer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentIdx === 0}
            onClick={() => {
              recordTimeForCurrent();
              setCurrentIdx((i) => Math.max(0, i - 1));
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium disabled:opacity-40 min-h-[44px]"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() =>
              setReviewLater((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))
            }
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium min-h-[44px] ${
              reviewLater[currentQ.id]
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            {reviewLater[currentQ.id] ? 'Marked for Review' : 'Review Later'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {currentIdx + 1 < questions.length ? (
            <>
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium min-h-[44px]"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 min-h-[44px]"
              >
                Next
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 min-h-[44px]"
            >
              {submitting ? 'Submitting...' : 'Finish & View Results'}
            </button>
          )}
        </div>
      </div>

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="Unlock Full Daily Quizzes"
      />
      <ReportErrorModal question={reportQ} onClose={() => setReportQ(null)} />
    </div>
  );
}