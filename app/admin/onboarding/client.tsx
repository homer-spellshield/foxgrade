'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { CheckCircle2 } from 'lucide-react'

// Simple client wrapper for the 7 step wizard. 
// Uses Supabase client directly since it's an authenticated session.
export default function OnboardingClient({ initialProgress, initialOrg }: any) {
  const [loading, setLoading] = useState(false)
  const [steps, setSteps] = useState<any>(initialProgress || {})
  const [org, setOrg] = useState<any>(initialOrg || {})
  const supabase = createClient()

  const stepsList = ['profile', 'colors', 'frameworks', 'posture', 'evidence', 'preview', 'live']
  // Determine current step based on what's NOT done
  const firstIncomplete = stepsList.findIndex(s => !steps[s])
  const [currentStepIndex, setCurrentStepIndex] = useState(firstIncomplete === -1 ? 0 : firstIncomplete)

  const currentStep = stepsList[currentStepIndex]

  const updateProgress = async (completedStep: string) => {
    setLoading(true)
    const nextSteps = { ...steps, [completedStep]: true }
    setSteps(nextSteps)

    if (org?.id) {
       await supabase.from('onboarding_progress').upsert({
         org_id: org.id,
         steps_completed: nextSteps
       })
    }
    
    setLoading(false)
    if (currentStepIndex < stepsList.length - 1) {
      setCurrentStepIndex(i => i + 1)
    } else {
      window.location.href = '/admin' // done
    }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    if (!org.id) {
      // Create org and mapping
      const { data: newOrg, error } = await supabase.from('organisations').insert({
        name: org.name,
        industry: org.industry,
      }).select().single()

      if (newOrg) {
        setOrg(newOrg)
        
        // Map user to org
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('org_members').insert({ user_id: user.id, org_id: newOrg.id, role: 'Admin' })
          await supabase.from('onboarding_progress').insert({ org_id: newOrg.id, steps_completed: { profile: true } })
        }
      }
    } else {
      await supabase.from('organisations').update({ name: org.name, industry: org.industry }).eq('id', org.id)
    }
    
    await updateProgress('profile')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Setup Trust Centre</h1>
        <p className="text-slate-500 mt-2">Complete the wizard to formalise your posture.</p>
      </div>

      <div className="flex justify-between items-center mb-8 relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full"></div>
        {stepsList.map((stepName, idx) => (
          <div key={stepName} className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium border-2 
              ${steps[stepName] ? 'bg-emerald-500 border-emerald-500 text-white' : 
                idx === currentStepIndex ? 'bg-white border-[#1A3D2E] text-[#1A3D2E]' : 
                'bg-white border-slate-300 text-slate-400'}`}>
              {steps[stepName] ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        {currentStep === 'profile' && (
          <form onSubmit={handleProfileSave} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Company Profile</h2>
              <p className="text-sm text-slate-500 mb-6">Let's start with the basics.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organisation Name</label>
                  <input type="text" value={org.name || ''} onChange={e => setOrg({...org, name: e.target.value})} required className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#1A3D2E] outline-none" placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                  <input type="text" value={org.industry || ''} onChange={e => setOrg({...org, industry: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#1A3D2E] outline-none" placeholder="Cyber Security" />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button disabled={loading || !org.name} type="submit" className="px-6 py-2 bg-[#1A3D2E] text-white rounded-md hover:bg-[#1A3D2E]/90 font-medium transition-colors disabled:opacity-50">
                Next Step
              </button>
            </div>
          </form>
        )}

        {currentStep !== 'profile' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 capitalize">{currentStep} Settings</h2>
              <p className="text-sm text-slate-500 mb-6">Placeholder block for MVP layout mapping.</p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 flex items-center justify-center text-slate-400 border-dashed">
                [ {currentStep} UI component ]
              </div>
            </div>
            <div className="flex justify-between">
              <button 
                onClick={() => setCurrentStepIndex(i => Math.max(0, i - 1))} 
                className="px-6 py-2 bg-white text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 font-medium transition-colors">
                Back
              </button>
              <button 
                onClick={() => updateProgress(currentStep)} 
                disabled={loading}
                className="px-6 py-2 bg-[#1A3D2E] text-white rounded-md hover:bg-[#1A3D2E]/90 font-medium transition-colors disabled:opacity-50">
                {currentStep === 'live' ? 'Publish' : 'Next Step'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
