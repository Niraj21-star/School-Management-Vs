const mongoose = require('mongoose');
const Student = require('../models/Student').Student;
const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const { DocumentRecord, DOCUMENT_TYPES, DOCUMENT_STATUSES } = require('../models/DocumentRecord');
const { TCDuplicateRequest } = require('../models/TCDuplicateRequest');
const {
  generateBonafide,
  generateTC,
  generateFeeReceipt,
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
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, error) => {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal Server Error',
    data: null,
  });
};

const formatDuplicateRequest = (request) => ({
  id: request?._id,
  studentId: request?.studentId?._id || request?.studentId,
  studentName: request?.studentId?.name || '-',
  studentCode: request?.studentId?.studentId || '-',
  requestedById: request?.requestedBy?._id || request?.requestedBy,
  requestedByName: request?.requestedBy?.name || '-',
  status: request?.status,
  reason: request?.reason || '',
  adminComment: request?.adminComment || '',
  consumed: Boolean(request?.consumed),
  reviewedByName: request?.reviewedBy?.name || '',
  reviewedAt: request?.reviewedAt,
  createdAt: request?.createdAt,
});

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

const getBonafide = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await findStudent(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found', data: null });
    }

    const pdfBuffer = await generateBonafide(student);

    return sendPdfResponse(res, pdfBuffer, `bonafide-${student.studentId}.pdf`);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
      data: null,
    });
  }
};

const getTC = async (req, res) => {
  try {
    const { studentId } = req.params;
    const requesterRole = req.user?.role;

    const student = await findStudent(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found', data: null });
    }

    const tcDownloadCount = student.tcCertificate?.downloadCount || 0;

    let approvedDuplicateRequest = null;
    if (requesterRole !== 'admin' && tcDownloadCount >= 1) {
      approvedDuplicateRequest = await TCDuplicateRequest.findOne({
        studentId: student._id,
        requestedBy: req.user._id,
        status: 'approved',
        consumed: false,
      }).sort({ createdAt: 1 });

      if (!approvedDuplicateRequest) {
        return res.status(403).json({
          success: false,
          message: 'Transfer Certificate already issued once. Please submit a duplicate TC request and wait for admin approval.',
          data: null,
        });
      }
    }

    const pdfBuffer = await generateTC(student);
    const now = new Date();

    if (requesterRole === 'admin') {
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
    } else {
      if (tcDownloadCount === 0) {
        const updatedStudent = await Student.findOneAndUpdate(
          {
            _id: student._id,
            $or: [
              { 'tcCertificate.downloadCount': { $exists: false } },
              { 'tcCertificate.downloadCount': 0 },
            ],
          },
          {
            $inc: { 'tcCertificate.downloadCount': 1 },
            $set: {
              'tcCertificate.firstDownloadedAt': now,
              'tcCertificate.lastDownloadedAt': now,
              'tcCertificate.lastDownloadedBy': req.user._id,
            },
          },
          { returnDocument: 'after' }
        );

        if (!updatedStudent) {
          return res.status(403).json({
            success: false,
            message: 'Transfer Certificate already issued once. Please submit a duplicate TC request and wait for admin approval.',
            data: null,
          });
        }
      } else {
        const updatedRequest = await TCDuplicateRequest.findOneAndUpdate(
          {
            _id: approvedDuplicateRequest._id,
            consumed: false,
            status: 'approved',
          },
          {
            $set: {
              consumed: true,
              consumedAt: now,
            },
          },
          { returnDocument: 'after' }
        );

        if (!updatedRequest) {
          return res.status(403).json({
            success: false,
            message: 'Duplicate TC approval is no longer available. Please submit a new request.',
            data: null,
          });
        }

        await Student.findByIdAndUpdate(student._id, {
          $inc: { 'tcCertificate.downloadCount': 1 },
          $set: {
            'tcCertificate.lastDownloadedAt': now,
            'tcCertificate.lastDownloadedBy': req.user._id,
          },
        });
      }
    }

    return sendPdfResponse(res, pdfBuffer, `transfer-certificate-${student.studentId}.pdf`);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
      data: null,
    });
  }
};

