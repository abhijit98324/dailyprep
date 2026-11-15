import React from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  skipOnboardingCheck = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  skipOnboardingCheck?: boolean;
}) {
  const { user, loading, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner label="Checking session..." />;
  if (!user) {
    const target = requireAdmin ? '/auth?mode=admin' : '/auth';
    return <Navigate to={target} state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Admin Access Required
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You are currently signed in as{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{user.email}</span>{' '}
            (role: <span className="font-semibold">{user.role}</span>).
          </p>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              How to open the Admin Panel:
            </p>
            <p>
              1. Switch to your admin account (default:{' '}
              <span className="font-mono">admin@dailyprep.in</span> or your{' '}
              <span className="font-mono">ADMIN_EMAIL</span>).
            </p>
            <p>
              2. Or promote this account via CLI:{' '}
              <span className="font-mono">node scripts/make-admin.mjs {user.email}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/auth?mode=admin', { state: { from: { pathname: '/admin' } } });
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold min-h-[44px]"
            >
              Switch to Admin Login
            </button>
            <Link
              to="/dashboard"
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold min-h-[44px] inline-flex items-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!skipOnboardingCheck && !user.onboarded && !isAdmin) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}