import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal.jsx';
import { semesterApi, subjectApi, fileApi, assignmentApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { UserAvatar } from './UserAvatar.jsx';
import { 
  Upload, 
  FileUp, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  X, 
  Plus, 
  Files, 
  FileCheck, 
  BookOpen, 
  Layers 
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { id: 'Notes', label: 'Lecture Notes / Module Notes' },
  { id: 'Question Paper', label: 'Question Bank / Previous Exam Papers' },
  { id: 'PPT', label: 'Presentations & Slides (PPT)' },
  { id: 'Important Questions', label: 'Important Questions & Key Answers' },
  { id: 'Reference', label: 'Textbooks & Reference Books' },
  { id: 'Syllabus', label: 'Syllabus & Course Structure' },
  { id: 'Assignment', label: 'Assignment & Deadline Reminder' },
  { id: 'Other', label: 'Other Academic Files / Code / Manuals' }
];

const EXAM_TYPES = [
  'Internal 1',
  'Internal 2',
  'Model Exam',
  'End Semester',
  'Previous Year',
  'Other'
];

// Helper to get formatted badge and color for any file extension
const getFileTypeBadge = (fileName = '') => {
  const ext = fileName.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf':
      return { tag: 'PDF', bg: 'bg-rose-950/80 text-rose-300 border-rose-700/60' };
    case 'doc':
    case 'docx':
      return { tag: 'DOC', bg: 'bg-blue-950/80 text-blue-300 border-blue-700/60' };
    case 'ppt':
    case 'pptx':
      return { tag: 'PPT', bg: 'bg-orange-950/80 text-orange-300 border-orange-700/60' };
    case 'xls':
    case 'xlsx':
    case 'csv':
      return { tag: 'SHEET', bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
    case 'gif':
    case 'svg':
      return { tag: 'IMAGE', bg: 'bg-pink-950/80 text-pink-300 border-pink-700/60' };
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return { tag: 'ARCHIVE', bg: 'bg-amber-950/80 text-amber-300 border-amber-700/60' };
    case 'py':
    case 'c':
    case 'cpp':
    case 'java':
    case 'js':
    case 'html':
    case 'json':
    case 'sql':
      return { tag: 'CODE', bg: 'bg-purple-950/80 text-purple-300 border-purple-700/60' };
    default:
      return { tag: ext ? ext.toUpperCase() : 'FILE', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
  }
};

const formatSize = (bytes) => {
  if (!bytes) return '0 KB';
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
};

export const UploadModal = ({ isOpen, onClose, onUploadSuccess, initialSemester, initialSubject, initialModule, initialCategory }) => {
  const { currentUser, profilePic, settings } = useAuth();
  const fileInputRef = useRef(null);

  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [semesterId, setSemesterId] = useState(initialSemester || 'S1');
  const [subjectId, setSubjectId] = useState(initialSubject || '');
  const [moduleNumber, setModuleNumber] = useState(initialModule ? String(initialModule) : '');
  const [category, setCategory] = useState(initialCategory || 'Notes');
  const [description, setDescription] = useState('');
  const [examType, setExamType] = useState('Internal 1');
  const [year, setYear] = useState(new Date().getFullYear());
  
  // Multi-file support
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Assignment fields
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentTopic, setAssignmentTopic] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  // Load semesters and subjects
  useEffect(() => {
    if (!isOpen) return;
    const loadData = async () => {
      try {
        const [semRes, subRes] = await Promise.all([
          semesterApi.getAll(),
          subjectApi.getAll()
        ]);
        setSemesters(semRes.data || []);
        setSubjects(subRes.data || []);
        
        const activeSem = initialSemester || settings.activeSemester || 'S1';
        setSemesterId(activeSem);

        const validSubjects = (subRes.data || []).filter(s => s.semesterId === activeSem);
        if (initialSubject && validSubjects.some(s => s.id === initialSubject)) {
          setSubjectId(initialSubject);
        } else if (validSubjects.length > 0) {
          setSubjectId(validSubjects[0].id);
        }

        if (initialCategory) {
          setCategory(initialCategory);
        }
      } catch (err) {
        console.error('Failed to load upload metadata:', err);
      }
    };
    loadData();
  }, [isOpen, initialSemester, initialSubject, initialCategory, settings.activeSemester]);

  // When semester changes, update available subjects (excluding DI which is purely for assignments)
  const filteredSubjects = subjects.filter(s => 
    s.semesterId === semesterId && s.id !== 'subj-di' && s.code !== 'DI' && s.slot !== 'DI'
  );

  useEffect(() => {
    if (filteredSubjects.length > 0 && (!subjectId || !filteredSubjects.some(s => s.id === subjectId))) {
      setSubjectId(filteredSubjects[0].id);
    }
  }, [semesterId, subjects]);

  const selectedSubjectObj = subjects.find(s => s.id === subjectId);
  const maxModules = selectedSubjectObj?.moduleCount || 5;
  const isDISubject = selectedSubjectObj?.code === 'DI' || selectedSubjectObj?.slot === 'DI' || selectedSubjectObj?.id === 'subj-di';
  
  const availableCategories = isDISubject 
    ? CATEGORY_OPTIONS.filter(c => c.id !== 'Syllabus') 
    : CATEGORY_OPTIONS;

  useEffect(() => {
    if (isDISubject && category === 'Syllabus') {
      setCategory('Notes');
    }
  }, [isDISubject, category]);

  // Handle file additions
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const addedFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...addedFiles]);
      setError('');
    }
    // reset input value so re-selecting the same file works
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...droppedFiles]);
      setError('');
    }
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
  };

  const totalFilesSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (category === 'Assignment') {
      if (!assignmentDueDate) {
        setError('Please provide the Last Date of Submission.');
        return;
      }
    } else {
      if (selectedFiles.length === 0) {
        setError('Please select at least one document to upload.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      let uploadedFileObj = null;

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });
        // also pass single file reference for backward compatibility
        formData.append('file', selectedFiles[0]);

        formData.append('semesterId', semesterId);
        formData.append('subjectId', subjectId);
        if (moduleNumber) {
          formData.append('moduleNumber', moduleNumber);
          formData.append('moduleTag', `Mod ${moduleNumber}`);
        }
        formData.append('category', category);
        formData.append('description', description || assignmentTopic);
        formData.append('uploadedBy', currentUser);
        if (category === 'Question Paper') {
          formData.append('examType', examType);
          formData.append('year', year);
        }

        const res = await fileApi.upload(formData);
        if (res.data?.success) {
          uploadedFileObj = res.data.file;
          setUploadedCount(res.data.count || selectedFiles.length);
        }
      }

      // If category is Assignment, register it in assignments store
      if (category === 'Assignment') {
        const asgTitle = assignmentTopic.trim() || description.trim() || `${selectedSubjectObj?.name || 'Class'} Assignment`;
        await assignmentApi.create({
          title: asgTitle,
          semesterId: semesterId,
          subjectId: subjectId,
          moduleNumber: moduleNumber ? parseInt(moduleNumber, 10) : null,
          description: description || '',
          dueDate: assignmentDueDate,
          dueTime: '23:59',
          attachment: uploadedFileObj ? {
            name: uploadedFileObj.name,
            url: uploadedFileObj.fileUrl,
            size: uploadedFileObj.sizeFormatted || uploadedFileObj.size
          } : null,
          createdBy: currentUser
        });
        window.dispatchEvent(new CustomEvent('class_hub_data_updated'));
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedFiles([]);
        setDescription('');
        setAssignmentDueDate('');
        setAssignmentTopic('');
        onClose();
        if (onUploadSuccess && uploadedFileObj) onUploadSuccess(uploadedFileObj);
        window.dispatchEvent(new CustomEvent('class_hub_data_updated'));
      }, 1000);
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Academic Materials & Notes" maxWidth="max-w-2xl">
      {success ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-center justify-center text-emerald-400 animate-in zoom-in">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-semibold text-white">
            {uploadedCount > 1 ? `${uploadedCount} Documents Shared Successfully!` : 'Material Shared Successfully!'}
          </h4>
          <p className="text-xs text-slate-400">
            Uploaded by <strong className="text-slate-200">{currentUser}</strong> for the class workspace.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Grid Selection: Semester, Subject, Module, Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Semester
              </label>
              <select
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) {s.isActive ? '• Active' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {filteredSubjects.length === 0 ? (
                  <option value="">No subjects in {semesterId}</option>
                ) : (
                  filteredSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Module <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                {moduleNumber && (
                  <button
                    type="button"
                    onClick={() => setModuleNumber('')}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Clear (General)
                  </button>
                )}
              </div>
              <select
                value={moduleNumber}
                onChange={(e) => setModuleNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">General / Entire Subject (No specific module)</option>
                {Array.from({ length: maxModules }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Module {m}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500">Quick select:</span>
                {Array.from({ length: maxModules }, (_, i) => i + 1).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModuleNumber(moduleNumber === String(m) || moduleNumber === m ? '' : String(m))}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      moduleNumber === String(m) || moduleNumber === m
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    Mod {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Question Bank details */}
          {category === 'Question Paper' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Exam / Test Type</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  {EXAM_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Exam Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* Conditional Assignment Deadline & Topic */}
          {category === 'Assignment' && (
            <div className="p-3.5 bg-gradient-to-r from-rose-950/40 via-indigo-950/30 to-purple-950/20 border border-rose-700/50 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-2 text-rose-300">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Assignment Submission Deadline * (Required)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Last Date of Submission *
                  </label>
                  <input
                    type="date"
                    required
                    value={assignmentDueDate}
                    onChange={(e) => setAssignmentDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-rose-500/60 focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Assignment Topic / Problem Set <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Distributed Consensus Report"
                    value={assignmentTopic}
                    onChange={(e) => setAssignmentTopic(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Multi-Document Upload & Drop Zone (Supports All Formats) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                {category === 'Assignment' ? 'Attach Documents / Questions (Optional)' : 'Select Documents to Upload'}
              </label>
              {selectedFiles.length > 0 && (
                <span className="text-[11px] text-indigo-400 font-medium">
                  {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} ({formatSize(totalFilesSize)})
                </span>
              )}
            </div>

            {/* Dropzone container */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01]'
                  : 'border-slate-700/80 hover:border-indigo-500/70 bg-slate-900/40 hover:bg-slate-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-white font-medium">
                    {category === 'Assignment'
                      ? 'Click or drag documents here to attach (PDF, Word, Code, etc.)'
                      : 'Click or drag files here to upload (Multiple files allowed)'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Supports all formats: PDF, PPT, Word (.docx), Excel, Images, Code, ZIP, RAR, Text & more
                  </p>
                </div>
              </div>
            </div>

            {/* Selected files queue list */}
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pb-1">
                  <span>Queued Documents ({selectedFiles.length}):</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      Add More Files
                    </button>
                    <button
                      type="button"
                      onClick={clearAllFiles}
                      className="text-rose-400 hover:text-rose-300 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {selectedFiles.map((file, idx) => {
                  const badge = getFileTypeBadge(file.name);
                  return (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs gap-2 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${badge.bg} flex-shrink-0`}>
                          {badge.tag}
                        </span>
                        <div className="min-w-0">
                          <p className="text-slate-200 font-medium truncate max-w-xs sm:max-w-md">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {formatSize(file.size)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors flex-shrink-0"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Description / Topic Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Topic / Material Title <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Module 1 Complete Notes, KTU Series 1 Question Bank, Lab Manual..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Contributor Tag & Submit Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <UserAvatar user={currentUser} src={profilePic} size="xs" />
              <span>Uploading as: <strong className="text-indigo-300 font-medium">{currentUser}</strong></span>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-900/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {loading 
                  ? 'Uploading...' 
                  : selectedFiles.length > 1
                    ? `Share ${selectedFiles.length} Documents`
                    : 'Share with Class'}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
