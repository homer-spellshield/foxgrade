import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, LayoutDashboard, FileText, Settings, Activity, LogOut, CheckCircle2 } from 'lucide-react';

export default function AdminLayout() {
  const { signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Documents', path: '/admin/documents', icon: FileText },
    { name: 'Editor', path: '/admin/editor', icon: CheckCircle2 },
    { name: 'Analytics', path: '/admin/analytics', icon: Activity },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  // Hide sidebar on the onboarding wizard page
  const isOnboarding = location.pathname.includes('/admin/onboarding');

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] text-slate-900">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center font-medium">
            <Shield className="w-5 h-5 mr-2 text-[#C9A84C]" />
            Foxgrade Onboarding
          </div>
          <button onClick={signOut} className="text-sm text-slate-500 hover:text-slate-900 flex items-center">
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </button>
        </header>
        <main className="p-6 md:p-12">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center font-medium">
          <Shield className="w-5 h-5 mr-2 text-[#C9A84C]" />
          Foxgrade Admin
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button onClick={signOut} className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">
            <LogOut className="w-4 h-4 mr-3 text-slate-400" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
