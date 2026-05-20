import { useCallback, useEffect, useState } from 'react';
import {
  getTCStatus,
  getTCHtml,
  getDuplicateTCHtml,
  createDuplicateTCRequest,
  getDuplicateTCRequests,
  getTCPrintLogs,
  getStudents,
} from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import {
  FileText, Printer, AlertTriangle, CheckCircle2, Clock,
  Eye, History, ShieldCheck, Upload, X, Search,
} from 'lucide-react';

/* ─── helpers ─── */
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtDT = (d) => d ? new Date(d).toLocaleString('en-IN') : '—';

/* ─── open print window ─── */
const openPrintWindow = (html) => {
  const win = window.open('', '_blank', 'width=900,height=700,menubar=no,toolbar=no,location=no');
  if (!win) { alert('Pop-up blocked. Please allow pop-ups for this site.'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
      setTimeout(() => win.close(), 1500);
    }, 400);
  };
};

/* ─── Status badge ─── */
const TcBadge = ({ status }) => {
  const map = {
    printed: 'bg-emerald-100 text-emerald-700',
    not_printed: 'bg-slate-100 text-slate-600',
    duplicate: 'bg-amber-100 text-amber-700',
  };
  const labels = { printed: 'Printed', not_printed: 'Not Printed', duplicate: 'Duplicate Issued' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || map.not_printed}`}>
      {labels[status] || 'Unknown'}
    </span>
  );
};

/* ─── File to base64 ─── */
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function AdminTC() {
  const [students, setStudents] = useState([]);
  const [tcStatuses, setTcStatuses] = useState({});  // studentId -> status obj
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Print original TC
  const [printing, setPrinting] = useState(null); // studentId

  // Duplicate TC modal
  const [dupModal, setDupModal] = useState({ open: false, student: null });
  const [dupForm, setDupForm] = useState({ reason: '', file: null });
  const [dupSubmitting, setDupSubmitting] = useState(false);
  const [dupError, setDupError] = useState('');

  // Print logs modal
  const [logsModal, setLogsModal] = useState({ open: false, student: null, logs: [], loading: false });

  // Requests modal
  const [reqModal, setReqModal] = useState({ open: false, student: null, requests: [], loading: false });

  /* ─── Load students ─── */
  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStudents({ limit: 300, status: 'all' });
      setStudents(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  /* ─── Load TC status for a student ─── */
  const loadTcStatus = useCallback(async (studentId, mongoId) => {
    try {
      const status = await getTCStatus(mongoId);
      setTcStatuses(prev => ({ ...prev, [studentId]: status }));
    } catch { /* silent */ }
  }, []);

  // Load TC statuses on mount (batched, 5 at a time to avoid hammering API)
  useEffect(() => {
    if (!students.length) return;
    const loadBatch = async () => {
      for (let i = 0; i < students.length; i += 5) {
        const batch = students.slice(i, i + 5);
        await Promise.allSettled(
          batch.map(s => loadTcStatus(s.studentId, s.id))
        );
        await new Promise(r => setTimeout(r, 200));
      }
    };
    loadBatch();
  }, [students, loadTcStatus]);

  /* ─── Stats ─── */
  const stats = {
    total: students.length,
    printed: Object.values(tcStatuses).filter(s => (s?.printCount || 0) >= 1).length,
    notPrinted: Object.values(tcStatuses).filter(s => (s?.printCount || 0) === 0).length,
    duplicates: Object.values(tcStatuses).filter(s => (s?.totalDuplicates || 0) > 0).length,
  };

  /* ─── Filter students ─── */
  const visible = students.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(search.toLowerCase()) ||
    s.class?.toLowerCase().includes(search.toLowerCase())
  );

  /* ─── Print Original TC ─── */
  const handlePrintOriginal = async (student) => {
    setError('');
    setPrinting(student.studentId);
    try {
      const html = await getTCHtml(student.id);
      openPrintWindow(html);
      // Refresh status
      await loadTcStatus(student.studentId, student.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setPrinting(null);
    }
  };

  /* ─── Open Duplicate Modal ─── */
  const openDupModal = (student) => {
    setDupModal({ open: true, student });
    setDupForm({ reason: '', file: null });
    setDupError('');
  };

  /* ─── Submit Duplicate TC ─── */
  const handleDupSubmit = async () => {
    const { student } = dupModal;
    if (!dupForm.reason.trim()) { setDupError('Reason is required.'); return; }
    if (!dupForm.file) { setDupError('Supporting document is required.'); return; }

    const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!ALLOWED.includes(dupForm.file.type)) {
      setDupError('Only PDF, JPG, or PNG files allowed.'); return;
    }
    if (dupForm.file.size > 5 * 1024 * 1024) {
      setDupError('File must be under 5MB.'); return;
    }

    setDupSubmitting(true);
    setDupError('');
    try {
      const documentData = await fileToBase64(dupForm.file);
      const req = await createDuplicateTCRequest(student.id, dupForm.reason, {
        documentData,
        documentName: dupForm.file.name,
        documentMimeType: dupForm.file.type,
        documentSize: dupForm.file.size,
      });

      // Print the duplicate TC immediately
      const html = await getDuplicateTCHtml(student.id, req.id);
      openPrintWindow(html);

      setDupModal({ open: false, student: null });
      await loadTcStatus(student.studentId, student.id);
    } catch (e) {
      setDupError(e.message);
    } finally {
      setDupSubmitting(false);
    }
  };

  /* ─── View Print Logs ─── */
  const openLogs = async (student) => {
    setLogsModal({ open: true, student, logs: [], loading: true });
    try {
      const logs = await getTCPrintLogs(student.id);
      setLogsModal(prev => ({ ...prev, logs, loading: false }));
    } catch {
      setLogsModal(prev => ({ ...prev, loading: false }));
    }
  };

  /* ─── View Requests ─── */
  const openRequests = async (student) => {
    setReqModal({ open: true, student, requests: [], loading: true });
    try {
      const reqs = await getDuplicateTCRequests(student.id);
      setReqModal(prev => ({ ...prev, requests: reqs, loading: false }));
    } catch {
      setReqModal(prev => ({ ...prev, loading: false }));
    }
  };

  const getRowStatus = (s) => {
    const st = tcStatuses[s.studentId];
    if (!st) return 'not_printed';
    if ((st.totalDuplicates || 0) > 0) return 'duplicate';
    if ((st.printCount || 0) >= 1) return 'printed';
    return 'not_printed';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" />
    </div>
  );

  return (
    <div>
      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button className="ml-auto" onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      <PageHeader
        title="TC Management"
        subtitle="Issue, track, and audit Transfer Certificates"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Students', value: stats.total, color: 'slate', icon: FileText },
          { label: 'TC Printed', value: stats.printed, color: 'emerald', icon: CheckCircle2 },
          { label: 'Not Printed', value: stats.notPrinted, color: 'amber', icon: Clock },
          { label: 'Duplicates Issued', value: stats.duplicates, color: 'red', icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`rounded-xl border border-${color}-100 bg-${color}-50 p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 text-${color}-600`} />
              <p className={`text-xs uppercase tracking-wide text-${color}-600 font-medium`}>{label}</p>
            </div>
            <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or class…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
      </div>

      {/* Student Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Roll No', 'Student Name', 'Class', 'TC Status', 'First Printed', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map(s => {
                const st = tcStatuses[s.studentId];
                const rowStatus = getRowStatus(s);
                const isPrinting = printing === s.studentId;
                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="table-cell text-slate-500">{s.rollNo}</td>
                    <td className="table-cell font-medium text-slate-800">{s.name}</td>
                    <td className="table-cell">{s.class}</td>
                    <td className="table-cell"><TcBadge status={rowStatus} /></td>
                    <td className="table-cell text-slate-500">{fmt(st?.firstPrintedAt)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {/* Print Original / Duplicate */}
                        {st?.canPrintOriginal !== false ? (
                          <button
                            onClick={() => handlePrintOriginal(s)}
                            disabled={isPrinting}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
                            title="Print Original TC (one-time only)"
                          >
                            {isPrinting ? (
                              <span className="animate-pulse">Generating…</span>
                            ) : (
                              <><Printer className="w-3.5 h-3.5" /> Print Original</>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => openDupModal(s)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition-colors"
                            title="Print Duplicate TC"
                          >
                            <Printer className="w-3.5 h-3.5" /> Print Duplicate
                          </button>
                        )}

                        {/* Logs */}
                        <button
                          onClick={() => openLogs(s)}
                          className="p-1.5 rounded-lg hover:bg-slate-100"
                          title="Print Logs"
                        >
                          <History className="w-4 h-4 text-slate-500" />
                        </button>

                        {/* Requests */}
                        {(st?.totalDuplicates || 0) > 0 && (
                          <button
                            onClick={() => openRequests(s)}
                            className="p-1.5 rounded-lg hover:bg-amber-50"
                            title="Duplicate Requests"
                          >
                            <ShieldCheck className="w-4 h-4 text-amber-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Duplicate TC Modal ── */}
      <Modal
        isOpen={dupModal.open}
        onClose={() => setDupModal({ open: false, student: null })}
        title={`Print Duplicate TC — ${dupModal.student?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>Original TC has already been printed.</strong> Provide a reason and supporting
            document to issue a Duplicate TC. This action is permanently logged.
          </div>

          {dupError && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{dupError}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reason for Duplicate TC <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={dupForm.reason}
              onChange={e => setDupForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Original TC lost, FIR filed on date..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Supporting Document <span className="text-red-500">*</span>
              <span className="text-slate-400 font-normal ml-1">(PDF, JPG, PNG — max 5MB)</span>
            </label>
            {dupForm.file ? (
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="flex-1 truncate">{dupForm.file.name}</span>
                <button onClick={() => setDupForm(f => ({ ...f, file: null }))}>
                  <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-slate-400 transition-colors">
                <Upload className="w-6 h-6 text-slate-400" />
                <span className="text-sm text-slate-500">Click to upload document</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setDupForm(f => ({ ...f, file: e.target.files[0] || null }))}
                />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setDupModal({ open: false, student: null })}>
              Cancel
            </Button>
            <Button onClick={handleDupSubmit} disabled={dupSubmitting}>
              <Printer className="w-4 h-4" />
              {dupSubmitting ? 'Processing…' : 'Print Duplicate TC'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Print Logs Modal ── */}
      <Modal
        isOpen={logsModal.open}
        onClose={() => setLogsModal({ open: false, student: null, logs: [], loading: false })}
        title={`Print Logs — ${logsModal.student?.name}`}
        size="lg"
      >
        {logsModal.loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600" />
          </div>
        ) : logsModal.logs.length === 0 ? (
          <p className="text-center text-slate-400 py-10">No print records found for this student.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Type', 'TC / Dup No.', 'Printed By', 'IP Address', 'Date & Time'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logsModal.logs.map(log => (
                  <tr key={log.id}>
                    <td className="px-3 py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${log.printType === 'original' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-700'}`}>
                        {log.printType === 'original' ? 'Original' : 'Duplicate'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{log.tcNumber || '—'}</td>
                    <td className="px-3 py-2">{log.printedByName}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs">{log.ipAddress || '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{fmtDT(log.printedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* ── Duplicate Requests Modal ── */}
      <Modal
        isOpen={reqModal.open}
        onClose={() => setReqModal({ open: false, student: null, requests: [], loading: false })}
        title={`Duplicate TC Requests — ${reqModal.student?.name}`}
        size="lg"
      >
        {reqModal.loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600" />
          </div>
        ) : reqModal.requests.length === 0 ? (
          <p className="text-center text-slate-400 py-10">No duplicate requests found.</p>
        ) : (
          <div className="space-y-3">
            {reqModal.requests.map(req => (
              <div key={req.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${req.consumed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {req.consumed ? 'Printed' : 'Approved'}
                  </span>
                  <span className="text-xs text-slate-400">{fmt(req.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-700"><strong>Reason:</strong> {req.reason}</p>
                {req.duplicateTcNumber && (
                  <p className="text-xs text-slate-500 mt-1">Duplicate TC#: <span className="font-mono">{req.duplicateTcNumber}</span></p>
                )}
                {req.hasDocument && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Supporting document uploaded
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
