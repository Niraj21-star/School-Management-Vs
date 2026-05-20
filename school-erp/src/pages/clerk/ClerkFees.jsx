import { useCallback, useEffect, useState } from 'react';
import { getFees, getClasses, recordPayment, getStudents, downloadFeeReceipt } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import SelectInput from '../../components/SelectInput';
import Button from '../../components/Button';
import { Plus, Printer } from 'lucide-react';
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
  
  const defaultBreakdown = {
    admission: '', bdf: '', tuition: '', exam: '', computer: '', sport: '', medical: '',
    craft: '', library: '', laboratory: '', misc: '', other: '', late: '', discount: ''
  };
  
  const [form, setForm] = useState({ studentId: '', class: '', amount: '', paid: '', breakdown: { ...defaultBreakdown } });
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
      getStudents({ class: className, section, limit: 200, status: 'all' })
        .then(setClassStudents)
        .catch(() => setClassStudents([]));
    } else {
      setClassStudents([]);
      setForm((prev) => ({ ...prev, studentId: '', amount: '', paid: '', breakdown: { ...defaultBreakdown } }));
    }
  }, [form.class]);

  // Auto-calculate total paid based on breakdown inputs
  useEffect(() => {
    const sum = [
      'admission', 'bdf', 'tuition', 'exam', 'computer', 'sport',
      'medical', 'craft', 'library', 'laboratory', 'misc', 'other', 'late'
    ].reduce((acc, key) => acc + (Number(form.breakdown[key]) || 0), 0);
    
    const discount = Number(form.breakdown.discount) || 0;
    const total = sum - discount;
    
    if (total !== Number(form.paid) && (total > 0 || form.paid !== '')) {
      setForm(prev => ({ ...prev, paid: total > 0 ? String(total) : '' }));
    }
  }, [form.breakdown]);

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

      setForm({ studentId: '', class: '', amount: '', paid: '', breakdown: { ...defaultBreakdown } });
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
    {
      key: 'actions',
      label: 'Receipt',
      render: (_, row) => (
        <button
          onClick={async () => {
            try {
              const blob = await downloadFeeReceipt(row.studentId);
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `Fee_Receipt_${row.studentName}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            } catch (err) {
              alert(err.message || 'Error generating receipt');
            }
          }}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          title="Print Last Receipt"
        >
          <Printer className="w-4 h-4" />
        </button>
      ),
    },
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
              setForm({ ...form, studentId, amount: feeRecord ? String(feeRecord.due || feeRecord.amount || '') : '', paid: '', breakdown: { ...defaultBreakdown } });
            }}
            placeholder={form.class ? 'Select student' : 'Select a class first'}
            options={classStudents.map(s => ({ value: s.id, label: `${s.name} (${s.rollNo})` }))}
            disabled={!form.class}
            required
          />
          <FormInput
            label="Pending Amount (₹)"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            readOnly={!!form.studentId && fees.some((f) => f.studentId === form.studentId)}
          />
          
          <div className="pt-2">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">Block-Wise Fee Breakdown</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'admission', label: 'Admission Fee' },
                { key: 'bdf', label: 'B.D.F.' },
                { key: 'tuition', label: 'Tuition Fee' },
                { key: 'exam', label: 'Exam Fee' },
                { key: 'computer', label: 'Computer Fee' },
                { key: 'sport', label: 'Sport Fee' },
                { key: 'medical', label: 'Medical Charges' },
                { key: 'craft', label: 'Craft Fee' },
                { key: 'library', label: 'Library' },
                { key: 'laboratory', label: 'Laboratories' },
                { key: 'misc', label: 'Misc.' },
                { key: 'other', label: 'Other' },
                { key: 'late', label: 'Late Fee' },
                { key: 'discount', label: 'Discount' },
              ].map(field => (
                <FormInput
                  key={field.key}
                  label={field.label}
                  type="number"
                  value={form.breakdown[field.key]}
                  onChange={(e) => setForm(f => ({ ...f, breakdown: { ...f.breakdown, [field.key]: e.target.value } }))}
                />
              ))}
            </div>
          </div>
          
          <div className="pt-3 border-t border-slate-100 mt-2">
            <FormInput label="Total Payment Amount (₹) [Auto-calculated]" type="number" value={form.paid} readOnly required className="bg-slate-50 font-bold" />
          </div>
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
