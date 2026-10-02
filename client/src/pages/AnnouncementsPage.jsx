import React, { useState, useEffect } from 'react';
import { announcementApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Modal, ConfirmModal } from '../components/common/Modal.jsx';
import { 
  Megaphone, 
  Plus, 
  Pin, 
  PinOff, 
  Trash2, 
  User, 
  Calendar, 
  Paperclip,
  CheckCircle2
} from 'lucide-react';

export const AnnouncementsPage = () => {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await announcementApi.getAll();
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    try {
      await announcementApi.create({
        title,
        message,
        isPinned,
        attachmentName: attachmentName.trim() || null,
        createdBy: currentUser
      });

      setCreateModalOpen(false);
      setTitle('');
      setMessage('');
      setIsPinned(false);
      setAttachmentName('');
      await loadAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePin = async (id) => {
    try {
      await announcementApi.togglePin(id);
      await loadAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await announcementApi.delete(deleteConfirm.id);
      await loadAnnouncements();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-indigo-400" />
            <span>Class Announcements</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time updates, autonomous timetable circulars, seminar deadlines, and professor notices.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-950 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>+ Post Announcement</span>
        </button>
      </div>

      {/* Announcements Stream */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
            <Megaphone className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Announcements Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Any of the 6 classmates can post important class notices, exam schedules, or project deadlines.
            </p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className={`glass-panel p-6 rounded-2xl border transition-all space-y-4 ${
                ann.isPinned
                  ? 'border-indigo-500/50 bg-indigo-950/20 shadow-lg shadow-indigo-950/20'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  {ann.isPinned && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[11px] font-semibold">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {ann.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePin(ann.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                    title={ann.isPinned ? 'Unpin' : 'Pin to top of Dashboard'}
                  >
                    {ann.isPinned ? <PinOff className="w-4 h-4 text-indigo-400" /> : <Pin className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(ann)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {ann.message}
              </p>

              {ann.attachmentName && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-indigo-300 font-mono">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attachment: {ann.attachmentName}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Posted by <strong className="text-slate-200">{ann.createdBy}</strong>
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(ann.createdAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Post Class Announcement"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Announcement Title</label>
            <input
              type="text"
              placeholder="e.g. Autonomous First Internal Timetable Announced"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Message Content</label>
            <textarea
              rows={4}
              placeholder="Provide exact timings, syllabus details, exam rooms, or submission instructions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Attachment (Optional Name)</label>
            <input
              type="text"
              placeholder="e.g. Internal_Exam_Time_Table.pdf"
              value={attachmentName}
              onChange={(e) => setAttachmentName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pinCheck"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <label htmlFor="pinCheck" className="text-xs font-medium text-slate-300 cursor-pointer">
              Pin to the top of Class Dashboard
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs rounded-xl text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-950"
            >
              Publish Announcement
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Announcement?"
        message={`Are you sure you want to remove "${deleteConfirm?.title}"?`}
      />
    </div>
  );
};
