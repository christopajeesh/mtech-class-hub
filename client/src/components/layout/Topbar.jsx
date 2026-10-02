import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Upload, 
  LogOut,
  Camera,
  RotateCcw,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { UserAvatar, PRESET_AVATARS } from '../common/UserAvatar.jsx';

export const Topbar = ({ onOpenSidebar, onOpenUpload }) => {
  const navigate = useNavigate();
  const { currentUser, profilePic, updateProfilePic, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Center-crop square
        const minSide = Math.min(img.width, img.height);
        const startX = (img.width - minSide) / 2;
        const startY = (img.height - minSide) / 2;

        ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, size, size);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        updateProfilePic(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    // Reset input so re-selecting same file triggers change
    e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800/80 bg-[#090D16]/80 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 lg:hidden"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes, PDFs, PPTs, questions, assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 hover:bg-slate-900 focus:bg-slate-900 border border-slate-700/70 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none transition-all"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-900/30 transition-all hover:scale-105"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload Material</span>
          <span className="sm:hidden">Upload</span>
        </button>

        {/* Hidden File Input for Profile Picture Upload */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handleImageFileChange} 
          className="hidden" 
        />

        {/* Profile Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 transition-all text-xs font-medium text-slate-200"
          >
            <UserAvatar user={currentUser} src={profilePic} size="xs" />
            <span className="hidden md:inline font-semibold">{currentUser}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setUserDropdownOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-72 glass-dropdown rounded-2xl p-3 z-50 animate-in fade-in zoom-in-95 border border-slate-700/80 shadow-2xl bg-[#0F1424]">
                {/* Profile Card Header */}
                <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 mb-3">
                  <div className="relative group mb-2">
                    <UserAvatar user={currentUser} src={profilePic} size="lg" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload photo"
                      className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {currentUser}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    M.Tech Student Member
                  </p>
                </div>

                {/* Profile Picture Actions */}
                <div className="space-y-2 mb-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload Profile Picture</span>
                  </button>

                  {/* Preset Avatars Row */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 px-0.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        Choose Avatar
                      </span>
                      {profilePic && (
                        <button
                          onClick={() => updateProfilePic(null)}
                          className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                          title="Reset to default initial avatar"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-6 gap-1.5 p-1 bg-slate-900/50 rounded-xl border border-slate-800/60">
                      {PRESET_AVATARS.map((preset) => {
                        const Icon = preset.icon;
                        const isSelected = profilePic === `preset:${preset.id}`;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => updateProfilePic(`preset:${preset.id}`)}
                            title={preset.label}
                            className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 scale-105' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Logout */}
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Direct Logout Button */}
        <button
          onClick={logout}
          title="Log Out of Class Hub"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800/80 transition-colors text-xs font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
