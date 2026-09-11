const express = require('express');
const router = express.Router();
const priorityController = require('../controllers/priorityController');

// Get all priorities (public - needed for ticket creation)
router.get('/', priorityController.getAllPriorities);

module.exports = router;
