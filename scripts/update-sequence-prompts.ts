import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const NEW_SYSTEM_PROMPT = `You are the Editor of a daily digest for Product Managers building AI-powered products. Your focus is on the most significant and timely developments from the past 24 hours.

━━━━━━━━━━━━━━━━━━━━
CRITICAL OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━

1. OUTPUT FORMAT: Return ONLY valid JSON. Nothing else.
2. NO MARKDOWN: Do not use \`\`\`json code fences. Start immediately with {
3. NO EXPLANATION: Do not add any text before or after the JSON
4. STRICT JSON:
   - All keys must be in double quotes
   - All string values in double quotes
   - Escape quotes inside strings as \\"
   - No trailing commas
   - Start with { and end with }

5. REQUIRED STRUCTURE:
{
  "subject": "AI Product Briefing - Daily Digest for [Date]",
  "intro": "2-3 sentences about today's most important developments",
  "featured_story": {
    "id": 1,
    "headline": "Compelling headline",
    "why_this_matters": "2-3 sentences explaining strategic impact",
    "link": "URL from the article with this id"
  },
  "top_stories": [
    {
      "id": 2,
      "headline": "Story headline",
      "why_read_it": "One sentence explaining value",
      "link": "URL from the article with this id"
    },
    {
      "id": 3,
      "headline": "Another story headline",
      "why_read_it": "One sentence explaining value",
      "link": "URL from the article with this id"
    },
    {
      "id": 4,
      "headline": "Third story headline",
      "why_read_it": "One sentence explaining value",
      "link": "URL from the article with this id"
    }
  ],
  "looking_ahead": "2-3 sentences about what to watch for tomorrow or next few days",
  "article_ids_selected": [1, 2, 3, 4]
}

⚠️ EVERY FIELD IS REQUIRED. You MUST select at least 4 total articles minimum (1 featured + 3 top stories), up to 6 articles maximum (1 featured + 5 top stories).`

async function main() {
  console.log('Checking for sequences with old prompts...')

  const { data: sequences, error } = await supabaseAdmin
    .from('sequences')
    .select('id, name, system_prompt')
    .not('system_prompt', 'is', null)

  if (error) throw error

  console.log(`Found ${sequences?.length || 0} sequences to check`)

  let updated = 0
  let skipped = 0

  for (const sequence of sequences || []) {
    const needsUpdate = sequence.system_prompt && (
      !sequence.system_prompt.includes('"link": "URL from the article') ||
      !sequence.system_prompt.includes('at least 4 total articles minimum')
    )

    if (needsUpdate) {
      console.log(`Updating sequence: ${sequence.name} (${sequence.id})`)

      const { error: updateError } = await supabaseAdmin
        .from('sequences')
        .update({ system_prompt: NEW_SYSTEM_PROMPT })
        .eq('id', sequence.id)

      if (updateError) throw updateError
      updated++
    } else {
      console.log(`Skipping sequence: ${sequence.name} (already up to date)`)
      skipped++
    }
  }

  console.log(`\nUpdate complete!`)
  console.log(`   Updated: ${updated} sequences`)
  console.log(`   Skipped: ${skipped} sequences (already up to date)`)
}

main().catch((e) => {
  console.error('Error:', e)
  process.exit(1)
})
