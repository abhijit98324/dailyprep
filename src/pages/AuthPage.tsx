import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import ErrorBanner from '../components/common/ErrorBanner';

type AuthMode = 'signin' | 'signup' | 'admin' | 'forgot';

export default function AuthPage() {
  const { loginWithEmail, registerWithEmail, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const initialParam = searchParams.get('mode');
  const initialMode: AuthMode =
    initialParam === 'signup' || initialParam === 'admin' || initialParam === 'forgot'
      ? initialParam
      : 'signin';

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [adminCreateMode, setAdminCreateMode] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Forgot password state
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [previewCode, setPreviewCode] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const p = searchParams.get('mode');
    if (p === 'signin' || p === 'signup' || p === 'admin' || p === 'forgot') {
      setMode(p);
    }
  }, [searchParams]);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError('');
    setInfoMessage('');
    if (next !== 'forgot') {
      setResetStep('request');
      setPreviewCode('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
    }
    if (next === 'admin' && !email) {
      setEmail('admin@dailyprep.in');
    }
    setSearchParams(next === 'signin' ? {} : { mode: next }, { replace: true });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      const isCreating = mode === 'signup' || (mode === 'admin' && adminCreateMode);
      const u = isCreating
        ? await registerWithEmail(displayName, email, password)
        : await loginWithEmail(email, password);

      if (mode === 'admin') {
        if (u.role !== 'admin') {
          await logout();
          setError(
            `Signed in as "${u.email}", which is a student account. Use your ADMIN_EMAIL (default: admin@dailyprep.in) or promote this account with: node scripts/make-admin.mjs ${u.email}`
          );
          return;
        }
        navigate('/admin', { replace: true });
        return;
      }

      if (!u.onboarded && u.role !== 'admin') {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(from === '/auth' ? '/dashboard' : from, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setPreviewCode('');
    setLoading(true);
    try {
      const res = await apiFetch<{
        ok: boolean;
        deliveryMode: 'email' | 'preview';
        previewCode?: string;
        message: string;
      }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setInfoMessage(res.message);
      if (res.previewCode) {
        setPreviewCode(res.previewCode);
      }
      setResetStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ ok: boolean; message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          code: resetCode.trim(),
          newPassword,
        }),
      });
      setResetStep('request');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setPreviewCode('');
      setPassword('');
      setMode('signin');
      setSearchParams({}, { replace: true });
      setInfoMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const isCreating = mode === 'signup' || (mode === 'admin' && adminCreateMode);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
        <div
          role="tablist"
          aria-label="Account mode"
          className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-6"
        >
          {(
            [
              { id: 'signin', label: 'Sign In' },
              { id: 'signup', label: 'Sign Up' },
              { id: 'admin', label: 'Admin' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={mode === t.id}
              onClick={() => switchMode(t.id)}
              className={`py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold min-h-[44px] transition-colors ${
                mode === t.id
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {mode === 'forgot'
            ? 'Reset your password'
            : mode === 'admin'
            ? adminCreateMode
              ? 'Create Admin Account'
              : 'Admin Panel Login'
            : mode === 'signup'
            ? 'Create your DailyPrep account'
            : 'Sign in to DailyPrep'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {mode === 'forgot'
            ? 'Verify your email with a 6-digit reset code to set a new password.'
            : mode === 'admin'
            ? 'Sign in with your configured ADMIN_EMAIL (default: admin@dailyprep.in).'
            : mode === 'signup'
            ? 'Start with 5 free daily questions and current affairs.'
            : 'Continue your daily exam preparation.'}
        </p>

        {mode === 'admin' && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-blue-700 dark:text-blue-400" />
            <div className="space-y-1">
              <p>
                First time here? Choose <strong>Create Admin Account</strong> below using{' '}
                <span className="font-mono font-semibold">admin@dailyprep.in</span> (or your{' '}
                <span className="font-mono">ADMIN_EMAIL</span>) to open <span className="font-mono">/admin</span>.
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <ErrorBanner message={error} />
          {infoMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>{infoMessage}</p>
                {previewCode && (
                  <p className="font-mono font-bold text-sm tabular-nums text-emerald-900 dark:text-emerald-100">
                    Reset Code: {previewCode}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {mode === 'forgot' ? (
          resetStep === 'request' ? (
            <form onSubmit={handleRequestReset} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aspirant@example.com"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm min-h-[44px]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2"
              >
                <KeyRound className="h-4 w-4" />
                <span>{loading ? 'Sending Code...' : 'Get 6-Digit Reset Code'}</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="w-full py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:underline min-h-[44px]"
              >
                Back to Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  6-Digit Reset Code
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  maxLength={12}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-mono tabular-nums min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm min-h-[44px]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 min-h-[48px]"
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setResetStep('request')}
                  className="text-blue-700 dark:text-blue-400 font-semibold hover:underline min-h-[36px]"
                >
                  Resend code
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-slate-500 dark:text-slate-400 font-semibold hover:underline min-h-[36px]"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )
        ) : (
          <>
            <form onSubmit={handleAuthSubmit} className="mt-5 space-y-4">
              {isCreating && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={mode === 'admin' ? 'Admin Name' : 'Ananya Roy'}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm min-h-[44px]"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'admin' ? 'admin@dailyprep.in' : 'aspirant@example.com'}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm min-h-[44px]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {!isCreating && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 min-h-[48px]"
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'admin'
                  ? adminCreateMode
                    ? 'Create Admin Account & Open Panel'
                    : 'Sign In to Admin Panel'
                  : isCreating
                  ? 'Create Account'
                  : 'Sign In'}
              </button>
            </form>

            {mode === 'admin' ? (
              <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                {adminCreateMode ? 'Already registered as Admin?' : 'Need to register admin email first?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAdminCreateMode((s) => !s);
                    setError('');
                  }}
                  className="text-blue-700 dark:text-blue-400 font-semibold hover:underline"
                >
                  {adminCreateMode ? 'Admin Sign In' : 'Create Admin Account'}
                </button>
              </p>
            ) : (
              <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                {mode === 'signup' ? 'Already have an account?' : 'New to DailyPrep?'}{' '}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
                  className="text-blue-700 dark:text-blue-400 font-semibold hover:underline"
                >
                  {mode === 'signup' ? 'Sign In' : 'Create an account'}
                </button>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}