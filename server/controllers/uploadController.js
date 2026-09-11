const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

// Upload file for a ticket
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { ticketId } = req.params;

    // Check if ticket exists and user has permission
    const [tickets] = await pool.query(
      'SELECT * FROM tickets WHERE id = ?',
      [ticketId]
    );

    if (tickets.length === 0) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const ticket = tickets[0];

    // Check permission
    if (req.user.roleName === 'Staff User' && ticket.reporter_id !== req.user.id) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Not authorized to upload to this ticket' });
    }

    // Save attachment to database
    const [result] = await pool.query(
      `INSERT INTO attachments (ticket_id, user_id, filename, original_name, file_path, file_size, mime_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ticketId,
        req.user.id,
        req.file.filename,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype
      ]
    );

    res.status(201).json({
      message: 'File uploaded successfully',
      attachment: {
        id: result.insertId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload file error:', error);
    
    // Delete uploaded file if error occurred
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// Get ticket attachments
const getAttachments = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Check if ticket exists and user has permission
    const [tickets] = await pool.query(
      'SELECT * FROM tickets WHERE id = ?',
      [ticketId]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const ticket = tickets[0];

    // Check permission
    if (req.user.roleName === 'Staff User' && ticket.reporter_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }

    const [attachments] = await pool.query(
      'SELECT * FROM attachments WHERE ticket_id = ?',
      [ticketId]
    );

    res.json(attachments);
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete attachment
const deleteAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;

    // Get attachment
    const [attachments] = await pool.query(
      'SELECT * FROM attachments WHERE id = ?',
      [attachmentId]
    );

    if (attachments.length === 0) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    const attachment = attachments[0];

    // Check if user has permission (uploaded by user or admin)
    if (attachment.user_id !== req.user.id && req.user.roleName !== 'Administrator') {
      return res.status(403).json({ message: 'Not authorized to delete this attachment' });
    }

    // Delete file from filesystem
    if (fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }

    // Delete from database
    await pool.query('DELETE FROM attachments WHERE id = ?', [attachmentId]);

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  uploadFile,
  getAttachments,
  deleteAttachment
};
