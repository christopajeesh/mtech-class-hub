import React, { useState, useEffect } from 'react';
import { assignmentApi, subjectApi, semesterApi, fileApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { UrgencyBadge } from '../components/common/Badge.jsx';
import { Modal, ConfirmModal } from '../components/common/Modal.jsx';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  Download, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  History, 
  AlertCircle,
  FileCheck,
  FileUp
} from 'lucide-react';
import { ReminderDropdown } from '../components/common/ReminderDropdown.jsx';

export const AssignmentsPage = () => {
  const { currentUser, settings } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'due-soon', 'upcoming', 'expired', 'completed'
  const [loading, setLoading] = useState(true);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [moduleNumber, setModuleNumber] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [attachment, setAttachment] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const [asgRes, subRes] = await Promise.all([
        assignmentApi.getAll(),
        subjectApi.getAll()
      ]);
      setAssignments(asgRes.data || []);
      setSubjects(subRes.data || []);
      if (!subjectId && subRes.data?.length > 0) {
        setSubjectId(subRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleToggleComplete = async (asgId) => {
    try {
      const res = await assignmentApi.toggleComplete(asgId, currentUser);
      setAssignments(prev => prev.map(a => a.id === asgId ? res.data : a));
      window.dispatchEvent(new CustomEvent('class_hub_data_updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!dueDate) {
      setFormError('Please provide the Last Date of Submission.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const selectedSubject = subjects.find(s => s.id === subjectId) || subjects[0];
      const fallbackTitle = selectedSubject ? `${selectedSubject.name} Assignment` : 'Class Assignment';
      const finalTitle = title.trim() || fallbackTitle;

      let attachmentData = attachment;

      // Handle optional file upload if a document was selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('semesterId', settings.activeSemester || 'S1');
        formData.append('subjectId', subjectId || selectedSubject?.id || '');
        formData.append('category', 'Assignment');
        formData.append('description', `Assignment: ${finalTitle}`);
        formData.append('uploadedBy', currentUser);
        const fileRes = await fileApi.upload(formData);
        if (fileRes.data?.file) {
          attachmentData = {
            name: fileRes.data.file.name,
            url: fileRes.data.file.fileUrl,
            size: fileRes.data.file.sizeFormatted || fileRes.data.file.size
          };
        }
      }

      if (editingAssignment) {
        await assignmentApi.update(editingAssignment.id, {
          title: finalTitle,
          subjectId: subjectId || selectedSubject?.id,
          moduleNumber: moduleNumber ? parseInt(moduleNumber, 10) : null,
          description,
          dueDate,
          dueTime: dueTime || '23:59',
          attachment: attachmentData
        });
      } else {
        await assignmentApi.create({
          title: finalTitle,
          semesterId: settings.activeSemester || 'S1',
          subjectId: subjectId || selectedSubject?.id,
          moduleNumber: moduleNumber ? parseInt(moduleNumber, 10) : null,
          description,
          dueDate,
          dueTime: dueTime || '23:59',
          attachment: attachmentData,
          createdBy: currentUser
        });
      }

      setCreateModalOpen(false);
      setEditingAssignment(null);
      resetForm();
      await loadAssignments();
      window.dispatchEvent(new CustomEvent('class_hub_data_updated'));
    } catch (err) {
      console.error(err);
      setFormError('Failed to save assignment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setDueTime('23:59');
    setAttachment('');
    setSelectedFile(null);
    setFormError('');
    setModuleNumber('');
  };

  const openEditModal = (asg) => {
    setEditingAssignment(asg);
    setTitle(asg.title || '');
    setSubjectId(asg.subjectId);
    setModuleNumber(asg.moduleNumber || '');
    setDescription(asg.description || '');
    setDueDate(asg.dueDate);
    setDueTime(asg.dueTime || '23:59');
    setAttachment(asg.attachment || '');
    setSelectedFile(null);
    setFormError('');
    setCreateModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await assignmentApi.delete(deleteConfirm.id);
      await loadAssignments();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Filter assignments based on activeTab
  const filteredAssignments = assignments.filter((a) => {
    const isCompletedByMe = (a.completedBy || []).includes(currentUser);

    if (activeTab === 'active') return !a.isExpired;
    if (activeTab === 'due-soon') return !a.isExpired && a.diffDays <= 7;
    if (activeTab === 'upcoming') return !a.isExpired && a.diffDays > 7;
    if (activeTab === 'expired') return a.isExpired;
    if (activeTab === 'completed') return isCompletedByMe;
    return true;
  });

  const activeCount = assignments.filter(a => !a.isExpired).length;
  const expiredCount = assignments.filter(a => a.isExpired).length;
  const completedCount = assignments.filter(a => (a.completedBy || []).includes(currentUser)).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-rose-400" />
            <span>Academic Assignments</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track course deadlines and project submissions. Expired assignments automatically move to History.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingAssignment(null);
            resetForm();
            setCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-950 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Assignment</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            <span>Active Assignments</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('due-soon')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'due-soon'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            Due Soon (≤ 7 days)
          </button>

          <button
            onClick={() => setActiveTab('expired')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'expired'
                ? 'bg-slate-700 text-white shadow-lg'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>Assignment History (Expired)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
              {expiredCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed by Me ({completedCount})</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Semester {settings.activeSemester || 'S1'}
        </div>
      </div>

      {/* Due Date Behavior Reminder Banner */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>
            <strong>Automatic Lifecycle:</strong> Assignments remain in Active until their due timestamp passes, after which they automatically move to <strong>Assignment History</strong> and cease triggering urgent notifications.
          </span>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <CheckSquare className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No assignments in this view</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {activeTab === 'expired' 
              ? 'No expired assignments yet. Completed and passed assignments are stored here for class reference.'
              : 'Create a new assignment to keep the 6 classmates aligned with semester submission deadlines.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAssignments.map((asg) => {
            const isCompletedByMe = (asg.completedBy || []).includes(currentUser);

            return (
              <div
                key={asg.id}
                className={`glass-panel p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-5 ${
                  asg.isExpired 
                    ? 'border-slate-800/60 opacity-80 bg-slate-950/40' 
                    : asg.urgency === 'critical'
                    ? 'border-red-500/50 bg-red-950/10'
                    : asg.urgency === 'urgent'
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
                          {asg.subjectName}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          Module {asg.moduleNumber}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-2.5">
                        {asg.title}
                      </h3>
                    </div>

                    <UrgencyBadge urgency={asg.urgency} text={asg.remainingText} />
                  </div>

                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    {asg.description || 'No additional instructions provided.'}
                  </p>

                  {asg.attachment && (
                    <div className="mt-3">
                      {typeof asg.attachment === 'object' && asg.attachment.url ? (
                        <a
                          href={asg.attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 rounded-xl text-xs text-indigo-200 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Document: <strong className="text-white">{asg.attachment.name}</strong></span>
                        </a>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-indigo-300 font-mono">
                          <span>📎 Attachment: {typeof asg.attachment === 'string' ? asg.attachment : asg.attachment?.name}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer with Creator, Due Date, and Actions */}
                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rose-400" />
                      Due: <strong className="text-slate-200">{asg.dueDate} {asg.dueTime}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      Created by <strong className="text-slate-300">{asg.createdBy}</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                    {/* Mark as Done Toggle & Reminders */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleComplete(asg.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isCompletedByMe
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isCompletedByMe ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span>{isCompletedByMe ? 'Completed by You' : 'Mark as Done'}</span>
                      </button>

                      {/* Reminder & WhatsApp Share */}
                      {!asg.isExpired && (
                        <ReminderDropdown assignment={asg} />
                      )}
                    </div>

                    {/* Edit & Delete for contributors */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(asg)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        title="Edit Assignment"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(asg)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Assignment Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          resetForm();
        }}
        title={editingAssignment ? 'Edit Assignment' : 'Create Class Assignment'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveAssignment} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Subject *
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              required
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* PRIMARY MANDATORY FIELD: Last Date of Submission */}
          <div className="p-3.5 bg-gradient-to-r from-rose-950/40 via-indigo-950/30 to-purple-950/20 border border-rose-700/50 rounded-2xl space-y-2">
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
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    if (formError) setFormError('');
                  }}
                  className="w-full bg-slate-900 border border-rose-500/60 focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Submission Time (Optional)
                </label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Assignment Topic (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Assignment Topic <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] text-slate-500">Defaults to "[Subject] Assignment" if left blank</span>
            </div>
            <input
              type="text"
              placeholder="e.g. Distributed Consensus Report / Lab 1 Proofs (Optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Module (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Module <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <select
              value={moduleNumber}
              onChange={(e) => setModuleNumber(e.target.value ? parseInt(e.target.value, 10) : '')}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="">General / Entire Subject (Optional)</option>
              {[1, 2, 3, 4, 5].map((m) => (
                <option key={m} value={m}>
                  Module {m}
                </option>
              ))}
            </select>
          </div>

          {/* Document Upload (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Attach Document / Questions <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] text-slate-500">Optional</span>
            </div>
            <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-3.5 text-center transition-colors bg-slate-900/40">
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.png,.jpg,.jpeg"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-1 pointer-events-none">
                <FileUp className="w-5 h-5 text-indigo-400" />
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-medium text-emerald-400">Attached: {selectedFile.name}</p>
                    <p className="text-[10px] text-slate-400">{(selectedFile.size / 1024).toFixed(0)} KB • Click to replace</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-300 font-medium">Click or drag document to attach (Optional)</p>
                    <p className="text-[10px] text-slate-500">PDF, Word, or image question sheet</p>
                  </div>
                )}
              </div>
            </div>
            {selectedFile && (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-[11px] text-rose-400 hover:text-rose-300"
              >
                ✕ Remove attached document
              </button>
            )}
          </div>

          {/* Description & Instructions (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description & Submission Instructions <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Provide instructions, report format guidelines, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setCreateModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-xs rounded-xl text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 rounded-xl text-white shadow-lg shadow-rose-950 disabled:opacity-50 transition-all hover:scale-105"
            >
              {saving ? 'Saving...' : (editingAssignment ? 'Save Changes' : 'Create Assignment')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Assignment?"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This cannot be undone.`}
      />
    </div>
  );
};
