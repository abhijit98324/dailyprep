import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
      <Loader2 className="h-7 w-7 animate-spin text-blue-700 dark:text-blue-400 mb-3" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}