import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const PAGE_TITLES = {
  '/': 'Financial Dashboard',
  '/expenses': 'Expense Management',
  '/income': 'Income Tracking',
  '/budgets': 'Monthly Budgets',
  '/goals': 'Savings Goals',
  '/advisor': 'AI Financial Advisor',
  '/reports': 'Monthly Statements & Reports',
  '/profile': 'Account Profile',
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || 'Personal Finance Advisor';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} pageTitle={pageTitle} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="py-4 px-6 border-t border-slate-200/80 text-center text-xs text-slate-500">
          Personal Finance Advisor Bot • Educational & Internship Project • Amounts in INR (₹)
        </footer>
      </div>
    </div>
  );
};

export default Layout;
