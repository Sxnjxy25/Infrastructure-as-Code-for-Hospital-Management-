const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);
router.put('/:id/availability', authorizeRoles('ADMIN', 'DOCTOR'), doctorController.updateAvailability);

module.exports = router;
