import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { GraduationCap, Lock, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export const AccessGate = () => {
  const { login, members, settings } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [selectedMember, setSelectedMember] = useState(members[0] || 'Christo');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setError('Please enter the class access code');
      return;
    }
    setLoading(true);
    setError('');

    const res = await login(accessCode.trim(), selectedMember);
    if (!res.success) {
      setError(res.message || 'Incorrect access code. Try 2628');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Logo and College Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-900/50 mb-4 ring-1 ring-white/20">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            MTech Class Hub
          </h1>
          <p className="text-xs text-indigo-400 font-medium mt-1">
            Saintgits College of Engineering, Kerala
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Private Academic Workspace for 6 Computer Science Scholars
          </p>
        </div>

        {/* Access Form Card */}
        <div className="glass-panel border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Lock className="w-4 h-4 text-indigo-400" />
              Private Class Verification
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-300 font-mono">
              S1 • 2026–2027
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Classmate Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                1. Select Your Name
              </label>
              <div className="grid grid-cols-2 gap-2">
                {members.map((member) => (
                  <button
                    key={member}
                    type="button"
                    onClick={() => setSelectedMember(member)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-left transition-all flex items-center gap-2 ${
                      selectedMember === member
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      selectedMember === member ? 'bg-indigo-400 ring-2 ring-indigo-400/40' : 'bg-slate-600'
                    }`} />
                    <span className="truncate">{member}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Access Code Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  2. Class Access Code
                </label>
                <span className="text-[11px] text-slate-500">
                  Hint: 2628
                </span>
              </div>
              <input
                type="password"
                placeholder="Enter shared class access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm shadow-xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : `Enter as ${selectedMember}`}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Guarantee Footer */}
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Equal contribution workspace for Saintgits M.Tech scholars</span>
          </div>
        </div>
      </div>
    </div>
  );
};
