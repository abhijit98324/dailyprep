import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Flame,
  Moon,
  Newspaper,
  Settings,
  Sun,
  TrendingUp,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../lib/api';
import { DEFAULT_EXAMS } from '../data/seedExams';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorBanner from '../components/common/ErrorBanner';
import PWAInstallButton from '../components/common/PWAInstallButton';
import type { Attempt, Exam } from '../types';

export default function DashboardPage() {
  const { user, isPremium, updatePreferences } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [exams, setExams] = useState<Exam[]>(DEFAULT_EXAMS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [attRes, exRes] = await Promise.all([
        apiFetch<{ attempts: Attempt[] }>('/api/attempts'),
        apiFetch<{ exams: Exam[] }>('/api/exams'),
      ]);
      setAttempts(attRes.attempts || []);
      if (exRes.exams?.length) setExams(exRes.exams);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const chartData = useMemo(() => {
    return [...attempts]
      .slice(0, 12)
      .reverse()
      .map((a, idx) => ({
        label: a.date || `#${idx + 1}`,
        accuracy: a.accuracy || 0,
        score: a.score || 0,
      }));
  }, [attempts]);

  const weakTopics = useMemo(() => {
    const stats = user?.topicStats || {};
    return Object.entries(stats)
      .map(([topic, val]) => ({
        topic,
        accuracy: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
        total: val.total,
      }))
      .filter((t) => t.total >= 1)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);
  }, [user]);

  if (loading) return <LoadingSpinner label="Loading your dashboard..." />;

  const activeExamId = user?.primaryExam || user?.selectedExams?.[0] || 'ssc';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <ErrorBanner message={error} onRetry={load} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Welcome, {user?.displayName || 'Aspirant'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Language: <strong className="text-slate-700 dark:text-slate-200">{user?.language || 'English'}</strong>
            <span aria-hidden="true"> · </span>
            Plan:{' '}
            <strong className={isPremium ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}>
              {isPremium ? 'Premium' : 'Free (5 Qs/day)'}
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Active Exam"
            value={activeExamId}
            onChange={(e) => updatePreferences({ primaryExam: e.target.value })}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium min-h-[44px]"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.shortName || ex.name}
              </option>
            ))}
          </select>

          <Link
            to="/onboarding"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px]"
          >
            <Settings className="h-4 w-4" />
            <span>Preferences</span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <PWAInstallButton compact />
        </div>
      </div>

      {/* Primary Action Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/daily-quiz"
          className="p-5 rounded-2xl bg-blue-700 text-white hover:bg-blue-800 transition-colors flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-medium text-blue-100">Today's Curated Set</div>
            <div className="text-xl font-bold mt-1">Take Daily Quiz</div>
          </div>
          <BookOpen className="h-7 w-7 text-blue-200 shrink-0" />
        </Link>

        <Link
          to="/mock-tests"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Timed Exam Pattern</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">Mock Tests</div>
          </div>
          <Clock className="h-7 w-7 text-blue-700 dark:text-blue-400 shrink-0" />
        </Link>

        <Link
          to="/current-affairs"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Key Points & MCQs</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">Current Affairs</div>
          </div>
          <Newspaper className="h-7 w-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
        </Link>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Daily Streak', value: `${user?.streak || 0} days`, icon: Flame, color: 'text-amber-600' },
          { label: 'Questions Practiced', value: String(user?.totalPracticed || 0), icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'Tests Completed', value: String(attempts.length), icon: Award, color: 'text-blue-700 dark:text-blue-400' },
          {
            label: 'Avg Accuracy',
            value: attempts.length
              ? `${Math.round(attempts.reduce((s, a) => s + (a.accuracy || 0), 0) / attempts.length)}%`
              : '0%',
            icon: TrendingUp,
            color: 'text-sky-600',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{kpi.label}</span>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Weak Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">
            Score & Accuracy Over Time
          </h2>
          {chartData.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    name="Accuracy %"
                    stroke="#1d4ed8"
                    strokeWidth={2.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Score"
                    stroke="#059669"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No quiz data yet"
              description="Complete today's daily quiz to start plotting your score and accuracy trends."
              action={
                <Link
                  to="/daily-quiz"
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-700 text-white text-sm font-semibold"
                >
                  Take Daily Quiz
                </Link>
              }
            />
          )}
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Weak Topics</h2>
          {!isPremium ? (
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-4">
              <p>
                Upgrade to Premium (₹200/month) to unlock topic-by-topic accuracy detection and targeted revision insights.
              </p>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 min-h-[44px]"
              >
                Unlock Weak-Topic Analytics
              </Link>
            </div>
          ) : weakTopics.length ? (
            <div className="space-y-4">
              {weakTopics.map((t) => (
                <div key={t.topic}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{t.topic}</span>
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      {t.accuracy}% ({t.total} Qs)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${t.accuracy < 50 ? 'bg-red-600' : 'bg-amber-500'}`}
                      style={{ width: `${t.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Practice a few quizzes to identify weak topics.
            </p>
          )}
        </div>
      </div>

      {/* Recent Attempts */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Recent Attempts</h2>
          <Link to="/bookmarks" className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline">
            View Bookmarks
          </Link>
        </div>

        {attempts.length ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {attempts.slice(0, 6).map((a) => (
              <div key={a.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-white">{a.quizTitle}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {a.date} · {a.quizType === 'mock' ? 'Mock Test' : 'Daily Quiz'}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm tabular-nums">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {a.score} / {a.maxScore}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    {a.accuracy}%
                  </span>
                  <Link
                    to={`/results/${a.id}`}
                    className="text-blue-700 dark:text-blue-400 font-semibold hover:underline"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">No attempts recorded yet.</p>
        )}
      </div>
    </div>
  );
}