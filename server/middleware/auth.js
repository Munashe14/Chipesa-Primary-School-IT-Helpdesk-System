const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const normalizeRoleName = (roleName) => {
  const mapping = {
    'IT Chief Officer': 'Administrator',
    'IT Chief': 'Administrator',
    'Admin': 'Administrator',
    'Employee': 'Staff User',
    'Staff': 'Staff User'
  };
  return mapping[roleName] || roleName;
};

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const [users] = await pool.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(401).json({ message: 'User account is disabled' });
    }

    const normalizedRole = normalizeRoleName(user.role_name);

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      roleId: user.role_id,
      roleName: normalizedRole,
      displayRoleName: user.role_name
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.roleName)) {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }

    next();
  };
};

module.exports = { auth, authorize };
