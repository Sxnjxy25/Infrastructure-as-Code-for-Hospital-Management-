const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/tests', authorizeRoles('ADMIN', 'LAB_TECHNICIAN', 'DOCTOR', 'PATIENT'), labController.getLabTests);
router.post('/tests', authorizeRoles('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN'), labController.createLabTest);
router.put('/tests/:id/result', authorizeRoles('ADMIN', 'LAB_TECHNICIAN', 'DOCTOR'), labController.updateLabResult);

module.exports = router;
