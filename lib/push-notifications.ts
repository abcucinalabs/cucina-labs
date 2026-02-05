import webpush from "web-push"
import {
  upsertPushSubscriptionRecord,
  deletePushSubscriptionByEndpoint,
  findAllPushSubscriptions,
} from "@/lib/dal"

type PushPayload = {
  title: string
  body: string
  url?: string
}

const getVapidDetails = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY || ""
  const privateKey = process.env.VAPID_PRIVATE_KEY || ""
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@cucinalabs.com"

  if (!publicKey || !privateKey) {
    return null
  }

  return { publicKey, privateKey, subject }
}

export const getPublicVapidKey = () => {
  const details = getVapidDetails()
  return details?.publicKey || null
}

const configureWebPush = () => {
  const details = getVapidDetails()
  if (!details) return null
  webpush.setVapidDetails(details.subject, details.publicKey, details.privateKey)
  return details
}

export const upsertPushSubscription = async (subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
  userAgent?: string | null
}) => {
  await upsertPushSubscriptionRecord({
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    userAgent: subscription.userAgent || null,
  })
}

export const deletePushSubscription = async (endpoint: string) => {
  await deletePushSubscriptionByEndpoint(endpoint)
}

export const sendPushNotificationToAll = async (payload: PushPayload) => {
  const details = configureWebPush()
  if (!details) {
    return { sent: 0, skipped: 0, error: "VAPID keys not configured" }
  }

  const subscriptions = await findAllPushSubscriptions()
  if (!subscriptions.length) {
    return { sent: 0, skipped: 0 }
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/admin/dashboard",
  })

  let sent = 0
  let skipped = 0

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body
        )
        sent += 1
      } catch (error: any) {
        skipped += 1
        const statusCode = error?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          await deletePushSubscriptionByEndpoint(sub.endpoint)
        }
      }
    })
  )

  return { sent, skipped }
}
