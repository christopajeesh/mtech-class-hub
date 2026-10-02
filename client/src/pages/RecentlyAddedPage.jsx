import React, { useState, useEffect } from 'react';
import { fileApi } from '../services/api.js';
import { useUIModal } from '../components/layout/Layout.jsx';
import { CategoryBadge } from '../components/common/Badge.jsx';
import { Clock, FileText, Eye, Download, User, Calendar, Upload, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../components/common/Modal.jsx';

export const RecentlyAddedPage = () => {
  const { openPreview, openUploadModal } = useUIModal();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteFileConfirm, setDeleteFileConfirm] = useState(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const res = await fileApi.getAll();
      setFiles(res.data || []);
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

  useEffect(() => {
    loadFiles();
    const handleUpdate = () => loadFiles();
    window.addEventListener('class_hub_data_updated', handleUpdate);
    return () => window.removeEventListener('class_hub_data_updated', handleUpdate);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-400" />
            <span>Recently Added Materials</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Chronological stream of all academic documents, question papers, and slides uploaded by the 6 classmates.
          </p>
        </div>

        <button
          onClick={() => openUploadModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-950 transition-all hover:scale-105"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-3">
        {files.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
            <Clock className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Uploads Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Shared files from any classmate will appear here in chronological order.
            </p>
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              onClick={() => openPreview(file)}
              className="glass-panel glass-panel-hover p-4 sm:p-5 rounded-2xl border border-slate-800 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start sm:items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-indigo-950/70 border border-indigo-800/60 flex items-center justify-center text-indigo-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
                      {file.semesterId} • {file.subjectName}
                    </span>
                    <span className="text-xs text-slate-400">
                      Module {file.moduleNumber}
                    </span>
                    <CategoryBadge category={file.category} />
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors mt-1.5 truncate">
                    {file.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                    {file.description || 'Shared class document'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800 text-xs">
                <div className="text-right">
                  <p className="text-slate-300 font-medium flex items-center gap-1 sm:justify-end">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    Uploaded by <strong className="text-white">{file.uploadedBy}</strong>
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {new Date(file.uploadedAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} • {file.sizeFormatted}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openPreview(file);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Preview</span>
                  </button>
                  <a
                    href={file.fileUrl || '#'}
                    download={file.name}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
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
          ))
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
