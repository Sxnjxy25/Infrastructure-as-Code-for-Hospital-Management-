const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', appointmentController.getAllAppointments);
router.post('/', authorizeRoles('ADMIN', 'RECEPTIONIST', 'PATIENT'), appointmentController.createAppointment);
router.put('/:id/status', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), appointmentController.updateAppointmentStatus);

module.exports = router;
