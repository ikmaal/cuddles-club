import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return json({ error: 'Study agent is not configured yet (missing ANTHROPIC_API_KEY).' }, 503)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Please sign in to chat with Pip.' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) return json({ error: 'Please sign in to chat with Pip.' }, 401)

    const body = await req.json()
    const message = String(body.message ?? '').trim()
    const context = String(body.context ?? '').slice(0, 60_000)
    const names = body.names ?? { you: 'You', partner: 'Partner' }
    const history = Array.isArray(body.history) ? (body.history as ChatMessage[]).slice(-12) : []

    if (!message) return json({ error: 'Say something to Pip first.' }, 400)

    const system = `You are Pip, a tiny cute study sprout mascot in Cuddles Club — a cozy couple app for two university students (${names.you} and ${names.partner}).

Personality:
- Warm, playful, encouraging, never condescending
- Short paragraphs, clear steps, occasional gentle plant/sprout metaphors
- Use light emoji sparingly (🌱 ✨ 📚)
- If materials are missing, say what to upload and still help with study strategy
- Never invent lecture facts; if the provided materials don't cover it, say so
- Keep answers focused and useful for exam prep / assignments
- They often study different modules — respect whose materials are in context

Study materials context:
${context || '(No material text was attached. Help with general study coaching and ask which module to open.)'}`

    const messages = [
      ...history
        .filter((item) => item?.content && (item.role === 'user' || item.role === 'assistant'))
        .map((item) => ({ role: item.role, content: String(item.content).slice(0, 4000) })),
      { role: 'user' as const, content: message.slice(0, 4000) },
    ]

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1200,
        system,
        messages,
      }),
    })

    if (!aiRes.ok) {
      const detail = await aiRes.text()
      console.error('Anthropic error', aiRes.status, detail)
      return json({ error: 'Pip got tangled for a moment. Try again in a bit.' }, 502)
    }

    const aiJson = await aiRes.json()
    const reply = Array.isArray(aiJson.content)
      ? aiJson.content
          .filter((block: { type?: string; text?: string }) => block.type === 'text')
          .map((block: { text?: string }) => block.text ?? '')
          .join('\n')
          .trim()
      : ''

    if (!reply) return json({ error: 'Pip went quiet. Try another question.' }, 502)

    return json({ reply, mood: inferMood(message, reply) })
  } catch (error) {
    console.error(error)
    return json({ error: 'Pip tripped over a root. Please try again.' }, 500)
  }
})

function inferMood(message: string, reply: string) {
  const blob = `${message} ${reply}`.toLowerCase()
  if (/(quiz|question|test|exam)/.test(blob)) return 'quiz'
  if (/(great|nice|proud|awesome|well done|you got this)/.test(reply.toLowerCase())) return 'celebrate'
  if (/(don't know|missing|upload|no material)/.test(reply.toLowerCase())) return 'curious'
  return 'happy'
}

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
