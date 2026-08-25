const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'ACCOUNTANT'), patientController.getAllPatients);
router.get('/:id', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'), patientController.getPatientById);
router.post('/', authorizeRoles('ADMIN', 'RECEPTIONIST'), patientController.createPatient);
router.put('/:id', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), patientController.updatePatient);

module.exports = router;
