import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckCircle2, ChevronDown, Clock, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { DEFAULT_EXAMS } from '../data/seedExams';
import type { Exam } from '../types';

const FAQS = [
  {
    q: 'Are questions written by humans or generated automatically?',
    a: 'Every question, solution, and daily current affairs digest on DailyPrep is manually authored and verified by exam mentors. Zero automated or AI-generated questions are used.',
  },
  {
    q: 'What is included in the Free Plan?',
    a: 'Free accounts receive 5 daily quiz questions every day along with full access to the Daily Current Affairs digest, bookmarks, and leaderboard.',
  },
  {
    q: 'What does the ₹200/month Premium plan unlock?',
    a: 'Premium unlocks full 10+ question daily quizzes, unlimited full-length timed mock tests with real negative marking, weak-topic analytics, and an ad-free experience.',
  },
  {
    q: 'Can I prepare for multiple exams and switch languages?',
    a: 'Yes. You can select multiple exams during onboarding and switch between English, Hindi, and Bengali anytime from your dashboard.',
  },
];

export default function LandingPage() {
  const [exams, setExams] = useState<Exam[]>(DEFAULT_EXAMS);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    apiFetch<{ exams: Exam[] }>('/api/exams')
      .then((res) => {
        if (res.exams?.length) setExams(res.exams);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-14 lg:pt-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 tracking-wide mb-3">
              Curated Daily Practice · SSC · Banking · Railways · UPSC · State PSC
            </p>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white [text-wrap:balance]">
              Daily Quizzes and Timed Mock Tests for Government Job Exams
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Pick your target exam and preferred language. Practice a fresh human-curated quiz every morning, take realistic CBT mock tests with negative marking, and track weak topics on your phone.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Link
                to="/auth"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors min-h-[48px]"
              >
                Start Free Daily Quiz
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors min-h-[48px]"
              >
                View ₹200/mo Plan
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                      Sample CBT Interface
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      SSC CGL · Quantitative Aptitude
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                    <Clock className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
                    <span>00:42</span>
                  </div>
                </div>

                <p className="mt-4 text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                  A train travelling at 72 km/h crosses a 240-metre platform in 25 seconds. What is the length of the train?
                </p>

                <div className="mt-4 space-y-2">
                  {[
                    { key: 'A', text: '220 metres', active: false },
                    { key: 'B', text: '260 metres', active: true },
                    { key: 'C', text: '280 metres', active: false },
                    { key: 'D', text: '300 metres', active: false },
                  ].map((opt) => (
                    <div
                      key={opt.key}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${
                        opt.active
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>
                        <strong className="mr-2">{opt.key}.</strong>
                        {opt.text}
                      </span>
                      {opt.active && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                  Mentor-Verified Explanation
                </span>
                <span className="font-mono tabular-nums">+2.0 / -0.50</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width 4-column key platform summary strip */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-200 dark:border-slate-800 pt-8">
          {[
            { metric: '7 Exam Categories', label: 'SSC, Banking, Railways, UPSC & State' },
            { metric: '3 Languages', label: 'English, Hindi & Bengali support' },
            { metric: '5 Free Qs / Day', label: 'Plus full Current Affairs digest' },
            { metric: '₹200 / Month', label: 'Unlimited mocks & full analytics' },
          ].map((item) => (
            <div key={item.metric}>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                {item.metric}
              </div>
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Supported Exams */}
      <section id="exams" className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Exams Covered on DailyPrep
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Structured subject and topic taxonomies managed directly by exam editors.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5">
                  {exam.shortName} · {exam.subjects?.length || 0} Subjects
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{exam.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">{exam.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Asymmetric Editorial List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white [text-wrap:balance]">
              Built for Phone-First Daily Discipline
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm sm:text-base">
              Clean, distraction-free study sessions that load fast on mobile networks and install directly onto your home screen.
            </p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                num: '01.',
                title: 'Scheduled Daily Quizzes',
                desc: 'Fresh daily sets across Quantitative Aptitude, Reasoning, English, General Awareness, and Current Affairs with instant explanations.',
              },
              {
                num: '02.',
                title: 'Realistic CBT Mock Interface',
                desc: 'Full-length timed tests featuring section tabs, mark-for-review palette, and authentic negative marking (0.25 or 0.50).',
              },
              {
                num: '03.',
                title: 'Accuracy & Weak-Topic Tracking',
                desc: 'Monitor daily streaks, score trajectories over time, per-question speed, and topics requiring revision.',
              },
              {
                num: '04.',
                title: 'Daily Current Affairs Digest',
                desc: 'Concise bullet-point current affairs written daily with linked practice questions and one-tap bookmarking.',
              },
            ].map((feat) => (
              <div
                key={feat.num}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <div className="text-sm font-mono font-bold text-blue-700 dark:text-blue-400 mb-2">
                  {feat.num}
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{feat.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Transparent Student Pricing
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base">
            Start free and upgrade only when you want full mock tests and analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Free Plan</h3>
              <p className="text-3xl font-extrabold mt-2 tabular-nums text-slate-900 dark:text-white">
                ₹0 <span className="text-sm font-normal text-slate-500">/ forever</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                {[
                  '5 Daily Quiz questions every day',
                  'Full Daily Current Affairs digest',
                  'Question bookmarks & exam leaderboard',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              to="/auth"
              className="mt-8 block text-center py-3 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px]"
            >
              Create Free Account
            </Link>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 dark:bg-blue-950 text-white border border-slate-800 dark:border-blue-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-bold">Premium Plan</h3>
                <span className="text-xs font-semibold text-amber-300">Recommended</span>
              </div>
              <p className="text-3xl font-extrabold mt-2 tabular-nums">
                ₹200 <span className="text-sm font-normal text-slate-300">/ month</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                {[
                  'Full Daily Quizzes (10+ questions/day)',
                  'Unlimited Full-Length Timed Mock Tests',
                  'Sectional timing & negative marking breakdown',
                  'Weak-topic analytics & ad-free study mode',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              to="/pricing"
              className="mt-8 block text-center py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 min-h-[44px]"
            >
              Upgrade to Premium
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQS.map((item, idx) => (
            <div
              key={item.q}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm sm:text-base text-slate-900 dark:text-white min-h-[52px]"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    openFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}