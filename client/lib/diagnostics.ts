export type SafeErrorDiagnostic = {
  code?: string
  message: string
}

/** Keep release-visible diagnostics useful without forwarding response details
 * or application payloads that may contain private user data. */
export function safeErrorDiagnostic(error: unknown): SafeErrorDiagnostic {
  if (!error || typeof error !== 'object') {
    return { message: 'Unknown error' }
  }

  const candidate = error as { code?: unknown; message?: unknown }
  const message =
    typeof candidate.message === 'string' && candidate.message.trim()
      ? candidate.message
      : 'Unknown error'
  const code =
    typeof candidate.code === 'string' && /^[A-Za-z0-9_-]{1,32}$/.test(candidate.code)
      ? candidate.code
      : undefined

  return code ? { code, message } : { message }
}
