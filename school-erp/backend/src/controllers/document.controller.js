const mongoose = require('mongoose');
const Student = require('../models/Student').Student;
const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const { DocumentRecord, DOCUMENT_TYPES, DOCUMENT_STATUSES } = require('../models/DocumentRecord');
const { TCDuplicateRequest } = require('../models/TCDuplicateRequest');
const TCPrintLog = require('../models/TCPrintLog');
const TCCounter = require('../models/TCCounter');

const {
  generateBonafideHtml,
  generateTC,
  generateTCHtml,
  generateDuplicateTCHtml,
  generateFeeReceipt,
  generateFeeReceiptHtml,
  generateAdmissionFormHtml,
} = require('../services/documentService');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const findStudent = async (identifier) => {
  if (isValidObjectId(identifier)) {
    const byId = await Student.findById(identifier);
    if (byId) return byId;
  }

  const byStudentId = await Student.findOne({ studentId: identifier });
  return byStudentId;
};

const sendPdfResponse = (res, pdfBuffer, filename) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(pdfBuffer);
};

const sendSuccess = (res, statusCode, message, data) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const sendError = (res, error) => {
  const statusCode = error.statusCode || 500;
  console.error(`[sendError] ${statusCode} — ${error.message}`, statusCode >= 500 ? error.stack : '');
  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    data: null,
  });
};

// Generate a friendly HTML page for print window when data is missing
const noDataHtml = (title, message) => `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 60px 32px; font-family: Arial, sans-serif; background: #f8fafc; color: #1f2937; text-align: center; }
    .card { max-width: 480px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px 32px; }
    h1 { font-size: 22px; margin-bottom: 12px; color: #dc2626; }
    p { font-size: 14px; color: #4b5563; line-height: 1.6; }
    .btn { margin-top: 24px; display: inline-block; padding: 10px 28px; background: #1e293b; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
    .btn:hover { background: #334155; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <button class="btn" onclick="window.close()">Close Window</button>
  </div>
</body>
</html>
`;

// Generate a unique TC number: TC-2026-001
const getNextTcNumber = async () => {
  const year = new Date().getFullYear();
  const key = `tc:${year}`;
  const counter = await TCCounter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `TC-${year}-${String(counter.seq).padStart(3, '0')}`;
};

// Generate a verification code: SVES-{tcNumber}-{XXXX}
const makeVerificationCode = (tcNumber) => {
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `SVES-${tcNumber}-${rand}`;
};

const getClientIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.socket?.remoteAddress ||
  '';

/* ============================================================
   DOCUMENT RECORDS
   ============================================================ */

const getDocumentRecords = async (req, res) => {
  try {
    const records = await DocumentRecord.find()
      .populate('studentId', 'name studentId')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = records.map((record) => ({
      _id: record._id,
      name: record.name,
      student: record.studentId?.name || '-',
      studentId: record.studentId?._id,
      type: record.type,
      date: record.createdAt,
      status: record.status,
      fileName: record.fileName,
      fileMimeType: record.fileMimeType,
      fileSize: record.fileSize,
      hasFile: Boolean(record.fileData),
    }));

    return sendSuccess(res, 200, 'Document records fetched', formatted);
  } catch (error) {
    return sendError(res, error);
  }
};

