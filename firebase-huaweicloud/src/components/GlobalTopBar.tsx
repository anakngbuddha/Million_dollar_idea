import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import {
  Menu,
  X,
  Search,
  LogOut,
  User as UserIcon,
  Settings,
} from 'lucide-react';
import '../styles/GlobalNavigation.css';

interface GlobalTopBarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

interface SearchResult {
  title: string;
  description: string;
  path: string;
  category: string;
}

export const GlobalTopBar: React.FC<GlobalTopBarProps> = ({ 
  sidebarOpen, 
  onToggleSidebar 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Add blur overlay when search is active
  useEffect(() => {
    const handleBlurOverlay = () => {
      if (showSearchResults) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    handleBlurOverlay();

    return () => {
      document.body.style.overflow = '';
    };
  }, [showSearchResults]);

  // All searchable items in the application
  const searchableItems: SearchResult[] = [
    // Main Pages
    { title: 'Dashboard', description: 'View your learning dashboard and stats', path: '/dashboard', category: 'Pages' },
    { title: 'My Quizzes', description: 'View and manage your custom quizzes', path: '/my-quizzes', category: 'Pages' },
    { title: 'Create Quiz', description: 'Create a new custom quiz', path: '/create-quiz', category: 'Pages' },
    { title: 'Analytics', description: 'View your performance analytics', path: '/analytics', category: 'Pages' },
    { title: 'MySQL Practice', description: 'Practice MySQL queries', path: '/mysql-practice', category: 'Pages' },
    { title: 'Community', description: 'Join discussions and share knowledge', path: '/community', category: 'Pages' },
    { title: 'Profile', description: 'Manage your profile settings', path: '/profile', category: 'Pages' },
    
    // Quiz Pages
    { title: 'Quiz Catalog', description: 'Browse available quizzes', path: '/quizzes', category: 'Quizzes' },
    { title: 'Storage Migration Quiz', description: 'Test your storage migration knowledge', path: '/quiz/storage-migration', category: 'Quizzes' },
    { title: 'Cloud Migration Quiz', description: 'Test your cloud migration skills', path: '/quiz/cloud-migration', category: 'Quizzes' },
    { title: 'Huawei Cloud Migration', description: 'Huawei Cloud migration quiz', path: '/quiz/huawei-cloud-migration', category: 'Quizzes' },
    { title: 'Migration Chapters 6-7', description: 'Advanced migration concepts', path: '/quiz/migration-chap-6-7', category: 'Quizzes' },
    
    // Features
    { title: 'AI Question Generator', description: 'Generate quiz questions with AI', path: '/create-quiz', category: 'Features' },
    { title: 'Performance Tracking', description: 'Track your quiz performance', path: '/analytics', category: 'Features' },
    { title: 'Forum Posts', description: 'Create and view community posts', path: '/community', category: 'Features' },
    { title: 'Public Quizzes', description: 'Browse public quizzes', path: '/my-quizzes', category: 'Features' },
  ];

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = searchableItems.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    ).slice(0, 8); // Limit to 8 results

    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleSearchResultClick = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  if (!user) return null;

  return (
    <>
      {showSearchResults && (
        <div 
          className="search-blur-overlay"
          onClick={() => setShowSearchResults(false)}
        ></div>
      )}
      <nav className="global-topbar">
        <div className="topbar-content">
          <div className="topbar-left">
            <button 
              className="menu-toggle"
              onClick={onToggleSidebar}
              aria-label="Toggle Sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="topbar-logo" onClick={() => navigate('/dashboard')}>
              <div className="logo-icon">Q</div>
              <span className="logo-title">QuizHub</span>
            </div>
          </div>

          <div className="topbar-center" ref={searchRef}>
            <div className="global-search-bar">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search pages, quizzes, features..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery) {
                    setShowSearchResults(true);
                  }
                }}
              />
              {searchQuery && (
                <button 
                  className="search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {showSearchResults && (
              <div className="search-results-dropdown">
                <div className="search-results-header">
                  <span className="search-results-count">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </span>
                </div>
                <div className="search-results-list">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      className="search-result-item"
                      onClick={() => handleSearchResultClick(result.path)}
                    >
                      <div className="search-result-content">
                        <div className="search-result-title">{result.title}</div>
                        <div className="search-result-description">{result.description}</div>
                      </div>
                      <div className="search-result-category">{result.category}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="topbar-right">
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
                  <span className="profile-avatar-initial">
                    {(user.email?.[0] || 'U').toUpperCase()}
                  </span>
                )}
                
                {dropdownOpen && (
                  <div className="profile-dropdown-menu">
                    <div className="dropdown-header">
                      <p className="dropdown-email">{user.email}</p>
                    </div>
                    <div className="dropdown-items">
                      <button 
                        className="dropdown-item"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/profile');
                        }}
                      >
                        <UserIcon size={16} /> Profile
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
    </>
  );
};
