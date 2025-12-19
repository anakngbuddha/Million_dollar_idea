import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import {
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Search,
} from 'lucide-react';
import '../styles/Navigation.css';

interface TopBarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ sidebarOpen, onToggleSidebar }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

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

  if (!user) return null;

  return (
    <nav className="dashboard-nav">
      <div className="nav-content">
        <div className="nav-left">
          <button 
            className="menu-toggle"
            onClick={onToggleSidebar}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
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
              onClick={() => setDropdownOpen(!dropdownOpen)}
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
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/profile');
                      }}
                    >
                      <User size={16} /> Profile
                    </button>
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/profile');
                      }}
                    >
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
  );
};
