import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';
import { sounds } from '../utils/soundEffects';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await axios.post('/users/register', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      sounds.playChime();
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMsg(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Registration failed. Please check your credentials.'
      );
      sounds.playError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#07070a] px-6 text-[#f4f4f5] selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[450px] w-[600px] rounded-full bg-gradient-to-b from-indigo-500/15 via-purple-500/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 h-[350px] w-[350px] rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0e0e16]/90 p-8 shadow-2xl shadow-black/80 backdrop-blur-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20">
            <i className="ri-user-add-fill text-2xl"></i>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Create your account
          </h1>
          <p className="mt-2 text-xs text-neutral-400">
            Start building and pair programming with DevChat Copilot
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
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="name@company.com"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-indigo-500 focus:bg-white/[0.04] transition-all"
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
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-indigo-500 focus:bg-white/[0.04] transition-all"
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
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-3 text-xs font-semibold text-white shadow-xl shadow-indigo-950/50 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="ri-loader-4-line animate-spin text-sm"></i>
                Creating account...
              </span>
            ) : (
              'Create Free Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-neutral-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;