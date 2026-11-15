import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import PWAInstallButton from './PWAInstallButton';

export default function Navbar() {
  const { dark, toggleTheme } = useTheme();
  const { user, isPremium, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setOpen(false);
  };

  const desktopLinks = user
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/daily-quiz', label: 'Daily Quiz' },
        { to: '/mock-tests', label: 'Mock Tests' },
        { to: '/current-affairs', label: 'Current Affairs' },
        { to: '/admin', label: 'Admin' },
      ]
    : [
        { to: '/current-affairs', label: 'Current Affairs' },
        { to: '/pricing', label: 'Pricing' },
        { to: '/#exams', label: 'Exams' },
        { to: '/admin', label: 'Admin' },
      ];

  const mobileLinks = user
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/daily-quiz', label: 'Daily Quiz' },
        { to: '/mock-tests', label: 'Mock Tests' },
        { to: '/current-affairs', label: 'Current Affairs' },
        { to: '/leaderboard', label: 'Leaderboard' },
        { to: '/bookmarks', label: 'Bookmarks' },
        { to: '/pricing', label: isPremium ? 'Plan Status' : 'Upgrade (₹200/mo)' },
        { to: '/admin', label: 'Admin Panel' },
      ]
    : [
        { to: '/current-affairs', label: 'Current Affairs' },
        { to: '/pricing', label: 'Pricing' },
        { to: '/admin', label: 'Admin Panel' },
        { to: '/auth', label: 'Sign In' },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
        <Link
          to={user ? '/dashboard' : '/'}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          DailyPrep
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {desktopLinks.map((link) =>
            link.to.startsWith('/#') ? (
              <a
                key={link.to}
                href={link.to}
                className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                {link.label}
              </a>
            ) : (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                    isActive ? 'text-blue-700 dark:text-blue-400 font-semibold underline' : ''
                  }`
                }
              >
                {link.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:block">
            {user ? (
              !isPremium ? (
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Upgrade ₹200/mo
                </Link>
              ) : (
                <Link
                  to="/bookmarks"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                >
                  Saved Questions
                </Link>
              )
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
              >
                Start Practicing
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-1">
          {mobileLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center min-h-[44px] px-3 rounded-xl text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}

          <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <PWAInstallButton compact />

            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3 min-h-[44px] rounded-xl text-sm font-medium text-red-600 dark:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}