import React, { useState, useEffect } from 'react';
import { analysisService } from '../services/api';
import { formatCurrency, getMonthName } from '../utils/formatters';
import BudgetHealthBadge from '../components/BudgetHealthBadge';
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  TrendingDown,
  RefreshCw,
  Info,
  Sliders,
  ShieldAlert,
} from 'lucide-react';

const Advisor = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await analysisService.getAnalysis({
        month: selectedMonth,
        year: selectedYear,
      });
      setAnalysis(res.data.data);
    } catch (err) {
      console.error('Failed to load analysis:', err);
      setError('Unable to generate AI financial insights. Please ensure transactions are recorded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [selectedMonth, selectedYear]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              AI Financial Advisor
            </h2>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-100 text-brand-700 rounded-full border border-indigo-200">
              {analysis?.advisor_mode === 'llm_enhanced' ? '🤖 LLM Active' : '⚡ Rule Engine Active'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Automated spending diagnostics, overspending alerts, and personalized saving advice
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
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
            onClick={fetchAnalysis}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors"
            title="Re-run analysis"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-700">Evaluating your financial metrics...</p>
          <p className="text-xs text-slate-400 mt-1">Cross-referencing income, expenses, budgets, and savings goals</p>
        </div>
      ) : error || !analysis ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-sm text-rose-600 mb-3">{error || 'Failed to generate insights'}</p>
          <button
            onClick={fetchAnalysis}
            className="px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/10">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold tracking-tight text-white">
                Executive Financial Summary ({analysis.period_name})
              </h3>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed max-w-3xl mb-4 font-normal">
              {analysis.summary}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Monthly Income</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {formatCurrency(analysis.total_income)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Total Expenses</span>
                <span className="font-bold text-rose-400 text-sm">
                  {formatCurrency(analysis.total_expenses)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Net Savings</span>
                <span className="font-bold text-indigo-300 text-sm">
                  {formatCurrency(analysis.net_savings)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Savings Rate</span>
                <span className="font-bold text-white text-sm">
                  {analysis.savings_rate}%
                </span>
              </div>
            </div>
          </div>

          {/* Budget Health Indicator */}
          <BudgetHealthBadge healthData={analysis.budget_health} />

          {/* Financial Warnings (if any) */}
          {analysis.warnings && analysis.warnings.length > 0 && (
            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm mb-3">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Financial Warnings & Alerts ({analysis.warnings.length})</span>
              </div>
              <div className="space-y-2.5">
                {analysis.warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-rose-200/80 text-xs flex items-start space-x-2.5"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-rose-900">{w.title}</h5>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{w.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2 Columns: Saving Opportunities & Positive Habits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Saving Opportunities */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-brand-700 font-bold text-sm mb-3">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <span>Saving Opportunities</span>
                </div>
                {analysis.saving_opportunities && analysis.saving_opportunities.length > 0 ? (
                  <div className="space-y-3">
                    {analysis.saving_opportunities.map((opp, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-slate-700 leading-relaxed"
                      >
                        💡 {opp}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4">
                    No immediate discretionary cutbacks detected. Your current distribution is well balanced.
                  </p>
                )}
              </div>
            </div>

            {/* Positive Habits */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Positive Financial Habits</span>
                </div>
                {analysis.positive_habits && analysis.positive_habits.length > 0 ? (
                  <div className="space-y-3">
                    {analysis.positive_habits.map((habit, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-xs text-slate-700 leading-relaxed"
                      >
                        <span className="font-bold text-emerald-800 block mb-0.5">{habit.title}</span>
                        <span>{habit.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4">
                    Keep logging consistent transactions and increasing your savings rate to build positive milestones.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Budget Recommendations & Suggested Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Suggested Budgets */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm mb-3">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <span>Recommended Category Budgets</span>
              </div>
              {analysis.budget_recommendations && analysis.budget_recommendations.length > 0 ? (
                <div className="space-y-3">
                  {analysis.budget_recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800">{rec.category}</span>
                        <span className="font-semibold text-brand-700">
                          Suggested Limit: {formatCurrency(rec.recommended_budget)}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] leading-relaxed">{rec.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4">
                  You have active budgets assigned to all your primary spending categories.
                </p>
              )}
            </div>

            {/* Suggested Actions */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm mb-3">
                <CheckCircle2 className="w-5 h-5 text-brand-600" />
                <span>Suggested Action Items</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {analysis.suggested_actions?.map((act, idx) => (
                  <li key={idx} className="flex items-start space-x-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Educational Disclaimer */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200/80 text-xs text-slate-500 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed italic">
              <b>Important Disclaimer:</b> {analysis.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Advisor;
