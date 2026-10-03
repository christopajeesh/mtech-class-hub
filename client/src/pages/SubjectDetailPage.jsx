import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { subjectApi, fileApi, assignmentApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useUIModal } from '../components/layout/Layout.jsx';
import { CategoryBadge, UrgencyBadge } from '../components/common/Badge.jsx';
import { ReminderDropdown } from '../components/common/ReminderDropdown.jsx';
import { 
  BookOpen, 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  ChevronRight, 
  Folder, 
  Calendar, 
  User, 
  Plus, 
  CheckSquare,
  Trash2,
  CheckCircle2,
  Clock,
  FileUp
} from 'lucide-react';
import { Modal, ConfirmModal } from '../components/common/Modal.jsx';

const TAB_KEYS = {
  all: 'All Files',
  'all-files': 'All Files',
  syllabus: 'Syllabus',
  notes: 'Notes',
  ppt: 'PPT',
  'question-papers': 'Question Papers',
  'question-paper': 'Question Papers',
  qp: 'Question Papers',
  papers: 'Question Papers',
  assignments: 'Assignments',
  assignment: 'Assignments'
};

const TAB_TO_SLUG = {
  'All Files': 'all',
  'Syllabus': 'syllabus',
  'Notes': 'notes',
  'PPT': 'ppt',
  'Question Papers': 'question-papers',
  'Assignments': 'assignments'
};

