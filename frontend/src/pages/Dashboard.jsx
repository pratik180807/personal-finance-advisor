import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/api';
import { formatCurrency, formatDate, getCategoryColor } from '../utils/formatters';
import StatCard from '../components/StatCard';
import BudgetHealthBadge from '../components/BudgetHealthBadge';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  PiggyBank,
  Percent,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await dashboardService.getData();
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Calculating your financial insights...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm text-rose-600 mb-4">{error || 'Something went wrong.'}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    current_month_income,
    current_month_expenses,
    current_month_savings,
    current_month_savings_percentage,
    current_month_name,
    top_spending_categories,
    budget_utilization,
    financial_health,
    ai_insight,
    recent_transactions,
    monthly_trend,
  } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitoring month: <span className="font-semibold text-slate-800">{current_month_name}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchDashboard}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/expenses?action=new"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </Link>
          <Link
            to="/income?action=new"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Income</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Income"
          value={formatCurrency(current_month_income)}
          icon={ArrowUpCircle}
          color="emerald"
          subtext="Total earnings this month"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(current_month_expenses)}
          icon={ArrowDownCircle}
          color="rose"
          subtext="Total outflows this month"
        />
        <StatCard
          title="Monthly Net Savings"
          value={formatCurrency(current_month_savings)}
          icon={PiggyBank}
          color={current_month_savings >= 0 ? 'indigo' : 'rose'}
          badge={current_month_savings >= 0 ? 'Surplus' : 'Deficit'}
          subtext={current_month_savings >= 0 ? 'Retained cash flow' : 'Overspending alert'}
        />
        <StatCard
          title="Savings Rate"
          value={`${current_month_savings_percentage}%`}
          icon={Percent}
          color={current_month_savings_percentage >= 20 ? 'emerald' : 'amber'}
          subtext={
            current_month_savings_percentage >= 20
              ? 'Target achieved (>= 20%)'
              : 'Target benchmark is 20%'
          }
        />
      </div>

      {/* AI Smart Advisory Card & Health Score Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insight Card (2 columns) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold tracking-wide uppercase text-indigo-200">
                  AI Financial Advisory Summary
                </h3>
              </div>
              <Link
                to="/advisor"
                className="text-xs text-indigo-300 hover:text-white flex items-center space-x-1 underline underline-offset-4"
              >
                <span>Full Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed mb-4 font-normal">
              {ai_insight?.summary}
            </p>

            {ai_insight?.warning && (
              <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <span className="font-semibold block text-rose-300">{ai_insight.warning.title}</span>
                  <span>{ai_insight.warning.message}</span>
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-indigo-100 flex items-start space-x-2">
              <TrendingUp className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
              <div>
                <span className="font-semibold block text-indigo-200">Recommended Action:</span>
                <span>{ai_insight?.suggested_action}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400 italic">
            {ai_insight?.disclaimer}
          </div>
        </div>

        {/* Budget Health Score (1 column) */}
        <div>
          <BudgetHealthBadge healthData={financial_health} />
        </div>
      </div>

      {/* Charts Section: Monthly Trend & Expense Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Area Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">6-Month Cash Flow Trend</h3>
              <p className="text-xs text-slate-500">Income vs Expenses history</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#F43F5E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown Donut */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Monthly Expense Breakdown</h3>
              <p className="text-xs text-slate-500">Spending by category</p>
            </div>
            <Link to="/expenses" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View All
            </Link>
          </div>

          {top_spending_categories && top_spending_categories.length > 0 ? (
            <div className="h-64 w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={top_spending_categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {top_spending_categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Amount']}
                    contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4">
              <p className="text-xs text-slate-400 mb-2">No expenses logged for this month yet.</p>
              <Link
                to="/expenses?action=new"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                + Add your first expense
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Budget Tracking Progress & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Progress (1 col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Budget Utilization</h3>
              <p className="text-xs text-slate-500">Current month limit tracking</p>
            </div>
            <Link to="/budgets" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Manage
            </Link>
          </div>

          {budget_utilization && budget_utilization.length > 0 ? (
            <div className="space-y-4">
              {budget_utilization.slice(0, 5).map((b) => {
                const isOver = b.spent > b.budget;
                const isNear = b.percentage_used >= 80 && !isOver;
                const barColor = isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500';

                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{b.category}</span>
                      <span className="text-slate-500">
                        {formatCurrency(b.spent)} / {formatCurrency(b.budget)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${barColor}`}
                        style={{ width: `${Math.min(100, b.percentage_used)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className={isOver ? 'text-rose-600 font-bold' : isNear ? 'text-amber-600 font-medium' : 'text-slate-400'}>
                        {b.status} ({b.percentage_used}%)
                      </span>
                      <span className="text-slate-500">
                        {b.remaining >= 0
                          ? `₹${Math.round(b.remaining).toLocaleString('en-IN')} left`
                          : `₹${Math.round(Math.abs(b.remaining)).toLocaleString('en-IN')} over`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-xs text-slate-400 mb-2">No category budgets created yet.</p>
              <Link to="/budgets" className="text-xs font-semibold text-brand-600 hover:underline">
                Create a budget limit
              </Link>
            </div>
          )}
        </div>

        {/* Recent Transactions Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Recent Transactions</h3>
                <p className="text-xs text-slate-500">Latest income and expense activities</p>
              </div>
              <div className="flex items-center space-x-2">
                <Link to="/expenses" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                  All Expenses
                </Link>
                <span className="text-slate-300">•</span>
                <Link to="/income" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                  All Income
                </Link>
              </div>
            </div>

            {recent_transactions && recent_transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Category / Source</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {recent_transactions.map((tx) => {
                      const isIncome = tx.type === 'income';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isIncome
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isIncome ? '+ Income' : '- Expense'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[180px] truncate">
                            {tx.description || tx.title}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{tx.category}</td>
                          <td className="py-2.5 px-3 text-slate-400">{formatDate(tx.date)}</td>
                          <td
                            className={`py-2.5 px-3 text-right font-bold ${
                              isIncome ? 'text-emerald-600' : 'text-slate-900'
                            }`}
                          >
                            {isIncome ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-xs text-slate-400">No transactions recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
