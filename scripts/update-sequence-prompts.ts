import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
  console.log('🔍 Checking for sequences with old prompts...')

  const sequences = await prisma.sequence.findMany({
    where: {
      systemPrompt: {
        not: null
      }
    }
  })

  console.log(`Found ${sequences.length} sequences to check`)

  let updated = 0
  let skipped = 0

  for (const sequence of sequences) {
    // Check if prompt needs updating (missing link field OR outdated article count requirement)
    const needsUpdate = sequence.systemPrompt && (
      !sequence.systemPrompt.includes('"link": "URL from the article') ||
      !sequence.systemPrompt.includes('at least 4 total articles minimum')
    )

    if (needsUpdate) {
      console.log(`Updating sequence: ${sequence.name} (${sequence.id})`)

      await prisma.sequence.update({
        where: { id: sequence.id },
        data: {
          systemPrompt: NEW_SYSTEM_PROMPT
        }
      })

      updated++
    } else {
      console.log(`Skipping sequence: ${sequence.name} (already up to date)`)
      skipped++
    }
  }

  console.log(`\n✅ Update complete!`)
  console.log(`   Updated: ${updated} sequences`)
  console.log(`   Skipped: ${skipped} sequences (already up to date)`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
