import React, { useState, useEffect } from 'react';
import { semesterApi, subjectApi, fileApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useUIModal } from '../components/layout/Layout.jsx';
import { CategoryBadge } from '../components/common/Badge.jsx';
import { ConfirmModal } from '../components/common/Modal.jsx';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  FolderTree, 
  Calendar, 
  User, 
  Bot,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotesPage = () => {
  const navigate = useNavigate();
  const { settings, currentUser } = useAuth();
  const { openUploadModal, openPreview } = useUIModal();

  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [files, setFiles] = useState([]);

  const [selectedSemester, setSelectedSemester] = useState('S1');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteFileConfirm, setDeleteFileConfirm] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRepository = async () => {
    try {
      setLoading(true);
      const [semRes, subRes, filesRes] = await Promise.all([
        semesterApi.getAll(),
        subjectApi.getAll(),
        fileApi.getAll()
      ]);
      setSemesters(semRes.data || []);
      setSubjects(subRes.data || []);
      setFiles(filesRes.data || []);
      const active = semRes.data.find(s => s.isActive)?.id || 'S1';
      if (!selectedSemester) setSelectedSemester(active);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepository();
    const handleUpdate = () => loadRepository();
    window.addEventListener('class_hub_data_updated', handleUpdate);
    return () => window.removeEventListener('class_hub_data_updated', handleUpdate);
  }, []);

  const handleDeleteFile = async () => {
    if (!deleteFileConfirm) return;
    try {
      await fileApi.delete(deleteFileConfirm.id);
      await loadRepository();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteFileConfirm(null);
    }
  };

  const currentSemesterSubjects = subjects.filter(s => s.semesterId === selectedSemester);

  // Filter files
  const filteredFiles = files.filter(f => {
    if (f.semesterId !== selectedSemester) return false;
    if (selectedSubject !== 'all' && f.subjectId !== selectedSubject) return false;
    if (selectedModule !== 'all') {
      const modInt = parseInt(selectedModule, 10);
      const matchMod = f.moduleNumber === modInt || f.moduleTag === `Mod ${modInt}` || (f.name && f.name.toLowerCase().includes(`mod ${modInt}`));
      if (!matchMod) return false;
    }
    if (selectedCategory !== 'all' && f.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchDesc = f.description && f.description.toLowerCase().includes(q);
      const matchSubject = f.subjectName && f.subjectName.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchSubject) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-400" />
            <span>Academic Notes Repository</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse notes, lecture slides, question papers, and study material organized hierarchically by semester, subject, module, and category.
          </p>
        </div>

        <button
          onClick={() => openUploadModal({
            semesterId: selectedSemester,
            subjectId: selectedSubject !== 'all' ? selectedSubject : currentSemesterSubjects[0]?.id
          })}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-950 transition-all hover:scale-105"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Hierarchical Filter Strip */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        {/* Level 1: Semester Selector */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
              Semester:
            </span>
            <div className="flex items-center gap-1.5">
              {semesters.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSemester(s.id);
                    setSelectedSubject('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedSemester === s.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {s.code} {s.isActive ? '• Active' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes in this semester..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Level 2: Subject Selector */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          <span className="text-xs font-semibold text-slate-400 flex-shrink-0">Subject:</span>
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              selectedSubject === 'all'
                ? 'bg-slate-700 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            All Subjects ({currentSemesterSubjects.length})
          </button>
          {currentSemesterSubjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.id)}
              className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSubject === sub.id
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/60 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>

        {/* Level 3 & 4: Module and Category Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-400 flex-shrink-0">Module:</span>
            {['all', '1', '2', '3', '4', '5'].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedModule(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedModule === m
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {m === 'all' ? 'All Modules' : `M${m}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto justify-start sm:justify-end">
            <span className="text-xs font-semibold text-slate-400 flex-shrink-0">Category:</span>
            {['all', 'Notes', 'PPT', 'Reference', 'Important Questions', 'Other'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Types' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Found <strong className="text-white">{filteredFiles.length}</strong> academic files</span>
          <span>Showing results for Semester {selectedSemester}</span>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No documents match this filter</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try switching the module or category filter above, or upload new lecture notes to this folder.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => openPreview(file)}
                className="glass-panel glass-panel-hover p-4 rounded-2xl border border-slate-800/80 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-950 to-purple-950 border border-indigo-700/50 flex items-center justify-center text-indigo-300 flex-shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
                        {file.subjectName}
                      </span>
                      {(file.moduleTag || (file.moduleNumber && file.moduleNumber > 0)) && (
                        <span className="text-xs text-slate-400 font-mono">
                          {file.moduleTag || `Mod ${file.moduleNumber}`}
                        </span>
                      )}
                      <CategoryBadge category={file.category} />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors mt-1.5 truncate">
                      {file.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {file.description || 'Academic note shared with class'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800 text-xs">
                  <div className="text-right">
                    <p className="text-slate-300 font-medium flex items-center gap-1 sm:justify-end">
                      <User className="w-3 h-3 text-indigo-400" />
                      {file.uploadedBy}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {file.sizeFormatted} • {new Date(file.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
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
                      <span className="hidden sm:inline">Preview</span>
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
                      className="p-2 bg-slate-900 hover:bg-red-950/60 border border-slate-700 hover:border-red-800 rounded-xl text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete File"
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
        title="Delete Document?"
        message={`Are you sure you want to delete "${deleteFileConfirm?.name}"? All 6 classmates will no longer see this file.`}
      />
    </div>
  );
};
