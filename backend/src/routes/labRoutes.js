const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/tests', authorizeRoles('ADMIN', 'LAB_TECHNICIAN', 'DOCTOR', 'PATIENT'), labController.getLabTests);
router.post('/tests', authorizeRoles('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN'), labController.createLabTest);
router.patch('/tests/:id/status', authorizeRoles('ADMIN', 'LAB_TECHNICIAN'), labController.updateLabStatus);
router.put('/tests/:id/result', authorizeRoles('ADMIN', 'LAB_TECHNICIAN'), labController.completeLabResult);
router.patch('/tests/:id/complete', authorizeRoles('ADMIN', 'LAB_TECHNICIAN'), labController.completeLabResult);

module.exports = router;
