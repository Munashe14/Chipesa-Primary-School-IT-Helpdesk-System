const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Get all categories (public - needed for ticket creation)
router.get('/', categoryController.getAllCategories);

module.exports = router;
