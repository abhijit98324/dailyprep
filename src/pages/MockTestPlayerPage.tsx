import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import QuestionCard from '../components/quiz/QuestionCard';
import QuestionPalette from '../components/quiz/QuestionPalette';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBanner from '../components/common/ErrorBanner';
import ReportErrorModal from '../components/common/ReportErrorModal';
import type { Bookmark, OptionKey, Question, Quiz } from '../types';

export default function MockTestPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const { isPremium } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [timings, setTimings] = useState<Record<string, number>>({});
  const [qSeconds, setQSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reportQ, setReportQ] = useState<Question | null>(null);

  useEffect(() => {
    if (!isPremium) {
      navigate('/pricing', { replace: true });
      return;
    }
    async function load() {
      try {
        const [qRes, bmRes] = await Promise.all([
          apiFetch<{ quiz: Quiz; questions: Question[] }>(`/api/quizzes/${id}`),
          apiFetch<{ bookmarks: Bookmark[] }>('/api/bookmarks'),
        ]);
        setQuiz(qRes.quiz);
        setQuestions(qRes.questions || []);
        setRemainingSeconds((qRes.quiz.durationMinutes || 60) * 60);
        setBookmarks(new Set((bmRes.bookmarks || []).map((b) => b.questionId)));
        if (qRes.questions?.[0]) {
          setVisited({ [qRes.questions[0].id]: true });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load mock test');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isPremium, navigate]);

  const handleSubmitTest = useCallback(async () => {
    if (submitting || !quiz || !questions.length) return;
    setSubmitting(true);
    try {
      const currentQ = questions[currentIdx];
      const finalTimings = currentQ
        ? { ...timings, [currentQ.id]: (timings[currentQ.id] || 0) + qSeconds }
        : timings;
      const totalTime = Math.max(1, (quiz.durationMinutes || 60) * 60 - remainingSeconds);

      const res = await apiFetch<{ attemptId: string }>('/api/attempts', {
        method: 'POST',
        body: JSON.stringify({
          quizId: quiz.id,
          answers,
          timings: finalTimings,
          totalTime,
        }),
      });
      navigate(`/results/${res.attemptId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
      setSubmitting(false);
    }
  }, [answers, currentIdx, navigate, qSeconds, questions, quiz, remainingSeconds, submitting, timings]);

  useEffect(() => {
    if (!questions.length || submitting) return;
    const timer = setInterval(() => {
      setQSeconds((s) => s + 1);
      setRemainingSeconds((r) => {
        if (r <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [questions.length, submitting, handleSubmitTest]);

  const sections = useMemo(() => {
    const map: { name: string; firstIdx: number; timingMin?: number }[] = [];
    const seen = new Set<string>();
    const timingMap = new Map((quiz?.sectionalTimings || []).map((s) => [s.subject, s.durationMinutes]));
    questions.forEach((q, idx) => {
      const s = q.subject || 'General';
      if (!seen.has(s)) {
        seen.add(s);
        map.push({ name: s, firstIdx: idx, timingMin: timingMap.get(s) });
      }
    });
    return map;
  }, [questions, quiz]);

  const jumpTo = (idx: number) => {
    const cur = questions[currentIdx];
    if (cur) {
      setTimings((prev) => ({ ...prev, [cur.id]: (prev[cur.id] || 0) + qSeconds }));
      setQSeconds(0);
    }
    const target = questions[idx];
    if (target) setVisited((prev) => ({ ...prev, [target.id]: true }));
    setCurrentIdx(idx);
  };

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

  if (loading) return <LoadingSpinner label="Preparing exam interface..." />;
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <ErrorBanner message={error} />
      </div>
    );
  }
  if (!quiz || !questions.length) return null;

  const currentQ = questions[currentIdx];
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Exam Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-5">
        <div>
          <h1 className="font-bold text-lg text-slate-900 dark:text-white">{quiz.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            +{quiz.positiveMarks} correct · -{quiz.negativeMarks} negative marking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-mono font-bold text-sm tabular-nums min-h-[44px]">
            <Clock className="h-4 w-4" />
            <span>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmitTest}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 min-h-[44px]"
          >
            <Send className="h-4 w-4" />
            <span>{submitting ? 'Submitting...' : 'Submit Test'}</span>
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
        {sections.map((sec) => (
          <button
            key={sec.name}
            type="button"
            onClick={() => jumpTo(sec.firstIdx)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border min-h-[40px] ${
              currentQ.subject === sec.name
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {sec.name}
            {sec.timingMin ? ` (${sec.timingMin}m)` : ''}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <QuestionCard
            question={currentQ}
            index={currentIdx}
            total={questions.length}
            selectedOption={answers[currentQ.id]}
            onSelect={(opt) => setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }))}
            showInstantFeedback={false}
            isBookmarked={bookmarks.has(currentQ.id)}
            onToggleBookmark={handleToggleBookmark}
            onReport={(q) => setReportQ(q)}
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setAnswers((prev) => {
                    const next = { ...prev };
                    delete next[currentQ.id];
                    return next;
                  })
                }
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium min-h-[44px]"
              >
                Clear Response
              </button>
              <button
                type="button"
                onClick={() =>
                  setMarkedForReview((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))
                }
                className={`px-4 py-2 rounded-xl border text-sm font-medium min-h-[44px] ${
                  markedForReview[currentQ.id]
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              >
                {markedForReview[currentQ.id] ? 'Unmark Review' : 'Mark for Review'}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => jumpTo(currentIdx - 1)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium disabled:opacity-40 min-h-[44px]"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentIdx + 1 >= questions.length}
                onClick={() => jumpTo(currentIdx + 1)}
                className="px-5 py-2 rounded-xl bg-blue-700 text-white text-sm font-semibold disabled:opacity-40 min-h-[44px]"
              >
                Save & Next
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <QuestionPalette
            questions={questions}
            currentIndex={currentIdx}
            answers={answers}
            markedForReview={markedForReview}
            visited={visited}
            onJump={jumpTo}
          />
        </div>
      </div>

      <ReportErrorModal question={reportQ} onClose={() => setReportQ(null)} />
    </div>
  );
}