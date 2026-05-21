import type { UserProfile } from '~/types'

export const useSupabase = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()

  const getProfile = async (userId?: string): Promise<UserProfile | null> => {
    const id = userId || user.value?.id
    if (!id) return null
    const { data } = await client.from('profiles').select('id, email, username').eq('id', id).single()
    return data
  }

  const getEmailByUsername = async (username: string): Promise<string | null> => {
    const { data } = await client.rpc('get_email_by_username', {
      p_username: username,
    } as never)
    return data as string | null
  }

  return {
    client,
    user,
    getProfile,
    getEmailByUsername,
  }
}
