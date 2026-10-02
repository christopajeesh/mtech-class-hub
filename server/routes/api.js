import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getStore, saveStore, computeAssignmentMeta } from '../data/store.js';
import { processAIStudyQuery } from '../services/aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer disk storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit per file
});

const router = express.Router();

// -------------------------------------------------------------
// 1. AUTH & CLASS ACCESS
// -------------------------------------------------------------
router.post('/auth/verify', (req, res) => {
  const { accessCode, selectedUser } = req.body;
  const store = getStore();

  if (accessCode !== store.settings.accessCode) {
    return res.status(401).json({ success: false, message: 'Invalid class access code' });
  }

  return res.json({
    success: true,
    user: selectedUser || store.settings.members[0],
    members: store.settings.members,
    settings: {
      className: store.settings.className,
      institution: store.settings.institution,
      activeSemester: store.settings.activeSemester,
      academicYear: store.settings.academicYear
    }
  });
});

// -------------------------------------------------------------
// 2. DASHBOARD STATS & DUE SOON
// -------------------------------------------------------------
router.get('/stats', (req, res) => {
  const store = getStore();
  const now = new Date();
  
  const activeSemester = store.semesters.find(s => s.isActive) || store.semesters[0];
  const activeSemesterId = activeSemester ? activeSemester.id : 'S1';

  // Compute all assignments with status
  const computedAssignments = (store.assignments || []).map(a => computeAssignmentMeta(a, now));

  // DUE SOON & UPCOMING: STRICTLY EXCLUDE EXPIRED ASSIGNMENTS!
  // Urgency logic:
  // Active assignments are those where !isExpired
  const activeAssignments = computedAssignments.filter(a => !a.isExpired);
  
  // Due soon: diffDays <= 7 && !isExpired, sorted by remaining time
  const dueSoon = activeAssignments
    .filter(a => a.diffDays <= 7)
    .sort((a, b) => a.diffHours - b.diffHours);

  // Files count for current semester & total question papers
  const semesterFiles = (store.files || []).filter(f => f.semesterId === activeSemesterId);
  const questionPapers = (store.files || []).filter(f => f.category === 'Question Paper');

  // Recent uploads (latest 6 files)
  const recentUploads = [...(store.files || [])]
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 8);

  // Pinned & recent announcements
  const announcements = [...(store.announcements || [])]
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Current semester subjects with file counts
  const currentSubjects = (store.subjects || [])
    .filter(s => s.semesterId === activeSemesterId)
    .map(sub => {
      const filesCount = (store.files || []).filter(f => f.subjectId === sub.id).length;
      return { ...sub, filesCount };
    });

  // Calculate Today's Timetable Schedule
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[now.getDay()];
  const activeDay = (dayName === 'Saturday' || dayName === 'Sunday') ? 'Monday' : dayName;
  const todaySchedule = store.timetable?.schedule?.[activeDay] || [];

  res.json({
    activeSemester,
    stats: {
      activeAssignmentsCount: activeAssignments.length,
      recentUploadsCount: (store.files || []).length,
      questionPapersCount: questionPapers.length,
      currentSemesterFilesCount: semesterFiles.length
    },
    dueSoon,
    recentUploads,
    announcements,
    currentSubjects,
    todaySchedule: {
      dayName: activeDay,
      isWeekend: dayName === 'Saturday' || dayName === 'Sunday',
      actualDay: dayName,
      classes: todaySchedule.filter(c => !c.isSpanChild)
    }
  });
});

// -------------------------------------------------------------
// TIMETABLE ENDPOINT (Saintgits S1 Timetable)
// -------------------------------------------------------------
router.get('/timetable', (req, res) => {
  const store = getStore();
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[now.getDay()];

  res.json({
    timetable: store.timetable || null,
    currentDay: dayName,
    activeDay: (dayName === 'Saturday' || dayName === 'Sunday') ? 'Monday' : dayName,
    isWeekend: dayName === 'Saturday' || dayName === 'Sunday'
  });
});

// -------------------------------------------------------------
// 3. SEMESTERS
// -------------------------------------------------------------
router.get('/semesters', (req, res) => {
  const store = getStore();
  const semestersWithCount = (store.semesters || []).map(sem => {
    const subjects = (store.subjects || []).filter(s => s.semesterId === sem.id);
    const files = (store.files || []).filter(f => f.semesterId === sem.id);
    return {
      ...sem,
      subjectCount: subjects.length,
      fileCount: files.length
    };
  });
  res.json(semestersWithCount);
});

