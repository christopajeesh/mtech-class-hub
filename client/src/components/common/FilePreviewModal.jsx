import React, { useState } from 'react';
import { Modal, ConfirmModal } from './Modal.jsx';
import { CategoryBadge } from './Badge.jsx';
import { Download, FileText, Calendar, User, BookOpen, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FilePreviewModal = ({ isOpen, onClose, file, onDelete }) => {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!file) return null;

  const isPdf = file.fileType?.includes('pdf') || file.name.endsWith('.pdf');
  const isImage = file.fileType?.includes('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
  const isPpt = file.fileType?.includes('presentation') || /\.(ppt|pptx)$/i.test(file.name);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={file.name} maxWidth="max-w-4xl">
      <div className="space-y-6">
        {/* Document Header & Metadata */}
        <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold rounded-lg">
              {file.semesterId || 'S1'} • {file.subjectName || 'Computer Science'}
            </span>
            {(file.moduleTag || (file.moduleNumber && file.moduleNumber > 0)) && (
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg font-mono">
                {file.moduleTag || `Mod ${file.moduleNumber}`}
              </span>
            )}
            <CategoryBadge category={file.category} />
            {file.year && (
              <span className="px-2 py-0.5 bg-slate-800/80 text-slate-400 text-xs rounded border border-slate-700">
                Year: {file.year}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={file.fileUrl || '#'}
              download={file.name}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download ({file.sizeFormatted || 'PDF'})
            </a>

            {onDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 rounded-lg text-xs font-semibold shadow-md transition-colors"
                title="Delete document if wrongly uploaded"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Upload Contributor Info */}
        <div className="flex items-center gap-6 text-xs text-slate-400 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>Uploaded by <strong className="text-slate-200">{file.uploadedBy || 'Christo'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}</span>
          </div>
          <div>Size: <span className="text-slate-300 font-mono">{file.sizeFormatted}</span></div>
        </div>

        {/* Description */}
        {file.description && (
          <div className="text-sm text-slate-300 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 leading-relaxed">
            <p className="text-xs font-medium text-slate-400 mb-1">Academic Overview:</p>
            {file.description}
          </div>
        )}

        {/* In-App Preview Content */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden min-h-[360px] flex flex-col">
          {file.fileUrl && isPdf ? (
            <div className="h-[460px] w-full">
              <iframe
                src={`${file.fileUrl}#toolbar=0`}
                className="w-full h-full border-0 rounded-xl"
                title={file.name}
              />
            </div>
          ) : file.fileUrl && isImage ? (
            <div className="p-4 flex items-center justify-center min-h-[360px]">
              <img src={file.fileUrl} alt={file.name} className="max-h-[440px] max-w-full rounded-lg object-contain" />
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  Document Content & Syllabus Text
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Full Text
                </span>
              </div>

              {file.extractedContent ? (
                <div className="font-mono text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800/60 whitespace-pre-wrap max-h-[380px] overflow-y-auto custom-scrollbar">
                  {file.extractedContent}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-medium text-slate-300">{file.name}</h4>
                  <p className="text-xs text-slate-400 max-w-md">
                    This file is ready for download and offline reading. Click below to download.
                  </p>
                  <a
                    href={file.fileUrl || '#'}
                    download={file.name}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-900/40 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Complete File
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          isOpen={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            onDelete(file);
          }}
          title="Delete Document?"
          message={`Are you sure you want to delete "${file.name}"? If wrongly uploaded, it will be removed permanently for all classmates.`}
          confirmText="Yes, Delete"
          isDanger={true}
        />
      )}
    </Modal>
  );
};
