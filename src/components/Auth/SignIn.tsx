import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, Mail, User, Shield } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

// Add prop type for onSignIn
interface SignInProps {
  onSignIn?: () => void;
}

export default function SignIn({ onSignIn }: SignInProps) {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const { signIn } = useApp();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = signIn(form.email, form.password);
    if (!result.success) {
      setError(result.message);
      setShowAlert(true);
      return;
    }
    setError('');
    setShowAlert(false);
    // Call onSignIn if provided
    if (onSignIn) onSignIn();
    // Navigation is handled by context/user state in App
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-200 via-blue-100 to-blue-300 relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400 opacity-20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-400 opacity-20 rounded-full blur-3xl animate-pulse" />
      <div className="bg-white/90 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-blue-100 relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full p-4 mb-2 shadow-lg">
            <Shield size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sign In</h2>
          <p className="text-gray-500 text-sm">Welcome back! Please sign in to your account.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 text-blue-400" size={20} />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full pl-11 pr-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm"
                placeholder="you@email.com"
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full pl-3 pr-11 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm"
                placeholder="Password"
                autoComplete="off"
              />
              <button type="button" className="absolute right-3" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? <EyeOff size={20} className="text-blue-400" /> : <Eye size={20} className="text-blue-400" />}
              </button>
            </div>
          </div>
          {error && showAlert && (
            <div className="flex items-center gap-2 justify-center bg-red-100 border border-red-300 text-red-700 rounded-lg px-3 py-2 text-sm font-semibold animate-fadeIn shadow relative">
              <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 text-red-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z' /></svg>
              {error}
              <button onClick={() => setShowAlert(false)} className="ml-2 text-red-400 hover:text-red-600 focus:outline-none">×</button>
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg text-lg"
          >
            <LogIn size={22} /> Sign In
          </button>
        </form>
      </div>
    </div>
  );
} 