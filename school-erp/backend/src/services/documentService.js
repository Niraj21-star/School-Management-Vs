const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

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

const renderPdf = async (html, pdfOptions = {}) => {
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
      ...pdfOptions,
    });
  } finally {
    await browser.close();
  }
};

const generateBonafideHtml = async (student) => {
  const templatePath = path.join(__dirname, '../templates/bonafide_certificate.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  let academicYear = new Date().getFullYear() + '-' + (new Date().getFullYear() + 1);
  if (student.academic && student.academic.admissionDate) {
    const startYear = new Date(student.academic.admissionDate).getFullYear();
    academicYear = `${startYear}-${startYear + 1}`;
  }

  const dob = new Date(student.dob);
  const dobDd = !Number.isNaN(dob.getTime()) ? String(dob.getDate()).padStart(2, '0') : '';
  const dobMm = !Number.isNaN(dob.getTime()) ? String(dob.getMonth() + 1).padStart(2, '0') : '';
  const dobYyyy = !Number.isNaN(dob.getTime()) ? String(dob.getFullYear()) : '';
  const issueDate = new Date().toLocaleDateString('en-GB');

  const replacements = {
    '{{student_name}}': escapeHtml(student.name),
    '{{academic_year}}': escapeHtml(academicYear),
    '{{class}}': escapeHtml(student.academic?.class || ''),
    '{{dob_dd}}': escapeHtml(dobDd),
    '{{dob_mm}}': escapeHtml(dobMm),
    '{{dob_yyyy}}': escapeHtml(dobYyyy),
    '{{issue_date}}': escapeHtml(issueDate),
  };

  for (const [key, value] of Object.entries(replacements)) {
    html = html.replace(new RegExp(key, 'g'), value);
  }

  return html;
};

const dateToWords = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
    'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty'];

  const dayWord = day < 20 ? ones[day] : `${tens[Math.floor(day / 10)]} ${ones[day % 10]}`.trim();

  const yearStr = String(year);
  const century = parseInt(yearStr.slice(0, 2), 10);
  const remainder = parseInt(yearStr.slice(2), 10);
  const centuryWord = remainder < 20 ? ones[remainder] : `${tens[Math.floor(remainder / 10)]} ${ones[remainder % 10]}`.trim();

  const thousandsMap = { 19: 'Nineteen Hundred', 20: 'Two Thousand' };
  const centuryPrefix = thousandsMap[century] || `${century}`;

  const yearWord = remainder === 0 ? centuryPrefix : `${centuryPrefix} ${centuryWord}`;

  return `${dayWord} ${month} ${yearWord}`;
};

const buildTcPlaceholders = (student, extras = {}) => {
  const now = new Date();
  const currentYear = now.getFullYear();

  return {
    register_no: student.studentId || '',
    roll_no: student.academic?.rollNumber || '',
    year: String(currentYear),
    surname: student.name ? student.name.split(' ').pop() : '',
    student_name: student.name || '',
    father_name: student.parent?.fatherName || '',
    mother_name: student.parent?.motherName || '',
    religion: student.religion || '',
    nationality: student.nationality || 'Indian',
    caste: student.caste || '',
    subcaste: student.subcaste || '',
    place_of_birth: student.placeOfBirth || student.address || '',
    dob: formatDate(student.dob),
    dob_in_words: dateToWords(student.dob),
    last_school_attended: student.lastSchoolAttended || '',
    date_of_admission: formatDate(student.academic?.admissionDate),
    standard: student.academic?.class || '',
    division: student.academic?.section || '',
    since_when: formatDate(student.academic?.admissionDate),
    progress: student.progress || 'Good',
    conduct: student.conduct || 'Good',
    date_of_leaving: formatDate(now),
    reason_of_leaving: student.reasonOfLeaving || 'As per request',
    remarks: student.remarks || '',
    issue_date: formatDate(now),
    tc_number: '',
    verification_code: '',
    ...extras,
  };
};

