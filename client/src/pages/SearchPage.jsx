import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchApi } from '../services/api.js';
import { useUIModal } from '../components/layout/Layout.jsx';
import { CategoryBadge, UrgencyBadge } from '../components/common/Badge.jsx';
import { 
  Search, 
  FileText, 
  BookOpen, 
  CheckSquare, 
  Megaphone, 
  Eye, 
  Download, 
  ArrowRight,
  Layers
} from 'lucide-react';

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { openPreview } = useUIModal();

  const queryParam = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [results, setResults] = useState({ files: [], subjects: [], assignments: [], announcements: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const executeSearch = async (term) => {
    if (!term || !term.trim()) {
      setResults({ files: [], subjects: [], assignments: [], announcements: [] });
      return;
    }

    setLoading(true);
    try {
      const res = await searchApi.globalSearch(term.trim());
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryParam) {
      setSearchTerm(queryParam);
      executeSearch(queryParam);
    }
  }, [queryParam]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
      executeSearch(searchTerm.trim());
    }
  };

  const totalResults = 
    (results.files?.length || 0) + 
    (results.subjects?.length || 0) + 
    (results.assignments?.length || 0) + 
    (results.announcements?.length || 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header & Big Search Input */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Search className="w-8 h-8 text-indigo-400" />
            <span>Global Academic Search</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search across lecture notes, PPT presentations, question papers, assignment specs, and announcements.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative max-w-3xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
          <input
            type="text"
            placeholder="Search anything (e.g. 'Byzantine', 'Grid Computing', 'Red-Black', 'Internal 1')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 focus:border-indigo-500 rounded-2xl pl-12 pr-28 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none shadow-xl transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
          >
            Search
          </button>
        </form>

        {/* Quick query chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
          <span>Popular searches:</span>
          {['Byzantine', 'Grid Computing', 'Red-Black', 'Internal 1', 'Foster', 'SVD'].map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setSearchTerm(chip);
                setSearchParams({ q: chip });
                executeSearch(chip);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      {queryParam && (
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: `All Results (${totalResults})` },
              { id: 'files', label: `Documents & Notes (${results.files?.length || 0})` },
              { id: 'subjects', label: `Subjects (${results.subjects?.length || 0})` },
              { id: 'assignments', label: `Assignments (${results.assignments?.length || 0})` },
              { id: 'announcements', label: `Announcements (${results.announcements?.length || 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Query: "<strong className="text-white">{queryParam}</strong>"
          </span>
        </div>
      )}

      {/* Search Results Display */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
          Searching class archives...
        </div>
      ) : !queryParam ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <Search className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">Enter a search keyword</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Find documents, assignments, or lecture slides across all semesters and subjects.
          </p>
        </div>
      ) : totalResults === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No matches found for "{queryParam}"</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try searching for topics like "Distributed", "Grid", "Exam", or check the spelling.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Documents Section */}
          {(activeTab === 'all' || activeTab === 'files') && results.files?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Documents & Academic Notes ({results.files.length})</span>
              </h3>
              <div className="space-y-2.5">
                {results.files.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => openPreview(file)}
                    className="glass-panel glass-panel-hover p-4 rounded-2xl border border-slate-800 cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400 flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                          {file.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              const tabParam = file.category?.toLowerCase() === 'ppt' ? 'ppt' : file.category?.toLowerCase() === 'question paper' ? 'question-papers' : file.category?.toLowerCase() === 'syllabus' ? 'syllabus' : 'notes';
                              navigate(`/subjects/${file.subjectId}?tab=${tabParam}`);
                            }}
                            className="hover:text-indigo-300 hover:underline cursor-pointer font-medium text-slate-300"
                            title="Open in this subject tab"
                          >
                            {file.subjectName}
                          </span> • Module {file.moduleNumber || 'All'} • Uploaded by {file.uploadedBy}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <CategoryBadge category={file.category} />
                      <button className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300">
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subjects Section */}
          {(activeTab === 'all' || activeTab === 'subjects') && results.subjects?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Subjects ({results.subjects.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.subjects.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => navigate(`/subjects/${sub.id}`)}
                    className="glass-panel glass-panel-hover p-4 rounded-2xl border border-slate-800 cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300">
                        {sub.code}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors mt-1.5">
                        {sub.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{sub.moduleCount || 5} Modules</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignments Section */}
          {(activeTab === 'all' || activeTab === 'assignments') && results.assignments?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                <span>Assignments ({results.assignments.length})</span>
              </h3>
              <div className="space-y-2.5">
                {results.assignments.map((asg) => (
                  <div
                    key={asg.id}
                    onClick={() => navigate('/assignments')}
                    className="glass-panel p-4 rounded-2xl border border-slate-800 cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{asg.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {asg.subjectName} • Due {asg.dueDate} • Created by {asg.createdBy}
                      </p>
                    </div>
                    <UrgencyBadge urgency={asg.urgency} text={asg.remainingText} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Announcements Section */}
          {(activeTab === 'all' || activeTab === 'announcements') && results.announcements?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                <span>Announcements ({results.announcements.length})</span>
              </h3>
              <div className="space-y-2.5">
                {results.announcements.map((ann) => (
                  <div
                    key={ann.id}
                    onClick={() => navigate('/announcements')}
                    className="glass-panel p-4 rounded-2xl border border-slate-800 cursor-pointer"
                  >
                    <h4 className="text-xs font-bold text-white">{ann.title}</h4>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">{ann.message}</p>
                    <p className="text-[10px] text-slate-500 mt-2">Posted by {ann.createdBy}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
