export type UserProfileFields = {
  first_name: string | null
  last_name: string | null
  birth_date: string | null
  birth_time: string | null
  birth_location: string | null
  time_zone: string | null
  birth_lat: number | null
  birth_lon: number | null
}

export type UserRow = {
  id: string
  email: string | null
} & UserProfileFields

export type SubscriptionRow = {
  id: number
  user_id: string
  plan: string
  status: string
  start_date: string
  end_date: string | null
  created_at: string | null
}

export type PurchaseRow = {
  id: number
  user_id: string
  product_type: string
  product_id: string
  amount: number
  currency: string
  purchase_date: string
}

export type ChartProfile = Pick<
  UserProfileFields,
  'birth_date' | 'birth_time' | 'time_zone'
> &
  Partial<
    Pick<
      UserProfileFields,
      'birth_lat' | 'birth_lon' | 'birth_location' | 'first_name' | 'last_name'
    >
  >

export type ChartMode = 'self' | 'guest'

export type ChartRouteParams<TSavedChart = unknown> = {
  profile: ChartProfile
  chartMode?: ChartMode
  fromSaved?: boolean
  saved?: TSavedChart
}
