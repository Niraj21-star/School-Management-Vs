import { useCallback, useEffect, useMemo, useState } from 'react';
import { getFees, recordPayment } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import SelectInput from '../../components/SelectInput';
import Button from '../../components/Button';
import { Plus, Download } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { exportRowsToPdf } from '../../utils/pdfExport';

const DEFAULT_CLASS_OPTIONS = [
  { value: '10-A', label: '10-A' },
  { value: '10-B', label: '10-B' },
  { value: '9-A', label: '9-A' },
  { value: '9-B', label: '9-B' },
  { value: '8-A', label: '8-A' },
  { value: '8-B', label: '8-B' },
  { value: '7-A', label: '7-A' },
  { value: '7-B', label: '7-B' },
];

const AdminFees = () => {
  const [fees, setFees] = useState([]);
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ studentName: '', class: '', amount: '', paid: '', status: 'Pending' });

  const loadFees = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getFees();
      setFees(data);
    } catch (err) {
      setError(err.message || 'Unable to load fee records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const classTabs = useMemo(() => {
    const counts = fees.reduce((accumulator, item) => {
      const className = item.class || 'Unassigned';
      accumulator[className] = (accumulator[className] || 0) + 1;
      return accumulator;
    }, {});

    return ['All Classes', ...Object.keys(counts).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))].map((className) => ({
      name: className,
      count: className === 'All Classes' ? fees.length : counts[className] || 0,
    }));
  }, [fees]);

  const filteredFees = useMemo(() => {
    if (selectedClass === 'All Classes') {
      return fees;
    }

    return fees.filter((item) => item.class === selectedClass);
  }, [fees, selectedClass]);

  useEffect(() => {
    if (selectedClass !== 'All Classes' && !classTabs.some((tab) => tab.name === selectedClass)) {
      setSelectedClass('All Classes');
    }
  }, [classTabs, selectedClass]);

  const classOptions = useMemo(() => {
    const derivedOptions = classTabs
      .filter((tab) => tab.name !== 'All Classes')
      .map((tab) => ({ value: tab.name, label: tab.name }));

    return derivedOptions.length ? derivedOptions : DEFAULT_CLASS_OPTIONS;
  }, [classTabs]);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const updatedRecord = await recordPayment(form);
      setFees((prev) => {
        const existingIndex = prev.findIndex((item) => item.studentId === updatedRecord.studentId);
        if (existingIndex === -1) return [updatedRecord, ...prev];

        const next = [...prev];
        next[existingIndex] = updatedRecord;
        return next;
      });

      setForm({ studentName: '', class: '', amount: '', paid: '', status: 'Pending' });
      setModalOpen(false);
    } catch (err) {
      setError(err.message || 'Unable to save payment.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'studentName', label: 'Student' },
    { key: 'class', label: 'Class' },
    { key: 'amount', label: 'Total Fee', render: (val) => formatCurrency(val) },
    { key: 'paid', label: 'Paid', render: (val) => formatCurrency(val) },
    { key: 'due', label: 'Due', render: (val) => <span className={val > 0 ? 'text-red-600 font-medium' : ''}>{formatCurrency(val)}</span> },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'date', label: 'Date' },
  ];

  const handleExport = () => {
    exportRowsToPdf({
      title: `Fee Management Report${selectedClass === 'All Classes' ? '' : ` - ${selectedClass}`}`,
      fileName: `fees-${selectedClass.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`,
      summaryLines: [
        `Class Filter: ${selectedClass}`,
        `Total Collected: ${formatCurrency(totalCollected)}`,
        `Total Due: ${formatCurrency(totalDue)}`,
        `Total Records: ${filteredFees.length}`,
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
      rows: filteredFees.map((row) => ({
        ...row,
        amountText: formatCurrency(row.amount),
        paidText: formatCurrency(row.paid),
        dueText: formatCurrency(row.due),
      })),
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" /></div>;

  const totalCollected = filteredFees.reduce((s, f) => s + f.paid, 0);
  const totalDue = filteredFees.reduce((s, f) => s + f.due, 0);

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <PageHeader
        title="Fee Management"
        subtitle={selectedClass === 'All Classes' ? 'Manage student fee records class wise' : `Fee records for ${selectedClass}`}
      >
        <Button variant="secondary" onClick={handleExport}><Download className="w-4 h-4" /> Export</Button>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Record Payment</Button>
      </PageHeader>

      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Class wise fee records</h3>
            <p className="text-sm text-slate-500">Select a class tab to view student fee data for that class.</p>
          </div>
          <div className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filteredFees.length}</span> records
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {classTabs.map((tab) => {
            const active = tab.name === selectedClass;

            return (
              <button
                key={tab.name}
                type="button"
                onClick={() => setSelectedClass(tab.name)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                <span>{tab.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5"><p className="text-sm text-slate-500">Total Collected</p><p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCollected)}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Total Due</p><p className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(totalDue)}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Total Records</p><p className="text-2xl font-bold text-slate-800 mt-1">{filteredFees.length}</p></div>
      </div>

      {filteredFees.length > 0 ? (
        <DataTable columns={columns} data={filteredFees} />
      ) : (
        <div className="card p-10 text-center text-slate-500">
          No fee records found for this class.
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Fee Payment">
        <div className="space-y-4">
          <FormInput label="Student Name" value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} required />
          <SelectInput
            label="Class"
            value={form.class}
            onChange={(e) => setForm({ ...form, class: e.target.value })}
            placeholder="Select class"
            options={classOptions}
            required
          />
          <FormInput label="Total Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <FormInput label="Amount Paid" type="number" value={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.value })} required />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Payment'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminFees;
