// Utility helpers for formatting currencies, dates, and percentages

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  const val = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(val);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

export const getMonthName = (monthNumber) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1] || '';
};

export const CATEGORY_COLORS = {
  Housing: '#6366F1',       // Indigo
  Food: '#F59E0B',          // Amber
  Transportation: '#3B82F6',// Blue
  Education: '#8B5CF6',     // Purple
  Healthcare: '#EF4444',    // Red
  Utilities: '#10B981',     // Emerald
  Entertainment: '#EC4899', // Pink
  Shopping: '#F97316',      // Orange
  Bills: '#06B6D4',          // Cyan
  Travel: '#14B8A6',        // Teal
  Other: '#64748B',         // Slate
};

export const getCategoryColor = (category) => {
  return CATEGORY_COLORS[category] || '#64748B';
};
