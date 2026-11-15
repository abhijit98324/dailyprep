import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { CurrentAffairsDigest, PublishStatus } from '../../types';

export default function CurrentAffairsManager() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [pointsText, setPointsText] = useState('');
  const [linkedIdsText, setLinkedIdsText] = useState('');
  const [status, setStatus] = useState<PublishStatus>('published');
  const [list, setList] = useState<CurrentAffairsDigest[]>([]);
  const [msg, setMsg] = useState('');

  const load = () =>
    apiFetch<{ digests: CurrentAffairsDigest[] }>('/api/admin/current-affairs')
      .then((res) => setList(res.digests || []))
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const points = pointsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const linkedQuestionIds = linkedIdsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await apiFetch('/api/admin/current-affairs', {
      method: 'POST',
      body: JSON.stringify({ date, title, points, linkedQuestionIds, status }),
    });
    setTitle('');
    setPointsText('');
    setLinkedIdsText('');
    setMsg('Current Affairs digest saved.');
    load();
  };

  const toggleStatus = async (item: CurrentAffairsDigest) => {
    const next = item.status === 'published' ? 'draft' : 'published';
    await apiFetch(`/api/admin/current-affairs/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4"
      >
        <h2 className="font-bold text-lg text-slate-900 dark:text-white">
          Write Daily Current Affairs Digest
        </h2>
        {msg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-sm">
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
          />
          <input
            type="text"
            required
            placeholder="Digest Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PublishStatus)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <textarea
          rows={5}
          required
          placeholder="Key exam bullet points (one point per line)..."
          value={pointsText}
          onChange={(e) => setPointsText(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
        />

        <input
          type="text"
          placeholder="Linked Question IDs from Question Bank (comma-separated, optional)"
          value={linkedIdsText}
          onChange={(e) => setLinkedIdsText(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
        />

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 min-h-[44px]"
        >
          Save Digest
        </button>
      </form>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white mb-3">All Digests</h3>
        <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
          {list.map((item) => (
            <div key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">{item.title}</span>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {item.date} · {item.points?.length || 0} points
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleStatus(item)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    item.status === 'published'
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item.status}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await apiFetch(`/api/admin/current-affairs/${item.id}`, { method: 'DELETE' });
                    load();
                  }}
                  className="text-red-600 p-2"
                  aria-label="Delete digest"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}