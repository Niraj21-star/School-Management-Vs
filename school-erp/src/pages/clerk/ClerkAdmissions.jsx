import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import SelectInput from '../../components/SelectInput';
import Button from '../../components/Button';
import { Save, UserPlus } from 'lucide-react';
import { createStudent, getClasses } from '../../services/api';

const ClerkAdmissions = () => {
  const [form, setForm] = useState({
    name: '', fatherName: '', motherName: '', dob: '', gender: '',
    class: '', phone: '', email: '', address: '', previousSchool: '', passportPhoto: '',
  });
  const [classOptions, setClassOptions] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handlePassportPhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setForm((prev) => ({ ...prev, passportPhoto: '' }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file for passport photo.');
      e.target.value = '';
      return;
    }

    // Keep the payload lightweight because image is stored as a data URL.
    if (file.size > 2 * 1024 * 1024) {
      setError('Passport photo must be smaller than 2MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setError('');
      setForm((prev) => ({ ...prev, passportPhoto: String(reader.result || '') }));
    };
    reader.onerror = () => {
      setError('Unable to read selected image. Please try another file.');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setError('');

    try {
      await createStudent({
        ...form,
        parentContact: form.phone,
        admissionDate: new Date().toISOString().split('T')[0],
      });

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setForm({ name: '', fatherName: '', motherName: '', dob: '', gender: '', class: '', phone: '', email: '', address: '', previousSchool: '', passportPhoto: '' });
    } catch (err) {
      setError(err.message || 'Unable to submit admission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Student Admissions" subtitle="Register new student admission" />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {submitted && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">
          ✓ Student admission recorded successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5" /> New Admission Form</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormInput label="Student Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FormInput label="Father's Name" value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} required />
          <FormInput label="Mother's Name" value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} required />
          <FormInput label="Date of Birth" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} required />
          <SelectInput label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} placeholder="Select" options={[
            { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' },
          ]} required />
          <SelectInput
            label="Admission Class"
            value={form.class}
            onChange={(e) => setForm({ ...form, class: e.target.value })}
            placeholder={loadingClasses ? 'Loading classes...' : 'Select class'}
            options={classOptions}
            required
          />
          <FormInput label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <FormInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <FormInput label="Previous School" value={form.previousSchool} onChange={(e) => setForm({ ...form, previousSchool: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Passport Size Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePassportPhotoChange}
              className="input-field file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />
            {form.passportPhoto && (
              <img
                src={form.passportPhoto}
                alt="Passport preview"
                className="mt-2 h-20 w-20 rounded-md object-cover border border-slate-200"
              />
            )}
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field h-20 resize-none" required />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button variant="secondary" type="reset">Reset</Button>
          <Button type="submit" disabled={submitting || loadingClasses}><Save className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Admission'}</Button>
        </div>
      </form>
    </div>
  );
};

export default ClerkAdmissions;
