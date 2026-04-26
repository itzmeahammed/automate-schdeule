import React, { useState } from 'react';
import { UserPlus, Shield, UserCog, User, Eye, EyeOff, Mail, Lock, Cpu } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const roles = [
  { value: 'superadmin', label: 'Super Admin', icon: <Shield className="text-amber-500" size={16} /> },
  { value: 'admin', label: 'Admin', icon: <UserCog className="text-amber-500" size={16} /> },
  { value: 'operator', label: 'Operator', icon: <User className="text-amber-500" size={16} /> },
];

const roleDescriptions: Record<string, string> = {
  superadmin: 'Full system access with user management',
  admin: 'Manage production and master data',
  operator: 'View and update assigned tasks'
};

export default function SignUp({ onSignUp }: { onSignUp?: () => void }) {
  const { signUp } = useApp();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.email || !form.password) {
      setError('All fields are required.');
      setSuccess('');
      return;
    }
    
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setSuccess('');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use context signUp method
    const result = await signUp(form);
    
    setIsLoading(false);
    
    if (!result.success) {
      setError(result.message);
      setSuccess('');
      return;
    }
    
    setSuccess(result.message);
    setError('');
    
    // Auto-navigate after success
    setTimeout(() => {
      if (onSignUp) onSignUp();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden p-4">
      {/* Simple grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>

      <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-lg border border-slate-700 relative z-10">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-slate-700 rounded-xl p-3 mb-4">
            <Cpu size={40} className="text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Create Account</h1>
          <p className="text-slate-400 text-sm">Sign up for ManufacturingPro</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Name Field */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="text-slate-500" size={18} />
              </div>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-3 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 bg-slate-700/50 text-slate-100 placeholder:text-slate-500"
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            </div>
          </div>

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
            <p className="mt-1 text-xs text-slate-500">Minimum 6 characters required</p>
          </div>
          {/* Role Selection */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Your Role</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  disabled={isLoading}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                    form.role === r.value
                      ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                      : 'border-slate-700 bg-slate-700/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {r.icon}
                  <span className="text-xs font-medium">{r.label}</span>
                </button>
              ))}
            </div>
            
            {/* Role description */}
            <div className="mt-2 p-3 bg-slate-700/50 border border-slate-700 rounded-lg">
              <p className="text-xs text-slate-400">{roleDescriptions[form.role]}</p>
            </div>
          </div>
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-800 text-red-300 rounded-lg px-3 py-2.5 text-sm mt-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>{error}</span>
            </div>
          )}
          
          {/* Success Alert */}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-800 text-emerald-300 rounded-lg px-3 py-2.5 text-sm mt-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>{success}</span>
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
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 