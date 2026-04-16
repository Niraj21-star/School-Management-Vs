import { useCallback, useEffect, useMemo, useState } from 'react';
import { createExam, getClasses, getExams, getMarksByExamAndClass, getStudents } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import SelectInput from '../../components/SelectInput';
import Button from '../../components/Button';
import { Plus } from 'lucide-react';

const AdminExams = () => {
  const [activeModule, setActiveModule] = useState('exams');
  const [exams, setExams] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [selectedResultExam, setSelectedResultExam] = useState('');
  const [selectedResultClass, setSelectedResultClass] = useState('');
  const [resultRows, setResultRows] = useState([]);
  const [resultLoading, setResultLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', class: '', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [examData, classData] = await Promise.all([getExams(), getClasses()]);

      setExams(examData);

      const options = classData.flatMap((item) =>
        (item.sections || []).map((section) => {
          const classLabel = `${item.name}-${section}`;
          return {
            value: classLabel,
            label: classLabel,
          };
        })
      );

      setClassOptions(options);
      setSelectedResultClass((prev) => prev || options[0]?.value || '');
      setSelectedResultExam((prev) => prev || examData[0]?.name || '');
      setForm((prev) => ({
        ...prev,
        class: prev.class || options[0]?.value || '',
      }));
    } catch (err) {
      setError(err.message || 'Unable to load exams.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadResults = useCallback(async () => {
    if (!selectedResultClass || !selectedResultExam) {
      setResultRows([]);
      return;
    }

    const [className, section = 'A'] = String(selectedResultClass).split('-');

    setResultLoading(true);
    setError('');

    try {
      const [studentsData, marksData] = await Promise.all([
        getStudents({ class: className, section, limit: 200 }),
        getMarksByExamAndClass({ className, section, examName: selectedResultExam }),
      ]);

      const marksMap = marksData.reduce((accumulator, mark) => {
        accumulator[mark.studentId] = mark;
        return accumulator;
      }, {});

      const rows = studentsData
        .map((student) => {
          const markEntry = marksMap[student.id];

          return {
            id: student.id,
            rollNo: student.rollNo,
            studentName: student.name,
            marks: markEntry?.marks ?? '—',
            grade: markEntry?.grade || '—',
            status: markEntry ? 'Entered' : 'Pending',
          };
        })
        .sort((a, b) => String(a.rollNo).localeCompare(String(b.rollNo), undefined, { numeric: true }));

      setResultRows(rows);
    } catch (err) {
      setError(err.message || 'Unable to load exam results.');
    } finally {
      setResultLoading(false);
    }
  }, [selectedResultClass, selectedResultExam]);

  useEffect(() => {
    if (activeModule === 'results') {
      loadResults();
    }
  }, [activeModule, loadResults]);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const created = await createExam(form);
      setExams((prev) => [created, ...prev]);
      setForm((prev) => ({
        ...prev,
        name: '',
        startDate: '',
        endDate: '',
      }));
      setModalOpen(false);
    } catch (err) {
      setError(err.message || 'Unable to create exam.');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const upcomingExams = useMemo(() => {
    return exams.filter((exam) => exam.endDate >= today);
  }, [exams, today]);

  const pastExams = useMemo(() => {
    return exams.filter((exam) => exam.endDate < today);
  }, [exams, today]);

  const examColumns = [
    { key: 'name', label: 'Exam Name' },
    { key: 'class', label: 'Class' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  const resultColumns = [
    { key: 'rollNo', label: 'Roll No' },
    { key: 'studentName', label: 'Student Name' },
    { key: 'marks', label: 'Marks' },
    { key: 'grade', label: 'Grade' },
    { key: 'status', label: 'Result Status', render: (val) => <StatusBadge status={val} /> },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" /></div>;

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <PageHeader title="Exams & Results" subtitle="Manage exam schedules and class-wise student results">
        {activeModule === 'exams' && (
          <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add Exam</Button>
        )}
      </PageHeader>

      <div className="card p-3 mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveModule('exams')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeModule === 'exams' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          Exams
        </button>
        <button
          type="button"
          onClick={() => setActiveModule('results')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeModule === 'results' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          Results
        </button>
      </div>

      {activeModule === 'exams' ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-800 mb-3">Upcoming Exams</h3>
            {upcomingExams.length > 0 ? (
              <DataTable columns={examColumns} data={upcomingExams} searchable={false} />
            ) : (
              <div className="card p-8 text-center text-slate-500">No upcoming exams found.</div>
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-800 mb-3">Past Exams</h3>
            {pastExams.length > 0 ? (
              <DataTable columns={examColumns} data={pastExams} searchable={false} />
            ) : (
              <div className="card p-8 text-center text-slate-500">No past exams found.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectInput
              label="Select Exam"
              value={selectedResultExam}
              onChange={(e) => setSelectedResultExam(e.target.value)}
              placeholder="Choose exam"
              options={exams.map((exam) => ({ value: exam.name, label: exam.name }))}
            />
            <SelectInput
              label="Select Class"
              value={selectedResultClass}
              onChange={(e) => setSelectedResultClass(e.target.value)}
              placeholder="Choose class"
              options={classOptions}
            />
          </div>

          {resultLoading ? (
            <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" /></div>
          ) : (
            <DataTable columns={resultColumns} data={resultRows} searchable={false} />
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add New Exam">
        <div className="space-y-4">
          <FormInput label="Exam Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <SelectInput
            label="Class"
            value={form.class}
            onChange={(e) => setForm({ ...form, class: e.target.value })}
            placeholder="Select class"
            options={classOptions}
            required
          />
          <FormInput label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          <FormInput label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Add Exam'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminExams;
