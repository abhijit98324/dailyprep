import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';

export default function PaywallModal({
  open,
  onClose,
  title = 'Unlock DailyPrep Premium',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 relative shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
          Premium Plan · ₹200/month
        </p>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white pr-8">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
          Free users get 5 daily quiz questions per day. Upgrade for full daily quizzes and unlimited mock tests.
        </p>

        <ul className="mt-5 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
          {[
            'Full Daily Quizzes (10+ curated questions every day)',
            'Unlimited Full-Length Exam Mock Tests',
            'Sectional timing & negative marking analysis',
            'Weak topic analytics & ad-free experience',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex gap-3">
          <Link
            to="/pricing"
            onClick={onClose}
            className="flex-1 text-center py-2.5 px-4 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 min-h-[44px] flex items-center justify-center"
          >
            Upgrade for ₹200/mo
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium min-h-[44px]"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}