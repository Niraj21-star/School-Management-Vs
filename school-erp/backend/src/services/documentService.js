const puppeteer = require('puppeteer');

const SCHOOL_NAME = process.env.SCHOOL_NAME || 'School ERP Public School';
const SCHOOL_ADDRESS = process.env.SCHOOL_ADDRESS || '123 Education Street, City, State';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const wrapTemplate = (documentTitle, bodyHtml) => `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(documentTitle)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px;
      font-family: Arial, Helvetica, sans-serif;
      color: #1f2937;
      background: #f8fafc;
    }
    .page {
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      padding: 28px;
    }
    .header {
      display: grid;
      grid-template-columns: 72px 1fr;
      gap: 16px;
      align-items: center;
      border-bottom: 2px solid #111827;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .logo {
      height: 72px;
      border: 2px dashed #9ca3af;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #6b7280;
    }
    .school-name {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .school-address {
      margin: 4px 0 0;
      color: #4b5563;
      font-size: 13px;
    }
    .doc-title {
      text-align: center;
      margin: 0 0 18px;
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .meta {
      text-align: right;
      color: #6b7280;
      font-size: 12px;
      margin-bottom: 12px;
    }
    .section-title {
      margin: 16px 0 8px;
      font-weight: 700;
      font-size: 14px;
      color: #111827;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td {
      border: 1px solid #e5e7eb;
      padding: 9px 10px;
      font-size: 13px;
      vertical-align: top;
    }
    .key {
      width: 34%;
      background: #f9fafb;
      font-weight: 700;
    }
    .footer {
      margin-top: 30px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      align-items: end;
    }
    .placeholder {
      border-top: 1px solid #9ca3af;
      padding-top: 6px;
      font-size: 12px;
      color: #4b5563;
      text-align: center;
    }
    .qr {
      border: 2px dashed #9ca3af;
      height: 66px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      font-size: 11px;
      color: #6b7280;
    }
    .status-paid { color: #166534; font-weight: 700; }
    .status-partial { color: #92400e; font-weight: 700; }
    .status-unpaid { color: #991b1b; font-weight: 700; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo">Logo</div>
      <div>
        <h1 class="school-name">${escapeHtml(SCHOOL_NAME)}</h1>
        <p class="school-address">${escapeHtml(SCHOOL_ADDRESS)}</p>
      </div>
    </div>
    ${bodyHtml}
  </div>
</body>
</html>
`;

const studentDetailsRows = (student) => `
  <tr><td class="key">Student ID</td><td>${escapeHtml(student.studentId)}</td></tr>
  <tr><td class="key">Name</td><td>${escapeHtml(student.name)}</td></tr>
  <tr><td class="key">Class</td><td>${escapeHtml(student.academic?.class)}</td></tr>
  <tr><td class="key">Section</td><td>${escapeHtml(student.academic?.section)}</td></tr>
  <tr><td class="key">Roll Number</td><td>${escapeHtml(student.academic?.rollNumber)}</td></tr>
  <tr><td class="key">Date of Birth</td><td>${escapeHtml(formatDate(student.dob))}</td></tr>
`;

const renderPdf = async (html) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '14mm',
        right: '12mm',
        bottom: '14mm',
        left: '12mm',
      },
    });
  } finally {
    await browser.close();
  }
};

const generateBonafide = async (student) => {
  const html = wrapTemplate(
    'Bonafide Certificate',
    `
    <p class="meta">Issue Date: ${formatDate(new Date())}</p>
    <h2 class="doc-title">Bonafide Certificate</h2>
    <p>This is to certify that <strong>${escapeHtml(student.name)}</strong> is a bonafide student of this institution for the academic session.</p>
    <p class="section-title">Student Details</p>
    <table>${studentDetailsRows(student)}</table>
    <div class="footer">
      <div class="qr">QR Verification</div>
      <div class="placeholder">Digital Signature</div>
      <div class="placeholder">Principal Signature</div>
    </div>
  `
  );

  return renderPdf(html);
};

const generateTC = async (student) => {
  const html = wrapTemplate(
    'Transfer Certificate',
    `
    <p class="meta">Issue Date: ${formatDate(new Date())}</p>
    <h2 class="doc-title">Transfer Certificate</h2>
    <p>This is to certify that <strong>${escapeHtml(student.name)}</strong> has been a student of this institution and this certificate is issued on request for transfer purposes.</p>
    <p class="section-title">Student Details</p>
    <table>
      ${studentDetailsRows(student)}
      <tr><td class="key">Father Name</td><td>${escapeHtml(student.parent?.fatherName)}</td></tr>
      <tr><td class="key">Mother Name</td><td>${escapeHtml(student.parent?.motherName)}</td></tr>
      <tr><td class="key">Admission Date</td><td>${escapeHtml(formatDate(student.academic?.admissionDate))}</td></tr>
    </table>
    <div class="footer">
      <div class="qr">QR Verification</div>
      <div class="placeholder">Digital Signature</div>
      <div class="placeholder">Principal Signature</div>
    </div>
  `
  );

  return renderPdf(html);
};

const generateFeeReceipt = async (student, payment, fee) => {
  const html = wrapTemplate(
    'Fee Receipt',
    `
    <p class="meta">Receipt Date: ${formatDate(new Date())}</p>
    <h2 class="doc-title">Fee Receipt</h2>
    <p class="section-title">Student Details</p>
    <table>${studentDetailsRows(student)}</table>
    <p class="section-title">Payment Details</p>
    <table>
      <tr><td class="key">Amount Paid</td><td>${escapeHtml(formatCurrency(payment.amount))}</td></tr>
      <tr><td class="key">Payment Date</td><td>${escapeHtml(formatDate(payment.date))}</td></tr>
      <tr><td class="key">Payment Mode</td><td>${escapeHtml(payment.mode)}</td></tr>
      <tr><td class="key">Total Amount</td><td>${escapeHtml(formatCurrency(fee.totalAmount))}</td></tr>
      <tr><td class="key">Paid Amount</td><td>${escapeHtml(formatCurrency(fee.paidAmount))}</td></tr>
      <tr><td class="key">Due Amount</td><td>${escapeHtml(formatCurrency(fee.dueAmount))}</td></tr>
      <tr><td class="key">Status</td><td class="status-${escapeHtml(fee.status)}">${escapeHtml(fee.status)}</td></tr>
    </table>
    <div class="footer">
      <div class="qr">QR Verification</div>
      <div class="placeholder">Digital Signature</div>
      <div class="placeholder">Accounts Signature</div>
    </div>
  `
  );

  return renderPdf(html);
};

module.exports = {
  generateBonafide,
  generateTC,
  generateFeeReceipt,
};