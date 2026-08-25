const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.use(authenticateToken);

// Document view endpoint (Admin only)
router.get('/documents/view/:docId', authorizeRoles('ADMIN'), staffController.viewDocumentContent);

// Unified Staff Directory
router.get('/', staffController.getAllStaff);
router.get('/:id', staffController.getStaffById);
router.post('/', authorizeRoles('ADMIN'), staffController.createStaff);
router.put('/:id', authorizeRoles('ADMIN'), staffController.updateStaff);
router.patch('/:id/availability', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), staffController.updateAvailability);

// Secure Staff Documents (Admin only)
router.post('/:id/documents', authorizeRoles('ADMIN'), staffController.uploadDocument);
router.get('/:id/documents/:docId/signed-url', authorizeRoles('ADMIN'), staffController.getSignedDocumentUrl);

module.exports = router;