const createDuplicateTCRequest = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { reason = '' } = req.body || {};

    const student = await findStudent(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found', data: null });
    }

    const tcDownloadCount = student.tcCertificate?.downloadCount || 0;
    if (tcDownloadCount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate TC request is available only after initial TC has been issued.',
        data: null,
      });
    }

    const existingPending = await TCDuplicateRequest.findOne({
      studentId: student._id,
      requestedBy: req.user._id,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'A duplicate TC request is already pending for this student.',
        data: null,
      });
    }

    const request = await TCDuplicateRequest.create({
      studentId: student._id,
      requestedBy: req.user._id,
      reason: String(reason || '').trim(),
      status: 'pending',
    });

    const populated = await TCDuplicateRequest.findById(request._id)
      .populate('studentId', 'name studentId')
      .populate('requestedBy', 'name role')
      .lean();

    return sendSuccess(res, 201, 'Duplicate TC request submitted for admin approval.', formatDuplicateRequest(populated));
  } catch (error) {
    return sendError(res, error);
  }
};

const getDuplicateTCRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filters = {};

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filters.status = status;
    }

    if (req.user.role !== 'admin') {
      filters.requestedBy = req.user._id;
    }

    const requests = await TCDuplicateRequest.find(filters)
      .populate('studentId', 'name studentId')
      .populate('requestedBy', 'name role')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 200, 'Duplicate TC requests fetched.', requests.map(formatDuplicateRequest));
  } catch (error) {
    return sendError(res, error);
  }
};

const reviewDuplicateTCRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, adminComment = '' } = req.body || {};

    if (!isValidObjectId(requestId)) {
      const error = new Error('Invalid duplicate request id');
      error.statusCode = 400;
      throw error;
    }

    if (!['approve', 'reject'].includes(action)) {
      const error = new Error('action must be either approve or reject');
      error.statusCode = 400;
      throw error;
    }

    const request = await TCDuplicateRequest.findById(requestId);
    if (!request) {
      const error = new Error('Duplicate TC request not found');
      error.statusCode = 404;
      throw error;
    }

    if (request.status !== 'pending') {
      const error = new Error('This request has already been reviewed');
      error.statusCode = 409;
      throw error;
    }

    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.adminComment = String(adminComment || '').trim();
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    const populated = await TCDuplicateRequest.findById(request._id)
      .populate('studentId', 'name studentId')
      .populate('requestedBy', 'name role')
      .populate('reviewedBy', 'name role')
      .lean();

    return sendSuccess(
      res,
      200,
      `Duplicate TC request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      formatDuplicateRequest(populated)
    );
  } catch (error) {
    return sendError(res, error);
  }
};

const getFeeReceipt = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { paymentId } = req.query;

    const student = await findStudent(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found', data: null });
    }

    const fee = await Fee.findOne({ studentId: student._id });
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found', data: null });
    }

    let payment = null;

    if (paymentId) {
      payment = await Payment.findOne({ _id: paymentId, studentId: student._id });
    } else {
      payment = await Payment.findOne({ studentId: student._id }).sort({ date: -1, createdAt: -1 });
    }

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found', data: null });
    }

    const pdfBuffer = await generateFeeReceipt(student, payment, fee);

    return sendPdfResponse(res, pdfBuffer, `fee-receipt-${student.studentId}.pdf`);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
      data: null,
    });
  }
};

module.exports = {
  getDocumentRecords,
  createDocumentRecord,
  deleteDocumentRecord,
  getBonafide,
  getTC,
  getFeeReceipt,
  createDuplicateTCRequest,
  getDuplicateTCRequests,
  reviewDuplicateTCRequest,
};