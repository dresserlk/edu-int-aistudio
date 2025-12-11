import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Classes } from './pages/Classes';
import { Attendance } from './pages/Attendance';
import { Finance } from './pages/Finance';
import { Students } from './pages/Students';
import { Teachers } from './pages/Teachers';
import { DeploymentGuide } from './pages/DeploymentGuide';
import { AdminDashboard } from './pages/AdminDashboard';
import { DataService } from './services/dataService';
import { UserRole } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const user = DataService.getCurrentUser();

  const handleLogin = () => {
    setIsAuthenticated(true);
    // Reset tab based on role
    const currentUser = DataService.getCurrentUser();
    if (currentUser?.role === UserRole.ADMIN) {
        setActiveTab('admin');
    } else {
        setActiveTab('dashboard');
    }
  };

  const handleLogout = async () => {
      await DataService.logout();
      setIsAuthenticated(false);
  };

  const renderContent = () => {
    if (!user) return null;

    if (activeTab === 'admin' && user.role === UserRole.ADMIN) {
        return <AdminDashboard />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'students': return <Students />;
      case 'teachers': return <Teachers />;
      case 'classes': return <Classes />;
      case 'attendance': return <Attendance />;
      case 'finance': return <Finance />;
      case 'deploy': return <DeploymentGuide />;
      default: return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
      return <Auth onLogin={handleLogin} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
}

export default App;
