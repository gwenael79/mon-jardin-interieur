import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  "https://islnwrgghdjozbhvugan.supabase.co",
  "sb_publishable_JIcs9BSYEl7Mf6y9-tDEAw_0wsf-vyQ"
)

export default supabase