import React from 'react';
import { Menu, Bell, Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = ({ onOpenSidebar, pageTitle = 'Personal Finance Advisor' }) => {
  const { user } = useAuth();
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm">
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Date chip */}
        <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          📅 {currentDate}
        </span>

        {/* Quick action: Add Expense */}
        <Link
          to="/expenses?action=new"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Expense</span>
        </Link>

        {/* User avatar chip */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 font-bold text-xs uppercase">
            {user?.name ? user.name.slice(0, 2) : 'US'}
          </div>
          <span className="hidden sm:block text-xs font-semibold text-slate-700 max-w-[120px] truncate">
            {user?.name || 'User'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
