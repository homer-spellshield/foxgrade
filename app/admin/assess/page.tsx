import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { frameworks } from '@/lib/frameworks'
import { CheckCircle2, ChevronRight, Shield } from 'lucide-react'
import Link from 'next/link'

export default async function AssessPillar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()
    
  if (!orgMember) redirect('/admin/onboarding')

  // Fetch framework progress from DB
  const { data: compliance } = await supabase
    .from('compliance_frameworks')
    .select('*')
    .eq('org_id', orgMember.org_id)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Assess Posture</h1>
        <p className="text-slate-500 mt-1">Guided framework assessments automatically mapped against your core profile.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {frameworks.map(fw => {
          const dbStatus = compliance?.find(c => c.framework_type === fw.id)
          const statusText = dbStatus?.status === 'achieved' ? 'Achieved' : dbStatus?.status === 'in_progress' ? 'In Progress' : 'Not Started'
          const bgStatus = dbStatus?.status === 'achieved' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'

          return (
            <div key={fw.id} className={`rounded-xl shadow-sm border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors ${bgStatus}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${dbStatus?.status === 'achieved' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{fw.name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${dbStatus?.status === 'achieved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                        dbStatus?.status === 'in_progress' ? 'bg-amber-100 text-amber-800 border-amber-200' : 
                        'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {statusText}
                    </span>
                    <span className="text-sm text-slate-500">{fw.sections.length} Sections</span>
                  </div>
                </div>
              </div>
              
              <Link href={`/admin/assess/${fw.id}`} className="shrink-0">
                <button className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#1A3D2E] text-white px-5 py-2.5 rounded-lg hover:bg-[#1A3D2E]/90 font-medium transition-colors">
                  {dbStatus?.status === 'achieved' ? 'Review Assessment' : 'Continue Assessment'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
