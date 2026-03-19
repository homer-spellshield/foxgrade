import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, ExternalLink, ShieldAlert, Plus } from 'lucide-react'

export default async function MspDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mspMember } = await supabase
    .from('msp_members')
    .select('msp_id')
    .eq('user_id', user.id)
    .single()

  if (!mspMember) {
    // Not an MSP, bounce to regular dashboard
    redirect('/admin')
  }

  // Fetch client orgs
  const { data: clients } = await supabase
    .from('organisations')
    .select('*, documents(id, expiry_date), access_requests(id, status)')
    .eq('msp_id', mspMember.msp_id)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">MSP Portal</h1>
          <p className="text-slate-500 mt-1">Manage your linked clients and their posture.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#1A3D2E] hover:bg-[#1A3D2E]/90 text-white px-4 py-2 rounded-md font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {(!clients || clients.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-200">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No active clients</h3>
            <p className="text-slate-500 mt-1 mb-6 max-w-sm">
              You haven't linked any organisations yet. Send an invite link to onboard a client to your MSP account.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Client Organisation</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Trust Centre</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Expiring Docs</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Pending Requests</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((client: any) => {
                // Determine expiring docs (<= 90 days or expired)
                const today = new Date().getTime()
                const threshold = 90 * 24 * 60 * 60 * 1000
                const expiringCount = client.documents?.filter((doc: any) => {
                  if (!doc.expiry_date) return false
                  const expTime = new Date(doc.expiry_date).getTime()
                  return (expTime - today) <= threshold
                }).length || 0

                const pendingCount = client.access_requests?.filter((req: any) => req.status === 'pending').length || 0

                return (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{client.name}</div>
                      <div className="text-sm text-slate-500">{client.industry || 'No industry set'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${client.trust_centre_live ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        <span className="text-sm font-medium text-slate-700">{client.trust_centre_live ? 'Live' : 'Draft'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {expiringCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-red-50 text-red-700 border border-red-100">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {expiringCount}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {pendingCount > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-amber-50 text-amber-700 border border-amber-100">
                          {pendingCount} new
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-[#1A3D2E] hover:underline">
                         Manage <ExternalLink className="w-4 h-4" />
                       </Link>
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
