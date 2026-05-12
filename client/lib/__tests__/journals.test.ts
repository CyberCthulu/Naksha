import supabase from '../supabase'
import { upsertJournal } from '../journals'

jest.mock('../supabase', () => ({
  __esModule: true,
  default: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}))

function mockSupabaseUser(userId = 'user-1') {
  const getUser = supabase.auth.getUser as unknown as jest.Mock
  getUser.mockResolvedValue({
    data: {
      user: { id: userId },
    },
  })
}

function mockJournalUpsert() {
  const single = jest.fn().mockResolvedValue({
    data: {
      id: 1,
      user_id: 'user-1',
      chart_id: null,
      prompt_template: null,
      title: null,
      content: 'Body',
      created_at: '2026-05-11T00:00:00.000Z',
      updated_at: null,
    },
    error: null,
  })
  const select = jest.fn(() => ({ single }))
  const upsert = jest.fn(() => ({ select }))
  const from = supabase.from as unknown as jest.Mock

  from.mockReturnValue({ upsert })

  return { upsert, select, single }
}

describe('upsertJournal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseUser()
  })

  it('omits id from create-mode payload when input id is missing', async () => {
    const query = mockJournalUpsert()

    await upsertJournal({
      title: 'New entry',
      content: 'Body',
      chart_id: 42,
      prompt_template: 'transit-reflection',
    })

    const [payload, options] = query.upsert.mock.calls[0] as unknown[]

    expect(payload).toEqual({
      user_id: 'user-1',
      chart_id: 42,
      prompt_template: 'transit-reflection',
      title: 'New entry',
      content: 'Body',
    })
    expect(payload).not.toHaveProperty('id')
    expect(options).toEqual({ onConflict: 'id' })
  })

  it('defaults optional create-mode fields to null', async () => {
    const query = mockJournalUpsert()

    await upsertJournal({
      content: 'Body',
    })

    const [payload] = query.upsert.mock.calls[0] as unknown[]

    expect(payload).toEqual({
      user_id: 'user-1',
      chart_id: null,
      prompt_template: null,
      title: null,
      content: 'Body',
    })
  })

  it('preserves id in update-mode payload', async () => {
    const query = mockJournalUpsert()

    await upsertJournal({
      id: 99,
      title: 'Updated entry',
      content: 'Updated body',
      chart_id: null,
      prompt_template: null,
    })

    const [payload] = query.upsert.mock.calls[0] as unknown[]

    expect(payload).toEqual({
      id: 99,
      user_id: 'user-1',
      chart_id: null,
      prompt_template: null,
      title: 'Updated entry',
      content: 'Updated body',
    })
  })
})
