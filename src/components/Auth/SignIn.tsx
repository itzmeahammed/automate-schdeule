import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, Mail, Lock, Cpu } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useApp();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = await signIn(form.email, form.password);
    
    setIsLoading(false);
    
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden p-4">
      {/* Simple grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>

      <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-md border border-slate-700 relative z-10">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-slate-700 rounded-xl p-3 mb-4">
            <Cpu size={40} className="text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Welcome Back</h1>
          <p className="text-slate-400 text-sm">Sign in to your account</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="text-slate-500" size={18} />
              </div>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-3 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 bg-slate-700/50 text-slate-100 placeholder:text-slate-500"
                placeholder="you@company.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="text-slate-500" size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-3 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 bg-slate-700/50 text-slate-100 placeholder:text-slate-500"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <button 
                type="button" 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-amber-500" 
                onClick={() => setShowPassword(v => !v)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {/* Error Alert */}
          {error && showAlert && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-800 text-red-300 rounded-lg px-3 py-2.5 text-sm mt-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>{error}</span>
              <button 
                onClick={() => setShowAlert(false)} 
                className="ml-auto text-red-400 hover:text-red-300 font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-900 font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 