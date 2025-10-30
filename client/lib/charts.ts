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

export type BuildChartInput = {
    name: string
    birth_date: string
    birth_time: string
    time_zone: string
}