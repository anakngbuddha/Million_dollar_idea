import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
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
} from 'lucide-react';
import {
  getUserCustomQuizzes,
  getPublicCustomQuizzes,
  getSharedCustomQuizzes,
  deleteCustomQuiz,
} from '../services/quizService';
import type { CustomQuiz } from '../services/quizService';
import '../styles/DashboardPage.css';

export const MyQuizzesPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [myQuizzes, setMyQuizzes] = useState<CustomQuiz[]>([]);
  const [publicQuizzes, setPublicQuizzes] = useState<CustomQuiz[]>([]);
  const [sharedQuizzes, setSharedQuizzes] = useState<CustomQuiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'public' | 'shared'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (user) {
      loadQuizzes();
    }
  }, [user]);

  const loadQuizzes = async () => {
    if (!user) return;
    
    setLoadingQuizzes(true);
    try {
      const [my, pub, shared] = await Promise.all([
        getUserCustomQuizzes(user.uid),
        getPublicCustomQuizzes(),
        getSharedCustomQuizzes(user.uid),
      ]);
      setMyQuizzes(my);
      setPublicQuizzes(pub);
      setSharedQuizzes(shared);
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
    <div className="dashboard-container">
      <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} />

        <main className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
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
            }}
          >
            {[
              { key: 'my', label: 'My Quizzes', count: myQuizzes.length },
              { key: 'public', label: 'Public', count: publicQuizzes.filter(q => q.creatorId !== user?.uid).length },
              { key: 'shared', label: 'Shared with Me', count: sharedQuizzes.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
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
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
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

          {filteredQuizzes.length === 0 ? (
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
  );
};
