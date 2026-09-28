import React, { useState, useEffect } from 'react';
import { goalService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import Modal from '../components/Modal';
import NotificationToast from '../components/NotificationToast';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  AlertCircle,
  PiggyBank,
  PlusCircle,
} from 'lucide-react';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalTarget, setTotalTarget] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  // Modal & form states
  const [modalOpen, setModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [activeGoalForDeposit, setActiveGoalForDeposit] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    target_date: '',
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await goalService.getAll();
      setGoals(res.data.data.goals || []);
      setTotalTarget(res.data.data.total_target || 0);
      setTotalSaved(res.data.data.total_saved || 0);
      setOverallProgress(res.data.data.overall_progress || 0);
    } catch (err) {
      console.error('Failed to load goals:', err);
      setToast({ message: 'Failed to load savings goals', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openCreateModal = () => {
    setEditingGoal(null);
    setFormData({
      name: '',
      target_amount: '',
      current_amount: '0',
      target_date: '',
      description: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (g) => {
    setEditingGoal(g);
    setFormData({
      name: g.name,
      target_amount: g.target_amount,
      current_amount: g.current_amount,
      target_date: g.target_date || '',
      description: g.description || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openDepositModal = (g) => {
    setActiveGoalForDeposit(g);
    setDepositAmount('');
    setFormError('');
    setDepositModalOpen(true);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Please enter a goal name.');
      return;
    }
    if (!formData.target_amount || Number(formData.target_amount) <= 0) {
      setFormError('Target amount must be greater than 0.');
      return;
    }

    try {
      if (editingGoal) {
        await goalService.update(editingGoal.id, formData);
        setToast({ message: 'Savings goal updated successfully', type: 'success' });
      } else {
        await goalService.create(formData);
        setToast({ message: 'New savings goal created!', type: 'success' });
      }
      setModalOpen(false);
      fetchGoals();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Error saving goal';
      setFormError(msg);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const depVal = Number(depositAmount);
    if (!depVal || depVal <= 0) {
      setFormError('Enter a valid deposit amount greater than 0.');
      return;
    }

    try {
      const newTotal = Number(activeGoalForDeposit.current_amount) + depVal;
      await goalService.update(activeGoalForDeposit.id, {
        current_amount: newTotal,
      });
      setToast({ message: `Deposited ₹${depVal.toLocaleString('en-IN')} to ${activeGoalForDeposit.name}!`, type: 'success' });
      setDepositModalOpen(false);
      fetchGoals();
    } catch (err) {
      setFormError('Failed to update savings balance');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      await goalService.delete(id);
      setToast({ message: 'Savings goal removed', type: 'info' });
      fetchGoals();
    } catch (err) {
      setToast({ message: 'Failed to delete goal', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Savings Goals
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Track your milestones and allocate funds towards long-term targets
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Total Target
          </span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalTarget)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Sum of {goals.length} active goals</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Currently Saved
          </span>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(totalSaved)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">{overallProgress}% funded so far</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Remaining to Save
          </span>
          <h3 className="text-2xl font-bold text-brand-600 mt-1">
            {formatCurrency(Math.max(0, totalTarget - totalSaved))}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Keep compounding your monthly surplus</p>
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Loading savings goals...</p>
        </div>
      ) : goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g) => {
            const isCompleted = g.is_completed || g.current_amount >= g.target_amount;
            return (
              <div
                key={g.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-indigo-50 text-brand-600'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm truncate max-w-[150px]">
                        {g.name}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(g)}
                        className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100"
                        title="Edit Goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {g.description && (
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{g.description}</p>
                  )}

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between mb-1.5">
                    <div>
                      <span className="text-lg font-bold text-slate-900">
                        {formatCurrency(g.current_amount)}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">
                        / {formatCurrency(g.target_amount)}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isCompleted ? 'text-emerald-600' : 'text-brand-600'
                      }`}
                    >
                      {g.progress_percentage}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-3">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-brand-600'
                      }`}
                      style={{ width: `${Math.min(100, g.progress_percentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-4">
                    <span>
                      {isCompleted ? (
                        <span className="text-emerald-600 font-semibold">🎉 Goal Achieved!</span>
                      ) : (
                        <span>₹{g.remaining_amount.toLocaleString('en-IN')} remaining</span>
                      )}
                    </span>
                    {g.target_date && <span>Target: {formatDate(g.target_date)}</span>}
                  </div>
                </div>

                {/* Quick Add Funds button */}
                <button
                  onClick={() => openDepositModal(g)}
                  className="w-full py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Deposit Funds</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
            <PiggyBank className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-700 mb-1">No savings goals yet</h4>
          <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
            Set aside money for an Emergency Fund, new laptop, vacation, or education.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700"
          >
            + Create First Goal
          </button>
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
      >
        {formError && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSaveGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Goal Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Emergency Fund or New Laptop"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="50000"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Saved (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={formData.current_amount}
                onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Completion Date
            </label>
            <input
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Milestone Purpose
            </label>
            <textarea
              rows="2"
              placeholder="e.g. 3 months living expenses reserve"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm"
            >
              {editingGoal ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deposit Modal */}
      <Modal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        title={`Deposit to ${activeGoalForDeposit?.name || 'Goal'}`}
      >
        {formError && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleDepositSubmit} className="space-y-4">
          <div>
            <p className="text-xs text-slate-500 mb-2">
              Currently saved: <b>{formatCurrency(activeGoalForDeposit?.current_amount)}</b> of{' '}
              {formatCurrency(activeGoalForDeposit?.target_amount)}.
            </p>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount to Deposit (₹ INR) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 2500"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              autoFocus
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setDepositModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
            >
              Add to Goal
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

export default Goals;
