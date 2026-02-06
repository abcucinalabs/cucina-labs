import { createClient, SupabaseClient } from "@supabase/supabase-js"

let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

// Next.js 14 caches fetch() responses by default on the server.
// The Supabase JS client uses fetch() internally for PostgREST queries,
// which causes stale data to be returned from cached GET requests.
// We override the fetch function to always bypass the Next.js cache.
const noStoreFetch = (url: RequestInfo | URL, init?: RequestInit) => {
  return fetch(url, { ...init, cache: "no-store" })
}

// Client-side client (respects RLS) — lazy init to avoid build-time errors
export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { fetch: noStoreFetch } }
    )
  }
  return _supabase
}

// Server-side admin client (bypasses RLS) — lazy init to avoid build-time errors
export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { global: { fetch: noStoreFetch } }
    )
  }
  return _supabaseAdmin
}

// Convenience aliases for backward compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop]
  },
})

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseAdmin() as any)[prop]
  },
})
