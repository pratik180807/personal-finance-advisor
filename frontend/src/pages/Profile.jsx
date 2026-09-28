import React from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  Database,
  Lock,
  LogOut,
  Info,
} from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          User Account & Security
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your personal details and review security configurations
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold uppercase shadow-lg shadow-brand-500/20">
            {user?.name ? user.name.slice(0, 2) : 'US'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{user?.name}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 mt-1.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● Active Account
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-3">
            <Mail className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
              <span className="font-semibold text-slate-800">{user?.email}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Member Since</span>
              <span className="font-semibold text-slate-800">
                {user?.created_at ? formatDate(user.created_at) : 'September 2026'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Isolation Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Security & Data Isolation Status</span>
        </h4>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Lock className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">Werkzeug Password Hashing</span>
              <span>All user passwords are encrypted using PBKDF2/scrypt before persistence.</span>
            </div>
          </div>

          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Database className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">Strict Multi-Tenant Isolation</span>
              <span>Every income, expense, budget, and goal query strictly checks your authenticated user JWT token identity.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logout button */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Account</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;
