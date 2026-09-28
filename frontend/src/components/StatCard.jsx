import React from 'react';

const COLOR_MAP = {
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-500/10 text-emerald-600',
  },
  rose: {
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    text: 'text-rose-700',
    iconBg: 'bg-rose-500/10 text-rose-600',
  },
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    text: 'text-indigo-700',
    iconBg: 'bg-indigo-500/10 text-indigo-600',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    text: 'text-amber-700',
    iconBg: 'bg-amber-500/10 text-amber-600',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    text: 'text-blue-700',
    iconBg: 'bg-blue-500/10 text-blue-600',
  },
};

const StatCard = ({ title, value, icon: Icon, subtext, color = 'indigo', badge }) => {
  const scheme = COLOR_MAP[color] || COLOR_MAP.indigo;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          {title}
        </span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </h3>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${scheme.bg} ${scheme.text}`}>
            {badge}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-2 text-xs text-slate-500 font-medium">
          {subtext}
        </p>
      )}
    </div>
  );
};

export default StatCard;
