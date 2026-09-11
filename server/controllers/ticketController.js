const pool = require('../config/database');
const { generateTicketNumber } = require('../utils/helpers');

// Helper function to create notification
const createNotification = async (userId, ticketId, title, message, type) => {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, ticket_id, title, message, type) VALUES (?, ?, ?, ?, ?)',
      [userId, ticketId, title, message, type]
    );
  } catch (error) {
    console.error('Notification creation error:', error);
  }
};

// Helper function to add ticket history
const addTicketHistory = async (ticketId, userId, action, fieldChanged, oldValue, newValue) => {
  try {
    await pool.query(
      'INSERT INTO ticket_history (ticket_id, user_id, action, field_changed, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
      [ticketId, userId, action, fieldChanged, oldValue, newValue]
    );
  } catch (error) {
    console.error('History creation error:', error);
  }
};

// Get all tickets (filtered by role)
const getAllTickets = async (req, res) => {
  try {
    const { status, priority, category, technician, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, 
             c.name as category_name, 
             p.name as priority_name, p.color as priority_color,
             r.first_name as reporter_first_name, r.last_name as reporter_last_name,
             tech.first_name as technician_first_name, tech.last_name as technician_last_name
      FROM tickets t
      JOIN categories c ON t.category_id = c.id
      JOIN priorities p ON t.priority_id = p.id
      JOIN users r ON t.reporter_id = r.id
      LEFT JOIN users tech ON t.assigned_technician_id = tech.id
      WHERE 1=1
    `;

    const params = [];

    // Role-based filtering
    if (req.user.roleName === 'Staff User') {
      query += ' AND t.reporter_id = ?';
      params.push(req.user.id);
    } else if (req.user.roleName === 'IT Technician') {
      query += ' AND (t.assigned_technician_id = ? OR t.assigned_technician_id IS NULL)';
      params.push(req.user.id);
    }

    // Apply filters
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND t.priority_id = ?';
      params.push(priority);
    }
    if (category) {
      query += ' AND t.category_id = ?';
      params.push(category);
    }
    if (technician) {
      query += ' AND t.assigned_technician_id = ?';
      params.push(technician);
    }
    if (search) {
      query += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.ticket_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [tickets] = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM tickets t WHERE 1=1';
    const countParams = [];

    if (req.user.roleName === 'Staff User') {
      countQuery += ' AND t.reporter_id = ?';
      countParams.push(req.user.id);
    } else if (req.user.roleName === 'IT Technician') {
      countQuery += ' AND (t.assigned_technician_id = ? OR t.assigned_technician_id IS NULL)';
      countParams.push(req.user.id);
    }

    if (status) {
      countQuery += ' AND t.status = ?';
      countParams.push(status);
    }
    if (priority) {
      countQuery += ' AND t.priority_id = ?';
      countParams.push(priority);
    }
    if (category) {
      countQuery += ' AND t.category_id = ?';
      countParams.push(category);
    }
    if (technician) {
      countQuery += ' AND t.assigned_technician_id = ?';
      countParams.push(technician);
    }
    if (search) {
      countQuery += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.ticket_number LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    res.json({
      tickets,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get ticket by ID
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const [tickets] = await pool.query(`
      SELECT t.*, 
             c.name as category_name, 
             p.name as priority_name, p.color as priority_color,
             r.first_name as reporter_first_name, r.last_name as reporter_last_name, r.email as reporter_email,
             tech.first_name as technician_first_name, tech.last_name as technician_last_name
      FROM tickets t
      JOIN categories c ON t.category_id = c.id
      JOIN priorities p ON t.priority_id = p.id
      JOIN users r ON t.reporter_id = r.id
      LEFT JOIN users tech ON t.assigned_technician_id = tech.id
      WHERE t.id = ?
    `, [id]);

    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const ticket = tickets[0];

    // Check permission
    if (req.user.roleName === 'Staff User' && ticket.reporter_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }

    // Get attachments
    const [attachments] = await pool.query(
      'SELECT * FROM attachments WHERE ticket_id = ?',
      [id]
    );

    res.json({ ...ticket, attachments });
  } catch (error) {
    console.error('Get ticket by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create ticket
const createTicket = async (req, res) => {
  try {
    const { title, description, categoryId, priorityId } = req.body;

    const ticketNumber = generateTicketNumber();

    const [result] = await pool.query(
      'INSERT INTO tickets (ticket_number, title, description, category_id, priority_id, reporter_id) VALUES (?, ?, ?, ?, ?, ?)',
      [ticketNumber, title, description, categoryId, priorityId, req.user.id]
    );

    // Add history
    await addTicketHistory(result.insertId, req.user.id, 'Created', null, null, 'Ticket created');

    // Notify administrators
    const [admins] = await pool.query(
      'SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = "Administrator"'
    );

    for (const admin of admins) {
      await createNotification(
        admin.id,
        result.insertId,
        'New Ticket Created',
        `Ticket ${ticketNumber} has been created by ${req.user.firstName} ${req.user.lastName}`,
        'ticket_created'
      );
    }

    res.status(201).json({
      message: 'Ticket created successfully',
      id: result.insertId,
      ticketNumber
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update ticket
const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, categoryId, priorityId, assignedTechnicianId, status, resolutionNotes } = req.body;

    // Get current ticket
    const [tickets] = await pool.query('SELECT * FROM tickets WHERE id = ?', [id]);
    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const currentTicket = tickets[0];

    // Check permission
    if (req.user.roleName === 'Staff User' && currentTicket.reporter_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this ticket' });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (title) {
      updates.push('title = ?');
      values.push(title);
      if (title !== currentTicket.title) {
        await addTicketHistory(id, req.user.id, 'Updated', 'title', currentTicket.title, title);
      }
    }
    if (description) {
      updates.push('description = ?');
      values.push(description);
      if (description !== currentTicket.description) {
        await addTicketHistory(id, req.user.id, 'Updated', 'description', currentTicket.description, description);
      }
    }
    if (categoryId) {
      updates.push('category_id = ?');
      values.push(categoryId);
      if (categoryId !== currentTicket.category_id) {
        await addTicketHistory(id, req.user.id, 'Updated', 'category_id', currentTicket.category_id, categoryId);
      }
    }
    if (priorityId) {
      updates.push('priority_id = ?');
      values.push(priorityId);
      if (priorityId !== currentTicket.priority_id) {
        await addTicketHistory(id, req.user.id, 'Updated', 'priority_id', currentTicket.priority_id, priorityId);
      }
    }

    // Only technicians and admins can assign technicians
    if (assignedTechnicianId !== undefined && (req.user.roleName === 'IT Technician' || req.user.roleName === 'Administrator')) {
      updates.push('assigned_technician_id = ?');
      values.push(assignedTechnicianId || null);
      if (assignedTechnicianId !== currentTicket.assigned_technician_id) {
        await addTicketHistory(id, req.user.id, 'Assigned', 'assigned_technician_id', currentTicket.assigned_technician_id, assignedTechnicianId);
        
        // Notify assigned technician
        if (assignedTechnicianId) {
          await createNotification(
            assignedTechnicianId,
            id,
            'Ticket Assigned',
            `You have been assigned to ticket ${currentTicket.ticket_number}`,
            'ticket_assigned'
          );
        }
      }
    }

    // Only technicians and admins can change status
    if (status && (req.user.roleName === 'IT Technician' || req.user.roleName === 'Administrator')) {
      updates.push('status = ?');
      values.push(status);
      if (status !== currentTicket.status) {
        await addTicketHistory(id, req.user.id, 'Status Updated', 'status', currentTicket.status, status);

        // Update timestamps based on status
        if (status === 'Resolved' && !currentTicket.resolved_at) {
          updates.push('resolved_at = NOW()');
        }
        if (status === 'Closed' && !currentTicket.closed_at) {
          updates.push('closed_at = NOW()');
        }

        // Notify reporter
        await createNotification(
          currentTicket.reporter_id,
          id,
          'Ticket Status Updated',
          `Your ticket ${currentTicket.ticket_number} status has been updated to ${status}`,
          'status_updated'
        );
      }
    }

    if (resolutionNotes !== undefined) {
      updates.push('resolution_notes = ?');
      values.push(resolutionNotes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);

    await pool.query(
      `UPDATE tickets SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    res.json({ message: 'Ticket updated successfully' });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete ticket
const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM tickets WHERE id = ?', [id]);

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign technician
const assignTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { technicianId } = req.body;

    // Get current ticket
    const [tickets] = await pool.query('SELECT * FROM tickets WHERE id = ?', [id]);
    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const ticket = tickets[0];

    await pool.query(
      'UPDATE tickets SET assigned_technician_id = ?, updated_at = NOW() WHERE id = ?',
      [technicianId, id]
    );

    await addTicketHistory(id, req.user.id, 'Assigned', 'assigned_technician_id', ticket.assigned_technician_id, technicianId);

    // Notify technician
    if (technicianId) {
      await createNotification(
        technicianId,
        id,
        'Ticket Assigned',
        `You have been assigned to ticket ${ticket.ticket_number}`,
        'ticket_assigned'
      );
    }

    res.json({ message: 'Technician assigned successfully' });
  } catch (error) {
    console.error('Assign technician error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update status
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Get current ticket
    const [tickets] = await pool.query('SELECT * FROM tickets WHERE id = ?', [id]);
    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const ticket = tickets[0];

    const updates = ['status = ?', 'updated_at = NOW()'];
    const values = [status];

    if (status === 'Resolved' && !ticket.resolved_at) {
      updates.push('resolved_at = NOW()');
    }
    if (status === 'Closed' && !ticket.closed_at) {
      updates.push('closed_at = NOW()');
    }

    values.push(id);

    await pool.query(
      `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    await addTicketHistory(id, req.user.id, 'Status Updated', 'status', ticket.status, status);

    // Notify reporter
    await createNotification(
      ticket.reporter_id,
      id,
      'Ticket Status Updated',
      `Your ticket ${ticket.ticket_number} status has been updated to ${status}`,
      'status_updated'
    );

    if (status === 'Resolved') {
      await createNotification(
        ticket.reporter_id,
        id,
        'Ticket Resolved',
        `Your ticket ${ticket.ticket_number} has been resolved`,
        'ticket_resolved'
      );
    }

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add comment
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, isInternal } = req.body;

    const [result] = await pool.query(
      'INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal) VALUES (?, ?, ?, ?)',
      [id, req.user.id, comment, isInternal || false]
    );

    // Notify relevant users
    const [tickets] = await pool.query('SELECT * FROM tickets WHERE id = ?', [id]);
    const ticket = tickets[0];

    // Notify reporter if not the commenter
    if (ticket.reporter_id !== req.user.id) {
      await createNotification(
        ticket.reporter_id,
        id,
        'Comment Added',
        `A new comment has been added to your ticket ${ticket.ticket_number}`,
        'comment_added'
      );
    }

    // Notify assigned technician if not the commenter
    if (ticket.assigned_technician_id && ticket.assigned_technician_id !== req.user.id) {
      await createNotification(
        ticket.assigned_technician_id,
        id,
        'Comment Added',
        `A new comment has been added to ticket ${ticket.ticket_number}`,
        'comment_added'
      );
    }

    res.status(201).json({
      message: 'Comment added successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get comments
const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const [comments] = await pool.query(`
      SELECT tc.*, u.first_name, u.last_name, u.role_id, r.name as role_name
      FROM ticket_comments tc
      JOIN users u ON tc.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE tc.ticket_id = ?
      ORDER BY tc.created_at ASC
    `, [id]);

    // Filter internal comments for non-technician/admin users
    const filteredComments = comments.map(comment => {
      if (comment.is_internal && req.user.roleName !== 'IT Technician' && req.user.roleName !== 'Administrator') {
        return { ...comment, comment: '[Internal comment - hidden]' };
      }
      return comment;
    });

    res.json(filteredComments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get history
const getHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const [history] = await pool.query(`
      SELECT th.*, u.first_name, u.last_name
      FROM ticket_history th
      JOIN users u ON th.user_id = u.id
      WHERE th.ticket_id = ?
      ORDER BY th.created_at ASC
    `, [id]);

    res.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  assignTechnician,
  updateStatus,
  addComment,
  getComments,
  getHistory
};
