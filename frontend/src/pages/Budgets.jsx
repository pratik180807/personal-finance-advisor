import React, { useState, useEffect } from 'react';
import { budgetService } from '../services/api';
import { formatCurrency, getMonthName, getCategoryColor } from '../utils/formatters';
import Modal from '../components/Modal';
import NotificationToast from '../components/NotificationToast';
import {
  Plus,
  PieChart,
  Edit2,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

const CATEGORIES = [
  'Housing', 'Food', 'Transportation', 'Education', 'Healthcare',
  'Utilities', 'Entertainment', 'Shopping', 'Bills', 'Travel', 'Other'
];

const Budgets = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [budgets, setBudgets] = useState([]);
  const [totalBudgeted, setTotalBudgeted] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal & form
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: 'Food',
    amount: '',
  });
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await budgetService.getAll({
        month: selectedMonth,
        year: selectedYear,
      });
      setBudgets(res.data.data.budgets || []);
      setTotalBudgeted(res.data.data.total_budgeted || 0);
      setTotalSpent(res.data.data.total_spent || 0);
    } catch (err) {
      console.error('Failed to load budgets:', err);
      setToast({ message: 'Failed to load budgets', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  const openCreateModal = () => {
    setEditingBudget(null);
    setFormData({
      category: 'Food',
      amount: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (b) => {
    setEditingBudget(b);
    setFormData({
      category: b.category,
      amount: b.amount,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.amount || Number(formData.amount) <= 0) {
      setFormError('Please enter a valid budget limit greater than 0.');
      return;
    }

    try {
      const payload = {
        ...formData,
        month: selectedMonth,
        year: selectedYear,
      };

      if (editingBudget) {
        await budgetService.update(editingBudget.id, payload);
        setToast({ message: 'Budget limit updated successfully', type: 'success' });
      } else {
        await budgetService.create(payload);
        setToast({ message: 'Category budget added', type: 'success' });
      }
      setModalOpen(false);
      fetchBudgets();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Error saving budget';
      setFormError(msg);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Delete this budget limit?')) return;
    try {
      await budgetService.delete(id);
      setToast({ message: 'Budget removed', type: 'info' });
      fetchBudgets();
    } catch (err) {
      setToast({ message: 'Failed to delete budget', type: 'error' });
    }
  };

  const overallPct = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;
  const remainingBudget = totalBudgeted - totalSpent;

  return (
    <div className="space-y-6">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Monthly Budgets
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Set and track spending boundaries for {getMonthName(selectedMonth)} {selectedYear}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {getMonthName(m)}
              </option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-500/20 transition-all ml-1"
          >
            <Plus className="w-4 h-4" />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Total Budgeted
          </span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalBudgeted)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Across {budgets.length} categories</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Total Spent
          </span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalSpent)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">{overallPct}% of total budget used</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Remaining Buffer
          </span>
          <h3 className={`text-2xl font-bold mt-1 ${remainingBudget >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(remainingBudget)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {remainingBudget >= 0 ? 'Within monthly target' : 'Over total budget limit'}
          </p>
        </div>
      </div>

      {/* Category Budget Cards */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Loading monthly budgets...</p>
        </div>
      ) : budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const isOver = b.spent > b.amount;
            const isNear = b.percentage_used >= 80 && !isOver;

            const badgeBg = isOver
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : isNear
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200';

            const barColor = isOver
              ? 'bg-rose-500'
              : isNear
              ? 'bg-amber-500'
              : 'bg-emerald-500';

            return (
              <div
                key={b.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: getCategoryColor(b.category) }}
                    />
                    <h4 className="font-bold text-slate-800 text-sm">{b.category}</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeBg}`}>
                      {b.status}
                    </span>
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100"
                      title="Edit Budget"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(b.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Numbers */}
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-xl font-extrabold text-slate-900">
                      {formatCurrency(b.spent)}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">
                      of {formatCurrency(b.amount)}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    {b.percentage_used}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, b.percentage_used)}%` }}
                  />
                </div>

                {/* Footer notes */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    {b.remaining >= 0 ? (
                      <span className="text-emerald-700 font-medium">₹{b.remaining.toLocaleString('en-IN')} remaining</span>
                    ) : (
                      <span className="text-rose-600 font-semibold">₹{Math.abs(b.remaining).toLocaleString('en-IN')} over budget!</span>
                    )}
                  </span>
                  <span className="text-slate-400">
                    {getMonthName(b.month)} {b.year}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
            <PieChart className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-700 mb-1">
            No budgets set for {getMonthName(selectedMonth)} {selectedYear}
          </h4>
          <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
            Setting category budgets helps prevent overspending and keeps you on target with your savings.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700"
          >
            + Create Budget Limit
          </button>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBudget ? `Edit ${editingBudget.category} Budget` : 'Set Category Budget'}
      >
        {formError && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Monthly Budget Amount (₹ INR) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 5000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
            Applying to: <b>{getMonthName(selectedMonth)} {selectedYear}</b>. Spending will automatically be calculated from your logged expenses.
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm"
            >
              {editingBudget ? 'Save Changes' : 'Create Budget'}
            </button>
          </div>
        </form>
      </Modal>

      <NotificationToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default Budgets;