router.post('/semesters', (req, res) => {
  const { name, code, academicYear, description } = req.body;
  const store = getStore();

  const id = code || `S${store.semesters.length + 1}`;
  const newSemester = {
    id,
    name: name || `Semester ${store.semesters.length + 1}`,
    code: id,
    academicYear: academicYear || '2026–2027',
    isActive: false,
    isArchived: false,
    description: description || ''
  };

  store.semesters.push(newSemester);
  saveStore(store);
  res.status(201).json(newSemester);
});

router.put('/semesters/:id', (req, res) => {
  const { id } = req.params;
  const { name, academicYear, isActive, isArchived, description } = req.body;
  const store = getStore();

  const semIndex = store.semesters.findIndex(s => s.id === id);
  if (semIndex === -1) {
    return res.status(404).json({ message: 'Semester not found' });
  }

  // If setting this semester as active, mark others as inactive
  if (isActive) {
    store.semesters.forEach(s => { s.isActive = false; });
    store.settings.activeSemester = id;
  }

  store.semesters[semIndex] = {
    ...store.semesters[semIndex],
    ...(name !== undefined && { name }),
    ...(academicYear !== undefined && { academicYear }),
    ...(isActive !== undefined && { isActive }),
    ...(isArchived !== undefined && { isArchived }),
    ...(description !== undefined && { description })
  };

  saveStore(store);
  res.json(store.semesters[semIndex]);
});

router.delete('/semesters/:id', (req, res) => {
  const { id } = req.params;
  const store = getStore();

  store.semesters = store.semesters.filter(s => s.id !== id);
  // Also clean up or flag subjects
  saveStore(store);
  res.json({ success: true, message: 'Semester deleted successfully' });
});

// -------------------------------------------------------------
// 4. SUBJECTS
// -------------------------------------------------------------
router.get('/subjects', (req, res) => {
  const { semesterId } = req.query;
  const store = getStore();

  let subjects = store.subjects || [];
  if (semesterId) {
    subjects = subjects.filter(s => s.semesterId === semesterId);
  }

  // Attach module information & file counts
  const subjectsWithMeta = subjects.map(sub => {
    const files = (store.files || []).filter(f => f.subjectId === sub.id);
    return {
      ...sub,
      filesCount: files.length,
      notesCount: files.filter(f => f.category === 'Notes').length,
      pptCount: files.filter(f => f.category === 'PPT').length,
      qpCount: files.filter(f => f.category === 'Question Paper').length
    };
  });

  res.json(subjectsWithMeta);
});

router.post('/subjects', (req, res) => {
  const { semesterId, name, code, moduleCount, description, color } = req.body;
  const store = getStore();

  const newSubject = {
    id: `subj-${Date.now()}`,
    semesterId: semesterId || store.settings.activeSemester || 'S1',
    name,
    code: code || 'CS600X',
    moduleCount: parseInt(moduleCount, 10) || 5,
    order: (store.subjects || []).length + 1,
    color: color || 'purple',
    description: description || ''
  };

  store.subjects.push(newSubject);
  saveStore(store);
  res.status(201).json(newSubject);
});

router.put('/subjects/:id', (req, res) => {
  const { id } = req.params;
  const store = getStore();

  const subIndex = store.subjects.findIndex(s => s.id === id);
  if (subIndex === -1) {
    return res.status(404).json({ message: 'Subject not found' });
  }

  store.subjects[subIndex] = {
    ...store.subjects[subIndex],
    ...req.body
  };

  saveStore(store);
  res.json(store.subjects[subIndex]);
});

router.delete('/subjects/:id', (req, res) => {
  const { id } = req.params;
  const store = getStore();

  store.subjects = store.subjects.filter(s => s.id !== id);
  saveStore(store);
  res.json({ success: true, message: 'Subject deleted successfully' });
});

// -------------------------------------------------------------
// 5. FILES & UPLOADS
// -------------------------------------------------------------
router.get('/files', (req, res) => {
  const { semesterId, subjectId, moduleNumber, category, search } = req.query;
  const store = getStore();

  let files = store.files || [];

  if (semesterId && semesterId !== 'all') files = files.filter(f => f.semesterId === semesterId);
  if (subjectId && subjectId !== 'all') files = files.filter(f => f.subjectId === subjectId);
  if (moduleNumber && moduleNumber !== 'all') files = files.filter(f => f.moduleNumber === parseInt(moduleNumber, 10));
  
  if (category && category !== 'all') {
    const qCat = category.toLowerCase().trim();
    if (qCat.includes('question') || qCat.includes('paper') || qCat.includes('bank')) {
      files = files.filter(f => {
        const fc = (f.category || '').toLowerCase();
        return fc.includes('question') || fc.includes('paper') || fc.includes('bank');
      });
    } else {
      files = files.filter(f => (f.category || '').toLowerCase() === qCat);
    }
  }

  if (search) {
    const q = search.toLowerCase();
    files = files.filter(f => 
      f.name.toLowerCase().includes(q) ||
      (f.description && f.description.toLowerCase().includes(q)) ||
      (f.subjectName && f.subjectName.toLowerCase().includes(q))
    );
  }

  // Sort newest first
  files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  res.json(files);
});

