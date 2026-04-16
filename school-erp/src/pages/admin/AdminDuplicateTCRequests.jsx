import { useCallback, useEffect, useState } from 'react';
import { getDuplicateTCRequests, reviewDuplicateTCRequest } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';

const AdminDuplicateTCRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = statusFilter === 'all' ? {} : { status: statusFilter };
      const data = await getDuplicateTCRequests(params);
      setRequests(data);
    } catch (err) {
      setError(err.message || 'Unable to load duplicate TC requests.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleReview = async (request, action) => {
    const comment = window.prompt(
      action === 'approve'
        ? 'Optional comment for approval:'
        : 'Optional reason for rejection:',
      ''
    );

    if (comment === null) {
      return;
    }

    setError('');
    setReviewingId(request.id);

    try {
      const updated = await reviewDuplicateTCRequest(request.id, action, comment);
      setRequests((prev) => prev.map((item) => (item.id === request.id ? updated : item)));
    } catch (err) {
      setError(err.message || 'Unable to review duplicate TC request.');
    } finally {
      setReviewingId('');
    }
  };

  const columns = [
    { key: 'studentCode', label: 'Student ID' },
    { key: 'studentName', label: 'Student Name' },
    { key: 'requestedByName', label: 'Requested By' },
    { key: 'createdAt', label: 'Requested On' },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => {
        if (row.consumed) {
          return <StatusBadge status="Used" />;
        }

        return <StatusBadge status={value} />;
      },
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (value) => <span className="text-xs text-slate-600">{value || '-'}</span>,
    },
    {
      key: 'adminComment',
      label: 'Admin Comment',
      render: (value) => <span className="text-xs text-slate-600">{value || '-'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => {
        if (row.status !== 'pending') {
          return <span className="text-xs text-slate-400">Reviewed</span>;
        }

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleReview(row, 'approve')}
              disabled={reviewingId === row.id}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              {reviewingId === row.id ? 'Saving...' : 'Approve'}
            </button>
            <button
              onClick={() => handleReview(row, 'reject')}
              disabled={reviewingId === row.id}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <PageHeader
        title="Duplicate TC Requests"
        subtitle={`${requests.length} request${requests.length === 1 ? '' : 's'}`}
      />

      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ].map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${statusFilter === filter.value ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={requests} searchable={false} />
    </div>
  );
};

export default AdminDuplicateTCRequests;
