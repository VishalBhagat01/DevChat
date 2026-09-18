import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';
import { sounds } from '../utils/soundEffects';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data } = await axios.post('/users/login', formData);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      sounds.playChime();
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Invalid email or password.'
      );
      sounds.playError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#09090b] px-6 text-[#f4f4f5] selection:bg-blue-500/30 selection:text-blue-200">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[450px] w-[600px] rounded-full bg-blue-500/[0.04] blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111116] p-8 shadow-2xl shadow-black/80">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 ring-1 ring-white/10">
            <i className="ri-code-box-fill text-2xl"></i>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Welcome back to DevChat
          </h1>
          <p className="mt-2 text-xs text-neutral-400">
            Sign in to continue to your collaborative AI cloud workspace
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-300">
            <i className="ri-error-warning-line text-sm text-rose-400"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={submitHandler} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center">
              <i className="ri-mail-line absolute left-3.5 text-neutral-500 text-sm"></i>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.com"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-blue-500 focus:bg-white/[0.04] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <i className="ri-lock-line absolute left-3.5 text-neutral-500 text-sm"></i>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-blue-500 focus:bg-white/[0.04] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-neutral-500 hover:text-neutral-300"
              >
                <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-950/40 hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="ri-loader-4-line animate-spin text-sm"></i>
                Signing in...
              </span>
            ) : (
              'Sign In to DevChat'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-neutral-500">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            Create one for free
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;