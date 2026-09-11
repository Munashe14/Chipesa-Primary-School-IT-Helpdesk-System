const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ticketSchema, ticketUpdateSchema, commentSchema } = require('../utils/validationSchemas');

// All routes require authentication
router.use(auth);

// Get all tickets (filtered by role)
router.get('/', ticketController.getAllTickets);

// Get ticket by ID
router.get('/:id', ticketController.getTicketById);

// Create ticket
router.post('/', validate(ticketSchema), ticketController.createTicket);

// Update ticket
router.put('/:id', validate(ticketUpdateSchema), ticketController.updateTicket);

// Delete ticket (Admin only)
router.delete('/:id', authorize('Administrator'), ticketController.deleteTicket);

// Assign technician to ticket (Admin or Technician)
router.put('/:id/assign', ticketController.assignTechnician);

// Update ticket status (Technician or Admin)
router.put('/:id/status', ticketController.updateStatus);

// Add comment to ticket
router.post('/:id/comments', validate(commentSchema), ticketController.addComment);

// Get ticket comments
router.get('/:id/comments', ticketController.getComments);

// Get ticket history
router.get('/:id/history', ticketController.getHistory);

module.exports = router;
