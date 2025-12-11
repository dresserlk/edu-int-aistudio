import React from 'react';
import { LayoutDashboard, Users, GraduationCap, BookOpen, CalendarCheck, DollarSign, Menu, X, CloudLightning, Shield, LogOut } from 'lucide-react';
import { DataService } from '../services/dataService';
import { UserRole, UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

const NavItem = ({ icon: Icon, label, id, active, onClick }: any) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors ${
      active 
        ? 'bg-blue-600 text-white shadow-lg' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`}
  >
    <Icon className="w-5 h-5 mr-3" />
    {label}
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [user, setUser] = React.useState<UserProfile | null>(null);

  React.useEffect(() => {
    DataService.getCurrentUser().then(setUser);
  }, []);

  const canSeeTeachers = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;
  const canSeeFinance = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;
  const canSeeStudents = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER; // Teachers see students inside their classes? or generally? Let's hide main student list for simplicity unless Manager
  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">EduFlow</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6 flex flex-col space-y-1">
          {isAdmin && (
              <NavItem icon={Shield} label="Platform Admin" id="admin" active={activeTab === 'admin'} onClick={setActiveTab} />
          )}

          {!isAdmin && <NavItem icon={LayoutDashboard} label="Dashboard" id="dashboard" active={activeTab === 'dashboard'} onClick={setActiveTab} />}
          
          {(canSeeStudents || isAdmin) && (
             <NavItem icon={Users} label="Students" id="students" active={activeTab === 'students'} onClick={setActiveTab} />
          )}
          
          {canSeeTeachers && (
            <NavItem icon={BookOpen} label="Teachers" id="teachers" active={activeTab === 'teachers'} onClick={setActiveTab} />
          )}
          
          {/* Everyone sees Classes/Attendance but data inside is filtered */}
          {!isAdmin && <NavItem icon={CalendarCheck} label="Classes" id="classes" active={activeTab === 'classes'} onClick={setActiveTab} />}
          {!isAdmin && <NavItem icon={CalendarCheck} label="Attendance" id="attendance" active={activeTab === 'attendance'} onClick={setActiveTab} />}
          
          {canSeeFinance && (
            <NavItem icon={DollarSign} label="Finance" id="finance" active={activeTab === 'finance'} onClick={setActiveTab} />
          )}
          
          <div className="pt-4 mt-4 border-t border-slate-800">
             <NavItem icon={CloudLightning} label="Deployment Guide" id="deploy" active={activeTab === 'deploy'} onClick={setActiveTab} />
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-6 bg-slate-950">
          <div className="flex items-center justify-between">
             <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white border-2 border-slate-600">
                    {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                <p className="text-sm font-semibold text-white max-w-[100px] truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 uppercase">{user?.role}</p>
                </div>
            </div>
            <button onClick={onLogout} className="text-slate-400 hover:text-white p-2">
                <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 lg:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-slate-500 hover:text-slate-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-slate-700">EduFlow Manager</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};