router.post('/files/upload', upload.any(), (req, res) => {
  try {
    const store = getStore();
    const {
      semesterId,
      subjectId,
      moduleNumber,
      category,
      description,
      uploadedBy,
      examType,
      year,
      notesText // Optional text note
    } = req.body;

    const subject = (store.subjects || []).find(s => s.id === subjectId);
    const subjectName = subject ? subject.name : 'Computer Science';

    let modNum = null;
    let modTag = null;
    const rawMod = moduleNumber || req.body.module || req.body.moduleTag;
    if (rawMod) {
      const parsed = parseInt(rawMod, 10);
      if (!isNaN(parsed) && parsed > 0) {
        modNum = parsed;
        modTag = `Mod ${parsed}`;
      } else if (typeof rawMod === 'string' && rawMod.trim()) {
        const match = rawMod.match(/\d+/);
        if (match) {
          modNum = parseInt(match[0], 10);
          modTag = `Mod ${match[0]}`;
        } else {
          modTag = rawMod.trim();
        }
      }
    }

    // Normalize category: any question paper/bank variant becomes 'Question Paper'
    let savedCategory = category || 'Notes';
    if (savedCategory.toLowerCase().includes('question') || savedCategory.toLowerCase().includes('bank') || savedCategory.toLowerCase().includes('paper')) {
      savedCategory = 'Question Paper';
    }

    let savedExamType = examType || null;
    let savedYear = year ? parseInt(year, 10) : null;
    if (savedCategory === 'Question Paper') {
      if (!savedExamType) savedExamType = 'Internal 1';
      if (!savedYear) savedYear = new Date().getFullYear();
    }

    const createdFiles = [];

    if (req.files && req.files.length > 0) {
      // Deduplicate files by originalname and size to prevent any accidental double-posting
      const seenFiles = new Set();
      const uniqueFiles = [];
      for (const f of req.files) {
        const key = `${f.originalname}_${f.size}`;
        if (!seenFiles.has(key)) {
          seenFiles.add(key);
          uniqueFiles.push(f);
        } else {
          // Clean up duplicate disk file created by multer
          try { fs.unlinkSync(f.path); } catch (e) {}
        }
      }

      uniqueFiles.forEach((f, index) => {
        const originalName = f.originalname;
        const fileType = f.mimetype || 'application/octet-stream';
        const size = f.size;
        const sizeFormatted = size > 1024 * 1024 
          ? `${(size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(size / 1024)} KB`;
        const filePath = `/uploads/${f.filename}`;

        const newFile = {
          id: `file-${Date.now()}-${index}-${Math.round(Math.random() * 1e4)}`,
          name: originalName,
          originalName,
          fileType,
          size,
          sizeFormatted,
          fileUrl: filePath,
          semesterId: semesterId || store.settings.activeSemester || 'S1',
          subjectId: subjectId || '',
          subjectName,
          moduleNumber: modNum,
          moduleTag: modTag,
          category: savedCategory,
          uploadedBy: uploadedBy || store.settings.members[0] || 'Christo',
          uploadedAt: new Date().toISOString(),
          description: description || '',
          examType: savedExamType,
          year: savedYear,
          extractedContent: notesText || description || ''
        };

        store.files.push(newFile);
        createdFiles.push(newFile);
      });
    } else if (req.body.name) {
      const newFile = {
        id: `file-${Date.now()}`,
        name: req.body.name,
        originalName: req.body.name,
        fileType: 'text/plain',
        size: 1024,
        sizeFormatted: '1 KB',
        fileUrl: '',
        semesterId: semesterId || store.settings.activeSemester || 'S1',
        subjectId: subjectId || '',
        subjectName,
        moduleNumber: modNum,
        moduleTag: modTag,
        category: savedCategory,
        uploadedBy: uploadedBy || store.settings.members[0] || 'Christo',
        uploadedAt: new Date().toISOString(),
        description: description || '',
        examType: savedExamType,
        year: savedYear,
        extractedContent: notesText || description || ''
      };
      store.files.push(newFile);
      createdFiles.push(newFile);
    }

    saveStore(store);

    res.status(201).json({ 
      success: true, 
      file: createdFiles[0] || null,
      files: createdFiles,
      count: createdFiles.length
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ success: false, message: 'Upload failed. Please try again.' });
  }
});

