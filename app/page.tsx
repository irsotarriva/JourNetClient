'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import NetworkBackground from '@/components/NetworkBackground';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, login, signup, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/home');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const success = await login(email, password);
        if (success) {
          router.push('/home');
        } else {
          setError('Invalid email or password');
        }
      } else {
        if (!username) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        const success = await signup(email, username, password);
        if (success) {
          router.push('/home');
        } else {
          setError('Email already exists or signup failed');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <NetworkBackground />
        <div className="relative z-10 text-xl font-medium text-gray-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <NetworkBackground />
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="glass-effect p-8 rounded-2xl shadow-2xl w-full border border-white/20 animate-scale-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4 shadow-lg transform hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-2">
              Scientific Review
            </h1>
            <p className="text-gray-600 font-medium">
              Scientific Paper Discussion Platform
            </p>
          </div>

          <div className="flex mb-6 bg-gray-100/50 p-1.5 rounded-xl shadow-inner border border-gray-200">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${isLogin
                ? 'bg-white text-blue-600 shadow-md transform scale-105'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${!isLogin
                ? 'bg-white text-blue-600 shadow-md transform scale-105'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white/60 backdrop-blur-sm hover:border-gray-300 outline-none text-gray-800 font-medium placeholder-gray-400"
                placeholder="you@example.com"
              />
            </div>

            {!isLogin && (
              <div className="animate-slide-down">
                <label htmlFor="username" className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                  className="w-full px-5 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white/60 backdrop-blur-sm hover:border-gray-300 outline-none text-gray-800 font-medium placeholder-gray-400"
                  placeholder="your_username"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white/60 backdrop-blur-sm hover:border-gray-300 outline-none text-gray-800 font-medium placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-shake shadow-sm flex items-center font-medium">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </span>
              ) : isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100/50">
            <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Demo accounts</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600 bg-white/80 p-2.5 rounded-lg border border-blue-100 font-mono">
                <span className="font-semibold text-blue-700">alice@university.edu</span>
                <span className="text-gray-400">password123</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 bg-white/80 p-2.5 rounded-lg border border-blue-100 font-mono">
                <span className="font-semibold text-blue-700">bob@research.org</span>
                <span className="text-gray-400">password123</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6 font-medium">
          © 2024 JourNet Scientific Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}
