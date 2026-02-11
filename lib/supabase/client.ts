import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined

let supabaseClient: SupabaseClient | null = null

export const getSupabase = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Missing Supabase env. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
    )
  }

  if (!supabaseClient) {
    supabaseClient = createClient(
      supabaseUrl || 'https://example.supabase.co',
      supabaseAnonKey || 'example',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storage: AsyncStorage as any,
        },
      }
    )
  }

  return supabaseClient
}

export const supabase = getSupabase()