router.delete('/files/:id', (req, res) => {
  const { id } = req.params;
  const store = getStore();

  const file = (store.files || []).find(f => f.id === id);
  if (file && file.fileUrl) {
    const diskPath = path.join(UPLOADS_DIR, path.basename(file.fileUrl));
    if (fs.existsSync(diskPath)) {
      try { fs.unlinkSync(diskPath); } catch (e) { /* ignore */ }
    }
  }

  store.files = (store.files || []).filter(f => f.id !== id);
  saveStore(store);
  res.json({ success: true, message: 'File deleted successfully' });
});

// -------------------------------------------------------------
// 6. ASSIGNMENTS (WITH IMPORTANT DUE DATE LIFECYCLE)
// -------------------------------------------------------------
router.get('/assignments', (req, res) => {
  const { semesterId, status, subjectId } = req.query;
  const store = getStore();
  const now = new Date();

  let assignments = (store.assignments || []).map(a => computeAssignmentMeta(a, now));

  if (semesterId) assignments = assignments.filter(a => a.semesterId === semesterId);
  if (subjectId) assignments = assignments.filter(a => a.subjectId === subjectId);

  // Status filtering: upcoming, due-soon, due-today, expired, completed
  if (status) {
    if (status === 'active') {
      assignments = assignments.filter(a => !a.isExpired);
    } else {
      assignments = assignments.filter(a => a.status === status);
    }
  }

  // Sort upcoming / active by nearest due date, expired by latest due date
  assignments.sort((a, b) => new Date(`${a.dueDate}T${a.dueTime || '23:59'}`) - new Date(`${b.dueDate}T${b.dueTime || '23:59'}`));

  res.json(assignments);
});

router.post('/assignments', (req, res) => {
  const {
    title,
    semesterId,
    subjectId,
    moduleNumber,
    description,
    dueDate,
    dueTime,
    attachment,
    createdBy
  } = req.body;

  if (!dueDate) {
    return res.status(400).json({ success: false, message: 'Last date of submission (Due Date) is required' });
  }

  const store = getStore();
  const subject = (store.subjects || []).find(s => s.id === subjectId);
  const fallbackTitle = subject ? `${subject.name} Assignment` : 'Class Assignment';
  const finalTitle = (title && title.trim()) ? title.trim() : fallbackTitle;

  const newAssignment = {
    id: `asg-${Date.now()}`,
    title: finalTitle,
    semesterId: semesterId || store.settings.activeSemester || 'S1',
    subjectId: subjectId || (subject ? subject.id : ''),
    subjectName: subject ? subject.name : 'General CS',
    moduleNumber: parseInt(moduleNumber, 10) || null,
    description: description || '',
    dueDate,
    dueTime: dueTime || '23:59',
    createdBy: createdBy || store.settings.members[0] || 'Christo',
    createdAt: new Date().toISOString(),
    attachment: attachment || null,
    completedBy: []
  };

  store.assignments.push(newAssignment);
  saveStore(store);

  const computed = computeAssignmentMeta(newAssignment, new Date());
  res.status(201).json(computed);
});

