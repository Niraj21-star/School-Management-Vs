import { memo, useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROLE_LABELS, ROLE_COLORS } from '../utils/constants';
import { getInitials } from '../utils/helpers';
import { ChevronDown, LogOut, User } from 'lucide-react';

const Navbar = ({ title }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>

      <div className="flex items-center gap-4">
        {/* Role badge */}
        <span className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${ROLE_COLORS[role]}`}>
          {ROLE_LABELS[role]}
        </span>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
              {getInitials(user?.name || 'User')}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700">{user?.name}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 animate-in fade-in slide-in-from-top-1">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4" /> Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default memo(Navbar);
