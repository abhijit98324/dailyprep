import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DEFAULT_EXAMS } from '../src/data/seedExams.ts';
import type {
  Attempt,
  Bookmark,
  CurrentAffairsDigest,
  ErrorReport,
  Exam,
  LeaderboardEntry,
  Question,
  Quiz,
  UpiPaymentRequest,
  UpiSettings,
  UserProfile,
} from '../src/types.ts';

export interface StoredUser extends UserProfile {
  passwordHash: string;
}

export interface PasswordResetRecord {
  id: string;
  userId: string;
  email: string;
  codeHash: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface DatabaseSchema {
  exams: Exam[];
  questions: Question[];
  quizzes: Quiz[];
  currentAffairs: CurrentAffairsDigest[];
  users: StoredUser[];
  attempts: Attempt[];
  bookmarks: Bookmark[];
  errorReports: ErrorReport[];
  leaderboard: LeaderboardEntry[];
  upiSettings: UpiSettings;
  upiRequests: UpiPaymentRequest[];
  passwordResets: PasswordResetRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'dailyprep.json');

export function getTodayDateStr(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split('T')[0];
}

export function getWeekKey(): string {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function createInitialData(): DatabaseSchema {
  const nowIso = new Date().toISOString();
  const today = getTodayDateStr();

  const starterQuestions: Question[] = [
    {
      id: 'q_ssc_1',
      examId: 'ssc',
      subject: 'Quantitative Aptitude',
      topic: 'Percentage',
      difficulty: 'easy',
      language: 'English',
      question: 'If the price of sugar increases by 25%, by what percentage must a household reduce consumption so that expenditure remains unchanged?',
      optionA: '15%',
      optionB: '20%',
      optionC: '25%',
      optionD: '30%',
      correctOption: 'B',
      explanation: 'Required reduction = [R / (100 + R)] × 100 = (25 / 125) × 100 = 20%.',
      status: 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'q_ssc_2',
      examId: 'ssc',
      subject: 'Quantitative Aptitude',
      topic: 'Time & Work',
      difficulty: 'medium',
      language: 'English',
      question: 'A can complete a piece of work in 12 days and B can complete the same work in 18 days. Working together, in how many days will they finish the work?',
      optionA: '6.5 days',
      optionB: '7.2 days',
      optionC: '8 days',
      optionD: '9 days',
      correctOption: 'B',
      explanation: 'Combined 1-day work = 1/12 + 1/18 = 5/36. Total days = 36/5 = 7.2 days.',
      status: 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'q_ssc_3',
      examId: 'ssc',
      subject: 'General Intelligence & Reasoning',
      topic: 'Number Series',
      difficulty: 'easy',
      language: 'English',
      question: 'Find the missing number in the series: 7, 14, 28, 56, ?, 224',
      optionA: '98',
      optionB: '108',
      optionC: '112',
      optionD: '120',
      correctOption: 'C',
      explanation: 'Each term is multiplied by 2: 56 × 2 = 112.',
      status: 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'q_ssc_4',
      examId: 'ssc',
      subject: 'General Intelligence & Reasoning',
      topic: 'Coding-Decoding',
      difficulty: 'medium',
      language: 'English',
      question: 'If in a certain code, DELHI is written as EFMIJ, how is MUMBAI written in that code?',
      optionA: 'NVNCBJ',
      optionB: 'NVNCBK',
      optionC: 'MVNCBJ',
      optionD: 'NWNCBJ',
      correctOption: 'A',
      explanation: 'Each letter shifts +1 forward in the English alphabet: M→N, U→V, M→N, B→C, A→B, I→J.',
      status: 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'q_ssc_5',
      examId: 'ssc',
      subject: 'English Comprehension',
      topic: 'Idioms & Phrases',
      difficulty: 'easy',
      language: 'English',
      question: 'Choose the correct meaning of the idiom: "To burn the midnight oil"',
      optionA: 'To waste resources carelessly',
      optionB: 'To work or study late into the night',
      optionC: 'To start an argument',
      optionD: 'To destroy old records',
      correctOption: 'B',
      explanation: '"Burn the midnight oil" means reading, studying, or working late at night.',
      status: 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'q_ssc_6',
      examId: 'ssc',
      subject: 'English Comprehension',
      topic: 'Synonyms & Antonyms',
      difficulty: 'medium',
      language: 'English',
      question: 'Select the most appropriate synonym of the word "EPHEMERAL".',
      optionA: 'Permanent',
      optionB: 'Short-lived',
      optionC: 'Ancient',
      optionD: 'Sturdy',
      correctOption: 'B',
      explanation: 'Ephemeral means lasting for a very short time (transitory / short-lived).',
      status: 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'q_ssc_7',
      examId: 'ssc',
      subject: 'General Awareness',
      topic: 'Polity',
      difficulty: 'easy',
      language: 'English',
      question: 'Which Article of the Indian Constitution abolishes Untouchability?',
      optionA: 'Article 14',
      optionB: 'Article 16',
      optionC: 'Article 17',
      optionD: 'Article 21',
      correctOption: 'C',
      explanation: 'Article 17 under Fundamental Rights explicitly abolishes untouchability and forbids its practice in any form.',
      status: 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'q_ssc_8',
      examId: 'ssc',
      subject: 'General Awareness',
      topic: 'History',
      difficulty: 'medium',
      language: 'English',
      question: 'Who presided over the Lahore Session of the Indian National Congress in 1929 where the resolution of Purna Swaraj was passed?',
      optionA: 'Mahatma Gandhi',
      optionB: 'Jawaharlal Nehru',
      optionC: 'Subhas Chandra Bose',
      optionD: 'Sardar Vallabhbhai Patel',
      correctOption: 'B',
      explanation: 'Jawaharlal Nehru was elected President of the 1929 Lahore Session where Purna Swaraj (Complete Independence) was declared.',
      status: 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'q_ssc_9',
      examId: 'ssc',
      subject: 'General Awareness',
      topic: 'Geography',
      difficulty: 'medium',
      language: 'English',
      question: 'Which river is known as the "Sorrow of Bihar"?',
      optionA: 'Gandak',
      optionB: 'Son',
      optionC: 'Kosi',
      optionD: 'Ghaghara',
      correctOption: 'C',
      explanation: 'The Kosi River frequently changes its course and causes severe floods in northern Bihar, earning it the title "Sorrow of Bihar".',
      status: 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'q_ssc_10',
      examId: 'ssc',
      subject: 'Current Affairs',
      topic: 'National',
      difficulty: 'easy',
      language: 'English',
      question: 'Which constitutional body conducts elections to the Lok Sabha and State Legislative Assemblies in India?',
      optionA: 'UPSC',
      optionB: 'Election Commission of India',
      optionC: 'Finance Commission',
      optionD: 'NITI Aayog',
      correctOption: 'B',
      explanation: 'Under Article 324 of the Constitution, the Election Commission of India conducts elections to Parliament and State Legislatures.',
      status: 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'q_bank_1',
      examId: 'banking',
      subject: 'Banking & Financial Awareness',
      topic: 'RBI Policies',
      difficulty: 'easy',
      language: 'English',
      question: 'What does "Repo Rate" refer to in Indian monetary policy?',
      optionA: 'Rate at which RBI borrows from commercial banks',
      optionB: 'Rate at which RBI lends short-term funds to commercial banks',
      optionC: 'Minimum cash reserve banks must hold with RBI',
      optionD: 'Interest rate on savings bank deposits',
      correctOption: 'B',
      explanation: 'Repo Rate (Repurchase Option) is the rate at which the Reserve Bank of India lends short-term money to commercial banks against government securities.',
      status: 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'q_rail_1',
      examId: 'railways',
      subject: 'General Science',
      topic: 'Physics',
      difficulty: 'easy',
      language: 'English',
      question: 'What is the SI unit of electrical resistance?',
      optionA: 'Volt',
      optionB: 'Ampere',
      optionC: 'Ohm',
      optionD: 'Watt',
      correctOption: 'C',
      explanation: 'Electrical resistance is measured in Ohms (Ω), named after physicist Georg Simon Ohm.',
      status: 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'q_upsc_1',
      examId: 'upsc-psc',
      subject: 'Polity & Governance',
      topic: 'Constitution',
      difficulty: 'medium',
      language: 'English',
      question: 'The concept of "Fundamental Duties" in the Constitution of India was borrowed from which country?',
      optionA: 'United States of America',
      optionB: 'United Kingdom',
      optionC: 'USSR (Soviet Union)',
      optionD: 'Ireland',
      correctOption: 'C',
      explanation: 'Fundamental Duties (Article 51A, added by the 42nd Amendment Act, 1976 on Swaran Singh Committee recommendations) were inspired by the Constitution of the USSR.',
      status: 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const quizzes: Quiz[] = [
    {
      id: 'quiz_ssc_daily_starter',
      type: 'daily',
      examId: 'ssc',
      title: 'SSC Daily Practice Quiz',
      scheduledDate: today,
      durationMinutes: 15,
      positiveMarks: 2,
      negativeMarks: 0.5,
      questionIds: starterQuestions.filter((q) => q.examId === 'ssc').map((q) => q.id),
      status: 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'mock_ssc_tier1_1',
      type: 'mock',
      examId: 'ssc',
      title: 'SSC CGL Tier-1 Pattern Mini Mock',
      scheduledDate: null,
      durationMinutes: 20,
      sectionalTimings: [
        { subject: 'Quantitative Aptitude', durationMinutes: 6 },
        { subject: 'General Intelligence & Reasoning', durationMinutes: 5 },
        { subject: 'English Comprehension', durationMinutes: 4 },
        { subject: 'General Awareness', durationMinutes: 5 },
      ],
      positiveMarks: 2,
      negativeMarks: 0.5,
      questionIds: starterQuestions.filter((q) => q.examId === 'ssc').map((q) => q.id),
      status: 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const currentAffairs: CurrentAffairsDigest[] = [
    {
      id: 'ca_digest_1',
      date: today,
      title: 'Daily Current Affairs Digest — Constitutional & Economic Highlights',
      points: [
        'Election Commission of India (Article 324) oversees Parliamentary and State Assembly electoral rolls and conduct of polls.',
        'Reserve Bank of India uses the Repo Rate under the Liquidity Adjustment Facility (LAF) to manage short-term money supply and inflation.',
        'Fundamental Duties under Part IV-A (Article 51A) were incorporated through the 42nd Constitutional Amendment Act.',
      ],
      linkedQuestionIds: ['q_ssc_10', 'q_bank_1', 'q_upsc_1'],
      status: 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  return {
    exams: DEFAULT_EXAMS,
    questions: starterQuestions,
    quizzes,
    currentAffairs,
    users: [],
    attempts: [],
    bookmarks: [],
    errorReports: [],
    leaderboard: [],
    upiSettings: {
      upiId: process.env.UPI_ID || 'dailyprep@upi',
      payeeName: process.env.UPI_PAYEE_NAME || 'DailyPrep',
      monthlyPriceInr: 200,
    },
    upiRequests: [],
    passwordResets: [],
  };
}

export function readDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initial = createInitialData();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  const parsed = JSON.parse(raw) as DatabaseSchema;
  if (!parsed.upiSettings) {
    parsed.upiSettings = {
      upiId: process.env.UPI_ID || 'dailyprep@upi',
      payeeName: process.env.UPI_PAYEE_NAME || 'DailyPrep',
      monthlyPriceInr: 200,
    };
  }
  if (!Array.isArray(parsed.upiRequests)) {
    parsed.upiRequests = [];
  }
  if (!Array.isArray(parsed.passwordResets)) {
    parsed.passwordResets = [];
  }
  return parsed;
}

export function writeDb(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, DB_PATH);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const hashBuf = Buffer.from(hash, 'hex');
  if (derived.length !== hashBuf.length) return false;
  return crypto.timingSafeEqual(derived, hashBuf);
}

export function hashResetCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

const TOKEN_SECRET = process.env.SESSION_SECRET || 'dailyprep-local-dev-secret-change-me';

export function signToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, iat: Date.now() })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): { uid: string } | null {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return parsed?.uid ? { uid: parsed.uid } : null;
  } catch {
    return null;
  }
}

export function sanitizeUser(user: StoredUser): UserProfile {
  const { passwordHash: _ph, ...safe } = user;
  return safe;
}