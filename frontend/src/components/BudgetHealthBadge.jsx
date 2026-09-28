import React, { useState } from 'react';
import { Activity, Info, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from 'lucide-react';

const BudgetHealthBadge = ({ healthData }) => {
  const [expanded, setExpanded] = useState(false);

  if (!healthData) return null;

  const { score, max_score, grade, grade_color, factors, disclaimer } = healthData;

  const colorStyles = {
    emerald: {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-100 text-emerald-800',
    },
    blue: {
      text: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      bar: 'bg-blue-500',
      badge: 'bg-blue-100 text-blue-800',
    },
    amber: {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      bar: 'bg-amber-500',
      badge: 'bg-amber-100 text-amber-800',
    },
    rose: {
      text: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      bar: 'bg-rose-500',
      badge: 'bg-rose-100 text-rose-800',
    },
  }[grade_color] || {
    text: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    bar: 'bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-800',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Header & score */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-600">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-semibold text-slate-700">Budget Health</h4>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${colorStyles.badge}`}>
                {grade}
              </span>
            </div>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className={`text-3xl font-extrabold tracking-tight ${colorStyles.text}`}>
                {score}
              </span>
              <span className="text-slate-400 font-medium text-sm">/{max_score}</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors"
        >
          <span>{expanded ? 'Hide Factors' : 'View Factors'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-700 ${colorStyles.bar}`}
            style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
          />
        </div>
      </div>

      {/* Collapsible Factor Breakdown */}
      {expanded && (
        <div className="mt-5 pt-4 border-t border-slate-100 animate-fadeIn">
          <p className="text-xs text-slate-500 mb-3">
            Transparent scoring factors evaluated from your actual logged monthly numbers:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {factors?.map((f, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-800">{f.name}</span>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                    {f.status} ({f.score}/{f.max_score} pts)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{f.note}</p>
              </div>
            ))}
          </div>

          <div className="flex items-start space-x-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-800 text-[11px]">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <p className="leading-snug">{disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetHealthBadge;
