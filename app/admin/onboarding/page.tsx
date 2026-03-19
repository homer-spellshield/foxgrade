import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingClient from './client'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Attempt to find existing org membership and progress
  let progressState = {}
  let orgData = null

  const { data: orgMember } = await supabase
    .from('org_members')
    .select('org_id, organisations(*)')
    .eq('user_id', user.id)
    .single()

  if (orgMember) {
    orgData = orgMember.organisations
    const { data: progress } = await supabase
      .from('onboarding_progress')
      .select('steps_completed')
      .eq('org_id', orgMember.org_id)
      .single()

    if (progress) {
      progressState = progress.steps_completed
    }
  }

  return <OnboardingClient initialProgress={progressState} initialOrg={orgData} />
}
