import React, { useState } from 'react';
import { DataService } from '../services/dataService';
import { GraduationCap, ArrowRight, Check } from 'lucide-react';

interface AuthProps {
  onLogin: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Mocking password
  
  // Registration fields
  const [instName, setInstName] = useState('');
  const [managerName, setManagerName] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await DataService.login(email);
      onLogin();
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!instName || !managerName || !email) {
        setError("All fields required");
        return;
    }
    try {
        await DataService.registerInstitute(instName, managerName, email);
        setSuccess("Registration successful! Please wait for Admin approval. (You can login as 'admin@platform.com' to approve yourself in this demo)");
        setMode('LOGIN');
    } catch (err) {
        setError("Registration failed");
    }
  };

  // Quick Mock Logins
  const quickLogin = (email: string) => {
      setEmail(email);
      setPassword('password'); // dummy
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
        
        {/* Left Side: Brand */}
        <div className="bg-slate-900 text-white p-12 md:w-1/2 flex flex-col justify-between">
            <div>
                <div className="flex items-center space-x-2 mb-8">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">EduFlow</span>
                </div>
                <h2 className="text-3xl font-bold mb-4">Manage your educational institute with ease.</h2>
                <p className="text-slate-400">Secure, isolated environments for every school. Track attendance, manage fees, and automate salaries.</p>
            </div>
            <div className="text-sm text-slate-500">© 2024 EduFlow Manager</div>
        </div>

        {/* Right Side: Form */}
        <div className="p-12 md:w-1/2 flex flex-col justify-center">
            {success && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg text-sm flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5" /> {success}
                </div>
            )}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {mode === 'LOGIN' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Sign in to your account</h3>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="you@institute.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                        <input 
                            type="password" 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center">
                        Sign In <ArrowRight className="w-4 h-4 ml-2" />
                    </button>

                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <p className="text-xs text-slate-500 font-bold mb-2 uppercase">Quick Demo Login:</p>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => quickLogin('admin@platform.com')} className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200">Admin</button>
                            <button type="button" onClick={() => quickLogin('manager@springfield.com')} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">Manager</button>
                            <button type="button" onClick={() => quickLogin('sarah@eduflow.com')} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100">Teacher</button>
                        </div>
                    </div>

                    <div className="mt-4 text-center">
                        <span className="text-slate-600 text-sm">Don't have an account? </span>
                        <button type="button" onClick={() => setMode('REGISTER')} className="text-blue-600 font-bold text-sm hover:underline">Register Institute</button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Register your Institute</h3>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Institute Name</label>
                        <input 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Springfield High"
                            value={instName}
                            onChange={e => setInstName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Manager Name</label>
                        <input 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Your Name"
                            value={managerName}
                            onChange={e => setManagerName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="manager@school.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                        <input 
                            type="password" 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Create a password"
                        />
                    </div>
                    
                    <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                        Register Institute
                    </button>
                    
                    <div className="mt-4 text-center">
                        <button type="button" onClick={() => setMode('LOGIN')} className="text-slate-500 font-bold text-sm hover:text-slate-800">Back to Login</button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};
