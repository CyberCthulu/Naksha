import supabase from './supabase'

export type JournalRow = {
    id: number
    user_id: string
    chart_id: number | null
    prompt_template: string | null
    content: string
    created_at: string
    updated_at: string | null
}

export async function listJournals() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('journals')
    .select('id, chart_id, prompt_template, content, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as JournalRow[]
}