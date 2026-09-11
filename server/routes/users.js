const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createUserSchema, updateUserSchema } = require('../utils/validationSchemas');

// All routes require authentication
router.use(auth);

// Get all users (Admin only)
router.get('/', authorize('Administrator'), userController.getAllUsers);

// Get current user
router.get('/me', userController.getCurrentUser);

// Get user by ID
router.get('/:id', userController.getUserById);

// Create user (Admin only)
router.post('/', authorize('Administrator'), validate(createUserSchema), userController.createUser);

// Update user (Admin or own user)
router.put('/:id', validate(updateUserSchema), userController.updateUser);

// Delete user (Admin only)
router.delete('/:id', authorize('Administrator'), userController.deleteUser);

// Disable user (Admin only)
router.put('/:id/disable', authorize('Administrator'), userController.disableUser);

// Enable user (Admin only)
router.put('/:id/enable', authorize('Administrator'), userController.enableUser);

// Reset user password (Admin only)
router.post('/:id/reset-password', authorize('Administrator'), userController.resetUserPassword);

module.exports = router;
