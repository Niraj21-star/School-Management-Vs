import { useCallback, useEffect, useState } from 'react';
import { getFees, getClasses, recordPayment, getStudents } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import SelectInput from '../../components/SelectInput';
import Button from '../../components/Button';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';


const ClerkFees = () => {
  const [fees, setFees] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ studentId: '', class: '', amount: '', paid: '' });
  const [classStudents, setClassStudents] = useState([]);

  const filteredFees = selectedClass
    ? fees.filter((fee) => fee.class === selectedClass)
    : [];

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    setError('');

    try {
      const classes = await getClasses();
      const options = classes.flatMap((item) =>
        (item.sections || []).map((section) => {
          const value = `${item.name}-${section}`;
          return { value, label: value };
        })
      );

      setClassOptions(options);
    } catch (err) {
      setError(err.message || 'Unable to load classes.');
    } finally {
      setLoadingClasses(false);
    }
  }, []);

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
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  useEffect(() => {
    if (form.class) {
      const [className, section = 'A'] = String(form.class).split('-');
      getStudents({ class: className, section, limit: 200 })
        .then(setClassStudents)
        .catch(() => setClassStudents([]));
    } else {
      setClassStudents([]);
      setForm((prev) => ({ ...prev, studentId: '' }));
    }
  }, [form.class]);

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

      setForm({ studentId: '', class: '', amount: '', paid: '' });
      setModalOpen(false);
    } catch (err) {
      setError(err.message || 'Unable to record payment.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'studentName', label: 'Student' },
    { key: 'class', label: 'Class' },
    { key: 'amount', label: 'Total', render: (val) => formatCurrency(val) },
    { key: 'paid', label: 'Paid', render: (val) => formatCurrency(val) },
    { key: 'due', label: 'Due', render: (val) => <span className={val > 0 ? 'text-red-600 font-medium' : ''}>{formatCurrency(val)}</span> },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'date', label: 'Date' },
  ];

  if (loading || loadingClasses)
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" /></div>;

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <PageHeader
        title="Fee Collection"
        subtitle={selectedClass ? `Showing fee records for ${selectedClass}` : 'Select a class to view fee records'}
      >
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Collect Fee</Button>
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
        <DataTable columns={columns} data={filteredFees} />
      ) : (
        <div className="card p-8 text-center text-slate-500 text-sm">
          Please select a class to display class-wise fee records.
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Collect Fee">
        <div className="space-y-4">
          <SelectInput
            label="Class"
            value={form.class}
            onChange={(e) => setForm({ ...form, class: e.target.value, studentId: '' })}
            placeholder="Select class"
            options={classOptions}
            required
          />
          <SelectInput
            label="Student"
            value={form.studentId}
            onChange={(e) => {
              const studentId = e.target.value;
              const feeRecord = fees.find((f) => f.studentId === studentId);
              setForm({ ...form, studentId, amount: feeRecord ? String(feeRecord.due || feeRecord.amount || '') : '', paid: '' });
            }}
            placeholder={form.class ? 'Select student' : 'Select a class first'}
            options={classStudents.map(s => ({ value: s.id, label: `${s.name} (${s.rollNo})` }))}
            disabled={!form.class}
            required
          />
          <FormInput label="Pending Amount (₹)" type="number" value={form.amount} readOnly />
          <FormInput label="Payment Amount (₹)" type="number" value={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.value })} required />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Record Payment'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default ClerkFees;
