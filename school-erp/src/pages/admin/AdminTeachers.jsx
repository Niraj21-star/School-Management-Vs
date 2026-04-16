import { useCallback, useEffect, useState } from 'react';
import { createStaff, getTeachers, updateStaffById, deleteStaffById } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import SelectInput from '../../components/SelectInput';
import Button from '../../components/Button';
import { Plus, Download, Pencil, Trash2 } from 'lucide-react';
import { exportRowsToPdf } from '../../utils/pdfExport';

const CLASS_OPTIONS = Array.from({ length: 10 }, (_, index) => {
  const classNumber = index + 1;
  return {
    value: `Class ${classNumber}`,
    label: `Class ${classNumber}`,
  };
});

const AdminTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [form, setForm] = useState({ name: '', subject: '', assignedClass: '', phone: '', email: '', password: '', status: 'Active' });

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getTeachers();
      setTeachers(data);
    } catch (err) {
      setError(err.message || 'Unable to load teachers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    if (editTeacher) {
      try {
        await updateStaffById(editTeacher.id, {
          name: form.name,
          contact: form.phone,
          subject: form.subject,
          assignedClasses: form.assignedClass ? [form.assignedClass] : [],
        });

        setTeachers((prev) => prev.map((t) => (
          t.id === editTeacher.id
            ? {
              ...t,
              ...form,
              classes: form.assignedClass ? [form.assignedClass] : [],
            }
            : t
        )));
        resetForm();
      } catch (err) {
        setError(err.message || 'Unable to update teacher.');
      } finally {
        setSaving(false);
      }
    } else {
      try {
        const created = await createStaff({
          name: form.name,
          email: form.email,
          password: form.password,
          role: 'teacher',
          contact: form.phone,
          subject: form.subject,
          assignedClasses: form.assignedClass ? [form.assignedClass] : [],
        });

        setTeachers((prev) => [
          {
            id: created.id,
            name: created.name,
            subject: created.subject || form.subject || 'Not assigned',
            phone: created.contact || '-',
            email: created.email,
            classes: created.assignedClasses || (form.assignedClass ? [form.assignedClass] : []),
            status: created.status === 'active' ? 'Active' : 'Inactive',
            joinDate: new Date(created.createdAt || Date.now()).toISOString().split('T')[0],
            role: String(created.role || 'teacher').toUpperCase(),
          },
          ...prev,
        ]);

        resetForm();
      } catch (err) {
        setError(err.message || 'Unable to create teacher.');
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
      setTeachers((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message || 'Unable to deactivate teacher.');
    }
  };

  const resetForm = () => {
    setForm({ name: '', subject: '', assignedClass: '', phone: '', email: '', password: '', status: 'Active' });
    setEditTeacher(null);
    setModalOpen(false);
  };

  const openEdit = (t) => {
    setEditTeacher(t);
    setForm({
      name: t.name,
      subject: t.subject,
      assignedClass: t.classes?.[0] || '',
      phone: t.phone,
      email: t.email,
      password: '',
      status: t.status,
    });
    setModalOpen(true);
  };

  const columns = [
    { key: 'name', label: 'Teacher Name' },
    { key: 'subject', label: 'Subject' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'classes', label: 'Classes', render: (val) => val?.join(', ') || '—' },
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
      title: 'Teachers Report',
      fileName: `teachers-${Date.now()}.pdf`,
      summaryLines: [`Total Teachers: ${teachers.length}`],
      columns: [
        { header: 'Teacher Name', key: 'name' },
        { header: 'Subject', key: 'subject' },
        { header: 'Phone', key: 'phone' },
        { header: 'Email', key: 'email' },
        { header: 'Classes', key: 'classesText' },
        { header: 'Status', key: 'status' },
      ],
      rows: teachers.map((teacher) => ({
        ...teacher,
        classesText: teacher.classes?.join(', ') || '—',
      })),
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

      <PageHeader title="Teachers" subtitle={`${teachers.length} total teachers`}>
        <Button variant="secondary" onClick={handleExport}><Download className="w-4 h-4" /> Export</Button>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add Teacher</Button>
      </PageHeader>
      <DataTable columns={columns} data={teachers} />
      <Modal isOpen={modalOpen} onClose={resetForm} title={editTeacher ? 'Edit Teacher' : 'Add New Teacher'}>
        <div className="space-y-4">
          <FormInput label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FormInput label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          <SelectInput
            label="Class Teacher Of"
            value={form.assignedClass}
            onChange={(e) => setForm({ ...form, assignedClass: e.target.value })}
            placeholder="Select class"
            options={CLASS_OPTIONS}
          />
          <FormInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          {!editTeacher && (
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
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : `${editTeacher ? 'Update' : 'Add'} Teacher`}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminTeachers;
