import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { ErrorReport } from '../../types';

export default function ErrorReportsManager() {
  const [reports, setReports] = useState<ErrorReport[]>([]);

  const load = () =>
    apiFetch<{ reports: ErrorReport[] }>('/api/admin/error-reports')
      .then((res) => setReports(res.reports || []))
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <h2 className="font-bold text-lg text-slate-900 dark:text-white tabular-nums">
        Student Error Reports ({reports.length})
      </h2>
      {!reports.length ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No error reports submitted yet.</p>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {reports.map((r) => (
            <div key={r.id} className="py-3.5 flex flex-wrap items-start justify-between gap-4 text-sm">
              <div>
                <div className="font-semibold text-red-600 dark:text-red-400">
                  {r.reason} · <span className="uppercase">{r.examId}</span>
                </div>
                <p className="mt-1 text-slate-900 dark:text-slate-100">{r.questionText}</p>
                {r.details && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Student Note: {r.details}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Reported by: {r.userEmail} · Question ID: {r.questionId}
                </p>
              </div>
              {r.status === 'open' ? (
                <button
                  type="button"
                  onClick={async () => {
                    await apiFetch(`/api/admin/error-reports/${r.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ status: 'resolved' }),
                    });
                    load();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shrink-0 min-h-[40px]"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Mark Resolved
                </button>
              ) : (
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Resolved
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}