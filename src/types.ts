export type LanguageOption = 'English' | 'Hindi' | 'Bengali';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type PublishStatus = 'published' | 'draft';
export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface SubjectDefinition {
  name: string;
  topics: string[];
}

export interface Exam {
  id: string;
  name: string;
  shortName: string;
  description: string;
  subjects: SubjectDefinition[];
}

export interface Question {
  id: string;
  examId: string;
  subject: string;
  topic: string;
  difficulty: DifficultyLevel;
  language: LanguageOption;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: OptionKey;
  explanation: string;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QuizSectionTiming {
  subject: string;
  durationMinutes: number;
}

export interface Quiz {
  id: string;
  type: 'daily' | 'mock';
  examId: string;
  title: string;
  scheduledDate: string | null;
  durationMinutes: number;
  sectionalTimings?: QuizSectionTiming[];
  positiveMarks: number;
  negativeMarks: number;
  questionIds: string[];
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentAffairsDigest {
  id: string;
  date: string;
  title: string;
  points: string[];
  linkedQuestionIds: string[];
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TopicStat {
  correct: number;
  total: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'student' | 'admin';
  selectedExams: string[];
  primaryExam: string;
  language: LanguageOption;
  onboarded: boolean;
  plan: 'free' | 'premium';
  premiumUntil: string | null;
  streak: number;
  lastActiveDate: string | null;
  dailyUsageDate: string | null;
  dailyQuestionsUsed: number;
  totalPracticed: number;
  topicStats: Record<string, TopicStat>;
  createdAt: string;
}

export interface SectionResult {
  correct: number;
  wrong: number;
  total: number;
}

export interface Attempt {
  id: string;
  userId: string;
  quizId: string;
  quizTitle: string;
  quizType: 'daily' | 'mock';
  examId: string;
  answers: Record<string, OptionKey>;
  timings: Record<string, number>;
  score: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  attemptedCount: number;
  totalQuestions: number;
  accuracy: number;
  totalTime: number;
  sectionBreakdown: Record<string, SectionResult>;
  topicBreakdown: Record<string, TopicStat>;
  date: string;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  questionId: string;
  questionData: Question;
  createdAt: string;
}

export interface ErrorReport {
  id: string;
  questionId: string;
  questionText: string;
  examId: string;
  userId: string;
  userEmail: string;
  reason: string;
  details: string;
  status: 'open' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  examId: string;
  periodType: 'daily' | 'weekly';
  periodKey: string;
  score: number;
  updatedAt: string;
}

export interface UpiSettings {
  upiId: string;
  payeeName: string;
  monthlyPriceInr: number;
}

export interface UpiPaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amountInr: number;
  utrNumber: string;
  upiApp: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
}