const createDocumentRecord = async (req, res) => {
  try {
    const {
      studentId,
      name,
      type = 'Other',
      status = 'Uploaded',
      fileName = '',
      fileMimeType = '',
      fileSize = 0,
      fileData = '',
    } = req.body;

    if (!studentId || !name) {
      const error = new Error('studentId and name are required');
      error.statusCode = 400;
      throw error;
    }

    if (!fileData) {
      const error = new Error('Document file is required');
      error.statusCode = 400;
      throw error;
    }

    if (!String(fileData).startsWith('data:')) {
      const error = new Error('Invalid document file format');
      error.statusCode = 400;
      throw error;
    }

    if (!isValidObjectId(studentId)) {
      const error = new Error('Invalid studentId');
      error.statusCode = 400;
      throw error;
    }

    if (!DOCUMENT_TYPES.includes(type)) {
      const error = new Error(`type must be one of: ${DOCUMENT_TYPES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    if (!DOCUMENT_STATUSES.includes(status)) {
      const error = new Error(`status must be one of: ${DOCUMENT_STATUSES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const student = await Student.findById(studentId).select('_id name');
    if (!student) {
      const error = new Error('Student not found');
      error.statusCode = 404;
      throw error;
    }

    const record = await DocumentRecord.create({
      studentId,
      name: String(name).trim(),
      type,
      status,
      fileName: String(fileName || '').trim(),
      fileMimeType: String(fileMimeType || '').trim(),
      fileSize: Number(fileSize || 0),
      fileData: String(fileData || ''),
      uploadedBy: req.user._id,
    });

    const populated = await DocumentRecord.findById(record._id)
      .populate('studentId', 'name studentId')
      .lean();

    return sendSuccess(res, 201, 'Document record created', {
      _id: populated._id,
      name: populated.name,
      student: populated.studentId?.name || '-',
      studentId: populated.studentId?._id,
      type: populated.type,
      date: populated.createdAt,
      status: populated.status,
      fileName: populated.fileName,
      fileMimeType: populated.fileMimeType,
      fileSize: populated.fileSize,
      hasFile: Boolean(populated.fileData),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteDocumentRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      const error = new Error('Invalid document id');
      error.statusCode = 400;
      throw error;
    }

    const record = await DocumentRecord.findByIdAndDelete(id).lean();

    if (!record) {
      const error = new Error('Document record not found');
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, 'Document record deleted', record);
  } catch (error) {
    return sendError(res, error);
  }
};

/* ============================================================
   BONAFIDE
   ============================================================ */

const getBonafide = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await findStudent(studentId);
    if (!student) {
      return res.status(200).send(noDataHtml('Student Not Found', 'The selected student could not be found in the system.'));
    }

    const html = await generateBonafideHtml(student);

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (error) {
    return res.status(200).send(noDataHtml('Error', `An error occurred while generating the bonafide: ${error.message}`));
  }
};

/* ============================================================
   TC — STATUS CHECK
   ============================================================ */

const getTCStatus = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await findStudent(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found', data: null });
    }

    const printCount = student.tcCertificate?.downloadCount || 0;
    const firstPrintedAt = student.tcCertificate?.firstDownloadedAt || null;

    // Count approved (unconsumed) duplicate requests
    const pendingDuplicates = await TCDuplicateRequest.countDocuments({
      studentId: student._id,
      status: 'approved',
      consumed: false,
    });

    // Count all duplicate requests
    const totalDuplicates = await TCDuplicateRequest.countDocuments({
      studentId: student._id,
    });

    return sendSuccess(res, 200, 'TC status fetched', {
      studentId: student._id,
      studentCode: student.studentId,
      studentName: student.name,
      printCount,
      firstPrintedAt,
      canPrintOriginal: printCount === 0,
      pendingDuplicates,
      totalDuplicates,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/* ============================================================
   TC — ORIGINAL HTML (for print window — no PDF file)
   ============================================================ */

const getTCHtml = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await findStudent(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found', data: null });
    }

    // If already printed, reuse the existing tcNumber, else generate a new one
    const manualTcNumber = req.query.tc_number;
    if (!manualTcNumber) {
      const error = new Error('TC Number is required.');
      error.statusCode = 400;
      throw error;
    }
    const tcNumber = manualTcNumber;
    const verificationCode = makeVerificationCode(tcNumber);

    const html = generateTCHtml(student, { 
      ...req.query,
      tc_number: tcNumber, 
      verification_code: verificationCode,
    });

    // Update student TC tracking
    const now = new Date();
    const setFields = {
      'tcCertificate.tcNumber': tcNumber,
      'tcCertificate.lastDownloadedAt': now,
      'tcCertificate.lastDownloadedBy': req.user._id,
    };
    
    // Only set firstDownloadedAt if it hasn't been set yet
    if (!student.tcCertificate?.firstDownloadedAt) {
      setFields['tcCertificate.firstDownloadedAt'] = now;
    }

    await Student.findByIdAndUpdate(student._id, {
      $inc: { 'tcCertificate.downloadCount': 1 },
      $set: setFields,
    });

    // Record in print log
    await TCPrintLog.create({
      studentId: student._id,
      printedBy: req.user._id,
      printType: 'original',
      tcNumber,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });

    // Return HTML for client to open in print window
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('X-TC-Number', tcNumber);
    return res.status(200).send(html);
  } catch (error) {
    return sendError(res, error);
  }
};

/* ============================================================
   TC — LEGACY PDF (kept for backward compat if needed)
   ============================================================ */

const getTC = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await findStudent(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found', data: null });
    }

    const pdfBuffer = await generateTC(student);
    const now = new Date();

    const setFields = {
      'tcCertificate.lastDownloadedAt': now,
      'tcCertificate.lastDownloadedBy': req.user._id,
    };

    if (!student.tcCertificate?.firstDownloadedAt) {
      setFields['tcCertificate.firstDownloadedAt'] = now;
    }

    await Student.findByIdAndUpdate(student._id, {
      $inc: { 'tcCertificate.downloadCount': 1 },
      $set: setFields,
    });

    return sendPdfResponse(res, pdfBuffer, `transfer-certificate-${student.studentId}.pdf`);
  } catch (error) {
    return sendError(res, error);
  }
};

/* ============================================================
   TC — DUPLICATE HTML (for print window)
   ============================================================ */

const getDuplicateTCHtml = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { requestId } = req.query;

    const student = await findStudent(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found', data: null });
    }

    if (!requestId || !isValidObjectId(requestId)) {
      const error = new Error('Valid requestId is required');
      error.statusCode = 400;
      throw error;
    }

    const request = await TCDuplicateRequest.findOne({
      _id: requestId,
      studentId: student._id,
      status: 'approved',
      consumed: false,
    });

    if (!request) {
      const error = new Error('No approved duplicate TC request found for this student.');
      error.statusCode = 404;
      throw error;
    }

    const manualTcNumber = req.query.tc_number;
    if (!manualTcNumber) {
      const error = new Error('TC Number is required.');
      error.statusCode = 400;
      throw error;
    }

    if (!request.duplicateTcNumber || request.duplicateTcNumber !== manualTcNumber) {
      request.duplicateTcNumber = manualTcNumber;
    }

    const html = generateDuplicateTCHtml(student, request, {
      ...req.query,
      duplicate_tc_number: manualTcNumber,
      verification_code: makeVerificationCode(request.duplicateTcNumber),
    });

    // Mark request as consumed
    request.consumed = true;
    request.consumedAt = new Date();
    await request.save();

    // Log print
    await TCPrintLog.create({
      studentId: student._id,
      printedBy: req.user._id,
      printType: 'duplicate',
      tcNumber: request.duplicateTcNumber,
      duplicateRequestId: request._id,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).send(html);
  } catch (error) {
    return sendError(res, error);
  }
};

