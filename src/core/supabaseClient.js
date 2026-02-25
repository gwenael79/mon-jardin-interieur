// src/core/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function query(promise, context = '') {
  const { data, error } = await promise
  if (error) {
    console.error(`[Supabase${context ? ` / ${context}` : ''}]`, error.message)
    throw new Error(error.message)
  }
  return data
}