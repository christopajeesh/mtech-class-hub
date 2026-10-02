import React, { useState, createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { UploadModal } from '../common/UploadModal.jsx';
import { FilePreviewModal } from '../common/FilePreviewModal.jsx';
import { fileApi } from '../../services/api.js';

const UIModalContext = createContext(null);

export const useUIModal = () => useContext(UIModalContext);

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadParams, setUploadParams] = useState({});
  const [previewFile, setPreviewFile] = useState(null);

  const openUploadModal = (params = {}) => {
    setUploadParams(params);
    setUploadModalOpen(true);
  };

  const openPreview = (file) => {
    setPreviewFile(file);
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  const handleDeletePreviewFile = async (fileToDelete) => {
    if (!fileToDelete) return;
    try {
      await fileApi.delete(fileToDelete.id);
      closePreview();
      window.dispatchEvent(new CustomEvent('class_hub_data_updated'));
    } catch (err) {
      console.error('Failed to delete file', err);
    }
  };

  return (
    <UIModalContext.Provider
      value={{
        openUploadModal,
        openPreview
      }}
    >
      <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col antialiased">
        {/* Ambient background glows */}
        <div className="fixed inset-0 radial-glow-top pointer-events-none z-0" />
        <div className="fixed inset-0 radial-glow-purple pointer-events-none z-0" />

        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="lg:pl-64 flex flex-col flex-1 relative z-10">
          <Topbar
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenUpload={() => openUploadModal()}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>

        {/* Global Upload Modal */}
        <UploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          initialSemester={uploadParams.semesterId}
          initialSubject={uploadParams.subjectId}
          initialModule={uploadParams.moduleNumber}
          initialCategory={uploadParams.category}
          onUploadSuccess={() => {
            // Can trigger event or refresh
            window.dispatchEvent(new CustomEvent('class_hub_data_updated'));
          }}
        />

        {/* Global File Preview Modal */}
        <FilePreviewModal
          isOpen={Boolean(previewFile)}
          onClose={closePreview}
          file={previewFile}
          onDelete={handleDeletePreviewFile}
        />
      </div>
    </UIModalContext.Provider>
  );
};
