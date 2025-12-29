import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Plus,
  BarChart3,
  User,
  Database,
  Users,
} from 'lucide-react';
import '../styles/GlobalNavigation.css';

interface GlobalSidebarProps {
  isOpen: boolean;
}

export const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ isOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: BookOpen, label: 'My Quizzes', path: '/my-quizzes' },
    { icon: Plus, label: 'Create Quiz', path: '/create-quiz' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Database, label: 'MySQL Practice', path: '/mysql-practice' },
    { icon: Users, label: 'Community', path: '/community' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <aside className={`global-sidebar ${!isOpen ? 'closed' : ''}`}>
      <div className="sidebar-items">
        {navigationItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleNavigation(item.path)}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            title={item.label}
          >
            <item.icon size={20} />
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-tip">
          <div className="sidebar-tip-label">Pro Tip</div>
          <div className="sidebar-tip-text">
            Use the search bar to quickly find any feature!
          </div>
        </div>
      </div>
    </aside>
  );
};
