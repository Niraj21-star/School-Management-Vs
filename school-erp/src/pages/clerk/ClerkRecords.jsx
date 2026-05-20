import { useCallback, useEffect, useState } from 'react';
import {
  getStudents,
  getBonafideHtml,
  getClasses,
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
  const [error, setError] = useState('');

  const openPrintWindow = (html) => {
    const win = window.open('', '_blank', 'width=900,height=700,menubar=no,toolbar=no,location=no');
    if (!win) { alert('Pop-up blocked. Please allow pop-ups for this site.'); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      setTimeout(() => {
        win.focus();
        win.print();
        setTimeout(() => win.close(), 1500);
      }, 400);
    };
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
      const data = await getStudents({ class: selectedClass, limit: 200, status: 'all' });
      setStudents(data);
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

  const handlePrintBonafide = async (student) => {
    setError('');
    setDownloadingId(student.id);

    try {
      const html = await getBonafideHtml(student.id);
      openPrintWindow(html);
    } catch (err) {
      setError(err.message || 'Unable to generate document.');
    } finally {
      setDownloadingId('');
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
      key: 'documents',
      label: 'Documents',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePrintBonafide(row)}
            disabled={downloadingId === row.id}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            {downloadingId === row.id ? 'Generating...' : 'Print Bonafide'}
          </button>
        </div>
      ),
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
