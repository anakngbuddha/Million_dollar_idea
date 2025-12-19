import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/authService';
import { getUserQuizAttempts } from '../../services/quizService';
import {
  ArrowLeft,
  Search,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  TrendingUp,
  Activity,
  Award,
  Clock,
  Target,
  BarChart3,
} from 'lucide-react';
import '../../styles/DashboardPage.css';

export const Analytics: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);

  // Load quiz attempts from Firebase
  useEffect(() => {
    if (user && user.uid && !loading) {
      const loadQuizData = async () => {
        try {
          setLoadingAnalytics(true);
          setAnalyticsError(null);
          console.log('[Analytics] Loading quiz data for user:', user.uid);
          const attempts = await getUserQuizAttempts(user.uid);
          console.log('[Analytics] Quiz attempts loaded:', attempts);
          console.log('[Analytics] Number of attempts:', attempts.length);
          setQuizAttempts(attempts || []);
        } catch (error) {
          console.error('[Analytics] Error loading quiz data:', error);
          setAnalyticsError('Unable to load quiz data. Please check your connection and try again.');
          setQuizAttempts([]);
        } finally {
          setLoadingAnalytics(false);
        }
      };
      loadQuizData();
    }
  }, [user, loading]);

  // Calculate performance metrics from quiz attempts
  const calculateMetrics = () => {
    if (quizAttempts.length === 0) {
      return {
        totalCompleted: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        bestScore: 0,
        categoryData: {},
        weeklyData: Array(7).fill(0).map((_, i) => ({
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
          quizzes: 0,
          score: 0
        })),
      };
    }

    let totalPercentage = 0;
    let totalTimeSpent = 0;
    let bestScore = 0;
    const categoryData: { [key: string]: { attempts: number; totalScore: number; totalPoints: number } } = {};
    const weeklyMap: { [key: string]: { quizzes: number; scores: number[] } } = {
      0: { quizzes: 0, scores: [] },
      1: { quizzes: 0, scores: [] },
      2: { quizzes: 0, scores: [] },
      3: { quizzes: 0, scores: [] },
      4: { quizzes: 0, scores: [] },
      5: { quizzes: 0, scores: [] },
      6: { quizzes: 0, scores: [] },
    };

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    quizAttempts.forEach((attempt) => {
      totalPercentage += attempt.percentage;
      totalTimeSpent += attempt.timeSpent || 0;
      bestScore = Math.max(bestScore, attempt.percentage);

      // Category data
      const category = attempt.quizTitle;
      if (!categoryData[category]) {
        categoryData[category] = { attempts: 0, totalScore: 0, totalPoints: 0 };
      }
      categoryData[category].attempts += 1;
      categoryData[category].totalScore += attempt.score;
      categoryData[category].totalPoints += attempt.maxScore;

      // Weekly data
      const attemptDate = attempt.completedAt.toDate ? attempt.completedAt.toDate() : new Date(attempt.completedAt);
      if (attemptDate >= weekAgo) {
        const dayOfWeek = attemptDate.getDay();
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weeklyMap[adjustedDay].quizzes += 1;
        weeklyMap[adjustedDay].scores.push(attempt.percentage);
      }
    });

    // Convert to weekly data format
    const weeklyData = Object.keys(weeklyMap).map((dayKey) => {
      const dayIndex = parseInt(dayKey);
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayData = weeklyMap[dayKey];
      const avgScore = dayData.scores.length > 0
        ? Math.round(dayData.scores.reduce((a, b) => a + b, 0) / dayData.scores.length)
        : 0;
      return {
        day: dayNames[dayIndex],
        quizzes: dayData.quizzes,
        score: avgScore,
      };
    });

    return {
      totalCompleted: quizAttempts.length,
      averageScore: quizAttempts.length > 0 ? Math.round(totalPercentage / quizAttempts.length) : 0,
      totalTimeSpent,
      bestScore,
      categoryData,
      weeklyData,
    };
  };

  const metrics = calculateMetrics();

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(233, 69, 96, 0.3)',
            borderTop: '3px solid #e94560',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }}></div>
          <p style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  const navigationItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/dashboard', active: false },
    { icon: Search, label: 'My Quizzes', href: '/quizzes', active: false },
    { icon: BarChart3, label: 'Performance', href: '#', active: true },
    { icon: User, label: 'Community', href: '#' },
    { icon: Settings, label: 'Settings', href: '#' },
  ];

  const performanceMetrics = [
    {
      label: 'Quizzes Completed',
      value: metrics.totalCompleted.toString(),
      icon: Award,
      change: metrics.totalCompleted === 0 ? 'Start taking quizzes!' : `+${metrics.totalCompleted} total`,
      trend: 'up',
      color: '#3b82f6'
    },
    {
      label: 'Average Score',
      value: `${metrics.averageScore}%`,
      icon: TrendingUp,
      change: metrics.averageScore > 0 ? `Best: ${metrics.bestScore}%` : 'No scores yet',
      trend: 'up',
      color: '#8b5cf6'
    },
    {
      label: 'Best Score',
      value: `${metrics.bestScore}%`,
      icon: Activity,
      change: metrics.bestScore > 0 ? 'Keep improving!' : 'Start a quiz',
      trend: 'up',
      color: '#ec4899'
    },
    {
      label: 'Total Time Spent',
      value: metrics.totalTimeSpent > 0 
        ? metrics.totalTimeSpent >= 3600
          ? `${Math.floor(metrics.totalTimeSpent / 3600)}h ${Math.floor((metrics.totalTimeSpent % 3600) / 60)}m`
          : `${Math.floor(metrics.totalTimeSpent / 60)}m`
        : '0m',
      icon: Clock,
      change: metrics.totalTimeSpent > 0 
        ? metrics.totalTimeSpent >= 3600
          ? `${(metrics.totalTimeSpent / 3600).toFixed(1)} hours total`
          : `${Math.floor(metrics.totalTimeSpent / 60)} minutes total`
        : 'No time yet',
      trend: 'up',
      color: '#f59e0b'
    },
  ];

  const categoryPerformance = Object.entries(metrics.categoryData).map(([category, data], index) => {
    const colors = ['#fbbf24', '#61dafb', '#3178c6', '#1572b6', '#68a063', '#e94560', '#8b5cf6'];
    const accuracy = data.totalPoints > 0 
      ? Math.round((data.totalScore / data.totalPoints) * 100) 
      : 0;
    return {
      category,
      completed: data.attempts,
      correct: data.totalScore,
      accuracy: `${accuracy}%`,
      color: colors[index % colors.length],
    };
  });

  const weeklyData = metrics.weeklyData;

  const maxQuizzes = weeklyData.length > 0 
    ? Math.max(...weeklyData.map(d => d.quizzes), 1)
    : 1;

  return (
    <div className="dashboard-container">
      {/* Top Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-content">
          <div className="nav-left">
            <button 
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button 
              className="menu-toggle"
              onClick={() => navigate('/dashboard')}
              style={{ marginLeft: '8px', padding: '8px' }}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="nav-logo">
              <div className="logo-icon">Q</div>
              <span className="nav-title">QuizHub</span>
            </div>
          </div>

          <div className="nav-right">
            <div className="search-bar">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search..." 
              />
            </div>
            <div className="divider-line"></div>
            <div className="profile-section">
              <div className="profile-info">
                <div className="profile-name">
                  {user.displayName || user.email?.split('@')[0]}
                </div>
                <div className="profile-role">Student</div>
              </div>
              <div 
                className="profile-avatar"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="profile-avatar-image"
                  />
                ) : (
                  <span style={{ color: '#4285F4', fontWeight: '700' }}>
                    {(user.email?.[0] || 'U').toUpperCase()}
                  </span>
                )}
                
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <p>{user.email}</p>
                    </div>
                    <div className="dropdown-items">
                      <button className="dropdown-item">
                        <User size={16} /> Profile
                      </button>
                      <button className="dropdown-item">
                        <Settings size={16} /> Settings
                      </button>
                      <div className="dropdown-divider"></div>
                      <button
                        className="dropdown-item danger"
                        onClick={handleLogout}
                        disabled={logoutLoading}
                      >
                        <LogOut size={16} /> {logoutLoading ? 'Signing Out...' : 'Sign Out'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
          <div className="sidebar-items">
            {navigationItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`sidebar-item ${item.active ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </a>
            ))}
          </div>

          <div className="sidebar-footer">
            <div className="sidebar-tip">
              <div className="sidebar-tip-label">Insight</div>
              <div className="sidebar-tip-text">
                Your streak is growing! Keep taking quizzes.
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
          
          {/* Loading State */}
          {loadingAnalytics && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(233, 69, 96, 0.3)',
                borderTop: '3px solid #e94560',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
              }}></div>
              <p style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Loading your performance data...</p>
            </div>
          )}

          {/* Error State */}
          {analyticsError && !loadingAnalytics && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              color: 'rgba(239, 68, 68, 0.9)',
              fontSize: '14px',
            }}>
              ⚠️ {analyticsError}
            </div>
          )}

          {!loadingAnalytics && (
          <>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
          }}>
            <div className="content-header" style={{ margin: 0 }}>
              <h1>Performance Analytics</h1>
              <p>Track your learning progress and achievements.</p>
            </div>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
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
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Performance Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}>
            {performanceMetrics.map((metric, index) => (
              <div 
                key={index}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {metric.label}
                  </span>
                  <div style={{
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: `${metric.color}20`,
                  }}>
                    <metric.icon size={18} style={{ color: metric.color }} />
                  </div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: 'var(--color-text)',
                    margin: '0',
                  }}>
                    {metric.value}
                  </h2>
                </div>
                <p style={{
                  fontSize: '12px',
                  color: metric.trend === 'up' ? '#10b981' : 'var(--color-text-secondary)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  {metric.trend === 'up' && <TrendingUp size={14} />}
                  {metric.change}
                </p>
              </div>
            ))}
          </div>

          {/* Weekly Activity */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--color-text)',
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Activity size={20} style={{ color: '#ec4899' }} />
              Weekly Activity
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '12px',
            }}>
              {weeklyData.map((day, index) => (
                <div key={index} style={{
                  textAlign: 'center',
                }}>
                  <div style={{
                    position: 'relative',
                    marginBottom: '12px',
                    height: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                  }}>
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      width: '32px',
                      height: `${(day.quizzes / maxQuizzes) * 100}%`,
                      backgroundColor: '#8b5cf6',
                      borderRadius: '6px 6px 0 0',
                      transition: 'all 0.3s ease',
                      minHeight: day.quizzes > 0 ? '20px' : '0',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#a78bfa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#8b5cf6';
                    }}
                    title={`${day.quizzes} quizzes, ${day.score}% score`}
                    >
                    </div>
                  </div>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                    margin: '8px 0 4px 0',
                  }}>
                    {day.day}
                  </p>
                  <p style={{
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                  }}>
                    {day.quizzes} quiz{day.quizzes !== 1 ? 'zes' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Category Performance */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--color-text)',
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Target size={20} style={{ color: '#f59e0b' }} />
              Performance by Category
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {categoryPerformance.map((cat, index) => (
                <div key={index}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: cat.color,
                      }}></div>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--color-text)',
                      }}>
                        {cat.category}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                    }}>
                      {cat.accuracy}
                    </span>
                  </div>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'var(--color-border)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: cat.accuracy,
                      backgroundColor: cat.color,
                      borderRadius: '4px',
                      transition: 'width 0.3s ease',
                    }}></div>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '4px',
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                  }}>
                    <span>{cat.completed} completed</span>
                    <span>{cat.correct}/{cat.completed} correct</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz Attempts History */}
          {quizAttempts.length > 0 && (
            <div style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '24px',
              marginTop: '32px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--color-text)',
                margin: '0 0 20px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Award size={20} style={{ color: '#3b82f6' }} />
                Quiz Attempts History
              </h2>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                {quizAttempts.map((attempt, index) => {
                  const attemptDate = attempt.completedAt?.toDate 
                    ? attempt.completedAt.toDate() 
                    : new Date(attempt.completedAt);
                  const isExpanded = selectedAttempt?.id === `${index}-${attempt.quizTitle}`;
                  
                  return (
                    <div key={index}>
                      <div
                        onClick={() => setSelectedAttempt(
                          isExpanded ? null : { id: `${index}-${attempt.quizTitle}`, data: attempt }
                        )}
                        style={{
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                          e.currentTarget.style.borderColor = '#e94560';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-background)';
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          flex: 1,
                        }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: attempt.percentage >= 80 ? '#10b981' : attempt.percentage >= 60 ? '#f59e0b' : '#ef4444',
                          }}></div>
                          <div style={{ flex: 1 }}>
                            <h3 style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: 'var(--color-text)',
                              margin: '0 0 4px 0',
                            }}>
                              {attempt.quizTitle}
                            </h3>
                            <p style={{
                              fontSize: '12px',
                              color: 'var(--color-text-secondary)',
                              margin: 0,
                            }}>
                              {attemptDate.toLocaleDateString()} at {attemptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '20px',
                        }}>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{
                              fontSize: '18px',
                              fontWeight: '700',
                              color: 'var(--color-text)',
                              margin: 0,
                            }}>
                              {attempt.percentage}%
                            </p>
                            <p style={{
                              fontSize: '11px',
                              color: 'var(--color-text-secondary)',
                              margin: '2px 0 0 0',
                            }}>
                              {attempt.score}/{attempt.maxScore}
                            </p>
                          </div>
                          <div style={{
                            color: 'var(--color-text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '8px',
                          }}>
                            {isExpanded ? '▼' : '▶'}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div style={{
                          backgroundColor: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          borderTop: 'none',
                          borderRadius: '0 0 8px 8px',
                          padding: '16px',
                          marginTop: '-1px',
                        }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '12px',
                            marginBottom: '16px',
                          }}>
                            <div>
                              <p style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                color: 'var(--color-text-secondary)',
                                textTransform: 'uppercase',
                                margin: '0 0 4px 0',
                              }}>
                                Score
                              </p>
                              <p style={{
                                fontSize: '14px',
                                fontWeight: '700',
                                color: 'var(--color-text)',
                                margin: 0,
                              }}>
                                {attempt.score}/{attempt.maxScore}
                              </p>
                            </div>
                            <div>
                              <p style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                color: 'var(--color-text-secondary)',
                                textTransform: 'uppercase',
                                margin: '0 0 4px 0',
                              }}>
                                Percentage
                              </p>
                              <p style={{
                                fontSize: '14px',
                                fontWeight: '700',
                                color: attempt.percentage >= 80 ? '#10b981' : attempt.percentage >= 60 ? '#f59e0b' : '#ef4444',
                                margin: 0,
                              }}>
                                {attempt.percentage}%
                              </p>
                            </div>
                            <div>
                              <p style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                color: 'var(--color-text-secondary)',
                                textTransform: 'uppercase',
                                margin: '0 0 4px 0',
                              }}>
                                Time Spent
                              </p>
                              <p style={{
                                fontSize: '14px',
                                fontWeight: '700',
                                color: 'var(--color-text)',
                                margin: 0,
                              }}>
                                {attempt.timeSpent ? `${Math.floor(attempt.timeSpent / 60)}m ${attempt.timeSpent % 60}s` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                color: 'var(--color-text-secondary)',
                                textTransform: 'uppercase',
                                margin: '0 0 4px 0',
                              }}>
                                Correct Answers
                              </p>
                              <p style={{
                                fontSize: '14px',
                                fontWeight: '700',
                                color: 'var(--color-text)',
                                margin: 0,
                              }}>
                                {attempt.answers ? attempt.answers.filter((a: any) => a.isCorrect).length : 0}/{attempt.answers ? attempt.answers.length : 0}
                              </p>
                            </div>
                          </div>

                          {/* Question Breakdown */}
                          {attempt.answers && attempt.answers.length > 0 && (
                            <div>
                              <h4 style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: 'var(--color-text)',
                                margin: '0 0 12px 0',
                              }}>
                                Question Breakdown
                              </h4>
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                maxHeight: '300px',
                                overflowY: 'auto',
                              }}>
                                {attempt.answers.map((answer: any, answerIndex: number) => (
                                  <div key={answerIndex} style={{
                                    backgroundColor: 'var(--color-surface)',
                                    border: `1px solid ${answer.isCorrect ? '#10b981' : '#ef4444'}`,
                                    borderRadius: '6px',
                                    padding: '10px',
                                    fontSize: '12px',
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: '8px',
                                    }}>
                                      <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        backgroundColor: answer.isCorrect ? '#d1fae5' : '#fee2e2',
                                        color: answer.isCorrect ? '#10b981' : '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        flexShrink: 0,
                                      }}>
                                        {answer.isCorrect ? '✓' : '✗'}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <p style={{
                                          fontSize: '12px',
                                          fontWeight: '500',
                                          color: 'var(--color-text)',
                                          margin: '0 0 4px 0',
                                        }}>
                                          Q{answerIndex + 1}: {answer.question}
                                        </p>
                                        <p style={{
                                          fontSize: '11px',
                                          color: 'var(--color-text-secondary)',
                                          margin: '2px 0',
                                        }}>
                                          <strong>Your answer:</strong> {typeof answer.userAnswer === 'string' ? answer.userAnswer : answer.userAnswer.join(', ')}
                                        </p>
                                        {!answer.isCorrect && (
                                          <p style={{
                                            fontSize: '11px',
                                            color: '#10b981',
                                            margin: '2px 0 0 0',
                                          }}>
                                            <strong>Correct answer:</strong> {typeof answer.correctAnswer === 'string' ? answer.correctAnswer : answer.correctAnswer.join(', ')}
                                          </p>
                                        )}
                                        <p style={{
                                          fontSize: '11px',
                                          color: 'var(--color-text-secondary)',
                                          margin: '2px 0 0 0',
                                        }}>
                                          <strong>Points:</strong> {answer.points}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loadingAnalytics && quizAttempts.length === 0 && !analyticsError && (
            <div style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px dashed var(--color-border)',
              borderRadius: '12px',
              padding: '48px 24px',
              textAlign: 'center',
              marginTop: '32px',
            }}>
              <Award size={48} style={{
                color: 'var(--color-text-secondary)',
                marginBottom: '16px',
                opacity: 0.5,
              }} />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--color-text)',
                margin: '0 0 8px 0',
              }}>
                No Quiz Attempts Yet
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                margin: '0 0 16px 0',
              }}>
                Start taking quizzes to see your performance analytics here.
              </p>
              <button
                onClick={() => navigate('/quizzes')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e94560',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Browse Quizzes
              </button>
            </div>
          )}
          </>
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
