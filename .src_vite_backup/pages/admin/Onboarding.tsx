import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [subdomain, setSubdomain] = useState('');

  // Step 1: Company Profile
  const [company, setCompany] = useState({
    name: '',
    industry: '',
    website: '',
    brand_primary: '#1A3D2E',
    brand_accent: '#C9A84C',
  });

  // Step 2: Security Guidelines
  const [security, setSecurity] = useState({
    data_handling: {
      hosting_location: 'AWS Sydney (ap-southeast-2)',
      retention_policy: 'Retained for duration of agreement + 90 days',
    },
    access_management: {
      mfa_enforced: true,
      sso_supported: true,
    },
    encryption: {
      at_rest: 'AES-256',
      in_transit: 'TLS 1.3',
    },
    incident_response: {
      sla_critical: '4 hours',
      breach_notification: 'Within 72 hours',
    }
  });

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Create Organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: company.name,
          industry: company.industry,
          website: company.website,
          brand_primary: company.brand_primary,
          brand_accent: company.brand_accent,
          subdomain: subdomain || company.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 2. Link User Profile
      if (session?.user) {
        await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            org_id: orgData.id,
            role: 'Admin'
          });
      }

      // 3. Insert Security Answers
      const answersToInsert = [];
      for (const [section, answers] of Object.entries(security)) {
        for (const [qId, val] of Object.entries(answers)) {
          answersToInsert.push({
            org_id: orgData.id,
            section,
            question_id: qId,
            answer_value: val
          });
        }
      }
      
      const { error: secError } = await supabase
        .from('security_answers')
        .insert(answersToInsert);

      if (secError) throw secError;

      // Finish Onboarding
      navigate('/admin/dashboard');
    } catch (err: any) {
      alert('Error creating profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
              step === num ? 'bg-[#1A3D2E] text-white' : 
              step > num ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
            }`}>
              {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
            </div>
            <span className={`ml-3 text-sm font-medium ${
              step >= num ? 'text-slate-900' : 'text-slate-400'
            }`}>
              {num === 1 ? 'Company Profile' : num === 2 ? 'Security Posture' : 'Review'}
            </span>
            {num < 3 && <ChevronRight className="w-5 h-5 mx-8 text-slate-300" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <h2 className="text-xl font-medium text-slate-900 mb-1">Company Profile</h2>
              <p className="text-slate-500 text-sm">Tell us about your organization to setup your Trust Centre.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                <input 
                  type="text" 
                  value={company.name}
                  onChange={(e) => setCompany({...company, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2E]/20"
                  placeholder="Meridian Financial Services"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                  <input 
                    type="text" 
                    value={company.industry}
                    onChange={(e) => setCompany({...company, industry: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2E]/20"
                    placeholder="Fintech"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                  <input 
                    type="url" 
                    value={company.website}
                    onChange={(e) => setCompany({...company, website: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2E]/20"
                    placeholder="meridianfs.com.au"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Primary Brand Color</label>
                  <div className="flex bg-slate-50 border border-slate-300 rounded-md px-3 py-2">
                    <input 
                      type="color" 
                      value={company.brand_primary}
                      onChange={(e) => setCompany({...company, brand_primary: e.target.value})}
                      className="w-5 h-5 rounded overflow-hidden mr-2 cursor-pointer"
                    />
                    <span className="text-sm border-none uppercase text-slate-600 font-mono">{company.brand_primary}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Accent Color</label>
                  <div className="flex bg-slate-50 border border-slate-300 rounded-md px-3 py-2">
                    <input 
                      type="color" 
                      value={company.brand_accent}
                      onChange={(e) => setCompany({...company, brand_accent: e.target.value})}
                      className="w-5 h-5 rounded overflow-hidden mr-2 cursor-pointer"
                    />
                    <span className="text-sm border-none uppercase text-slate-600 font-mono">{company.brand_accent}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <button onClick={handleNext} disabled={!company.name} className="bg-[#1A3D2E] hover:bg-[#1A3D2E]/90 text-white px-5 py-2 rounded-md text-sm font-medium disabled:opacity-50">
                Next Step
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <h2 className="text-xl font-medium text-slate-900 mb-1">Security Posture</h2>
              <p className="text-slate-500 text-sm">Help us auto-populate your Trust Centre by answering these baseline questions.</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Data Handling</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data Hosting Location</label>
                    <input type="text" value={security.data_handling.hosting_location} onChange={(e) => setSecurity({...security, data_handling: {...security.data_handling, hosting_location: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data Retention Policy</label>
                    <input type="text" value={security.data_handling.retention_policy} onChange={(e) => setSecurity({...security, data_handling: {...security.data_handling, retention_policy: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Access Management</h3>
                <div className="flex gap-8">
                  <label className="flex items-center">
                    <input type="checkbox" checked={security.access_management.mfa_enforced} onChange={(e) => setSecurity({...security, access_management: {...security.access_management, mfa_enforced: e.target.checked}})} className="rounded border-slate-300 text-[#1A3D2E] focus:ring-[#1A3D2E]" />
                    <span className="ml-2 text-sm text-slate-700">MFA Enforced</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" checked={security.access_management.sso_supported} onChange={(e) => setSecurity({...security, access_management: {...security.access_management, sso_supported: e.target.checked}})} className="rounded border-slate-300 text-[#1A3D2E] focus:ring-[#1A3D2E]" />
                    <span className="ml-2 text-sm text-slate-700">SSO Supported</span>
                  </label>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Encryption</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Encryption at Rest</label>
                    <input type="text" value={security.encryption.at_rest} onChange={(e) => setSecurity({...security, encryption: {...security.encryption, at_rest: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Encryption in Transit</label>
                    <input type="text" value={security.encryption.in_transit} onChange={(e) => setSecurity({...security, encryption: {...security.encryption, in_transit: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button onClick={handleBack} className="text-slate-600 hover:text-slate-900 px-4 py-2 text-sm font-medium">Back</button>
              <button onClick={handleNext} className="bg-[#1A3D2E] hover:bg-[#1A3D2E]/90 text-white px-5 py-2 rounded-md text-sm font-medium">Next Step</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <h2 className="text-xl font-medium text-slate-900 mb-1">Review & Generate</h2>
              <p className="text-slate-500 text-sm">You are almost done. Review your company Trust Centre configuration before generating your page.</p>
            </div>

            <div className="border border-slate-200 rounded-md divide-y divide-slate-100 bg-slate-50">
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm text-slate-500">Company Name</span>
                <span className="text-sm font-medium text-slate-900">{company.name}</span>
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm text-slate-500">Industry</span>
                <span className="text-sm font-medium text-slate-900">{company.industry}</span>
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm text-slate-500">Public URL</span>
                <div className="flex items-center text-sm font-medium text-slate-900">
                  <span className="text-slate-400 font-normal mr-1">foxgrade.com/p/</span>
                  <input type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder={company.name.toLowerCase().replace(/[^a-z0-9]/g, '')} className="border border-slate-300 px-2 py-1 rounded bg-white text-sm focus:ring-[#1A3D2E]/20" />
                </div>
              </div>
            </div>

            <div className="bg-[#E4EDE8] border border-[#1A3D2E]/20 p-4 rounded-md flex">
              <Shield className="w-10 h-10 text-[#1A3D2E] mr-4 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-[#1A3D2E] mb-1">Ready to create your Trust Centre?</h4>
                <p className="text-sm text-[#1A3D2E]/80 mb-3">Upon creation, a beautiful, secure public-facing portal will be generated showcasing your security posture using the Foxgrade "Restrained Authority" design framework.</p>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button onClick={handleBack} disabled={loading} className="text-slate-600 hover:text-slate-900 px-4 py-2 text-sm font-medium">Back</button>
              <button onClick={handleSubmit} disabled={loading} className="bg-[#1A3D2E] hover:bg-[#1A3D2E]/90 text-white px-5 py-2 rounded-md text-sm font-medium flex items-center">
                {loading ? 'Generating...' : (
                  <>
                    <Shield className="w-4 h-4 mr-2 text-[#C9A84C]" />
                    Generate Trust Centre
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
