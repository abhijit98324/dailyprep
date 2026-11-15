import { useEffect, useState } from 'react';
import { Calendar, Newspaper } from 'lucide-react';
import { apiFetch } from '../lib/api';
import QuestionCard from '../components/quiz/QuestionCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ErrorBanner from '../components/common/ErrorBanner';
import type { CurrentAffairsDigest, OptionKey, Question } from '../types';

interface EnrichedDigest extends CurrentAffairsDigest {
  linkedQuestions?: Question[];
}

export default function CurrentAffairsPage() {
  const [digests, setDigests] = useState<EnrichedDigest[]>([]);
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ digests: EnrichedDigest[] }>('/api/current-affairs');
      setDigests(res.digests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load current affairs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingSpinner label="Loading current affairs digest..." />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2.5 mb-6">
        <Newspaper className="h-6 w-6 text-blue-700 dark:text-blue-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Daily Current Affairs Digest
        </h1>
      </div>

      <div className="mb-4">
        <ErrorBanner message={error} onRetry={load} />
      </div>

      {!digests.length ? (
        <EmptyState
          title="No Current Affairs Published Yet"
          description="Admin-written daily key points and linked practice questions will appear here."
        />
      ) : (
        <div className="space-y-8">
          {digests.map((d) => (
            <article
              key={d.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                <Calendar className="h-4 w-4" />
                <span>{d.date}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{d.title}</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                {(d.points || []).map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>

              {d.linkedQuestions && d.linkedQuestions.length > 0 && (
                <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Practice Questions
                  </h3>
                  {d.linkedQuestions.map((q, idx) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      index={idx}
                      total={d.linkedQuestions!.length}
                      selectedOption={answers[q.id]}
                      onSelect={(opt) => setAnswers((p) => ({ ...p, [q.id]: opt }))}
                      showInstantFeedback={true}
                    />
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}