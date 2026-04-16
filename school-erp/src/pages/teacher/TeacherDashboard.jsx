import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getTimetable } from '../../services/api';
import StatCard from '../../components/StatCard';
import { BookOpen, ClipboardCheck, FileText, ArrowRight } from 'lucide-react';

const getTodayName = () => {
  const map = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return map[new Date().getDay()];
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [s, timetable] = await Promise.all([
        getDashboardStats('TEACHER'),
        getTimetable(),
      ]);

      const today = getTodayName();
      setStats(s);
      setTodaySchedule(
        timetable
          .filter((item) => item.day === today)
          .sort((a, b) => Number(a.period || 0) - Number(b.period || 0))
      );
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" /></div>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Today's Classes" value={stats.todayClasses} icon={BookOpen} color="bg-blue-600" />
        <StatCard title="Pending Attendance" value={stats.pendingAttendance} icon={ClipboardCheck} color="bg-amber-600" />
        <StatCard title="Pending Homework" value={stats.pendingHomework} icon={FileText} color="bg-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="card">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">Today's Schedule</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {todaySchedule.map((item) => (
              <div key={item.period} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600">
                    P{item.period}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.subject}</p>
                    <p className="text-xs text-slate-500">{item.class}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{item.time}</span>
              </div>
            ))}
            {todaySchedule.length === 0 && (
              <div className="px-5 py-8 text-sm text-slate-400">No classes assigned for today.</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { label: 'Mark Attendance', desc: 'Mark today\'s attendance for your classes', path: '/teacher/attendance', color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Upload Homework', desc: 'Assign homework to your classes', path: '/teacher/homework', color: 'bg-blue-50 text-blue-600' },
              { label: 'Enter Exam Marks', desc: 'Enter exam marks for your students', path: '/teacher/marks', color: 'bg-violet-50 text-violet-600' },
            ].map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => navigate(a.path)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-700">{a.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
