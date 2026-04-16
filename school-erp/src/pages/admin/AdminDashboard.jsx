import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getRecentActivity } from '../../services/api';
import StatCard from '../../components/StatCard';
import { Users, GraduationCap, DollarSign, ArrowRight, ClipboardCheck } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const quickActions = [
    { label: 'Add New Student', icon: Users, color: 'text-blue-600 bg-blue-50', path: '/admin/students' },
    { label: 'Record Fee Payment', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50', path: '/admin/fees' },
    { label: 'Post Notice', icon: GraduationCap, color: 'text-violet-600 bg-violet-50', path: '/admin/notices' },
    { label: 'View Reports', icon: ClipboardCheck, color: 'text-amber-600 bg-amber-50', path: '/admin/reports' },
  ];

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [s, a] = await Promise.all([getDashboardStats('ADMIN'), getRecentActivity()]);
      setStats(s);
      setActivity(a);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Present Students Today"
          value={`${stats.presentStudents || 0} / ${stats.totalStudents || 0}`}
          icon={Users}
          color="bg-blue-600"
          trend="up"
          trendValue={`${stats.todayMarkedStudents || 0} attendance entries marked`}
        />
        <StatCard
          title="Present Teachers Today"
          value={`${stats.presentTeachersToday || 0} / ${stats.totalTeachers || 0}`}
          icon={GraduationCap}
          color="bg-violet-600"
          trend="up"
          trendValue="Based on classes with attendance marked today"
        />
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">Recent Activity</h3>
            <button className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {activity.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-slate-700">{item.action}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap ml-4">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left"
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
