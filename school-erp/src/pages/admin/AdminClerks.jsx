import { useCallback, useEffect, useState } from 'react';
import { createStaff, getClerks, updateStaffById, deleteStaffById } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import SelectInput from '../../components/SelectInput';
import Button from '../../components/Button';
import { Plus, Download, Pencil, Trash2 } from 'lucide-react';
import { exportRowsToPdf } from '../../utils/pdfExport';

const AdminClerks = () => {
  const [clerks, setClerks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editClerk, setEditClerk] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', status: 'Active' });

  const loadClerks = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getClerks();
      setClerks(data);
    } catch (err) {
      setError(err.message || 'Unable to load clerks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClerks();
  }, [loadClerks]);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    if (editClerk) {
      try {
        await updateStaffById(editClerk.id, {
          name: form.name,
          contact: form.phone,
        });

        setClerks((prev) => prev.map((c) => (
          c.id === editClerk.id
            ? { ...c, ...form }
            : c
        )));
        resetForm();
      } catch (err) {
        setError(err.message || 'Unable to update clerk.');
      } finally {
        setSaving(false);
      }
    } else {
      try {
        const created = await createStaff({
          name: form.name,
          email: form.email,
          password: form.password,
          role: 'clerk',
          contact: form.phone,
        });

        setClerks((prev) => [
          {
            id: created.id,
            name: created.name,
            phone: created.contact || '-',
            email: created.email,
            status: created.status === 'active' ? 'Active' : 'Inactive',
            joinDate: new Date(created.createdAt || Date.now()).toISOString().split('T')[0],
            role: String(created.role || 'clerk').toUpperCase(),
          },
          ...prev,
        ]);

        resetForm();
      } catch (err) {
        setError(err.message || 'Unable to create clerk.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;

    setError('');

    try {
      await deleteStaffById(id);
      setClerks((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.message || 'Unable to deactivate clerk.');
    }
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', password: '', status: 'Active' });
    setEditClerk(null);
    setModalOpen(false);
  };

  const openEdit = (c) => {
    setEditClerk(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      password: '',
      status: c.status,
    });
    setModalOpen(true);
  };

  const columns = [
    { key: 'name', label: 'Clerk Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    {
      key: 'actions', label: 'Actions', sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil className="w-4 h-4 text-slate-500" /></button>
          <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
        </div>
      ),
    },
  ];

  const handleExport = () => {
    exportRowsToPdf({
      title: 'Clerks Report',
      fileName: `clerks-${Date.now()}.pdf`,
      summaryLines: [`Total Clerks: ${clerks.length}`],
      columns: [
        { header: 'Clerk Name', key: 'name' },
        { header: 'Phone', key: 'phone' },
        { header: 'Email', key: 'email' },
        { header: 'Status', key: 'status' },
      ],
      rows: clerks,
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

      <PageHeader title="Clerks" subtitle={`${clerks.length} total clerks`}>
        <Button variant="secondary" onClick={handleExport}><Download className="w-4 h-4" /> Export</Button>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add Clerk</Button>
      </PageHeader>
      <DataTable columns={columns} data={clerks} />
      <Modal isOpen={modalOpen} onClose={resetForm} title={editClerk ? 'Edit Clerk' : 'Add New Clerk'}>
        <div className="space-y-4">
          <FormInput label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FormInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          {!editClerk && (
            <FormInput
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          )}
          <FormInput label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <SelectInput label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[
            { value: 'Active', label: 'Active' }, { value: 'On Leave', label: 'On Leave' }, { value: 'Inactive', label: 'Inactive' },
          ]} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={resetForm}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : `${editClerk ? 'Update' : 'Add'} Clerk`}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminClerks;
