import type { OptionKey, Question } from '../../types';

export default function QuestionPalette({
  questions,
  currentIndex,
  answers,
  markedForReview,
  visited,
  onJump,
}: {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, OptionKey>;
  markedForReview: Record<string, boolean>;
  visited: Record<string, boolean>;
  onJump: (index: number) => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">
        Question Palette
      </h3>

      <div className="grid grid-cols-5 gap-2 mb-4">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = Boolean(answers[q.id]);
          const isReview = Boolean(markedForReview[q.id]);
          const isVisited = Boolean(visited[q.id]);

          let style = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
          if (isReview && isAnswered) {
            style = 'bg-purple-700 text-white';
          } else if (isReview) {
            style = 'bg-amber-600 text-white';
          } else if (isAnswered) {
            style = 'bg-emerald-600 text-white';
          } else if (isVisited) {
            style = 'bg-red-600 text-white';
          }

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(idx)}
              className={`min-h-[40px] rounded-lg text-xs font-bold tabular-nums transition ${style} ${
                isCurrent ? 'ring-2 ring-blue-700 dark:ring-blue-400 ring-offset-2 dark:ring-offset-slate-900' : ''
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-emerald-600 shrink-0" /> Answered
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-red-600 shrink-0" /> Not Answered
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-600 shrink-0" /> Review
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-purple-700 shrink-0" /> Ans + Review
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          <span className="h-3 w-3 rounded bg-slate-200 dark:bg-slate-700 shrink-0" /> Not Visited
        </div>
      </div>
    </div>
  );
}