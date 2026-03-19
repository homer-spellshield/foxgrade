import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, CircleDashed, ShieldAlert } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('org_members')
    .select('org_id, role, organisations(name, trust_centre_live)')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) {
    // If no org, they might be an MSP or newly registered waiting for link.
    // For now, redirect to onboarding creation if not mapped.
    redirect('/admin/onboarding')
  }

  const { data: progress } = await supabase
    .from('onboarding_progress')
    .select('steps_completed')
    .eq('org_id', orgMember.org_id)
    .single()

  const stepsList = ['profile', 'colors', 'frameworks', 'posture', 'evidence', 'preview', 'live']
  const completed = progress?.steps_completed || {}
  const completedCount = stepsList.filter(s => completed[s]).length
  const totalSteps = stepsList.length
  
  if (completedCount === 0) {
    redirect('/admin/onboarding')
  }

  const orgData = Array.isArray(orgMember.organisations) ? orgMember.organisations[0] : orgMember.organisations;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Onboarding Checklist Card */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Trust Centre Setup</h2>
              <p className="text-sm text-slate-500 mt-1">
                Your Trust Centre is {Math.round((completedCount / totalSteps) * 100)}% ready.
              </p>
            </div>
            <Link 
              href="/admin/onboarding"
              className="px-4 py-2 bg-[#1A3D2E] text-white text-sm font-medium rounded-md hover:bg-[#1A3D2E]/90 transition-colors"
            >
              Resume Setup
            </Link>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full mb-6 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${(completedCount / totalSteps) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
             {stepsList.map(step => (
               <div key={step} className="flex items-center gap-2">
                 {completed[step] ? (
                   <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                 ) : (
                   <CircleDashed className="w-4 h-4 text-slate-300" />
                 )}
                 <span className={completed[step] ? "text-slate-800" : "text-slate-500"}>
                   {step.charAt(0).toUpperCase() + step.slice(1)}
                 </span>
               </div>
             ))}
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${orgData?.trust_centre_live ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="font-semibold text-slate-800">Status</h3>
          <p className="text-sm font-medium mt-1 uppercase tracking-wide">
            {orgData?.trust_centre_live ? (
              <span className="text-emerald-600">Live</span>
            ) : (
              <span className="text-amber-600">Draft</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
