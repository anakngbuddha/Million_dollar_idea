import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { getUserQuizAttempts } from '../services/quizService';
import { getUserForumContributions } from '../services/communityService';
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Mail,
  Calendar,
  Shield,
  User,
  ChevronRight,
  Users,
} from 'lucide-react';
import '../styles/DashboardPage.css'; 

export const DashboardPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [quizStats, setQuizStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    forumPosts: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchQuizStats = async () => {
      if (user?.uid) {
        try {
          setStatsLoading(true);
          const [attempts, forumContributions] = await Promise.all([
            getUserQuizAttempts(user.uid),
            getUserForumContributions(user.uid)
          ]);
          
          const totalQuizzes = attempts.length;
          const averageScore = totalQuizzes > 0 
            ? Math.round(
                attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / totalQuizzes
              )
            : 0;

          setQuizStats({
            totalQuizzes,
            averageScore,
            forumPosts: forumContributions
          });
        } catch (error) {
          console.error('Error fetching quiz stats:', error);
          setQuizStats({
            totalQuizzes: 0,
            averageScore: 0,
            forumPosts: 0
          });
        } finally {
          setStatsLoading(false);
        }
      }
    };

    fetchQuizStats();
  }, [user?.uid]);

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
          <p style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  const stats = [
    {
      label: 'Quizzes Completed',
      value: statsLoading ? '--' : quizStats.totalQuizzes.toString(),
      icon: BookOpen,
      change: `${quizStats.totalQuizzes > 0 ? '+' : ''}${quizStats.totalQuizzes} quizzes`,
      trend: quizStats.totalQuizzes > 0 ? 'up' : 'neutral'
    },
    {
      label: 'Average Score',
      value: statsLoading ? '--' : `${quizStats.averageScore}%`,
      icon: TrendingUp,
      change: quizStats.totalQuizzes > 0 ? 'Based on attempts' : 'No data yet',
      trend: quizStats.averageScore > 70 ? 'up' : 'neutral'
    },
    {
      label: 'Forum Contributions',
      value: statsLoading ? '--' : quizStats.forumPosts.toString(),
      icon: MessageSquare,
      change: quizStats.forumPosts > 0 ? `${quizStats.forumPosts} contributions` : 'Start discussing',
      trend: quizStats.forumPosts > 0 ? 'up' : 'neutral'
    },
  ];

  const quickActions = [
    {
      icon: BookOpen,
      title: 'Classrooms',
      description: 'Create and join classes to collaborate with others.',
      action: 'Go to Classrooms',
      highlight: true,
      onClick: () => navigate('/classrooms'),
    },
    {
      icon: BookOpen,
      title: 'MySQL Practice',
      description: 'Master MySQL syntax with interactive exercises.',
      action: 'Practice Now',
      highlight: false,
      onClick: () => navigate('/mysql-practice'),
    },
    {
      icon: BarChart3,
      title: 'View Analytics',
      description: 'Deep dive into your past performance and metrics.',
      action: 'View Reports',
      highlight: false,
      onClick: () => navigate('/analytics'),
    },
    {
      icon: Users,
      title: 'Community Forum',
      description: 'Connect with other learners and share insights.',
      action: 'Join Discussion',
      highlight: false,
      onClick: () => navigate('/community'),
    },
  ];

  return (
    <AppLayout>
      <div className="dashboard-container">
        <div className="dashboard-layout">
          {/* Main Content */}
          <main className="main-content">
          
          {/* Header */}
          <div className="content-header">
            <h1>Dashboard Overview</h1>
            <p>Welcome back, {user.displayName || 'Student'}. Here is your daily activity summary.</p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-header">
                  <div className={`stat-icon ${index === 0 ? 'blue' : index === 1 ? 'purple' : 'green'}`}>
                    <stat.icon size={24} />
                  </div>
                  <span className={`stat-badge ${stat.trend === 'neutral' ? 'neutral' : ''}`}>
                    {stat.change}
                  </span>
                </div>
                <div>
                  <p className="stat-label">{stat.label}</p>
                  <h3 className="stat-value">{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <div className="section-header">
              <h2>Quick Actions</h2>
            </div>
            
            <div className="actions-grid">
              {quickActions.map((action, index) => (
                <div 
                  key={index}
                  className={`action-card ${action.highlight ? 'highlight' : ''}`}
                >
                  <div className="action-icon">
                    <action.icon size={20} />
                  </div>
                  <h3 className="action-title">{action.title}</h3>
                  <p className="action-description">{action.description}</p>
                  
                  <button className="action-link" onClick={action.onClick}>
                    {action.action}
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Account Information */}
          <div className="account-section">
            <div className="account-header">
              <h3>Account Details</h3>
              <button 
                className="btn btn-outline"
                onClick={() => navigate('/profile')}
              >
                Edit Profile
              </button>
            </div>
            <div className="account-content">
              <div className="account-field">
                <label className="account-label">Email Address</label>
                <div className="account-value">
                  <Mail size={18} />
                  <span>{user.email}</span>
                </div>
              </div>
              <div className="account-field">
                <label className="account-label">Display Name</label>
                <div className="account-value">
                  <User size={18} />
                  <span>{user.displayName || 'Not Set'}</span>
                </div>
              </div>
              <div className="account-field">
                <label className="account-label">Account Type</label>
                <div className="account-value">
                  <Shield size={18} />
                  <span>{user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Standard'}</span>
                </div>
              </div>
              <div className="account-field">
                <label className="account-label">Joined</label>
                <div className="account-value">
                  <Calendar size={18} />
                  <span>{new Date(user.metadata.creationTime!).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
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