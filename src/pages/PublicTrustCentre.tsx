import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Shield, CheckCircle2, AlertCircle, FileText, Lock, Server, 
  Users, Activity, HelpCircle, Menu, X, ExternalLink, 
  MessageSquare, ChevronDown, ChevronUp, Clock
} from 'lucide-react';

type Section = 'overview' | 'compliance' | 'documents' | 'data' | 'subprocessors' | 'pentest' | 'incident' | 'faq';
type AccessLevel = 'Public' | 'Registered' | 'NDA Required' | 'Request Access';

interface Document {
  id: string;
  name: string;
  category: string;
  expiry_date: string;
  access_level: AccessLevel;
}

const StatusDot = ({ status }: { status: 'current' | 'expiring' | 'expired' }) => {
  const colors = { current: 'bg-emerald-500', expiring: 'bg-amber-500', expired: 'bg-red-500' };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]} mr-2`} />;
};

const AccessBadge = ({ level }: { level: AccessLevel }) => {
  const styles = {
    'Public': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Registered': 'bg-blue-50 text-blue-700 border-blue-200',
    'NDA Required': 'bg-amber-50 text-amber-700 border-amber-200',
    'Request Access': 'bg-red-50 text-red-700 border-red-200'
  };
  const dots = { 'Public': 'bg-emerald-500', 'Registered': 'bg-blue-500', 'NDA Required': 'bg-amber-500', 'Request Access': 'bg-red-500' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dots[level]}`}></span>{level}
    </span>
  );
};

