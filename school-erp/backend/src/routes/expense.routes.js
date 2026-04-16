const express = require('express');

const {
  createExpense,
  getAllExpenses,
  updateExpense,
  deleteExpense,
} = require('../controllers/expense.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', allowRoles('admin', 'clerk'), getAllExpenses);
router.post('/', allowRoles('admin', 'clerk'), createExpense);
router.put('/:id', allowRoles('admin'), updateExpense);
router.delete('/:id', allowRoles('admin'), deleteExpense);

module.exports = router;