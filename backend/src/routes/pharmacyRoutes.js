const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/inventory', authorizeRoles('ADMIN', 'PHARMACIST', 'DOCTOR'), pharmacyController.getInventory);
router.post('/medicine', authorizeRoles('ADMIN', 'PHARMACIST'), pharmacyController.addMedicine);
router.put('/medicine/:id/stock', authorizeRoles('ADMIN', 'PHARMACIST'), pharmacyController.updateStock);

module.exports = router;
