import { useCallback, useEffect, useState } from 'react';
import { getAttendance } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { Download } from 'lucide-react';
import Button from '../../components/Button';
import { exportRowsToPdf } from '../../utils/pdfExport';

const AdminAttendance = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const attendanceData = await getAttendance();
      setData(attendanceData);
    } catch (err) {
      setError(err.message || 'Unable to load attendance.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const columns = [
    { key: 'class', label: 'Class' },
    { key: 'date', label: 'Date' },
    { key: 'present', label: 'Present' },
    { key: 'absent', label: 'Absent' },
    { key: 'total', label: 'Total' },
    {
      key: 'percentage', label: 'Attendance %',
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-100 rounded-full max-w-[100px]">
            <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${val}%` }} />
          </div>
          <span className="text-sm font-medium">{val}%</span>
        </div>
      ),
    },
  ];

  const avgAttendance = data.length
    ? (data.reduce((s, d) => s + d.percentage, 0) / data.length).toFixed(1)
    : '0.0';

  const handleExport = () => {
    exportRowsToPdf({
      title: 'Attendance Overview Report',
      fileName: `attendance-overview-${Date.now()}.pdf`,
      summaryLines: [`Average Attendance: ${avgAttendance}%`],
      columns: [
        { header: 'Class', key: 'class' },
        { header: 'Date', key: 'date' },
        { header: 'Present', key: 'present' },
        { header: 'Absent', key: 'absent' },
        { header: 'Total', key: 'total' },
        { header: 'Attendance %', key: 'percentageText' },
      ],
      rows: data.map((item) => ({
        ...item,
        percentageText: `${item.percentage}%`,
      })),
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" /></div>;



  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <PageHeader title="Attendance Overview" subtitle={`Average: ${avgAttendance}%`}>
        <Button variant="secondary" onClick={handleExport}><Download className="w-4 h-4" /> Export Report</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 text-center">
          <p className="text-sm text-slate-500">Total Present Today</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{data.reduce((s, d) => s + d.present, 0)}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-sm text-slate-500">Total Absent Today</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{data.reduce((s, d) => s + d.absent, 0)}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-sm text-slate-500">Average Attendance</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{avgAttendance}%</p>
        </div>
      </div>

      <DataTable columns={columns} data={data} searchable={false} />
    </div>
  );
};

export default AdminAttendance;
