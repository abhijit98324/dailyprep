import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { DEFAULT_EXAMS } from '../../data/seedExams';
import type { Exam, PublishStatus, Question, Quiz } from '../../types';

export default function QuizMockBuilder() {
  const [exams, setExams] = useState<Exam[]>(DEFAULT_EXAMS);
  const [type, setType] = useState<'daily' | 'mock'>('daily');
  const [examId, setExamId] = useState('ssc');
  const [title, setTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [positiveMarks, setPositiveMarks] = useState(2);
  const [negativeMarks, setNegativeMarks] = useState(0.5);
  const [status, setStatus] = useState<PublishStatus>('published');
  const [availableQs, setAvailableQs] = useState<Question[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [existingQuizzes, setExistingQuizzes] = useState<Quiz[]>([]);
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    const [qRes, qzRes, exRes] = await Promise.all([
      apiFetch<{ questions: Question[] }>(`/api/admin/questions?examId=${encodeURIComponent(examId)}`),
      apiFetch<{ quizzes: Quiz[] }>('/api/admin/quizzes'),
      apiFetch<{ exams: Exam[] }>('/api/exams'),
    ]);
    setAvailableQs((qRes.questions || []).filter((q) => q.status === 'published'));
    setExistingQuizzes(qzRes.quizzes || []);
    if (exRes.exams?.length) setExams(exRes.exams);
  };

  useEffect(() => {
    loadData();
  }, [examId]);

  const toggleQ = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIds.length) return;
    await apiFetch('/api/admin/quizzes', {
      method: 'POST',
      body: JSON.stringify({
        type,
        examId,
        title: title || `${examId.toUpperCase()} ${type === 'daily' ? 'Daily Quiz' : 'Mock Test'}`,
        scheduledDate: type === 'daily' ? scheduledDate : null,
        durationMinutes: Number(durationMinutes),
        positiveMarks: Number(positiveMarks),
        negativeMarks: Number(negativeMarks),
        questionIds: selectedIds,
        status,
      }),
    });
    setMsg('Quiz / Mock Test saved.');
    setSelectedIds([]);
    setTitle('');
    loadData();
  };

  const toggleQuizStatus = async (qz: Quiz) => {
    const next = qz.status === 'published' ? 'draft' : 'published';
    await apiFetch(`/api/admin/quizzes/${qz.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    setExistingQuizzes((prev) =>
      prev.map((item) => (item.id === qz.id ? { ...item, status: next } : item))
    );
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/api/admin/quizzes/${id}`, { method: 'DELETE' });
    setExistingQuizzes((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4"
      >
        <h2 className="font-bold text-lg text-slate-900 dark:text-white">
          Create & Schedule Daily Quiz / Mock Test
        </h2>
        {msg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-sm">
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <select
            value={type}
            onChange={(e) => {
              const t = e.target.value as 'daily' | 'mock';
              setType(t);
              setDurationMinutes(t === 'daily' ? 15 : 60);
            }}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
          >
            <option value="daily">Daily Quiz</option>
            <option value="mock">Mock Test</option>
          </select>

          <select
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.shortName || ex.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Title (e.g., SSC CGL Daily Quiz)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm sm:col-span-2 min-h-[44px]"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {type === 'daily' && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">Schedule Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-500 mb-1">Duration (mins)</label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">+Marks</label>
            <input
              type="number"
              step="0.25"
              value={positiveMarks}
              onChange={(e) => setPositiveMarks(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">-Negative</label>
            <input
              type="number"
              step="0.25"
              value={negativeMarks}
              onChange={(e) => setNegativeMarks(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PublishStatus)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Pick Published Questions ({selectedIds.length} selected)
          </label>
          <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
            {availableQs.map((q) => (
              <label
                key={q.id}
                className="flex items-start gap-3 p-3 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(q.id)}
                  onChange={() => toggleQ(q.id)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <strong className="text-xs text-blue-700 dark:text-blue-400">[{q.subject}]</strong>{' '}
                  {q.question}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedIds.length}
          className="px-6 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 min-h-[44px]"
        >
          Save {type === 'daily' ? 'Daily Quiz' : 'Mock Test'}
        </button>
      </form>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white mb-3">
          Scheduled Quizzes & Mock Tests
        </h3>
        <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
          {existingQuizzes.map((qz) => (
            <div key={qz.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">{qz.title}</span>
                <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {qz.type} · {qz.examId.toUpperCase()} · {qz.scheduledDate || 'Always available'} ·{' '}
                  {qz.questionIds?.length || 0} Qs
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleQuizStatus(qz)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    qz.status === 'published'
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {qz.status}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(qz.id)}
                  className="text-red-600 p-2"
                  aria-label="Delete quiz"
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