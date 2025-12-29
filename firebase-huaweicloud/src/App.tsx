import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { VerificationPage } from './pages/VerificationPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { QuizList } from './pages/quick-navigation/QuizList';
import { StorageMigrationQuiz } from './pages/quick-navigation/StorageMigrationQuiz';
import { CloudMigrationQuiz } from './pages/quick-navigation/CloudMigrationQuiz';
import { HuaweiCloudMigrationQuiz } from './pages/quick-navigation/HuaweiCloudMigrationQuiz';
import { MigrationQuizChap6_7 } from './pages/quick-navigation/MigrationQuizChap6_7';
import { CreateQuizPage } from './pages/CreateQuizPage';
import { EditQuizPage } from './pages/EditQuizPage';
import { MyQuizzesPage } from './pages/MyQuizzesPage';
import { TakeCustomQuizPage } from './pages/TakeCustomQuizPage';
import { QuizAnalyticsPage } from './pages/QuizAnalyticsPage';
import { EditClassroomQuizPage } from './pages/EditClassroomQuizPage';
import { ClassroomQuizAnalyticsPage } from './pages/ClassroomQuizAnalyticsPage';
import { HuaweiCloudQuizzesPage } from './pages/HuaweiCloudQuizzesPage';
import { AssignmentGradingPage } from './pages/AssignmentGradingPage';

import { Analytics } from './pages/quick-navigation/Analytics';
import { MySQLPractice } from './pages/quick-navigation/MySQLPractice';
import CommunityPage from './pages/CommunityPage';
import PostDetailPage from './pages/PostDetailPage';
import { ClassroomPage } from './pages/ClassroomPage';
import { ClassroomDetailPage } from './pages/ClassroomDetailPage';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/verify-email" element={<VerificationPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quizzes"
            element={
              <ProtectedRoute>
                <QuizList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/huawei-cloud-quizzes"
            element={
              <ProtectedRoute>
                <HuaweiCloudQuizzesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/storage-migration-quiz"
            element={
              <ProtectedRoute>
                <StorageMigrationQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/storage-migration"
            element={
              <ProtectedRoute>
                <StorageMigrationQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cloud-migration-quiz"
            element={
              <ProtectedRoute>
                <CloudMigrationQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/cloud-migration"
            element={
              <ProtectedRoute>
                <CloudMigrationQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/huawei-cloud-migration-quiz"
            element={
              <ProtectedRoute>
                <HuaweiCloudMigrationQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/huawei-cloud-migration"
            element={
              <ProtectedRoute>
                <HuaweiCloudMigrationQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/migration-quiz-chapter-6-7"
            element={
              <ProtectedRoute>
                <MigrationQuizChap6_7 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/migration-chap-6-7"
            element={
              <ProtectedRoute>
                <MigrationQuizChap6_7 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-quiz"
            element={
              <ProtectedRoute>
                <CreateQuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-quiz/:quizId"
            element={
              <ProtectedRoute>
                <EditQuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-quizzes"
            element={
              <ProtectedRoute>
                <MyQuizzesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/take-quiz/:quizId"
            element={
              <ProtectedRoute>
                <TakeCustomQuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz-analytics/:quizId"
            element={
              <ProtectedRoute>
                <QuizAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-classroom-quiz/:classroomId/:classroomQuizId"
            element={
              <ProtectedRoute>
                <EditClassroomQuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classroom-quiz-analytics/:classroomId/:classroomQuizId"
            element={
              <ProtectedRoute>
                <ClassroomQuizAnalyticsPage />
              </ProtectedRoute>
            }
          />
        
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mysql-practice"
            element={
              <ProtectedRoute>
                <MySQLPractice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community/post/:postId"
            element={
              <ProtectedRoute>
                <PostDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classrooms"
            element={
              <ProtectedRoute>
                <ClassroomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classrooms/:classroomId"
            element={
              <ProtectedRoute>
                <ClassroomDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grade-assignment/:assignmentId"
            element={
              <ProtectedRoute>
                <AssignmentGradingPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
