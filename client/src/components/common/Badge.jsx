import React from 'react';

export const UrgencyBadge = ({ urgency, text }) => {
  let classes = 'badge-normal';
  let label = text || 'Normal';

  if (urgency === 'critical') {
    classes = 'badge-critical';
    label = text || 'Due Today';
  } else if (urgency === 'urgent') {
    classes = 'badge-urgent';
    label = text || 'Urgent';
  } else if (urgency === 'warning') {
    classes = 'badge-warning';
    label = text || 'Upcoming';
  } else if (urgency === 'expired') {
    classes = 'badge-expired';
    label = text || 'Expired';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide border ${classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        urgency === 'critical' ? 'bg-red-400 animate-pulse' :
        urgency === 'urgent' ? 'bg-amber-400' :
        urgency === 'warning' ? 'bg-yellow-400' :
        urgency === 'expired' ? 'bg-slate-400' : 'bg-blue-400'
      }`} />
      {label}
    </span>
  );
};

export const CategoryBadge = ({ category }) => {
  const cat = (category || '').toLowerCase();
  let color = 'bg-slate-800 text-slate-300 border-slate-700';

  if (cat.includes('syllabus')) {
    color = 'bg-teal-950/80 text-teal-300 border-teal-700/70 shadow-sm';
  } else if (cat.includes('notes')) {
    color = 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60';
  } else if (cat.includes('ppt') || cat.includes('presentation')) {
    color = 'bg-purple-950/70 text-purple-300 border-purple-800/60';
  } else if (cat.includes('question') || cat.includes('bank') || cat.includes('paper')) {
    color = 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60';
  } else if (cat.includes('important')) {
    color = 'bg-amber-950/70 text-amber-300 border-amber-800/60';
  } else if (cat.includes('reference')) {
    color = 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60';
  } else if (cat.includes('assignment')) {
    color = 'bg-rose-950/70 text-rose-300 border-rose-800/60';
  }

  const displayText = category === 'Question Paper' ? 'Question Bank' : category;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase border ${color}`}>
      {displayText}
    </span>
  );
};
