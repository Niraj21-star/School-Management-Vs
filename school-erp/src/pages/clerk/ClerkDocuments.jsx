import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import SelectInput from '../../components/SelectInput';
import { Upload } from 'lucide-react';
import {
  createDocumentRecord,
  getClasses,
  getStudents,
} from '../../services/api';

const DOCUMENT_TYPES = [
  { value: 'Transfer Certificate', label: 'Transfer Certificate' },
  { value: 'Marksheet', label: 'Marksheet' },
  { value: 'ID Proof', label: 'ID Proof' },
  { value: 'Bonafide', label: 'Bonafide' },
  { value: 'Fee Receipt', label: 'Fee Receipt' },
  { value: 'Other', label: 'Other' },
];

const ClerkDocuments = () => {
  const [classOptions, setClassOptions] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
    type: 'Other',
  });

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

  const loadStudents = useCallback(async () => {
    if (!selectedClass) {
      setStudents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [className, section] = String(selectedClass).split('-');
      const studentList = await getStudents({ class: className, section, limit: 200 });
      setStudents(studentList);
    } catch (err) {
      setError(err.message || 'Unable to load students.');
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const openUploadModal = (student) => {
    setSelectedStudent(student);
    setSelectedFile(null);
    setForm({ type: 'Other' });
    setModalOpen(true);
  };

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read selected document file.'));
    reader.readAsDataURL(file);
  });

  const handleCreate = async () => {
    if (!selectedStudent) {
      setError('Please select a student.');
      return;
    }

    if (!selectedFile) {
      setError('Please choose a document file to upload.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (selectedFile.size > 3 * 1024 * 1024) {
        throw new Error('Document file must be smaller than 3MB.');
      }

      const fileData = await fileToDataUrl(selectedFile);

      await createDocumentRecord({
        studentId: selectedStudent.id,
        name: `${selectedStudent.name} - ${form.type}`,
        type: form.type,
        status: 'Uploaded',
        fileName: selectedFile.name,
        fileMimeType: selectedFile.type || 'application/octet-stream',
        fileSize: selectedFile.size,
        fileData,
      });

      setModalOpen(false);
      setSelectedStudent(null);
      setSelectedFile(null);
      setForm({ type: 'Other' });
    } catch (err) {
      setError(err.message || 'Unable to upload document.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingClasses) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" /></div>;

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <PageHeader
        title="Documents"
        subtitle={selectedClass ? `Upload documents for students in ${selectedClass}` : 'Select class first, then upload documents'}
      />

      <div className="card p-4 mb-4">
        <div className="max-w-xs">
          <SelectInput
            label="Select Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={classOptions}
            placeholder="Choose class"
          />
        </div>
      </div>

      {selectedClass ? (
        <div className="card overflow-hidden">
          <div className="divide-y divide-slate-100">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-700">{student.name}</p>
                  <p className="text-xs text-slate-500">{student.studentId || student.rollNo} · {student.class}</p>
                </div>
                <Button onClick={() => openUploadModal(student)}><Upload className="w-4 h-4" /> Upload Document</Button>
              </div>
            ))}
            {students.length === 0 && (
              <div className="px-5 py-12 text-center text-slate-400">No students found for selected class.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center text-slate-500 text-sm">
          Please select a class to view class-wise students for document upload.
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Upload Document">
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-sm font-medium text-slate-700">{selectedStudent?.name || '-'}</p>
            <p className="text-xs text-slate-500">{selectedStudent?.studentId || selectedStudent?.rollNo || '-'} · {selectedStudent?.class || '-'}</p>
          </div>

          <SelectInput
            label="Document Name"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={DOCUMENT_TYPES}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Upload Selected Document</label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="input-field file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />
            {selectedFile && (
              <p className="mt-1 text-xs text-slate-500">{selectedFile.name}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Save Document'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default ClerkDocuments;
