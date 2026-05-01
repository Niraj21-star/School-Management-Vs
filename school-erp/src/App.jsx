import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import LoginPage from './auth/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';

/* Admin Pages */
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminFees from './pages/admin/AdminFees';
import AdminExams from './pages/admin/AdminExams';
import AdminTimetable from './pages/admin/AdminTimetable';
import AdminNotices from './pages/admin/AdminNotices';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminDuplicateTCRequests from './pages/admin/AdminDuplicateTCRequests';
import AdminClasses from './pages/admin/AdminClasses';

/* Clerk Pages */
import ClerkDashboard from './pages/clerk/ClerkDashboard';
import ClerkAdmissions from './pages/clerk/ClerkAdmissions';
import ClerkRecords from './pages/clerk/ClerkRecords';
import ClerkFees from './pages/clerk/ClerkFees';
import ClerkDocuments from './pages/clerk/ClerkDocuments';
import ClerkReceipts from './pages/clerk/ClerkReceipts';

/* Teacher Pages */
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherMarks from './pages/teacher/TeacherMarks';
import TeacherTimetable from './pages/teacher/TeacherTimetable';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="classes" element={<AdminClasses />} />
            <Route path="teachers" element={<AdminTeachers />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="fees" element={<AdminFees />} />
            <Route path="exams" element={<AdminExams />} />
            <Route path="timetable" element={<AdminTimetable />} />
            <Route path="notices" element={<AdminNotices />} />
            <Route path="tc-requests" element={<AdminDuplicateTCRequests />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Clerk Routes */}
          <Route
            path="/clerk"
            element={
              <ProtectedRoute allowedRoles={['CLERK']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ClerkDashboard />} />
            <Route path="admissions" element={<ClerkAdmissions />} />
            <Route path="records" element={<ClerkRecords />} />
            <Route path="fees" element={<ClerkFees />} />
            <Route path="documents" element={<ClerkDocuments />} />
            <Route path="receipts" element={<ClerkReceipts />} />
          </Route>

          {/* Teacher Routes */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="marks" element={<TeacherMarks />} />
            <Route path="timetable" element={<TeacherTimetable />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
