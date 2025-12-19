import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/authService';
import {
  ArrowLeft,
  Search,
  Filter,
  Clock,
  Users,
  BarChart3,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ChevronRight,
} from 'lucide-react';
import '../../styles/DashboardPage.css';

export const QuizList: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

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
          <p style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Loading Quizzes...</p>
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
    { icon: Search, label: 'Quiz Catalog', href: '/quizzes', active: true },
    { icon: Search, label: 'My Quizzes', href: '/my-quizzes', active: false },
    { icon: BarChart3, label: 'Performance', href: '/analytics' },
    { icon: Users, label: 'Community', href: '/community' },
    { icon: Settings, label: 'Settings', href: '#' },
  ];

  const quizzes = [
    // Migration Quizzes with Navigation
    {
      id: 1,
      title: 'Huawei Cloud Storage Migration',
      description: 'Master ECS, EVS, OBS, SMS, DES, and cross-cloud VPN migration',
      difficulty: 'Intermediate',
      questions: 20,
      avgTime: '22 min',
      participants: 542,
      rating: 4.7,
      completed: false,
      category: 'Migration',
      href: '/quiz/storage-migration',
    },
    {
      id: 2,
      title: 'Cloud Migration Framework',
      description: 'Test your knowledge on Migration Policy, Process, and Requirement Survey',
      difficulty: 'Advanced',
      questions: 30,
      avgTime: '30 min',
      participants: 318,
      rating: 4.8,
      completed: false,
      category: 'Migration',
      href: '/quiz/cloud-migration',
    },
    {
      id: 3,
      title: 'Huawei Cloud Migration Essentials',
      description: 'Comprehensive quiz on migration strategies, architecture design, and best practices',
      difficulty: 'Advanced',
      questions: 30,
      avgTime: '28 min',
      participants: 276,
      rating: 4.9,
      completed: false,
      category: 'Migration',
      href: '/quiz/huawei-cloud-migration',
    },
    {
      id: 4,
      title: 'Cloud Migration Essentials',
      description: 'Master cloud migration fundamentals including data consistency, service environments, and verification techniques',
      difficulty: 'Intermediate',
      questions: 30,
      avgTime: '32 min',
      participants: 425,
      rating: 4.6,
      completed: false,
      category: 'Migration',
      href: '/quiz/migration-essentials',
    },
    {
      id: 5,
      title: 'Database Migration - Ch 6-7',
      description: 'Advanced migration strategies: OMS, DRS, distributed architecture, sharding schemes, and best practices',
      difficulty: 'Advanced',
      questions: 40,
      avgTime: '45 min',
      participants: 187,
      rating: 4.8,
      completed: false,
      category: 'Migration',
      href: '/quiz/migration-chap-6-7',
    },
  ];

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterDifficulty === 'all' || quiz.difficulty === filterDifficulty;
    const matchesCategory = filterCategory === 'all' || quiz.category === filterCategory;
    return matchesSearch && matchesFilter && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'Beginner': return '#10b981';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

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
                placeholder="Search quizzes..." 
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
              <div className="sidebar-tip-label">Pro Tip</div>
              <div className="sidebar-tip-text">
                Challenge your friends to quizzes!
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
          
          {/* Header */}
          <div className="content-header">
            <div>
              <h1>Huawei Cloud Quiz Catalog</h1>
              <p>Master cloud services across Database, Container, Compute, and Network categories.</p>
            </div>
            <button
              onClick={() => navigate('/my-quizzes')}
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
                whiteSpace: 'nowrap',
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
              <Search size={18} />
              My Custom Quizzes
            </button>
          </div>

          {/* Filter Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <div className="search-bar" style={{ width: '100%' }}>
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search quizzes by title or topic..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}>
              <Filter size={18} style={{ color: 'var(--color-text-secondary)' }} />
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
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
                <option value="all">All Categories</option>
                <option value="Database">Database</option>
                <option value="Container">Container</option>
                <option value="Compute">Compute</option>
                <option value="Network">Network</option>
                <option value="Migration">Migration</option>
              </select>
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}>
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

          {/* Quizzes Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px',
          }}>
            {filteredQuizzes.map((quiz) => (
              <div 
                key={quiz.id}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = 'translateY(-4px)';
                  el.style.boxShadow = '0 12px 24px rgba(233, 69, 96, 0.15)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                      margin: '0 0 4px 0',
                    }}>
                      {quiz.title}
                    </h3>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      margin: 0,
                    }}>
                      {quiz.questions} questions • {quiz.category}
                    </p>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#fbbf24',
                  }}>
                    <Star size={14} fill="#fbbf24" />
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>{quiz.rating}</span>
                  </div>
                </div>

                <p style={{
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  margin: '0 0 12px 0',
                  flexGrow: 1,
                }}>
                  {quiz.description}
                </p>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                  }}>
                    <Clock size={14} />
                    {quiz.avgTime}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                  }}>
                    <Users size={14} />
                    {quiz.participants}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginLeft: 'auto',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: `${getDifficultyColor(quiz.difficulty)}20`,
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: getDifficultyColor(quiz.difficulty),
                    }}>
                      {quiz.difficulty}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (quiz.href) {
                      navigate(quiz.href);
                    } else if (quiz.category === 'Migration') {
                      navigate('/quiz/storage-migration');
                    }
                  }}
                  style={{
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: quiz.completed ? '#10b981' : '#e94560',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                >
                  {quiz.completed ? 'Retake Quiz' : 'Take Quiz'}
                  <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>

          {filteredQuizzes.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: 'var(--color-text-secondary)',
            }}>
              <Search size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', fontWeight: '500' }}>No quizzes found</p>
              <p style={{ fontSize: '14px' }}>Try adjusting your search or filters</p>
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
