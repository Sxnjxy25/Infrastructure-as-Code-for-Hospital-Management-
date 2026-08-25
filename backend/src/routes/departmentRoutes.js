const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', departmentController.getAllDepartments);
router.post('/', authorizeRoles('ADMIN'), departmentController.createDepartment);
router.put('/:id', authorizeRoles('ADMIN'), departmentController.updateDepartment);

module.exports = router;
