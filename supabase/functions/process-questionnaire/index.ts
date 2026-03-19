import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY') || ''

serve(async (req) => {
  // CORS configuration
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const { uploadId } = await req.json()
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch Questionnaire record
    const { data: upload } = await supabase.from('questionnaire_uploads').select('*').eq('id', uploadId).single()
    if (!upload) throw new Error("Upload not found")

    await supabase.from('questionnaire_uploads').update({ status: 'processing' }).eq('id', uploadId)
    
    // In MVP, we spoof text extraction for PDFs. Assume we extract questions into an array natively.
    const questions = ["Are robust physical entry controls implemented?", "Is MFA enforced?"]
    
    // Instantiate Claude
    const anthropic = new Anthropic({ apiKey: anthropicKey })

    for (const q of questions) {
      // 1. Full-Text Search on Knowledge Base
      // Note: plainto_tsquery allows matching generic phrases
      const { data: contextRecords } = await supabase
        .from('knowledge_base_entries')
        .select('content')
        .eq('org_id', upload.org_id)
        .textSearch('search_vector', q, { type: 'websearch' })
        .limit(5)

      const contextString = contextRecords?.map((r: any) => r.content).join('\n') || ''

      const prompt = `
      Answer ONLY from the provided context. If the context doesn't contain enough information, respond exactly with 'NEEDS_REVIEW' and briefly explain what's missing. Never fabricate information.
      
      Context:
      ${contextString}

      Question: ${q}
      `

      const message = await anthropic.messages.create({
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
        model: 'claude-3-haiku-20240307',
      })

      const answerText = message.content[0].type === 'text' ? message.content[0].text : 'NEEDS_REVIEW'
      let conf = 'high'
      let stat = 'draft'

      if (answerText.includes('NEEDS_REVIEW')) {
        conf = 'needs_review'
        stat = 'flagged'
      } else if (!contextString) {
        conf = 'low'
      }

      await supabase.from('questionnaire_responses').insert({
        questionnaire_id: uploadId,
        question_text: q,
        draft_answer: answerText,
        confidence: conf,
        status: stat,
        source_citations: contextRecords || []
      })
    }

    await supabase.from('questionnaire_uploads').update({ status: 'in_review' }).eq('id', uploadId)

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})
