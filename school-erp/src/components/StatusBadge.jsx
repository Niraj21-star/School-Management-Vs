const StatusBadge = ({ status }) => {
  const styles = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Inactive: 'bg-slate-50 text-slate-600 border-slate-200',
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Overdue: 'bg-red-50 text-red-700 border-red-200',
    Partial: 'bg-amber-50 text-amber-700 border-amber-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
    Published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Draft: 'bg-slate-50 text-slate-600 border-slate-200',
    'On Leave': 'bg-amber-50 text-amber-700 border-amber-200',
    Present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Absent: 'bg-red-50 text-red-700 border-red-200',
    High: 'bg-red-50 text-red-700 border-red-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
