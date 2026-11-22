process.env.EXPO_PUBLIC_OPENCAGE_KEY = 'test-opencage-key'

const { geocodePlace } = require('../geocode') as typeof import('../geocode')

function abortablePendingFetch(_url: unknown, init?: RequestInit) {
  return new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => {
      const error = new Error('aborted')
      error.name = 'AbortError'
      reject(error)
    })
  })
}

describe('geocodePlace request reliability', () => {
  beforeEach(() => {
    jest.useRealTimers()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  it('preserves valid OpenCage result and timezone parsing', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        results: [
          {
            formatted: 'Redwood City, California, USA',
            geometry: { lat: 37.4852, lng: -122.2364 },
            annotations: { timezone: { name: 'America/Los_Angeles' } },
          },
          { formatted: '', geometry: { lat: 'bad', lng: null } },
        ],
      }),
    })

    await expect(geocodePlace('Redwood City')).resolves.toEqual([
      {
        name: 'Redwood City, California, USA',
        lat: 37.4852,
        lon: -122.2364,
        timeZone: 'America/Los_Angeles',
      },
    ])
  })

  it('aborts a hung request at the timeout and reports a retryable error', async () => {
    jest.useFakeTimers()
    ;(global.fetch as jest.Mock).mockImplementation(abortablePendingFetch)

    const result = expect(
      geocodePlace('Slow place', { timeoutMs: 50 })
    ).rejects.toThrow('Location search timed out. Please try again.')

    await jest.advanceTimersByTimeAsync(50)
    await result
    expect((global.fetch as jest.Mock).mock.calls[0][1].signal.aborted).toBe(true)
  })

  it('propagates caller cancellation without turning it into a network error', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(abortablePendingFetch)
    const controller = new AbortController()
    const request = geocodePlace('Cancelled place', {
      signal: controller.signal,
    })

    controller.abort()

    await expect(request).rejects.toMatchObject({
      name: 'AbortError',
      message: 'Location search cancelled.',
    })
  })

  it('normalizes temporary network failure into a clean retry message', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new TypeError('socket details'))

    await expect(geocodePlace('Offline place')).rejects.toThrow(
      'Could not reach location search. Please try again.'
    )
  })
})
