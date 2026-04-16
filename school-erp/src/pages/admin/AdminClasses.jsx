import { useCallback, useEffect, useState } from 'react';
import { getClasses, createClass, updateClassById, deleteClassById } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import Button from '../../components/Button';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const AdminClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', sections: '', classTeacher: '' });

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getClasses();
      setClasses(data);
    } catch (err) {
      setError(err.message || 'Unable to load classes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleSave = async () => {
    const sections = form.sections.split(',').map((s) => s.trim()).filter(Boolean);

    setSaving(true);
    setError('');

    try {
      if (editItem) {
        const updated = await updateClassById(editItem.id, {
          name: form.name,
          sections,
        });

        setClasses((prev) => prev.map((c) => (c.id === editItem.id ? updated : c)));
      } else {
        const created = await createClass({ name: form.name, sections });
        setClasses((prev) => [created, ...prev]);
      }

      resetForm();
    } catch (err) {
      setError(err.message || 'Unable to save class.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => { setForm({ name: '', sections: '', classTeacher: '' }); setEditItem(null); setModalOpen(false); };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;

    setError('');

    try {
      await deleteClassById(id);
      setClasses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.message || 'Unable to delete class.');
    }
  };

  const columns = [
    { key: 'name', label: 'Class Name' },
    { key: 'sections', label: 'Sections', render: (val) => val.join(', ') },
    { key: 'students', label: 'Students' },
    { key: 'classTeacher', label: 'Class Teacher' },
    {
      key: 'actions', label: 'Actions', sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setEditItem(row); setForm({ name: row.name, sections: row.sections.join(', '), classTeacher: row.classTeacher }); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil className="w-4 h-4 text-slate-500" /></button>
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

      <PageHeader title="Classes & Sections" subtitle={`${classes.length} classes`}>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add Class</Button>
      </PageHeader>
      <DataTable columns={columns} data={classes} />
      <Modal isOpen={modalOpen} onClose={resetForm} title={editItem ? 'Edit Class' : 'Add New Class'}>
        <div className="space-y-4">
          <FormInput label="Class Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Class 10" required />
          <FormInput label="Sections (comma separated)" value={form.sections} onChange={(e) => setForm({ ...form, sections: e.target.value })} placeholder="e.g. A, B, C" required />
          <FormInput label="Class Teacher" value={form.classTeacher} onChange={(e) => setForm({ ...form, classTeacher: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={resetForm}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : `${editItem ? 'Update' : 'Add'} Class`}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminClasses;
