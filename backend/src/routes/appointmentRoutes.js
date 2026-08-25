const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

// Public Quick Slot Booking (for Landing Page / Direct Inquiries)
router.post('/quick-book', appointmentController.quickBookPublicAppointment);

// Authenticated Routes
router.use(authenticateToken);

router.get('/', appointmentController.getAllAppointments);
router.post('/', authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT'), appointmentController.createAppointment);
router.patch('/:id/complete', authorizeRoles('ADMIN', 'DOCTOR'), appointmentController.completeAppointment);
router.put('/:id/status', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), appointmentController.updateAppointmentStatus);

module.exports = router;

