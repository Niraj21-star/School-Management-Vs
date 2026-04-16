import { useCallback, useEffect, useState } from 'react';
import { getClasses, getStudents, markAttendance } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import SelectInput from '../../components/SelectInput';
import Button from '../../components/Button';
import { Save, CheckCircle } from 'lucide-react';

const TeacherAttendance = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [classOptions, setClassOptions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attendance, setAttendance] = useState({});
  const [saved, setSaved] = useState(false);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const classes = await getClasses();
      const options = classes.flatMap((item) =>
        (item.sections || []).map((section) => ({
          value: `${item.id}::${section}`,
          label: `${item.name}-${section}`,
        }))
      );

      setClassOptions(options);
      setSelectedClass((prev) => prev || options[0]?.value || '');
    } catch (err) {
      setError(err.message || 'Unable to load classes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!active) return;
      await loadClasses();
    };

    run();

    return () => {
      active = false;
    };
  }, [loadClasses]);

  const loadStudents = useCallback(async () => {
    if (!selectedClass) {
      setStudents([]);
      setAttendance({});
      return;
    }

    setError('');

    try {
      const [, section] = selectedClass.split('::');
      const selectedOption = classOptions.find((option) => option.value === selectedClass);
      const className = selectedOption?.label?.split('-')?.[0] || '';

      const classStudents = await getStudents({ class: className, section, limit: 200 });
      setStudents(classStudents);

      setAttendance((prev) => {
        const nextAttendance = {};
        classStudents.forEach((student) => {
          nextAttendance[student.id] = prev[student.id] || undefined;
        });
        return nextAttendance;
      });
    } catch (err) {
      setError(err.message || 'Unable to load students for selected class.');
    }
  }, [classOptions, selectedClass]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!active) return;
      await loadStudents();
    };

    run();

    return () => {
      active = false;
    };
  }, [loadStudents]);

  const markAllPresent = () => {
    const all = {};
    students.forEach((s) => { all[s.id] = 'Present'; });
    setAttendance(all);
  };

  const handleSave = async () => {
    const [classId, section] = selectedClass.split('::');
    const normalizedStudents = students
      .filter((student) => attendance[student.id])
      .map((student) => ({
        studentId: student.id,
        status: attendance[student.id].toLowerCase(),
      }));

    if (!classId || !section) {
      setError('Please select class and section.');
      return;
    }

    if (!normalizedStudents.length) {
      setError('Please mark attendance for at least one student.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await markAttendance({
        classId,
        section,
        date: new Date().toISOString().split('T')[0],
        students: normalizedStudents,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Unable to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter((v) => v === 'Present').length;
  const absentCount = Object.values(attendance).filter((v) => v === 'Absent').length;

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

      <PageHeader title="Mark Attendance" subtitle={`Date: ${new Date().toLocaleDateString('en-IN')}`}>
        <div className="w-40">
          <SelectInput value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} options={[
            ...classOptions,
          ]} />
        </div>
      </PageHeader>

      {saved && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Attendance saved successfully!
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <Button variant="secondary" onClick={markAllPresent}>Mark All Present</Button>
        <span className="text-sm text-slate-500">
          Present: <span className="font-medium text-emerald-600">{presentCount}</span> · Absent: <span className="font-medium text-red-500">{absentCount}</span>
        </span>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="table-header">Roll No</th>
              <th className="table-header">Student Name</th>
              <th className="table-header">Status</th>
              <th className="table-header">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50">
                <td className="table-cell font-medium">{student.rollNo}</td>
                <td className="table-cell">{student.name}</td>
                <td className="table-cell">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    attendance[student.id] === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    attendance[student.id] === 'Absent' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {attendance[student.id] || 'Not Marked'}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAttendance((prev) => ({ ...prev, [student.id]: 'Present' }))}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        attendance[student.id] === 'Present' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >P</button>
                    <button
                      onClick={() => setAttendance((prev) => ({ ...prev, [student.id]: 'Absent' }))}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        attendance[student.id] === 'Absent' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >A</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Attendance'}</Button>
      </div>
    </div>
  );
};

export default TeacherAttendance;
