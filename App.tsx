import React, { useState, useEffect } from 'react';
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
import { InstituteProfile } from './pages/InstituteProfile';
import { DataService } from './services/dataService';
import { UserRole } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Check session on load
  useEffect(() => {
      DataService.fetchCurrentUser().then(user => {
          if (user) {
              setIsAuthenticated(true);
              if (user.role === UserRole.ADMIN) setActiveTab('admin');
          }
          setLoading(false);
      });
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
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
    // We can rely on DataService.getCurrentUser() being populated now
    const user = DataService.getCurrentUser();
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
      case 'institute': return <InstituteProfile />;
      case 'deploy': return <DeploymentGuide />;
      default: return <Dashboard />;
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50">Loading...</div>;

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
