import React, { useState } from 'react';
import { DataService } from '../services/dataService';
import { supabase } from '../services/supabaseClient';
import { GraduationCap, ArrowRight, Check } from 'lucide-react';

interface AuthProps {
  onLogin: () => void;
}

/* =======================
   DEMO ACCOUNT CONSTANTS
   ======================= */
const DEMO_EMAIL = 'one@mng.com';
const DEMO_PASSWORD = 'one@mng.com';

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

  /* =======================
     LOGIN HANDLER
     ======================= */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      await DataService.login(email);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     REGISTER HANDLER
     ======================= */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!instName || !managerName || !email || !password) {
      setError('All fields required');
      return;
    }

    setLoading(true);

    try {
      const { data: instData, error: instError } = await supabase
        .from('institutes')
        .insert({ name: instName, status: 'PENDING' })
        .select()
        .single();

      if (instError) throw instError;

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            institute_id: instData.id,
            role: 'MANAGER',
            full_name: managerName
          }
        }
      });

      if (signUpError) throw signUpError;

      setSuccess('Registration successful! Please check your email for verification.');
      setMode('LOGIN');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">

        {/* LEFT SIDE */}
        <div className="bg-slate-900 text-white p-12 md:w-1/2 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-8">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">EduFlow</span>
            </div>

            <h2 className="text-3xl font-bold mb-4">
              Manage your educational institute with ease.
            </h2>
            <p className="text-slate-400">
              Secure, isolated environments for every school. Track attendance,
              manage fees, and automate salaries.
            </p>
          </div>

          <div className="text-sm text-slate-500">
            © 2024 EduFlow Manager
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-12 md:w-1/2 flex flex-col justify-center">

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg text-sm flex items-start">
              <Check className="w-4 h-4 mr-2 mt-0.5" />
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* =======================
             LOGIN FORM
             ======================= */}
          {mode === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <h3 className="text-2xl font-bold mb-6">
                Sign in to your account
              </h3>

              <div>
                <label className="block text-sm font-bold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              {/* 🔹 DEMO AUTOFILL BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setEmail(DEMO_EMAIL);
                  setPassword(DEMO_PASSWORD);
                }}
                className="w-full border border-dashed border-blue-400 text-blue-600 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors"
              >
                Use Demo Account
              </button>

              <button
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Sign In'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>

              <div className="text-center mt-4">
                <span className="text-sm text-slate-600">
                  Don’t have an account?
                </span>
                <button
                  type="button"
                  onClick={() => setMode('REGISTER')}
                  className="ml-2 text-blue-600 font-bold text-sm hover:underline"
                >
                  Register Institute
                </button>
              </div>
            </form>
          ) : (
            /* =======================
               REGISTER FORM
               ======================= */
            <form onSubmit={handleRegister} className="space-y-4">
              <h3 className="text-2xl font-bold mb-6">
                Register your Institute
              </h3>

              <input
                placeholder="Institute Name"
                className="w-full border p-3 rounded-lg"
                value={instName}
                onChange={e => setInstName(e.target.value)}
              />

              <input
                placeholder="Manager Name"
                className="w-full border p-3 rounded-lg"
                value={managerName}
                onChange={e => setManagerName(e.target.value)}
              />

              <input
                type="email"
                placeholder="Email"
                className="w-full border p-3 rounded-lg"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full border p-3 rounded-lg"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />

              <button
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Register Institute'}
              </button>

              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="text-sm font-bold text-slate-500 hover:text-slate-800 text-center"
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
