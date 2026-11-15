import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { Exam, SubjectDefinition } from '../../types';

export default function ExamManager() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [description, setDescription] = useState('');
  const [subjects, setSubjects] = useState<SubjectDefinition[]>([
    { name: 'General Awareness', topics: ['Static GK', 'Polity'] },
  ]);
  const [msg, setMsg] = useState('');

  const load = () =>
    apiFetch<{ exams: Exam[] }>('/api/exams')
      .then((res) => setExams(res.exams || []))
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedSubjects = subjects
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        topics: s.topics.map((t) => t.trim()).filter(Boolean),
      }));

    await apiFetch('/api/admin/exams', {
      method: 'POST',
      body: JSON.stringify({
        id: id.trim().toLowerCase(),
        name,
        shortName,
        description,
        subjects: cleanedSubjects,
      }),
    });

    setId('');
    setName('');
    setShortName('');
    setDescription('');
    setSubjects([{ name: 'General Awareness', topics: ['Static GK'] }]);
    setMsg('Exam category saved.');
    load();
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4"
      >
        <h2 className="font-bold text-lg text-slate-900 dark:text-white">
          Add / Edit Exam, Subjects & Topics
        </h2>
        {msg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-sm">
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            required
            placeholder="Slug ID (e.g. ssc)"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
          />
          <input
            required
            placeholder="Short Name (e.g. SSC)"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
          />
          <input
            required
            placeholder="Full Name (e.g. SSC CGL, CHSL...)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
          />
        </div>

        <input
          placeholder="Short description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Subjects & Comma-Separated Topics
            </span>
            <button
              type="button"
              onClick={() => setSubjects((prev) => [...prev, { name: '', topics: [] }])}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400"
            >
              <Plus className="h-3.5 w-3.5" /> Add Subject
            </button>
          </div>

          {subjects.map((subj, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <input
                placeholder="Subject Name"
                value={subj.name}
                onChange={(e) => {
                  const next = [...subjects];
                  next[idx] = { ...next[idx], name: e.target.value };
                  setSubjects(next);
                }}
                className="sm:col-span-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
              />
              <input
                placeholder="Topics (comma separated)"
                value={subj.topics.join(', ')}
                onChange={(e) => {
                  const next = [...subjects];
                  next[idx] = {
                    ...next[idx],
                    topics: e.target.value.split(','),
                  };
                  setSubjects(next);
                }}
                className="sm:col-span-7 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setSubjects((prev) => prev.filter((_, i) => i !== idx))}
                className="sm:col-span-1 flex items-center justify-center text-red-600 min-h-[44px]"
                aria-label="Remove subject"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 min-h-[44px]"
        >
          Save Exam Category
        </button>
      </form>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
        {exams.map((ex) => (
          <div key={ex.id} className="py-3.5 flex flex-wrap items-center justify-between gap-2 text-sm">
            <div>
              <strong className="text-slate-900 dark:text-white">{ex.name}</strong>{' '}
              <span className="text-xs text-slate-500">
                ({ex.id} · {ex.subjects?.length || 0} subjects)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setId(ex.id);
                  setName(ex.name);
                  setShortName(ex.shortName || '');
                  setDescription(ex.description || '');
                  setSubjects(
                    ex.subjects?.length ? ex.subjects : [{ name: '', topics: [] }]
                  );
                }}
                className="text-blue-700 dark:text-blue-400 font-semibold text-xs min-h-[36px] px-2"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={async () => {
                  await apiFetch(`/api/admin/exams/${ex.id}`, { method: 'DELETE' });
                  load();
                }}
                className="text-red-600 p-2"
                aria-label="Delete exam"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}