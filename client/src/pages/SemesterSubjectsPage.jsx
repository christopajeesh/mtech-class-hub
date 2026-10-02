import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { semesterApi, subjectApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Modal, ConfirmModal } from '../components/common/Modal.jsx';
import { 
  BookOpen, 
  Plus, 
  Check, 
  Archive, 
  Trash2, 
  Edit3, 
  ArrowRight, 
  CheckCircle, 
  Layers, 
  Files,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';

export const SemesterSubjectsPage = () => {
  const navigate = useNavigate();
  const { settings, refreshSettings } = useAuth();

  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState('S1');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [addSemesterModal, setAddSemesterModal] = useState(false);
  const [addSubjectModal, setAddSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'subject' | 'semester', id, name }

  // Form states
  const [newSemName, setNewSemName] = useState('');
  const [newSemCode, setNewSemCode] = useState('');
  const [newSemYear, setNewSemYear] = useState('2026–2027');

  const [subjName, setSubjName] = useState('');
  const [subjCode, setSubjCode] = useState('');
  const [subjModules, setSubjModules] = useState(5);
  const [subjDesc, setSubjDesc] = useState('');
  const [subjColor, setSubjColor] = useState('purple');

  const loadData = async () => {
    try {
      setLoading(true);
      const semRes = await semesterApi.getAll();
      setSemesters(semRes.data || []);

      const active = semRes.data.find(s => s.isActive)?.id || semRes.data[0]?.id || 'S1';
      if (!selectedSemesterId) {
        setSelectedSemesterId(active);
      }

      const subRes = await subjectApi.getAll(selectedSemesterId || active);
      setSubjects(subRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSemesterId]);

  const activeSemesterObj = semesters.find(s => s.id === selectedSemesterId);

  // Toggle active semester
  const handleSetActiveSemester = async (semId) => {
    try {
      await semesterApi.update(semId, { isActive: true });
      await refreshSettings();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle archive semester
  const handleToggleArchive = async (sem) => {
    try {
      await semesterApi.update(sem.id, { isArchived: !sem.isArchived });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Create new semester
  const handleCreateSemester = async (e) => {
    e.preventDefault();
    if (!newSemCode.trim()) return;
    try {
      const res = await semesterApi.create({
        code: newSemCode.trim().toUpperCase(),
        name: newSemName.trim() || `Semester ${newSemCode.trim()}`,
        academicYear: newSemYear
      });
      setAddSemesterModal(false);
      setNewSemCode('');
      setNewSemName('');
      setSelectedSemesterId(res.data.id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Create or update subject
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!subjName.trim()) return;

    try {
      if (editingSubject) {
        await subjectApi.update(editingSubject.id, {
          name: subjName,
          code: subjCode,
          moduleCount: parseInt(subjModules, 10),
          description: subjDesc,
          color: subjColor
        });
      } else {
        await subjectApi.create({
          semesterId: selectedSemesterId,
          name: subjName,
          code: subjCode || 'CS600X',
          moduleCount: parseInt(subjModules, 10),
          description: subjDesc,
          color: subjColor
        });
      }

      setAddSubjectModal(false);
      setEditingSubject(null);
      setSubjName('');
      setSubjCode('');
      setSubjDesc('');
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditSubject = (sub, e) => {
    e.stopPropagation();
    setEditingSubject(sub);
    setSubjName(sub.name);
    setSubjCode(sub.code);
    setSubjModules(sub.moduleCount || 5);
    setSubjDesc(sub.description || '');
    setSubjColor(sub.color || 'purple');
    setAddSubjectModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'subject') {
        await subjectApi.delete(deleteConfirm.id);
      } else if (deleteConfirm.type === 'semester') {
        await semesterApi.delete(deleteConfirm.id);
        const remaining = semesters.filter(s => s.id !== deleteConfirm.id);
        if (remaining.length > 0) setSelectedSemesterId(remaining[0].id);
      }
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-400" />
            <span>Semester & Subjects</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dynamic curriculum repository. Manage subjects, configure modules, and archive prior semesters without losing notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddSemesterModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>+ Add Semester</span>
          </button>
          <button
            onClick={() => {
              setEditingSubject(null);
              setSubjName('');
              setSubjCode('');
              setSubjDesc('');
              setSubjModules(5);
              setAddSubjectModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Subject</span>
          </button>
        </div>
      </div>

      {/* Semester Tabs & Controls */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Semester Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {semesters.map((sem) => {
            const isSelected = sem.id === selectedSemesterId;
            return (
              <button
                key={sem.id}
                onClick={() => setSelectedSemesterId(sem.id)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{sem.code}</span>
                {sem.isActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-950 animate-pulse" title="Active Semester" />
                )}
                {sem.isArchived && (
                  <span className="text-[10px] px-1 bg-slate-800 text-slate-400 rounded">
                    Archived
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Semester Actions */}
        {activeSemesterObj && (
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-xs text-slate-400">
              Academic Year: <strong className="text-slate-200 font-mono">{activeSemesterObj.academicYear}</strong>
            </span>

            {!activeSemesterObj.isActive ? (
              <button
                onClick={() => handleSetActiveSemester(activeSemesterObj.id)}
                className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
                title="Mark this semester as currently active on dashboard"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Set as Active</span>
              </button>
            ) : (
              <span className="px-3 py-1 bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Currently Active
              </span>
            )}

            <button
              onClick={() => handleToggleArchive(activeSemesterObj)}
              className={`px-3 py-1.5 border text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors ${
                activeSemesterObj.isArchived
                  ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{activeSemesterObj.isArchived ? 'Unarchive' : 'Archive'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Subjects Grid for Selected Semester */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {activeSemesterObj?.name || selectedSemesterId} Subjects
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {subjects.length} Subjects Registered
            </span>
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline">
            Each subject contains modular lecture notes, PPTs, and question papers.
          </span>
        </div>

        {subjects.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center space-y-4">
            <Layers className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Subjects Added Yet in {selectedSemesterId}</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click the "+ Add Subject" button above to add subjects for this semester. You can customize the number of modules (default 5).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                onClick={() => navigate(`/subjects/${sub.id}`)}
                className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800/80 cursor-pointer flex flex-col justify-between group space-y-5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-800/70">
                      {sub.code}
                    </span>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => openEditSubject(sub, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        title="Edit Subject"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ type: 'subject', id: sub.id, name: sub.name });
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mt-3 group-hover:text-indigo-300 transition-colors">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {sub.description || 'Core M.Tech Computer Science curriculum'}
                  </p>
                </div>

                {/* Modules & File stats breakdown */}
                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
                      <p className="text-slate-400">Modules</p>
                      <p className="text-white font-bold mt-0.5">{sub.moduleCount || 5}</p>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
                      <p className="text-slate-400">Notes / PPT</p>
                      <p className="text-indigo-300 font-bold mt-0.5">{(sub.notesCount || 0) + (sub.pptCount || 0)}</p>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
                      <p className="text-slate-400">Papers</p>
                      <p className="text-emerald-300 font-bold mt-0.5">{sub.qpCount || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">
                      <strong className="text-slate-200">{sub.filesCount || 0}</strong> total files
                    </span>
                    <span className="text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Open Subject <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Semester Modal */}
      <Modal isOpen={addSemesterModal} onClose={() => setAddSemesterModal(false)} title="Create New Semester" maxWidth="max-w-md">
        <form onSubmit={handleCreateSemester} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Semester Code</label>
            <input
              type="text"
              placeholder="e.g. S2, S3, S4"
              value={newSemCode}
              onChange={(e) => setNewSemCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Semester Title</label>
            <input
              type="text"
              placeholder="e.g. Semester 2 — Advanced Specialization"
              value={newSemName}
              onChange={(e) => setNewSemName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Academic Year</label>
            <input
              type="text"
              value={newSemYear}
              onChange={(e) => setNewSemYear(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setAddSemesterModal(false)}
              className="px-4 py-2 text-xs rounded-xl text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-950"
            >
              Create Semester
            </button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Subject Modal */}
      <Modal 
        isOpen={addSubjectModal} 
        onClose={() => setAddSubjectModal(false)} 
        title={editingSubject ? `Edit Subject (${editingSubject.code})` : `Add Subject to ${selectedSemesterId}`} 
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject Name</label>
              <input
                type="text"
                placeholder="e.g. Distributed Systems"
                value={subjName}
                onChange={(e) => setSubjName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject Code</label>
              <input
                type="text"
                placeholder="CS6001"
                value={subjCode}
                onChange={(e) => setSubjCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Number of Modules (Configurable)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={subjModules}
              onChange={(e) => setSubjModules(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Modules 1 to {subjModules} will be automatically organized inside this subject.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject Description</label>
            <textarea
              rows={3}
              placeholder="Brief course objectives and syllabus overview..."
              value={subjDesc}
              onChange={(e) => setSubjDesc(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setAddSubjectModal(false)}
              className="px-4 py-2 text-xs rounded-xl text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-950"
            >
              {editingSubject ? 'Save Changes' : 'Add Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteConfirm?.type === 'subject' ? 'Subject' : 'Semester'}?`}
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? All classmates will see this update immediately.`}
        confirmText="Confirm Delete"
      />
    </div>
  );
};
