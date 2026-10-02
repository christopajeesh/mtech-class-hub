import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { Layout } from './components/layout/Layout.jsx';
import { AccessGate } from './pages/AccessGate.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { SemesterSubjectsPage } from './pages/SemesterSubjectsPage.jsx';
import { SubjectDetailPage } from './pages/SubjectDetailPage.jsx';
import { AssignmentsPage } from './pages/AssignmentsPage.jsx';
import { NotesPage } from './pages/NotesPage.jsx';
import { QuestionPapersPage } from './pages/QuestionPapersPage.jsx';
import { AnnouncementsPage } from './pages/AnnouncementsPage.jsx';
import { SearchPage } from './pages/SearchPage.jsx';
import { RecentlyAddedPage } from './pages/RecentlyAddedPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';

const AuthenticatedApp = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center text-slate-400 text-xs">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Opening MTech Class Hub...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AccessGate />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="semesters" element={<SemesterSubjectsPage />} />
        <Route path="subjects/:subjectId" element={<SubjectDetailPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="question-papers" element={<QuestionPapersPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="recent" element={<RecentlyAddedPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </BrowserRouter>
  );
}
