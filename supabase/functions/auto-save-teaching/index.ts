import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const CHANNEL_ID = 'UCvHvwe3wVCEibxBpFEs8oqw'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Resolve "today" in Africa/Nairobi (EAT, UTC+3) since church is in Kenya
    const nowEAT = new Date(Date.now() + 3 * 60 * 60 * 1000)
    const sessionDate = nowEAT.toISOString().slice(0, 10)

    // Fetch channel's public RSS feed (no API key needed)
    const feedRes = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
    )
    if (!feedRes.ok) throw new Error(`feed ${feedRes.status}`)
    const xml = await feedRes.text()

    const idMatch = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)
    const titleMatch = xml.match(/<entry>[\s\S]*?<title>([^<]+)<\/title>/)
    const latestId = idMatch?.[1]
    const latestTitle = titleMatch?.[1] ?? `Sunday Service — ${sessionDate}`
    if (!latestId) throw new Error('no video found in feed')

    // Find a system / admin owner for created_by
    let createdBy: string | null = null
    let body: any = null
    try { body = await req.json() } catch { body = null }
    if (body?.created_by) createdBy = body.created_by
    if (!createdBy) {
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(1)
      createdBy = admins?.[0]?.user_id ?? null
    }
    if (!createdBy) throw new Error('no admin user to attribute the saved teaching')

    // Look for an existing saved teaching for today
    const { data: existing } = await supabase
      .from('saved_teachings')
      .select('id, youtube_id')
      .eq('session_date', sessionDate)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      if (existing.youtube_id !== latestId) {
        await supabase
          .from('saved_teachings')
          .update({ youtube_id: latestId, title: latestTitle })
          .eq('id', existing.id)
      }
      return new Response(JSON.stringify({ ok: true, updated: existing.id, youtube_id: latestId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: inserted, error } = await supabase
      .from('saved_teachings')
      .insert({
        title: latestTitle,
        youtube_id: latestId,
        session_date: sessionDate,
        description: 'Automatically saved from KSF Thika Road YouTube channel 🙏',
        created_by: createdBy,
      })
      .select()
      .single()
    if (error) throw error

    return new Response(JSON.stringify({ ok: true, inserted: inserted.id, youtube_id: latestId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('auto-save-teaching error', err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})