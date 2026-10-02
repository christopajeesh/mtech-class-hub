import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('mtech_auth') === 'true';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('mtech_user') || 'Christo';
  });

  const [profilePic, setProfilePic] = useState(() => {
    const user = localStorage.getItem('mtech_user') || 'Christo';
    return localStorage.getItem(`mtech_avatar_${user}`) || null;
  });

  useEffect(() => {
    setProfilePic(localStorage.getItem(`mtech_avatar_${currentUser}`) || null);
  }, [currentUser]);

  const updateProfilePic = (picData) => {
    if (picData) {
      localStorage.setItem(`mtech_avatar_${currentUser}`, picData);
      setProfilePic(picData);
    } else {
      localStorage.removeItem(`mtech_avatar_${currentUser}`);
      setProfilePic(null);
    }
  };

  const [members, setMembers] = useState([
    'Christo', 'Nikitha', 'Mintu', 'Kishore', 'Aneena', 'Alena'
  ]);

  const [settings, setSettings] = useState({
    className: 'MTech Class Hub',
    institution: 'Saintgits College of Engineering',
    activeSemester: 'S1',
    academicYear: '2026–2027',
    accessCode: '2628'
  });

  const [loading, setLoading] = useState(true);

  // Fetch settings & members on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await authApi.getSettings();
        if (res.data) {
          setSettings(res.data);
          if (res.data.members && res.data.members.length > 0) {
            setMembers(res.data.members);
            // Verify current user still in members list
            if (!res.data.members.includes(currentUser)) {
              setCurrentUser(res.data.members[0]);
              localStorage.setItem('mtech_user', res.data.members[0]);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load settings from server, using local fallback:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const login = async (code, selectedMember) => {
    try {
      const res = await authApi.verify(code, selectedMember);
      if (res.data && res.data.success) {
        setIsAuthenticated(true);
        setCurrentUser(selectedMember);
        localStorage.setItem('mtech_auth', 'true');
        localStorage.setItem('mtech_user', selectedMember);
        if (res.data.members) setMembers(res.data.members);
        return { success: true };
      }
      return { success: false, message: 'Invalid access code' };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Access verification failed' 
      };
    }
  };

  const switchUser = (memberName) => {
    setCurrentUser(memberName);
    localStorage.setItem('mtech_user', memberName);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('mtech_auth');
  };

  const refreshSettings = async () => {
    try {
      const res = await authApi.getSettings();
      if (res.data) {
        setSettings(res.data);
        if (res.data.members) setMembers(res.data.members);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        profilePic,
        updateProfilePic,
        members,
        settings,
        loading,
        login,
        logout,
        switchUser,
        refreshSettings
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
