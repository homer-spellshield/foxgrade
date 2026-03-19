import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { frameworks } from '@/lib/frameworks'
import AssessClient from './client'

export default async function AssessmentEnginePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const fwId = params.id
  const framework = frameworks.find(f => f.id === fwId)

  if (!framework) redirect('/admin/assess')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) redirect('/admin/onboarding')

  // Fetch existing answers bound to this org
  const { data: profiles } = await supabase
    .from('security_profiles')
    .select('*')
    .eq('org_id', orgMember.org_id)

  const initialAnswers = profiles?.reduce((acc: any, cur: any) => {
    acc[cur.question_key] = cur.answer
    return acc
  }, {}) || {}

  return (
    <AssessClient 
      framework={framework} 
      initialAnswers={initialAnswers} 
      orgId={orgMember.org_id} 
    />
  )
}
