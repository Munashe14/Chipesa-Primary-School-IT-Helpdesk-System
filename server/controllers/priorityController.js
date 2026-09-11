const pool = require('../config/database');

// Get all priorities
const getAllPriorities = async (req, res) => {
  try {
    const [priorities] = await pool.query('SELECT * FROM priorities ORDER BY level');
    res.json(priorities);
  } catch (error) {
    console.error('Get priorities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllPriorities
};
