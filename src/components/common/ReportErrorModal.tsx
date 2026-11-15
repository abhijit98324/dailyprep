import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { Question } from '../../types';

export default function ReportErrorModal({
  question,
  onClose,
}: {
  question: Question | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('Wrong answer key');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!question) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/error-reports', {
        method: 'POST',
        body: JSON.stringify({
          questionId: question.id,
          reason,
          details,
        }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 relative shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white mb-2">
          <Flag className="h-5 w-5 text-red-600" />
          <span>Report an Error</span>
        </div>

        {done ? (
          <div className="py-3">
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              Thank you. Your report has been sent to the admin queue for review.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold min-h-[44px]"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-3">
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Issue Type
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm min-h-[44px]"
              >
                <option>Wrong answer key</option>
                <option>Typo or unclear question</option>
                <option>Incorrect explanation</option>
                <option>Translation issue</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Details (optional)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what seems incorrect..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}