router.put('/assignments/:id', (req, res) => {
  const { id } = req.params;
  const store = getStore();

  const idx = store.assignments.findIndex(a => a.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  store.assignments[idx] = {
    ...store.assignments[idx],
    ...req.body
  };

  saveStore(store);
  res.json(computeAssignmentMeta(store.assignments[idx], new Date()));
});

router.post('/assignments/:id/toggle-complete', (req, res) => {
  const { id } = req.params;
  const { user } = req.body;
  const store = getStore();

  const assignment = store.assignments.find(a => a.id === id);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

  assignment.completedBy = assignment.completedBy || [];
  if (assignment.completedBy.includes(user)) {
    assignment.completedBy = assignment.completedBy.filter(u => u !== user);
  } else {
    assignment.completedBy.push(user);
  }

  saveStore(store);
  res.json(computeAssignmentMeta(assignment, new Date()));
});

router.delete('/assignments/:id', (req, res) => {
  const { id } = req.params;
  const store = getStore();

  store.assignments = store.assignments.filter(a => a.id !== id);
  saveStore(store);
  res.json({ success: true, message: 'Assignment deleted' });
});

// -------------------------------------------------------------
// 7. ANNOUNCEMENTS
// -------------------------------------------------------------
router.get('/announcements', (req, res) => {
  const store = getStore();
  const sorted = [...(store.announcements || [])].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  res.json(sorted);
});

router.post('/announcements', (req, res) => {
  const { title, message, createdBy, isPinned, attachmentName } = req.body;
  const store = getStore();

  const newAnn = {
    id: `ann-${Date.now()}`,
    title,
    message,
    createdBy: createdBy || store.settings.members[0] || 'Christo',
    createdAt: new Date().toISOString(),
    isPinned: Boolean(isPinned),
    attachmentName: attachmentName || null
  };

  store.announcements.push(newAnn);
  saveStore(store);
  res.status(201).json(newAnn);
});

router.put('/announcements/:id/pin', (req, res) => {
  const { id } = req.params;
  const store = getStore();

  const ann = store.announcements.find(a => a.id === id);
  if (!ann) return res.status(404).json({ message: 'Announcement not found' });

  ann.isPinned = !ann.isPinned;
  saveStore(store);
  res.json(ann);
});

router.delete('/announcements/:id', (req, res) => {
  const { id } = req.params;
  const store = getStore();

  store.announcements = store.announcements.filter(a => a.id !== id);
  saveStore(store);
  res.json({ success: true, message: 'Announcement deleted' });
});

// -------------------------------------------------------------
// 8. QUESTION PAPERS
// -------------------------------------------------------------
router.get('/question-papers', (req, res) => {
  const { semesterId, subjectId, examType, year } = req.query;
  const store = getStore();

  let qps = (store.files || []).filter(f => f.category === 'Question Paper');

  if (semesterId) qps = qps.filter(f => f.semesterId === semesterId);
  if (subjectId) qps = qps.filter(f => f.subjectId === subjectId);
  if (examType) qps = qps.filter(f => f.examType === examType);
  if (year) qps = qps.filter(f => f.year === parseInt(year, 10));

  res.json(qps);
});

// -------------------------------------------------------------
// 9. GLOBAL SEARCH
// -------------------------------------------------------------
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === '') {
    return res.json({ files: [], subjects: [], assignments: [], announcements: [] });
  }

  const query = q.toLowerCase().trim();
  const store = getStore();

  const files = (store.files || []).filter(f => 
    f.name.toLowerCase().includes(query) ||
    (f.description && f.description.toLowerCase().includes(query)) ||
    (f.subjectName && f.subjectName.toLowerCase().includes(query)) ||
    (f.extractedContent && f.extractedContent.toLowerCase().includes(query))
  );

  const subjects = (store.subjects || []).filter(s => 
    s.name.toLowerCase().includes(query) ||
    s.code.toLowerCase().includes(query) ||
    (s.description && s.description.toLowerCase().includes(query))
  );

  const now = new Date();
  const assignments = (store.assignments || [])
    .map(a => computeAssignmentMeta(a, now))
    .filter(a => 
      a.title.toLowerCase().includes(query) ||
      (a.description && a.description.toLowerCase().includes(query)) ||
      (a.subjectName && a.subjectName.toLowerCase().includes(query))
    );

  const announcements = (store.announcements || []).filter(a => 
    a.title.toLowerCase().includes(query) ||
    a.message.toLowerCase().includes(query)
  );

  res.json({ files, subjects, assignments, announcements });
});

// -------------------------------------------------------------
// 10. AI STUDY ASSISTANT
// -------------------------------------------------------------
router.post('/ai/query', async (req, res) => {
  try {
    const { query, mode, semesterId, subjectId, moduleNumber, specificFileId, searchAll } = req.body;
    
    if (!query && !mode) {
      return res.status(400).json({ message: 'Query or study mode required' });
    }

    const result = await processAIStudyQuery({
      query: query || `Perform ${mode} on the selected class notes`,
      mode: mode || 'Ask from Notes',
      semesterId,
      subjectId,
      moduleNumber,
      specificFileId,
      searchAll: Boolean(searchAll)
    });

    res.json(result);
  } catch (err) {
    console.error('AI Study Assistant error:', err);
    res.status(500).json({
      reply: "I encountered an issue accessing the class repository. Please try again.",
      sources: [],
      hasRelevantSources: false
    });
  }
});

// -------------------------------------------------------------
// 11. SETTINGS
// -------------------------------------------------------------
router.get('/settings', (req, res) => {
  const store = getStore();
  res.json(store.settings);
});

router.put('/settings', (req, res) => {
  const store = getStore();
  store.settings = {
    ...store.settings,
    ...req.body
  };
  saveStore(store);
  res.json(store.settings);
});

export default router;
