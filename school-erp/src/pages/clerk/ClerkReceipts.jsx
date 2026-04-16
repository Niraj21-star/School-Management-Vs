import { useState } from 'react';
import { useCallback, useEffect } from 'react';
import { downloadFeeReceipt, getFees } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import { Printer, Download } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const ClerkReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState('');
  const [error, setError] = useState('');

  const saveBlob = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const feeRecords = await getFees();

      const allReceipts = feeRecords.flatMap((fee) =>
        (fee.paymentHistory || []).map((payment) => ({
          id: payment._id,
          studentId: fee.studentId,
          student: fee.studentName,
          class: fee.class,
          amount: payment.amount,
          date: new Date(payment.date).toISOString().split('T')[0],
          mode: String(payment.mode || '').toUpperCase(),
        }))
      );

      setReceipts(allReceipts);
    } catch (err) {
      setError(err.message || 'Unable to load receipts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const handleDownloadReceipt = async (receipt) => {
    setError('');
    setDownloadingId(receipt.id);

    try {
      const blob = await downloadFeeReceipt(receipt.studentId, receipt.id);
      saveBlob(blob, `receipt-${receipt.id}.pdf`);
    } catch (err) {
      setError(err.message || 'Unable to download receipt.');
    } finally {
      setDownloadingId('');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" /></div>;

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <PageHeader title="Receipts" subtitle="View and print fee receipts">
        <Button variant="secondary"><Download className="w-4 h-4" /> Export All</Button>
      </PageHeader>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="table-header">Receipt No</th>
              <th className="table-header">Student</th>
              <th className="table-header">Class</th>
              <th className="table-header">Amount</th>
              <th className="table-header">Date</th>
              <th className="table-header">Payment Mode</th>
              <th className="table-header">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {receipts.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="table-cell font-medium text-slate-800">{r.id}</td>
                <td className="table-cell">{r.student}</td>
                <td className="table-cell">{r.class}</td>
                <td className="table-cell font-medium text-emerald-600">{formatCurrency(r.amount)}</td>
                <td className="table-cell">{r.date}</td>
                <td className="table-cell">{r.mode}</td>
                <td className="table-cell">
                  <button
                    className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                    title="Print"
                    onClick={() => handleDownloadReceipt(r)}
                    disabled={downloadingId === r.id}
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClerkReceipts;
