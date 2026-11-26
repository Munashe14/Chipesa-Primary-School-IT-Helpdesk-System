-- Demonstration seed data. Applied automatically only to an empty database.

INSERT INTO roles (name, description) VALUES
('Staff User', 'Regular staff members who can report IT faults'),
('IT Technician', 'IT support staff who manage and resolve tickets'),
('Administrator', 'System administrators with full access'),
('School Management', 'School management who can view reports and statistics');

INSERT INTO categories (name, description) VALUES
('Computer Hardware', 'Issues with desktop computers, laptops, monitors, keyboards, mice'),
('Printer', 'Printer and scanner related issues'),
('Network', 'Network connectivity, WiFi, LAN, cabling issues'),
('Software', 'Operating system, application software, installation issues'),
('Internet', 'Internet connectivity, browser issues, email problems'),
('Projector', 'Projector and presentation equipment issues'),
('Other', 'Any other IT-related issues not covered above');

INSERT INTO priorities (name, level, description, color) VALUES
('Low', 1, 'Non-urgent issues that can be addressed when convenient', '#22c55e'),
('Medium', 2, 'Issues that should be addressed within a reasonable timeframe', '#eab308'),
('High', 3, 'Urgent issues affecting productivity', '#f97316'),
('Critical', 4, 'Critical issues requiring immediate attention', '#ef4444');

INSERT INTO users (role_id, first_name, last_name, email, password, phone, department) VALUES
(3, 'Admin', 'User', 'admin@chipesa.school.zw', '$2a$10$Ue1QbsoVSI5Wy71ZXBUGTu1MBefqLbXMFGO.nZgwpORcgWkeVbFy2', '+263 123 456 789', 'ICT Department'),
(2, 'John', 'Moyo', 'technician@chipesa.school.zw', '$2a$10$UYKCvP6CTtCibUQ1nvMoTuRt0gn2NEDI3cZxm20kAQkCBgm7pTZpC', '+263 123 456 790', 'ICT Department'),
(1, 'Mary', 'Chikwinya', 'staff@chipesa.school.zw', '$2a$10$NVJjJfIxn7Gy7XEu0QBixuzrAikz1ryU.Gu2rkOiDfuROB5EjbzLq', '+263 123 456 791', 'Administration'),
(4, 'Peter', 'Dube', 'management@chipesa.school.zw', '$2a$10$4LLnoELYZ1hyi0MQgWP4LOiIAKGuNpFWR1fT60MEBH..hRm2KbLf', '+263 123 456 792', 'School Management'),
(1, 'Grace', 'Moyo', 'grace.moyo@chipesa.school.zw', '$2a$10$NVJjJfIxn7Gy7XEu0QBixuzrAikz1ryU.Gu2rkOiDfuROB5EjbzLq', '+263 123 456 793', 'Teaching'),
(1, 'Tendai', 'Ndlovu', 'tendai.ndlovu@chipesa.school.zw', '$2a$10$NVJjJfIxn7Gy7XEu0QBixuzrAikz1ryU.Gu2rkOiDfuROB5EjbzLq', '+263 123 456 794', 'Teaching'),
(1, 'Sarah', 'Moyo', 'sarah.moyo@chipesa.school.zw', '$2a$10$NVJjJfIxn7Gy7XEu0QBixuzrAikz1ryU.Gu2rkOiDfuROB5EjbzLq', '+263 123 456 795', 'Administration'),
(1, 'David', 'Chikwinya', 'david.chikwinya@chipesa.school.zw', '$2a$10$NVJjJfIxn7Gy7XEu0QBixuzrAikz1ryU.Gu2rkOiDfuROB5EjbzLq', '+263 123 456 796', 'Finance');