export const SubjectDetailPage = () => {
  const { subjectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openUploadModal, openPreview } = useUIModal();

  const { currentUser } = useAuth();
  const [subject, setSubject] = useState(null);
  const [files, setFiles] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const getInitialTab = () => {
    const param = searchParams.get('tab');
    if (param && TAB_KEYS[param.toLowerCase()]) {
      return TAB_KEYS[param.toLowerCase()];
    }
    const saved = localStorage.getItem(`class_hub_subject_tab_${subjectId}`);
    if (saved && TAB_KEYS[saved.toLowerCase()]) {
      return TAB_KEYS[saved.toLowerCase()];
    }
    return 'All Files';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [selectedModFilter, setSelectedModFilter] = useState(() => searchParams.get('mod') || 'all');
  const [loading, setLoading] = useState(true);
  const [deleteFileConfirm, setDeleteFileConfirm] = useState(null);

  // DI Assignment management states
  const [createAsgModalOpen, setCreateAsgModalOpen] = useState(false);
  const [asgTitle, setAsgTitle] = useState('');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgDueDate, setAsgDueDate] = useState('');
  const [asgDueTime, setAsgDueTime] = useState('23:59');
  const [asgFile, setAsgFile] = useState(null);
  const [asgSaving, setAsgSaving] = useState(false);
  const [asgError, setAsgError] = useState('');
  const [deleteAsgConfirm, setDeleteAsgConfirm] = useState(null);
  const [showPastAssignments, setShowPastAssignments] = useState(false);

  const loadSubjectData = async () => {
    try {
      setLoading(true);
      const [subsRes, filesRes, asgRes] = await Promise.all([
        subjectApi.getAll(),
        fileApi.getAll({ subjectId }),
        assignmentApi.getAll({ subjectId })
      ]);

      const foundSubject = (subsRes.data || []).find(s => s.id === subjectId);
      setSubject(foundSubject || null);
      setFiles(filesRes.data || []);
      setAssignments(asgRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!deleteFileConfirm) return;
    try {
      await fileApi.delete(deleteFileConfirm.id);
      setFiles(prev => prev.filter(f => f.id !== deleteFileConfirm.id));
      window.dispatchEvent(new CustomEvent('class_hub_data_updated'));
    } catch (err) {
      console.error('Failed to delete file', err);
    } finally {
      setDeleteFileConfirm(null);
    }
  };

  const handleToggleComplete = async (asgId) => {
    try {
      const res = await assignmentApi.toggleComplete(asgId, currentUser);
      setAssignments(prev => prev.map(a => a.id === asgId ? res.data : a));
      window.dispatchEvent(new CustomEvent('class_hub_data_updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!asgDueDate) {
      setAsgError('Please provide the Last Date of Submission.');
      return;
    }

    setAsgSaving(true);
    setAsgError('');

    try {
      const finalTitle = asgTitle.trim() || `${subject?.name || 'Dissertation'} Assignment / Milestone`;
      let attachmentData = null;

      if (asgFile) {
        const formData = new FormData();
        formData.append('file', asgFile);
        formData.append('semesterId', subject?.semesterId || 'S1');
        formData.append('subjectId', subject?.id || '');
        formData.append('category', 'Assignment');
        formData.append('description', `DI Assignment Document: ${finalTitle}`);
        formData.append('uploadedBy', currentUser || 'Christo');
        const fileRes = await fileApi.upload(formData);
        if (fileRes.data?.file) {
          attachmentData = {
            name: fileRes.data.file.name,
            url: fileRes.data.file.fileUrl,
            size: fileRes.data.file.sizeFormatted || fileRes.data.file.size
          };
        }
      }

      await assignmentApi.create({
        title: finalTitle,
        semesterId: subject?.semesterId || 'S1',
        subjectId: subject?.id,
        moduleNumber: null,
        description: asgDesc,
        dueDate: asgDueDate,
        dueTime: asgDueTime || '23:59',
        attachment: attachmentData,
        createdBy: currentUser || 'Christo'
      });

      setCreateAsgModalOpen(false);
      setAsgTitle('');
      setAsgDesc('');
      setAsgDueDate('');
      setAsgDueTime('23:59');
      setAsgFile(null);
      setAsgError('');
      await loadSubjectData();
      window.dispatchEvent(new CustomEvent('class_hub_data_updated'));
    } catch (err) {
      console.error('Failed to create assignment', err);
      setAsgError('Failed to create assignment. Please try again.');
    } finally {
      setAsgSaving(false);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!deleteAsgConfirm) return;
    try {
      await assignmentApi.delete(deleteAsgConfirm.id);
      setAssignments(prev => prev.filter(a => a.id !== deleteAsgConfirm.id));
      window.dispatchEvent(new CustomEvent('class_hub_data_updated'));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteAsgConfirm(null);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const slug = TAB_TO_SLUG[tab] || 'all';
    try {
      localStorage.setItem(`class_hub_subject_tab_${subjectId}`, slug);
    } catch (e) {}
    const newParams = new URLSearchParams(searchParams);
    if (slug === 'all') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', slug);
    }
    setSearchParams(newParams, { replace: false });
  };

  const handleModFilterChange = (mod) => {
    setSelectedModFilter(mod);
    const newParams = new URLSearchParams(searchParams);
    if (mod === 'all') {
      newParams.delete('mod');
    } else {
      newParams.set('mod', mod);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Sync tab & module filter when searchParams or subjectId changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TAB_KEYS[tabParam.toLowerCase()]) {
      const resolvedTab = TAB_KEYS[tabParam.toLowerCase()];
      setActiveTab(resolvedTab);
      try {
        localStorage.setItem(`class_hub_subject_tab_${subjectId}`, TAB_TO_SLUG[resolvedTab]);
      } catch (e) {}
    } else if (!tabParam) {
      const saved = localStorage.getItem(`class_hub_subject_tab_${subjectId}`);
      if (saved && TAB_KEYS[saved.toLowerCase()]) {
        setActiveTab(TAB_KEYS[saved.toLowerCase()]);
      } else {
        setActiveTab('All Files');
      }
    }

    const modParam = searchParams.get('mod');
    if (modParam) {
      setSelectedModFilter(modParam);
    }
  }, [searchParams, subjectId]);

  useEffect(() => {
    loadSubjectData();
    const handleUpdate = (e) => {
      loadSubjectData();
      if (e?.detail?.category) {
        const catKey = e.detail.category.toLowerCase().replace(/\s+/g, '-');
        if (TAB_KEYS[catKey]) {
          handleTabChange(TAB_KEYS[catKey]);
        }
      }
    };
    window.addEventListener('class_hub_data_updated', handleUpdate);
    return () => window.removeEventListener('class_hub_data_updated', handleUpdate);
  }, [subjectId]);

  if (loading && !subject) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="h-40 bg-slate-900 rounded-2xl" />
        <div className="h-64 bg-slate-900 rounded-2xl" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="p-8 glass-panel rounded-2xl text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Subject Not Found</h2>
        <Link to="/semesters" className="text-indigo-400 text-sm hover:underline">
          Return to Semesters & Subjects
        </Link>
      </div>
    );
  }

  const moduleCount = subject.moduleCount || 5;
  const modulesList = Array.from({ length: moduleCount }, (_, i) => i + 1);
  const isDISubject = subject?.code === 'DI' || subject?.slot === 'DI' || subject?.id === 'subj-di';

  if (isDISubject) {
    return (
      <div className="space-y-8 animate-in fade-in duration-200">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/semesters" className="hover:text-white transition-colors">
            Semester {subject.semesterId}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-indigo-300 font-semibold">Dissertation Ideation (DI)</span>
        </div>

        {/* DI Header Banner */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-700/60 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-2xl relative z-10">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-900/80 border border-indigo-600 text-indigo-200 text-xs font-mono font-bold rounded-xl">
                Slot DI • Dissertation Ideation
              </span>
              <span className="text-xs text-indigo-300 font-medium">
                Faculty: <strong className="text-white">Dr. Arun</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Dissertation Ideation
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Research problem identification, literature review, IEEE/ACM analysis, and thesis proposal with Dr. Arun.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 flex-shrink-0">
            <button
              onClick={() => setCreateAsgModalOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-950 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add DI Assignment</span>
            </button>
          </div>
        </div>

        {/* DI Assignments List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-400" />
                <span>Dissertation Assignments & Milestones</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dedicated tracking for research deliverables and reviews with Dr. Arun.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {assignments.filter(a => !a.isExpired).length} active {assignments.filter(a => !a.isExpired).length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {assignments.filter(a => !a.isExpired).length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl text-center space-y-3 border border-dashed border-slate-800">
              <CheckSquare className="w-10 h-10 text-indigo-400/80 mx-auto" />
              <h4 className="text-sm font-semibold text-white">No Active Dissertation Deadlines</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All previous assignments have passed or no upcoming milestones are due. Add literature surveys or research reviews given by Dr. Arun.
              </p>
              <button
                onClick={() => setCreateAsgModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2 shadow-lg shadow-indigo-950 transition-all hover:scale-105"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add DI Assignment</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.filter(a => !a.isExpired).map((asg) => {
                const isCompleted = asg.completedBy && asg.completedBy.includes(currentUser);
                return (
                  <div
                    key={asg.id}
                    className={`glass-panel p-5 rounded-2xl border transition-all ${
                      isCompleted 
                        ? 'border-emerald-800/40 bg-emerald-950/10' 
                        : 'border-slate-800/90 hover:border-indigo-700/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          onClick={() => handleToggleComplete(asg.id)}
                          className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border transition-all flex-shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-slate-700 hover:border-indigo-500 text-transparent hover:text-indigo-400'
                          }`}
                          title={isCompleted ? "Mark as pending" : "Mark as done"}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`text-sm sm:text-base font-bold ${
                              isCompleted ? 'line-through text-slate-400' : 'text-white'
                            }`}>
                              {asg.title}
                            </h4>
                            <UrgencyBadge urgency={asg.urgency} text={asg.remainingText} />
                          </div>

                          {asg.description && (
                            <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                              {asg.description}
                            </p>
                          )}

                          {asg.attachment && (
                            <div className="pt-1">
                              {typeof asg.attachment === 'object' && asg.attachment.url ? (
                                <a
                                  href={asg.attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 rounded-lg text-[11px] text-indigo-200 transition-colors"
                                >
                                  <Download className="w-3 h-3 text-indigo-400" />
                                  <span>{asg.attachment.name}</span>
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-indigo-300 font-mono">
                                  📎 {typeof asg.attachment === 'string' ? asg.attachment : asg.attachment?.name}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-slate-300">
                              <Clock className="w-3.5 h-3.5 text-indigo-400" />
                              Due: <strong className="text-white font-mono">{asg.dueDate}</strong> ({asg.dueTime || '23:59'})
                            </span>
                            <span>•</span>
                            <span>Faculty: <strong className="text-slate-200">Dr. Arun</strong></span>
                            <span>•</span>
                            <span>Added by: {asg.createdBy || 'Classmate'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 sm:self-center">
                        <ReminderDropdown assignment={asg} />
                        <button
                          onClick={() => setDeleteAsgConfirm(asg)}
                          className="p-2 bg-slate-900 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700/60 rounded-xl text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Past / Expired Submissions Collapsed Section */}
          {assignments.filter(a => a.isExpired).length > 0 && (
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowPastAssignments(!showPastAssignments)}
                className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors font-medium"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {showPastAssignments ? 'Hide' : 'View'} Past Submissions ({assignments.filter(a => a.isExpired).length} past deadline)
                </span>
              </button>

              {showPastAssignments && (
                <div className="space-y-3 mt-3 opacity-60">
                  {assignments.filter(a => a.isExpired).map((asg) => (
                    <div
                      key={asg.id}
                      className="glass-panel p-4 rounded-2xl border border-slate-800/60 bg-slate-950/40 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-300">{asg.title}</p>
                        <p className="text-[11px] text-slate-500">
                          Deadline passed on {asg.dueDate} ({asg.dueTime || '23:59'}) • Created by {asg.createdBy}
                        </p>
                      </div>
                      <button
                        onClick={() => setDeleteAsgConfirm(asg)}
                        className="p-1.5 text-slate-500 hover:text-rose-400"
                        title="Delete Past Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Assignment Modal for DI */}
        <Modal
          isOpen={createAsgModalOpen}
          onClose={() => {
            setCreateAsgModalOpen(false);
            setAsgError('');
            setAsgFile(null);
          }}
          title="Add Dissertation Assignment / Milestone"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            {asgError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <span>{asgError}</span>
              </div>
            )}

            {/* MANDATORY: Last Date of Submission */}
            <div className="p-3.5 bg-gradient-to-r from-rose-950/40 to-indigo-950/30 border border-rose-700/50 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-300">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Last Date of Submission * (Required)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Last Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={asgDueDate}
                    onChange={(e) => {
                      setAsgDueDate(e.target.value);
                      if (asgError) setAsgError('');
                    }}
                    className="w-full bg-slate-900 border border-rose-500/60 focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Submission Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={asgDueTime}
                    onChange={(e) => setAsgDueTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Assignment Topic (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Assignment Topic <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-slate-500">Defaults to "DI Research Milestone" if empty</span>
              </div>
              <input
                type="text"
                value={asgTitle}
                onChange={(e) => setAsgTitle(e.target.value)}
                placeholder="e.g. Literature Survey & 5 IEEE Papers Review (Optional)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Optional Document Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Attach Document / Brief <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-3 text-center transition-colors bg-slate-900/40">
                <input
                  type="file"
                  onChange={(e) => setAsgFile(e.target.files?.[0] || null)}
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-1 pointer-events-none">
                  <FileUp className="w-5 h-5 text-indigo-400" />
                  {asgFile ? (
                    <div>
                      <p className="text-xs font-medium text-emerald-400">Attached: {asgFile.name}</p>
                      <p className="text-[10px] text-slate-400">{(asgFile.size / 1024).toFixed(0)} KB • Click to replace</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-slate-300 font-medium">Click or drag document to attach (Optional)</p>
                      <p className="text-[10px] text-slate-500">PDF, Word, or problem brief</p>
                    </div>
                  )}
                </div>
              </div>
              {asgFile && (
                <button
                  type="button"
                  onClick={() => setAsgFile(null)}
                  className="text-[11px] text-rose-400 hover:text-rose-300"
                >
                  ✕ Remove attached document
                </button>
              )}
            </div>

            {/* Deliverable Details / Instructions */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Deliverable Details / Instructions <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={asgDesc}
                onChange={(e) => setAsgDesc(e.target.value)}
                placeholder="Details of what Dr. Arun requested (e.g. submit 2-page IEEE summary report)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setCreateAsgModalOpen(false);
                  setAsgError('');
                  setAsgFile(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={asgSaving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-950 transition-all disabled:opacity-50"
              >
                {asgSaving ? 'Saving...' : 'Add Assignment'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Assignment Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(deleteAsgConfirm)}
          onClose={() => setDeleteAsgConfirm(null)}
          onConfirm={handleDeleteAssignment}
          title="Delete DI Assignment?"
          message={`Are you sure you want to remove "${deleteAsgConfirm?.title}"? If wrongly added, it will be deleted for all classmates.`}
          confirmText="Yes, Delete"
          isDanger={true}
        />
      </div>
    );
  }

  const tabList = ['All Files', 'Syllabus', 'Notes', 'PPT', 'Question Papers', 'Assignments'];

  const getTabCount = (tab) => {
    if (tab === 'All Files') return files.length;
    if (tab === 'Syllabus') {
      return files.filter(f => f.category === 'Syllabus' || (f.name && f.name.toLowerCase().includes('syllabus'))).length;
    }
    if (tab === 'Notes') {
      return files.filter(f => f.category === 'Notes').length;
    }
    if (tab === 'PPT') {
      return files.filter(f => 
        f.category === 'PPT' || 
        (f.name && (f.name.toLowerCase().endsWith('.ppt') || f.name.toLowerCase().endsWith('.pptx'))) || 
        (f.fileType && (f.fileType.includes('presentation') || f.fileType.includes('powerpoint')))
      ).length;
    }
    if (tab === 'Question Papers') {
      return files.filter(f => 
        f.category === 'Question Paper' || 
        f.category === 'Question Papers' || 
        f.category === 'Question Bank' || 
        Boolean(f.examType)
      ).length;
    }
    if (tab === 'Assignments') {
      return assignments.length;
    }
    return 0;
  };

  // Filter files based on active tab and optional module filter
  let displayedFiles = files;
  if (activeTab === 'Syllabus') {
    displayedFiles = files.filter(f => f.category === 'Syllabus' || (f.name && f.name.toLowerCase().includes('syllabus')));
  } else if (activeTab === 'Notes') {
    displayedFiles = files.filter(f => f.category === 'Notes');
  } else if (activeTab === 'PPT') {
    displayedFiles = files.filter(f => 
      f.category === 'PPT' || 
      (f.name && (f.name.toLowerCase().endsWith('.ppt') || f.name.toLowerCase().endsWith('.pptx'))) || 
      (f.fileType && (f.fileType.includes('presentation') || f.fileType.includes('powerpoint')))
    );
  } else if (activeTab === 'Question Papers') {
    displayedFiles = files.filter(f => 
      f.category === 'Question Paper' || 
      f.category === 'Question Papers' || 
      f.category === 'Question Bank' || 
      Boolean(f.examType)
    );
  } else if (activeTab === 'Assignments') {
    displayedFiles = files.filter(f => f.category === 'Assignment');
  }

  if (selectedModFilter !== 'all') {
    displayedFiles = displayedFiles.filter(f => 
      String(f.moduleNumber) === selectedModFilter || 
      f.moduleTag === `Mod ${selectedModFilter}` || 
      (f.name && f.name.toLowerCase().includes(`mod ${selectedModFilter}`))
    );
  }

  const displayedAssignments = assignments;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/semesters" className="hover:text-white transition-colors">
          Semester {subject.semesterId}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-indigo-300 font-semibold">{subject.name}</span>
      </div>

      {/* Subject Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-indigo-950 border border-indigo-700 text-indigo-300 text-xs font-mono font-bold rounded-xl">
              {subject.code}
            </span>
            <span className="text-xs text-slate-400">
              {moduleCount} Modules • {files.length} Shared Materials
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {subject.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {subject.description || 'Saintgits College M.Tech Computer Science Course Syllabus'}
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 flex-shrink-0">
          <button
            onClick={() => {
              const catMap = {
                'All Files': 'Notes',
                'Syllabus': 'Syllabus',
                'Notes': 'Notes',
                'PPT': 'PPT',
                'Question Papers': 'Question Paper',
                'Assignments': 'Assignment'
              };
              openUploadModal({
                semesterId: subject.semesterId,
                subjectId: subject.id,
                moduleNumber: selectedModFilter !== 'all' ? selectedModFilter : undefined,
                category: catMap[activeTab] || 'Notes'
              });
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-950 transition-all hover:scale-105"
          >
            <Upload className="w-4 h-4" />
            <span>+ Upload File</span>
          </button>
        </div>
      </div>

      {/* Tabs Filter Bar & Optional Module Filter */}
      <div className="space-y-3 border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {tabList.map((tab) => {
              const count = getTabCount(tab);
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50 scale-[1.02]'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{tab}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {activeTab === 'Syllabus' && (
            <span className="text-xs text-teal-400 font-medium">
              Course Syllabus & Scheme
            </span>
          )}
          {activeTab === 'PPT' && (
            <span className="text-xs text-orange-400 font-medium">
              Lecture Slides & Presentations (PPT)
            </span>
          )}
          {activeTab === 'Question Papers' && (
            <span className="text-xs text-emerald-400 font-medium">
              Internal Tests & University Question Papers
            </span>
          )}
          {activeTab === 'Notes' && (
            <span className="text-xs text-indigo-400 font-medium">
              Lecture & Modular Notes
            </span>
          )}
        </div>

        {/* Optional Module Filter Bar (never forces module upload) */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <span className="text-slate-400 text-xs font-medium mr-1">Optional Module Filter:</span>
            <button
              onClick={() => handleModFilterChange('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedModFilter === 'all'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All
            </button>
            {modulesList.map((m) => {
              const count = files.filter(f => 
                String(f.moduleNumber) === String(m) || 
                f.moduleTag === `Mod ${m}` ||
                (f.name && f.name.toLowerCase().includes(`mod ${m}`))
              ).length;
              return (
                <button
                  key={m}
                  onClick={() => handleModFilterChange(selectedModFilter === String(m) ? 'all' : String(m))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 ${
                    selectedModFilter === String(m)
                      ? 'bg-indigo-600 text-white font-bold shadow'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>Mod {m}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedModFilter === String(m) ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedModFilter !== 'all' && (
            <button
              onClick={() => handleModFilterChange('all')}
              className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Active Module Assignments Banner (if any) */}
      {displayedAssignments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-rose-400" />
            <span>Assignments in this Scope</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedAssignments.map((asg) => (
              <div
                key={asg.id}
                className="p-4 glass-panel border border-slate-800 rounded-2xl flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-xs font-semibold text-white">{asg.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{asg.description}</p>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Created by {asg.createdBy} • Due {asg.dueDate}
                  </p>
                </div>
                <UrgencyBadge urgency={asg.urgency} text={asg.remainingText} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Materials List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Folder className="w-4 h-4 text-indigo-400" />
            <span>
              Academic Materials {activeTab === 'All Files' ? '' : `(${activeTab})`}
              {selectedModFilter !== 'all' ? ` • Filtered by Mod ${selectedModFilter}` : ''}
            </span>
          </h3>
          <span className="text-xs text-slate-400">
            {displayedFiles.length} items found
          </span>
        </div>

        {displayedFiles.length === 0 ? (
          activeTab === 'Syllabus' ? (
            <div className="glass-panel p-12 rounded-2xl text-center space-y-3 border border-dashed border-teal-800/60">
              <FileText className="w-10 h-10 text-teal-400 mx-auto" />
              <h4 className="text-sm font-semibold text-white">No Syllabus Uploaded Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Add the official course syllabus PDF or document for {subject.name} ({subject.code}) so all 6 classmates have the module breakdown and exam scheme handy.
              </p>
              <button
                onClick={() => openUploadModal({
                  semesterId: subject.semesterId,
                  subjectId: subject.id,
                  category: 'Syllabus'
                })}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2 shadow-lg shadow-teal-950 transition-all hover:scale-105"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Syllabus Document</span>
              </button>
            </div>
          ) : activeTab === 'PPT' ? (
            <div className="glass-panel p-12 rounded-2xl text-center space-y-3 border border-dashed border-orange-800/60">
              <FileText className="w-10 h-10 text-orange-400 mx-auto" />
              <h4 className="text-sm font-semibold text-white">No PPT Presentations Uploaded Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload lecture slides, PPT decks, or module presentations (.pptx, .ppt, .pdf) for {subject.name}.
              </p>
              <button
                onClick={() => openUploadModal({
                  semesterId: subject.semesterId,
                  subjectId: subject.id,
                  category: 'PPT'
                })}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2 shadow-lg shadow-orange-950 transition-all hover:scale-105"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Presentation (PPT)</span>
              </button>
            </div>
          ) : activeTab === 'Question Papers' ? (
            <div className="glass-panel p-12 rounded-2xl text-center space-y-3 border border-dashed border-emerald-800/60">
              <FileText className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-semibold text-white">No Question Papers Uploaded Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload Internal Test, Model Exam, or Previous Year university papers for {subject.name}.
              </p>
              <button
                onClick={() => openUploadModal({
                  semesterId: subject.semesterId,
                  subjectId: subject.id,
                  category: 'Question Paper'
                })}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all hover:scale-105"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Question Paper</span>
              </button>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-semibold text-white">No materials uploaded here yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Be the first among the 6 classmates to share lecture notes, slides, or questions for this subject.
              </p>
              <button
                onClick={() => openUploadModal({
                  semesterId: subject.semesterId,
                  subjectId: subject.id,
                  category: activeTab === 'Notes' ? 'Notes' : undefined
                })}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Material</span>
              </button>
            </div>
          )
        ) : (
          <div className="space-y-3">
            {displayedFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => openPreview(file)}
                className="glass-panel glass-panel-hover p-4 rounded-2xl border border-slate-800/80 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950/70 border border-indigo-800/60 flex items-center justify-center text-indigo-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {file.name}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-indigo-400" />
                        Uploaded by <strong className="text-slate-200">{file.uploadedBy}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(file.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span>•</span>
                      <span className="font-mono">{file.sizeFormatted}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                  {(file.moduleTag || (file.moduleNumber && file.moduleNumber > 0)) && (
                    <span className="px-2 py-0.5 bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-[10px] font-mono font-semibold rounded-md">
                      {file.moduleTag || `Mod ${file.moduleNumber}`}
                    </span>
                  )}
                  <CategoryBadge category={file.category} />
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openPreview(file);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors"
                      title="Preview Document"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Preview</span>
                    </button>
                    <a
                      href={file.fileUrl || '#'}
                      download={file.name}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
                      title="Direct Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteFileConfirm(file);
                      }}
                      className="p-2 bg-slate-900 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700/60 rounded-xl text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete / Remove Material"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteFileConfirm)}
        onClose={() => setDeleteFileConfirm(null)}
        onConfirm={handleDeleteFile}
        title="Remove Uploaded Material?"
        message={`Are you sure you want to remove "${deleteFileConfirm?.name}"? If this was wrongly uploaded, it will be immediately removed for all classmates.`}
        confirmText="Yes, Delete"
        isDanger={true}
      />
    </div>
  );
};
