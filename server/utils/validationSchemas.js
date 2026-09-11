const Joi = require('joi');

// Register validation schema
const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'First name is required',
    'string.min': 'First name must be at least 2 characters',
    'string.max': 'First name cannot exceed 100 characters'
  }),
  lastName: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Last name is required',
    'string.min': 'Last name must be at least 2 characters',
    'string.max': 'Last name cannot exceed 100 characters'
  }),
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please enter a valid email address'
  }),
  password: Joi.string().trim().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base': 'Password must include at least one lowercase letter, one uppercase letter, one number, and one special character'
  }),
  phone: Joi.string().allow('', null),
  department: Joi.string().allow('', null),
  roleId: Joi.number().integer().required().messages({
    'any.required': 'Please select a role',
    'number.base': 'Role selection is invalid'
  })
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().trim().required()
});

// Change password validation schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
});

// Forgot password validation schema
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

// Reset password validation schema
const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
});

// User validation schemas
const createUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  phone: Joi.string().allow('', null),
  department: Joi.string().allow('', null),
  roleId: Joi.number().integer().required()
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(100),
  lastName: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  phone: Joi.string().allow('', null),
  department: Joi.string().allow('', null),
  roleId: Joi.number().integer()
});

// Ticket validation schema
const ticketSchema = Joi.object({
  title: Joi.string().min(5).max(255).required(),
  description: Joi.string().min(10).required(),
  categoryId: Joi.number().integer().required(),
  priorityId: Joi.number().integer().required()
});

// Ticket update validation schema
const ticketUpdateSchema = Joi.object({
  title: Joi.string().min(5).max(255),
  description: Joi.string().min(10),
  categoryId: Joi.number().integer(),
  priorityId: Joi.number().integer(),
  status: Joi.string().valid('Pending', 'In Progress', 'Resolved', 'Closed', 'Overdue'),
  assignedTechnicianId: Joi.number().integer().allow(null),
  resolutionNotes: Joi.string().allow('', null)
});

// Comment validation schema
const commentSchema = Joi.object({
  comment: Joi.string().min(1).required(),
  isInternal: Joi.boolean().default(false)
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createUserSchema,
  updateUserSchema,
  ticketSchema,
  ticketUpdateSchema,
  commentSchema
};
