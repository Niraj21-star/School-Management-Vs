import { useCallback, useEffect, useState } from 'react';
import { getTimetable } from '../../services/api';
import PageHeader from '../../components/PageHeader';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TeacherTimetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getTimetable();
      setTimetable(data);
    } catch (err) {
      setError(err.message || 'Unable to load timetable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" /></div>;

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <PageHeader title="View Timetable" subtitle="Your weekly class schedule" />

      <div className="space-y-4">
        {DAYS.map((day) => {
          const dayClasses = timetable.filter((t) => t.day === day);
          if (dayClasses.length === 0) return null;
          return (
            <div key={day} className="card overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700">{day}</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {dayClasses.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-[10px] text-slate-400 uppercase">P{item.period}</span>
                      <span className="text-xs font-bold text-slate-600">{item.time.split('-')[0]}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{item.subject}</p>
                      <p className="text-xs text-slate-500">{item.class} · {item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherTimetable;
