import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Check, Edit2, AlertCircle, ChevronLeft } from 'lucide-react'

export default async function ReviewQuestionnaire(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) redirect('/admin/onboarding')

  // Fetch specific upload
  const { data: upload } = await supabase
    .from('questionnaire_uploads')
    .select('*')
    .eq('id', params.id)
    .eq('org_id', orgMember.org_id)
    .single()
    
  if (!upload) redirect('/admin/respond')

  // Fetch responses
  const { data: responses } = await supabase
    .from('questionnaire_responses')
    .select('*')
    .eq('questionnaire_id', upload.id)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <Link href="/admin/respond" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Respond
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{upload.original_filename}</h1>
            <p className="text-slate-500 mt-1">Review AI generated drafts before exporting.</p>
          </div>
          <button className="bg-[#1A3D2E] hover:bg-[#1A3D2E]/90 text-white px-6 py-2 rounded-md font-medium transition-colors">
            Export Final Document
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {responses && responses.map((r: any, idx: number) => {
          const isFlagged = r.confidence === 'needs_review' || r.confidence === 'low'
          const isApproved = r.status === 'approved'

          return (
            <div key={r.id} className={`bg-white p-6 rounded-xl border ${isApproved ? 'border-emerald-200 shadow-sm' : isFlagged ? 'border-amber-300 shadow-sm bg-amber-50/30' : 'border-slate-200 shadow-sm'}`}>
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 font-medium text-sm mt-0.5 w-6">{idx + 1}.</span>
                    <p className="font-semibold text-slate-900 text-lg leading-snug">{r.question_text}</p>
                  </div>
                  
                  <div className="pl-9">
                    {isFlagged && (
                      <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 bg-amber-100 text-amber-800 rounded-md text-xs font-bold uppercase tracking-wider">
                        <AlertCircle className="w-3.5 h-3.5" /> Insufficient Context / Review Required
                      </div>
                    )}
                    <textarea 
                      defaultValue={r.draft_answer} 
                      className={`w-full min-h-[100px] p-4 text-slate-700 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#1A3D2E] outline-none resize-y ${isFlagged ? 'border-amber-300' : 'border-slate-300'}`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md text-sm font-medium transition-colors">
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-md text-sm font-medium transition-colors">
                    <Edit2 className="w-4 h-4" /> Rewrite
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
