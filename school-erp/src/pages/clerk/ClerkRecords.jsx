import { useCallback, useEffect, useState } from 'react';
import {
  getStudents,
  downloadBonafide,
  downloadTC,
  getClasses,
  createDuplicateTCRequest,
  getDuplicateTCRequests,
} from '../../services/api';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import SelectInput from '../../components/SelectInput';
import { Download } from 'lucide-react';

const ClerkRecords = () => {
  const [students, setStudents] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState('');
  const [requestingId, setRequestingId] = useState('');
  const [duplicateRequestsByStudent, setDuplicateRequestsByStudent] = useState({});
  const [error, setError] = useState('');

  const saveBlob = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    setError('');

    try {
      const classes = await getClasses();
      const options = classes
        .map((item) => ({ value: item.name, label: item.name }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

      setClassOptions(options);
    } catch (err) {
      setError(err.message || 'Unable to load classes.');
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    if (!selectedClass) {
      setStudents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [data, duplicateRequests] = await Promise.all([
        getStudents({ class: selectedClass, limit: 200 }),
        getDuplicateTCRequests(),
      ]);

      const latestByStudent = duplicateRequests.reduce((accumulator, request) => {
        const key = request.studentId;
        if (!key || accumulator[key]) {
          return accumulator;
        }
        accumulator[key] = request;
        return accumulator;
      }, {});

      setStudents(data);
      setDuplicateRequestsByStudent(latestByStudent);
    } catch (err) {
      setError(err.message || 'Unable to load student records.');
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleDownload = async (type, student) => {
    setError('');
    setDownloadingId(`${type}-${student.id}`);

    try {
      const blob = type === 'bonafide'
        ? await downloadBonafide(student.id)
        : await downloadTC(student.id);

      const fileName = `${type}-${student.studentId || student.rollNo || student.id}.pdf`;
      saveBlob(blob, fileName);

      if (type === 'tc') {
        await loadStudents();
      }
    } catch (err) {
      setError(err.message || 'Unable to download document.');
    } finally {
      setDownloadingId('');
    }
  };

  const handleRequestDuplicate = async (student) => {
    const reason = window.prompt('Reason for duplicate TC request (optional):', '');
    if (reason === null) {
      return;
    }

    setError('');
    setRequestingId(student.id);

    try {
      await createDuplicateTCRequest(student.id, reason);
      await loadStudents();
    } catch (err) {
      setError(err.message || 'Unable to submit duplicate TC request.');
    } finally {
      setRequestingId('');
    }
  };

  const columns = [
    { key: 'rollNo', label: 'Roll No' },
    { key: 'name', label: 'Student Name' },
    { key: 'class', label: 'Class' },
    { key: 'gender', label: 'Gender' },
    { key: 'phone', label: 'Phone' },
    { key: 'admissionDate', label: 'Admission Date' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    {
      key: 'tcStatus',
      label: 'TC Status',
      sortable: false,
      render: (_, row) => {
        const tcDownloadCount = row?.raw?.tcCertificate?.downloadCount || 0;
        const issued = tcDownloadCount > 0;

        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${issued ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}
          >
            {issued ? 'TC Issued' : 'Not Issued'}
          </span>
        );
      },
    },
    {
      key: 'documents',
      label: 'Documents',
      sortable: false,
      render: (_, row) => {
        const tcAlreadyIssued = (row?.raw?.tcCertificate?.downloadCount || 0) > 0;
        const tcRequest = duplicateRequestsByStudent[row.id];
        const tcRequestPending = tcRequest?.status === 'pending';
        const tcRequestApproved = tcRequest?.status === 'approved' && !tcRequest?.consumed;

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload('bonafide', row)}
              disabled={downloadingId === `bonafide-${row.id}`}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              {downloadingId === `bonafide-${row.id}` ? 'Downloading...' : 'Download Bonafide'}
            </button>
            <button
              onClick={() => handleDownload('tc', row)}
              disabled={downloadingId === `tc-${row.id}` || (tcAlreadyIssued && !tcRequestApproved)}
              title={tcAlreadyIssued && !tcRequestApproved ? 'Duplicate TC approval required from admin.' : 'Download TC'}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
            >
              {downloadingId === `tc-${row.id}`
                ? 'Downloading...'
                : tcAlreadyIssued
                  ? tcRequestApproved
                    ? 'Download Approved TC'
                    : 'TC Issued'
                  : 'Download TC'}
            </button>
            {tcAlreadyIssued && !tcRequestApproved && (
              <button
                onClick={() => handleRequestDuplicate(row)}
                disabled={requestingId === row.id || tcRequestPending}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-50"
              >
                {requestingId === row.id ? 'Requesting...' : tcRequestPending ? 'Request Pending' : 'Request Duplicate TC'}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  if (loadingClasses || loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" /></div>;

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <PageHeader
        title="Student Records"
        subtitle={selectedClass ? `${students.length} records in Class ${selectedClass}` : 'Select a class to view student list'}
      >
        <Button variant="secondary"><Download className="w-4 h-4" /> Export</Button>
      </PageHeader>

      <div className="card p-4 mb-4">
        <div className="max-w-xs">
          <SelectInput
            label="Select Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={classOptions}
            placeholder="Choose class"
          />
        </div>
      </div>

      {selectedClass ? (
        <DataTable columns={columns} data={students} />
      ) : (
        <div className="card p-8 text-center text-slate-500 text-sm">
          Please select a class to display class-wise student records.
        </div>
      )}
    </div>
  );
};

export default ClerkRecords;
