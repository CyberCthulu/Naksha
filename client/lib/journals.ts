import supabase from './supabase'

export type JournalRow = {
  id: number
  user_id: string
  chart_id: number | null
  prompt_template: string | null
  title: string | null
  content: string
  created_at: string
  updated_at: string | null
}

export type InsertJournalInput = {
  title?: string | null
  content: string
  chart_id?: number | null
  prompt_template?: string | null
}

export type UpdateJournalPatch = {
  title?: string | null
  content?: string
  chart_id?: number | null
  prompt_template?: string | null
}

const JOURNAL_SELECT =
  'id,user_id,chart_id,prompt_template,title,content,created_at,updated_at'

export class JournalUnavailableError extends Error {
  constructor() {
    super('This journal entry is unavailable or you do not have access to it.')
    this.name = 'JournalUnavailableError'
  }
}

async function requireUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  return user.id
}

function requireJournalId(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new JournalUnavailableError()
  }
}

export async function listJournals() {
  const userId = await requireUserId()

  const { data, error } = await supabase
    .from('journals')
    .select(JOURNAL_SELECT)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as JournalRow[]
}

export async function getOwnedJournal(id: number): Promise<JournalRow | null> {
  requireJournalId(id)
  const userId = await requireUserId()

  const { data, error } = await supabase
    .from('journals')
    .select(JOURNAL_SELECT)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data as JournalRow | null
}

export async function insertJournal(
  input: InsertJournalInput
): Promise<JournalRow> {
  const userId = await requireUserId()

  const { data, error } = await supabase
    .from('journals')
    .insert({
      user_id: userId,
      chart_id: input.chart_id ?? null,
      prompt_template: input.prompt_template ?? null,
      title: input.title ?? null,
      content: input.content,
    })
    .select(JOURNAL_SELECT)
    .single()

  if (error) throw error
  return data as JournalRow
}

export async function updateJournal(
  id: number,
  patch: UpdateJournalPatch
): Promise<JournalRow> {
  requireJournalId(id)
  const userId = await requireUserId()
  const payload: UpdateJournalPatch = {}

  if (patch.title !== undefined) payload.title = patch.title
  if (patch.content !== undefined) payload.content = patch.content
  if (patch.chart_id !== undefined) payload.chart_id = patch.chart_id
  if (patch.prompt_template !== undefined) {
    payload.prompt_template = patch.prompt_template
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('No journal changes were provided.')
  }

  const { data, error } = await supabase
    .from('journals')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select(JOURNAL_SELECT)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new JournalUnavailableError()
  return data as JournalRow
}

export async function deleteJournal(id: number) {
  requireJournalId(id)
  const userId = await requireUserId()

  const { error } = await supabase
    .from('journals')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}
