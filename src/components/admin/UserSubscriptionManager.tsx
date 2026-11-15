import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch } from '../../lib/api';
import type { UpiPaymentRequest, UpiSettings, UserProfile } from '../../types';

export default function UserSubscriptionManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [upiSettings, setUpiSettings] = useState<UpiSettings>({
    upiId: 'dailyprep@upi',
    payeeName: 'DailyPrep',
    monthlyPriceInr: 200,
  });
  const [upiRequests, setUpiRequests] = useState<UpiPaymentRequest[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [processingId, setProcessingId] = useState('');

  const load = async () => {
    try {
      const [usersRes, upiRes] = await Promise.all([
        apiFetch<{ users: UserProfile[] }>('/api/admin/users'),
        apiFetch<{ upiSettings: UpiSettings; requests: UpiPaymentRequest[] }>('/api/admin/upi'),
      ]);
      setUsers(usersRes.users || []);
      if (upiRes.upiSettings) setUpiSettings(upiRes.upiSettings);
      setUpiRequests(upiRes.requests || []);
    } catch {
      // ignore initial error if unauthenticated
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSaveUpiSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage('');
    try {
      const res = await apiFetch<{ upiSettings: UpiSettings }>('/api/admin/upi-settings', {
        method: 'PATCH',
        body: JSON.stringify({
          upiId: upiSettings.upiId.trim(),
          payeeName: upiSettings.payeeName.trim(),
          monthlyPriceInr: Number(upiSettings.monthlyPriceInr) || 200,
        }),
      });
      setUpiSettings(res.upiSettings);
      setSettingsMessage('UPI settings saved.');
    } catch (err) {
      setSettingsMessage(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleReviewUpiRequest = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      await apiFetch(`/api/admin/upi-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setProcessingId('');
    }
  };

  const togglePremium = async (u: UserProfile) => {
    const isPrem = u.plan === 'premium';
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    await apiFetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        plan: isPrem ? 'free' : 'premium',
        premiumUntil: isPrem ? null : nextMonth.toISOString(),
      }),
    });
    load();
  };

  const toggleRole = async (u: UserProfile) => {
    await apiFetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: u.role === 'admin' ? 'student' : 'admin' }),
    });
    load();
  };

  const pendingCount = upiRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSaveUpiSettings}
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">
              UPI Payment Settings
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Students see this UPI ID and QR code on the Pricing page.
            </p>
          </div>
          {settingsMessage && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {settingsMessage}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Merchant / Personal UPI ID
            </label>
            <input
              type="text"
              required
              value={upiSettings.upiId}
              onChange={(e) => setUpiSettings((s) => ({ ...s, upiId: e.target.value }))}
              placeholder="name@bank"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Payee Display Name
            </label>
            <input
              type="text"
              required
              value={upiSettings.payeeName}
              onChange={(e) => setUpiSettings((s) => ({ ...s, payeeName: e.target.value }))}
              placeholder="DailyPrep"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Monthly Price (INR)
            </label>
            <input
              type="number"
              required
              min={1}
              value={upiSettings.monthlyPriceInr}
              onChange={(e) =>
                setUpiSettings((s) => ({ ...s, monthlyPriceInr: Number(e.target.value) || 200 }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm tabular-nums min-h-[44px]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingSettings}
          className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold min-h-[44px] disabled:opacity-60"
        >
          {savingSettings ? 'Saving...' : 'Save UPI Details'}
        </button>
      </form>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="font-bold text-lg text-slate-900 dark:text-white tabular-nums">
          UPI Payment Verification Queue ({pendingCount} pending · {upiRequests.length} total)
        </h2>
        {!upiRequests.length ? (
          <p className="text-sm text-slate-500">No UPI UTR submissions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 pr-4">Student</th>
                  <th className="py-2.5 pr-4">UTR / Ref ID</th>
                  <th className="py-2.5 pr-4">App & Amount</th>
                  <th className="py-2.5 pr-4">Status</th>
                  <th className="py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {upiRequests.map((req) => (
                  <tr key={req.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-900 dark:text-white">{req.userName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{req.userEmail}</p>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                      {req.utrNumber}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-slate-700 dark:text-slate-300">
                      ₹{req.amountInr} · {req.upiApp}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`text-xs font-bold capitalize ${
                          req.status === 'approved'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : req.status === 'rejected'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 flex flex-wrap gap-2">
                      {req.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            disabled={processingId === req.id}
                            onClick={() => handleReviewUpiRequest(req.id, 'approved')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold min-h-[44px] disabled:opacity-60"
                          >
                            Approve (1M Premium)
                          </button>
                          <button
                            type="button"
                            disabled={processingId === req.id}
                            onClick={() => handleReviewUpiRequest(req.id, 'rejected')}
                            className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-semibold min-h-[44px] disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {req.reviewedAt
                            ? `Reviewed ${new Date(req.reviewedAt).toLocaleDateString()}`
                            : 'Processed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="font-bold text-lg text-slate-900 dark:text-white tabular-nums">
          Users & Subscriptions ({users.length})
        </h2>
        {!users.length ? (
          <p className="text-sm text-slate-500">No users registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 pr-4">Name</th>
                  <th className="py-2.5 pr-4">Email</th>
                  <th className="py-2.5 pr-4">Role</th>
                  <th className="py-2.5 pr-4">Plan</th>
                  <th className="py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">
                      {u.displayName}
                    </td>
                    <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="py-3 pr-4 capitalize">{u.role}</td>
                    <td className="py-3 pr-4 font-semibold capitalize">{u.plan}</td>
                    <td className="py-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => togglePremium(u)}
                        className="px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold min-h-[44px]"
                      >
                        {u.plan === 'premium' ? 'Revoke Premium' : 'Grant 1M Premium'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRole(u)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold min-h-[44px]"
                      >
                        {u.role === 'admin' ? 'Make Student' : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}