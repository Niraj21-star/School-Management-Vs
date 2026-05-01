import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  students: 'Students',
  classes: 'Classes & Sections',
  teachers: 'Teachers',
  attendance: 'Attendance',
  fees: 'Fee Management',
  exams: 'Exams & Results',
  timetable: 'Timetable',
  notices: 'Notices',
  'tc-requests': 'Duplicate TC Requests',
  reports: 'Reports',
  settings: 'Settings',
  admissions: 'Student Admissions',
  records: 'Student Records',
  documents: 'Documents',
  receipts: 'Receipts',
  marks: 'Exam Marks',
};

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const segment = location.pathname.split('/').pop();
  const pageTitle = PAGE_TITLES[segment] || 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <Navbar title={pageTitle} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
