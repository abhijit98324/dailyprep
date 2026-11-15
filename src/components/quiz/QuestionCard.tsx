import { Bookmark, CheckCircle2, Flag, XCircle } from 'lucide-react';
import type { OptionKey, Question } from '../../types';

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

export default function QuestionCard({
  question,
  index,
  total,
  selectedOption,
  onSelect,
  showInstantFeedback = false,
  isBookmarked = false,
  onToggleBookmark,
  onReport,
}: {
  question: Question;
  index: number;
  total: number;
  selectedOption?: OptionKey;
  onSelect: (option: OptionKey) => void;
  showInstantFeedback?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (q: Question) => void;
  onReport?: (q: Question) => void;
}) {
  const options: { key: OptionKey; text: string }[] = [
    { key: 'A', text: question.optionA },
    { key: 'B', text: question.optionB },
    { key: 'C', text: question.optionC },
    { key: 'D', text: question.optionD },
  ];

  const hasAnswered = Boolean(selectedOption);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
            Question {index + 1} of {total}
          </span>
          <span aria-hidden="true">·</span>
          <span>{question.subject}</span>
          {question.topic && (
            <>
              <span aria-hidden="true">·</span>
              <span>{question.topic}</span>
            </>
          )}
          {question.difficulty && (
            <>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{question.difficulty}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onToggleBookmark && (
            <button
              type="button"
              onClick={() => onToggleBookmark(question)}
              title="Bookmark question"
              aria-label="Bookmark question"
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-colors ${
                isBookmarked
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark className="h-4 w-4" fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
          )}
          {onReport && (
            <button
              type="button"
              onClick={() => onReport(question)}
              title="Report an error"
              aria-label="Report an error"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Flag className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <p className="text-base sm:text-lg font-medium leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-line mb-5">
        {question.question}
      </p>

      <div className="space-y-3">
        {options.map((opt, idx) => {
          const isSelected = selectedOption === opt.key;
          const isCorrect = question.correctOption === opt.key;

          let cardClass =
            'border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-slate-950/40';

          if (showInstantFeedback && hasAnswered) {
            if (isCorrect) {
              cardClass =
                'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
            } else if (isSelected && !isCorrect) {
              cardClass =
                'border-red-600 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200';
            }
          } else if (isSelected) {
            cardClass =
              'border-blue-700 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-700 dark:ring-blue-500';
          }

          return (
            <button
              key={opt.key}
              type="button"
              disabled={showInstantFeedback && hasAnswered}
              onClick={() => onSelect(opt.key)}
              className={`w-full text-left flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border transition-colors min-h-[48px] ${cardClass}`}
            >
              <div className="flex items-start gap-3">
                <span className="h-7 w-7 shrink-0 rounded-lg border border-current/25 flex items-center justify-center text-xs font-bold tabular-nums">
                  {OPTION_KEYS[idx]}
                </span>
                <span className="text-sm sm:text-base">{opt.text}</span>
              </div>
              {showInstantFeedback && hasAnswered && isCorrect && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="h-4 w-4" /> Correct
                </span>
              )}
              {showInstantFeedback && hasAnswered && isSelected && !isCorrect && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400 shrink-0">
                  <XCircle className="h-4 w-4" /> Wrong
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showInstantFeedback && hasAnswered && question.explanation && (
        <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
          <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">
            Explanation
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}