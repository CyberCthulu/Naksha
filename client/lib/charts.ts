import supabase from './supabase'
import { computeNatalPlanets, findAspects } from './astro'
import { birthToUTC } from './time'
import { normalizeZone } from './timezones'

export type ChartRow = {
    id: number
    user_id: string
    name: string
    chart_data: any
    created_at: string | null
    updated_at: string | null
}