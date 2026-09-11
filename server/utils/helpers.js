// Generate unique ticket number
const generateTicketNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `TKT-${year}-${random}`;
};

// Format date for display
const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
};

// Calculate resolution time in hours
const calculateResolutionTime = (createdAt, resolvedAt) => {
  if (!createdAt || !resolvedAt) return null;
  const created = new Date(createdAt);
  const resolved = new Date(resolvedAt);
  const diffMs = resolved - created;
  return Math.round(diffMs / (1000 * 60 * 60)); // Convert to hours
};

// Pagination helper
const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};

// Get pagination data
const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: items } = data;
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, items, totalPages, currentPage };
};

module.exports = {
  generateTicketNumber,
  formatDate,
  calculateResolutionTime,
  getPagination,
  getPagingData
};