/* ============================================================
   TC — DUPLICATE REQUESTS
   ============================================================ */

const createDuplicateTCRequest = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { reason, documentData, documentName, documentMimeType, documentSize } = req.body;

    const student = await findStudent(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found', data: null });
    }

    // Must have had original printed first
    if ((student.tcCertificate?.downloadCount || 0) === 0) {
      const error = new Error('Original TC has not been printed yet. Print the original TC first.');
      error.statusCode = 400;
      throw error;
    }

    if (!reason || !String(reason).trim()) {
      const error = new Error('Reason for duplicate TC is required.');
      error.statusCode = 400;
      throw error;
    }

    if (!documentData) {
      const error = new Error('A supporting document is required for duplicate TC requests.');
      error.statusCode = 400;
      throw error;
    }

    const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (documentMimeType && !ALLOWED_MIME.includes(documentMimeType)) {
      const error = new Error('Only PDF, JPG, and PNG files are allowed.');
      error.statusCode = 400;
      throw error;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (documentSize && Number(documentSize) > MAX_SIZE) {
      const error = new Error('File size must not exceed 5MB.');
      error.statusCode = 400;
      throw error;
    }

    const request = await TCDuplicateRequest.create({
      studentId: student._id,
      requestedBy: req.user._id,
      reason: String(reason).trim(),
      status: 'approved', // Admin-initiated requests auto-approved
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      documentData: documentData || '',
      documentName: documentName || '',
      documentMimeType: documentMimeType || '',
      documentSize: Number(documentSize || 0),
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });

    const populated = await TCDuplicateRequest.findById(request._id)
      .populate('studentId', 'name studentId')
      .populate('requestedBy', 'name email')
      .lean();

    return sendSuccess(res, 201, 'Duplicate TC request created and approved', {
      id: populated._id,
      studentId: populated.studentId?._id,
      studentName: populated.studentId?.name || '-',
      studentCode: populated.studentId?.studentId || '-',
      requestedById: populated.requestedBy?._id,
      requestedByName: populated.requestedBy?.name || '-',
      status: populated.status,
      reason: populated.reason,
      adminComment: populated.adminComment,
      consumed: populated.consumed,
      createdAt: populated.createdAt,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getDuplicateTCRequests = async (req, res) => {
  try {
    const { studentId, status } = req.query;

    const filter = {};
    if (studentId && isValidObjectId(studentId)) filter.studentId = studentId;
    if (status) filter.status = status;

    const requests = await TCDuplicateRequest.find(filter)
      .populate('studentId', 'name studentId')
      .populate('requestedBy', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = requests.map((r) => ({
      id: r._id,
      studentId: r.studentId?._id,
      studentName: r.studentId?.name || '-',
      studentCode: r.studentId?.studentId || '-',
      requestedById: r.requestedBy?._id,
      requestedByName: r.requestedBy?.name || '-',
      reviewedByName: r.reviewedBy?.name || '',
      status: r.status,
      reason: r.reason,
      adminComment: r.adminComment,
      consumed: r.consumed,
      reviewedAt: r.reviewedAt,
      createdAt: r.createdAt,
      hasDocument: Boolean(r.documentData),
      documentName: r.documentName,
      duplicateTcNumber: r.duplicateTcNumber,
    }));

    return sendSuccess(res, 200, 'Duplicate TC requests fetched', formatted);
  } catch (error) {
    return sendError(res, error);
  }
};

const reviewDuplicateTCRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminComment = '' } = req.body;

    if (!['approved', 'rejected'].includes(action)) {
      const error = new Error('action must be "approved" or "rejected"');
      error.statusCode = 400;
      throw error;
    }

    if (!isValidObjectId(id)) {
      const error = new Error('Invalid request ID');
      error.statusCode = 400;
      throw error;
    }

    const request = await TCDuplicateRequest.findById(id);
    if (!request) {
      const error = new Error('Request not found');
      error.statusCode = 404;
      throw error;
    }

    if (request.status !== 'pending') {
      const error = new Error(`Request is already ${request.status}`);
      error.statusCode = 400;
      throw error;
    }

    request.status = action;
    request.adminComment = String(adminComment).trim();
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    const populated = await TCDuplicateRequest.findById(request._id)
      .populate('studentId', 'name studentId')
      .populate('requestedBy', 'name')
      .populate('reviewedBy', 'name')
      .lean();

    return sendSuccess(res, 200, `Request ${action}`, {
      id: populated._id,
      studentId: populated.studentId?._id,
      studentName: populated.studentId?.name || '-',
      studentCode: populated.studentId?.studentId || '-',
      requestedByName: populated.requestedBy?.name || '-',
      reviewedByName: populated.reviewedBy?.name || '',
      status: populated.status,
      reason: populated.reason,
      adminComment: populated.adminComment,
      consumed: populated.consumed,
      reviewedAt: populated.reviewedAt,
      createdAt: populated.createdAt,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/* ============================================================
   TC — PRINT LOGS
   ============================================================ */

const getTCPrintLogs = async (req, res) => {
  try {
    const { studentId } = req.query;

    const filter = {};
    if (studentId && isValidObjectId(studentId)) filter.studentId = studentId;

    const logs = await TCPrintLog.find(filter)
      .populate('studentId', 'name studentId')
      .populate('printedBy', 'name email')
      .sort({ printedAt: -1 })
      .lean();

    const formatted = logs.map((log) => ({
      id: log._id,
      studentId: log.studentId?._id,
      studentName: log.studentId?.name || '-',
      studentCode: log.studentId?.studentId || '-',
      printedByName: log.printedBy?.name || '-',
      printType: log.printType,
      tcNumber: log.tcNumber,
      ipAddress: log.ipAddress,
      printedAt: log.printedAt,
    }));

    return sendSuccess(res, 200, 'Print logs fetched', formatted);
  } catch (error) {
    return sendError(res, error);
  }
};

/* ============================================================
   FEE RECEIPT
   ============================================================ */

const getFeeReceipt = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { paymentId } = req.query;
    console.log(`[getFeeReceipt] Route entered — studentId: ${studentId}, paymentId: ${paymentId || 'latest'}`);

    const student = await findStudent(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found', data: null });
    }
    console.log(`[getFeeReceipt] Student found: ${student.name} (${student._id})`);

    const fee = await Fee.findOne({ studentId: student._id });
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found', data: null });
    }
    console.log(`[getFeeReceipt] Fee record found: ${fee._id}`);

    let payment = null;

    if (paymentId) {
      payment = await Payment.findOne({ _id: paymentId, studentId: student._id });
    } else {
      payment = await Payment.findOne({ studentId: student._id }).sort({ date: -1, createdAt: -1 });
    }

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found', data: null });
    }
    console.log(`[getFeeReceipt] Payment found: ${payment._id}, amount: ${payment.amount}`);

    console.log('[getFeeReceipt] Starting PDF generation...');
    const pdfBuffer = await generateFeeReceipt(student, payment, fee);
    console.log(`[getFeeReceipt] PDF generated successfully (${pdfBuffer.length} bytes), sending response`);

    return sendPdfResponse(res, pdfBuffer, `fee-receipt-${student.studentId}.pdf`);
  } catch (error) {
    console.error('[getFeeReceipt] Receipt generation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getFeeReceiptHtml = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { paymentId } = req.query;

    const student = await findStudent(studentId);
    if (!student) {
      return res.status(200).send(noDataHtml('Student Not Found', 'The selected student could not be found in the system.'));
    }

    const fee = await Fee.findOne({ studentId: student._id });
    if (!fee) {
      return res.status(200).send(noDataHtml('No Fee Record', `No fee structure has been created for ${student.name || 'this student'} yet. Please set up fees first.`));
    }

    let payment = null;

    if (paymentId) {
      payment = await Payment.findOne({ _id: paymentId, studentId: student._id });
    } else {
      payment = await Payment.findOne({ studentId: student._id }).sort({ date: -1, createdAt: -1 });
    }

    if (!payment) {
      return res.status(200).send(noDataHtml('No Payment Found', `No payments have been recorded for ${student.name || 'this student'} yet. Please record a payment first.`));
    }

    const html = generateFeeReceiptHtml(student, payment, fee);
    return res.status(200).send(html);
  } catch (error) {
    console.error('[getFeeReceiptHtml] Receipt HTML generation error:', error);
    return res.status(200).send(noDataHtml('Error', `An error occurred while generating the receipt: ${error.message}`));
  }
};

const getAdmissionFormHtml = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await findStudent(studentId);
    if (!student) {
      return res.status(200).send(noDataHtml('Student Not Found', 'The selected student could not be found in the system.'));
    }

    const html = generateAdmissionFormHtml(student);
    return res.status(200).send(html);
  } catch (error) {
    return res.status(200).send(noDataHtml('Error', `An error occurred while generating the admission form: ${error.message}`));
  }
};

module.exports = {
  getDocumentRecords,
  createDocumentRecord,
  deleteDocumentRecord,
  getBonafide,
  getTC,
  getTCStatus,
  getTCHtml,
  getDuplicateTCHtml,
  createDuplicateTCRequest,
  getDuplicateTCRequests,
  reviewDuplicateTCRequest,
  getTCPrintLogs,
  getFeeReceipt,
  getFeeReceiptHtml,
  getAdmissionFormHtml,
};