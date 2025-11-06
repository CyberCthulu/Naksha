import supabase from './supabase'

export type JournalRow = {
    id: number
    user_id: string
    chart_id: number | null
    prompt_template: string | null
    title: string | null            // ← NEW
    content: string
    created_at: string
    updated_at: string | null
}

export async function listJournals() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('journals')
    .select('id, chart_id, prompt_template, title, content, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as JournalRow[]
}

export async function upsertJournal(input: {
  id?: number
  title?: string | null 
  content: string
  chart_id?: number | null
  prompt_template?: string | null
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const payload = {
    id: input.id,
    user_id: user.id,
    chart_id: input.chart_id ?? null,
    prompt_template: input.prompt_template ?? null,
    title: input.title ?? null,
    content: input.content,
  }

  if (input.id != null) payload.id = input.id

    const { data, error } = await supabase
    .from('journals')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) throw error
  return data as JournalRow
}

export async function deleteJournal(id: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { error } = await supabase
    .from('journals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
}