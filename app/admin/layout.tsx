import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { LogOut, Home, FileText, Settings, Shield, Users, Briefcase } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // We know user exists here due to proxy.ts middleware protection, but we check for type safety
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if they are part of an organization natively
  const { data: orgMember } = await supabase
    .from('org_members')
    .select('*, organisations:org_id(*)')
    .eq('user_id', user.id)
    .single()

  // Check if they are an MSP
  const { data: mspMember } = await supabase
    .from('msp_members')
    .select('*, msp_organisations:msp_id(*)')
    .eq('user_id', user.id)
    .single()

  const orgName = orgMember?.organisations?.name || mspMember?.msp_organisations?.name || 'Foxgrade Admin'

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1A3D2E] text-white flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 font-bold text-xl border-b border-emerald-800/50">
          {orgName}
        </div>
        
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3 mt-4">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-emerald-800/30 transition-colors">
            <Home className="w-4 h-4 text-emerald-300" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link href="/admin/assess" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-emerald-800/30 transition-colors">
            <Shield className="w-4 h-4 text-emerald-300" />
            <span className="text-sm font-medium">Assess</span>
          </Link>
          <Link href="/admin/respond" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-emerald-800/30 transition-colors">
            <Briefcase className="w-4 h-4 text-emerald-300" />
            <span className="text-sm font-medium">Respond</span>
          </Link>
          <Link href="/admin/documents" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-emerald-800/30 transition-colors">
            <FileText className="w-4 h-4 text-emerald-300" />
            <span className="text-sm font-medium">Documents</span>
          </Link>
          
          {mspMember && (
            <Link href="/admin/msp" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-emerald-800/30 transition-colors mt-4 bg-emerald-900/40 border border-emerald-800/50">
              <Users className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-medium">MSP Portal</span>
            </Link>
          )}

          <div className="mt-auto pt-4 border-t border-emerald-800/50">
            <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-emerald-800/30 transition-colors">
              <Settings className="w-4 h-4 text-emerald-300" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
            <form action="/auth/signout" method="POST">
              <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-red-500/20 text-red-200 transition-colors mt-1">
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign out</span>
              </button>
            </form>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <div className="font-medium text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Operational
          </div>
          <div className="text-sm text-slate-500">
            {user.email}
          </div>
        </header>
        <div className="p-8 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
