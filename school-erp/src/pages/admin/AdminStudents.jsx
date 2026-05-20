import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStudents,
  createStudent,
  updateStudentById,
  deleteStudentById,
  getAdmissionFormHtml,
} from '../../services/api';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import SelectInput from '../../components/SelectInput';
import Button from '../../components/Button';
import { Plus, Download, Pencil, Trash2, Scroll, Printer } from 'lucide-react';
import { exportRowsToPdf } from '../../utils/pdfExport';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [lastStudent, setLastStudent] = useState(null);
  const [form, setForm] = useState({
    name: '',
    surname: '',
    class: '',
    rollNo: '',
    gender: '',
    phone: '',
    status: 'Active',
    caste: '',
    subCaste: '',
    placeOfBirth: '',
    nationality: 'Indian',
    motherEducation: '',
    isTcIssued: false,
  });
  const navigate = useNavigate();

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getStudents({ limit: 200, status: 'all' });
      setStudents(data);
    } catch (err) {
      setError(err.message || 'Unable to load students.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const classTabs = useMemo(() => {
    const counts = students.reduce((accumulator, student) => {
      const className = student.class || 'Unassigned';
      accumulator[className] = (accumulator[className] || 0) + 1;
      return accumulator;
    }, {});

    return ['All Classes', ...Object.keys(counts).sort((a, b) => a.localeCompare(b))].map((className) => ({
      name: className,
      count: className === 'All Classes' ? students.length : counts[className] || 0,
    }));
  }, [students]);

  const visibleStudents = useMemo(() => {
    if (selectedClass === 'All Classes') {
      return students;
    }

    return students.filter((student) => student.class === selectedClass);
  }, [students, selectedClass]);

  const selectedClassStats = useMemo(() => {
    const totalStudents = visibleStudents.length;
    const activeStudents = visibleStudents.filter((student) => String(student.status).toLowerCase() === 'active').length;
    const feePending = visibleStudents.filter((student) => String(student.feeStatus).toLowerCase() === 'pending').length;

    return {
      totalStudents,
      activeStudents,
      feePending,
    };
  }, [visibleStudents]);

  useEffect(() => {
    if (selectedClass !== 'All Classes' && !classTabs.some((tab) => tab.name === selectedClass)) {
      setSelectedClass('All Classes');
    }
  }, [classTabs, selectedClass]);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      if (editStudent) {
        const updated = await updateStudentById(editStudent.id, form);
        setStudents((prev) => prev.map((s) => (s.id === editStudent.id ? updated : s)));
        resetForm();
      } else {
        const created = await createStudent(form);
        setStudents((prev) => [created, ...prev]);
        setLastStudent(created);
        setSubmitted(true);
        resetForm();
      }
    } catch (err) {
      setError(err.message || 'Unable to save student.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setError('');

      try {
        await deleteStudentById(id);
        setStudents((prev) => prev.filter((s) => s.id !== id));
      } catch (err) {
        setError(err.message || 'Unable to delete student.');
      }
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      surname: '',
      class: '',
      rollNo: '',
      gender: '',
      phone: '',
      status: 'Active',
      caste: '',
      subCaste: '',
      placeOfBirth: '',
      nationality: 'Indian',
      fatherEducation: '',
      motherEducation: '',
      isTcIssued: false,
    });
    setEditStudent(null);
    setModalOpen(false);
  };

  const openEdit = (student) => {
    setEditStudent(student);
    setForm({
      name: student.name,
      surname: student.raw?.surname || '',
      class: student.class,
      rollNo: student.rollNo,
      gender: student.gender,
      phone: student.phone,
      status: student.status,
      caste: student.raw?.caste || '',
      subCaste: student.raw?.subCaste || '',
      placeOfBirth: student.raw?.placeOfBirth || '',
      nationality: student.raw?.nationality || 'Indian',
      fatherEducation: student.raw?.fatherEducation || '',
      motherEducation: student.raw?.motherEducation || '',
      isTcIssued: false, // Don't show this field on edit, or reset it
    });
    setModalOpen(true);
  };

  const handlePrintAdmissionForm = async (studentId) => {
    try {
      const html = await getAdmissionFormHtml(studentId);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      } else {
        alert('Please allow popups to print the admission form.');
      }
    } catch (err) {
      alert(err.message || 'Failed to open print window.');
    }
  };

  const columns = [
    { key: 'rollNo', label: 'Roll No' },
    { key: 'name', label: 'Student Name' },
    { key: 'class', label: 'Class' },
    { key: 'gender', label: 'Gender' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'feeStatus', label: 'Fee Status', render: (val) => <StatusBadge status={val} /> },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePrintAdmissionForm(row.id)}
            className="p-1.5 rounded-lg hover:bg-emerald-50"
            title="Print Admission Form"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
          </button>
          <button
            onClick={() => navigate('/admin/tc')}
            className="p-1.5 rounded-lg hover:bg-indigo-50"
            title="Go to TC Management"
          >
            <Scroll className="w-4 h-4 text-indigo-600" />
          </button>
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Edit">
            <Pencil className="w-4 h-4 text-slate-500" />
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg hover:bg-red-50" title="Delete">
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  const handleExport = () => {
    exportRowsToPdf({
      title: `Students Report${selectedClass === 'All Classes' ? '' : ` - ${selectedClass}`}`,
      fileName: `students-${selectedClass.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`,
      summaryLines: [
        `Class Filter: ${selectedClass}`,
        `Total Students: ${selectedClassStats.totalStudents}`,
        `Active Students: ${selectedClassStats.activeStudents}`,
        `Fee Pending: ${selectedClassStats.feePending}`,
      ],
      columns: [
        { header: 'Roll No', key: 'rollNo' },
        { header: 'Student Name', key: 'name' },
        { header: 'Class', key: 'class' },
        { header: 'Gender', key: 'gender' },
        { header: 'Phone', key: 'phone' },
        { header: 'Status', key: 'status' },
        { header: 'Fee Status', key: 'feeStatus' },
      ],
      rows: visibleStudents,
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" /></div>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <PageHeader
        title="Students"
        subtitle={selectedClass === 'All Classes' ? `${students.length} total students` : `${selectedClassStats.totalStudents} students in ${selectedClass}`}
      >
        <Button variant="secondary" onClick={handleExport}><Download className="w-4 h-4" /> Export</Button>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add Student</Button>
      </PageHeader>

      {submitted && lastStudent && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div>
            <h4 className="font-semibold text-emerald-900 flex items-center gap-2 text-base">
              ✓ Student Admission Recorded Successfully!
            </h4>
            <p className="text-sm mt-0.5 text-emerald-700">
              Admission form is generated for <strong>{lastStudent.name}</strong> (ID: {lastStudent.studentId || lastStudent.id}).
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => handlePrintAdmissionForm(lastStudent.id)}
              className="!bg-white !text-emerald-700 border border-emerald-200 hover:!bg-emerald-100/50 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print Admission Form
            </Button>
            <Button
              variant="secondary"
              onClick={() => setSubmitted(false)}
              className="!bg-white !text-slate-500 border border-slate-200 hover:!bg-slate-50"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Class view</h3>
            <p className="text-sm text-slate-500">Select a class tab to see only the students in that class.</p>
          </div>
          <div className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-800">{visibleStudents.length}</span> students
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Students</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{selectedClassStats.totalStudents}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Active</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{selectedClassStats.activeStudents}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-700">Fee pending</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{selectedClassStats.feePending}</p>
          </div>
        </div>
      </div>

      {visibleStudents.length > 0 ? (
        <DataTable columns={columns} data={visibleStudents} />
      ) : (
        <div className="card p-10 text-center text-slate-500">
          No students found for this class.
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={resetForm} title={editStudent ? 'Edit Student' : 'Add New Student'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FormInput label="Surname" value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} />
          <FormInput label="Roll No" value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} required />
          <SelectInput label="Class" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} placeholder="Select class" options={[
            { value: '10-A', label: '10-A' }, { value: '10-B', label: '10-B' },
            { value: '9-A', label: '9-A' }, { value: '9-B', label: '9-B' },
            { value: '8-A', label: '8-A' }, { value: '8-B', label: '8-B' },
            { value: '7-A', label: '7-A' }, { value: '7-B', label: '7-B' },
          ]} required />
          <SelectInput label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} placeholder="Select gender" options={[
            { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' },
          ]} required />
          <FormInput label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <SelectInput label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[
            { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' },
          ]} />
          <FormInput label="Nationality" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
          <FormInput label="Place of Birth" value={form.placeOfBirth} onChange={(e) => setForm({ ...form, placeOfBirth: e.target.value })} />
          <FormInput label="Caste" value={form.caste} onChange={(e) => setForm({ ...form, caste: e.target.value })} />
          <FormInput label="Sub-Caste" value={form.subCaste} onChange={(e) => setForm({ ...form, subCaste: e.target.value })} />
          <FormInput label="Father's Education" value={form.fatherEducation} onChange={(e) => setForm({ ...form, fatherEducation: e.target.value })} />
          <FormInput label="Mother's Education" value={form.motherEducation} onChange={(e) => setForm({ ...form, motherEducation: e.target.value })} />
          {!editStudent && (
            <SelectInput label="TC Issued (Historical)" value={form.isTcIssued ? 'Yes' : 'No'} onChange={(e) => setForm({ ...form, isTcIssued: e.target.value === 'Yes' })} options={[
              { value: 'No', label: 'No' }, { value: 'Yes', label: 'Yes' }
            ]} />
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={resetForm}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : `${editStudent ? 'Update' : 'Add'} Student`}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminStudents;

