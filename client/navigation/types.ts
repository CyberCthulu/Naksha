import type { ChartData } from '../lib/charts'
import type {
  ChartRouteParams,
  UserProfileFields,
} from '../lib/domainTypes'

export type CheckEmailParams = {
  email?: string
  profile?: UserProfileFields
}

export type AuthCallbackParams = {
  url?: string
}

export type JournalEditorParams = {
  id?: number
  title?: string
  content?: string
  initialTitle?: string
  initialContent?: string
  promptTemplateId?: string | null
  promptSource?: string
  promptText?: string
  practiceSummary?: string
  practiceSteps?: string[]
}

export type RootStackParamList = {
  Dashboard: undefined
  CompleteProfile: undefined
  CreateGuestChart: undefined
  Chart: ChartRouteParams<ChartData>
  MyCharts: undefined
  JournalList: undefined
  JournalEditor: JournalEditorParams | undefined
  Profile: undefined
  Login: undefined
  Signup: undefined
  ForgotPassword: undefined
  CheckEmail: CheckEmailParams | undefined
  ResetPassword: undefined
  AuthCallback: AuthCallbackParams | undefined
}
