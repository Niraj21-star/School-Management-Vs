import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import Button from '../../components/Button';
import { Save } from 'lucide-react';
import { getSchoolSettings, updateSchoolSettings } from '../../services/api';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    schoolName: 'Delhi Public School',
    email: 'admin@dps.edu.in',
    phone: '011-23456789',
    address: '123 Education Road, New Delhi, India',
    principal: 'Dr. Sharma',
    session: '2025-2026',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getSchoolSettings();
      setSettings({
        schoolName: data.schoolName || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        principal: data.principal || '',
        session: data.session || '',
      });
    } catch (err) {
      setError(err.message || 'Unable to load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateSchoolSettings(settings);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" /></div>;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage school configuration" />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="card p-6 max-w-2xl">
        <h3 className="text-base font-semibold text-slate-800 mb-4">School Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="School Name" value={settings.schoolName} onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })} required />
          <FormInput label="Email" type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} required />
          <FormInput label="Phone" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
          <FormInput label="Principal Name" value={settings.principal} onChange={(e) => setSettings({ ...settings, principal: e.target.value })} />
          <FormInput label="Academic Session" value={settings.session} onChange={(e) => setSettings({ ...settings, session: e.target.value })} />
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
            <textarea value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className="input-field h-20 resize-none" />
          </div>
        </div>
        <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
          <Button type="submit" disabled={saving}><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}</Button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
