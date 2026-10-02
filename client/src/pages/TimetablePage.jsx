import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { timetableApi } from '../services/api.js';
import { 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  Layers, 
  Sparkles, 
  FlaskConical, 
  GraduationCap, 
  ArrowRight,
  CheckCircle,
  Coffee,
  Info,
  Printer,
  ChevronRight,
  ExternalLink,
  Flame,
  Radio,
  X
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Period time definitions in minutes from midnight for live tracker
const PERIOD_TIME_RANGES = [
  { period: 1, start: 9 * 60, end: 10 * 60, timeStr: '9:00 AM - 10:00 AM' },
  { period: 2, start: 10 * 60 + 5, end: 11 * 60 + 5, timeStr: '10:05 AM - 11:05 AM' },
  { period: 3, start: 11 * 60 + 15, end: 12 * 60 + 15, timeStr: '11:15 AM - 12:15 PM' },
  { isBreak: true, start: 12 * 60 + 15, end: 13 * 60 + 15, timeStr: '12:15 PM - 1:15 PM' },
  { period: 4, start: 13 * 60 + 15, end: 14 * 60 + 15, timeStr: '1:15 PM - 2:15 PM' },
  { period: 5, start: 14 * 60 + 20, end: 15 * 60 + 20, timeStr: '2:20 PM - 3:20 PM' },
  { period: 6, start: 15 * 60 + 30, end: 16 * 60 + 30, timeStr: '3:30 PM - 4:30 PM' },
];

export const TimetablePage = () => {
  const navigate = useNavigate();
  const [timetableData, setTimetableData] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'matrix'
  const [loading, setLoading] = useState(true);
  const [highlightedSlot, setHighlightedSlot] = useState(null);
  const [selectedCourseModal, setSelectedCourseModal] = useState(null);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const res = await timetableApi.getTimetable();
        if (res.data && res.data.timetable) {
          setTimetableData(res.data.timetable);
          if (res.data.activeDay && DAYS.includes(res.data.activeDay)) {
            setSelectedDay(res.data.activeDay);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();

    // Update current time clock every 30s
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  if (loading || !timetableData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-900/60 rounded-xl w-1/3" />
        <div className="h-64 bg-slate-900/60 rounded-2xl" />
      </div>
    );
  }

  const { programme, institution, academicYear, semester, wef, track, periods, courses, schedule } = timetableData;
  const currentDayClasses = schedule[selectedDay] || [];

  // Determine current active period if viewing today
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const isViewingToday = selectedDay === todayName;

  const getCurrentStatus = () => {
    if (!DAYS.includes(todayName)) {
      return { status: 'weekend', label: 'Weekend • Classes resume Monday at 09:00 AM' };
    }
    const mins = currentTimeMinutes;
    if (mins < 9 * 60) {
      return { status: 'before', label: `Classes begin at 09:00 AM • First session: Slot ${schedule[todayName]?.[0]?.slot || 'E'}` };
    }
    if (mins >= 16 * 60 + 30) {
      return { status: 'after', label: 'College hours ended for today • Have a productive evening' };
    }
    for (const r of PERIOD_TIME_RANGES) {
      if (mins >= r.start && mins < r.end) {
        if (r.isBreak) {
          const left = r.end - mins;
          return { status: 'break', label: `Lunch Break Interval (12:15 - 1:15 PM) • ${left} mins remaining` };
        }
        const todaySessions = schedule[todayName] || [];
        const session = todaySessions.find(s => s.period === r.period);
        if (session) {
          const left = r.end - mins;
          return {
            status: 'active',
            period: r.period,
            session,
            timeStr: r.timeStr,
            leftMinutes: left,
            label: `Live Session: Period ${r.period} (Slot ${session.slot}) • ${session.title} (${session.faculty}) • ${left}m left`
          };
        }
      }
    }
    // In passing period between classes
    return { status: 'passing', label: 'Short 5-10 min Class Transition' };
  };

  const liveStatus = getCurrentStatus();

  return (
    <div className="space-y-8 animate-in fade-in duration-200 print:bg-white print:text-black">
      {/* 1. Header Banner with Saintgits Timetable Info */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700/60 relative overflow-hidden print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-indigo-950/90 border border-indigo-700/80 text-indigo-300 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 print:bg-slate-100 print:text-slate-800">
                <GraduationCap className="w-3.5 h-3.5" />
                {institution}
              </span>
              <span className="px-2.5 py-1 bg-purple-950/80 border border-purple-800 text-purple-300 text-xs font-semibold rounded-xl print:bg-slate-100 print:text-slate-800">
                {semester} • {academicYear}
              </span>
              <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-medium rounded-xl print:bg-slate-100 print:text-slate-800">
                W.E.F: {wef}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight print:text-slate-900">
              Class Timetable ({track})
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 print:text-slate-600">
              {programme} — Consolidated Odd Semester Lecture & Lab Schedule with Faculty Attribution.
            </p>

            {/* Live Period Banner if weekday */}
            {liveStatus && (
              <div className="pt-2 flex items-center gap-2 text-xs">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${liveStatus.status === 'active' ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${liveStatus.status === 'active' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                </span>
                <span className="font-semibold text-slate-200">
                  {liveStatus.label}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 print:hidden">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Print Timetable"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'daily' ? 'matrix' : 'daily')}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-950/40"
            >
              {viewMode === 'daily' ? 'Switch to Full Week Matrix' : 'Switch to Day View'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Filter Chips by Slot */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs print:hidden">
        <span className="text-slate-400 font-semibold flex-shrink-0">Filter by Slot:</span>
        <button
          onClick={() => setHighlightedSlot(null)}
          className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
            !highlightedSlot 
              ? 'bg-indigo-600 text-white shadow' 
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          All
        </button>
        {courses.map(c => (
          <button
            key={c.slot}
            onClick={() => setHighlightedSlot(highlightedSlot === c.slot ? null : c.slot)}
            className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all flex items-center gap-1.5 ${
              highlightedSlot === c.slot
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white ring-2 ring-indigo-400 shadow'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <span>Slot {c.slot}</span>
            <span className="text-[10px] opacity-75 font-normal">({c.periodsPerWeek}p)</span>
          </button>
        ))}
      </div>

      {/* 3. Day Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-4 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          {DAYS.map((day) => {
            const isSelected = selectedDay === day && viewMode === 'daily';
            const isToday = day === todayName;
            return (
              <button
                key={day}
                onClick={() => {
                  setSelectedDay(day);
                  setViewMode('daily');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-950/50'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{day}</span>
                {isToday && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-950" title="Today" />
                )}
              </button>
            );
          })}

          <button
            onClick={() => setViewMode('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'matrix'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            <span>📊 Full Weekly Matrix</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Timing: <strong>09:00 AM – 04:30 PM</strong></span>
        </div>
      </div>

      {/* 4. Daily Schedule View */}
      {viewMode === 'daily' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <span>{selectedDay} Schedule</span>
              {isViewingToday && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-semibold">
                  Today
                </span>
              )}
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {currentDayClasses.filter(c => !c.isSpanChild && !c.isFree).length} Academic Sessions
            </span>
          </div>

          <div className="space-y-3">
            {/* Period 1 to 3 */}
            {currentDayClasses.slice(0, 3).map((item, idx) => {
              if (item.isSpanChild) return null;
              const isSlotHighlighted = highlightedSlot ? item.slot === highlightedSlot : true;
              const isPeriodLive = isViewingToday && liveStatus?.period === item.period;

              return (
                <div
                  key={idx}
                  className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                    isPeriodLive 
                      ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-950/40' 
                      : isSlotHighlighted 
                        ? 'border-slate-800 hover:border-indigo-500/40' 
                        : 'border-slate-800/40 opacity-40'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center flex-shrink-0 border ${
                      isPeriodLive 
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300' 
                        : 'bg-slate-900 border-slate-800 text-indigo-400'
                    }`}>
                      <span className="text-[10px] uppercase font-bold">P{item.period}</span>
                      <span className="text-[11px] font-mono font-bold text-white">{item.time?.split(' - ')[0]}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80 text-[11px] font-mono font-bold">
                          Slot {item.slot}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {item.courseCode}
                        </span>
                        {item.isLab && (
                          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-semibold flex items-center gap-1">
                            <FlaskConical className="w-3 h-3" /> Lab Practical
                          </span>
                        )}
                        {item.span && (
                          <span className="text-[10px] text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                            {item.note || `${item.span} Periods Block`}
                          </span>
                        )}
                        {isPeriodLive && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                            <Radio className="w-2.5 h-2.5 text-emerald-400" /> LIVE CLASS
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors mt-1.5 truncate">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        Faculty: <strong className="text-slate-200">{item.faculty}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 flex-shrink-0">
                    <button
                      onClick={() => setSelectedCourseModal(courses.find(c => c.slot === item.slot) || item)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-colors"
                    >
                      Details
                    </button>
                    <Link
                      to="/notes"
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>View Notes</span>
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* LUNCH BREAK BANNER */}
            <div className={`p-4 rounded-2xl flex items-center justify-between text-xs transition-all ${
              isViewingToday && liveStatus?.status === 'break'
                ? 'bg-amber-950/60 border-2 border-amber-500 text-amber-200 ring-2 ring-amber-500/30 shadow-lg'
                : 'bg-amber-950/30 border border-amber-800/50 text-amber-200'
            }`}>
              <div className="flex items-center gap-2.5 font-medium">
                <Coffee className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <span className="font-bold">BREAK HOURS (LUNCH INTERVAL)</span>
                  <span className="text-slate-400 font-mono ml-2">12:15 PM to 1:15 PM</span>
                </div>
              </div>
              <span className="font-mono text-[11px] text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                1 Hour Break
              </span>
            </div>

            {/* Afternoon Periods (4 to 6) */}
            {currentDayClasses.slice(3).map((item, idx) => {
              if (item.isSpanChild) return null;
              const isFree = item.isFree;
              const isSlotHighlighted = highlightedSlot ? (item.slot === highlightedSlot) : true;
              const isPeriodLive = isViewingToday && liveStatus?.period === item.period;

              return (
                <div
                  key={idx + 3}
                  className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                    isFree 
                      ? 'border-slate-800 bg-slate-950/40 opacity-70' 
                      : isPeriodLive 
                        ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-950/40' 
                        : isSlotHighlighted 
                          ? 'border-slate-800 hover:border-indigo-500/40' 
                          : 'border-slate-800/40 opacity-40'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center flex-shrink-0 border ${
                      isPeriodLive 
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300' 
                        : 'bg-slate-900 border-slate-800 text-indigo-400'
                    }`}>
                      <span className="text-[10px] uppercase font-bold">P{item.period}</span>
                      <span className="text-[11px] font-mono font-bold text-white">{item.time?.split(' - ')[0]}</span>
                    </div>

                    <div className="min-w-0">
                      {isFree ? (
                        <div>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-bold">
                            FREE HOUR
                          </span>
                          <h3 className="text-sm font-bold text-slate-300 mt-1">
                            Self Study / Library & Seminar Preparation
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">1:15 PM - 2:15 PM</p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80 text-[11px] font-mono font-bold">
                              Slot {item.slot}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              {item.courseCode}
                            </span>
                            {item.isLab && (
                              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-semibold flex items-center gap-1">
                                <FlaskConical className="w-3 h-3" /> Lab Session
                              </span>
                            )}
                            {item.span && (
                              <span className="text-[10px] text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                                {item.note || `${item.span} Periods Block`}
                              </span>
                            )}
                            {isPeriodLive && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                                <Radio className="w-2.5 h-2.5 text-emerald-400" /> LIVE CLASS
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors mt-1.5 truncate">
                            {item.title}
                          </h3>

                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-indigo-400" />
                            Faculty: <strong className="text-slate-200">{item.faculty}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {!isFree && (
                    <div className="flex items-center gap-2 sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 flex-shrink-0">
                      <button
                        onClick={() => setSelectedCourseModal(courses.find(c => c.slot === item.slot) || item)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-colors"
                      >
                        Details
                      </button>
                      <Link
                        to="/notes"
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>View Notes</span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 5. Full Weekly Matrix View */
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 overflow-x-auto custom-scrollbar space-y-4 print:border-slate-300 print:p-0">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2 print:text-black">
              <span>Full Weekly Matrix (S1 M.Tech CS)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Saintgits Autonomous Format • First Shift</span>
          </div>

          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 print:bg-slate-100 print:text-black">
                <th className="p-3 font-semibold">Week / Period</th>
                <th className="p-3 font-semibold text-center">1<br/><span className="text-[10px] text-slate-500 font-normal">9:00 - 10:00</span></th>
                <th className="p-3 font-semibold text-center">2<br/><span className="text-[10px] text-slate-500 font-normal">10:05 - 11:05</span></th>
                <th className="p-3 font-semibold text-center">3<br/><span className="text-[10px] text-slate-500 font-normal">11:15 - 12:15</span></th>
                <th className="p-3 font-semibold text-center bg-amber-950/20 text-amber-300 print:bg-amber-100 print:text-amber-900">
                  BREAK HOURS<br/><span className="text-[10px] text-amber-500 font-normal">12:15 - 1:15</span>
                </th>
                <th className="p-3 font-semibold text-center">4<br/><span className="text-[10px] text-slate-500 font-normal">1:15 - 2:15</span></th>
                <th className="p-3 font-semibold text-center">5<br/><span className="text-[10px] text-slate-500 font-normal">2:20 - 3:20</span></th>
                <th className="p-3 font-semibold text-center">6<br/><span className="text-[10px] text-slate-500 font-normal">3:30 - 4:30</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 print:divide-slate-300">
              {/* Monday */}
              <tr className={`hover:bg-slate-900/40 transition-colors ${todayName === 'Monday' ? 'bg-indigo-950/20' : ''}`}>
                <td className="p-3 font-bold text-white bg-slate-900/50 print:bg-slate-50 print:text-black">
                  <div className="flex items-center gap-1.5">
                    <span>Monday</span>
                    {todayName === 'Monday' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </div>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'E'))} className="w-full py-1.5 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold font-mono transition-all">
                    E
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'C'))} className="w-full py-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold font-mono transition-all">
                    C
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'D'))} className="w-full py-1.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 font-bold font-mono transition-all">
                    D
                  </button>
                </td>
                <td className="p-2 text-center bg-amber-950/20 text-amber-400 text-[11px] font-mono font-semibold">
                  BREAK
                </td>
                <td colSpan={2} className="p-2 text-center bg-emerald-950/40 border border-emerald-800/60 rounded">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'C'))} className="w-full text-center">
                    <span className="font-bold text-emerald-300 font-mono">C (L)</span>
                    <p className="text-[10px] text-emerald-400">Database Systems Lab</p>
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'F'))} className="w-full py-1.5 rounded bg-pink-950/80 hover:bg-pink-900 text-pink-300 font-bold font-mono transition-all">
                    F
                  </button>
                </td>
              </tr>

              {/* Tuesday */}
              <tr className={`hover:bg-slate-900/40 transition-colors ${todayName === 'Tuesday' ? 'bg-indigo-950/20' : ''}`}>
                <td className="p-3 font-bold text-white bg-slate-900/50 print:bg-slate-50 print:text-black">
                  <div className="flex items-center gap-1.5">
                    <span>Tuesday</span>
                    {todayName === 'Tuesday' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </div>
                </td>
                <td colSpan={2} className="p-2 text-center bg-cyan-950/40 border border-cyan-800/60 rounded">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'D'))} className="w-full text-center">
                    <span className="font-bold text-cyan-300 font-mono">D (L)</span>
                    <p className="text-[10px] text-cyan-400">Computing Systems Lab</p>
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'F'))} className="w-full py-1.5 rounded bg-pink-950/80 hover:bg-pink-900 text-pink-300 font-bold font-mono transition-all">
                    F
                  </button>
                </td>
                <td className="p-2 text-center bg-amber-950/20 text-amber-400 text-[11px] font-mono font-semibold">
                  BREAK
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'A'))} className="w-full py-1.5 rounded bg-purple-950/80 hover:bg-purple-900 text-purple-300 font-bold font-mono transition-all">
                    A
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'DI'))} className="w-full py-1.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 font-bold font-mono transition-all">
                    DI
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'A'))} className="w-full py-1.5 rounded bg-purple-950/80 hover:bg-purple-900 text-purple-300 font-bold font-mono transition-all">
                    A
                  </button>
                </td>
              </tr>

              {/* Wednesday */}
              <tr className={`hover:bg-slate-900/40 transition-colors ${todayName === 'Wednesday' ? 'bg-indigo-950/20' : ''}`}>
                <td className="p-3 font-bold text-white bg-slate-900/50 print:bg-slate-50 print:text-black">
                  <div className="flex items-center gap-1.5">
                    <span>Wednesday</span>
                    {todayName === 'Wednesday' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </div>
                </td>
                <td colSpan={3} className="p-2 text-center bg-indigo-950/50 border border-indigo-800/60 rounded">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'DI'))} className="w-full text-center">
                    <span className="font-bold text-indigo-300 font-mono text-sm">DI (Dissertation Ideation Block)</span>
                    <p className="text-[10px] text-indigo-400">9:00 AM - 12:15 PM (3 Periods)</p>
                  </button>
                </td>
                <td className="p-2 text-center bg-amber-950/20 text-amber-400 text-[11px] font-mono font-semibold">
                  BREAK
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'DI'))} className="w-full py-1.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 font-bold font-mono transition-all">
                    DI
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'E'))} className="w-full py-1.5 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold font-mono transition-all">
                    E
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'C'))} className="w-full py-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold font-mono transition-all">
                    C
                  </button>
                </td>
              </tr>

              {/* Thursday */}
              <tr className={`hover:bg-slate-900/40 transition-colors ${todayName === 'Thursday' ? 'bg-indigo-950/20' : ''}`}>
                <td className="p-3 font-bold text-white bg-slate-900/50 print:bg-slate-50 print:text-black">
                  <div className="flex items-center gap-1.5">
                    <span>Thursday</span>
                    {todayName === 'Thursday' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </div>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'B'))} className="w-full py-1.5 rounded bg-blue-950/80 hover:bg-blue-900 text-blue-300 font-bold font-mono transition-all">
                    B
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'F'))} className="w-full py-1.5 rounded bg-pink-950/80 hover:bg-pink-900 text-pink-300 font-bold font-mono transition-all">
                    F
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'A'))} className="w-full py-1.5 rounded bg-purple-950/80 hover:bg-purple-900 text-purple-300 font-bold font-mono transition-all">
                    A
                  </button>
                </td>
                <td className="p-2 text-center bg-amber-950/20 text-amber-400 text-[11px] font-mono font-semibold">
                  BREAK
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'D'))} className="w-full py-1.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 font-bold font-mono transition-all">
                    D
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'B'))} className="w-full py-1.5 rounded bg-blue-950/80 hover:bg-blue-900 text-blue-300 font-bold font-mono transition-all">
                    B
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'DI'))} className="w-full py-1.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 font-bold font-mono transition-all">
                    DI
                  </button>
                </td>
              </tr>

              {/* Friday */}
              <tr className={`hover:bg-slate-900/40 transition-colors ${todayName === 'Friday' ? 'bg-indigo-950/20' : ''}`}>
                <td className="p-3 font-bold text-white bg-slate-900/50 print:bg-slate-50 print:text-black">
                  <div className="flex items-center gap-1.5">
                    <span>Friday</span>
                    {todayName === 'Friday' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </div>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'A'))} className="w-full py-1.5 rounded bg-purple-950/80 hover:bg-purple-900 text-purple-300 font-bold font-mono transition-all">
                    A
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'E'))} className="w-full py-1.5 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold font-mono transition-all">
                    E
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'C'))} className="w-full py-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold font-mono transition-all">
                    C
                  </button>
                </td>
                <td className="p-2 text-center bg-amber-950/20 text-amber-400 text-[11px] font-mono font-semibold">
                  BREAK
                </td>
                <td className="p-2 text-center bg-slate-900/80 text-slate-400 font-mono text-[11px]">
                  FREE HOUR
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'D'))} className="w-full py-1.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 font-bold font-mono transition-all">
                    D
                  </button>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => setSelectedCourseModal(courses.find(c => c.slot === 'B'))} className="w-full py-1.5 rounded bg-blue-950/80 hover:bg-blue-900 text-blue-300 font-bold font-mono transition-all">
                    B
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 6. Course Slot, Faculty & Hours Reference Table (Exact Match to Image Table) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4 print:border-slate-300 print:p-0">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white print:text-black">
              Course Code, Faculty & Exam Slot Mapping
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Saintgits S1 Official Allotment (30 Periods/Week)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c) => (
            <div
              key={c.slot}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                highlightedSlot === c.slot 
                  ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/40' 
                  : 'bg-slate-900/70 border-slate-800'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-mono font-bold">
                      Slot {c.slot}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">{c.code}</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800 rounded-lg text-slate-300 font-mono">
                    {c.periodsPerWeek} periods/wk
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-1">
                  {c.name}
                </h3>

                {/* Electives Breakdown for Slot F if present */}
                {c.electives && c.electives.length > 0 ? (
                  <div className="pt-2 space-y-2 border-t border-slate-800/80">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                      Elective Options:
                    </p>
                    {c.electives.map((el, i) => (
                      <div key={i} className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-pink-300 text-[11px]">{el.code}</span>
                          <span className="text-slate-400 text-[11px]">{el.faculty}</span>
                        </div>
                        <p className="text-slate-200 font-medium text-xs">{el.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Faculty: <strong className="text-slate-200">{c.faculty}</strong></span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <Link
                  to="/notes"
                  className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Module Notes</span>
                </Link>
                <button
                  onClick={() => {
                    setHighlightedSlot(highlightedSlot === c.slot ? null : c.slot);
                    setViewMode('matrix');
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Highlight in Grid →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Course Detail Quick Modal */}
      {selectedCourseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-slate-700 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-mono font-bold">
                  Slot {selectedCourseModal.slot}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">
                  {selectedCourseModal.name || selectedCourseModal.title}
                </h3>
                <p className="text-xs font-mono text-slate-400">
                  Course Code: {selectedCourseModal.code || selectedCourseModal.courseCode}
                </p>
              </div>
              <button
                onClick={() => setSelectedCourseModal(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Faculty In-Charge:</span>
                <span className="font-bold text-white">{selectedCourseModal.faculty}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Periods / Week:</span>
                <span className="font-mono text-indigo-400 font-bold">{selectedCourseModal.periodsPerWeek || 3} periods</span>
              </div>
            </div>

            {selectedCourseModal.electives && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Offered Elective Options:
                </h4>
                {selectedCourseModal.electives.map((el, i) => (
                  <div key={i} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-pink-300 font-mono">{el.code}</span>
                      <span className="text-slate-400">{el.faculty}</span>
                    </div>
                    <p className="text-slate-200">{el.name}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedCourseModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              <Link
                to="/notes"
                onClick={() => setSelectedCourseModal(null)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Go to Notes</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
