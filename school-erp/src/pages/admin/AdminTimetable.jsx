import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTimetable } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import SelectInput from '../../components/SelectInput';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AdminTimetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedClass, setSelectedClass] = useState('');

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getTimetable();
      setTimetable(data);
      setSelectedClass((prev) => prev || data[0]?.class || '');
    } catch (err) {
      setError(err.message || 'Unable to load timetable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  const classOptions = useMemo(() => {
    return Array.from(new Set(timetable.map((item) => item.class).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((value) => ({ value, label: value }));
  }, [timetable]);

  useEffect(() => {
    if (!selectedClass && classOptions.length) {
      setSelectedClass(classOptions[0].value);
      return;
    }

    if (selectedClass && !classOptions.some((option) => option.value === selectedClass)) {
      setSelectedClass(classOptions[0]?.value || '');
    }
  }, [classOptions, selectedClass]);

  const filtered = timetable.filter((t) => t.day === selectedDay && t.class === selectedClass);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" /></div>;

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <PageHeader
        title="Timetable"
        subtitle={selectedClass ? `Class-wise schedule for ${selectedClass}` : 'View class-wise schedule'}
      >
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="w-48">
            <SelectInput
              label="Class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={classOptions}
              placeholder="Select class"
            />
          </div>
          <div className="w-48">
            <SelectInput
              label="Day"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              options={DAYS.map((d) => ({ value: d, label: d }))}
            />
          </div>
        </div>
      </PageHeader>

      <div className="card p-3 mb-6 flex gap-2 overflow-x-auto">
        {classOptions.map((option) => {
          const active = option.value === selectedClass;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedClass(option.value)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="table-header">Period</th>
              <th className="table-header">Time</th>
              <th className="table-header">Subject</th>
              <th className="table-header">Teacher</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length > 0 ? filtered.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="table-cell font-medium">Period {item.period}</td>
                <td className="table-cell">{item.time}</td>
                <td className="table-cell font-medium">{item.subject}</td>
                <td className="table-cell">{item.teacher}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400">No schedule for {selectedClass || 'selected class'} on {selectedDay}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTimetable;
