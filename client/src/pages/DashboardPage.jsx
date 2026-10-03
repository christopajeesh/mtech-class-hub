import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useUIModal } from '../components/layout/Layout.jsx';
import { CategoryBadge } from '../components/common/Badge.jsx';
import { 
  BookOpen, 
  Clock, 
  FileText, 
  Upload, 
  ArrowRight,
  User,
  AlertTriangle,
  FolderPlus,
  GraduationCap,
  Bell
} from 'lucide-react';
import { ReminderDropdown } from '../components/common/ReminderDropdown.jsx';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser, settings } = useAuth();
  const { openUploadModal, openPreview } = useUIModal();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getStats();
      setStats(res.data);
    } catch (err) {
      console.error(err);
      setError('Unable to connect to the class workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const handleUpdate = () => loadDashboardData();
    window.addEventListener('class_hub_data_updated', handleUpdate);
    return () => window.removeEventListener('class_hub_data_updated', handleUpdate);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning 👋';
    if (hour < 17) return 'Good Afternoon 👋';
    return 'Good Evening 👋';
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-900/60 rounded-2xl w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-900/60 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-900/60 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800 rounded-2xl text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
        <h3 className="text-base font-semibold text-white">{error}</h3>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const { activeSemester, recentUploads = [], currentSubjects = [], dueSoon = [] } = stats || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Simple Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-mono text-[11px] font-bold">
              Semester 1 • CS 2026-2028
            </span>
            <span className="text-xs text-slate-400">
              Saintgits College of Engineering
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            {getGreeting()}, {currentUser}
          </h1>
        </div>

        <button
          onClick={() => openUploadModal({ semesterId: activeSemester?.id || 'S1' })}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all self-start sm:self-auto hover:scale-105"
        >
          <Upload className="w-4 h-4" />
          <span>+ Upload Material</span>
        </button>
      </div>

      {/* Due Soon Assignment Reminders Alert (if any) */}
      {dueSoon && dueSoon.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/40 bg-amber-950/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Bell className="w-4 h-4 animate-pulse" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Assignment Reminders</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                    {dueSoon.length} Due Soon
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Upcoming deadlines within 7 days. Remind the class on WhatsApp or add to calendar.
                </p>
              </div>
            </div>
            <Link
              to="/assignments"
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {dueSoon.map((asg) => (
              <div
                key={asg.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                      {asg.subjectName || 'S1'}
                    </span>
                    <span className="text-[10px] text-amber-400 font-medium">
                      {asg.remainingText || `Due ${asg.dueDate}`}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate mt-1">
                    {asg.title}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Due: {asg.dueDate} at {asg.dueTime || '23:59'}
                  </p>
                </div>
                <ReminderDropdown assignment={asg} compact={true} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* S1 Course Subjects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Semester 1 Subjects</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {currentSubjects.length} Courses
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentSubjects.map((sub) => {
            const isDI = sub.code === 'DI' || sub.slot === 'DI' || sub.id === 'subj-di';
            return (
              <div
                key={sub.id}
                onClick={() => navigate(`/subjects/${sub.id}`)}
                className={`glass-panel glass-panel-hover p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group space-y-3 ${
                  isDI ? 'border-indigo-600/50 bg-indigo-950/20' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isDI ? 'bg-indigo-900/80 border-indigo-600 text-indigo-200' : 'bg-indigo-950 text-indigo-300 border-indigo-800/60'
                    }`}>
                      Slot {sub.slot} • {sub.code}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {isDI ? 'Assignments Only' : `${sub.filesCount || 0} Files`}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                    {sub.name}
                  </h3>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>Faculty: <strong className="text-slate-200">{sub.faculty}</strong></span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(isDI ? `/subjects/${sub.id}?tab=assignments` : `/subjects/${sub.id}?tab=syllabus`);
                    }}
                    className="text-[11px] text-slate-400 hover:text-indigo-300 transition-colors underline-offset-2 hover:underline cursor-pointer"
                    title={isDI ? "Open Research & Milestones" : "Open Syllabus Directly"}
                  >
                    {isDI ? 'Research & Milestones' : 'Syllabus & Course Notes'}
                  </span>
                  <span className="text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 font-medium text-xs">
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