export default function PublicTrustCentre() {
  const { orgId } = useParams();
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  
  // Data State
  const [org, setOrg] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [faqs, setFaqs] = useState<any[]>([]);
  const [subprocessors, setSubprocessors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!orgId) return;
      
      const { data: orgData } = await supabase.from('organizations').select('*').eq('subdomain', orgId).single();
      if (!orgData) {
        setLoading(false);
        return;
      }
      setOrg(orgData);

      const [docsRes, ansRes, faqsRes, subRes] = await Promise.all([
        supabase.from('documents').select('*').eq('org_id', orgData.id),
        supabase.from('security_answers').select('*').eq('org_id', orgData.id),
        supabase.from('faqs').select('*').eq('org_id', orgData.id),
        supabase.from('subprocessors').select('*').eq('org_id', orgData.id),
      ]);

      setDocuments(docsRes.data || []);
      setFaqs(faqsRes.data || []);
      setSubprocessors(subRes.data || []);

      const formattedAnswers: any = {};
      ansRes.data?.forEach(a => {
        if (!formattedAnswers[a.section]) formattedAnswers[a.section] = {};
        formattedAnswers[a.section][a.question_id] = a.answer_value;
      });
      setAnswers(formattedAnswers);

      setLoading(false);
    }
    fetchData();
  }, [orgId]);

  const primaryColor = org?.brand_primary || '#1A3D2E';
  const accentColor = org?.brand_accent || '#C9A84C';

  const navItems: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'compliance', label: 'Compliance', icon: CheckCircle2 },
    { id: 'documents', label: 'Documents & Policies', icon: FileText },
    { id: 'data', label: 'Data Handling', icon: Server },
    { id: 'subprocessors', label: 'Sub-processors', icon: Users },
    { id: 'pentest', label: 'Penetration Testing', icon: Activity },
    { id: 'incident', label: 'Incident Response', icon: AlertCircle },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] text-slate-500">Loading Trust Centre...</div>;
  }
  if (!org) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] text-slate-500">Organization not found.</div>;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div>
              <h1 className="text-3xl font-medium text-slate-900 mb-4">{org.name}</h1>
              <p className="text-slate-600 leading-relaxed max-w-3xl text-lg">
                Official Trust Centre for {org.name}. We prioritize security and data protection across our platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-slate-200 rounded-lg overflow-hidden bg-white">
              {[
                { label: 'Data Hosting', value: answers?.data_handling?.hosting_location || 'Not Specified' },
                { label: 'Encryption at Rest', value: answers?.encryption?.at_rest || 'Not Specified' },
                { label: 'Encryption in Transit', value: answers?.encryption?.in_transit || 'Not Specified' },
                { label: 'MFA Enforced', value: answers?.access_management?.mfa_enforced ? 'Yes' : 'No' },
              ].map((item, i) => (
                <div key={i} className="p-5 border-b border-r border-slate-200">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{item.label}</div>
                  <div className="text-slate-900 font-medium">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="pt-8 border-t border-slate-100 flex items-center text-sm text-slate-500">
              <Clock className="w-4 h-4 mr-2" />
              Profile last verified: {new Date(org.updated_at).toLocaleDateString()}
            </div>
          </div>
        );

      case 'compliance':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h1 className="text-2xl font-medium text-slate-900 mb-2">Compliance & Certifications</h1>
              <p className="text-slate-600">Detailed view of our adherence to industry standards and regulatory frameworks.</p>
            </div>
            <div className="space-y-4">
              {documents.filter(d => d.category === 'Certificate').map((cert, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg p-5">
                  <div className="flex items-center mb-1">
                    <StatusDot status="current" />
                    <h3 className="text-base font-medium text-slate-900">{cert.name}</h3>
                  </div>
                  <div className="text-sm text-slate-500 mt-2">Access: {cert.access_level}</div>
                </div>
              ))}
              {documents.filter(d => d.category === 'Certificate').length === 0 && (
                <p className="text-slate-500 text-sm">No certifications uploaded yet.</p>
              )}
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h1 className="text-2xl font-medium text-slate-900 mb-2">Documents & Policies</h1>
              <p className="text-slate-600">Access our security documentation, policies, and certificates.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Access</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} onClick={() => setSelectedDoc(doc)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-slate-400 mr-3" />
                          <span className="text-sm font-medium text-slate-900">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{doc.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right"><AccessBadge level={doc.access_level} /></td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-4 text-center text-sm text-slate-500">No documents available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      // Remaining sections map dynamic object directly to UI matching old structure
      case 'data':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h1 className="text-2xl font-medium text-slate-900 mb-2">Data Handling</h1>
              <p className="text-slate-600">How we store, protect, and manage your data.</p>
            </div>
            <div className="grid gap-6">
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="text-base font-medium text-slate-900 mb-2">Data Storage Location</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{answers?.data_handling?.hosting_location || 'Not Specified'}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="text-base font-medium text-slate-900 mb-2">Data Retention</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{answers?.data_handling?.retention_policy || 'Not Specified'}</p>
              </div>
            </div>
          </div>
        );

      case 'subprocessors':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h1 className="text-2xl font-medium text-slate-900 mb-2">Sub-processors</h1>
              <p className="text-slate-600">Third-party services we use.</p>
            </div>
            {subprocessors.length > 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Purpose</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {subprocessors.map((sub, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{sub.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{sub.purpose}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{sub.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-slate-500 text-sm">No subprocessors listed.</p>}
          </div>
        );

      case 'pentest': return <div className="p-8 text-center text-slate-500">Penetration Testing details available upon request.</div>;
      case 'incident': return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h1 className="text-2xl font-medium text-slate-900 mb-2">Incident Response</h1>
              <p className="text-slate-600">Our approach to resolving security events.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Response SLAs</h3>
              <div className="grid gap-4 mb-8">
                <div className="flex justify-between p-4 border border-slate-200 rounded-md border-amber-200 bg-amber-50">
                  <span className="font-medium text-slate-900">Critical SLA</span>
                  <span className="text-slate-700">{answers?.incident_response?.sla_critical || 'Not Specified'}</span>
                </div>
                <div className="flex justify-between p-4 border border-slate-200 rounded-md border-amber-200 bg-amber-50">
                  <span className="font-medium text-slate-900">Breach Notification</span>
                  <span className="text-slate-700">{answers?.incident_response?.breach_notification || 'Not Specified'}</span>
                </div>
              </div>
            </div>
          </div>
      );
      case 'faq':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h1 className="text-2xl font-medium text-slate-900 mb-2">Frequently Asked Questions</h1>
            </div>
            {faqs.length > 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
                {faqs.map((faq, i) => (
                  <div key={i} className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-900 block mb-2">{faq.question}</span>
                    <span className="text-sm text-slate-600 block">{faq.answer}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-slate-500 text-sm">No FAQs available.</p>}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-sans text-slate-900 flex flex-col md:flex-row">
      <div className="md:hidden text-white p-4 flex items-center justify-between sticky top-0 z-20" style={{ backgroundColor: primaryColor }}>
        <div className="flex items-center font-medium">
          <Shield className="w-5 h-5 mr-2" style={{ color: accentColor }} />
          {org.name} Trust Centre
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className={`
        fixed inset-y-0 left-0 z-10 w-64 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ backgroundColor: primaryColor }}>
        <div className="p-6 hidden md:flex items-center font-medium text-white border-b border-white/10">
          <Shield className="w-5 h-5 mr-3" style={{ color: accentColor }} />
          {org.name}
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}
              >
                <Icon className={`w-4 h-4 mr-3`} style={{ color: isActive ? accentColor : 'currentColor' }} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 text-xs text-slate-400 flex items-center justify-center">
          <Lock className="w-3 h-3 mr-1.5 opacity-70" />
          Powered by Foxgrade
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
      
      {/* Mock Document Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="font-medium text-slate-900">{selectedDoc.name}</h3>
                 <button onClick={() => setSelectedDoc(null)}><X className="w-4 h-4 text-slate-400" /></button>
             </div>
             <p className="text-sm text-slate-600 mb-6">This document requires {selectedDoc.access_level} access to view.</p>
             <button onClick={() => setSelectedDoc(null)} className="w-full bg-[#1A3D2E] text-white py-2 rounded-md text-sm font-medium">Request Access</button>
          </div>
        </div>
      )}
    </div>
  );
}
