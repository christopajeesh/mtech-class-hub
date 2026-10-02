import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Calendar, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { 
  getGoogleCalendarUrl, 
  downloadIcsCalendar, 
  shareAssignmentWhatsApp, 
  copyAssignmentReminderText 
} from '../../utils/reminders.js';

export const ReminderDropdown = ({ assignment, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCopy = async () => {
    const success = await copyAssignmentReminderText(assignment);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Set Reminder / Share Deadline"
        className={`inline-flex items-center gap-1.5 rounded-xl font-medium transition-all ${
          compact
            ? 'p-1.5 text-xs text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60'
            : 'px-3 py-1.5 text-xs text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 shadow-sm'
        }`}
      >
        <Bell className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className={compact ? 'hidden sm:inline' : ''}>Remind & Share</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 glass-dropdown rounded-2xl p-2 z-50 shadow-2xl border border-slate-700/80 animate-in fade-in zoom-in-95">
          <div className="px-3 py-2 border-b border-slate-800">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Assignment Reminders
            </p>
            <p className="text-xs font-bold text-white truncate mt-0.5">
              {assignment.title}
            </p>
            <p className="text-[10px] text-amber-400 font-mono mt-0.5">
              Due: {assignment.dueDate} • {assignment.dueTime || '23:59'}
            </p>
          </div>

          <div className="py-1.5 space-y-1">
            {/* 1. WhatsApp Share */}
            <button
              type="button"
              onClick={() => {
                shareAssignmentWhatsApp(assignment);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between text-emerald-300 hover:bg-emerald-950/40 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Share on WhatsApp</span>
              </div>
              <span className="text-[10px] text-emerald-400/70 font-mono">Class Group</span>
            </button>

            {/* 2. Google Calendar */}
            <a
              href={getGoogleCalendarUrl(assignment)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between text-indigo-300 hover:bg-indigo-950/40 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Google Calendar</span>
              </div>
              <ExternalLink className="w-3 h-3 text-indigo-400/60" />
            </a>

            {/* 3. Apple / Outlook .ics Download */}
            <button
              type="button"
              onClick={() => {
                downloadIcsCalendar(assignment);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between text-purple-300 hover:bg-purple-950/40 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Apple / Outlook (.ics)</span>
              </div>
              <span className="text-[10px] text-purple-400/70 font-mono">Auto Alert</span>
            </button>

            {/* 4. Copy Text */}
            <button
              type="button"
              onClick={handleCopy}
              className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between text-slate-300 hover:bg-slate-800/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
