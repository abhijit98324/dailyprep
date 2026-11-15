import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import PWAInstallButton from './PWAInstallButton';

export default function Footer() {
  const { dark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-16 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
        <div className="space-y-3">
          <div className="font-bold text-lg text-slate-900 dark:text-white">DailyPrep</div>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Human-curated daily quizzes, exam-pattern mock tests, and daily current affairs for Indian government job aspirants.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 min-h-[40px]"
            >
              {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span>{dark ? 'Light Theme' : 'Dark Theme'}</span>
            </button>
            <PWAInstallButton compact />
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Exams Covered</h4>
          <ul className="space-y-2 text-slate-500 dark:text-slate-400">
            <li>SSC CGL, CHSL, MTS & CPO</li>
            <li>IBPS, SBI & RBI Banking</li>
            <li>RRB NTPC, Group D & ALP</li>
            <li>UPSC Prelims & State PSCs</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Platform</h4>
          <ul className="space-y-2 text-slate-500 dark:text-slate-400">
            <li><Link to="/daily-quiz" className="hover:text-blue-700 dark:hover:text-blue-400">Daily Quiz</Link></li>
            <li><Link to="/mock-tests" className="hover:text-blue-700 dark:hover:text-blue-400">Mock Tests</Link></li>
            <li><Link to="/current-affairs" className="hover:text-blue-700 dark:hover:text-blue-400">Current Affairs</Link></li>
            <li><Link to="/pricing" className="hover:text-blue-700 dark:hover:text-blue-400">Pricing</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900 dark:text-white">Account & Support</h4>
          <p className="text-slate-500 dark:text-slate-400">
            Spot a mistake? Use the Report Error button directly inside any quiz question to notify the exam team.
          </p>
          {user && (
            <button
              type="button"
              onClick={logout}
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 underline hover:text-red-600"
            >
              Sign out ({user.email})
            </button>
          )}
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} DailyPrep.</p>
        </div>
      </div>
    </footer>
  );
}