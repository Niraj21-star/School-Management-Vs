import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import SelectInput from '../../components/SelectInput';
import Button from '../../components/Button';
import { Upload, CheckCircle, FileText, Trash2 } from 'lucide-react';
import { createHomework, deleteHomeworkById, getClasses, getHomework } from '../../services/api';

const TeacherHomework = () => {
  const [form, setForm] = useState({ class: '', subject: '', title: '', description: '', dueDate: '' });
  const [homeworks, setHomeworks] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [classes, homeworkList] = await Promise.all([getClasses(), getHomework()]);

      const options = classes.flatMap((item) =>
        (item.sections || []).map((section) => {
          const value = `${item.name}-${section}`;
          return { value, label: value };
        })
      );

      setClassOptions(options);
      setHomeworks(homeworkList);
    } catch (err) {
      setError(err.message || 'Unable to load homework.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError('');

    try {
      const created = await createHomework(form);
      setHomeworks((prev) => [created, ...prev]);
      setForm({ class: '', subject: '', title: '', description: '', dueDate: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Unable to assign homework.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setError('');

    try {
      await deleteHomeworkById(id);
      setHomeworks((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message || 'Unable to delete homework.');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" /></div>;

  return (
    <div>
      <PageHeader title="Upload Homework" subtitle="Assign homework to your classes" />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Homework assigned successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="card p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2"><Upload className="w-5 h-5" /> New Homework</h3>
          <div className="space-y-4">
            <SelectInput label="Class" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} placeholder="Select class" options={classOptions} required />
            <FormInput label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            <FormInput label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-24 resize-none" />
            </div>
            <FormInput label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
          </div>
          <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
            <Button type="submit" disabled={saving}><Upload className="w-4 h-4" /> {saving ? 'Saving...' : 'Assign Homework'}</Button>
          </div>
        </form>

        <div className="card">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">Recent Homework</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {homeworks.map((hw) => (
              <div key={hw.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg"><FileText className="w-4 h-4 text-slate-500" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{hw.title}</p>
                    <p className="text-xs text-slate-500">{hw.class} · Due: {hw.dueDate}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(hw.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
            {homeworks.length === 0 && (
              <div className="px-5 py-10 text-center text-slate-400">No homework records yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherHomework;
