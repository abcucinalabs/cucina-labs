import { prisma } from "../lib/db"
import { decrypt } from "../lib/encryption"

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

  const resendConfig = await prisma.apiKey.findUnique({
    where: { service: "resend" },
  })

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

  const result = await prisma.sequence.updateMany({
    where: {
      audienceId: {
        in: ["resend_all", "local_all"],
      },
    },
    data: {
      audienceId: allContactsAudience.id,
    },
  })

  console.log(
    `Updated ${result.count} sequence(s) to audience ${allContactsAudience.id} (${allContactsAudience.name})`
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
