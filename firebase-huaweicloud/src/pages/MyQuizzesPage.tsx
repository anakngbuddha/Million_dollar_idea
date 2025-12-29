import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import {
  Plus,
  Filter,
  Edit,
  Trash2,
  Eye,
  Globe,
  Lock,
  Users as UsersIcon,
  FileQuestion,
  Search,
  Download,
} from 'lucide-react';
import {
  getUserCustomQuizzes,
  getPublicCustomQuizzes,
  getSharedCustomQuizzes,
  deleteCustomQuiz,
  getUserQuizAttempts,
  getAllQuizAttempts,
  getUserProfiles,
} from '../services/quizService';
import type { CustomQuiz, QuizAttempt } from '../services/quizService';
import { HuaweiCloudMigrationQuiz } from './quick-navigation/HuaweiCloudMigrationQuiz';
import { StorageMigrationQuiz } from './quick-navigation/StorageMigrationQuiz';
import { CloudMigrationQuiz } from './quick-navigation/CloudMigrationQuiz';
import { MigrationQuizChap6_7 } from './quick-navigation/MigrationQuizChap6_7';
import '../styles/DashboardPage.css';

export const MyQuizzesPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [myQuizzes, setMyQuizzes] = useState<CustomQuiz[]>([]);
  const [publicQuizzes, setPublicQuizzes] = useState<CustomQuiz[]>([]);
  const [sharedQuizzes, setSharedQuizzes] = useState<CustomQuiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'public' | 'shared' | 'huawei' | 'results'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [allAttempts, setAllAttempts] = useState<QuizAttempt[]>([]);
  const [selectedQuizForResults, setSelectedQuizForResults] = useState<string | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadQuizzes();
    }
  }, [user]);

  const loadQuizzes = async () => {
    if (!user) return;
    
    setLoadingQuizzes(true);
    try {
      const [my, pub, shared, attempts] = await Promise.all([
        getUserCustomQuizzes(user.uid),
        getPublicCustomQuizzes(),
        getSharedCustomQuizzes(user.uid),
        getUserQuizAttempts(user.uid),
      ]);
      setMyQuizzes(my);
      setPublicQuizzes(pub);
      setSharedQuizzes(shared);
      setAllAttempts(attempts);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      await deleteCustomQuiz(quizId);
      await loadQuizzes();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Failed to delete quiz');
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return Globe;
      case 'private':
        return Lock;
      case 'shared':
        return UsersIcon;
      default:
        return Lock;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return '#10b981';
      case 'private':
        return '#6b7280';
      case 'shared':
        return '#4285F4';
      default:
        return '#6b7280';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return '#10b981';
      case 'Intermediate':
        return '#f59e0b';
      case 'Advanced':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getCurrentQuizzes = () => {
    switch (activeTab) {
      case 'my':
        return myQuizzes;
      case 'public':
        return publicQuizzes.filter(q => q.creatorId !== user?.uid);
      case 'shared':
        return sharedQuizzes;
      case 'huawei':
        return myQuizzes.filter(q => q.category?.toLowerCase().includes('huawei') || q.tags?.some(t => t.toLowerCase().includes('huawei')));
      case 'results':
        return myQuizzes;
      default:
        return [];
    }
  };

  const filteredQuizzes = getCurrentQuizzes().filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterDifficulty === 'all' || quiz.difficulty === filterDifficulty;
    return matchesSearch && matchesFilter;
  });


  if (loading || loadingQuizzes) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(233, 69, 96, 0.3)',
              borderTop: '3px solid #e94560',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px',
            }}
          ></div>
          <p style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Loading Quizzes...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <AppLayout>
    <div className="dashboard-container">
      <div className="dashboard-layout">
        <main className="main-content">
          <div className="content-header">
            <div>
              <h1>Custom Quizzes</h1>
              <p>Create, manage, and share your own quizzes</p>
            </div>
            <button
              onClick={() => navigate('/create-quiz')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#e94560',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d63948';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e94560';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Plus size={18} />
              Create Quiz
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '24px',
              borderBottom: '1px solid var(--color-border)',
              overflowX: 'auto',
              paddingBottom: '0',
            }}
          >
            {[
              { key: 'my', label: 'My Quizzes', count: myQuizzes.length },
              { key: 'huawei', label: 'Huawei Cloud', count: 4 },
              { key: 'public', label: 'Public', count: publicQuizzes.filter(q => q.creatorId !== user?.uid).length },
              { key: 'shared', label: 'Shared with Me', count: sharedQuizzes.length },
              { key: 'results', label: 'Quiz Results', count: myQuizzes.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setSelectedQuizForResults(null);
                  setSelectedAttemptId(null);
                }}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: `3px solid ${activeTab === tab.key ? '#e94560' : 'transparent'}`,
                  color: activeTab === tab.key ? '#e94560' : 'var(--color-text-secondary)',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div
            style={{
              display: activeTab === 'results' ? 'none' : 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div className="search-bar" style={{ width: '100%' }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search quizzes by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Filter size={18} style={{ color: 'var(--color-text-secondary)' }} />
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  appearance: 'auto',
                  WebkitAppearance: 'menulist',
                  MozAppearance: 'menulist',
                }}
              >
                <option value="all">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {activeTab === 'results' ? (
            <QuizResultsSection 
              myQuizzes={myQuizzes}
              allAttempts={allAttempts}
              selectedQuizId={selectedQuizForResults}
              onSelectQuiz={setSelectedQuizForResults}
              selectedAttemptIndex={selectedAttemptId}
              onSelectAttempt={setSelectedAttemptId}
              user={user}
            />
          ) : activeTab === 'huawei' && filteredQuizzes.length === 0 ? (
            <HuaweiCloudQuizzesDisplay />
          ) : filteredQuizzes.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 24px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
              }}
            >
              <FileQuestion size={64} style={{ color: 'var(--color-text-secondary)', opacity: 0.5, marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
                {activeTab === 'my' ? 'No quizzes yet' : 'No quizzes found'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                {activeTab === 'my'
                  ? 'Create your first quiz to get started!'
                  : 'Try adjusting your search or filters'}
              </p>
              {activeTab === 'my' && (
                <button
                  onClick={() => navigate('/create-quiz')}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#e94560',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Plus size={18} />
                  Create Your First Quiz
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '20px',
              }}
            >
              {filteredQuizzes.map((quiz) => {
                const VisibilityIcon = getVisibilityIcon(quiz.visibility);
                const isOwner = quiz.creatorId === user?.uid;

                return (
                  <div
                    key={quiz.id}
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      padding: '20px',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(233, 69, 96, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', margin: '0 0 4px 0' }}>
                          {quiz.title}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                          {quiz.questions.length} questions • By {quiz.creatorName}
                        </p>
                      </div>
                      <div
                        style={{
                          padding: '4px 8px',
                          backgroundColor: `${getVisibilityColor(quiz.visibility)}20`,
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <VisibilityIcon size={12} style={{ color: getVisibilityColor(quiz.visibility) }} />
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: getVisibilityColor(quiz.visibility),
                            textTransform: 'capitalize',
                          }}
                        >
                          {quiz.visibility}
                        </span>
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--color-text-secondary)',
                        margin: '0 0 12px 0',
                        flexGrow: 1,
                        lineHeight: '1.5',
                      }}
                    >
                      {quiz.description || 'No description provided'}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '12px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid var(--color-border)',
                        fontSize: '12px',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {quiz.category && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FileQuestion size={14} />
                          {quiz.category}
                        </div>
                      )}
                      {quiz.difficulty && (
                        <div
                          style={{
                            marginLeft: 'auto',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: `${getDifficultyColor(quiz.difficulty)}20`,
                            color: getDifficultyColor(quiz.difficulty),
                            fontWeight: '600',
                          }}
                        >
                          {quiz.difficulty}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => navigate(`/take-quiz/${quiz.id}`)}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          backgroundColor: '#e94560',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Eye size={16} />
                        Take Quiz
                      </button>
                      {isOwner && (
                        <>
                          <button
                            onClick={() => navigate(`/edit-quiz/${quiz.id}`)}
                            style={{
                              padding: '10px',
                              backgroundColor: 'rgba(66, 133, 244, 0.1)',
                              border: '1px solid rgba(66, 133, 244, 0.3)',
                              borderRadius: '6px',
                              color: '#4285F4',
                              cursor: 'pointer',
                            }}
                            title="Edit quiz"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/quiz-analytics/${quiz.id}`)}
                            style={{
                              padding: '10px',
                              backgroundColor: 'rgba(245, 158, 11, 0.1)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              borderRadius: '6px',
                              color: '#f59e0b',
                              cursor: 'pointer',
                            }}
                            title="View analytics"
                          >
                            <FileQuestion size={16} />
                          </button>
                          <button
                            onClick={() => quiz.id && handleDeleteQuiz(quiz.id)}
                            style={{
                              padding: '10px',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              color: '#ef4444',
                              cursor: 'pointer',
                            }}
                            title="Delete quiz"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
    </AppLayout>
  );
};

// Export utility functions
const exportQuizResultsToExcel = (
  quizTitle: string,
  studentName: string,
  studentEmail: string,
  attempts: QuizAttempt[],
  selectedAttemptIndex: number | null
) => {
  if (selectedAttemptIndex === null || selectedAttemptIndex >= attempts.length) {
    alert('Please select an attempt to export');
    return;
  }

  const attempt = attempts[selectedAttemptIndex];
  
  // Prepare data for Excel
  const workbook = XLSX.utils.book_new();
  
  // Sheet 1: Summary
  const summaryData = [
    ['Quiz Results Export'],
    [],
    ['Quiz Title', quizTitle],
    ['Student Name', studentName],
    ['Student Email', studentEmail],
    [],
    ['Score', `${attempt.percentage}%`],
    ['Points', `${attempt.score} / ${attempt.maxScore}`],
    ['Completion Time', new Date(attempt.completedAt.toMillis?.() || attempt.completedAt.toString()).toLocaleString()],
    ['Time Spent', `${Math.floor(attempt.timeSpent / 60)}m ${attempt.timeSpent % 60}s`],
    ['Correct Answers', attempt.answers.filter(a => a.isCorrect).length],
    ['Incorrect Answers', attempt.answers.filter(a => !a.isCorrect).length],
    ['Total Questions', attempt.answers.length],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Sheet 2: Detailed Answers
  const detailedData = [
    ['Question Number', 'Question', 'Your Answer', 'Correct Answer', 'Status'],
    ...attempt.answers.map((answer, idx) => [
      idx + 1,
      answer.question,
      Array.isArray(answer.userAnswer) ? answer.userAnswer.join(', ') : answer.userAnswer,
      Array.isArray(answer.correctAnswer) ? answer.correctAnswer.join(', ') : answer.correctAnswer,
      answer.isCorrect ? 'Correct' : 'Incorrect',
    ]),
  ];

  const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
  detailedSheet['!cols'] = [
    { wch: 15 },
    { wch: 50 },
    { wch: 25 },
    { wch: 25 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Answers');

  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `Quiz_Results_${quizTitle.replace(/\s+/g, '_')}_${studentName.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

  // Save file
  XLSX.writeFile(workbook, filename);
};

// Export All Quiz Takers Results
const exportAllQuizTakersToExcel = (
  quizTitle: string,
  attempts: QuizAttempt[],
  userDisplayNames: Map<string, string>,
  userEmails: Map<string, string>
) => {
  if (attempts.length === 0) {
    alert('No quiz attempts to export');
    return;
  }

  const workbook = XLSX.utils.book_new();

  // Sheet 1: All Takers Summary
  const takersData = [
    ['Quiz Takers Report'],
    ['Quiz Title', quizTitle],
    ['Total Takers', attempts.length],
    ['Export Date', new Date().toLocaleString()],
    [],
    ['Rank', 'Name', 'Email', 'Score', 'Percentage', 'Status', 'Completion Date'],
    ...attempts
      .sort((a, b) => b.percentage - a.percentage)
      .map((attempt, idx) => {
        const userName = userDisplayNames.get(attempt.userId) || 'Unknown';
        const userEmail = userEmails.get(attempt.userId) || 'N/A';
        const status = attempt.percentage >= 70 ? 'Passed' : attempt.percentage >= 50 ? 'Fair' : 'Failed';
        return [
          idx + 1,
          userName,
          userEmail,
          `${attempt.score} / ${attempt.maxScore}`,
          `${attempt.percentage}%`,
          status,
          new Date(attempt.completedAt.toMillis?.() || attempt.completedAt.toString()).toLocaleDateString(),
        ];
      }),
  ];

  const takersSheet = XLSX.utils.aoa_to_sheet(takersData);
  takersSheet['!cols'] = [
    { wch: 8 },
    { wch: 25 },
    { wch: 30 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(workbook, takersSheet, 'All Takers');

  // Sheet 2: Statistics
  const passCount = attempts.filter(a => a.percentage >= 70).length;
  const fairCount = attempts.filter(a => a.percentage >= 50 && a.percentage < 70).length;
  const failCount = attempts.filter(a => a.percentage < 50).length;
  const avgScore = Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length);
  const highestScore = Math.max(...attempts.map(a => a.percentage));
  const lowestScore = Math.min(...attempts.map(a => a.percentage));

  const statsData = [
    ['Quiz Statistics'],
    [],
    ['Total Attempts', attempts.length],
    ['Average Score', `${avgScore}%`],
    ['Highest Score', `${highestScore}%`],
    ['Lowest Score', `${lowestScore}%`],
    [],
    ['Pass Rate (≥70%)', passCount],
    ['Fair Rate (50-69%)', fairCount],
    ['Fail Rate (<50%)', failCount],
    [],
    ['Pass Percentage', `${Math.round((passCount / attempts.length) * 100)}%`],
  ];

  const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
  statsSheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');

  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `Quiz_All_Takers_${quizTitle.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

  // Save file
  XLSX.writeFile(workbook, filename);
};

// Huawei Cloud Quizzes Display Component
const HuaweiCloudQuizzesDisplay: React.FC = () => {
  const navigate = useNavigate();
  
  const huaweiQuizzes = [
    {
      id: 'huawei-cloud-migration',
      title: 'Huawei Cloud Migration Quiz',
      description: 'Test your knowledge about the Cloud Migration Framework phases and technical solutions for Huawei Cloud migration.',
      component: HuaweiCloudMigrationQuiz,
      path: '/huawei-cloud-migration-quiz',
      difficulty: 'Intermediate',
      questions: 20,
    },
    {
      id: 'storage-migration',
      title: 'Storage Migration Quiz',
      description: 'Test your knowledge about Huawei Cloud storage services including ECS, EVS, OBS, SMS, DES, and VPN-based migration strategies.',
      component: StorageMigrationQuiz,
      path: '/storage-migration-quiz',
      difficulty: 'Intermediate',
      questions: 15,
    },
    {
      id: 'cloud-migration',
      title: 'Cloud Migration Framework Quiz',
      description: 'Test your understanding of the Cloud Migration Framework, its phases, and strategic approaches.',
      component: CloudMigrationQuiz,
      path: '/cloud-migration-quiz',
      difficulty: 'Intermediate',
      questions: 10,
    },
    {
      id: 'migration-chap-6-7',
      title: 'Cloud Migration Chapter 6-7 Quiz',
      description: 'Advanced quiz covering migration architecture, verification solutions, and cloud landing zones.',
      component: MigrationQuizChap6_7,
      path: '/migration-quiz-chapter-6-7',
      difficulty: 'Advanced',
      questions: 50,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
      {huaweiQuizzes.map((quiz) => (
        <div
          key={quiz.id}
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(233, 69, 96, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', margin: '0 0 8px 0' }}>
            {quiz.title}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0', flex: 1 }}>
            {quiz.description}
          </p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            <span>📊 {quiz.questions} questions</span>
            <span>•</span>
            <span style={{ color: quiz.difficulty === 'Advanced' ? '#ef4444' : '#f59e0b' }}>
              {quiz.difficulty}
            </span>
          </div>
          <button
            onClick={() => navigate(quiz.path)}
            style={{
              padding: '10px 16px',
              backgroundColor: '#e94560',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Eye size={16} />
            Take Quiz
          </button>
        </div>
      ))}
    </div>
  );
};

// Quiz Results Section Component
interface QuizResultsSectionProps {
  myQuizzes: CustomQuiz[];
  allAttempts: QuizAttempt[];
  selectedQuizId: string | null;
  onSelectQuiz: (quizId: string) => void;
  selectedAttemptIndex: number | null;
  onSelectAttempt: (index: number | null) => void;
  user: any;
}

const QuizResultsSection: React.FC<QuizResultsSectionProps> = ({
  myQuizzes,
  allAttempts,
  selectedQuizId,
  onSelectQuiz,
  selectedAttemptIndex,
  onSelectAttempt,
  user,
}) => {
  if (!selectedQuizId) {
    return (
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text)' }}>
          Select a Quiz to View Results
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {myQuizzes.map((quiz) => {
            const quizAttempts = allAttempts.filter(a => a.quizId === quiz.id);
            const avgScore = quizAttempts.length > 0 
              ? Math.round(quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length)
              : 0;

            return (
              <div
                key={quiz.id}
                onClick={() => onSelectQuiz(quiz.id!)}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '2px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#e94560';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(233, 69, 96, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', margin: '0 0 8px 0' }}>
                  {quiz.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
                  {quiz.description || 'No description'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'rgba(233, 69, 96, 0.1)',
                      borderRadius: '6px',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 4px 0' }}>
                      Attempts
                    </p>
                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#e94560', margin: 0 }}>
                      {quizAttempts.length}
                    </p>
                  </div>
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '6px',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 4px 0' }}>
                      Avg Score
                    </p>
                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#10b981', margin: 0 }}>
                      {avgScore}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const selectedQuiz = myQuizzes.find(q => q.id === selectedQuizId);
  const quizAttempts = allAttempts.filter(a => a.quizId === selectedQuizId);

  if (selectedAttemptIndex !== null && selectedAttemptIndex < quizAttempts.length) {
    const attempt = quizAttempts[selectedAttemptIndex];
    return (
      <div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onSelectAttempt(null)}
            style={{
              padding: '10px 16px',
              backgroundColor: 'rgba(66, 133, 244, 0.1)',
              border: '1px solid rgba(66, 133, 244, 0.3)',
              borderRadius: '6px',
              color: '#4285F4',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            ← Back to Results
          </button>

          <button
            onClick={() =>
              exportQuizResultsToExcel(
                selectedQuiz?.title || 'Quiz',
                user?.displayName || 'Student',
                user?.email || 'N/A',
                quizAttempts,
                selectedAttemptIndex
              )
            }
            style={{
              padding: '10px 16px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '6px',
              color: '#22c55e',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Download size={16} />
            Export to Excel
          </button>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          {/* Header Section with User Info */}
          <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text)', margin: 0 }}>
                  {selectedQuiz?.title}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
                  Quiz Results & Analysis
                </p>
              </div>
              <div
                style={{
                  textAlign: 'right',
                  padding: '16px 20px',
                  backgroundColor: attempt.percentage >= 70 ? 'rgba(16, 185, 129, 0.1)' : attempt.percentage >= 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '8px',
                  border: `2px solid ${attempt.percentage >= 70 ? '#10b981' : attempt.percentage >= 50 ? '#f59e0b' : '#ef4444'}`,
                }}
              >
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, fontWeight: '600' }}>Final Score</p>
                <p style={{ fontSize: '36px', fontWeight: '700', color: attempt.percentage >= 70 ? '#10b981' : attempt.percentage >= 50 ? '#f59e0b' : '#ef4444', margin: '4px 0 0 0' }}>
                  {attempt.percentage}%
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
                  {attempt.score} / {attempt.maxScore}
                </p>
              </div>
            </div>

            {/* User Information Card */}
            <div style={{
              backgroundColor: 'rgba(233, 69, 96, 0.05)',
              border: '1px solid rgba(233, 69, 96, 0.2)',
              borderRadius: '8px',
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Student Name
                </p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-text)', margin: '6px 0 0 0' }}>
                  {user?.displayName || 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Email Address
                </p>
                <p style={{ fontSize: '14px', color: 'var(--color-text)', margin: '6px 0 0 0', wordBreak: 'break-all' }}>
                  {user?.email || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
              paddingBottom: '24px',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(233, 69, 96, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(233, 69, 96, 0.2)',
            }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', margin: 0 }}>
                ⏱️ Time Spent
              </p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#e94560', margin: '8px 0 0 0' }}>
                {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
              </p>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', margin: 0 }}>
                ✓ Correct
              </p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#10b981', margin: '8px 0 0 0' }}>
                {attempt.answers.filter(a => a.isCorrect).length}
              </p>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', margin: 0 }}>
                ✗ Incorrect
              </p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444', margin: '8px 0 0 0' }}>
                {attempt.answers.filter(a => !a.isCorrect).length}
              </p>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(66, 133, 244, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(66, 133, 244, 0.2)',
            }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', margin: 0 }}>
                📋 Total Questions
              </p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#4285F4', margin: '8px 0 0 0' }}>
                {attempt.answers.length}
              </p>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(245, 158, 11, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', margin: 0 }}>
                📅 Completed On
              </p>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#f59e0b', margin: '8px 0 0 0' }}>
                {new Date(attempt.completedAt.toMillis?.() || attempt.completedAt.toString()).toLocaleDateString()}
              </p>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(168, 85, 247, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(168, 85, 247, 0.2)',
            }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', margin: 0 }}>
                🕐 Time Taken
              </p>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#a855f7', margin: '8px 0 0 0' }}>
                {new Date(attempt.completedAt.toMillis?.() || attempt.completedAt.toString()).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Detailed Answers Section */}
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '16px' }}>
            📝 Detailed Answers
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {attempt.answers.map((answer, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  backgroundColor: answer.isCorrect ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                  border: `2px solid ${answer.isCorrect ? '#10b981' : '#ef4444'}`,
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: answer.isCorrect ? '#10b981' : '#ef4444',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '12px',
                      flexShrink: 0,
                    }}
                  >
                    {answer.isCorrect ? '✓' : '✗'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', margin: 0 }}>
                      Q{idx + 1}: {answer.question}
                    </p>
                  </div>
                </div>

                <div style={{ marginLeft: '36px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>Your Answer:</p>
                    <p style={{ fontSize: '13px', color: 'var(--color-text)', margin: '4px 0 0 0' }}>
                      {Array.isArray(answer.userAnswer) ? answer.userAnswer.join(', ') : answer.userAnswer}
                    </p>
                  </div>
                  {!answer.isCorrect && (
                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>Correct Answer:</p>
                      <p style={{ fontSize: '13px', color: '#10b981', margin: '4px 0 0 0' }}>
                        {Array.isArray(answer.correctAnswer) ? answer.correctAnswer.join(', ') : answer.correctAnswer}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const correctCount = quizAttempts.reduce((sum, a) => sum + a.answers.filter(ans => ans.isCorrect).length, 0);
  const totalAnswered = quizAttempts.reduce((sum, a) => sum + a.answers.length, 0);
  const avgScore = quizAttempts.length > 0 
    ? Math.round(quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length)
    : 0;

  // Calculate per-question statistics
  const questionStats = new Map<string, { correct: number; total: number }>();
  quizAttempts.forEach(attempt => {
    attempt.answers.forEach(answer => {
      const key = answer.question;
      const stat = questionStats.get(key) || { correct: 0, total: 0 };
      stat.total += 1;
      if (answer.isCorrect) stat.correct += 1;
      questionStats.set(key, stat);
    });
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => onSelectQuiz('')}
          style={{
            padding: '10px 16px',
            backgroundColor: 'rgba(66, 133, 244, 0.1)',
            border: '1px solid rgba(66, 133, 244, 0.3)',
            borderRadius: '6px',
            color: '#4285F4',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          ← Back to Quiz List
        </button>

        <button
          onClick={async () => {
            // Fetch all attempts for this quiz
            const allQuizAttempts = await getAllQuizAttempts(selectedQuizId || '');
            
            // Get unique user IDs
            const uniqueUserIds = [...new Set(allQuizAttempts.map(a => a.userId))];
            
            // Fetch user profiles
            const userProfiles = await getUserProfiles(uniqueUserIds);
            
            const userDisplayNames = new Map<string, string>();
            const userEmails = new Map<string, string>();
            
            uniqueUserIds.forEach(userId => {
              const profile = userProfiles[userId];
              userDisplayNames.set(userId, profile?.displayName || profile?.name || 'Unknown');
              userEmails.set(userId, profile?.email || 'N/A');
            });
            
            exportAllQuizTakersToExcel(selectedQuiz?.title || 'Quiz', allQuizAttempts, userDisplayNames, userEmails);
          }}
          style={{
            padding: '10px 16px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '6px',
            color: '#22c55e',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Download size={16} />
          Export All Results
        </button>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '24px',
        }}
      >
        {/* Header Section */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-text)', margin: '0 0 8px 0' }}>
            {selectedQuiz?.title}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Performance Analytics & Insights
          </p>
        </div>

        {/* Key Metrics Grid - Professional Card Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          {/* Total Attempts Card */}
          <div
            style={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                backgroundColor: '#e94560',
              }}
            />
            <div style={{ paddingLeft: '8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Attempts
              </p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#e94560', margin: '12px 0 0 0' }}>
                {quizAttempts.length}
              </p>
            </div>
          </div>

          {/* Average Score Card */}
          <div
            style={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                backgroundColor: '#10b981',
              }}
            />
            <div style={{ paddingLeft: '8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Average Score
              </p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#10b981', margin: '12px 0 0 0' }}>
                {avgScore}%
              </p>
            </div>
          </div>

          {/* Total Correct Answers Card */}
          <div
            style={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                backgroundColor: '#3b82f6',
              }}
            />
            <div style={{ paddingLeft: '8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Correct Answers
              </p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6', margin: '12px 0 0 0' }}>
                {correctCount}/{totalAnswered}
              </p>
            </div>
          </div>

          {/* Success Rate Card */}
          <div
            style={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                backgroundColor: '#f59e0b',
              }}
            />
            <div style={{ paddingLeft: '8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Success Rate
              </p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b', margin: '12px 0 0 0' }}>
                {totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'var(--color-border)', marginBottom: '40px' }} />

        {/* Per-Question Statistics Section */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Per-Question Performance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from(questionStats.entries()).map(([question, stat]) => {
              const percentage = Math.round((stat.correct / stat.total) * 100);
              const isGood = percentage >= 70;

              return (
                <div
                  key={question}
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: '600', margin: 0, lineHeight: '1.5' }}>
                      {question}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: 'var(--color-border)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: '100%',
                            backgroundColor: isGood ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        minWidth: '70px',
                        textAlign: 'right',
                      }}
                    >
                      <p style={{ fontSize: '14px', fontWeight: '700', color: isGood ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444', margin: 0 }}>
                        {percentage}%
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
                        {stat.correct}/{stat.total}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Attempt History Section */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '32px',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Attempt History
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {quizAttempts.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '40px 20px', margin: 0 }}>
              No attempts recorded yet
            </p>
          ) : (
            quizAttempts.map((attempt, idx) => (
              <button
                key={idx}
                onClick={() => onSelectAttempt(idx)}
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#e94560';
                  e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.02)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.backgroundColor = 'var(--color-background)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', margin: 0 }}>
                    Attempt {quizAttempts.length - idx}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
                    {new Date(attempt.completedAt.toMillis?.() || attempt.completedAt.toString()).toLocaleDateString()} • {new Date(attempt.completedAt.toMillis?.() || attempt.completedAt.toString()).toLocaleTimeString()}
                  </p>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ textAlign: 'right' }}>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: attempt.percentage >= 70 ? '#10b981' : attempt.percentage >= 50 ? '#f59e0b' : '#ef4444',
                        margin: 0,
                      }}
                    >
                      {attempt.percentage}%
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
                      {attempt.score}/{attempt.maxScore}
                    </p>
                  </div>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '6px',
                      backgroundColor: attempt.percentage >= 70 ? '#10b98120' : attempt.percentage >= 50 ? '#f59e0b20' : '#ef444420',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '16px',
                      color: attempt.percentage >= 70 ? '#10b981' : attempt.percentage >= 50 ? '#f59e0b' : '#ef4444',
                    }}
                  >
                    {attempt.percentage >= 70 ? '✓' : attempt.percentage >= 50 ? '◔' : '✕'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
