import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { incomeService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import Modal from '../components/Modal';
import NotificationToast from '../components/NotificationToast';
import {
  Plus,
  ArrowUpDown,
  Edit2,
  Trash2,
  TrendingUp,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

const INCOME_SOURCES = [
  'Salary', 'Freelancing', 'Part-time job', 'Allowance', 'Business', 'Other'
];

const Income = () => {
  const location = useLocation();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  // Filters
  const [sourceFilter, setSourceFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal & Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    source: 'Salary',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Handle URL query ?action=new
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      openCreateModal();
    }
  }, [location.search]);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const res = await incomeService.getAll({
        source: sourceFilter !== 'All' ? sourceFilter : undefined,
        sort_by: sortBy,
        order: sortOrder,
      });
      setIncomes(res.data.data.incomes || []);
      setTotalAmount(res.data.data.total_amount || 0);
    } catch (err) {
      console.error('Error fetching incomes:', err);
      setToast({ message: 'Failed to load incomes', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, [sourceFilter, sortBy, sortOrder]);

  const openCreateModal = () => {
    setEditingIncome(null);
    setFormData({
      amount: '',
      source: 'Salary',
      description: '',
      date: new Date().toISOString().slice(0, 10),
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (inc) => {
    setEditingIncome(inc);
    setFormData({
      amount: inc.amount,
      source: inc.source,
      description: inc.description || '',
      date: inc.date,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveIncome = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.amount || Number(formData.amount) <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!formData.source) {
      setFormError('Please select an income source.');
      return;
    }
    if (!formData.date) {
      setFormError('Please select a date.');
      return;
    }

    try {
      if (editingIncome) {
        await incomeService.update(editingIncome.id, formData);
        setToast({ message: 'Income updated successfully!', type: 'success' });
      } else {
        await incomeService.create(formData);
        setToast({ message: 'Income added successfully!', type: 'success' });
      }
      setModalOpen(false);
      fetchIncomes();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Error saving income';
      setFormError(msg);
    }
  };

  const handleDeleteIncome = async (id) => {
    if (!window.confirm('Are you sure you want to delete this income entry?')) return;
    try {
      await incomeService.delete(id);
      setToast({ message: 'Income entry deleted successfully', type: 'info' });
      fetchIncomes();
    } catch (err) {
      setToast({ message: 'Failed to delete income', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Income Tracking
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Total recorded income: <span className="font-bold text-slate-800">{formatCurrency(totalAmount)}</span>
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Income</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Source:
          </label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="All">All Sources</option>
            {INCOME_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium flex items-center space-x-1"
          title={`Sort ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sort by Date ({sortOrder})</span>
        </button>
      </div>

      {/* Income Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500 font-medium">Loading income records...</p>
          </div>
        ) : incomes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {incomes.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(inc.date)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {inc.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium max-w-xs truncate">
                      {inc.description || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                      +{formatCurrency(inc.amount)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(inc)}
                          className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteIncome(inc.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 mb-1">No income entries recorded</h4>
            <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
              Add your monthly salary or freelancing income to enable savings rate calculations.
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700"
            >
              + Add Income
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingIncome ? 'Edit Income Entry' : 'Log New Income'}
      >
        {formError && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSaveIncome} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount (₹ INR) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 30000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Income Source *
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {INCOME_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly salary from Tech Co."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
            >
              {editingIncome ? 'Save Changes' : 'Log Income'}
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

export default Income;
