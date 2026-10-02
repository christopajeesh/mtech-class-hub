import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import { semesterApi, subjectApi, fileApi, assignmentApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { UserAvatar } from './UserAvatar.jsx';
import { Upload, FileUp, CheckCircle, AlertCircle, FileText, Calendar } from 'lucide-react';

const CATEGORIES = [
  'Syllabus',
  'Notes',
  'PPT',
  'Reference',
  'Question Paper',
  'Important Questions',
  'Assignment',
  'Other'
];

const EXAM_TYPES = [
  'Internal 1',
  'Internal 2',
  'Model Exam',
  'End Semester',
  'Previous Year',
  'Other'
];

export const UploadModal = ({ isOpen, onClose, onUploadSuccess, initialSemester, initialSubject, initialModule, initialCategory }) => {
  const { currentUser, profilePic, settings } = useAuth();
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [semesterId, setSemesterId] = useState(initialSemester || 'S1');
  const [subjectId, setSubjectId] = useState(initialSubject || '');
  const [moduleNumber, setModuleNumber] = useState(initialModule ? String(initialModule) : '');
  const [category, setCategory] = useState(initialCategory || 'Notes');
  const [description, setDescription] = useState('');
  const [examType, setExamType] = useState('Internal 1');
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedFile, setSelectedFile] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentTopic, setAssignmentTopic] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
        
        // Pick initial semester if none
        const activeSem = initialSemester || settings.activeSemester || 'S1';
        setSemesterId(activeSem);

        // Pick initial subject
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
    ? CATEGORIES.filter(c => c !== 'Syllabus') 
    : CATEGORIES;

  useEffect(() => {
    if (isDISubject && category === 'Syllabus') {
      setCategory('Notes');
    }
  }, [isDISubject, category]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (category === 'Assignment') {
      if (!assignmentDueDate) {
        setError('Please provide the Last Date of Submission.');
        return;
      }
    } else {
      if (!selectedFile && !notesText.trim()) {
        setError('Please select a file or enter notes content to upload.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      let uploadedFileObj = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('semesterId', semesterId);
        formData.append('subjectId', subjectId);
        if (moduleNumber) {
          formData.append('moduleNumber', moduleNumber);
          formData.append('moduleTag', `Mod ${moduleNumber}`);
        }
        formData.append('category', category);
        formData.append('description', description || assignmentTopic);
        formData.append('uploadedBy', currentUser);
        formData.append('notesText', notesText);
        if (category === 'Question Paper') {
          formData.append('examType', examType);
          formData.append('year', year);
        }

        const res = await fileApi.upload(formData);
        if (res.data?.success) {
          uploadedFileObj = res.data.file;
        }
      } else if (category !== 'Assignment' && notesText.trim()) {
        const formData = new FormData();
        const modPrefix = moduleNumber ? `Mod ${moduleNumber} ` : '';
        formData.append('name', `${selectedSubjectObj?.name || 'Class'} ${modPrefix}Notes.txt`);
        formData.append('semesterId', semesterId);
        formData.append('subjectId', subjectId);
        if (moduleNumber) {
          formData.append('moduleNumber', moduleNumber);
          formData.append('moduleTag', `Mod ${moduleNumber}`);
        }
        formData.append('category', category);
        formData.append('description', description);
        formData.append('uploadedBy', currentUser);
        formData.append('notesText', notesText);
        const res = await fileApi.upload(formData);
        if (res.data?.success) {
          uploadedFileObj = res.data.file;
        }
      }

      // If category is Assignment, register it in assignments store
      if (category === 'Assignment') {
        const asgTitle = assignmentTopic.trim() || `${selectedSubjectObj?.name || 'Class'} Assignment`;
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
        setSelectedFile(null);
        setDescription('');
        setNotesText('');
        setAssignmentDueDate('');
        setAssignmentTopic('');
        onClose();
        if (onUploadSuccess && uploadedFileObj) onUploadSuccess(uploadedFileObj);
        window.dispatchEvent(new CustomEvent('class_hub_data_updated'));
      }, 900);
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please check file format and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Academic Material" maxWidth="max-w-xl">
      {success ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-center justify-center text-emerald-400 animate-in zoom-in">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-semibold text-white">Material Shared Successfully!</h4>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Module <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                {moduleNumber && (
                  <button
                    type="button"
                    onClick={() => setModuleNumber('')}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Clear (No Mod)
                  </button>
                )}
              </div>
              <select
                value={moduleNumber}
                onChange={(e) => setModuleNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">General / Entire Subject (Optional)</option>
                {Array.from({ length: maxModules }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Mod {m} (Module {m})
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] text-slate-500">Quick mention:</span>
                {Array.from({ length: maxModules }, (_, i) => i + 1).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModuleNumber(moduleNumber === String(m) || moduleNumber === m ? '' : String(m))}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors ${
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
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Question Paper details */}
          {category === 'Question Paper' && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Exam Type</label>
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
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Examination Year</label>
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
                  Assignment Deadline * (Required)
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
                    Assignment Topic <span className="text-slate-500 font-normal">(Optional)</span>
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

          {/* File Drag & Drop / Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                {category === 'Assignment' ? 'Attach Document / Questions (Optional)' : 'Select Document (PDF, PPT, DOC, Image, TXT)'}
              </label>
              {category === 'Assignment' && (
                <span className="text-[10px] text-slate-500">Document upload is optional</span>
              )}
            </div>
            <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-4 text-center transition-colors bg-slate-900/40">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.png,.jpg,.jpeg"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
                <FileUp className="w-7 h-7 text-indigo-400" />
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-medium text-white">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Click to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-300 font-medium">
                      {category === 'Assignment' ? 'Click or drag optional question document' : 'Click or drag a file to upload'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {category === 'Assignment' ? 'Leave empty if you only want to set a deadline reminder' : 'Supports PDFs, PowerPoint decks, question papers & notes'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {selectedFile && (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-[11px] text-rose-400 hover:text-rose-300 mt-1"
              >
                ✕ Remove attached document
              </button>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Short Description / Topic Summary
            </label>
            <input
              type="text"
              placeholder="e.g. Byzantine fault tolerance notes & Lamport logical clock proofs"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Optional Notes Text */}
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Notes Text / Important Summary (Optional)
              </span>
              <span className="text-[10px] text-slate-500">Optional text extraction</span>
            </label>
            <textarea
              rows={3}
              placeholder="Paste important notes, formulas, or key syllabus topics..."
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono resize-none"
            />
          </div>

          {/* Contributor Tag */}
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
                {loading ? 'Uploading...' : 'Share with Class'}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
