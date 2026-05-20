const express = require('express');

const {
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
  getAdmissionFormHtml,
} = require('../controllers/document.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

/* ================================================
   DOCUMENT RECORDS (admin + clerk)
   ================================================ */
router.get('/', allowRoles('admin', 'clerk', 'teacher'), getDocumentRecords);
router.post('/', allowRoles('admin', 'clerk'), createDocumentRecord);
router.delete('/:id', allowRoles('admin', 'clerk'), deleteDocumentRecord);

/* ================================================
   BONAFIDE (admin + clerk)
   ================================================ */
router.get('/bonafide/:studentId', allowRoles('admin', 'clerk'), getBonafide);

/* ================================================
   FEE RECEIPT (admin + clerk)
   ================================================ */
router.get('/receipt/:studentId', allowRoles('admin', 'clerk'), getFeeReceipt);

/* ================================================
   ADMISSION FORM (admin + clerk)
   ================================================ */
router.get('/admission-form/:studentId/html', allowRoles('admin', 'clerk'), getAdmissionFormHtml);

/* ================================================
   TC — STATUS (admin only)
   ================================================ */
router.get('/tc-status/:studentId', allowRoles('admin'), getTCStatus);

/* ================================================
   TC — ORIGINAL HTML PRINT (admin only, one-time)
   ================================================ */
router.get('/tc/:studentId/html', allowRoles('admin'), getTCHtml);

/* ================================================
   TC — LEGACY PDF (admin only, kept for compat)
   ================================================ */
router.get('/tc/:studentId', allowRoles('admin'), getTC);

/* ================================================
   TC — DUPLICATE HTML PRINT (admin only)
   ================================================ */
router.get('/tc/:studentId/duplicate-html', allowRoles('admin'), getDuplicateTCHtml);

/* ================================================
   TC — DUPLICATE REQUESTS (admin only)
   ================================================ */
router.get('/tc-duplicate-requests', allowRoles('admin'), getDuplicateTCRequests);
router.post('/tc/:studentId/request-duplicate', allowRoles('admin'), createDuplicateTCRequest);
router.patch(
  '/tc-duplicate-requests/:id/review',
  allowRoles('admin'),
  reviewDuplicateTCRequest
);

/* ================================================
   TC — PRINT LOGS / AUDIT (admin only)
   ================================================ */
router.get('/tc-print-logs', allowRoles('admin'), getTCPrintLogs);

module.exports = router;