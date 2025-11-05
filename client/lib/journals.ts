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