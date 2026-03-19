import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Upload, FileDown, CheckCircle, AlertTriangle, FileSearch, ShieldAlert } from 'lucide-react'

export default async function RespondPillar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) redirect('/admin/onboarding')

  const { data: uploads } = await supabase
    .from('questionnaire_uploads')
    .select('*, questionnaire_responses(id, confidence, status)')
    .eq('org_id', orgMember.org_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Respond</h1>
          <p className="text-slate-500 mt-1">AI-assisted security questionnaire completion mapped from your live Knowledge Base.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#1A3D2E] hover:bg-[#1A3D2E]/90 text-white px-4 py-2 rounded-md font-medium transition-colors">
          <Upload className="w-4 h-4" /> Upload Questionnaire
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {(!uploads || uploads.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
              <FileSearch className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No active response flows</h3>
            <p className="text-slate-500 mt-1 mb-6 max-w-sm">
              Upload an Excel (XLSX) or PDF security questionnaire from a prospect. Our AI engine will map the answers.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Filename</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Uploaded</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Status</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600 text-center">AI Confidence Map</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {uploads.map((upload: any) => {
                const total = upload.questionnaire_responses?.length || 0
                const needsReview = upload.questionnaire_responses?.filter((r:any) => r.confidence === 'needs_review' || r.confidence === 'low').length || 0
                
                return (
                  <tr key={upload.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{upload.original_filename}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(upload.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${upload.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          upload.status === 'in_review' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                          'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                        {upload.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {total > 0 ? (
                        <div className="flex items-center justify-center gap-3">
                          {needsReview > 0 ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                              <ShieldAlert className="w-3 h-3" /> {needsReview} flagged
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              <CheckCircle className="w-3 h-3" /> High Confidence
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">Processing...</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       {upload.status !== 'processing' && (
                         <Link href={`/admin/respond/${upload.id}`} className="text-sm font-medium text-[#1A3D2E] hover:underline">
                           Review Answers
                         </Link>
                       )}
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
