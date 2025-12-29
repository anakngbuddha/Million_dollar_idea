import React, { useState } from 'react';
import { GlobalSidebar } from './GlobalSidebar';
import { GlobalTopBar } from './GlobalTopBar';
import '../styles/GlobalNavigation.css';

interface AppLayoutProps {
  children: React.ReactNode;
  hideNavigation?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, hideNavigation = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-layout">
      {!hideNavigation && (
        <GlobalTopBar 
          sidebarOpen={sidebarOpen} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
      )}
      {!hideNavigation && <GlobalSidebar isOpen={sidebarOpen} />}
      <div className={`app-content ${!sidebarOpen ? 'sidebar-closed' : ''} ${hideNavigation ? 'hide-nav' : ''}`}>
        {children}
      </div>
    </div>
  );
};
