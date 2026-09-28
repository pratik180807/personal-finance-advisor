import React, { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import { formatCurrency, getMonthName, getCategoryColor } from '../utils/formatters';
import NotificationToast from '../components/NotificationToast';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const Reports = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await reportService.getMonthly({
        month: selectedMonth,
        year: selectedYear,
      });
      setReport(res.data.data);
    } catch (err) {
      console.error('Failed to load monthly report:', err);
      setError('Could not generate report for the selected month.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear]);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const res = await reportService.downloadPdf({
        month: selectedMonth,
        year: selectedYear,
      });

      // Create download blob link
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial_statement_${getMonthName(selectedMonth).toLowerCase()}_${selectedYear}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setToast({ message: 'Monthly PDF statement downloaded successfully!', type: 'success' });
    } catch (err) {
      console.error('PDF download error:', err);
      setToast({ message: 'Failed to download PDF report', type: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Monthly Financial Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Generate and export complete audited statements for any month
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month & Year Selectors */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Download PDF button */}
          <button
            onClick={handleDownloadPdf}
            disabled={downloading || loading}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Preparing PDF...' : 'Download PDF'}</span>
          </button>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Print</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Compiling statement...</p>
        </div>
      ) : error || !report ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-sm text-rose-600 mb-3">{error}</p>
          <button
            onClick={fetchReport}
            className="px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700"
          >
            Try Again
          </button>
        </div>
      ) : (
        /* Printable Report Document Card */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Statement Header */}
          <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-600">
                Official Financial Statement
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {report.month_name} {report.year} Report
              </h3>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-400">
              <p>Generated: {new Date().toLocaleDateString('en-IN')}</p>
              <p className="font-semibold text-slate-700">Currency: INR (₹)</p>
            </div>
          </div>

          {/* AI Executive Summary Callout */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-800 mb-1">
                AI Summary & Insights
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {report.ai_summary}
              </p>
            </div>
          </div>

          {/* 1. Financial Overview Summary Box */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              1. Financial Overview
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">Total Income</span>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">
                  {formatCurrency(report.total_income)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">Total Expenses</span>
                <p className="text-xl font-bold text-rose-600 mt-0.5">
                  {formatCurrency(report.total_expenses)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">Net Savings</span>
                <p className={`text-xl font-bold mt-0.5 ${report.total_savings >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                  {formatCurrency(report.total_savings)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">Savings Rate</span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {report.savings_percentage}%
                </p>
              </div>
            </div>

            {/* High/Low Highlights */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 text-slate-700 flex justify-between">
                <span className="text-slate-500">Highest Spending Outflow:</span>
                <span className="font-bold text-slate-900">{report.highest_spending_category}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 text-slate-700 flex justify-between">
                <span className="text-slate-500">Lowest Spending Category:</span>
                <span className="font-bold text-slate-900">{report.lowest_spending_category}</span>
              </div>
            </div>
          </div>

          {/* 2. Category-wise Expenses Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              2. Category-wise Expenses
            </h4>
            {report.category_wise_expenses && report.category_wise_expenses.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4 text-right">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.category_wise_expenses.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: getCategoryColor(c.category) }}
                          />
                          <span>{c.category}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(c.amount)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-500">
                          {c.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No expenses recorded for this month.</p>
            )}
          </div>

          {/* 3. Budget vs Actual Performance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              3. Budget Performance
            </h4>
            {report.budget_vs_actual && report.budget_vs_actual.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4 text-right">Budget Limit</th>
                      <th className="py-2.5 px-4 text-right">Actual Spent</th>
                      <th className="py-2.5 px-4 text-right">Remaining</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.budget_vs_actual.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{b.category}</td>
                        <td className="py-2.5 px-4 text-right text-slate-600">{formatCurrency(b.budget)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatCurrency(b.spent)}</td>
                        <td className={`py-2.5 px-4 text-right font-semibold ${b.remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatCurrency(b.remaining)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'Over Budget'
                                ? 'bg-rose-50 text-rose-700'
                                : b.status === 'Approaching Limit'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No monthly budgets configured for this month.</p>
            )}
          </div>

          {/* 4. Active Goals Progress */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              4. Savings Goals Status
            </h4>
            {report.goals_progress && report.goals_progress.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {report.goals_progress.map((g) => (
                  <div key={g.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800 text-xs truncate">{g.name}</span>
                      <span className="text-[11px] font-bold text-brand-600">{g.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-2">
                      <div
                        className="h-1.5 rounded-full bg-brand-600"
                        style={{ width: `${Math.min(100, g.progress_percentage)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No savings goals created.</p>
            )}
          </div>

          {/* Statement Footer Note */}
          <div className="pt-6 border-t border-slate-200 text-center text-[11px] text-slate-400">
            This statement was automatically generated by Personal Finance Advisor Bot. All insights and metrics are for personal educational and budgeting use only.
          </div>
        </div>
      )}

      <NotificationToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default Reports;
