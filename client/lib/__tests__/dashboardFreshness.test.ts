import {
  DASHBOARD_GUIDANCE_REFRESH_MS,
  getDashboardGuidanceKeys,
  millisecondsUntilNextDashboardRefresh,
  millisecondsUntilNextLocalDay,
} from '../dashboardFreshness'

describe('dashboard guidance freshness', () => {
  it('uses the profile zone for local-day and Monday week boundaries', () => {
    const beforeMonday = new Date('2026-09-14T06:59:59.000Z')
    const afterMonday = new Date('2026-09-14T07:00:00.000Z')

    expect(
      getDashboardGuidanceKeys(beforeMonday, 'America/Los_Angeles')
    ).toEqual({
      localDate: '2026-09-13',
      weekStartDate: '2026-09-07',
    })
    expect(
      getDashboardGuidanceKeys(afterMonday, 'America/Los_Angeles')
    ).toEqual({
      localDate: '2026-09-14',
      weekStartDate: '2026-09-14',
    })
  })

  it.each([
    ['America/Los_Angeles', '2026-03-08T07:59:59.000Z'],
    ['Asia/Kolkata', '2026-09-14T18:29:59.000Z'],
    ['Pacific/Kiritimati', '2026-09-14T09:59:59.000Z'],
  ])('schedules the next local midnight in %s', (timeZone, instant) => {
    expect(
      millisecondsUntilNextLocalDay(new Date(instant), timeZone)
    ).toBe(1_000)
  })
  it('caps active-screen refreshes at one hour before midnight', () => {
    expect(
      millisecondsUntilNextDashboardRefresh(
        new Date('2026-09-12T12:00:00.000Z'),
        'America/Los_Angeles',
        new Date('2026-09-12T12:00:00.000Z').getTime()
      )
    ).toBe(DASHBOARD_GUIDANCE_REFRESH_MS)

    expect(
      millisecondsUntilNextDashboardRefresh(
        new Date('2026-09-14T06:59:59.000Z'),
        'America/Los_Angeles',
        new Date('2026-09-14T06:59:59.000Z').getTime()
      )
    ).toBe(1_000)

    expect(
      millisecondsUntilNextDashboardRefresh(
        new Date('2026-09-12T13:00:00.000Z'),
        'America/Los_Angeles',
        new Date('2026-09-12T12:00:00.000Z').getTime()
      )
    ).toBe(0)
  })
})
