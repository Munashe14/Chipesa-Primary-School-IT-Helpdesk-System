const pool = require('../config/database');

// Get dashboard statistics
const getStats = async (req, res) => {
  try {
    let stats = {};

    if (req.user.roleName === 'Staff User') {
      // Staff user stats
      const [ticketStats] = await pool.query(`
        SELECT 
          COUNT(*) as total_tickets,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tickets,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tickets,
          SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_tickets,
          SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_tickets
        FROM tickets
        WHERE reporter_id = ?
      `, [req.user.id]);

      const [recentTickets] = await pool.query(`
        SELECT t.*, c.name as category_name, p.name as priority_name
        FROM tickets t
        JOIN categories c ON t.category_id = c.id
        JOIN priorities p ON t.priority_id = p.id
        WHERE t.reporter_id = ?
        ORDER BY t.created_at DESC
        LIMIT 5
      `, [req.user.id]);

      stats = {
        ...ticketStats[0],
        recentTickets
      };
    } else if (req.user.roleName === 'IT Technician') {
      // Technician stats
      const [ticketStats] = await pool.query(`
        SELECT 
          COUNT(*) as total_assigned,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tickets,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tickets,
          SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_tickets,
          SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue_tickets,
          SUM(CASE WHEN priority_id = 4 THEN 1 ELSE 0 END) as high_priority_tickets
        FROM tickets
        WHERE assigned_technician_id = ?
      `, [req.user.id]);

      const [recentTickets] = await pool.query(`
        SELECT t.*, c.name as category_name, p.name as priority_name, 
               r.first_name as reporter_first_name, r.last_name as reporter_last_name
        FROM tickets t
        JOIN categories c ON t.category_id = c.id
        JOIN priorities p ON t.priority_id = p.id
        JOIN users r ON t.reporter_id = r.id
        WHERE t.assigned_technician_id = ?
        ORDER BY t.created_at DESC
        LIMIT 5
      `, [req.user.id]);

      stats = {
        ...ticketStats[0],
        recentTickets
      };
    } else if (req.user.roleName === 'Administrator') {
      // Admin stats
      const [userStats] = await pool.query('SELECT COUNT(*) as total_users FROM users');
      const [ticketStats] = await pool.query(`
        SELECT 
          COUNT(*) as total_tickets,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tickets,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tickets,
          SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_tickets,
          SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_tickets
        FROM tickets
      `);

      const [recentTickets] = await pool.query(`
        SELECT t.*, c.name as category_name, p.name as priority_name,
               r.first_name as reporter_first_name, r.last_name as reporter_last_name,
               tech.first_name as technician_first_name, tech.last_name as technician_last_name
        FROM tickets t
        JOIN categories c ON t.category_id = c.id
        JOIN priorities p ON t.priority_id = p.id
        JOIN users r ON t.reporter_id = r.id
        LEFT JOIN users tech ON t.assigned_technician_id = tech.id
        ORDER BY t.created_at DESC
        LIMIT 5
      `);

      stats = {
        totalUsers: userStats[0].total_users,
        ...ticketStats[0],
        recentTickets
      };
    } else if (req.user.roleName === 'School Management') {
      // Management stats (read-only)
      const [ticketStats] = await pool.query(`
        SELECT 
          COUNT(*) as total_tickets,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tickets,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tickets,
          SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_tickets,
          SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_tickets
        FROM tickets
      `);

      const [recentTickets] = await pool.query(`
        SELECT t.*, c.name as category_name, p.name as priority_name,
               r.first_name as reporter_first_name, r.last_name as reporter_last_name
        FROM tickets t
        JOIN categories c ON t.category_id = c.id
        JOIN priorities p ON t.priority_id = p.id
        JOIN users r ON t.reporter_id = r.id
        ORDER BY t.created_at DESC
        LIMIT 5
      `);

      stats = {
        ...ticketStats[0],
        recentTickets
      };
    }

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get chart data
const getCharts = async (req, res) => {
  try {
    let chartData = {};

    // Tickets by category
    const [categoryData] = await pool.query(`
      SELECT c.name as category, COUNT(t.id) as count
      FROM categories c
      LEFT JOIN tickets t ON c.id = t.category_id
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `);

    // Tickets by priority
    const [priorityData] = await pool.query(`
      SELECT p.name as priority, COUNT(t.id) as count, p.color
      FROM priorities p
      LEFT JOIN tickets t ON p.id = t.priority_id
      GROUP BY p.id, p.name, p.color
      ORDER BY p.level DESC
    `);

    // Tickets by status
    const [statusData] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM tickets
      GROUP BY status
    `);

    // Monthly ticket trends (last 6 months)
    const [monthlyData] = await pool.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM tickets
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // Technician performance (for admin/management)
    if (req.user.roleName === 'Administrator' || req.user.roleName === 'School Management') {
      const [technicianData] = await pool.query(`
        SELECT 
          u.id,
          CONCAT(u.first_name, ' ', u.last_name) as name,
          COUNT(t.id) as total_assigned,
          SUM(CASE WHEN t.status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
          AVG(TIMESTAMPDIFF(HOUR, t.created_at, COALESCE(t.resolved_at, NOW()))) as avg_resolution_hours
        FROM users u
        LEFT JOIN tickets t ON u.id = t.assigned_technician_id
        WHERE u.role_id = (SELECT id FROM roles WHERE name = 'IT Technician')
        GROUP BY u.id, u.first_name, u.last_name
      `);

      chartData.technicianPerformance = technicianData;
    }

    chartData = {
      ...chartData,
      byCategory: categoryData,
      byPriority: priorityData,
      byStatus: statusData,
      monthlyTrends: monthlyData
    };

    res.json(chartData);
  } catch (error) {
    console.error('Get charts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStats,
  getCharts
};
