
'use client'

// 1. Import the 'supabase' instance directly
import { supabase } from '@/services/supabaseClient' // Adjust path if needed
import { useEffect, useState } from 'react'

export function useUser() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 2. No need to create a new client, just use the imported one
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, isLoading }
}