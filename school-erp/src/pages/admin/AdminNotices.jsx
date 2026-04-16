import { useCallback, useEffect, useState } from 'react';
import { createNotice, deleteNoticeById, getNotices } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import SelectInput from '../../components/SelectInput';
import Button from '../../components/Button';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const AdminNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'Medium', status: 'Draft' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadNotices = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getNotices();
      setNotices(data);
    } catch (err) {
      setError(err.message || 'Unable to load notices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const created = await createNotice(form);
      setNotices((prev) => [created, ...prev]);
      setForm({ title: '', content: '', priority: 'Medium', status: 'Draft' });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteNoticeById(id);
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author' },
    { key: 'date', label: 'Date' },
    { key: 'priority', label: 'Priority', render: (val) => <StatusBadge status={val} /> },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    {
      key: 'actions', label: 'Actions', sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil className="w-4 h-4 text-slate-500" /></button>
          <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" /></div>;

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <PageHeader title="Notices" subtitle="Manage school notices and announcements">
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> New Notice</Button>
      </PageHeader>
      <DataTable columns={columns} data={notices} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Notice">
        <div className="space-y-4">
          <FormInput label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Content</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input-field h-24 resize-none" required />
          </div>
          <SelectInput label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={[
            { value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' },
          ]} />
          <SelectInput label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[
            { value: 'Draft', label: 'Draft' }, { value: 'Published', label: 'Published' },
          ]} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Publish Notice'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminNotices;
