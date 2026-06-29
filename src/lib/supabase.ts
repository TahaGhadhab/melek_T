import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder-anon-key'

/** Stub qui imite le client Supabase sans faire d'appels réseau */
function createStub(): SupabaseClient {
  const stubResponse = { data: null, error: null }
  const stubQuery: any = () => ({
    select: () => stubQuery(),
    insert: () => stubQuery(),
    update: () => stubQuery(),
    upsert: () => stubQuery(),
    delete: () => stubQuery(),
    eq: () => stubQuery(),
    neq: () => stubQuery(),
    in: () => stubQuery(),
    gt: () => stubQuery(),
    gte: () => stubQuery(),
    lt: () => stubQuery(),
    lte: () => stubQuery(),
    like: () => stubQuery(),
    ilike: () => stubQuery(),
    is: () => stubQuery(),
    order: () => stubQuery(),
    limit: () => stubQuery(),
    range: () => stubQuery(),
    single: () => Promise.resolve(stubResponse),
    maybeSingle: () => Promise.resolve(stubResponse),
    textSearch: () => stubQuery(),
    or: () => stubQuery(),
    not: () => stubQuery(),
    filter: () => stubQuery(),
    contains: () => stubQuery(),
    containedBy: () => stubQuery(),
    overlaps: () => stubQuery(),
    match: () => stubQuery(),
    csv: () => Promise.resolve(stubResponse),
    then: (onfulfilled: any) => Promise.resolve(stubResponse).then(onfulfilled),
    abortedSignal: null,
    abortSignal: null,
  })

  return {
    from: () => stubQuery(),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
    removeChannel: () => {},
    removeAllChannels: () => {},
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    } as any,
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: '' }, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        createSignedUrl: () => Promise.resolve({ data: { signedUrl: '' }, error: null }),
        list: () => Promise.resolve({ data: [], error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
      }),
    } as any,
    rpc: () => Promise.resolve({ data: null, error: null }),
  } as unknown as SupabaseClient
}

let supabase: SupabaseClient

if (isConfigured) {
  supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
} else {
  supabase = createStub()
  console.info(
    '%c[OpsHub] ℹ️ Supabase non configuré. ' +
      'Les données seront en mode démo (vides). ' +
      'Configure VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env pour activer la persistence.',
    'color: #888780; font-size: 11px;'
  )
}

export { supabase }
