import React, { useState, useEffect } from 'react';
import { fileApi, subjectApi, semesterApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useUIModal } from '../components/layout/Layout.jsx';
import { 
  Files, 
  Upload, 
  Calendar, 
  User, 
  Download, 
  Eye, 
  Filter, 
  BookOpen, 
  Award, 
  Search,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EXAM_TYPES = [
  'All Types',
  'Internal 1',
  'Internal 2',
  'Model Exam',
  'End Semester',
  'Previous Year'
];

export const QuestionPapersPage = () => {
  const navigate = useNavigate();
  const { settings } = useAuth();
  const { openUploadModal, openPreview } = useUIModal();

  const [questionPapers, setQuestionPapers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('S1');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedExamType, setSelectedExamType] = useState('All Types');
  const [selectedYear, setSelectedYear] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [filesRes, subRes] = await Promise.all([
        fileApi.getAll({ category: 'Question Paper' }),
        subjectApi.getAll()
      ]);
      setQuestionPapers(filesRes.data || []);
      setSubjects(subRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('class_hub_data_updated', handleUpdate);
    return () => window.removeEventListener('class_hub_data_updated', handleUpdate);
  }, []);

  const years = Array.from(new Set(questionPapers.map(q => q.year).filter(Boolean))).sort((a, b) => b - a);

  // Filter papers
  const filteredPapers = questionPapers.filter((qp) => {
    if (selectedSemester !== 'all' && qp.semesterId !== selectedSemester) return false;
    if (selectedSubject !== 'all' && qp.subjectId !== selectedSubject) return false;
    if (selectedExamType !== 'All Types' && qp.examType !== selectedExamType) return false;
    if (selectedYear !== 'all' && qp.year !== parseInt(selectedYear, 10)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!qp.name.toLowerCase().includes(q) && !qp.subjectName?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Files className="w-8 h-8 text-emerald-400" />
            <span>Question Papers Vault</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Autonomous Internal Test papers, KTU Previous Years, and Model Exams compiled for Saintgits M.Tech CS.
          </p>
        </div>

        <button
          onClick={() => openUploadModal({
            semesterId: selectedSemester !== 'all' ? selectedSemester : 'S1',
            category: 'Question Paper'
          })}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all hover:scale-105"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Question Paper</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Semester Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="all">All Semesters</option>
              <option value="S1">S1 (Current)</option>
              <option value="S2">S2</option>
              <option value="S3">S3</option>
              <option value="S4">S4</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Exam Type
            </label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
            >
              {EXAM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Examination Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="all">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search question papers by topic, exam name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Question Papers Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Found <strong className="text-white">{filteredPapers.length}</strong> official question papers</span>
          <span>Saintgits Autonomous & KTU Archives</span>
        </div>

        {filteredPapers.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
            <Files className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Question Papers Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No papers match your selected filters. Upload Internal or End-Semester question papers to help your classmates prepare.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                onClick={() => openPreview(paper)}
                className="glass-panel glass-panel-hover p-5 rounded-2xl border border-slate-800/80 cursor-pointer flex flex-col justify-between group space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">
                      {paper.examType || 'Official Exam'}
                    </span>
                    {paper.year && (
                      <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {paper.year}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors mt-2.5">
                    {paper.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    {paper.subjectName} • Module {paper.moduleNumber || 'All'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Added by <strong className="text-slate-300">{paper.uploadedBy}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openPreview(paper);
                      }}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 flex items-center gap-1 text-xs"
                    >
                      <Eye className="w-3 h-3 text-emerald-400" />
                      <span>View</span>
                    </button>
                    <a
                      href={paper.fileUrl || '#'}
                      download={paper.name}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
