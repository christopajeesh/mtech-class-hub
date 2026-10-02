import React from 'react';
import { User, GraduationCap, Terminal, Cpu, Sparkles, Shield, Star } from 'lucide-react';

export const PRESET_AVATARS = [
  { id: 'scholar', label: 'Scholar', icon: GraduationCap, bg: 'from-indigo-600 to-blue-600', color: 'text-indigo-100' },
  { id: 'coder', label: 'Developer', icon: Terminal, bg: 'from-emerald-600 to-teal-600', color: 'text-emerald-100' },
  { id: 'systems', label: 'Systems', icon: Cpu, bg: 'from-cyan-600 to-blue-600', color: 'text-cyan-100' },
  { id: 'ai', label: 'Researcher', icon: Sparkles, bg: 'from-purple-600 to-pink-600', color: 'text-purple-100' },
  { id: 'security', label: 'Security', icon: Shield, bg: 'from-rose-600 to-red-600', color: 'text-rose-100' },
  { id: 'star', label: 'Leader', icon: Star, bg: 'from-amber-600 to-orange-600', color: 'text-amber-100' },
];

export const UserAvatar = ({ 
  user = 'Christo', 
  src = null, 
  size = 'md', 
  className = '',
  showBorder = true 
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl'
  };

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10'
  };

  // If a preset avatar id is saved (e.g. 'preset:scholar')
  if (src && src.startsWith('preset:')) {
    const presetId = src.replace('preset:', '');
    const preset = PRESET_AVATARS.find(p => p.id === presetId) || PRESET_AVATARS[0];
    const IconComponent = preset.icon;
    return (
      <div 
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full bg-gradient-to-tr ${preset.bg} flex items-center justify-center ${preset.color} shadow-sm overflow-hidden flex-shrink-0 ${showBorder ? 'border border-slate-700/80 ring-2 ring-indigo-500/20' : ''} ${className}`}
        title={user}
      >
        <IconComponent className={iconSizes[size] || iconSizes.md} />
      </div>
    );
  }

  // If a real image/data URL is saved
  if (src) {
    return (
      <div 
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full overflow-hidden flex-shrink-0 bg-slate-800 ${showBorder ? 'border border-slate-700/80 ring-2 ring-indigo-500/20' : ''} ${className}`}
      >
        <img 
          src={src} 
          alt={user} 
          className="w-full h-full object-cover" 
          onError={(e) => {
            // Fallback to initial if image fails
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Default Avatar (initial with modern sleek gradient)
  const initial = user ? user.charAt(0).toUpperCase() : 'C';
  return (
    <div 
      className={`${sizeClasses[size] || sizeClasses.md} rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold tracking-tight shadow-sm flex-shrink-0 ${showBorder ? 'border border-indigo-400/30 ring-2 ring-indigo-500/20' : ''} ${className}`}
      title={user}
    >
      <span>{initial}</span>
    </div>
  );
};
