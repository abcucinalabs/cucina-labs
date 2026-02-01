import { createClient } from "@supabase/supabase-js"
import { decrypt } from "../lib/encryption"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type ResendAudience = {
  id: string
  name?: string
}

async function fetchResendAudiences(apiKey: string) {
  const response = await fetch("https://api.resend.com/audiences", {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch audiences from Resend: ${errorText}`)
  }

  const data = await response.json()
  return (data?.data || []) as ResendAudience[]
}

async function main() {
  const audienceIdArgIndex = process.argv.indexOf("--audience-id")
  const audienceNameArgIndex = process.argv.indexOf("--audience-name")
  const audienceIdArg =
    audienceIdArgIndex >= 0 ? process.argv[audienceIdArgIndex + 1] : undefined
  const audienceNameArg =
    audienceNameArgIndex >= 0 ? process.argv[audienceNameArgIndex + 1] : undefined

  const { data: resendConfig } = await supabaseAdmin
    .from("api_keys")
    .select("key")
    .eq("service", "resend")
    .single()

  if (!resendConfig?.key) {
    throw new Error("Resend API key not configured")
  }

  const apiKey = decrypt(resendConfig.key)
  const audiences = await fetchResendAudiences(apiKey)
  let allContactsAudience: ResendAudience | undefined

  if (audienceIdArg) {
    allContactsAudience = audiences.find((audience) => audience.id === audienceIdArg)
    if (!allContactsAudience) {
      allContactsAudience = { id: audienceIdArg, name: audienceNameArg || "All Contacts" }
    }
  } else {
    const desiredName = (audienceNameArg || "All Contacts").toLowerCase()
    allContactsAudience = audiences.find(
      (audience) => audience.name?.toLowerCase() === desiredName
    )
  }

  if (!allContactsAudience) {
    console.error("Resend audience not found. Available audiences:")
    audiences.forEach((audience) => {
      console.error(`- ${audience.id}: ${audience.name || "(unnamed)"}`)
    })
    throw new Error("Resend 'All Contacts' audience not found")
  }

  const { data, error } = await supabaseAdmin
    .from("sequences")
    .update({ audience_id: allContactsAudience.id })
    .in("audience_id", ["resend_all", "local_all"])
    .select("id")

  if (error) throw error

  console.log(
    `Updated ${data?.length || 0} sequence(s) to audience ${allContactsAudience.id} (${allContactsAudience.name})`
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