const resolveLogoConditional = (html, logoBase64) => {
  if (logoBase64) {
    // {{#logo_base64}}...{{/logo_base64}} → keep inner content
    html = html.replace(/\{\{#logo_base64\}\}([\s\S]*?)\{\{\/logo_base64\}\}/g, '$1');
    // {{^logo_base64}}...{{/logo_base64}} → remove fallback
    html = html.replace(/\{\{\^logo_base64\}\}[\s\S]*?\{\{\/logo_base64\}\}/g, '');
  } else {
    // {{#logo_base64}}...{{/logo_base64}} → remove logo block
    html = html.replace(/\{\{#logo_base64\}\}[\s\S]*?\{\{\/logo_base64\}\}/g, '');
    // {{^logo_base64}}...{{/logo_base64}} → keep fallback
    html = html.replace(/\{\{\^logo_base64\}\}([\s\S]*?)\{\{\/logo_base64\}\}/g, '$1');
  }
  return html;
};

const fillTcTemplate = (templatePath, placeholders) => {
  let html = fs.readFileSync(templatePath, 'utf-8');

  // 1. Embed logo directly (raw — not HTML-escaped)
  const logoBase64 = getLogoBase64();
  html = resolveLogoConditional(html, logoBase64);
  html = html.replace(/\{\{logo_base64\}\}/g, logoBase64);

  // 2. Fill all other placeholders with HTML-escaped values
  for (const [key, value] of Object.entries(placeholders)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), escapeHtml(value));
  }

  return html;
};

const generateTC = async (student, extras = {}) => {
  const templatePath = path.join(__dirname, '..', 'templates', 'tc_template.html');
  const placeholders = buildTcPlaceholders(student, extras);
  const html = fillTcTemplate(templatePath, placeholders);

  return renderPdf(html, {
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
};

// Returns HTML string for print-window approach (no PDF)
const generateTCHtml = (student, extras = {}) => {
  const templatePath = path.join(__dirname, '..', 'templates', 'tc_template.html');
  const placeholders = buildTcPlaceholders(student, extras);
  return fillTcTemplate(templatePath, placeholders);
};

// Returns HTML string for duplicate TC print-window
const generateDuplicateTCHtml = (student, duplicateRequest, extras = {}) => {
  const templatePath = path.join(__dirname, '..', 'templates', 'tc_template_duplicate.html');
  const now = new Date();
  const placeholders = buildTcPlaceholders(student, {
    duplicate_tc_number: duplicateRequest.duplicateTcNumber || '',
    duplicate_issue_date: formatDate(now),
    ...extras,
  });
  return fillTcTemplate(templatePath, placeholders);
};

const numberToWords = (num) => {
  const safeNum = Math.floor(Math.abs(Number(num) || 0));
  if (safeNum === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
    'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertChunk = (n) => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return `${tens[Math.floor(n / 10)]} ${ones[n % 10]}`.trim();
    return `${ones[Math.floor(n / 100)]} Hundred ${convertChunk(n % 100)}`.trim();
  };

  // Indian numbering: Crore, Lakh, Thousand, Hundred
  const parts = [];
  let remaining = safeNum;

  if (remaining >= 10000000) {
    parts.push(`${convertChunk(Math.floor(remaining / 10000000))} Crore`);
    remaining %= 10000000;
  }
  if (remaining >= 100000) {
    parts.push(`${convertChunk(Math.floor(remaining / 100000))} Lakh`);
    remaining %= 100000;
  }
  if (remaining >= 1000) {
    parts.push(`${convertChunk(Math.floor(remaining / 1000))} Thousand`);
    remaining %= 1000;
  }
  if (remaining > 0) {
    parts.push(convertChunk(remaining));
  }

  return parts.join(' ');
};

const splitRsPs = (amount) => {
  const safeAmount = Number(amount) || 0;
  const rs = Math.floor(safeAmount);
  const ps = Math.round((safeAmount - rs) * 100);
  return { rs: String(rs), ps: String(ps).padStart(2, '0') };
};

const getLogoBase64 = () => {
  try {
    // Try multiple possible logo locations
    const possiblePaths = [
      path.join(__dirname, '..', '..', '..', 'logo.png'),     // project root
      path.join(__dirname, '..', 'templates', 'logo.png'),    // templates dir
      path.join(__dirname, '..', '..', 'logo.png'),           // backend root
    ];

    for (const logoPath of possiblePaths) {
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        return `data:image/png;base64,${logoBuffer.toString('base64')}`;
      }
    }

    return '';
  } catch {
    return '';
  }
};

const generateFeeReceipt = async (student, payment, fee) => {
  const templatePath = path.join(__dirname, '..', 'templates', 'fee_receipt_template.html');
  let html = fs.readFileSync(templatePath, 'utf-8');

  const now = new Date();
  const currentYear = now.getFullYear();
  const paymentAmount = splitRsPs(payment.amount);

  // Inject logo directly (raw, not HTML-escaped) before processing other placeholders
  const logoBase64 = getLogoBase64();
  html = html.replace(/\{\{logo_base64\}\}/g, logoBase64);

  const breakdown = payment.breakdown || {};
  const getFeeVal = (key) => breakdown[key] ? splitRsPs(breakdown[key]) : { rs: '-', ps: '-' };

  const admission = getFeeVal('admission');
  const bdf = getFeeVal('bdf');
  const tuition = getFeeVal('tuition');
  const exam = getFeeVal('exam');
  const computer = getFeeVal('computer');
  const sport = getFeeVal('sport');
  const medical = getFeeVal('medical');
  const craft = getFeeVal('craft');
  const library = getFeeVal('library');
  const laboratory = getFeeVal('laboratory');
  const misc = getFeeVal('misc');
  const other = getFeeVal('other');
  const late = getFeeVal('late');
  const discount = getFeeVal('discount');

  // Build all other placeholders (these ARE escaped to prevent injection)
  const placeholders = {
    // Receipt metadata
    receipt_no: String(payment.receiptNo || payment._id),
    academic_year: `${currentYear - 1}-${currentYear}`,
    date: formatDate(payment.date || now),
    payment_mode: String(payment.mode || '').toUpperCase(),
    transaction_id: String(payment._id || ''),
    lp_no: '',
    cashier_name: '',

    // Student info
    student_name: student.name || '',
    class: student.academic?.class || '',
    division: student.academic?.section || '',
    gr_no: student.studentId || '',
    roll_no: student.academic?.rollNumber || '',
    father_name: student.parent?.fatherName || '',

    // Individual fee items (from breakdown)
    admission_fee: admission.rs, admission_fee_ps: admission.ps,
    bdf_fee: bdf.rs, bdf_fee_ps: bdf.ps,
    tuition_fee: tuition.rs, tuition_fee_ps: tuition.ps,
    exam_fee: exam.rs, exam_fee_ps: exam.ps,
    computer_fee: computer.rs, computer_fee_ps: computer.ps,
    sport_fee: sport.rs, sport_fee_ps: sport.ps,
    medical_fee: medical.rs, medical_fee_ps: medical.ps,
    craft_fee: craft.rs, craft_fee_ps: craft.ps,
    library_fee: library.rs, library_fee_ps: library.ps,
    laboratory_fee: laboratory.rs, laboratory_fee_ps: laboratory.ps,
    misc_fee: misc.rs, misc_fee_ps: misc.ps,
    other_fee: other.rs, other_fee_ps: other.ps,

    // Totals
    late_fee: late.rs, late_fee_ps: late.ps,
    discount: discount.rs, discount_ps: discount.ps,
    total_amount: paymentAmount.rs,
    total_amount_ps: paymentAmount.ps,
    amount_in_words: `Rupees ${numberToWords(Math.floor(Number(payment.amount) || 0))} Only`,
  };

  for (const [key, value] of Object.entries(placeholders)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), escapeHtml(value));
  }

  // Use zero margins since the template handles its own A4 layout
  return renderPdf(html, {
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
};

const generateAdmissionFormHtml = (student) => {
  const templatePath = path.join(__dirname, '..', 'templates', 'admission_form.html');
  let html = fs.readFileSync(templatePath, 'utf-8');

  // 1. Process Names & Letter Character Boxes
  const nameParts = (student.name || '').trim().split(/\s+/);
  const student_surname = student.surname || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : '');
  const student_first_name = student.surname ? student.name : (nameParts[0] || '');

  const padName = (str) => (str || '').toUpperCase().padEnd(15, ' ').slice(0, 15);
  const surnamePadded = padName(student_surname);
  const firstNamePadded = padName(student_first_name);
  const fatherNamePadded = padName(student.parent?.fatherName);
  const motherNamePadded = padName(student.parent?.motherName);

  const admissionYear = student.academic?.admissionDate ? new Date(student.academic.admissionDate).getFullYear() : new Date().getFullYear();

  const placeholders = {
    student_first_name: student_first_name.toUpperCase(),
    student_surname: student_surname.toUpperCase(),
    full_name_marathi: student.surname ? `${student.surname} ${student.name}` : (student.name || ''),
    gender: student.gender ? student.gender.toUpperCase() : '',

    nationality: student.nationality || 'INDIAN',
    phone_no: student.contact || '',
    mobile_no: student.parent?.parentContact || '',
    dob_words: student.dob ? dateToWords(student.dob).toUpperCase() : '',
    place_of_birth: student.placeOfBirth || '',
    caste: student.caste || '',
    sub_caste: student.subCaste || '',
    parent_full_name: student.parent?.fatherName || '',
    guardian_relation: 'FATHER',
    father_education: student.fatherEducation || '',
    mother_education: student.motherEducation || '',
    division: student.academic?.section || '',
    office_reg_no: student.studentId || '',
    admission_class: student.academic?.class || '',
    term_from: String(admissionYear).slice(-2),
    term_to: String(admissionYear + 1).slice(-2),
  };


  // Add individual letter boxes for s, f, fn, mn
  for (let i = 0; i < 15; i++) {
    placeholders[`s${i + 1}`] = surnamePadded[i] || ' ';
    placeholders[`f${i + 1}`] = firstNamePadded[i] || ' ';
    placeholders[`fn${i + 1}`] = fatherNamePadded[i] || ' ';
    placeholders[`mn${i + 1}`] = motherNamePadded[i] || ' ';
  }

  // 2. Form & Registration number boxes (8-digit padding)
  const rawId = (student.studentId || '').replace(/[^0-9]/g, '');
  const idNumber = rawId.padStart(8, '0').slice(-8);
  for (let i = 0; i < 8; i++) {
    placeholders[`form_no_${i + 1}`] = idNumber[i] || '0';
    placeholders[`reg_no_${i + 1}`] = idNumber[i] || '0';
  }

  // 3. DOB splits
  const dobDate = student.dob ? new Date(student.dob) : new Date();
  const dayStr = String(dobDate.getDate()).padStart(2, '0');
  const monthStr = String(dobDate.getMonth() + 1).padStart(2, '0');
  const yearStr = String(dobDate.getFullYear()).padStart(4, '0');
  
  placeholders.dob_day_1 = dayStr[0];
  placeholders.dob_day_2 = dayStr[1];
  placeholders.dob_month_1 = monthStr[0];
  placeholders.dob_month_2 = monthStr[1];
  placeholders.dob_year_1 = yearStr[0];
  placeholders.dob_year_2 = yearStr[1];
  placeholders.dob_year_3 = yearStr[2];
  placeholders.dob_year_4 = yearStr[3];

  // 4. Address split
  const address = student.address || '';
  placeholders.residential_address_1 = address.slice(0, 30);
  placeholders.residential_address_2 = address.slice(30, 60);
  placeholders.residential_address_3 = address.slice(60, 90);

  // 5. Replace previous_schools loop block
  let previousSchoolsHtml = '';
  if (student.previousSchool) {
    previousSchoolsHtml = `
      <tr>
        <td class="tc-y">-</td>
        <td class="tc-s">${escapeHtml(student.previousSchool)}</td>
        <td class="tc-c">-</td>
        <td class="tc-m">-</td>
      </tr>
      <tr>
        <td class="tc-y"></td>
        <td class="tc-s"></td>
        <td class="tc-c"></td>
        <td class="tc-m"></td>
      </tr>
    `;
  } else {
    previousSchoolsHtml = `
      <tr>
        <td class="tc-y"></td>
        <td class="tc-s"></td>
        <td class="tc-c"></td>
        <td class="tc-m"></td>
      </tr>
      <tr>
        <td class="tc-y"></td>
        <td class="tc-s"></td>
        <td class="tc-c"></td>
        <td class="tc-m"></td>
      </tr>
    `;
  }
  html = html.replace(/\{\{#each previous_schools\}\}[\s\S]*?\{\{\/each\}\}/g, previousSchoolsHtml);

  // 6. Fill all other placeholders
  for (const [key, value] of Object.entries(placeholders)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), escapeHtml(value));
  }

  return html;
};

module.exports = {
  generateBonafideHtml,
  generateTC,
  generateTCHtml,
  generateDuplicateTCHtml,
  generateFeeReceipt,
  generateAdmissionFormHtml,
};