INSERT INTO tickets (ticket_number, title, description, category_id, priority_id, reporter_id, assigned_technician_id, status) VALUES
('TKT-2024-001', 'Computer not starting', 'My desktop computer in the staff room is not starting. When I press the power button, nothing happens.', 1, 3, 3, 2, 'In Progress'),
('TKT-2024-002', 'Printer jammed', 'The printer in the administration office is jammed. Paper is stuck inside and I cannot remove it.', 2, 2, 3, 2, 'Resolved'),
('TKT-2024-003', 'No internet connection', 'I cannot connect to the internet in my classroom. The WiFi shows as connected but no websites load.', 5, 3, 5, 2, 'Pending'),
('TKT-2024-004', 'Microsoft Word not opening', 'Microsoft Word crashes every time I try to open it. I need it for lesson preparation.', 4, 2, 6, 2, 'Pending'),
('TKT-2024-005', 'Projector not displaying', 'The projector in the Grade 5 classroom is not displaying anything from the laptop.', 6, 3, 7, 2, 'In Progress'),
('TKT-2024-006', 'Keyboard not working', 'Some keys on my keyboard are not responding. I have to use the on-screen keyboard.', 1, 2, 8, 2, 'Pending'),
('TKT-2024-007', 'Slow computer performance', 'My computer is very slow. It takes a long time to open applications and files.', 1, 1, 2, 2, 'Pending'),
('TKT-2024-008', 'Email not sending', 'I cannot send emails. They stay in the outbox folder.', 5, 2, 3, 2, 'Resolved'),
('TKT-2024-009', 'Scanner not working', 'The scanner is not recognized by the computer. I need to scan documents.', 2, 2, 3, 2, 'Closed'),
('TKT-2024-010', 'Network cable damaged', 'The network cable in my office is damaged and I cannot connect to the school network.', 3, 3, 5, 2, 'In Progress');

UPDATE tickets SET resolved_at = datetime('now', '-2 days') WHERE id IN (2, 8);
UPDATE tickets SET closed_at = datetime('now', '-1 day') WHERE id = 9;

INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal) VALUES
(1, 3, 'This happened this morning when I came to work.', 0),
(1, 2, 'I will check the power supply and motherboard. Please leave the computer on.', 0),
(2, 3, 'I tried to remove the paper but it tore.', 0),
(2, 2, 'Paper removed successfully. Please avoid using thick paper in the future.', 0),
(3, 5, 'This is affecting my lesson preparation.', 0),
(3, 2, 'Checking the router and network configuration now.', 1),
(5, 7, 'I have a presentation tomorrow morning. This is urgent.', 0),
(5, 2, 'I will replace the VGA cable and check the projector settings.', 0);

INSERT INTO ticket_history (ticket_id, user_id, action, field_changed, old_value, new_value) VALUES
(1, 3, 'Created', NULL, NULL, 'Ticket created'),
(1, 2, 'Assigned', 'assigned_technician_id', NULL, '2'),
(1, 2, 'Status Updated', 'status', 'Pending', 'In Progress'),
(2, 3, 'Created', NULL, NULL, 'Ticket created'),
(2, 2, 'Assigned', 'assigned_technician_id', NULL, '2'),
(2, 2, 'Status Updated', 'status', 'Pending', 'In Progress'),
(2, 2, 'Status Updated', 'status', 'In Progress', 'Resolved'),
(3, 5, 'Created', NULL, NULL, 'Ticket created'),
(3, 2, 'Assigned', 'assigned_technician_id', NULL, '2'),
(4, 6, 'Created', NULL, NULL, 'Ticket created'),
(4, 2, 'Assigned', 'assigned_technician_id', NULL, '2'),
(5, 7, 'Created', NULL, NULL, 'Ticket created'),
(5, 2, 'Assigned', 'assigned_technician_id', NULL, '2'),
(5, 2, 'Status Updated', 'status', 'Pending', 'In Progress');

INSERT INTO notifications (user_id, ticket_id, title, message, type, is_read) VALUES
(2, 1, 'New Ticket Assigned', 'Ticket TKT-2024-001 has been assigned to you.', 'ticket_assigned', 0),
(3, 1, 'Ticket Status Updated', 'Your ticket TKT-2024-001 status has been updated to In Progress.', 'status_updated', 0),
(2, 2, 'New Ticket Assigned', 'Ticket TKT-2024-002 has been assigned to you.', 'ticket_assigned', 1),
(3, 2, 'Ticket Resolved', 'Your ticket TKT-2024-002 has been resolved.', 'ticket_resolved', 0),
(2, 3, 'New Ticket Assigned', 'Ticket TKT-2024-003 has been assigned to you.', 'ticket_assigned', 0),
(3, 2, 'Comment Added', 'A new comment has been added to your ticket TKT-2024-001.', 'comment_added', 1);
