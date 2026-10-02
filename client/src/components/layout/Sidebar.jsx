import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Calendar,
  CheckSquare, 
  FileText, 
  Files, 
  Megaphone, 
  Search, 
  Clock, 
  Settings,
  GraduationCap,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { UserAvatar } from '../common/UserAvatar.jsx';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/notes', label: 'Notes & Files', icon: FileText },
  { path: '/semesters', label: 'Subjects', icon: BookOpen },
  { path: '/assignments', label: 'Assignments', icon: CheckSquare },
  { path: '/announcements', label: 'Announcements', icon: Megaphone },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { settings, currentUser, profilePic, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 glass-panel border-r border-slate-800/80 bg-[#090D16]/95 backdrop-blur-xl flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo Header */}
        <div className="p-5 border-b border-slate-800/70 flex items-center justify-between">
          <NavLink to="/" onClick={onClose} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-950/80 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                MTech Class Hub
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Saintgits College • CS
              </p>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Semester Indicator */}
        <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-200">
              Semester: {settings.activeSemester || 'S1'}
            </span>
          </div>
          <span className="text-[10px] text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60 font-mono">
            {settings.academicYear || '2026–27'}
          </span>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white border border-indigo-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Contributor Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <UserAvatar user={currentUser} src={profilePic} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">
                {currentUser}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                M.Tech Class Member
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                onClose?.();
              }}
              title="Log Out of Class Hub"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
