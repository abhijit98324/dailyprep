import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { DEFAULT_EXAMS } from '../../data/seedExams';
import type { DifficultyLevel, Exam, LanguageOption, OptionKey, PublishStatus, Question } from '../../types';

export default function QuestionForm({
  editingQuestion,
  onSaved,
  onCancelEdit,
}: {
  editingQuestion: Question | null;
  onSaved: () => void;
  onCancelEdit?: () => void;
}) {
  const [exams, setExams] = useState<Exam[]>(DEFAULT_EXAMS);
  const [examId, setExamId] = useState('ssc');
  const [subject, setSubject] = useState('Quantitative Aptitude');
  const [topic, setTopic] = useState('Percentage');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [language, setLanguage] = useState<LanguageOption>('English');
  const [status, setStatus] = useState<PublishStatus>('published');
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState<OptionKey>('A');
  const [explanation, setExplanation] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ exams: Exam[] }>('/api/exams')
      .then((res) => {
        if (res.exams?.length) setExams(res.exams);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (editingQuestion) {
      setExamId(editingQuestion.examId);
      setSubject(editingQuestion.subject);
      setTopic(editingQuestion.topic);
      setDifficulty(editingQuestion.difficulty);
      setLanguage(editingQuestion.language);
      setStatus(editingQuestion.status);
      setQuestion(editingQuestion.question);
      setOptionA(editingQuestion.optionA);
      setOptionB(editingQuestion.optionB);
      setOptionC(editingQuestion.optionC);
      setOptionD(editingQuestion.optionD);
      setCorrectOption(editingQuestion.correctOption);
      setExplanation(editingQuestion.explanation || '');
      setMsg('');
    }
  }, [editingQuestion]);

  const currentExam = exams.find((e) => e.id === examId) || exams[0];
  const subjects = currentExam?.subjects || [];
  const currentSubject = subjects.find((s) => s.name === subject);
  const topics = currentSubject?.topics || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const payload = {
        examId,
        subject,
        topic,
        difficulty,
        language,
        status,
        question,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption,
        explanation,
      };
      if (editingQuestion) {
        await apiFetch(`/api/admin/questions/${editingQuestion.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setMsg('Question updated.');
      } else {
        await apiFetch('/api/admin/questions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setMsg('Question added to question bank.');
        setQuestion('');
        setOptionA('');
        setOptionB('');
        setOptionC('');
        setOptionD('');
        setExplanation('');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-900 dark:text-white">
          {editingQuestion ? 'Edit Question' : 'Add Single Question'}
        </h2>
        {editingQuestion && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            Cancel Edit
          </button>
        )}
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
          {msg}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Exam
          </label>
          <select
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.shortName || ex.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Subject
          </label>
          <input
            list="admin-subject-list"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
          />
          <datalist id="admin-subject-list">
            {subjects.map((s) => (
              <option key={s.name} value={s.name} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Topic
          </label>
          <input
            list="admin-topic-list"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
          />
          <datalist id="admin-topic-list">
            {topics.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageOption)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Bengali">Bengali</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Status
          </label>
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
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
          Question Text
        </label>
        <textarea
          rows={3}
          required
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { key: 'A', val: optionA, set: setOptionA },
          { key: 'B', val: optionB, set: setOptionB },
          { key: 'C', val: optionC, set: setOptionC },
          { key: 'D', val: optionD, set: setOptionD },
        ].map((item) => (
          <div key={item.key}>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Option {item.key}
            </label>
            <input
              type="text"
              required
              value={item.val}
              onChange={(e) => item.set(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Correct Option
          </label>
          <select
            value={correctOption}
            onChange={(e) => setCorrectOption(e.target.value as OptionKey)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm min-h-[44px]"
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Explanation
          </label>
          <textarea
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 min-h-[44px]"
      >
        {saving ? 'Saving...' : editingQuestion ? 'Update Question' : 'Save Question'}
      </button>
    </form>
  );
}