const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

// Get all roles (public - needed for registration)
router.get('/', roleController.getAllRoles);

module.exports = router;
