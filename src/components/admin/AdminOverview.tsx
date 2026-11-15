import { useEffect, useState } from 'react';
import { CalendarX, Database, Download } from 'lucide-react';
import { apiFetch, getStoredToken } from '../../lib/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBanner from '../common/ErrorBanner';

interface OverviewData {
  countsByExam: { examId: string; name: string; questionCount: number; publishedCount: number }[];
  dailySchedule: { date: string; missingExams: string[] }[];
  totals: { questions: number; quizzes: number; users: number; openReports: number };
}

export default function AdminOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingCode, setDownloadingCode] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<OverviewData>('/api/admin/overview');
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDownloadCodebase = async () => {
    setDownloadingCode(true);
    setError('');
    try {
      const token = getStoredToken();
      const res = await fetch('/api/admin/export-codebase', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to download codebase file');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dailyprep-complete-codebase.md';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloadingCode(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading admin overview..." />;
  if (error || !data) return <ErrorBanner message={error || 'Unable to load overview'} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">Full Source Code Export</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Download all DailyPrep source files bundled into a single Markdown file.
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownloadCodebase}
          disabled={downloadingCode}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-bold transition-colors"
        >
          <Download className="h-4 w-4" />
          {downloadingCode ? 'Preparing file...' : 'Download Codebase (.md)'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Questions', value: data.totals.questions },
          { label: 'Quizzes & Mocks', value: data.totals.quizzes },
          { label: 'Registered Users', value: data.totals.users },
          { label: 'Open Error Reports', value: data.totals.openReports },
        ].map((item) => (
          <div
            key={item.label}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.label}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-4">
            <Database className="h-5 w-5 text-blue-700 dark:text-blue-400" />
            <span>Questions per Exam</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {data.countsByExam.map((row) => (
              <div key={row.examId} className="py-2.5 flex justify-between items-center">
                <span className="font-medium text-slate-800 dark:text-slate-200">{row.name}</span>
                <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                  {row.publishedCount} published{' '}
                  <span className="text-xs font-normal text-slate-400">/ {row.questionCount} total</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-4">
            <CalendarX className="h-5 w-5 text-red-600" />
            <span>Upcoming 7 Days Daily Quiz Schedule</span>
          </div>
          <div className="space-y-3 text-xs max-h-80 overflow-y-auto">
            {data.dailySchedule.map((day) => (
              <div
                key={day.date}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800"
              >
                <div className="font-bold text-sm text-slate-900 dark:text-white mb-1 tabular-nums">
                  {day.date}
                </div>
                {day.missingExams.length ? (
                  <span className="text-red-600 dark:text-red-400">
                    Unscheduled: {day.missingExams.join(', ')}
                  </span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    All exams scheduled
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}