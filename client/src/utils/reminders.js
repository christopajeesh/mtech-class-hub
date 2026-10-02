/**
 * Assignment Reminder Utilities for M.Tech Class Hub
 * Provides 1-Click Google Calendar, iCal (.ics) download, WhatsApp share, and clipboard copy.
 */

// Helper to pad numbers
const pad = (n) => String(n).padStart(2, '0');

// Helper to format Date to UTC compact string YYYYMMDDTHHmmssZ
const formatToCalendarIso = (date) => {
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
};

/**
 * Generate a 1-click Google Calendar add link with pre-filled due date and reminders
 */
export const getGoogleCalendarUrl = (assignment) => {
  if (!assignment) return '#';

  const title = `[M.Tech S1 Due] ${assignment.title} (${assignment.subjectName || 'Coursework'})`;
  const details = [
    `📚 Subject: ${assignment.subjectName || 'M.Tech S1 Course'}`,
    `📖 Module: ${assignment.moduleNumber || 1}`,
    `⏰ Submission Due: ${assignment.dueDate} at ${assignment.dueTime || '23:59'}`,
    assignment.description ? `📝 Instructions: ${assignment.description}` : '',
    `👤 Shared by: ${assignment.createdBy || 'Classmate'} via M.Tech Hub`
  ].filter(Boolean).join('\n\n');

  // Parse dueDate (YYYY-MM-DD) and dueTime (HH:mm)
  const timePart = assignment.dueTime || '23:59';
  const [hours, minutes] = timePart.split(':').map(Number);
  const [year, month, day] = assignment.dueDate.split('-').map(Number);

  const dueDateTime = new Date(year, month - 1, day, hours, minutes);
  const startDateTime = new Date(dueDateTime.getTime() - 60 * 60 * 1000); // 1 hr block

  const datesParam = `${formatToCalendarIso(startDateTime)}/${formatToCalendarIso(dueDateTime)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&dates=${datesParam}`;
};

/**
 * Generate and trigger download of an .ics calendar file with alarm notifications
 */
export const downloadIcsCalendar = (assignment) => {
  if (!assignment) return;

  const timePart = assignment.dueTime || '23:59';
  const [hours, minutes] = timePart.split(':').map(Number);
  const [year, month, day] = assignment.dueDate.split('-').map(Number);

  const dueDateTime = new Date(year, month - 1, day, hours, minutes);
  const startDateTime = new Date(dueDateTime.getTime() - 60 * 60 * 1000);
  const nowIso = formatToCalendarIso(new Date());

  const cleanTitle = (assignment.title || 'Assignment').replace(/[,;]/g, ' ');
  const cleanSubject = (assignment.subjectName || 'M.Tech S1').replace(/[,;]/g, ' ');
  const cleanDescription = (assignment.description || 'Submission deadline').replace(/\r?\n/g, '\\n');

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MTech Class Hub//Assignment Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:asg-${assignment.id || Date.now()}@mtechhub.local`,
    `DTSTAMP:${nowIso}`,
    `DTSTART:${formatToCalendarIso(startDateTime)}`,
    `DTEND:${formatToCalendarIso(dueDateTime)}`,
    `SUMMARY:[M.Tech Due] ${cleanTitle} (${cleanSubject})`,
    `DESCRIPTION:Module ${assignment.moduleNumber || 1}\\nDue: ${assignment.dueDate} ${timePart}\\n${cleanDescription}\\nCreated by ${assignment.createdBy}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: M.Tech Assignment Due Tomorrow!',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: M.Tech Assignment Due in 2 Hours!',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `${cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_reminder.ics`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Format a WhatsApp reminder message and launch WhatsApp web / mobile
 */
export const shareAssignmentWhatsApp = (assignment) => {
  if (!assignment) return;

  const text = [
    `🚨 *M.Tech S1 Assignment Reminder* 🚨`,
    ``,
    `📌 *Subject:* ${assignment.subjectName || 'Coursework'}`,
    `📝 *Title:* ${assignment.title}`,
    `📖 *Module:* Module ${assignment.moduleNumber || 1}`,
    `⏰ *Due Date:* ${assignment.dueDate} at ${assignment.dueTime || '23:59'}`,
    assignment.description ? `💡 *Notes:* ${assignment.description}` : '',
    ``,
    `👤 *Posted by:* ${assignment.createdBy || 'Classmate'} via M.Tech Hub`
  ].filter(Boolean).join('\n');

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Copy formatted reminder text to clipboard
 */
export const copyAssignmentReminderText = async (assignment) => {
  if (!assignment) return false;

  const text = [
    `🚨 M.Tech S1 Assignment Reminder`,
    `Subject: ${assignment.subjectName || 'Coursework'}`,
    `Topic: ${assignment.title} (Module ${assignment.moduleNumber || 1})`,
    `Due: ${assignment.dueDate} at ${assignment.dueTime || '23:59'}`,
    assignment.description ? `Notes: ${assignment.description}` : '',
    `Posted by: ${assignment.createdBy || 'Classmate'} via M.Tech Hub`
  ].filter(Boolean).join('\n');

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.error('Clipboard copy failed', e);
    return false;
  }
};
