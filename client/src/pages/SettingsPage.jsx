import React, { useState, useEffect } from 'react';
import { authApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Settings, 
  Users, 
  Shield, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  BookOpen, 
  Sliders
} from 'lucide-react';

export const SettingsPage = () => {
  const { settings, members, currentUser, refreshSettings } = useAuth();

  const [className, setClassName] = useState('');
  const [institution, setInstitution] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [activeSemester, setActiveSemester] = useState('S1');
  const [memberList, setMemberList] = useState(['', '', '', '', '', '']);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (settings) {
      setClassName(settings.className || 'MTech Class Hub');
      setInstitution(settings.institution || 'Saintgits College of Engineering');
      setAccessCode(settings.accessCode || 'MTECH2026');
      setAcademicYear(settings.academicYear || '2026–2027');
      setActiveSemester(settings.activeSemester || 'S1');
    }
    if (members && members.length === 6) {
      setMemberList(members);
    }
  }, [settings, members]);

  const handleMemberChange = (index, value) => {
    const updated = [...memberList];
    updated[index] = value;
    setMemberList(updated);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const cleanedMembers = memberList.map((m, i) => m.trim() || `Student ${i + 1}`);

      await authApi.updateSettings({
        className,
        institution,
        accessCode,
        academicYear,
        activeSemester,
        members: cleanedMembers
      });

      await refreshSettings();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-indigo-400" />
          <span>Class Workspace Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure class metadata, edit the 6 predefined classmates, access password, and AI study engine preferences.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-700 rounded-2xl flex items-center gap-3 text-xs text-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>Settings saved successfully. All changes are synchronized with your 6 classmates.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-700 rounded-2xl flex items-center gap-3 text-xs text-red-200">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Predefined 6 Classmates (Section 2 Requirement) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Predefined Class Members (6 Scholars)</h2>
            </div>
            <span className="text-[11px] text-slate-400">Equal Contribution Permissions</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The workspace identifies uploads and contributions using these 6 names. You can rename any member below:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {memberList.map((m, i) => (
              <div key={i} className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">
                  Student {i + 1}
                </label>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 flex items-center justify-center text-xs font-bold font-mono">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={m}
                    onChange={(e) => handleMemberChange(i, e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    placeholder={`Student ${i + 1}`}
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: General Class Configuration */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">Class & Academic Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Class Workspace Name</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Institution / Department</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Active Semester on Dashboard</label>
              <select
                value={activeSemester}
                onChange={(e) => setActiveSemester(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="S1">Semester 1 (S1)</option>
                <option value="S2">Semester 2 (S2)</option>
                <option value="S3">Semester 3 (S3)</option>
                <option value="S4">Semester 4 (S4)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Access Control */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Private Access Password</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Shared Class Access Code</label>
            <div className="relative max-w-sm">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Shared among the 6 classmates to prevent outsiders from contributing to your Saintgits class drive.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xl shadow-indigo-950 transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-105"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
