import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MeetingsPage } from './pages/MeetingsPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { RecordsPage } from './pages/RecordsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { DatabaseManagementPage } from './pages/DatabaseManagementPage';
import { SystemSettingsPage } from './pages/SystemSettingsPage';
import { BatchMessagingPage } from './pages/BatchMessagingPage';
import { PrivateMessagingPage } from './pages/PrivateMessagingPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import './App.css';

type PageType = 'dashboard' | 'meetings' | 'statistics' | 'records' | 'notifications' | 'users' | 'database' | 'system-settings' | 'batch-messaging' | 'private-messaging';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = React.useState<PageType>('dashboard');

  const handleNavigate = (page: string) => {
    setCurrentPage(page as PageType);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-neutral-600 mt-4">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // 根据当前页面渲染不同的组件
  const renderPage = () => {
    switch (currentPage) {
      case 'meetings':
        return <MeetingsPage onNavigate={handleNavigate} />;
      case 'statistics':
        return <StatisticsPage onNavigate={handleNavigate} />;
      case 'records':
        return <RecordsPage onNavigate={handleNavigate} />;
      case 'notifications':
        return <NotificationsPage onNavigate={handleNavigate} />;
      case 'users':
        return <UserManagementPage onNavigate={handleNavigate} />;
      case 'database':
        return <DatabaseManagementPage onNavigate={handleNavigate} />;
      case 'system-settings':
        return <SystemSettingsPage onNavigate={handleNavigate} />;
      case 'batch-messaging':
        return <BatchMessagingPage onNavigate={handleNavigate} />;
      case 'private-messaging':
        return <PrivateMessagingPage onNavigate={handleNavigate} />;
      case 'dashboard':
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return renderPage();
}

function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <AppContent />
      </UIProvider>
    </AuthProvider>
  );
}

export default App;
