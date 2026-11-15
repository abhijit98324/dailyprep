import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, ExternalLink, QrCode, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import type { UpiPaymentRequest, UpiSettings } from '../types';
import ErrorBanner from '../components/common/ErrorBanner';

const DEFAULT_UPI: UpiSettings = {
  upiId: 'dailyprep@upi',
  payeeName: 'DailyPrep',
  monthlyPriceInr: 200,
};

const UPI_APPS = ['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay', 'Other'];

export default function PricingPage() {
  const { user, isPremium, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [upiSettings, setUpiSettings] = useState<UpiSettings>(DEFAULT_UPI);
  const [myRequests, setMyRequests] = useState<UpiPaymentRequest[]>([]);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [showUpiBox, setShowUpiBox] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const [utrNumber, setUtrNumber] = useState('');
  const [upiApp, setUpiApp] = useState('Google Pay');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [error, setError] = useState('');

  const loadUpiInfo = async () => {
    setLoadingInfo(true);
    try {
      const res = await apiFetch<{
        upiSettings: UpiSettings;
        myRequests: UpiPaymentRequest[];
      }>('/api/payments/upi-info');
      if (res.upiSettings) setUpiSettings(res.upiSettings);
      setMyRequests(res.myRequests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load UPI payment details.');
    } finally {
      setLoadingInfo(false);
    }
  };

  useEffect(() => {
    loadUpiInfo();
  }, [user?.id]);

  const upiUri = useMemo(() => {
    const params = new URLSearchParams({
      pa: upiSettings.upiId,
      pn: upiSettings.payeeName,
      am: String(upiSettings.monthlyPriceInr || 200),
      cu: 'INR',
      tn: 'DailyPrep Monthly Premium',
    });
    return `upi://pay?${params.toString()}`;
  }, [upiSettings]);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(upiUri, {
      width: 240,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [upiUri]);

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(upiSettings.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy automatically. Please select and copy the UPI ID manually.');
    }
  };

  const handleStartUpiPayment = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowUpiBox(true);
  };

  const handleSubmitUtr = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }

    setError('');
    setSubmitSuccess('');
    setSubmitting(true);
    try {
      const res = await apiFetch<{ request: UpiPaymentRequest }>('/api/payments/upi-submit', {
        method: 'POST',
        body: JSON.stringify({ utrNumber: utrNumber.trim(), upiApp }),
      });
      setMyRequests((prev) => [res.request, ...prev]);
      setUtrNumber('');
      setSubmitSuccess(
        'UTR submitted! Admin will verify your payment and activate Premium shortly.'
      );
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit UTR.');
    } finally {
      setSubmitting(false);
    }
  };

  const price = upiSettings.monthlyPriceInr || 200;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Upgrade Your Exam Preparation
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base">
          Zero gateway fees — pay ₹{price}/month directly via any Indian UPI app.
        </p>
      </div>

      <div className="mb-6">
        <ErrorBanner message={error} />
      </div>

      {submitSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-medium flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Free Plan</h2>
            <p className="text-3xl font-extrabold mt-2 tabular-nums text-slate-900 dark:text-white">
              ₹0 <span className="text-sm font-normal text-slate-500">/ forever</span>
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700 dark:text-slate-300">
              {[
                '5 Daily Quiz questions per day',
                'Daily Current Affairs Digest',
                'Question Bookmarks',
                'Daily & Weekly Leaderboard',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          {!user && (
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="mt-8 w-full py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[48px]"
            >
              Start Free Account
            </button>
          )}
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 dark:bg-blue-950 text-white border border-slate-800 dark:border-blue-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Premium Plan</h2>
              <span className="text-xs font-semibold text-amber-300">All Access · UPI</span>
            </div>
            <p className="text-3xl font-extrabold mt-2 tabular-nums">
              ₹{price} <span className="text-sm font-normal text-slate-300">/ month</span>
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              {[
                'Full Daily Quizzes (10+ curated questions/day)',
                'Unlimited Full-Length Timed Mock Tests',
                'Real CBT palette, sectional timing & negative marking',
                'Weak-topic analytics & score tracking',
                '100% Ad-free study mode',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            disabled={isPremium || loadingInfo}
            onClick={handleStartUpiPayment}
            className="mt-8 w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-60 min-h-[48px] flex items-center justify-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            <span>
              {isPremium
                ? 'Premium Active'
                : !user
                ? `Sign in to Pay ₹${price} via UPI`
                : showUpiBox
                ? 'UPI Payment Details Below'
                : `Pay ₹${price}/month via UPI`}
            </span>
          </button>
        </div>
      </div>

      {user && !isPremium && (showUpiBox || myRequests.length > 0) && (
        <section className="mt-8 p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Pay ₹{price} via UPI & Verify UTR
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Scan the QR code or use any UPI app, then submit your 12-digit UTR / Transaction ID.
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
              1 Month Validity
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col items-center p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              {qrDataUrl ? (
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <img
                    src={qrDataUrl}
                    alt={`UPI QR code for ${upiSettings.payeeName}`}
                    className="w-48 h-48 block"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                  Generating QR...
                </div>
              )}

              <div className="w-full space-y-2 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Payee: {upiSettings.payeeName}
                </p>
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {upiSettings.upiId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[36px] shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <a
                href={upiUri}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2 min-h-[48px] text-center"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span>Open UPI App (GPay / PhonePe / Paytm)</span>
              </a>
            </div>

            <form onSubmit={handleSubmitUtr} className="space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Step 2: Enter Payment Reference (UTR)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  After completing the ₹{price} transfer, copy the 12-digit UTR or UPI Ref No. from your app receipt.
                </p>
              </div>

              <div>
                <label
                  htmlFor="upi-app-select"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  UPI App Used
                </label>
                <select
                  id="upi-app-select"
                  value={upiApp}
                  onChange={(e) => setUpiApp(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm min-h-[44px]"
                >
                  {UPI_APPS.map((app) => (
                    <option key={app} value={app}>
                      {app}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="utr-input"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  UTR / UPI Transaction ID
                </label>
                <input
                  id="utr-input"
                  type="text"
                  required
                  minLength={8}
                  maxLength={40}
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 412345678901"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-mono tabular-nums min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-semibold text-sm disabled:opacity-60 min-h-[48px]"
              >
                {submitting ? 'Submitting UTR...' : 'Submit Payment for Verification'}
              </button>
            </form>
          </div>
        </section>
      )}

      {user && myRequests.length > 0 && (
        <section className="mt-8 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Your UPI Payment Requests
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {myRequests.map((req) => (
              <div
                key={req.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
                    ₹{req.amountInr} · {req.upiApp}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    UTR: {req.utrNumber} · {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold capitalize ${
                    req.status === 'approved'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : req.status === 'rejected'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {req.status === 'pending' ? 'Pending Verification' : req.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}