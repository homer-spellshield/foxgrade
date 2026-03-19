'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    
    // Uses the root domain location to ensure callback succeeds regardless of subdomain.
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${baseUrl}/auth/confirm`,
      },
    })

    if (error) {
      setStatus('error')
    } else {
      setStatus('success')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] text-slate-900 px-4">
      <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-[#1A3D2E] text-center mb-6">Foxgrade Admin</h1>
        
        {status === 'success' ? (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-md text-sm text-center">
            Check your email for the secure magic link to sign in.
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Work Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2E] focus:border-transparent text-sm"
              />
            </div>
            
            {status === 'error' && (
              <div className="text-red-500 text-sm">Failed to send magic link. Please verify your email.</div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-[#1A3D2E] text-white py-2 px-4 rounded-md font-medium hover:bg-[#1A3D2E]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A3D2E] disabled:opacity-50 transition-colors"
            >
              {status === 'loading' ? 'Sending link...' : 'Send Magic Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
