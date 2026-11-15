import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { DEFAULT_EXAMS } from '../data/seedExams';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBanner from '../components/common/ErrorBanner';
import type { Exam, LanguageOption } from '../types';

const LANGUAGES: LanguageOption[] = ['English', 'Hindi', 'Bengali'];

export default function OnboardingPage() {
  const { user, updatePreferences } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExams, setSelectedExams] = useState<string[]>(user?.selectedExams || []);
  const [language, setLanguage] = useState<LanguageOption>(user?.language || 'English');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch<{ exams: Exam[] }>('/api/exams')
      .then((res) => setExams(res.exams?.length ? res.exams : DEFAULT_EXAMS))
      .catch(() => setExams(DEFAULT_EXAMS))
      .finally(() => setLoading(false));
  }, []);

  const toggleExam = (id: string) => {
    setSelectedExams((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!selectedExams.length) return;
    setSaving(true);
    setError('');
    try {
      await updatePreferences({
        selectedExams,
        primaryExam: selectedExams[0],
        language,
        onboarded: true,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading exam categories..." />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
        Personalize Your Exam Prep
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mt-1.5 text-sm sm:text-base">
        Pick one or more target exams and your preferred question language.
      </p>

      <div className="mt-5">
        <ErrorBanner message={error} />
      </div>

      <div className="mt-8">
        <h2 className="font-semibold text-base text-slate-900 dark:text-white mb-3">
          1. Select Target Exam(s)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exams.map((exam) => {
            const active = selectedExams.includes(exam.id);
            return (
              <button
                key={exam.id}
                type="button"
                onClick={() => toggleExam(exam.id)}
                className={`p-4 rounded-xl border text-left flex items-start justify-between gap-3 transition-colors min-h-[72px] ${
                  active
                    ? 'border-blue-700 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{exam.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {exam.description}
                  </div>
                </div>
                {active && (
                  <CheckCircle2 className="h-5 w-5 text-blue-700 dark:text-blue-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-semibold text-base text-slate-900 dark:text-white mb-3">
          2. Preferred Question Language
        </h2>
        <div className="flex flex-wrap gap-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-colors min-h-[44px] ${
                language === lang
                  ? 'border-blue-700 bg-blue-700 text-white'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!selectedExams.length || saving}
        onClick={handleSave}
        className="mt-10 w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-50 min-h-[48px]"
      >
        {saving ? 'Saving Preferences...' : 'Continue to Dashboard'}
      </button>
    </div>
  );
}