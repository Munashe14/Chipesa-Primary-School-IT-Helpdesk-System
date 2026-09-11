const pool = require('../config/database');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Get ticket report
const getTicketReport = async (req, res) => {
  try {
    const { startDate, endDate, category, priority, status } = req.query;

    let query = `
      SELECT t.*, 
             c.name as category_name, 
             p.name as priority_name,
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

    if (startDate) {
      query += ' AND t.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND t.created_at <= ?';
      params.push(endDate);
    }
    if (category) {
      query += ' AND t.category_id = ?';
      params.push(category);
    }
    if (priority) {
      query += ' AND t.priority_id = ?';
      params.push(priority);
    }
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.created_at DESC';

    const [tickets] = await pool.query(query, params);

    // Calculate statistics
    const stats = {
      total: tickets.length,
      byStatus: {},
      byPriority: {},
      byCategory: {},
      avgResolutionTime: 0
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    tickets.forEach(ticket => {
      // By status
      stats.byStatus[ticket.status] = (stats.byStatus[ticket.status] || 0) + 1;
      
      // By priority
      stats.byPriority[ticket.priority_name] = (stats.byPriority[ticket.priority_name] || 0) + 1;
      
      // By category
      stats.byCategory[ticket.category_name] = (stats.byCategory[ticket.category_name] || 0) + 1;

      // Resolution time
      if (ticket.resolved_at) {
        const resolutionTime = Math.round((new Date(ticket.resolved_at) - new Date(ticket.created_at)) / (1000 * 60 * 60));
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    });

    if (resolvedCount > 0) {
      stats.avgResolutionTime = Math.round(totalResolutionTime / resolvedCount);
    }

    res.json({
      tickets,
      stats
    });
  } catch (error) {
    console.error('Get ticket report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get performance report
const getPerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate, technicianId } = req.query;

    let query = `
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as technician_name,
        COUNT(t.id) as total_assigned,
        SUM(CASE WHEN t.status = 'Resolved' THEN 1 ELSE 0 END) as resolved_count,
        SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN t.status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN t.status = 'Overdue' THEN 1 ELSE 0 END) as overdue_count,
        AVG(TIMESTAMPDIFF(HOUR, t.created_at, COALESCE(t.resolved_at, NOW()))) as avg_resolution_hours
      FROM users u
      LEFT JOIN tickets t ON u.id = t.assigned_technician_id
      WHERE u.role_id = (SELECT id FROM roles WHERE name = 'IT Technician')
    `;

    const params = [];

    if (startDate) {
      query += ' AND t.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND t.created_at <= ?';
      params.push(endDate);
    }
    if (technicianId) {
      query += ' AND u.id = ?';
      params.push(technicianId);
    }

    query += ' GROUP BY u.id, u.first_name, u.last_name';

    const [performance] = await pool.query(query, params);

    res.json(performance);
  } catch (error) {
    console.error('Get performance report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export to PDF
const exportPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const [tickets] = await pool.query(`
      SELECT t.*, 
             c.name as category_name, 
             p.name as priority_name,
             CONCAT(r.first_name, ' ', r.last_name) as reporter_name,
             CONCAT(tech.first_name, ' ', tech.last_name) as technician_name
      FROM tickets t
      JOIN categories c ON t.category_id = c.id
      JOIN priorities p ON t.priority_id = p.id
      JOIN users r ON t.reporter_id = r.id
      LEFT JOIN users tech ON t.assigned_technician_id = tech.id
      WHERE 1=1
      ${startDate ? 'AND t.created_at >= ?' : ''}
      ${endDate ? 'AND t.created_at <= ?' : ''}
      ORDER BY t.created_at DESC
    `, startDate && endDate ? [startDate, endDate] : []);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=tickets-report.pdf');
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('IT Help Desk System - Ticket Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    if (startDate || endDate) {
      doc.text(`Period: ${startDate || 'All'} to ${endDate || 'Present'}`, { align: 'center' });
    }
    doc.moveDown();

    // Table header
    doc.fontSize(10);
    const tableTop = doc.y;
    const headers = ['Ticket #', 'Title', 'Category', 'Priority', 'Status', 'Reporter', 'Technician', 'Created'];
    const colWidths = [80, 150, 80, 60, 60, 100, 100, 80];
    let xPos = 50;

    headers.forEach((header, i) => {
      doc.text(header, xPos, tableTop, { width: colWidths[i] });
      xPos += colWidths[i];
    });

    doc.moveDown();
    let yPos = doc.y;

    // Table rows
    tickets.forEach((ticket, index) => {
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      xPos = 50;
      const row = [
        ticket.ticket_number,
        ticket.title.substring(0, 25),
        ticket.category_name,
        ticket.priority_name,
        ticket.status,
        ticket.reporter_name,
        ticket.technician_name || 'Unassigned',
        new Date(ticket.created_at).toLocaleDateString()
      ];

      row.forEach((cell, i) => {
        doc.text(cell || '', xPos, yPos, { width: colWidths[i] });
        xPos += colWidths[i];
      });

      yPos += 25;
    });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export to Excel
const exportExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const [tickets] = await pool.query(`
      SELECT t.*, 
             c.name as category_name, 
             p.name as priority_name,
             CONCAT(r.first_name, ' ', r.last_name) as reporter_name,
             CONCAT(tech.first_name, ' ', tech.last_name) as technician_name
      FROM tickets t
      JOIN categories c ON t.category_id = c.id
      JOIN priorities p ON t.priority_id = p.id
      JOIN users r ON t.reporter_id = r.id
      LEFT JOIN users tech ON t.assigned_technician_id = tech.id
      WHERE 1=1
      ${startDate ? 'AND t.created_at >= ?' : ''}
      ${endDate ? 'AND t.created_at <= ?' : ''}
      ORDER BY t.created_at DESC
    `, startDate && endDate ? [startDate, endDate] : []);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tickets');

    worksheet.columns = [
      { header: 'Ticket #', key: 'ticket_number', width: 20 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Category', key: 'category_name', width: 20 },
      { header: 'Priority', key: 'priority_name', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Reporter', key: 'reporter_name', width: 25 },
      { header: 'Technician', key: 'technician_name', width: 25 },
      { header: 'Created', key: 'created_at', width: 20 },
      { header: 'Resolved', key: 'resolved_at', width: 20 },
      { header: 'Resolution Notes', key: 'resolution_notes', width: 40 }
    ];

    tickets.forEach(ticket => {
      worksheet.addRow({
        ticket_number: ticket.ticket_number,
        title: ticket.title,
        description: ticket.description,
        category_name: ticket.category_name,
        priority_name: ticket.priority_name,
        status: ticket.status,
        reporter_name: ticket.reporter_name,
        technician_name: ticket.technician_name || 'Unassigned',
        created_at: ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '',
        resolved_at: ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString() : '',
        resolution_notes: ticket.resolution_notes || ''
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=tickets-report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTicketReport,
  getPerformanceReport,
  exportPDF,
  exportExcel
};
