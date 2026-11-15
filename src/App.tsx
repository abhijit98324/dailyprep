import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import MobileBottomNav from './components/common/MobileBottomNav';
import Footer from './components/common/Footer';
import OfflineIndicator from './components/common/OfflineIndicator';
import ProtectedRoute from './components/common/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import DailyQuizPage from './pages/DailyQuizPage';
import MockTestsPage from './pages/MockTestsPage';
import MockTestPlayerPage from './pages/MockTestPlayerPage';
import ResultsPage from './pages/ResultsPage';
import BookmarksPage from './pages/BookmarksPage';
import LeaderboardPage from './pages/LeaderboardPage';
import CurrentAffairsPage from './pages/CurrentAffairsPage';
import PricingPage from './pages/PricingPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/current-affairs" element={<CurrentAffairsPage />} />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute skipOnboardingCheck>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/daily-quiz"
            element={
              <ProtectedRoute>
                <DailyQuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock-tests"
            element={
              <ProtectedRoute>
                <MockTestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock-test/:id"
            element={
              <ProtectedRoute>
                <MockTestPlayerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/:attemptId"
            element={
              <ProtectedRoute>
                <ResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookmarks"
            element={
              <ProtectedRoute>
                <BookmarksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <MobileBottomNav />
      <OfflineIndicator />
    </div>
  );
}