import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  BarChart4,
  Users,
  Settings,
  Plus,
} from 'lucide-react';
import '../styles/Navigation.css';

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: BookOpen, label: 'My Quizzes', href: '/quizzes' },
    { icon: Plus, label: 'Create Quiz', href: '/create-quiz' },
    { icon: BarChart4, label: 'Performance', href: '/analytics' },
    { icon: Users, label: 'Community', href: '/community' },
    { icon: Settings, label: 'Settings', href: '/profile' },
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  return (
    <aside className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      <div className="sidebar-items">
        {navigationItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleNavigation(item.href)}
            className={`sidebar-item ${location.pathname === item.href ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-tip">
          <div className="sidebar-tip-label">Pro Tip</div>
          <div className="sidebar-tip-text">
            Complete daily quizzes to maintain your streak!
          </div>
        </div>
      </div>
    </aside>
  );
};
