import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Activity, Users, AlertTriangle, FileText, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrg() {
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();
      if (profile?.org_id) {
        const { data: organization } = await supabase.from('organizations').select('*').eq('id', profile.org_id).single();
        setOrg(organization);
      }
      setLoading(false);
    }
    fetchOrg();
  }, [user]);

  if (loading) {
    return <div className="text-slate-500 animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Overview of your Trust Centre and security posture.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Score */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mr-4 border border-emerald-200">
            <span className="text-xl font-bold text-emerald-700">92</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Health Score</h3>
            <div className="text-2xl font-medium text-slate-900">Excellent</div>
          </div>
        </div>

        {/* Visitors */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
          <div className="flex items-center text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
            <Users className="w-4 h-4 mr-2" /> Visitors (30d)
          </div>
          <div className="text-3xl font-medium text-slate-900">1,248</div>
          <div className="text-sm text-emerald-600 mt-1 flex items-center">
            ↑ 12% vs last month
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
          <div className="flex items-center text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
            <Activity className="w-4 h-4 mr-2" /> Pending Requests
          </div>
          <div className="text-3xl font-medium text-slate-900">3</div>
          <Link to="/admin/documents" className="text-sm text-[#1A3D2E] mt-1 font-medium hover:underline flex items-center">
            Review requests <ChevronRight className="w-3 h-3 ml-1" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Action Required: Expiring Documents */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-medium text-slate-900 flex items-center">
              <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
              Action Required
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { name: 'SOC 2 Type II Report', expiry: 'Expiring in 14 days', status: 'amber' },
              { name: 'Cyber Insurance Certificate', expiry: 'Expired 2 days ago', status: 'red' },
            ].map((doc, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${doc.status === 'red' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{doc.name}</div>
                    <div className="text-xs text-slate-500">{doc.expiry}</div>
                  </div>
                </div>
                <button className="text-xs font-medium text-[#1A3D2E] bg-[#E4EDE8] px-3 py-1.5 rounded hover:bg-[#1A3D2E]/20 transition-colors">
                  Update
                </button>
              </div>
            ))}
            <div className="p-4 text-center">
              <Link to="/admin/documents" className="text-sm font-medium text-slate-500 hover:text-slate-900">
                View all documents
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-medium text-slate-900">Quick Links</h3>
          </div>
          <div className="p-2">
            {[
              { name: 'View live Trust Centre', icon: CheckCircle2, link: `/p/${org?.subdomain || 'demo-org'}` },
              { name: 'Edit security posture', icon: FileText, link: '/admin/editor' },
              { name: 'View NDA signature logs', icon: Clock, link: '/admin/analytics' },
            ].map((item, i) => (
              <Link key={i} to={item.link} className="flex items-center p-4 hover:bg-slate-50 rounded-md transition-colors group">
                <div className="w-8 h-8 rounded bg-slate-100 text-slate-500 flex items-center justify-center mr-4 group-hover:bg-[#1A3D2E] group-hover:text-white transition-colors">
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  {item.name}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
