import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const BUFFER_API_KEY = 'usJH2xDHzqSq8j_v1tdtOWlUk_T20GS_zABRxiym0IR'

const CHANNELS = [
  { id: '6a04801f090476fb9916237a', platform: 'instagram' },
  { id: '6a0597f0090476fb991b4097', platform: 'tiktok' },
  { id: '6a05d686090476fb991c74f5', platform: 'facebook' },
]

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildMutation(channelId: string, platform: string, text: string, imageUrl: string, dueAt: string): string {
  const assets = `[{ image: { url: ${JSON.stringify(imageUrl)} } }]`
  const metadataMap: Record<string, string> = {
    facebook:  ', metadata: { facebook:  { type: post } }',
    instagram: ', metadata: { instagram: { type: post, shouldShareToFeed: true } }',
  }
  const metadata = metadataMap[platform] ?? ''
  return `mutation { createPost(input: { channelId: ${JSON.stringify(channelId)}, text: ${JSON.stringify(text)}${metadata}, schedulingType: automatic, mode: customScheduled, dueAt: ${JSON.stringify(dueAt)}, assets: ${assets} }) { ... on PostActionSuccess { post { id status } } ... on InvalidInputError { message } ... on UnexpectedError { message } } }`
}

async function postToBuffer(query: string): Promise<unknown> {
  const res = await fetch('https://api.buffer.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BUFFER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  console.log('Buffer response:', res.status, text)
  return JSON.parse(text)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { photoUrl, caption } = await req.json()
    if (!photoUrl || !caption) {
      return new Response(JSON.stringify({ error: 'photoUrl and caption required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const dueAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const results = await Promise.all(
      CHANNELS.map(ch => postToBuffer(buildMutation(ch.id, ch.platform, caption, photoUrl, dueAt)))
    )

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    console.error('Edge error:', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
