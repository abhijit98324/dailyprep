import { useState } from 'react';
import AdminOverview from '../components/admin/AdminOverview';
import QuestionForm from '../components/admin/QuestionForm';
import BulkUpload from '../components/admin/BulkUpload';
import QuestionList from '../components/admin/QuestionList';
import QuizMockBuilder from '../components/admin/QuizMockBuilder';
import CurrentAffairsManager from '../components/admin/CurrentAffairsManager';
import ExamManager from '../components/admin/ExamManager';
import ErrorReportsManager from '../components/admin/ErrorReportsManager';
import UserSubscriptionManager from '../components/admin/UserSubscriptionManager';
import type { Question } from '../types';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'questions', label: 'Questions & Bulk Upload' },
  { id: 'quizzes', label: 'Daily Quiz & Mocks' },
  { id: 'ca', label: 'Current Affairs' },
  { id: 'exams', label: 'Exams & Topics' },
  { id: 'reports', label: 'Error Reports' },
  { id: 'users', label: 'Users & Plans' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AdminPage() {
  const [tab, setTab] = useState<TabId>('overview');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">DailyPrep Admin Panel</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          All questions, quizzes, mock tests, and current affairs digests are manually authored and scheduled here.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 min-h-[44px] transition-colors ${
              tab === t.id
                ? 'bg-blue-700 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <AdminOverview />}

      {tab === 'questions' && (
        <div className="space-y-6">
          <QuestionForm
            editingQuestion={editingQuestion}
            onSaved={() => {
              setEditingQuestion(null);
              setRefreshKey((k) => k + 1);
            }}
            onCancelEdit={() => setEditingQuestion(null)}
          />
          <BulkUpload onUploaded={() => setRefreshKey((k) => k + 1)} />
          <QuestionList
            refreshKey={refreshKey}
            onEdit={(q) => {
              setEditingQuestion(q);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {tab === 'quizzes' && <QuizMockBuilder />}
      {tab === 'ca' && <CurrentAffairsManager />}
      {tab === 'exams' && <ExamManager />}
      {tab === 'reports' && <ErrorReportsManager />}
      {tab === 'users' && <UserSubscriptionManager />}
    </div>
  );
}