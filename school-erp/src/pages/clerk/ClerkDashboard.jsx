import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getFees } from '../../services/api';
import StatCard from '../../components/StatCard';
import { DollarSign, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const ClerkDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [todaySummary, setTodaySummary] = useState({
    collection: 0,
    receipts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const quickActions = [
    {
      label: 'New Admission',
      desc: 'Register a new student',
      dotColor: 'bg-blue-600',
      path: '/clerk/admissions',
    },
    {
      label: 'Collect Fee',
      desc: 'Record fee payment',
      dotColor: 'bg-emerald-600',
      path: '/clerk/fees',
    },
    {
      label: 'Upload Document',
      desc: 'Upload student documents',
      dotColor: 'bg-amber-600',
      path: '/clerk/documents',
    },
    {
      label: 'Print Receipt',
      desc: 'Generate fee receipt',
      dotColor: 'bg-violet-600',
      path: '/clerk/receipts',
    },
  ];

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [s, fees] = await Promise.all([
        getDashboardStats('CLERK'),
        getFees(),
      ]);

    const today = new Date().toISOString().split('T')[0];

    const receiptsGenerated = fees.reduce((count, fee) => {
      const todayPayments = (fee.paymentHistory || []).filter(
        (payment) => new Date(payment.date).toISOString().split('T')[0] === today
      );
      return count + todayPayments.length;
    }, 0);

      setStats(s);
      setTodaySummary({
        collection: s.todayCollection || 0,
        receipts: receiptsGenerated,
      });
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

      <div className="grid grid-cols-1 gap-4">
        <StatCard title="Today's Collection" value={formatCurrency(stats.todayCollection)} icon={DollarSign} color="bg-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => navigate(a.path)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${a.dotColor}`} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-700">{a.label}</p>
                    <p className="text-xs text-slate-400">{a.desc}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Today's Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Fee collected today</span>
              <span className="text-sm font-bold text-emerald-600">{formatCurrency(todaySummary.collection)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Receipts generated</span>
              <span className="text-sm font-bold text-slate-800">{todaySummary.receipts}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClerkDashboard;
