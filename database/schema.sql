-- SQLite schema for the IT Help Desk System.
-- Safe to run on startup: existing data is not dropped.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT,
    department TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TEXT,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS priorities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    level INTEGER NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#000000',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    priority_id INTEGER NOT NULL,
    reporter_id INTEGER NOT NULL,
    assigned_technician_id INTEGER,
    status TEXT NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'In Progress', 'Resolved', 'Closed', 'Overdue')),
    resolution_notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT,
    closed_at TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (priority_id) REFERENCES priorities(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS ticket_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    comment TEXT NOT NULL,
    is_internal INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS ticket_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    field_changed TEXT,
    old_value TEXT,
    new_value TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ticket_id INTEGER,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'ticket_created', 'ticket_assigned', 'status_updated',
        'ticket_resolved', 'ticket_closed', 'comment_added'
    )),
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_user_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_ticket_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_reporter ON tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_ticket_technician ON tickets(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_ticket_category ON tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_ticket_priority ON tickets(priority_id);
CREATE INDEX IF NOT EXISTS idx_ticket_created ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_comment_ticket ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_history_ticket ON ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_attachment_ticket ON attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notification_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_expires ON password_reset_tokens(expires_at);

CREATE VIEW IF NOT EXISTS ticket_statistics AS
SELECT
    COUNT(*) AS total_tickets,
    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_tickets,
    SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress_tickets,
    SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_tickets,
    SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) AS closed_tickets,
    SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) AS overdue_tickets
FROM tickets;

CREATE VIEW IF NOT EXISTS technician_performance AS
SELECT
    u.id AS technician_id,
    u.first_name || ' ' || u.last_name AS technician_name,
    COUNT(t.id) AS total_assigned,
    SUM(CASE WHEN t.status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_count,
    SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress_count,
    SUM(CASE WHEN t.status = 'Pending' THEN 1 ELSE 0 END) AS pending_count,
    AVG((julianday(COALESCE(t.resolved_at, CURRENT_TIMESTAMP)) - julianday(t.created_at)) * 24)
        AS avg_resolution_hours
FROM users u
LEFT JOIN tickets t ON u.id = t.assigned_technician_id
WHERE u.role_id = (SELECT id FROM roles WHERE name = 'IT Technician')
GROUP BY u.id, u.first_name, u.last_name;

CREATE TRIGGER IF NOT EXISTS roles_updated_at
AFTER UPDATE ON roles
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE roles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS users_updated_at
AFTER UPDATE ON users
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS categories_updated_at
AFTER UPDATE ON categories
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS priorities_updated_at
AFTER UPDATE ON priorities
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE priorities SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tickets_updated_at
AFTER UPDATE ON tickets
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
