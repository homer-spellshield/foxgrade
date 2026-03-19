'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { CheckCircle, Save } from 'lucide-react'

export default function AssessClient({ framework, initialAnswers, orgId }: any) {
  const [answers, setAnswers] = useState<any>(initialAnswers)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState(0)
  const supabase = createClient()

  const handleSave = async (key: string, value: any, section: string, overlaps: any[]) => {
    setSaving(true)
    const newAnswers = { ...answers, [key]: value }
    setAnswers(newAnswers)

    // Automatically maps overlap into JSON blob to fulfill control mapping requirements natively in Postgres Triggers.
    await supabase.from('security_profiles').upsert({
      org_id: orgId,
      section: section,
      question_key: key,
      answer: value,
      framework_controls: overlaps
    }, { onConflict: 'org_id,question_key' })
    
    setSaving(false)
  }

  const section = framework.sections[activeSection]
  const isComplete = (section: any) => section.controls.every((c: any) => c.questions.every((q: any) => answers[q.key] !== undefined))

  return (
    <div className="max-w-5xl mx-auto flex gap-8">
      {/* Sidebar navigation */}
      <aside className="w-64 shrink-0">
        <h2 className="text-lg font-bold text-slate-800 mb-4">{framework.name}</h2>
        <nav className="space-y-1">
          {framework.sections.map((sec: any, idx: number) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(idx)}
              className={`w-full flex items-center justify-between text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === idx ? 'bg-[#1A3D2E] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="truncate pr-2">{sec.name}</span>
              {isComplete(sec) && <CheckCircle className={`w-4 h-4 shrink-0 ${activeSection === idx ? 'text-emerald-300' : 'text-emerald-500'}`} />}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Questionnaire Editor */}
      <main className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800">{section.name}</h1>
          <div className="text-sm text-slate-500 font-medium flex items-center gap-2">
            {saving ? <span className="animate-pulse">Saving...</span> : <><CheckCircle className="w-4 h-4 text-emerald-500" /> Saved</>}
          </div>
        </div>

        <div className="space-y-12">
          {section.controls.map((control: any) => (
            <div key={control.id} className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 pb-2 border-b border-slate-100">{control.title}</h3>
              
              {control.questions.map((q: any) => (
                <div key={q.key} className="bg-slate-50/50 p-6 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-base font-medium text-slate-900 block mb-4">
                        {q.text}
                      </label>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => handleSave(q.key, true, section.id, q.overlaps)}
                          className={`px-6 py-2 rounded-md font-medium text-sm transition-colors border ${
                            answers[q.key] === true ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          Yes
                        </button>
                        <button 
                          onClick={() => handleSave(q.key, false, section.id, q.overlaps)}
                          className={`px-6 py-2 rounded-md font-medium text-sm transition-colors border ${
                            answers[q.key] === false ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                    {q.overlaps && q.overlaps.length > 0 && (
                      <div className="shrink-0 max-w-xs text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-2 rounded border border-indigo-100">
                        <span className="block opacity-70 mb-1">Satisfies:</span>
                        {q.overlaps.map((o:any, i:number) => (
                          <div key={i}>{o.framework}: {o.control}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
