import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const normalizeCell = (value) => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const text = String(value).trim();
  return text || '-';
};

export const exportRowsToPdf = ({ title, fileName, columns, rows, summaryLines = [] }) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const generatedOn = new Date().toLocaleString();

  doc.setFontSize(16);
  doc.text(title, 40, 42);

  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`Generated on: ${generatedOn}`, 40, 62);

  let cursorY = 80;

  summaryLines.forEach((line) => {
    doc.text(normalizeCell(line), 40, cursorY);
    cursorY += 14;
  });

  autoTable(doc, {
    startY: cursorY,
    head: [columns.map((column) => normalizeCell(column.header))],
    body: rows.map((row) => columns.map((column) => normalizeCell(row[column.key]))),
    styles: {
      fontSize: 9,
      cellPadding: 5,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 40, right: 40 },
  });

  doc.save(fileName);
};
