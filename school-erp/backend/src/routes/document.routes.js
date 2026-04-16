const express = require('express');

const {
  getDocumentRecords,
  createDocumentRecord,
  deleteDocumentRecord,
  getBonafide,
  getTC,
  getFeeReceipt,
  createDuplicateTCRequest,
  getDuplicateTCRequests,
  reviewDuplicateTCRequest,
} = require('../controllers/document.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);
router.use(allowRoles('admin', 'clerk', 'teacher'));

router.get('/', getDocumentRecords);
router.post('/', allowRoles('admin', 'clerk'), createDocumentRecord);
router.delete('/:id', allowRoles('admin', 'clerk'), deleteDocumentRecord);

router.get('/bonafide/:studentId', getBonafide);
router.get('/tc/:studentId', getTC);
router.post('/tc/:studentId/request-duplicate', allowRoles('clerk'), createDuplicateTCRequest);
router.get('/tc-duplicate-requests', allowRoles('admin', 'clerk'), getDuplicateTCRequests);
router.patch('/tc-duplicate-requests/:requestId/review', allowRoles('admin'), reviewDuplicateTCRequest);
router.get('/receipt/:studentId', getFeeReceipt);

module.exports = router;