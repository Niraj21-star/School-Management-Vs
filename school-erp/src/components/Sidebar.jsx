import { memo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import {
  LayoutDashboard, Users, GraduationCap, ClipboardCheck,
  DollarSign, FileText, CalendarDays, Bell, BarChart3, Settings,
  LogOut, ChevronLeft, ChevronRight, UserCheck, Upload, Receipt,
  FileUp, PenSquare, Clock
} from 'lucide-react';

const MENU_CONFIG = {
  [ROLES.ADMIN]: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Classes & Sections', path: '/admin/classes', icon: CalendarDays },
    { label: 'Teachers', path: '/admin/teachers', icon: GraduationCap },
    { label: 'Attendance', path: '/admin/attendance', icon: ClipboardCheck },
    { label: 'Fee Management', path: '/admin/fees', icon: DollarSign },
    { label: 'Exams & Results', path: '/admin/exams', icon: FileText },
    { label: 'Timetable', path: '/admin/timetable', icon: CalendarDays },
    { label: 'Notices', path: '/admin/notices', icon: Bell },
    { label: 'Duplicate TC Requests', path: '/admin/tc-requests', icon: FileUp },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ],
  [ROLES.CLERK]: [
    { label: 'Dashboard', path: '/clerk/dashboard', icon: LayoutDashboard },
    { label: 'Student Admissions', path: '/clerk/admissions', icon: UserCheck },
    { label: 'Student Records', path: '/clerk/records', icon: Users },
    { label: 'Fee Collection', path: '/clerk/fees', icon: DollarSign },
    { label: 'Documents', path: '/clerk/documents', icon: FileUp },
    { label: 'Receipts', path: '/clerk/receipts', icon: Receipt },
  ],
  [ROLES.TEACHER]: [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'Mark Attendance', path: '/teacher/attendance', icon: ClipboardCheck },
    { label: 'Exam Marks', path: '/teacher/marks', icon: PenSquare },
    { label: 'View Timetable', path: '/teacher/timetable', icon: Clock },
  ],
};

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const menuItems = MENU_CONFIG[role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`fixed top-0 left-0 h-screen bg-slate-900 text-white z-30 flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50">
        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-wide">School ERP</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Management</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'} ${collapsed ? 'justify-center px-0' : ''}`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-3 border-t border-slate-700/50">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 uppercase">{role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title="Logout"
          className={`sidebar-link sidebar-link-inactive w-full text-red-300 hover:text-red-200 hover:bg-red-900/30 ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
};

export default memo(Sidebar);
