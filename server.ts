import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  getTodayDateStr,
  getWeekKey,
  hashPassword,
  hashResetCode,
  readDb,
  sanitizeUser,
  signToken,
  verifyPassword,
  verifyToken,
  writeDb,
} from './server/store.ts';
import type { StoredUser } from './server/store.ts';
import type {
  Attempt,
  CurrentAffairsDigest,
  OptionKey,
  Question,
  Quiz,
  SectionResult,
  TopicStat,
} from './src/types.ts';

const FREE_DAILY_LIMIT = 5;
const PORT = Number(process.env.PORT || 3000);

function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAIL || 'admin@dailyprep.in';
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

function isUserPremium(user: StoredUser): boolean {
  if (user.role === 'admin') return true;
  if (user.plan !== 'premium') return false;
  if (!user.premiumUntil) return true;
  return new Date(user.premiumUntil) > new Date();
}

function extractToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('dp_token='));
    if (match) return decodeURIComponent(match.slice('dp_token='.length));
  }
  return null;
}

function getAuthUser(req: express.Request): StoredUser | null {
  const token = extractToken(req);
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const db = readDb();
  return db.users.find((u) => u.id === decoded.uid) || null;
}

function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  (req as express.Request & { authUser: StoredUser }).authUser = user;
  next();
}

