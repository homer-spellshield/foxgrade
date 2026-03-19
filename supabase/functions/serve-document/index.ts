import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const { documentId, email } = await req.json()
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Validate Doc presence
    const { data: document } = await supabase.from('documents').select('*').eq('id', documentId).single()
    if (!document) return new Response('Not Found', { status: 404 })

    let hasAccess = false

    if (document.access_level === 'public') {
      hasAccess = true
    } else if (document.access_level === 'registered') {
      const { data: viewer } = await supabase.from('registered_viewers').select('id').eq('email', email).eq('org_id', document.org_id).single()
      if (viewer) hasAccess = true
    } else if (document.access_level === 'nda_required') {
      const { data: nda } = await supabase.from('nda_signatures').select('id').eq('signer_email', email).eq('org_id', document.org_id).single()
      if (nda) hasAccess = true
    } else if (document.access_level === 'request_access') {
      const { data: request } = await supabase.from('access_requests').select('status').eq('requester_email', email).eq('document_id', documentId).single()
      if (request && request.status === 'approved') hasAccess = true
    }

    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "403 Forbidden. Access request pending or denied." }), { status: 403 })
    }

    // Generate strict 1 hr signed URL
    const { data: signed } = await supabase.storage.from('private-documents').createSignedUrl(document.file_path, 3600)
    
    return new Response(JSON.stringify({ url: signed?.signedUrl }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})
