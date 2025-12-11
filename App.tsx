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
import { DataService } from './services/dataService';
import { UserRole } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      // Check for existing session
      DataService.getCurrentUser().then(user => {
          if (user) {
              setIsAuthenticated(true);
              if (user.role === UserRole.ADMIN) setActiveTab('admin');
          }
          setLoading(false);
      });
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    DataService.getCurrentUser().then(user => {
        if (user?.role === UserRole.ADMIN) {
            setActiveTab('admin');
        } else {
            setActiveTab('dashboard');
        }
    });
  };

  const handleLogout = async () => {
      await DataService.logout();
      setIsAuthenticated(false);
  };

  const renderContent = () => {
    // Need to await currentUser in DataService effectively, but for now relying on state flow
    // In real app, might want context.
    return (
        <ContentRouter activeTab={activeTab} />
    );
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

// Separate component to handle async user check logic cleanly if needed
const ContentRouter = ({ activeTab }: { activeTab: string }) => {
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    
    useEffect(() => {
        DataService.getCurrentUser().then(u => setUserRole(u?.role || null));
    }, []);

    if (activeTab === 'admin' && userRole === UserRole.ADMIN) {
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
}

export default App;
