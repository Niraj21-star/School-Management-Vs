import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import SelectInput from '../../components/SelectInput';
import Button from '../../components/Button';
import { Save, CheckCircle } from 'lucide-react';
import {
  getClasses,
  getExams,
  getSubjects,
  getMarksByExamAndClass,
  getStudents,
  saveMarksBulk,
} from '../../services/api';

const gradeFromMarks = (mark) => {
  if (mark >= 90) return 'A+';
  if (mark >= 80) return 'A';
  if (mark >= 70) return 'B+';
  if (mark >= 60) return 'B';
  if (mark >= 50) return 'C';
  if (mark >= 33) return 'D';
  return 'F';
};

const TeacherMarks = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [marks, setMarks] = useState({});
  const [students, setStudents] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [examOptions, setExamOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [className, section] = useMemo(() => {
    const parts = String(selectedClass).split('-');
    return [parts[0] || '', parts[1] || 'A'];
  }, [selectedClass]);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [classes, exams, subjects] = await Promise.all([getClasses(), getExams(), getSubjects()]);

      const classesList = classes.flatMap((item) =>
        (item.sections || []).map((sec) => `${item.name}-${sec}`)
      );

      setClassOptions(classesList);
      setExamOptions(exams.map((exam) => exam.name));
      setSubjectOptions(subjects.map((sub) => sub.name));
      setSelectedClass((prev) => prev || classesList[0] || '');
      setSelectedExam((prev) => prev || exams[0]?.name || '');
      setSelectedSubject((prev) => prev || subjects[0]?.name || '');
    } catch (err) {
      setError(err.message || 'Unable to load class and exam data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const loadStudentsAndMarks = useCallback(async () => {
    if (!selectedClass || !selectedExam || !selectedSubject) {
      setStudents([]);
      setMarks({});
      return;
    }

    setError('');

    try {
      const [selectedClassName, selectedSection = 'A'] = String(selectedClass).split('-');

      const [studentsData, marksData] = await Promise.all([
        getStudents({ class: selectedClassName, section: selectedSection, limit: 200 }),
        getMarksByExamAndClass({ className: selectedClassName, section: selectedSection, examName: selectedExam, subjectName: selectedSubject }),
      ]);

      const mappedStudents = studentsData.map((student) => ({
        id: student.id,
        rollNo: student.rollNo,
        name: student.name,
      }));

      const markMap = marksData.reduce((accumulator, item) => {
        accumulator[item.studentId] = item.marks;
        return accumulator;
      }, {});

      setStudents(mappedStudents);
      setMarks(markMap);
    } catch (err) {
      setError(err.message || 'Unable to load students and marks.');
    }
  }, [selectedClass, selectedExam, selectedSubject]);

  useEffect(() => {
    loadStudentsAndMarks();
  }, [loadStudentsAndMarks]);

  const handleMarkChange = (id, value) => {
    const num = Math.min(100, Math.max(0, Number(value) || 0));
    setMarks((prev) => ({ ...prev, [id]: value === '' ? '' : num }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const entries = students
        .filter((student) => marks[student.id] !== undefined && marks[student.id] !== '')
        .map((student) => ({
          studentId: student.id,
          marks: Number(marks[student.id]),
        }));

      if (entries.length === 0) {
        setSaving(false);
        return;
      }

      await saveMarksBulk({
        className,
        section,
        examName: selectedExam,
        subjectName: selectedSubject,
        entries,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Unable to save marks.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" /></div>;

  return (
    <div>
      <PageHeader title="Enter Exam Marks" subtitle="Enter marks for your subject">
        <div className="flex gap-3">
          <div className="w-36">
            <SelectInput value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} options={classOptions.map((value) => ({ value, label: value }))} />
          </div>
          <div className="w-44">
            <SelectInput value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} options={subjectOptions.map((value) => ({ value, label: value }))} />
          </div>
          <div className="w-44">
            <SelectInput value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} options={examOptions.map((value) => ({ value, label: value }))} />
          </div>
        </div>
      </PageHeader>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {saved && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Marks saved successfully!
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="table-header">Roll No</th>
              <th className="table-header">Student Name</th>
              <th className="table-header">Marks (out of 100)</th>
              <th className="table-header">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => {
              const mark = marks[student.id];
              let grade = '—';
              if (mark !== undefined && mark !== '') {
                grade = gradeFromMarks(mark);
              }
              return (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="table-cell font-medium">{student.rollNo}</td>
                  <td className="table-cell">{student.name}</td>
                  <td className="table-cell">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={marks[student.id] ?? ''}
                      onChange={(e) => handleMarkChange(student.id, e.target.value)}
                      className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                      placeholder="—"
                    />
                  </td>
                  <td className="table-cell">
                    <span className={`font-medium ${grade === 'F' ? 'text-red-500' : grade === '—' ? 'text-slate-400' : 'text-slate-700'}`}>{grade}</span>
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">No students found for selected class.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Marks'}</Button>
      </div>
    </div>
  );
};

export default TeacherMarks;
