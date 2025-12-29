import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import {
  ArrowLeft,
  Download,
  AlertCircle,
} from 'lucide-react';
import {
  getCustomQuiz,
  getAllQuizAttempts,
  getUserProfiles,
} from '../services/quizService';
import type { CustomQuiz, QuizAttempt } from '../services/quizService';
import * as XLSX from 'xlsx';

export const QuizAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<CustomQuiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    const loadData = async () => {
      if (!quizId || !user) {
        setError('Invalid quiz or user');
        setLoading(false);
        return;
      }

      try {
        const quizData = await getCustomQuiz(quizId);

        if (!quizData) {
          setError('Quiz not found');
          setLoading(false);
          return;
        }

        // Check if user is the creator
        if (quizData.creatorId !== user.uid) {
          setError('You do not have permission to view analytics for this quiz');
          setLoading(false);
          return;
        }

        setQuiz(quizData);

        // Get all attempts for this quiz
        const attemptsData = await getAllQuizAttempts(quizId);
        setAttempts(attemptsData);

        // Get user profiles for all attempt creators
        if (attemptsData.length > 0) {
          const userIds = Array.from(new Set(attemptsData.map(a => a.userId)));
          const profiles = await getUserProfiles(userIds);
          setUserProfiles(profiles);
        }
      } catch (err) {
        console.error('Error loading analytics data:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [quizId, user]);

  const handleExportToExcel = () => {
    if (!quiz || attempts.length === 0) return;

    const data = attempts.map((attempt) => {
      const profile = userProfiles[attempt.userId];
      const completedDate = attempt.completedAt instanceof Date
        ? attempt.completedAt
        : attempt.completedAt.toDate?.() || new Date();

      return {
        'Student Name': profile?.displayName || 'Unknown',
        'Email': profile?.email || 'N/A',
        'Score': `${attempt.score}/${attempt.maxScore}`,
        'Percentage': `${attempt.percentage}%`,
        'Correct Answers': attempt.answers.filter(a => a.isCorrect).length,
        'Incorrect Answers': attempt.answers.filter(a => !a.isCorrect).length,
        'Time Spent (seconds)': attempt.timeSpent,
        'Completed At': completedDate.toLocaleString(),
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quiz Results');
    
    ws['!cols'] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
    ];

    XLSX.writeFile(wb, `${quiz.title}-analytics.xlsx`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                border: '4px solid rgba(233, 69, 96, 0.3)',
                borderTop: '4px solid #e94560',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }}
            ></div>
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading analytics...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '8px' }}>
              Error
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              {error}
            </p>
            <button
              onClick={() => navigate('/my-quizzes')}
              style={{
                padding: '10px 24px',
                backgroundColor: '#e94560',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Back to My Quizzes
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!quiz) {
    return (
      <AppLayout>
        <div style={{ padding: '20px' }}>
          <p>Quiz not found</p>
        </div>
      </AppLayout>
    );
  }

  const averageScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
    : 0;

  const passRate = attempts.length > 0
    ? Math.round((attempts.filter(a => a.percentage >= 70).length / attempts.length) * 100)
    : 0;

  return (
    <AppLayout>
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <button
            onClick={() => navigate('/my-quizzes')}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-text)',
              fontWeight: '500',
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: 'var(--color-text)' }}>
              {quiz.title} - Analytics
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)' }}>
              View who has taken this quiz and their scores
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', margin: 0, textTransform: 'uppercase' }}>
              Total Attempts
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#e94560', margin: '12px 0 0 0' }}>
              {attempts.length}
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', margin: 0, textTransform: 'uppercase' }}>
              Average Score
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#10b981', margin: '12px 0 0 0' }}>
              {averageScore}%
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', margin: 0, textTransform: 'uppercase' }}>
              Pass Rate (≥70%)
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#4285F4', margin: '12px 0 0 0' }}>
              {passRate}%
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', margin: 0, textTransform: 'uppercase' }}>
              Unique Takers
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b', margin: '12px 0 0 0' }}>
              {new Set(attempts.map(a => a.userId)).size}
            </p>
          </div>
        </div>

        {/* Results Table */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '20px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
              Quiz Takers
            </h2>
            {attempts.length > 0 && (
              <button
                onClick={handleExportToExcel}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '6px',
                  color: '#22c55e',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Download size={16} />
                Export to Excel
              </button>
            )}
          </div>

          {attempts.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                No one has taken this quiz yet.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-background)', borderBottom: '2px solid var(--color-border)' }}>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: 'var(--color-text)',
                      }}
                    >
                      Student Name
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: 'var(--color-text)',
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: 'var(--color-text)',
                      }}
                    >
                      Score
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: 'var(--color-text)',
                      }}
                    >
                      Percentage
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: 'var(--color-text)',
                      }}
                    >
                      Correct
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: 'var(--color-text)',
                      }}
                    >
                      Time Taken
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: 'var(--color-text)',
                      }}
                    >
                      Completed At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt, idx) => {
                    const profile = userProfiles[attempt.userId];
                    const completedDate = attempt.completedAt instanceof Date
                      ? attempt.completedAt
                      : attempt.completedAt.toDate?.() || new Date();

                    const timeMinutes = Math.floor(attempt.timeSpent / 60);
                    const timeSeconds = attempt.timeSpent % 60;
                    const correctCount = attempt.answers.filter(a => a.isCorrect).length;

                    const getScoreColor = (percentage: number) => {
                      if (percentage >= 80) return '#10b981';
                      if (percentage >= 70) return '#f59e0b';
                      if (percentage >= 50) return '#f97316';
                      return '#ef4444';
                    };

                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-background)',
                        }}
                      >
                        <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>
                          {profile?.displayName || 'Unknown User'}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                          {profile?.email || 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--color-text)' }}>
                          {attempt.score}/{attempt.maxScore}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            textAlign: 'center',
                            fontWeight: '600',
                            color: getScoreColor(attempt.percentage),
                          }}
                        >
                          {attempt.percentage}%
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--color-text)' }}>
                          {correctCount}/{attempt.answers.length}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--color-text)' }}>
                          {timeMinutes}m {timeSeconds}s
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                          {completedDate.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
