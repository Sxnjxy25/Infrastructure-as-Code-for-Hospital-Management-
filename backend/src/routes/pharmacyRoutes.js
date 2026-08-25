const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/inventory', authorizeRoles('ADMIN', 'PHARMACIST', 'DOCTOR'), pharmacyController.getInventory);
router.get('/low-stock', authorizeRoles('ADMIN', 'PHARMACIST'), pharmacyController.getLowStockAlerts);
router.post('/medicine', authorizeRoles('ADMIN', 'PHARMACIST'), pharmacyController.addMedicine);
router.put('/medicine/:id/stock', authorizeRoles('ADMIN', 'PHARMACIST'), pharmacyController.updateStock);
router.post('/dispense', authorizeRoles('ADMIN', 'PHARMACIST'), pharmacyController.dispenseMedicines);

module.exports = router;
