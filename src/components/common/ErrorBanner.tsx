import { AlertCircle } from 'lucide-react';

export default function ErrorBanner({
  message,
  onRetry,
}: {
  message?: string | null;
  onRetry?: () => void;
}) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="font-semibold underline shrink-0 min-h-[44px] px-2 flex items-center"
        >
          Retry
        </button>
      )}
    </div>
  );
}