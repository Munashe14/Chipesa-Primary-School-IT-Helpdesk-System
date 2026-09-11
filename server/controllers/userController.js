const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : email);
const normalizePassword = (password) => (typeof password === 'string' ? password.trim() : password);

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.department, 
             u.is_active, u.created_at, u.last_login,
             r.name as role_name, r.id as role_id
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT u.*, r.name as role_name FROM
      users u JOIN roles r ON u.role_id =
      r.id WHERE u.email = ?
    `, [normalizeEmail]);

    console.log('LOGIN EMAIL: ',
      normalizedEmail
    );
    console.log('USERS FOUND:', users.length)

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    console.log('USER ID: ', user.id);
    console.log('USER ACTIVE: ', user.is_active);

    if(!user.is_active){
      return res.status(401).json({ message: 'Account disabled'});
    }

    const isMatch = await bcrypt.compare(
      normalizeEmail,
      user.password
    );

    console.log('PASSWORD MATCH: ', isMatch);

    if (!isMatch){
      return res.status(401).json({message:
        'Invalid credentials'
      });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has permission (Admin or own user)
    if (req.user.roleName !== 'Administrator' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const [users] = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.department, 
             u.is_active, u.created_at, u.last_login,
             r.name as role_name, r.id as role_id
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [id]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create user (Admin only)
const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, department, roleId } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = normalizePassword(password);

    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(normalizedPassword, salt);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password, phone, department, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [firstName, lastName, normalizedEmail, hashedPassword, phone, department, roleId]
    );

    res.status(201).json({
      message: 'User created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, department, roleId } = req.body;

    // Check if user has permission (Admin or own user)
    if (req.user.roleName !== 'Administrator' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // If not admin, cannot change role
    if (req.user.roleName !== 'Administrator' && roleId) {
      return res.status(403).json({ message: 'Cannot change role' });
    }

    // Check if email is being changed and if it already exists
    if (email) {
      const [existingUsers] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (firstName) {
      updates.push('first_name = ?');
      values.push(firstName);
    }
    if (lastName) {
      updates.push('last_name = ?');
      values.push(lastName);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (department !== undefined) {
      updates.push('department = ?');
      values.push(department);
    }
    if (roleId && req.user.roleName === 'Administrator') {
      updates.push('role_id = ?');
      values.push(roleId);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user (Admin only)
// If the user has tickets/comments/history referencing them, a hard delete
// is blocked by the database's foreign key constraints. In that case we
// fall back to disabling the account instead, so ticket history is never
// silently destroyed and the admin doesn't hit a dead end.
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting own account
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    try {
      await pool.query('DELETE FROM users WHERE id = ?', [id]);
      return res.json({ message: 'User deleted successfully' });
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
        // User has tickets/comments/history tied to them — disable instead
        await pool.query('UPDATE users SET is_active = FALSE WHERE id = ?', [id]);
        return res.json({
          message: 'This user has existing tickets or activity, so they were disabled instead of deleted to preserve history.',
          disabled: true
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Disable user (Admin only)
const disableUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent disabling own account
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ message: 'Cannot disable your own account' });
    }

    await pool.query('UPDATE users SET is_active = FALSE WHERE id = ?', [id]);

    res.json({ message: 'User disabled successfully' });
  } catch (error) {
    console.error('Disable user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Enable user (Admin only)
const enableUser = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('UPDATE users SET is_active = TRUE WHERE id = ?', [id]);

    res.json({ message: 'User enabled successfully' });
  } catch (error) {
    console.error('Enable user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset user password (Admin only)
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  getCurrentUser,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  disableUser,
  enableUser,
  resetUserPassword
};