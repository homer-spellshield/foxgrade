import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, Upload, Plus, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) redirect('/admin/onboarding')

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('org_id', orgMember.org_id)
    .order('created_at', { ascending: false })

  const calculateStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { color: 'bg-slate-300', text: 'No Expiry', icon: <FileText className="w-4 h-4 text-slate-500" /> }
    
    const today = new Date()
    const exp = new Date(expiryDate)
    const diffTime = exp.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { color: 'bg-red-50', dot: 'bg-red-500', text: 'Expired', textCol: 'text-red-700', icon: <AlertCircle className="w-4 h-4 text-red-500" /> }
    if (diffDays <= 90) return { color: 'bg-amber-50', dot: 'bg-amber-500', text: `Expiring in ${diffDays}d`, textCol: 'text-amber-700', icon: <Clock className="w-4 h-4 text-amber-500" /> }
    
    return { color: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'Valid', textCol: 'text-emerald-700', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Documents & Policies</h1>
          <p className="text-slate-500 mt-1">Manage public and restricted trust materials securely.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#1A3D2E] hover:bg-[#1A3D2E]/90 text-white px-4 py-2 rounded-md font-medium transition-colors">
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {(!documents || documents.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No documents yet</h3>
            <p className="text-slate-500 mt-1 mb-6 max-w-sm">
              Upload compliance reports, policies, and NDAs. Everything is isolated to your private storage boundary.
            </p>
            <button className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-md font-medium transition-colors">
              <Plus className="w-4 h-4" /> Add your first document
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Name</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Category</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Access Gating</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc: any) => {
                const status = calculateStatus(doc.expiry_date)
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{doc.name}</td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {doc.access_level === 'public' && <span className="text-emerald-600 text-sm font-medium">Public</span>}
                      {doc.access_level === 'registered' && <span className="text-indigo-600 text-sm font-medium">Registered Viewers</span>}
                      {doc.access_level === 'nda_required' && <span className="text-amber-600 text-sm font-medium">NDA Gate</span>}
                      {doc.access_level === 'request_access' && <span className="text-red-600 text-sm font-medium">Manual Auth</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color} ${status.textCol} border-transparent`}>
                        {status.icon}
                        {status.text}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
