import { useCallback, useEffect, useState } from 'react';
import { getAllStudentsForReports, getAttendance, getExpenses, getFees, getTeachers } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import { Download, BarChart3, TrendingUp, Users } from 'lucide-react';
import { exportRowsToPdf } from '../../utils/pdfExport';
import { formatCurrency } from '../../utils/helpers';

const REPORT_CARDS = [
  { key: 'student-performance', title: 'Student Performance Report', desc: 'View detailed academic performance reports for all students.', icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
  { key: 'attendance', title: 'Attendance Report', desc: 'Class-wise and student-wise attendance analysis.', icon: BarChart3, color: 'bg-emerald-50 text-emerald-600' },
  { key: 'fees', title: 'Fee Collection Report', desc: 'Comprehensive fee collection and defaulter reports.', icon: Download, color: 'bg-amber-50 text-amber-600' },
  { key: 'staff', title: 'Staff Report', desc: 'Teacher and staff information reports.', icon: Users, color: 'bg-violet-50 text-violet-600' },
];

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expenseSummary, setExpenseSummary] = useState(null);
  const [activeReport, setActiveReport] = useState('');

  const loadExpenseSummary = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getExpenses();
      setExpenseSummary(data?.summary || null);
    } catch (err) {
      setError(err.message || 'Unable to load expense summary.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenseSummary();
  }, [loadExpenseSummary]);

  const handleExportAll = () => {
    exportRowsToPdf({
      title: 'Admin Reports Summary',
      fileName: `admin-reports-${Date.now()}.pdf`,
      summaryLines: [
        `Total Expenses: ${expenseSummary?.totalAmount || 0}`,
        `Total Records: ${expenseSummary?.totalRecords || 0}`,
      ],
      columns: [
        { header: 'Report Name', key: 'title' },
        { header: 'Description', key: 'desc' },
      ],
      rows: REPORT_CARDS,
    });
  };

  const handleGenerateReport = async (reportKey) => {
    setActiveReport(reportKey);
    setError('');

    try {
      if (reportKey === 'student-performance') {
        const students = await getAllStudentsForReports({ pageSize: 100 });

        exportRowsToPdf({
          title: 'Student Performance Report',
          fileName: `student-performance-${Date.now()}.pdf`,
          summaryLines: [`Total Students: ${students.length}`],
          columns: [
            { header: 'Roll No', key: 'rollNo' },
            { header: 'Student Name', key: 'name' },
            { header: 'Class', key: 'class' },
            { header: 'Gender', key: 'gender' },
            { header: 'Status', key: 'status' },
            { header: 'Fee Status', key: 'feeStatus' },
          ],
          rows: students,
        });

        return;
      }

      if (reportKey === 'attendance') {
        const attendance = await getAttendance();
        const avgAttendance = attendance.length
          ? (attendance.reduce((sum, row) => sum + row.percentage, 0) / attendance.length).toFixed(1)
          : '0.0';

        exportRowsToPdf({
          title: 'Attendance Report',
          fileName: `attendance-report-${Date.now()}.pdf`,
          summaryLines: [
            `Total Classes: ${attendance.length}`,
            `Average Attendance: ${avgAttendance}%`,
          ],
          columns: [
            { header: 'Class', key: 'class' },
            { header: 'Date', key: 'date' },
            { header: 'Present', key: 'present' },
            { header: 'Absent', key: 'absent' },
            { header: 'Total', key: 'total' },
            { header: 'Attendance %', key: 'percentageText' },
          ],
          rows: attendance.map((item) => ({
            ...item,
            percentageText: `${item.percentage}%`,
          })),
        });

        return;
      }

      if (reportKey === 'fees') {
        const fees = await getFees();
        const totalCollected = fees.reduce((sum, row) => sum + row.paid, 0);
        const totalDue = fees.reduce((sum, row) => sum + row.due, 0);

        exportRowsToPdf({
          title: 'Fee Collection Report',
          fileName: `fee-collection-${Date.now()}.pdf`,
          summaryLines: [
            `Total Records: ${fees.length}`,
            `Total Collected: ${formatCurrency(totalCollected)}`,
            `Total Due: ${formatCurrency(totalDue)}`,
          ],
          columns: [
            { header: 'Student', key: 'studentName' },
            { header: 'Class', key: 'class' },
            { header: 'Total Fee', key: 'amountText' },
            { header: 'Paid', key: 'paidText' },
            { header: 'Due', key: 'dueText' },
            { header: 'Status', key: 'status' },
            { header: 'Date', key: 'date' },
          ],
          rows: fees.map((item) => ({
            ...item,
            amountText: formatCurrency(item.amount),
            paidText: formatCurrency(item.paid),
            dueText: formatCurrency(item.due),
          })),
        });

        return;
      }

      if (reportKey === 'staff') {
        const teachers = await getTeachers();

        exportRowsToPdf({
          title: 'Staff Report',
          fileName: `staff-report-${Date.now()}.pdf`,
          summaryLines: [`Total Teachers: ${teachers.length}`],
          columns: [
            { header: 'Teacher Name', key: 'name' },
            { header: 'Subject', key: 'subject' },
            { header: 'Phone', key: 'phone' },
            { header: 'Email', key: 'email' },
            { header: 'Classes', key: 'classesText' },
            { header: 'Status', key: 'status' },
          ],
          rows: teachers.map((item) => ({
            ...item,
            classesText: item.classes?.join(', ') || '—',
          })),
        });
      }
    } catch (err) {
      setError(err.message || 'Unable to generate report.');
    } finally {
      setActiveReport('');
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <PageHeader
        title="Reports"
        subtitle={loading ? 'Loading report summary...' : `Total Expenses: ${expenseSummary?.totalAmount || 0}`}
      >
        <Button variant="secondary" onClick={handleExportAll}><Download className="w-4 h-4" /> Export All</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORT_CARDS.map((report) => (
          <div key={report.title} className="card p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${report.color}`}>
                <report.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-800">{report.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{report.desc}</p>
                <button
                  onClick={() => handleGenerateReport(report.key)}
                  disabled={activeReport === report.key}
                  className="text-sm text-slate-700 font-medium mt-3 hover:underline disabled:text-slate-400 disabled:no-underline"
                >
                  {activeReport === report.key ? 'Generating...' : 'Generate Report →'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminReports;
