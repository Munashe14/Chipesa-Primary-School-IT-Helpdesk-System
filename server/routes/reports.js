const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Generate ticket report
router.get('/tickets', reportController.getTicketReport);

// Generate performance report (Admin and Management only)
router.get('/performance', authorize('Administrator', 'School Management'), reportController.getPerformanceReport);

// Export to PDF (Admin and Management only)
router.get('/export/pdf', authorize('Administrator', 'School Management'), reportController.exportPDF);

// Export to Excel (Admin and Management only)
router.get('/export/excel', authorize('Administrator', 'School Management'), reportController.exportExcel);

module.exports = router;
