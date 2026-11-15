import { useEffect, useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { DEFAULT_EXAMS } from '../../data/seedExams';
import LoadingSpinner from '../common/LoadingSpinner';
import type { Exam, Question } from '../../types';

export default function QuestionList({
  refreshKey,
  onEdit,
}: {
  refreshKey: number;
  onEdit: (q: Question) => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>(DEFAULT_EXAMS);
  const [filterExam, setFilterExam] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [qRes, exRes] = await Promise.all([
        apiFetch<{ questions: Question[] }>(
          `/api/admin/questions${filterExam ? `?examId=${encodeURIComponent(filterExam)}` : ''}`
        ),
        apiFetch<{ exams: Exam[] }>('/api/exams'),
      ]);
      setQuestions(qRes.questions || []);
      if (exRes.exams?.length) setExams(exRes.exams);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterExam, refreshKey]);

  const handleDelete = async (id: string) => {
    await apiFetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const toggleStatus = async (q: Question) => {
    const next = q.status === 'published' ? 'draft' : 'published';
    await apiFetch(`/api/admin/questions/${q.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: next }),
    });
    setQuestions((prev) =>
      prev.map((item) => (item.id === q.id ? { ...item, status: next } : item))
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold text-lg text-slate-900 dark:text-white tabular-nums">
          Question Bank ({questions.length})
        </h2>
        <select
          value={filterExam}
          onChange={(e) => setFilterExam(e.target.value)}
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
        >
          <option value="">All Exams</option>
          {exams.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.shortName || ex.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[520px] overflow-y-auto">
          {questions.map((q) => (
            <div key={q.id} className="py-3.5 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <strong className="uppercase text-blue-700 dark:text-blue-400">{q.examId}</strong>
                  <span aria-hidden="true"> · </span>
                  {q.subject}
                  <span aria-hidden="true"> · </span>
                  {q.topic}
                  <span aria-hidden="true"> · </span>
                  {q.language}
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono">ID: {q.id}</span>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{q.question}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleStatus(q)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] ${
                    q.status === 'published'
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {q.status}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(q)}
                  aria-label="Edit question"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-blue-700 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(q.id)}
                  aria-label="Delete question"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}