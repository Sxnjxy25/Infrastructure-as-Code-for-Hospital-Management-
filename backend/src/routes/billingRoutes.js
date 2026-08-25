const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/invoices', authorizeRoles('ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'PATIENT'), billingController.getInvoices);
router.get('/invoices/:id', authorizeRoles('ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'PATIENT'), billingController.getInvoiceById);
router.post('/invoices', authorizeRoles('ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'), billingController.createInvoice);
router.post('/invoices/:id/payments', authorizeRoles('ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'), billingController.recordPayment);
router.get('/reception', authorizeRoles('ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'), billingController.getReceptionInvoices);
router.get('/pharmacy', authorizeRoles('ADMIN', 'ACCOUNTANT', 'PHARMACIST'), billingController.getPharmacyInvoices);
router.get('/revenue', authorizeRoles('ADMIN', 'ACCOUNTANT'), billingController.getDepartmentRevenue);

module.exports = router;
