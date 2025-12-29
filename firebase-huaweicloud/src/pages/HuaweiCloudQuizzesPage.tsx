import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { ArrowRight, Cloud, Zap } from 'lucide-react';
import '../styles/DashboardPage.css';

interface HuaweiQuiz {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  color: string;
}

export const HuaweiCloudQuizzesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const huaweiQuizzes: HuaweiQuiz[] = [
    {
      id: 'huawei-cloud-migration',
      title: 'Huawei Cloud Migration Quiz',
      description: 'Master the Cloud Migration Framework with 7 phases and 12 steps. Learn about architecture design, solution planning, and best practices for enterprise cloud migration.',
      path: '/huawei-cloud-migration-quiz',
      icon: <Cloud size={32} />,
      difficulty: 'Intermediate',
      color: '#FF6B35',
    },
    {
      id: 'storage-migration',
      title: 'Storage Migration Quiz',
      description: 'Test your knowledge about Huawei Cloud storage solutions including ECS, EVS, OBS, SMS, DES, and VPN-based migration strategies. 20 questions covering storage concepts.',
      path: '/storage-migration-quiz',
      icon: <Zap size={32} />,
      difficulty: 'Beginner',
      color: '#4ECDC4',
    },
    {
      id: 'cloud-migration-framework',
      title: 'Cloud Migration Framework',
      description: 'Comprehensive quiz on the Cloud Migration Framework methodology. Learn about the 7 phases, 12 steps, the "iron triangle" cooperation model, and the 6 Rs migration strategies.',
      path: '/cloud-migration-quiz',
      icon: <Cloud size={32} />,
      difficulty: 'Advanced',
      color: '#95E1D3',
    },
    {
      id: 'migration-chapter-6-7',
      title: 'Migration - Chapters 6 & 7',
      description: 'Advanced topics covering post-migration governance, operations, and continuous optimization. Covers delivery excellence, service management, and migration assurance.',
      path: '/migration-quiz-chapter-6-7',
      icon: <Zap size={32} />,
      difficulty: 'Advanced',
      color: '#F38181',
    },
  ];

  const filteredQuizzes = huaweiQuizzes.filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <AppLayout>
      <div className="dashboard-container">
        <div className="dashboard-layout">
          <main className="main-content">
            <div className="content-header">
              <div>
                <h1>Huawei Cloud Quizzes</h1>
                <p>Master Huawei Cloud migration and implementation skills</p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '32px',
              }}
            >
              <input
                type="text"
                placeholder="Search Huawei Cloud quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
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
                <Cloud size={64} style={{ color: 'var(--color-text-secondary)', opacity: 0.5, marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>
                  No quizzes found
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  Try adjusting your search query
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: '24px',
                }}
              >
                {filteredQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(233, 69, 96, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        height: '100px',
                        backgroundColor: quiz.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.2,
                      }}
                    >
                      <div style={{ color: quiz.color }}>
                        {quiz.icon}
                      </div>
                    </div>

                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text)', margin: '0 0 8px 0' }}>
                        {quiz.title}
                      </h3>

                      <p
                        style={{
                          fontSize: '14px',
                          color: 'var(--color-text-secondary)',
                          margin: '0 0 16px 0',
                          flex: 1,
                          lineHeight: '1.5',
                        }}
                      >
                        {quiz.description}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px',
                          paddingBottom: '16px',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        <div
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            backgroundColor: `${getDifficultyColor(quiz.difficulty)}20`,
                            color: getDifficultyColor(quiz.difficulty),
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          {quiz.difficulty}
                        </div>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: quiz.color,
                          }}
                        />
                      </div>

                      <button
                        onClick={() => navigate(quiz.path)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          backgroundColor: quiz.color,
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.9';
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        Start Quiz
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </AppLayout>
  );
};
