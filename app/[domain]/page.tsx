import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { Shield, FileText, CheckCircle2, Lock, Eye } from 'lucide-react'

export default async function PublicTrustCentre(props: { params: Promise<{ domain: string }> }) {
  const params = await props.params;
  const subdomain = params.domain
  const supabase = await createClient()

  // Find org by slug
  const { data: org } = await supabase
    .from('organisations')
    .select('id, name, industry, trust_centre_live, msp_id')
    .eq('slug', subdomain)
    .single()

  if (!org) notFound()

  // Find frameworks
  const { data: frameworks } = await supabase
    .from('compliance_frameworks')
    .select('framework_type, status, expiry_date')
    .eq('org_id', org.id)

  const { data: documents } = await supabase
    .from('documents')
    .select('id, name, category, access_level, expiry_date')
    .eq('org_id', org.id)

  return (
    <div className="min-h-screen bg-slate-50 relative selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Draft Map / Watermark Validation */}
      {!org.trust_centre_live && (
        <div className="bg-amber-100 text-amber-800 text-center py-2 text-sm font-semibold tracking-wide">
          PREVIEW MODE — This Trust Centre is not yet published.
        </div>
      )}

      {/* Header Profile */}
      <div className="bg-[#1A3D2E] text-white pt-24 pb-20 px-4 md:px-8 border-b-4 border-emerald-500">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-6">
          <div className="w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center text-3xl font-bold text-[#1A3D2E]">
            {org.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{org.name}</h1>
            <p className="text-emerald-100 mt-3 text-lg font-medium">{org.industry} — Verified Security Posture</p>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-emerald-50 border border-white/20 backdrop-blur-sm shadow-sm transition-all hover:bg-white/15 cursor-default">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold tracking-wide">Secured by Foxgrade</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 space-y-16">
        
        {/* Compliance Posture Matrix */}
        {frameworks && frameworks.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#1A3D2E]" /> Compliance Frameworks
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {frameworks.map((fw: any) => (
                <div key={fw.framework_type} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm mb-1">{fw.framework_type.replace(/_/g, ' ')}</h3>
                      <div className="flex flex-col gap-1 mt-3">
                         {fw.status === 'achieved' ? (
                           <div className="inline-flex items-center gap-1.5 text-emerald-700 text-sm font-medium bg-emerald-50 px-2.5 py-1 rounded w-max">
                             <CheckCircle2 className="w-4 h-4" /> Validated
                           </div>
                         ) : (
                           <div className="inline-flex items-center gap-1.5 text-amber-700 text-sm font-medium bg-amber-50 px-2.5 py-1 rounded w-max">
                             <Eye className="w-4 h-4" /> Assessed In-house
                           </div>
                         )}
                         {fw.expiry_date && (
                           <div className="text-xs text-slate-500 font-medium ml-1">Expires {new Date(fw.expiry_date).toLocaleDateString()}</div>
                         )}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                      <Shield className="w-5 h-5 text-slate-400 group-hover:text-[#1A3D2E] transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Dynamic Resource Data Room */}
        {documents && documents.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#1A3D2E]" /> Trust Documents
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {documents.map((doc: any) => (
                <div key={doc.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${doc.access_level === 'public' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                      {doc.access_level === 'public' ? <FileText className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{doc.name}</h3>
                      <p className="text-sm text-slate-500 capitalize mt-0.5">{doc.category.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <button className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    doc.access_level === 'public' 
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}>
                    {doc.access_level === 'public' ? 'Download' : 'Request Access'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