function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  (req as express.Request & { authUser: StoredUser }).authUser = user;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // --- AUTH ---
  app.post('/api/auth/register', (req, res) => {
    const { displayName, email, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(displayName || '').trim() || 'Aspirant';
    if (!cleanEmail || !password || String(password).length < 6) {
      res.status(400).json({ error: 'Valid email and password (min 6 characters) are required.' });
      return;
    }

    const db = readDb();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const adminEmails = getAdminEmails();
    const isAdmin = adminEmails.has(cleanEmail);
    const nowIso = new Date().toISOString();
    const newUser: StoredUser = {
      id: `usr_${crypto.randomUUID().slice(0, 12)}`,
      email: cleanEmail,
      displayName: cleanName,
      passwordHash: hashPassword(String(password)),
      role: isAdmin ? 'admin' : 'student',
      selectedExams: [],
      primaryExam: 'ssc',
      language: 'English',
      onboarded: isAdmin,
      plan: isAdmin ? 'premium' : 'free',
      premiumUntil: null,
      streak: 0,
      lastActiveDate: null,
      dailyUsageDate: null,
      dailyQuestionsUsed: 0,
      totalPracticed: 0,
      topicStats: {},
      createdAt: nowIso,
    };

    db.users.push(newUser);
    writeDb(db);

    const token = signToken(newUser.id);
    res.cookie('dp_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 86400000 });
    res.json({ token, user: sanitizeUser(newUser) });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const db = readDb();
    const idx = db.users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    const user = idx !== -1 ? db.users[idx] : undefined;
    if (!user || !verifyPassword(String(password || ''), user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (getAdminEmails().has(cleanEmail) && user.role !== 'admin') {
      db.users[idx].role = 'admin';
      db.users[idx].plan = 'premium';
      db.users[idx].onboarded = true;
      writeDb(db);
    }

    const token = signToken(user.id);
    res.cookie('dp_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 86400000 });
    res.json({ token, user: sanitizeUser(db.users[idx]) });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    const cleanEmail = String(req.body?.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const db = readDb();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    const hasResend = Boolean(process.env.RESEND_API_KEY);

    if (!user) {
      if (hasResend) {
        res.json({
          ok: true,
          deliveryMode: 'email',
          message: 'If an account exists for that email, a 6-digit reset code has been sent.',
        });
        return;
      }
      res.status(404).json({ error: 'No account found with that email address.' });
      return;
    }

    const code = String(crypto.randomInt(100000, 999999));
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    for (const r of db.passwordResets) {
      if (r.userId === user.id && !r.used) {
        r.used = true;
      }
    }

    db.passwordResets.unshift({
      id: `rst_${crypto.randomUUID().slice(0, 12)}`,
      userId: user.id,
      email: cleanEmail,
      codeHash: hashResetCode(code),
      expiresAt,
      used: false,
      createdAt: nowIso,
    });
    writeDb(db);

    if (hasResend) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'DailyPrep <onboarding@resend.dev>',
            to: [cleanEmail],
            subject: 'DailyPrep Password Reset Code',
            text: `Your DailyPrep password reset code is: ${code}\n\nThis code expires in 15 minutes.`,
          }),
        });
        if (!emailRes.ok) {
          throw new Error(`Email service returned ${emailRes.status}`);
        }
        res.json({
          ok: true,
          deliveryMode: 'email',
          message: 'A 6-digit reset code has been sent to your email address.',
        });
        return;
      } catch (err) {
        console.error('Failed to send reset email:', err);
        res.status(502).json({ error: 'Unable to send reset email right now. Please try again later.' });
        return;
      }
    }

    console.log(`[DailyPrep] Password reset code for ${cleanEmail}: ${code} (expires in 15m)`);
    res.json({
      ok: true,
      deliveryMode: 'preview',
      previewCode: code,
      message: 'Reset code generated (email delivery is not configured in preview mode).',
    });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const cleanEmail = String(req.body?.email || '').trim().toLowerCase();
    const cleanCode = String(req.body?.code || '').trim();
    const newPassword = String(req.body?.newPassword || '');

    if (!cleanEmail || !cleanCode) {
      res.status(400).json({ error: 'Email and 6-digit reset code are required.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const db = readDb();
    const now = new Date();
    const codeHash = hashResetCode(cleanCode);
    const resetIdx = db.passwordResets.findIndex(
      (r) =>
        r.email === cleanEmail &&
        !r.used &&
        r.codeHash === codeHash &&
        new Date(r.expiresAt) > now
    );

    if (resetIdx === -1) {
      res.status(400).json({ error: 'Invalid or expired reset code.' });
      return;
    }

    const userIdx = db.users.findIndex((u) => u.id === db.passwordResets[resetIdx].userId);
    if (userIdx === -1) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    db.users[userIdx].passwordHash = hashPassword(newPassword);
    db.passwordResets[resetIdx].used = true;
    writeDb(db);

    res.json({ ok: true, message: 'Password updated. You can now sign in with your new password.' });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie('dp_token');
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.json({ user: null });
      return;
    }
    res.json({ user: sanitizeUser(user) });
  });

  app.patch('/api/auth/preferences', requireAuth, (req, res) => {
    const authUser = (req as express.Request & { authUser: StoredUser }).authUser;
    const { selectedExams, primaryExam, language, onboarded, displayName } = req.body || {};
    const db = readDb();
    const idx = db.users.findIndex((u) => u.id === authUser.id);
    if (idx === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (Array.isArray(selectedExams)) db.users[idx].selectedExams = selectedExams;
    if (typeof primaryExam === 'string' && primaryExam) db.users[idx].primaryExam = primaryExam;
    if (language === 'English' || language === 'Hindi' || language === 'Bengali') {
      db.users[idx].language = language;
    }
    if (typeof onboarded === 'boolean') db.users[idx].onboarded = onboarded;
    if (typeof displayName === 'string' && displayName.trim()) {
      db.users[idx].displayName = displayName.trim();
    }

    writeDb(db);
    res.json({ user: sanitizeUser(db.users[idx]) });
  });

  // --- EXAMS ---
  app.get('/api/exams', (_req, res) => {
    const db = readDb();
    res.json({ exams: db.exams });
  });

  // --- STUDENT QUIZZES & MOCK TESTS ---
  app.get('/api/daily-quiz', requireAuth, (req, res) => {
    const authUser = (req as express.Request & { authUser: StoredUser }).authUser;
    const examId = String(req.query.examId || authUser.primaryExam || 'ssc');
    const today = getTodayDateStr();
    const db = readDb();

    const published = db.quizzes
      .filter((q) => q.type === 'daily' && q.examId === examId && q.status === 'published')
      .sort((a, b) => (b.scheduledDate || '').localeCompare(a.scheduledDate || ''));

    const exact = published.find((q) => q.scheduledDate === today);
    const quiz = exact || published[0] || null;
    const isFallback = Boolean(!exact && quiz);

    if (!quiz) {
      res.json({ quiz: null, isFallback: false, questions: [], totalInQuiz: 0 });
      return;
    }

    const qMap = new Map(db.questions.map((q) => [q.id, q]));
    const allQuestions = quiz.questionIds.map((id) => qMap.get(id)).filter(Boolean) as Question[];
    const premium = isUserPremium(authUser);
    const visibleQuestions = premium ? allQuestions : allQuestions.slice(0, FREE_DAILY_LIMIT);

    res.json({
      quiz,
      isFallback,
      questions: visibleQuestions,
      totalInQuiz: allQuestions.length,
      freeLimit: FREE_DAILY_LIMIT,
    });
  });

  app.get('/api/mock-tests', requireAuth, (req, res) => {
    const authUser = (req as express.Request & { authUser: StoredUser }).authUser;
    const examId = String(req.query.examId || authUser.primaryExam || 'ssc');
    const db = readDb();
    const mocks = db.quizzes.filter(
      (q) => q.type === 'mock' && q.examId === examId && q.status === 'published'
    );
    res.json({ mocks });
  });

  app.get('/api/quizzes/:id', requireAuth, (req, res) => {
    const authUser = (req as express.Request & { authUser: StoredUser }).authUser;
    const db = readDb();
    const quiz = db.quizzes.find((q) => q.id === req.params.id && q.status === 'published');
    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found.' });
      return;
    }

    const premium = isUserPremium(authUser);
    if (quiz.type === 'mock' && !premium) {
      res.status(403).json({ error: 'Premium subscription required for full-length mock tests.' });
      return;
    }

    const qMap = new Map(db.questions.map((q) => [q.id, q]));
    const allQuestions = quiz.questionIds.map((id) => qMap.get(id)).filter(Boolean) as Question[];
    const questions =
      quiz.type === 'daily' && !premium ? allQuestions.slice(0, FREE_DAILY_LIMIT) : allQuestions;

    res.json({ quiz, questions, totalInQuiz: allQuestions.length });
  });

  // --- ATTEMPTS & RESULTS ---
  app.post('/api/attempts', requireAuth, (req, res) => {
    const authUser = (req as express.Request & { authUser: StoredUser }).authUser;
    const { quizId, answers = {}, timings = {}, totalTime } = req.body || {};
    const db = readDb();

    const quiz = db.quizzes.find((q) => q.id === quizId);
    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found.' });
      return;
    }

    const premium = isUserPremium(authUser);
    if (quiz.type === 'mock' && !premium) {
      res.status(403).json({ error: 'Premium subscription required.' });
      return;
    }

    const qMap = new Map(db.questions.map((q) => [q.id, q]));
    const allQuestions = quiz.questionIds.map((id) => qMap.get(id)).filter(Boolean) as Question[];
    const evaluatedQuestions =
      quiz.type === 'daily' && !premium ? allQuestions.slice(0, FREE_DAILY_LIMIT) : allQuestions;

    let correctCount = 0;
    let wrongCount = 0;
    let attemptedCount = 0;
    const sectionBreakdown: Record<string, SectionResult> = {};
    const topicBreakdown: Record<string, TopicStat> = {};

    evaluatedQuestions.forEach((q) => {
      const chosen = answers[q.id] as OptionKey | undefined;
      const sec = q.subject || 'General';
      const top = q.topic || 'General';
      if (!sectionBreakdown[sec]) sectionBreakdown[sec] = { correct: 0, wrong: 0, total: 0 };
      if (!topicBreakdown[top]) topicBreakdown[top] = { correct: 0, total: 0 };

      sectionBreakdown[sec].total += 1;
      topicBreakdown[top].total += 1;

      if (chosen) {
        attemptedCount += 1;
        if (chosen === q.correctOption) {
          correctCount += 1;
          sectionBreakdown[sec].correct += 1;
          topicBreakdown[top].correct += 1;
        } else {
          wrongCount += 1;
          sectionBreakdown[sec].wrong += 1;
        }
      }
    });

    const pos = quiz.positiveMarks || 1;
    const neg = quiz.negativeMarks || 0;
    const score = Number((correctCount * pos - wrongCount * neg).toFixed(2));
    const maxScore = Number((evaluatedQuestions.length * pos).toFixed(2));
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const computedTime =
      typeof totalTime === 'number' && totalTime > 0
        ? totalTime
        : Object.values(timings as Record<string, number>).reduce((a, b) => a + Number(b || 0), 0);

    const today = getTodayDateStr();
    const nowIso = new Date().toISOString();
    const attempt: Attempt = {
      id: `att_${crypto.randomUUID().slice(0, 12)}`,
      userId: authUser.id,
      quizId: quiz.id,
      quizTitle: quiz.title,
      quizType: quiz.type,
      examId: quiz.examId,
      answers,
      timings,
      score,
      maxScore,
      correctCount,
      wrongCount,
      skippedCount: evaluatedQuestions.length - attemptedCount,
      attemptedCount,
      totalQuestions: evaluatedQuestions.length,
      accuracy,
      totalTime: computedTime,
      sectionBreakdown,
      topicBreakdown,
      date: today,
      createdAt: nowIso,
    };

    db.attempts.unshift(attempt);

    // Update user streak & topic stats
    const uIdx = db.users.findIndex((u) => u.id === authUser.id);
    if (uIdx !== -1) {
      const u = db.users[uIdx];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let newStreak = u.streak || 0;
      if (u.lastActiveDate !== today) {
        newStreak = u.lastActiveDate === yesterday ? newStreak + 1 : 1;
      }
      const dailyUsed =
        u.dailyUsageDate === today
          ? (u.dailyQuestionsUsed || 0) + attemptedCount
          : attemptedCount;

      const mergedTopics = { ...(u.topicStats || {}) };
      Object.entries(topicBreakdown).forEach(([topic, val]) => {
        const prev = mergedTopics[topic] || { correct: 0, total: 0 };
        mergedTopics[topic] = {
          correct: prev.correct + val.correct,
          total: prev.total + val.total,
        };
      });

      db.users[uIdx] = {
        ...u,
        streak: newStreak,
        lastActiveDate: today,
        dailyUsageDate: today,
        dailyQuestionsUsed: dailyUsed,
        totalPracticed: (u.totalPracticed || 0) + attemptedCount,
        topicStats: mergedTopics,
      };
    }

    // Update Daily & Weekly Leaderboard
    const weekKey = getWeekKey();
    for (const [periodType, periodKey] of [
      ['daily', today],
      ['weekly', weekKey],
    ] as const) {
      const lbId = `${quiz.examId}_${periodKey}_${authUser.id}`;
      const lbIdx = db.leaderboard.findIndex((e) => e.id === lbId);
      const added = Math.max(0, score);
      if (lbIdx === -1) {
        db.leaderboard.push({
          id: lbId,
          userId: authUser.id,
          displayName: authUser.displayName,
          examId: quiz.examId,
          periodType,
          periodKey,
          score: Number(added.toFixed(2)),
          updatedAt: nowIso,
        });
      } else {
        db.leaderboard[lbIdx].score = Number((db.leaderboard[lbIdx].score + added).toFixed(2));
        db.leaderboard[lbIdx].displayName = authUser.displayName;
        db.leaderboard[lbIdx].updatedAt = nowIso;
      }
    }

    writeDb(db);
    res.json({ attemptId: attempt.id, attempt });
  });

  app.get('/api/attempts', requireAuth, (req, res) => {
    const authUser = (req as express.Request & { authUser: StoredUser }).authUser;
    const db = readDb();
    const attempts = db.attempts.filter((a) => a.userId === authUser.id);
    res.json({ attempts });
  });

  app.get('/api/attempts/:id', requireAuth, (req, res) => {
    const authUser = (req as express.Request & { authUser: StoredUser }).authUser;
    const db = readDb();
    const attempt = db.attempts.find((a) => a.id === req.params.id);
    if (!attempt || (attempt.userId !== authUser.id && authUser.role !== 'admin')) {
      res.status(404).json({ error: 'Result not found.' });
      return;
    }
    const quiz = db.quizzes.find((q) => q.id === attempt.quizId);
    const qMap = new Map(db.questions.map((q) => [q.id, q]));
    const questions = (quiz?.questionIds || [])
      .slice(0, attempt.totalQuestions)
      .map((id) => qMap.get(id))
      .filter(Boolean);

    res.json({ attempt, questions });
  });

  // --- BOOKMARKS ---
  app.get('/api/bookmarks', requireAuth, (req, res) => {
    const authUser = (req as express.Request & { authUser: StoredUser }).authUser;
    const db = readDb();
    const bookmarks = db.bookmarks.filter((b) => b.userId === authUser.id);
    res.json({ bookmarks });
  });

  app.post('/api/bookmarks/toggle', requireAuth, (req, res) => {
    const authUser = (req as express.Request & { authUser: StoredUser }).authUser;
    const { questionId } = req.body || {};
    const db = readDb();
    const existingIdx = db.bookmarks.findIndex(
      (b) => b.userId === authUser.id && b.questionId === questionId
    );

    if (existingIdx !== -1) {
      db.bookmarks.splice(existingIdx, 1);
      writeDb(db);
      res.json({ bookmarked: false });
      return;
    }

    const question = db.questions.find((q) => q.id === questionId);
    if (!question) {
      res.status(404).json({ error: 'Question not found.' });
      return;
    }

    db.bookmarks.unshift({
      id: `${authUser.id}_${questionId}`,
      userId: authUser.id,
      questionId,
      questionData: question,
      createdAt: new Date().toISOString(),
    });
    writeDb(db);
    res.json({ bookmarked: true });
  });

  // --- LEADERBOARD ---
  app.get('/api/leaderboard', requireAuth, (req, res) => {
    const examId = String(req.query.examId || 'ssc');
    const period = req.query.period === 'weekly' ? 'weekly' : 'daily';
    const periodKey = period === 'daily' ? getTodayDateStr() : getWeekKey();
    const db = readDb();
    const entries = db.leaderboard
      .filter((e) => e.examId === examId && e.periodKey === periodKey)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
    res.json({ entries });
  });

  // --- CURRENT AFFAIRS ---
  app.get('/api/current-affairs', (_req, res) => {
    const db = readDb();
    const digests = db.currentAffairs
      .filter((d) => d.status === 'published')
      .sort((a, b) => b.date.localeCompare(a.date));

    const qMap = new Map(db.questions.filter((q) => q.status === 'published').map((q) => [q.id, q]));
    const enriched = digests.map((d) => ({
      ...d,
      linkedQuestions: (d.linkedQuestionIds || []).map((id) => qMap.get(id)).filter(Boolean),
    }));
    res.json({ digests: enriched });
  });

  // --- ERROR REPORTS ---
  app.post('/api/error-reports', requireAuth, (req, res) => {
    const authUser = (req as express.Request & { authUser: StoredUser }).authUser;
    const { questionId, reason, details = '' } = req.body || {};
    const db = readDb();
    const q = db.questions.find((item) => item.id === questionId);
    if (!q) {
      res.status(404).json({ error: 'Question not found.' });
      return;
    }

    db.errorReports.unshift({
      id: `rep_${crypto.randomUUID().slice(0, 12)}`,
      questionId: q.id,
      questionText: q.question,
      examId: q.examId,
      userId: authUser.id,
      userEmail: authUser.email,
      reason: String(reason || 'Wrong answer key'),
      details: String(details),
      status: 'open',
      createdAt: new Date().toISOString(),
    });
    writeDb(db);
    res.json({ ok: true });
  });

  // --- UPI PAYMENTS ---
  app.get('/api/payments/upi-info', (req, res) => {
    const db = readDb();
    const authUser = getAuthUser(req);
    const myRequests = authUser
      ? db.upiRequests.filter((r) => r.userId === authUser.id)
      : [];
    res.json({
      upiSettings: db.upiSettings,
      myRequests,
    });
  });

  app.post('/api/payments/upi-submit', requireAuth, (req, res) => {
    const authUser = (req as express.Request & { authUser: StoredUser }).authUser;
    const { utrNumber, upiApp = 'UPI App' } = req.body || {};
    const cleanUtr = String(utrNumber || '').trim();
    if (cleanUtr.length < 8 || cleanUtr.length > 40) {
      res.status(400).json({ error: 'Please enter a valid UTR / UPI Transaction ID (8–40 characters).' });
      return;
    }

    const db = readDb();
    if (db.upiRequests.some((r) => r.utrNumber.toLowerCase() === cleanUtr.toLowerCase())) {
      res.status(409).json({ error: 'This UTR / Transaction ID has already been submitted.' });
      return;
    }

    const request = {
      id: `upi_${crypto.randomUUID().slice(0, 10)}`,
      userId: authUser.id,
      userName: authUser.displayName,
      userEmail: authUser.email,
      amountInr: db.upiSettings.monthlyPriceInr || 200,
      utrNumber: cleanUtr,
      upiApp: String(upiApp || 'UPI App').trim(),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    db.upiRequests.unshift(request);
    writeDb(db);
    res.json({ request });
  });

  app.get('/api/admin/upi', requireAdmin, (_req, res) => {
    const db = readDb();
    res.json({
      upiSettings: db.upiSettings,
      requests: db.upiRequests,
    });
  });

  app.patch('/api/admin/upi-settings', requireAdmin, (req, res) => {
    const { upiId, payeeName, monthlyPriceInr } = req.body || {};
    const db = readDb();
    if (typeof upiId === 'string' && upiId.trim()) {
      db.upiSettings.upiId = upiId.trim();
    }
    if (typeof payeeName === 'string' && payeeName.trim()) {
      db.upiSettings.payeeName = payeeName.trim();
    }
    if (typeof monthlyPriceInr === 'number' && monthlyPriceInr > 0) {
      db.upiSettings.monthlyPriceInr = monthlyPriceInr;
    }
    writeDb(db);
    res.json({ upiSettings: db.upiSettings });
  });

  app.patch('/api/admin/upi-requests/:id', requireAdmin, (req, res) => {
    const action = req.body?.status === 'rejected' ? 'rejected' : 'approved';
    const db = readDb();
    const idx = db.upiRequests.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'UPI payment request not found.' });
      return;
    }

    db.upiRequests[idx].status = action;
    db.upiRequests[idx].reviewedAt = new Date().toISOString();

    if (action === 'approved') {
      const uIdx = db.users.findIndex((u) => u.id === db.upiRequests[idx].userId);
      if (uIdx !== -1) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        db.users[uIdx].plan = 'premium';
        db.users[uIdx].premiumUntil = nextMonth.toISOString();
      }
    }

    writeDb(db);
    res.json({ request: db.upiRequests[idx] });
  });

  // --- ADMIN ROUTES ---
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const db = readDb();
    const countsByExam = db.exams.map((ex) => ({
      examId: ex.id,
      name: ex.shortName || ex.name,
      questionCount: db.questions.filter((q) => q.examId === ex.id).length,
      publishedCount: db.questions.filter((q) => q.examId === ex.id && q.status === 'published').length,
    }));

    const next7Dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() + i * 86400000);
      return d.toISOString().split('T')[0];
    });

    const dailySchedule = next7Dates.map((dateStr) => ({
      date: dateStr,
      missingExams: db.exams
        .filter(
          (ex) =>
            !db.quizzes.some(
              (qz) => qz.type === 'daily' && qz.examId === ex.id && qz.scheduledDate === dateStr
            )
        )
        .map((e) => e.shortName || e.id),
    }));

    res.json({
      countsByExam,
      dailySchedule,
      totals: {
        questions: db.questions.length,
        quizzes: db.quizzes.length,
        users: db.users.length,
        openReports: db.errorReports.filter((r) => r.status === 'open').length,
      },
    });
  });

  app.get('/api/admin/questions', requireAdmin, (req, res) => {
    const examId = String(req.query.examId || '');
    const db = readDb();
    const questions = examId
      ? db.questions.filter((q) => q.examId === examId)
      : db.questions;
    res.json({ questions });
  });

  app.post('/api/admin/questions', requireAdmin, (req, res) => {
    const payload = req.body || {};
    const nowIso = new Date().toISOString();
    const newQ: Question = {
      id: `q_${crypto.randomUUID().slice(0, 10)}`,
      examId: String(payload.examId || 'ssc').toLowerCase(),
      subject: String(payload.subject || 'General Awareness'),
      topic: String(payload.topic || 'General'),
      difficulty: payload.difficulty || 'medium',
      language: payload.language || 'English',
      question: String(payload.question || '').trim(),
      optionA: String(payload.optionA || '').trim(),
      optionB: String(payload.optionB || '').trim(),
      optionC: String(payload.optionC || '').trim(),
      optionD: String(payload.optionD || '').trim(),
      correctOption: payload.correctOption || 'A',
      explanation: String(payload.explanation || '').trim(),
      status: payload.status === 'draft' ? 'draft' : 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    const db = readDb();
    db.questions.unshift(newQ);
    writeDb(db);
    res.json({ question: newQ });
  });

  app.post('/api/admin/questions/bulk', requireAdmin, (req, res) => {
    const { questions } = req.body || {};
    if (!Array.isArray(questions) || !questions.length) {
      res.status(400).json({ error: 'No questions provided.' });
      return;
    }
    const nowIso = new Date().toISOString();
    const db = readDb();
    const inserted: Question[] = questions.map((item) => ({
      id: `q_${crypto.randomUUID().slice(0, 10)}`,
      examId: String(item.examId || 'ssc').toLowerCase(),
      subject: String(item.subject || 'General'),
      topic: String(item.topic || 'General'),
      difficulty: item.difficulty || 'medium',
      language: item.language || 'English',
      question: String(item.question || '').trim(),
      optionA: String(item.optionA || '').trim(),
      optionB: String(item.optionB || '').trim(),
      optionC: String(item.optionC || '').trim(),
      optionD: String(item.optionD || '').trim(),
      correctOption: item.correctOption || 'A',
      explanation: String(item.explanation || '').trim(),
      status: item.status === 'draft' ? 'draft' : 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    }));
    db.questions.unshift(...inserted);
    writeDb(db);
    res.json({ count: inserted.length });
  });

  app.put('/api/admin/questions/:id', requireAdmin, (req, res) => {
    const db = readDb();
    const idx = db.questions.findIndex((q) => q.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Question not found.' });
      return;
    }
    const updated: Question = {
      ...db.questions[idx],
      ...req.body,
      id: db.questions[idx].id,
      updatedAt: new Date().toISOString(),
    };
    db.questions[idx] = updated;
    writeDb(db);
    res.json({ question: updated });
  });

  app.delete('/api/admin/questions/:id', requireAdmin, (req, res) => {
    const db = readDb();
    db.questions = db.questions.filter((q) => q.id !== req.params.id);
    writeDb(db);
    res.json({ ok: true });
  });

  app.get('/api/admin/quizzes', requireAdmin, (_req, res) => {
    const db = readDb();
    res.json({ quizzes: db.quizzes });
  });

  app.post('/api/admin/quizzes', requireAdmin, (req, res) => {
    const p = req.body || {};
    const nowIso = new Date().toISOString();
    const newQuiz: Quiz = {
      id: `qz_${crypto.randomUUID().slice(0, 10)}`,
      type: p.type === 'mock' ? 'mock' : 'daily',
      examId: String(p.examId || 'ssc'),
      title: String(p.title || 'Untitled Quiz'),
      scheduledDate: p.type === 'daily' ? String(p.scheduledDate || getTodayDateStr()) : null,
      durationMinutes: Number(p.durationMinutes || 15),
      sectionalTimings: Array.isArray(p.sectionalTimings) ? p.sectionalTimings : undefined,
      positiveMarks: Number(p.positiveMarks ?? 1),
      negativeMarks: Number(p.negativeMarks ?? 0.25),
      questionIds: Array.isArray(p.questionIds) ? p.questionIds : [],
      status: p.status === 'draft' ? 'draft' : 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    const db = readDb();
    db.quizzes.unshift(newQuiz);
    writeDb(db);
    res.json({ quiz: newQuiz });
  });

  app.patch('/api/admin/quizzes/:id', requireAdmin, (req, res) => {
    const db = readDb();
    const idx = db.quizzes.findIndex((q) => q.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Quiz not found.' });
      return;
    }
    db.quizzes[idx] = {
      ...db.quizzes[idx],
      ...req.body,
      id: db.quizzes[idx].id,
      updatedAt: new Date().toISOString(),
    };
    writeDb(db);
    res.json({ quiz: db.quizzes[idx] });
  });

  app.delete('/api/admin/quizzes/:id', requireAdmin, (req, res) => {
    const db = readDb();
    db.quizzes = db.quizzes.filter((q) => q.id !== req.params.id);
    writeDb(db);
    res.json({ ok: true });
  });

  app.get('/api/admin/current-affairs', requireAdmin, (_req, res) => {
    const db = readDb();
    res.json({ digests: db.currentAffairs });
  });

  app.post('/api/admin/current-affairs', requireAdmin, (req, res) => {
    const p = req.body || {};
    const nowIso = new Date().toISOString();
    const digest: CurrentAffairsDigest = {
      id: `ca_${crypto.randomUUID().slice(0, 10)}`,
      date: String(p.date || getTodayDateStr()),
      title: String(p.title || '').trim(),
      points: Array.isArray(p.points) ? p.points : [],
      linkedQuestionIds: Array.isArray(p.linkedQuestionIds) ? p.linkedQuestionIds : [],
      status: p.status === 'draft' ? 'draft' : 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    const db = readDb();
    db.currentAffairs.unshift(digest);
    writeDb(db);
    res.json({ digest });
  });

  app.patch('/api/admin/current-affairs/:id', requireAdmin, (req, res) => {
    const db = readDb();
    const idx = db.currentAffairs.findIndex((d) => d.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Digest not found.' });
      return;
    }
    db.currentAffairs[idx] = {
      ...db.currentAffairs[idx],
      ...req.body,
      id: db.currentAffairs[idx].id,
      updatedAt: new Date().toISOString(),
    };
    writeDb(db);
    res.json({ digest: db.currentAffairs[idx] });
  });

  app.delete('/api/admin/current-affairs/:id', requireAdmin, (req, res) => {
    const db = readDb();
    db.currentAffairs = db.currentAffairs.filter((d) => d.id !== req.params.id);
    writeDb(db);
    res.json({ ok: true });
  });

  app.post('/api/admin/exams', requireAdmin, (req, res) => {
    const { id, name, shortName, description, subjects } = req.body || {};
    const cleanId = String(id || '').trim().toLowerCase();
    if (!cleanId || !name) {
      res.status(400).json({ error: 'Exam ID and name are required.' });
      return;
    }
    const db = readDb();
    const idx = db.exams.findIndex((e) => e.id === cleanId);
    const examObj = {
      id: cleanId,
      name: String(name).trim(),
      shortName: String(shortName || name).trim(),
      description: String(description || '').trim(),
      subjects: Array.isArray(subjects) ? subjects : [],
    };
    if (idx === -1) db.exams.push(examObj);
    else db.exams[idx] = examObj;
    writeDb(db);
    res.json({ exam: examObj });
  });

  app.delete('/api/admin/exams/:id', requireAdmin, (req, res) => {
    const db = readDb();
    db.exams = db.exams.filter((e) => e.id !== req.params.id);
    writeDb(db);
    res.json({ ok: true });
  });

  app.get('/api/admin/error-reports', requireAdmin, (_req, res) => {
    const db = readDb();
    res.json({ reports: db.errorReports });
  });

  app.patch('/api/admin/error-reports/:id', requireAdmin, (req, res) => {
    const db = readDb();
    const idx = db.errorReports.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }
    db.errorReports[idx].status = req.body?.status === 'open' ? 'open' : 'resolved';
    db.errorReports[idx].resolvedAt = new Date().toISOString();
    writeDb(db);
    res.json({ report: db.errorReports[idx] });
  });

  app.get('/api/admin/users', requireAdmin, (_req, res) => {
    const db = readDb();
    res.json({ users: db.users.map(sanitizeUser) });
  });

  app.patch('/api/admin/users/:id', requireAdmin, (req, res) => {
    const db = readDb();
    const idx = db.users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const { plan, premiumUntil, role } = req.body || {};
    if (plan === 'free' || plan === 'premium') db.users[idx].plan = plan;
    if (premiumUntil !== undefined) db.users[idx].premiumUntil = premiumUntil;
    if (role === 'student' || role === 'admin') db.users[idx].role = role;
    writeDb(db);
    res.json({ user: sanitizeUser(db.users[idx]) });
  });

  app.get('/api/admin/export-codebase', requireAdmin, (_req, res) => {
    const rootDir = process.cwd();
    const skipDirs = new Set(['node_modules', '.git', 'dist', 'dev-dist', 'data', '.aistudio']);
    const skipFiles = new Set(['bun.lock', 'package-lock.json', 'dailyprep-complete-codebase.md']);
    const allowedExt = /\.(ts|tsx|js|mjs|json|css|html|svg|md)$/;
    const collected: string[] = [];

    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          if (!skipDirs.has(entry.name)) walk(path.join(dir, entry.name));
        } else if (
          !skipFiles.has(entry.name) &&
          (allowedExt.test(entry.name) || entry.name === '.env.example')
        ) {
          collected.push(path.relative(rootDir, path.join(dir, entry.name)).replace(/\\/g, '/'));
        }
      }
    };

    walk(rootDir);
    collected.sort();

    const getLang = (file: string) => {
      if (file.endsWith('.ts')) return 'typescript';
      if (file.endsWith('.tsx')) return 'tsx';
      if (file.endsWith('.js') || file.endsWith('.mjs')) return 'javascript';
      if (file.endsWith('.json')) return 'json';
      if (file.endsWith('.css')) return 'css';
      if (file.endsWith('.html')) return 'html';
      if (file.endsWith('.svg')) return 'svg';
      if (file.endsWith('.md')) return 'markdown';
      return 'env';
    };

    const parts: string[] = [
      `# DailyPrep — Complete Source Code (${collected.length} files)\n\n## File Index\n`,
    ];
    for (const file of collected) {
      parts.push(`- \`${file}\`\n`);
    }
    parts.push('\n---\n\n');

    for (const file of collected) {
      const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
      const fence = file.endsWith('.md') ? '~~~~' : '```';
      parts.push(`## \`${file}\`\n\n${fence}${getLang(file)}\n${content}${content.endsWith('\n') ? '' : '\n'}${fence}\n\n`);
    }

    const bundle = parts.join('');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="dailyprep-complete-codebase.md"');
    res.send(bundle);
  });

  // --- VITE / STATIC FRONTEND ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DailyPrep server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();