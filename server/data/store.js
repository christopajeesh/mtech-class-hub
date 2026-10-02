import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialData } from './initialData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'store.json');

// Initialize store if missing or invalid
export function getStore() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      saveStore(initialData);
      return initialData;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading store.json, resetting to initialData:', err);
    saveStore(initialData);
    return initialData;
  }
}

export function saveStore(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing to store.json:', err);
    return false;
  }
}

// Compute assignment status and urgency dynamically based on current local time
// Current reference date: user provided 2026-10-02T14:12:34+05:30
export function computeAssignmentMeta(assignment, referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  const dueDateTimeStr = assignment.dueTime 
    ? `${assignment.dueDate}T${assignment.dueTime}:00`
    : `${assignment.dueDate}T23:59:59`;
  
  const dueDateObj = new Date(dueDateTimeStr);
  const diffMs = dueDateObj.getTime() - ref.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isExpired = diffMs < 0;

  // Urgency logic:
  // > 7 days -> normal
  // 3-7 days -> warning
  // 1-2 days -> urgent
  // Due today (diffHours <= 24 && diffMs >= 0) -> critical
  let urgency = 'normal';
  let status = 'upcoming';

  if (isExpired) {
    status = 'expired';
    urgency = 'expired';
  } else if (diffHours <= 24) {
    status = 'due-today';
    urgency = 'critical';
  } else if (diffDays <= 2) {
    status = 'due-soon';
    urgency = 'urgent';
  } else if (diffDays <= 7) {
    status = 'due-soon';
    urgency = 'warning';
  } else {
    status = 'upcoming';
    urgency = 'normal';
  }

  // Days left formatted string
  let remainingText = '';
  if (isExpired) {
    remainingText = 'Expired';
  } else if (diffHours <= 24) {
    remainingText = diffHours <= 1 ? 'Due in less than an hour' : `Due in ${Math.round(diffHours)} hours`;
  } else if (diffDays === 1) {
    remainingText = '1 day left';
  } else {
    remainingText = `${diffDays} days left`;
  }

  return {
    ...assignment,
    isExpired,
    urgency,
    status,
    remainingText,
    diffDays,
    diffHours: Math.round(diffHours)
  };
}
