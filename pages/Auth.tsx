import React, { useState } from 'react';
import { DataService } from '../services/dataService';
import { supabase } from '../services/supabaseClient';
import { GraduationCap, ArrowRight, Check } from 'lucide-react';

interface AuthProps {
  onLogin: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration fields
  const [instName, setInstName] = useState('');
  const [managerName, setManagerName] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Check profile validity
      await DataService.login(email);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
        setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!instName || !managerName || !email || !password) {
        setError("All fields required");
        return;
    }
    setLoading(true);
    try {
        await DataService.registerInstitute(instName, managerName, email, password);
        setSuccess("Registration successful! Please check your email for verification.");
        setMode('LOGIN');
    } catch (err: any) {
        setError(err.message || "Registration failed");
    } finally {
        setLoading(false);
    }
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
                    <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50">
                        {loading ? 'Processing...' : 'Sign In'} <ArrowRight className="w-4 h-4 ml-2" />
                    </button>

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
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    
                    <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50">
                        {loading ? 'Creating...' : 'Register Institute'}
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
