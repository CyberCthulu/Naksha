const AUTH_CALLBACK_PATH = 'auth/callback'
const AUTH_CALLBACK_ROUTE_URL = 'naksha://auth/callback'

let pendingAuthCallbackUrl: string | null = null

function normalizePath(path: string) {
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '')
  const expoRouteIndex = trimmed.indexOf('--/')

  return expoRouteIndex >= 0
    ? trimmed.slice(expoRouteIndex + 3).replace(/^\/+/, '').replace(/\/+$/, '')
    : trimmed
}

function getRoutePath(url: string) {
  const urlWithoutQueryOrFragment = url.split(/[?#]/)[0]

  try {
    const parsed = new URL(urlWithoutQueryOrFragment)
    const hostPath =
      parsed.protocol === 'naksha:'
        ? `${parsed.hostname}${parsed.pathname}`
        : parsed.pathname

    return normalizePath(hostPath)
  } catch {
    return normalizePath(urlWithoutQueryOrFragment)
  }
}

export function isAuthCallbackUrl(url?: string | null) {
  if (!url) return false

  return getRoutePath(url) === AUTH_CALLBACK_PATH
}

export function storePendingAuthCallbackUrl(url?: string | null) {
  if (typeof url === 'string' && isAuthCallbackUrl(url)) {
    pendingAuthCallbackUrl = url
  }
}

export function consumePendingAuthCallbackUrl() {
  const url = pendingAuthCallbackUrl
  pendingAuthCallbackUrl = null
  return url
}

export function normalizeAuthCallbackUrlForRouting(url?: string | null) {
  if (!url || !isAuthCallbackUrl(url)) {
    return url ?? null
  }

  storePendingAuthCallbackUrl(url)
  return AUTH_CALLBACK_ROUTE_URL
}
