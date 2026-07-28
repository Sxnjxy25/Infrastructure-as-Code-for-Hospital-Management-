const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/invoices', authorizeRoles('ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'PATIENT'), billingController.getInvoices);
router.post('/invoices', authorizeRoles('ADMIN', 'ACCOUNTANT'), billingController.createInvoice);
router.put('/invoices/:id/status', authorizeRoles('ADMIN', 'ACCOUNTANT'), billingController.updateInvoiceStatus);

module.exports = router;
